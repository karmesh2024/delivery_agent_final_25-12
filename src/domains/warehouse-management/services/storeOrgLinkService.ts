/**
 * ربط المتاجر بإدارة التسلسل والتنظيم (التصنيفات الموحدة)
 * - جلب المتاجر مع فئاتها للعرض في التسلسل الهرمي
 * - إنشاء متجر مرتبط بتصنيف عند إضافة تصنيف جديد
 * - مزامنة الفئات الأساسية/الفرعية إلى المتجر عند الإضافة من إدارة التسلسل
 */

import { supabase } from "@/lib/supabase";
import { toast } from "react-toastify";

export interface StoreMainCategoryForOrg {
  id: string;
  shop_id: string;
  name_ar: string;
  name_en?: string;
  slug: string;
  sort_order?: number;
  store_subcategories?: StoreSubCategoryForOrg[];
}

export interface StoreSubCategoryForOrg {
  id: string;
  main_category_id: string;
  name_ar: string;
  name_en?: string;
  slug: string;
  sort_order?: number;
}

export interface StoreForOrg {
  id: string;
  name_ar: string;
  name_en?: string;
  slug: string;
  unified_classification_id?: string | null;
  store_main_categories?: StoreMainCategoryForOrg[];
}

/**
 * جلب جميع المتاجر مع الفئات الأساسية والفرعية (للعرض في إدارة التسلسل)
 */
export async function getStoresWithCategories(): Promise<StoreForOrg[]> {
  try {
    const { data: stores, error: storesError } = await supabase!
      .from("store_shops")
      .select("id, name_ar, name_en, slug, unified_classification_id")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (storesError) throw storesError;
    if (!stores?.length) return [];

    const shopIds = stores.map((s) => s.id);

    const { data: mainCats, error: mainError } = await supabase!
      .from("store_main_categories")
      .select("id, shop_id, name_ar, name_en, slug, sort_order")
      .in("shop_id", shopIds)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (mainError) throw mainError;

    const mainCategoryIds = (mainCats || []).map((m) => m.id);
    const { data: subCats, error: subError } = mainCategoryIds.length
      ? await supabase!
          .from("store_subcategories")
          .select("id, main_category_id, name_ar, name_en, slug, sort_order")
          .in("main_category_id", mainCategoryIds)
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
      : { data: [], error: null };

    if (subError) throw subError;

    return (stores || []).map((store) => ({
      ...store,
      store_main_categories: (mainCats || [])
        .filter((m) => m.shop_id === store.id)
        .map((m) => ({
          ...m,
          store_subcategories: (subCats || []).filter(
            (s) => s.main_category_id === m.id
          ),
        })),
    }));
  } catch (e: any) {
    console.error("خطأ في جلب المتاجر للتنظيم:", e);
    toast.error(e?.message || "فشل في جلب المتاجر");
    return [];
  }
}

/**
 * الحصول على متجر مرتبط بتصنيف معين (إن وُجد)
 */
export async function getStoreByClassificationId(
  classificationId: string
): Promise<StoreForOrg | null> {
  try {
    const { data, error } = await supabase!
      .from("store_shops")
      .select("id, name_ar, name_en, slug, unified_classification_id")
      .eq("unified_classification_id", classificationId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (e: any) {
    console.error("خطأ في جلب متجر التصنيف:", e);
    return null;
  }
}

/**
 * إنشاء متجر جديد وربطه بتصنيف موحد (عند اختيار "إنشاء متجر" مع إضافة التصنيف)
 */
export async function createStoreForClassification(params: {
  classification_id: string;
  name_ar: string;
  name_en?: string;
  slug: string;
}): Promise<StoreForOrg | null> {
  try {
    const slug = params.slug.trim() || slugify(params.name_ar);
    const { data, error } = await supabase!
      .from("store_shops")
      .insert({
        name_ar: params.name_ar,
        name_en: params.name_en || params.name_ar,
        slug,
        is_active: true,
        unified_classification_id: params.classification_id,
      })
      .select("id, name_ar, name_en, slug, unified_classification_id")
      .single();

    if (error) throw error;
    toast.success("تم إنشاء المتجر وربطه بالتصنيف بنجاح");
    return data;
  } catch (e: any) {
    console.error("خطأ في إنشاء متجر للتصنيف:", e);
    toast.error(e?.message || "فشل في إنشاء المتجر");
    return null;
  }
}

/**
 * إضافة فئة أساسية للمتجر (مزامنة من إدارة التسلسل عند وجود متجر مرتبط بالتصنيف)
 */
export async function syncMainCategoryToStore(params: {
  shop_id: string;
  name_ar: string;
  name_en?: string;
  slug?: string;
}): Promise<StoreMainCategoryForOrg | null> {
  try {
    const slug = params.slug?.trim() || slugify(params.name_ar);
    const { data, error } = await supabase!
      .from("store_main_categories")
      .insert({
        shop_id: params.shop_id,
        name_ar: params.name_ar,
        name_en: params.name_en || params.name_ar,
        slug,
        is_active: true,
        sort_order: 0,
      })
      .select("id, shop_id, name_ar, name_en, slug, sort_order")
      .single();

    if (error) throw error;
    return data;
  } catch (e: any) {
    console.error("خطأ في مزامنة الفئة الأساسية للمتجر:", e);
    return null;
  }
}

/**
 * إضافة فئة فرعية للمتجر (مزامنة من إدارة التسلسل)
 */
export async function syncSubCategoryToStore(params: {
  main_category_id: string;
  name_ar: string;
  name_en?: string;
  slug?: string;
}): Promise<StoreSubCategoryForOrg | null> {
  try {
    const slug = params.slug?.trim() || slugify(params.name_ar);
    const { data: mainCat } = await supabase!
      .from("store_main_categories")
      .select("shop_id")
      .eq("id", params.main_category_id)
      .single();

    const shopId = (mainCat as { shop_id?: string } | null)?.shop_id;
    if (!shopId) return null;

    const { data, error } = await supabase!
      .from("store_subcategories")
      .insert({
        main_category_id: params.main_category_id,
        shop_id: shopId,
        name_ar: params.name_ar,
        name_en: params.name_en || params.name_ar,
        slug,
        is_active: true,
        sort_order: 0,
      })
      .select("id, main_category_id, name_ar, name_en, slug, sort_order")
      .single();

    if (error) throw error;
    return data;
  } catch (e: any) {
    console.error("خطأ في مزامنة الفئة الفرعية للمتجر:", e);
    return null;
  }
}

/**
 * الحصول على معرف الفئة الأساسية للمتجر بالاسم (لمزامنة الفئة الفرعية)
 */
export async function getStoreMainCategoryIdByName(
  shopId: string,
  nameAr: string
): Promise<string | null> {
  const { data, error } = await supabase!
    .from("store_main_categories")
    .select("id")
    .eq("shop_id", shopId)
    .eq("name_ar", nameAr.trim())
    .maybeSingle();
  if (error || !data) return null;
  return data.id;
}

/**
 * مزامنة منتج من الكتالوج الموحد إلى جميع المتاجر المرتبطة بالتصنيف
 */
export async function syncProductToLinkedStores(catalogProduct: any): Promise<void> {
  try {
    // 1. جلب بيانات الفئة الفرعية والأساسية لمعرفة التصنيف
    const { data: subCat } = await supabase!
      .from("unified_sub_categories")
      .select("main_category_id, name_ar")
      .eq("id", catalogProduct.unified_sub_category_id)
      .single();

    if (!subCat) return;

    const { data: mainCat } = await supabase!
      .from("unified_main_categories")
      .select("classification_id, name_ar")
      .eq("id", subCat.main_category_id)
      .single();

    if (!mainCat) return;

    // 2. البحث عن המتاجر المرتبطة بهذا التصنيف
    const { data: shops } = await supabase!
      .from("store_shops")
      .select("id")
      .eq("unified_classification_id", mainCat.classification_id)
      .eq("is_active", true);

    if (!shops?.length) return;

    // 3. المزامنة لكل متجر
    for (const shop of shops) {
      // أ. البحث عن الفئة الأساسية في المتجر (بالاسم)
      let { data: storeMainCat } = await supabase!
        .from("store_main_categories")
        .select("id")
        .eq("shop_id", shop.id)
        .eq("name_ar", mainCat.name_ar)
        .maybeSingle();

      if (!storeMainCat) {
        // إنشاء الفئة الأساسية إذا لم توجد
        storeMainCat = await syncMainCategoryToStore({
          shop_id: shop.id,
          name_ar: mainCat.name_ar,
        });
      }

      if (!storeMainCat) continue;

      // ب. البحث عن الفئة الفرعية في المتجر (بالاسم)
      let { data: storeSubCat } = await supabase!
        .from("store_subcategories")
        .select("id")
        .eq("main_category_id", storeMainCat.id)
        .eq("name_ar", subCat.name_ar)
        .maybeSingle();

      if (!storeSubCat) {
        // إنشاء الفئة الفرعية إذا لم توجد
        storeSubCat = await syncSubCategoryToStore({
          main_category_id: storeMainCat.id,
          name_ar: subCat.name_ar,
        });
      }

      if (!storeSubCat) continue;

      // ج. إضافة المنتج إلى جدول المنتجات الفعلي للمتجر
      const { data: upsertedProd, error: upsertError } = await supabase!
        .from("store_products")
        .upsert({
          shop_id: shop.id,
          main_category_id: storeMainCat.id,
          subcategory_id: storeSubCat.id,
          store_catalog_product_id: catalogProduct.id,
          name_ar: catalogProduct.name_ar || catalogProduct.name,
          description_ar: catalogProduct.description,
          description_en: catalogProduct.description_en,
          sku: catalogProduct.sku,
          default_selling_price: catalogProduct.default_selling_price || 0,
          cost_price: catalogProduct.cost_price || 0,
          loyalty_points_earned: catalogProduct.loyalty_points_earned || 0,
          is_active: true,
          measurement_unit: catalogProduct.measurement_unit || 'piece',
          stock_quantity: 0,
          is_on_sale: catalogProduct.is_on_sale || false,
          sale_price: catalogProduct.sale_price || null
        }, { 
          onConflict: 'shop_id, sku' 
        })
        .select("id")
        .maybeSingle();

      if (upsertError) {
        console.error(`خطأ في مزامنة المنتج للمتجر ${shop.id}:`, {
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint,
          code: upsertError.code
        });
        continue;
      }

      // د. مزامنة الصورة إذا وجدت
      if (catalogProduct.image_url && upsertedProd) {
        // التحقق مما إذا كانت الصورة موجودة مسبقاً لهذا المنتج
        const { data: existingImg } = await supabase!
          .from("store_product_images")
          .select("id")
          .eq("product_id", upsertedProd.id)
          .eq("image_url", catalogProduct.image_url)
          .maybeSingle();

        if (!existingImg) {
          await supabase!
            .from("store_product_images")
            .insert({
              product_id: upsertedProd.id,
              image_url: catalogProduct.image_url,
              is_primary: true,
              media_type: 'image'
            });
        }
      }
    }
  } catch (e: any) {
    console.error("خطأ في syncProductToLinkedStores:", e);
  }
}

function slugify(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .toLowerCase() || "cat-" + Date.now();
}

