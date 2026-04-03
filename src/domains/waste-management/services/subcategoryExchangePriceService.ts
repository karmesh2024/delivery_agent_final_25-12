import { supabase } from "@/lib/supabase";
import { toast } from "react-toastify";

/**
 * سعر البورصة للفئة الفرعية (من جدول subcategory_exchange_price)
 */
export interface SubcategoryExchangePrice {
  subcategory_id: number;
  buy_price: number;
  sell_price: number | null;
  last_update: string | null;
  updated_by: string | null;
  created_at: string | null;
  price_expires_at: string | null;
  show_on_ticker: boolean;
}

/**
 * خريطة الربط بين المعرف الرقمي للفئة والمعرف UUID الخاص بالكتالوج
 */
export interface SubcategoryMapping {
  old_subcategory_uuid: string;
  old_subcategory_name: string;
  new_subcategory_id: number;
  new_subcategory_name: string;
}

/**
 * منتج مع حقول معدّل السعر (من waste_data_admin بعد الهجرة)
 */
export interface ProductWithModifier {
  id: string;
  subcategory_id?: string | null;
  pricing_subcategory_id?: number | null;
  price_premium_percentage?: number | null;
  price_premium_fixed_amount?: number | null;
  weight?: number;
  price?: number;
  price_per_kg?: number;
  [key: string]: unknown;
}

/**
 * حساب سعر الكيلو الفعلي للمنتج من سعر الفئة + النسبة + المبلغ
 * المعادلة: سعر_كيلو_المنتج = سعر_الفئة × (1 + النسبة/100) + مبلغ_إضافي
 */
export function computeProductPricePerKg(
  subcategoryBuyPrice: number,
  product: ProductWithModifier
): number {
  const percentage = Number(product.price_premium_percentage ?? 0) || 0;
  const fixedAmount = Number(product.price_premium_fixed_amount ?? 0) || 0;
  const base = subcategoryBuyPrice * (1 + percentage / 100);
  return Math.max(0, base + fixedAmount);
}

/**
 * جلب سعر البورصة للفئة الفرعية (waste_sub_categories.id = BIGINT)
 */
export async function getSubcategoryExchangePrice(
  subcategoryId: number
): Promise<SubcategoryExchangePrice | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("subcategory_exchange_price")
    .select("*")
    .eq("subcategory_id", subcategoryId)
    .maybeSingle();
  if (error) {
    console.error("خطأ في جلب سعر الفئة الفرعية:", error);
    return null;
  }
  return data as SubcategoryExchangePrice | null;
}

/**
 * جلب الـ UUID الخاص بالفئة من جدول المزامنة المؤقت
 * ضروري لربط المنتجات في جدول stock_exchange الذي يتطلب UUID
 */
async function getSubcategoryUuidMapping(subcategoryId: number): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("temp_subcategory_mapping")
    .select("old_subcategory_uuid")
    .eq("new_subcategory_id", subcategoryId)
    .maybeSingle();

  if (error || !data) {
    console.warn(`⚠️ تعذر العثور على UUID للفئة ${subcategoryId} في temp_subcategory_mapping`);
    return null;
  }
  return data.old_subcategory_uuid;
}

/**
 * مزامنة سعر منتج واحد في البورصة
 * يُستخدم عند إنشاء منتج جديد أو تحديث معدلات التسعير الخاصة به
 */
export async function syncSingleProductPrice(
  productId: string,
  userId?: string | null
): Promise<boolean> {
  if (!supabase) return false;

  try {
    // 1. جلب بيانات المنتج
    const { data: product, error: pError } = await supabase
      .from("waste_data_admin")
      .select("id, name, category_id, subcategory_id, price_premium_percentage, price_premium_fixed_amount")
      .eq("id", productId)
      .single();

    if (pError || !product || !product.subcategory_id) return false;

    // 2. جلب سعر الفئة
    const subPrice = await getSubcategoryExchangePrice(Number(product.subcategory_id));
    if (!subPrice) return false;

    // 3. مزامنة السعر
    const result = await syncProductsPricesFromSubcategory(
      Number(product.subcategory_id),
      subPrice.buy_price,
      userId,
      productId // تحديد المزامنة لمنتج واحد فقط
    );

    return result.updated > 0;
  } catch (err) {
    console.error("Error in syncSingleProductPrice:", err);
    return false;
  }
}

/**
 * مزامنة أسعار المنتجات في البورصة بناءً على سعر الفئة الفرعية الجديد
 * يُحدّث stock_exchange.buy_price لكل منتج مرتبط بالفئة الفرعية
 */
async function syncProductsPricesFromSubcategory(
  subcategoryId: number,
  newBuyPrice: number,
  userId?: string | null,
  onlyProductId?: string // معامل اختيار لتحديد منتج واحد فقط
): Promise<{ updated: number; failed: number }> {
  if (!supabase) {
    return { updated: 0, failed: 0 };
  }

  let updated = 0;
  let failed = 0;

  try {
    // 1. جلب UUID الفئة لغرض الإدخال إذا لم يكن موجوداً
    const subcategoryUuid = await getSubcategoryUuidMapping(subcategoryId);

    // 2. جلب المنتجات المرتبطة (إما الكل أو منتج محدد)
    let query = supabase
      .from("waste_data_admin")
      .select("id, name, category_id, subcategory_id, price_premium_percentage, price_premium_fixed_amount")
      .eq("subcategory_id", subcategoryId);
    
    if (onlyProductId) {
      query = query.eq("id", onlyProductId);
    }

    const { data: products, error: productsError } = await query;

    if (productsError) {
      console.error("خطأ في جلب المنتجات للمزامنة:", productsError);
      return { updated: 0, failed: 0 };
    }

    if (!products || products.length === 0) {
      return { updated: 0, failed: 0 };
    }

    // 3. لكل منتج، حساب السعر الفعلي وتحديث stock_exchange
    for (const product of products) {
      try {
        const percentage = Number(product.price_premium_percentage ?? 0) || 0;
        const fixedAmount = Number(product.price_premium_fixed_amount ?? 0) || 0;
        
        const effectivePrice = Math.max(0, newBuyPrice * (1 + percentage / 100) + fixedAmount);
        const sellPrice = effectivePrice * 1.2;

        const { data: existingRecord, error: checkError } = await supabase
          .from("stock_exchange")
          .select("id, buy_price, sell_price")
          .eq("product_id", product.id)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          failed++;
          continue;
        }

        if (existingRecord) {
          const oldBuyPrice = Number(existingRecord.buy_price) || 0;
          const oldSellPrice = Number(existingRecord.sell_price) || 0;

          const { error: updateError } = await supabase
            .from("stock_exchange")
            .update({
              buy_price: effectivePrice,
              sell_price: sellPrice,
              base_price: newBuyPrice,
              last_update: new Date().toISOString(),
            })
            .eq("id", existingRecord.id);

          if (updateError) {
            failed++;
          } else {
            updated++;
            if (Math.abs(oldBuyPrice - effectivePrice) > 0.01) {
              await supabase.from("exchange_price_history").insert({
                stock_exchange_id: existingRecord.id,
                product_id: product.id,
                old_buy_price: oldBuyPrice,
                new_buy_price: effectivePrice,
                old_sell_price: oldSellPrice,
                new_sell_price: sellPrice,
                change_reason: 'subcategory_price_sync',
                change_source: 'dashboard',
                changed_by: userId ?? null,
                created_at: new Date().toISOString(),
              }).maybeSingle();
            }
          }
        } else if (subcategoryUuid) {
          // ✨ إضافة سجل جديد في البورصة إذا لم يكن موجوداً
          console.log(`🆕 إنشاء سجل بورصة جديد للمنتج: ${product.name}`);
          
          const { data: newRecord, error: insertError } = await supabase
            .from("stock_exchange")
            .insert({
              product_id: product.id,
              category_id: product.category_id, // UUID من المنتج
              subcategory_id: subcategoryUuid,   // UUID من Mapping
              sub_category_id: subcategoryId,    // BigInt للفئة الفرعية
              region_id: 1, // المنطقة الرئيسية افتراضياً
              base_price: newBuyPrice,
              buy_price: effectivePrice,
              sell_price: sellPrice,
              demand_level: 'stable',
              supply_level: 'normal',
              auto_update_enabled: true,
              show_on_ticker: true,
              last_update: new Date().toISOString()
            })
            .select("id")
            .single();

          if (insertError) {
            console.error(`❌ فشل إنشاء سجل البورصة لـ ${product.name}:`, insertError);
            failed++;
          } else {
            updated++;
            console.log(`✅ تم إنشاء سجل البورصة للمنتج ${product.name} بنجاح`);
            
            // تسجيل السجل الأول في التاريخ
            if (newRecord) {
              await supabase.from("exchange_price_history").insert({
                stock_exchange_id: newRecord.id,
                product_id: product.id,
                old_buy_price: 0,
                new_buy_price: effectivePrice,
                old_sell_price: 0,
                new_sell_price: sellPrice,
                change_reason: 'initial_sync',
                change_source: 'dashboard',
                changed_by: userId ?? null,
                created_at: new Date().toISOString(),
              }).maybeSingle();
            }
          }
        } else {
          console.warn(`⚠️ لم يتم العثور على UUID للفئة ${subcategoryId}، تعذر إنشاء سجل للمنتج ${product.name}`);
          failed++;
        }
      } catch (productError) {
        failed++;
      }
    }

    return { updated, failed };
  } catch (error) {
    return { updated: 0, failed: 0 };
  }
}

/**
 * تعيين أو تحديث سعر البورصة للفئة الفرعية
 * ثم مزامنة أسعار المنتجات المرتبطة في stock_exchange
 */
export async function setSubcategoryExchangePrice(
  subcategoryId: number,
  buyPrice: number,
  sellPrice?: number | null,
  userId?: string | null,
  priceExpiresAt?: string | null
): Promise<SubcategoryExchangePrice | null> {
  if (!supabase) {
    toast.error("خدمة Supabase غير متاحة");
    return null;
  }

  // 1. جلب السعر القديم قبل التحديث للتوثيق
  const { data: oldData } = await supabase
    .from("subcategory_exchange_price")
    .select("buy_price, sell_price")
    .eq("subcategory_id", subcategoryId)
    .single();

  const payload = {
    subcategory_id: subcategoryId,
    buy_price: buyPrice,
    sell_price: sellPrice ?? null,
    last_update: new Date().toISOString(),
    updated_by: userId ?? null,
    show_on_ticker: true,
    price_expires_at: priceExpiresAt ?? null,
  };

  const { data, error } = await supabase
    .from("subcategory_exchange_price")
    .upsert(payload, {
      onConflict: "subcategory_id",
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    console.error("خطأ في تعيين سعر الفئة الفرعية:", error);
    toast.error(error.message || "فشل في حفظ سعر الفئة");
    return null;
  }

  // 2. تسجيل التاريخ في الجدول الجديد (مع معالجة الأخطاء لضمان استمرار العملية)
  if (data) {
    try {
      const oldBuyPrice = Number(oldData?.buy_price) || 0;
      // لا نسجل تاريخ إذا لم يتغير السعر فعلياً
      if (oldBuyPrice !== buyPrice) {
        await supabase.from("subcategory_price_history").insert({
          subcategory_id: subcategoryId,
          old_buy_price: oldBuyPrice,
          new_buy_price: buyPrice,
          old_sell_price: Number(oldData?.sell_price) || 0,
          new_sell_price: sellPrice ?? 0,
          changed_by: userId ?? null,
          change_reason: 'manual_update_from_dashboard'
        });
        console.log("✅ تم تسجيل تاريخ تغيير الفئة بنجاح");
      }
    } catch (historyError) {
      console.error("⚠️ فشل تسجيل تاريخ الفئة ولكن تم تحديث السعر الحالي:", historyError);
    }
  }

  // 🔄 مزامنة أسعار المنتجات المرتبطة في البورصة
  const syncResult = await syncProductsPricesFromSubcategory(subcategoryId, buyPrice, userId);
  if (syncResult.updated > 0) {
    toast.info(`تم تحديث أسعار ${syncResult.updated} منتج في البورصة`);
  }
  if (syncResult.failed > 0) {
    console.warn(`فشل تحديث ${syncResult.failed} منتج في البورصة`);
  }

  return (data as unknown) as SubcategoryExchangePrice;
}

/**
 * جلب جميع أسعار الفئات الفرعية مع اسم الفئة (للعرض في البورصة أو الإدارة)
 */
export async function getAllSubcategoryExchangePrices(): Promise<
  (SubcategoryExchangePrice & { subcategory_name?: string })[]
> {
  if (!supabase) return [];
  let data: Record<string, unknown>[] | null = null;
  let error: { message: string } | null = null;
  const res = await supabase
    .from("subcategory_exchange_price")
    .select("*, waste_sub_categories(name)")
    .order("subcategory_id");
  error = res.error;
  data = res.data;
  if (error) {
    const fallback = await supabase.from("subcategory_exchange_price").select("*").order("subcategory_id");
    if (fallback.error) {
      console.error("خطأ في جلب أسعار الفئات الفرعية:", fallback.error);
      return [];
    }
    data = fallback.data;
  }
  const rows = (data || []).map((row: Record<string, unknown>) => {
    const { waste_sub_categories: wsc, ...rest } = row as Record<string, unknown> & { waste_sub_categories?: { name?: string } | null };
    const name = (wsc as { name?: string } | null)?.name ?? String((row as unknown as SubcategoryExchangePrice).subcategory_id);
    return { ...rest, subcategory_name: name } as unknown as (SubcategoryExchangePrice & { subcategory_name?: string });
  });
  return rows;
}

const APPROVAL_THRESHOLD_PERCENT = 10;

/**
 * تحديث سعر الفئة الفرعية مع فحص نسبة التغيير:
 * - إذا التغيير < 10%: يُطبَّق مباشرة على subcategory_exchange_price
 * - إذا التغيير >= 10%: يُنشأ طلب موافقة ولا يُطبَّق حتى الموافقة
 */
export async function updateSubcategoryPriceWithApprovalCheck(
  subcategoryId: number,
  newBuyPrice: number,
  userId: string | null,
  reason: string,
  createApprovalRequest: (
    subcategoryId: number,
    oldPrice: number | null,
    newPrice: number,
    reason: string,
    userId: string
  ) => Promise<unknown>
): Promise<{ applied: boolean; needsApproval: boolean; message: string }> {
  if (!supabase) {
    return { applied: false, needsApproval: false, message: "خدمة Supabase غير متاحة" };
  }
  const current = await getSubcategoryExchangePrice(subcategoryId);
  const oldPrice = current?.buy_price ?? null;
  let changePercent = 0;
  if (oldPrice != null && oldPrice > 0) {
    changePercent = Math.abs((newBuyPrice - oldPrice) / oldPrice) * 100;
  }
  const needsApproval = changePercent >= APPROVAL_THRESHOLD_PERCENT;
  if (needsApproval && userId) {
    const created = await createApprovalRequest(
      subcategoryId,
      oldPrice,
      newBuyPrice,
      reason || "تحديث سعر الفئة من إدارة التسعير",
      userId
    );
    if (created) {
      return {
        applied: false,
        needsApproval: true,
        message: `التغيير كبير (${changePercent.toFixed(1)}%). تم إرسال طلب موافقة.`,
      };
    }
    return {
      applied: false,
      needsApproval: true,
      message: "فشل في إنشاء طلب الموافقة.",
    };
  }
  if (needsApproval && !userId) {
    return {
      applied: false,
      needsApproval: true,
      message: "التغيير كبير ويحتاج موافقة. يرجى تسجيل الدخول وإعادة المحاولة.",
    };
  }
  const updated = await setSubcategoryExchangePrice(
    subcategoryId,
    newBuyPrice,
    newBuyPrice * 1.2,
    userId ?? undefined
  );
  if (updated) {
    return {
      applied: true,
      needsApproval: false,
      message: "تم تحديث سعر الفئة بنجاح.",
    };
  }
  return {
    applied: false,
    needsApproval: false,
    message: "فشل في تحديث السعر.",
  };
}

export const subcategoryExchangePriceService = {
  getSubcategoryExchangePrice,
  setSubcategoryExchangePrice,
  getAllSubcategoryExchangePrices,
  computeProductPricePerKg,
  updateSubcategoryPriceWithApprovalCheck,
  /** مزامنة أسعار البورصة لمنتج واحد */
  syncSingleProductPrice,
  /** مزامنة أسعار البورصة للمنتجات المرتبطة بفئة فرعية (داخلية) */
  syncProductsPrices: syncProductsPricesFromSubcategory,

  /** تبديل حالة الظهور في شريط الأسعار للفئة الفرعية */
  async toggleShowOnTicker(subcategoryId: number, show: boolean): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from("subcategory_exchange_price")
      .upsert({ 
        subcategory_id: subcategoryId, 
        show_on_ticker: show 
      }, { onConflict: 'subcategory_id' });
    
    if (error) {
      console.error("خطأ في تحديث حالة الظهور في التيكر:", error);
      toast.error("فشل في تحديث حالة الظهور");
      return false;
    }
    return true;
  },

  /** جلب أحدث تغيرات أسعار الفئات الفرعية لحساب المؤشرات */
  async getSubcategoryMarketTrends() {
    try {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from("subcategory_price_history")
        .select("subcategory_id, old_buy_price, new_buy_price, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("خطأ في جلب trends الفئات:", error);
      return [];
    }
  },

  /** جلب نقاط السعر التاريخية للفئات الفرعية (للرسم البياني) */
  async getSubcategorySparklineData(limit = 10) {
    try {
      if (!supabase) return {};
      
      const { data, error } = await supabase
        .from("subcategory_price_history")
        .select("subcategory_id, new_buy_price, created_at")
        .order("created_at", { ascending: false })
        .limit(500); // نجلب كمية كافية لتغطية معظم الفئات

      if (error) throw error;
      
      // تجميع النقاط حسب subcategory_id
      const sparkMap: Record<number, number[]> = {};
      (data || []).forEach(record => {
        const id = Number(record.subcategory_id);
        if (!sparkMap[id]) sparkMap[id] = [];
        if (sparkMap[id].length < limit) {
          sparkMap[id].push(Number(record.new_buy_price));
        }
      });

      // عكس الترتيب ليكون من الأقدم للأحدث (يسار لليمين في الرسم)
      Object.keys(sparkMap).forEach(id => {
        sparkMap[Number(id)].reverse();
      });

      return sparkMap;
    } catch (error) {
      console.error("خطأ في جلب بيانات sparkline الفئات:", error);
      return {};
    }
  }
};
