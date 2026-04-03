import { supabase } from "@/lib/supabase";
import { toast } from "react-toastify";
import {
  getSubcategoryExchangePrice,
  setSubcategoryExchangePrice,
  computeProductPricePerKg,
} from "./subcategoryExchangePriceService";
import { exchangeService } from "./exchangeService";

export interface CreateProductWithOpeningPriceInput {
  /** معرف الفئة الفرعية (waste_sub_categories.id) */
  wasteSubcategoryId: number;
  name: string;
  nameAr?: string;
  description?: string;
  /** السعر الافتتاحي للكيلو (ج/كجم) */
  openingPrice: number;
  imageUrl?: string;
  /** نسبة تعديل السعر عن سعر الفئة (افتراضي 0) */
  pricePremiumPercentage?: number;
  /** مبلغ إضافي بالجنيه (افتراضي 0) */
  pricePremiumFixedAmount?: number;
  /** per_kg أو per_piece */
  pricingMode?: "per_kg" | "per_piece";
  /** وزن الوحدة بالجرام (للمنتجات بالقطعة) */
  weightGrams?: number;
  userId?: string | null;
}

export interface CreateProductWithOpeningPriceResult {
  success: boolean;
  message: string;
  product?: { id: string; name: string };
  note?: string;
}

/**
 * إنشاء منتج جديد مع سعر افتتاحي وربطه ببورصة الفئة الفرعية
 * - إن لم يكن للفئة سعر في subcategory_exchange_price يُضاف السعر الافتتاحي
 * - يُدرج المنتج في waste_data_admin مع نسبة/مبلغ التعديل
 * - يُدرج في stock_exchange ويُسجّل في exchange_price_history إن وُجد الجدول
 */
export async function createProductWithOpeningPrice(
  input: CreateProductWithOpeningPriceInput
): Promise<CreateProductWithOpeningPriceResult> {
  if (!supabase) {
    toast.error("خدمة Supabase غير متاحة");
    return { success: false, message: "خدمة Supabase غير متاحة" };
  }

  const {
    wasteSubcategoryId,
    name,
    nameAr,
    description,
    openingPrice,
    imageUrl,
    pricePremiumPercentage = 0,
    pricePremiumFixedAmount = 0,
    pricingMode = "per_kg",
    weightGrams = 1000,
    userId,
  } = input;

  try {
    // 1. التأكد من وجود سعر للفئة الفرعية (استخدام السعر الافتتاحي إن لم يكن موجوداً)
    let subPrice = await getSubcategoryExchangePrice(wasteSubcategoryId);
    if (!subPrice) {
      const set = await setSubcategoryExchangePrice(
        wasteSubcategoryId,
        openingPrice,
        openingPrice * 1.2,
        userId ?? undefined
      );
      if (!set) {
        return {
          success: false,
          message: "فشل في تعيين سعر الفئة الفرعية",
        };
      }
      subPrice = set;
    }

    // 2. سعر الكيلو الفعلي للمنتج (سعر الفئة × (1 + نسبة) + مبلغ)
    const productPricePerKg =
      subPrice.buy_price * (1 + pricePremiumPercentage / 100) + pricePremiumFixedAmount;
    const weight = pricingMode === "per_piece" ? weightGrams : 1000;
    const unitPrice = (productPricePerKg * weight) / 1000;

    // 3. إدراج المنتج في waste_data_admin (مع دعم الأعمدة الجديدة إن وُجدت)
    const productData: Record<string, unknown> = {
      name: nameAr || name,
      description: description ?? null,
      image_url: imageUrl ?? null,
      weight,
      price: unitPrice,
      quantity: 0,
      points: 0,
      initial_points: 0,
      subcategory_id: wasteSubcategoryId,
      price_premium_percentage: pricePremiumPercentage,
      price_premium_fixed_amount: pricePremiumFixedAmount,
      display_order: 0,
      pricing_subcategory_id: wasteSubcategoryId,
    };

    // حقول قد تكون موجودة في الجدول
    const { data: inserted, error: insertError } = await supabase
      .from("waste_data_admin")
      .insert(productData as Record<string, never>)
      .select("id, name")
      .single();

    if (insertError) {
      // إن فشل بسبب أعمدة غير موجودة، نحاول بدون الأعمدة الجديدة
      const fallback: Record<string, unknown> = {
        name: nameAr || name,
        description: description ?? null,
        image_url: imageUrl ?? null,
        weight,
        price: unitPrice,
        quantity: 0,
        points: 0,
        initial_points: 0,
        subcategory_id: wasteSubcategoryId,
      };
      const { data: retry, error: retryError } = await supabase
        .from("waste_data_admin")
        .insert(fallback as Record<string, never>)
        .select("id, name")
        .single();
      if (retryError) {
        console.error("خطأ في إنشاء المنتج:", retryError);
        toast.error(retryError.message || "فشل في إنشاء المنتج");
        return {
          success: false,
          message: retryError.message || "فشل في إنشاء المنتج",
        };
      }
      toast.success(`تم إنشاء المنتج "${retry?.name}" بنجاح`);
      return {
        success: true,
        message: `تم إنشاء المنتج "${retry?.name}" بسعر ${openingPrice} ج/كجم`,
        product: retry ? { id: retry.id, name: retry.name } : undefined,
        note: "يمكن تحديث السعر لاحقاً من إدارة التسعير والبورصة.",
      };
    }

    // 4. إدراج سجل في stock_exchange إن وُجد (ربط المنتج بالبورصة)
    if (inserted?.id) {
      try {
        const { data: cat } = await supabase
          .from("waste_sub_categories")
          .select("main_category_id")
          .eq("id", wasteSubcategoryId)
          .single();
        const categoryId = (cat as { main_category_id?: number } | null)?.main_category_id;
        await exchangeService.updateExchangeProduct(
          0,
          {
            product_id: inserted.id,
            buy_price: productPricePerKg,
            base_price: productPricePerKg,
            sell_price: productPricePerKg * 1.2,
            category_id: categoryId ? String(categoryId) : undefined,
            subcategory_id: String(wasteSubcategoryId),
          },
          userId ?? undefined
        );
      } catch (e) {
        console.warn("تحذير: لم يتم إضافة المنتج للبورصة (stock_exchange):", e);
      }
    }

    toast.success(`تم إنشاء المنتج "${inserted?.name}" بنجاح`);
    return {
      success: true,
      message: `تم إنشاء المنتج "${inserted?.name}" بسعر افتتاحي ${openingPrice} ج/كجم`,
      product: inserted ? { id: inserted.id, name: inserted.name } : undefined,
      note: "يمكن تحديث السعر لاحقاً من إدارة التسعير والبورصة.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
    console.error("createProductWithOpeningPrice:", err);
    toast.error(msg);
    return { success: false, message: msg };
  }
}

export const wasteProductWorkflowService = {
  createProductWithOpeningPrice,
};
