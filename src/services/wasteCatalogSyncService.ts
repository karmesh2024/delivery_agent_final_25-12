/**
 * خدمة مزامنة كتالوج المخلفات
 * تقوم بمزامنة البيانات بين waste_data_admin و catalog_waste_materials
 * 
 * الغرض: عندما يتم إضافة/تعديل/حذف منتج في إدارة التنظيم والتسلسل (waste_data_admin)
 * يتم تلقائياً إنشاء/تحديث/حذف السجل المقابل في كتالوج المخلفات (catalog_waste_materials)
 * لاستخدامه في إدارة المخازن والبورصة
 */

import { supabase } from "@/lib/supabase";

/**
 * بيانات المنتج من waste_data_admin
 */
interface WasteProduct {
  id: string; // UUID
  name: string;
  description?: string | null;
  category_id?: string | null; // UUID من categories
  subcategory_id?: number | null; // BigInt من waste_sub_categories
  weight?: number;
  price?: number;
  price_per_kg?: number | null;
  image_url?: string | null;
  visible_to_client_app?: boolean;
  visible_to_agent_app?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * بيانات كتالوج المخلفات
 */
interface CatalogWasteMaterial {
  id?: number; // BigInt - auto-generated
  waste_no: string;
  name?: string;
  main_category_id?: number | null; // BigInt من waste_main_categories
  sub_category_id?: number | null; // BigInt من waste_sub_categories
  expected_price?: number | null;
  weight?: number | null;
  notes?: string | null;
  status?: string;
  source_product_id?: string | null; // UUID - ربط بـ waste_data_admin.id
}

class WasteCatalogSyncService {
  /**
   * توليد رقم كتالوج فريد للمخلف
   */
  private async generateCatalogWasteNo(productName: string): Promise<string> {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const prefix = productName.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
    return `CAT-${year}-${prefix}-${timestamp}`;
  }

  /**
   * جلب الفئة الأساسية (BigInt) من الفئة الفرعية
   */
  private async getMainCategoryFromSubcategory(subcategoryId: number): Promise<number | null> {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from("waste_sub_categories")
        .select("main_id")
        .eq("id", subcategoryId)
        .single();
      
      if (error || !data) return null;
      return data.main_id ? Number(data.main_id) : null;
    } catch {
      return null;
    }
  }

  /**
   * ربط المنتج بسجل الكتالوج (تحديث catalog_waste_id في waste_data_admin)
   */
  private async setProductCatalogId(productId: string, catalogId: number): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from("waste_data_admin")
        .update({ catalog_waste_id: catalogId, updated_at: new Date().toISOString() })
        .eq("id", productId);
      if (error) {
        console.warn("⚠️ تعذر تحديث catalog_waste_id (ربما العمود غير موجود بعد):", error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * البحث عن سجل كتالوج موجود للمنتج
   * أولاً عبر catalog_waste_id في waste_data_admin، ثم عبر waste_no
   */
  private async findCatalogByProductId(productId: string): Promise<CatalogWasteMaterial | null> {
    if (!supabase) return null;
    
    try {
      // 1. إن وُجد catalog_waste_id في المنتج، جلب سجل الكتالوج مباشرة
      const { data: product } = await supabase
        .from("waste_data_admin")
        .select("catalog_waste_id")
        .eq("id", productId)
        .maybeSingle();
      
      if (product?.catalog_waste_id) {
        const { data: catalog, error } = await supabase
          .from("catalog_waste_materials")
          .select("*")
          .eq("id", product.catalog_waste_id)
          .maybeSingle();
        if (!error && catalog) return catalog as CatalogWasteMaterial;
      }
      
      // 2. البحث عبر waste_no الذي يحتوي على معرف المنتج
      const { data, error } = await supabase
        .from("catalog_waste_materials")
        .select("*")
        .ilike("waste_no", `%${productId.slice(0, 8)}%`)
        .maybeSingle();
      
      if (error || !data) return null;
      return data as CatalogWasteMaterial;
    } catch {
      return null;
    }
  }

  /**
   * مزامنة منتج جديد: إنشاء سجل في كتالوج المخلفات
   */
  async syncNewProduct(product: WasteProduct): Promise<CatalogWasteMaterial | null> {
    if (!supabase) {
      console.error("Supabase غير متاح للمزامنة");
      return null;
    }

    try {
      console.log(`🔄 مزامنة منتج جديد إلى كتالوج المخلفات: ${product.name}`);

      // التحقق من عدم وجود سجل سابق
      const existing = await this.findCatalogByProductId(product.id);
      if (existing) {
        console.log(`ℹ️ المنتج موجود بالفعل في الكتالوج: ${existing.waste_no}`);
        return existing;
      }

      // جلب الفئة الأساسية
      let mainCategoryId: number | null = null;
      if (product.subcategory_id) {
        mainCategoryId = await this.getMainCategoryFromSubcategory(product.subcategory_id);
      }

      // إنشاء رقم كتالوج يحتوي على معرف المنتج للربط
      const wasteNo = `PROD-${product.id.slice(0, 8)}-${Date.now().toString().slice(-4)}`;

      const catalogData: Omit<CatalogWasteMaterial, 'id'> = {
        waste_no: wasteNo,
        name: product.name,
        main_category_id: mainCategoryId,
        sub_category_id: product.subcategory_id ?? null,
        expected_price: product.price_per_kg ?? product.price ?? null,
        weight: product.weight ?? null,
        notes: `مُزامَن من إدارة التنظيم والتسلسل - معرف المنتج: ${product.id}`,
        status: 'active',
        source_product_id: product.id,
      };

      // محاولة الإدراج مع التعامل مع عدم وجود حقل source_product_id
      const { source_product_id, ...dataWithoutSourceId } = catalogData;
      
      const { data, error } = await supabase
        .from("catalog_waste_materials")
        .insert([dataWithoutSourceId])
        .select()
        .single();

      if (error) {
        console.error("❌ خطأ في إنشاء سجل الكتالوج:", error);
        return null;
      }

      const catalogId = data?.id ? Number(data.id) : 0;
      if (catalogId > 0) {
        await this.setProductCatalogId(product.id, catalogId);
      }

      console.log(`✅ تم إنشاء سجل في كتالوج المخلفات: ${wasteNo}`);
      return data as CatalogWasteMaterial;
    } catch (error) {
      console.error("❌ خطأ في مزامنة المنتج الجديد:", error);
      return null;
    }
  }

  /**
   * مزامنة تحديث منتج: تحديث السجل في كتالوج المخلفات
   */
  async syncUpdatedProduct(product: WasteProduct): Promise<CatalogWasteMaterial | null> {
    if (!supabase) return null;

    try {
      console.log(`🔄 مزامنة تحديث المنتج إلى كتالوج المخلفات: ${product.name}`);

      // البحث عن السجل الموجود
      const existing = await this.findCatalogByProductId(product.id);
      if (!existing || !existing.id) {
        // إذا لم يوجد، أنشئ سجل جديد
        console.log(`ℹ️ السجل غير موجود، سيتم إنشاؤه...`);
        return this.syncNewProduct(product);
      }

      // جلب الفئة الأساسية
      let mainCategoryId: number | null = null;
      if (product.subcategory_id) {
        mainCategoryId = await this.getMainCategoryFromSubcategory(product.subcategory_id);
      }

      const updateData: Partial<CatalogWasteMaterial> = {
        name: product.name,
        main_category_id: mainCategoryId,
        sub_category_id: product.subcategory_id ?? null,
        expected_price: product.price_per_kg ?? product.price ?? null,
        weight: product.weight ?? null,
      };

      const { data, error } = await supabase
        .from("catalog_waste_materials")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("❌ خطأ في تحديث سجل الكتالوج:", error);
        return null;
      }

      console.log(`✅ تم تحديث سجل الكتالوج: ${existing.waste_no}`);
      return data as CatalogWasteMaterial;
    } catch (error) {
      console.error("❌ خطأ في مزامنة تحديث المنتج:", error);
      return null;
    }
  }

  /**
   * مزامنة حذف منتج: حذف أو تعطيل السجل في كتالوج المخلفات
   */
  async syncDeletedProduct(productId: string, hardDelete: boolean = false): Promise<boolean> {
    if (!supabase) return false;

    try {
      console.log(`🔄 مزامنة حذف المنتج من كتالوج المخلفات: ${productId}`);

      const existing = await this.findCatalogByProductId(productId);
      if (!existing || !existing.id) {
        console.log(`ℹ️ السجل غير موجود في الكتالوج`);
        return true;
      }

      if (hardDelete) {
        // حذف نهائي
        const { error } = await supabase
          .from("catalog_waste_materials")
          .delete()
          .eq("id", existing.id);

        if (error) {
          console.error("❌ خطأ في حذف سجل الكتالوج:", error);
          return false;
        }
        console.log(`✅ تم حذف سجل الكتالوج نهائياً: ${existing.waste_no}`);
      } else {
        // تعطيل فقط (soft delete)
        const { error } = await supabase
          .from("catalog_waste_materials")
          .update({ status: 'deleted' })
          .eq("id", existing.id);

        if (error) {
          console.error("❌ خطأ في تعطيل سجل الكتالوج:", error);
          return false;
        }
        console.log(`✅ تم تعطيل سجل الكتالوج: ${existing.waste_no}`);
      }

      return true;
    } catch (error) {
      console.error("❌ خطأ في مزامنة حذف المنتج:", error);
      return false;
    }
  }

  /**
   * مزامنة جميع المنتجات الموجودة (للاستخدام الأولي)
   * المنتجات التي لديها catalog_waste_id تُتخطى (مربوطة مسبقاً)، الباقي يُنشأ له سجل كتالوج ويُربط
   */
  async syncAllProducts(): Promise<{ synced: number; failed: number; skipped: number }> {
    if (!supabase) return { synced: 0, failed: 0, skipped: 0 };

    let synced = 0;
    let failed = 0;
    let skipped = 0;

    try {
      console.log("🔄 بدء مزامنة جميع المنتجات...");

      const { data: products, error } = await supabase
        .from("waste_data_admin")
        .select("id, name, description, category_id, subcategory_id, weight, price, price_per_kg, image_url, visible_to_client_app, visible_to_agent_app, created_at, updated_at, catalog_waste_id");

      if (error || !products) {
        console.error("❌ خطأ في جلب المنتجات:", error);
        return { synced: 0, failed: 0, skipped: 0 };
      }

      console.log(`📦 تم جلب ${products.length} منتج للمزامنة`);

      for (const product of products) {
        const p = product as WasteProduct & { catalog_waste_id?: number | null };
        if (p.catalog_waste_id) {
          skipped++;
          continue;
        }
        const result = await this.syncNewProduct(p);
        if (result) {
          synced++;
        } else {
          failed++;
        }
      }

      console.log(`✅ انتهت المزامنة: ${synced} نجح، ${failed} فشل، ${skipped} مُتخطّى (مربوط مسبقاً)`);
      return { synced, failed, skipped };
    } catch (error) {
      console.error("❌ خطأ في مزامنة جميع المنتجات:", error);
      return { synced, failed, skipped };
    }
  }

  /**
   * مزامنة سعر المنتج فقط (للتحديث السريع)
   */
  async syncProductPrice(productId: string, newPrice: number): Promise<boolean> {
    if (!supabase) return false;

    try {
      const existing = await this.findCatalogByProductId(productId);
      if (!existing || !existing.id) return false;

      const { error } = await supabase
        .from("catalog_waste_materials")
        .update({ expected_price: newPrice })
        .eq("id", existing.id);

      if (error) {
        console.error("❌ خطأ في مزامنة سعر المنتج:", error);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}

export const wasteCatalogSyncService = new WasteCatalogSyncService();
export default wasteCatalogSyncService;
