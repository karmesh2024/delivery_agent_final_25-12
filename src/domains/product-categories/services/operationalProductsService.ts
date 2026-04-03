import { supabase } from "@/lib/supabase";
import {
  getAllSubcategoryExchangePrices,
  computeProductPricePerKg,
  type ProductWithModifier,
} from "@/domains/waste-management/services/subcategoryExchangePriceService";
import { productService, type Product } from "./productService";

export interface OperationalProduct extends Product {
  subcategory_name?: string | null;
  /** سعر شراء الفئة (ج/كجم) */
  subcategory_buy_price?: number | null;
  /** سعر الكيلو الفعلي للمنتج (محسوب من الفئة + النسبة + المبلغ) */
  effective_price_per_kg: number;
}

/**
 * جلب جميع المنتجات مع السعر الفعلي للكيلو (سعر الفئة + معدّل المنتج)
 */
export async function getOperationalProducts(): Promise<OperationalProduct[]> {
  const [products, prices] = await Promise.all([
    productService.getProducts(),
    getAllSubcategoryExchangePrices(),
  ]);
  const priceBySubcategoryId = new Map<number, number>();
  const nameBySubcategoryId = new Map<number, string>();
  for (const p of prices) {
    priceBySubcategoryId.set(p.subcategory_id, p.buy_price);
    if (p.subcategory_name) nameBySubcategoryId.set(p.subcategory_id, p.subcategory_name);
  }
  return (products as (Product & Record<string, unknown>)[]).map((row) => {
    const subId =
      row.pricing_subcategory_id != null
        ? Number(row.pricing_subcategory_id)
        : row.subcategory_id != null
          ? Number(row.subcategory_id)
          : null;
    const buyPrice = subId != null ? priceBySubcategoryId.get(subId) ?? null : null;
    const subcategoryName = subId != null ? nameBySubcategoryId.get(subId) ?? null : null;
    const productAsModifier: ProductWithModifier = {
      id: row.id,
      subcategory_id: row.subcategory_id,
      pricing_subcategory_id: row.pricing_subcategory_id,
      price_premium_percentage: row.price_premium_percentage,
      price_premium_fixed_amount: row.price_premium_fixed_amount,
      weight: row.weight as number | undefined,
      price: row.price as number | undefined,
      price_per_kg: row.price_per_kg as number | undefined,
    };
    const effective =
      buyPrice != null
        ? computeProductPricePerKg(buyPrice, productAsModifier)
        : Number(row.price_per_kg ?? row.price ?? 0);
    return {
      ...row,
      subcategory_name: subcategoryName,
      subcategory_buy_price: buyPrice ?? undefined,
      effective_price_per_kg: effective,
    } as OperationalProduct;
  });
}

/**
 * تحديث إعدادات المنتج التشغيلية: الظهور، ترتيب العرض، معدّلات السعر
 */
export async function updateProductOperational(
  productId: string,
  payload: {
    visible_to_client_app?: boolean;
    visible_to_agent_app?: boolean;
    display_order?: number;
    price_premium_percentage?: number | null;
    price_premium_fixed_amount?: number | null;
    pricing_mode?: 'per_kg' | 'per_piece' | null;
    agent_pricing_mode?: 'per_kg' | 'per_piece' | null;
    weight?: number | null;
  }
): Promise<Product | null> {
  return productService.updateProduct(productId, {
    ...payload,
    updated_at: new Date().toISOString(),
  } as Partial<Product>);
}
