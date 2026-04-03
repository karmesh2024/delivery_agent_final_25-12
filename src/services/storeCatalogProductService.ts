import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';

/**
 * منتج من كتالوج المتجر (إدارة التنظيم: قطاع → تصنيف → فئة أساسية → فئة فرعية → منتج)
 */
export interface StoreCatalogProduct {
  id: string;
  unified_sub_category_id: string;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  description_en?: string | null;
  image_url?: string | null;
  sku: string;
  barcode?: string | null;
  default_selling_price?: number | null;
  cost_price?: number | null;
  profit_margin?: number | null;
  loyalty_points_earned?: number | null;
  brand_id?: string | null;
  weight?: number | null;
  measurement_unit?: string | null;
  is_active?: boolean | null;
  visible_to_client_app?: boolean | null;
  sort_order?: number | null;
  is_on_sale?: boolean | null;
  sale_price?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type StoreCatalogProductInsert = Omit<StoreCatalogProduct, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type StoreCatalogProductUpdate = Partial<StoreCatalogProductInsert>;

export const storeCatalogProductService = {
  /**
   * جلب منتجات كتالوج المتجر حسب الفئة الفرعية الموحدة
   */
  async getBySubCategoryId(unifiedSubCategoryId: string): Promise<StoreCatalogProduct[]> {
    const { data, error } = await supabase
      .from('store_catalog_products')
      .select('*')
      .eq('unified_sub_category_id', unifiedSubCategoryId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('storeCatalogProductService.getBySubCategoryId:', error);
      toast.error('فشل في جلب منتجات الكتالوج');
      return [];
    }
    return (data || []) as StoreCatalogProduct[];
  },

  /**
   * جلب منتج واحد بالمعرف
   */
  async getById(id: string): Promise<StoreCatalogProduct | null> {
    const { data, error } = await supabase
      .from('store_catalog_products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('storeCatalogProductService.getById:', error);
      return null;
    }
    return data as StoreCatalogProduct;
  },

  /**
   * مزامنة منتج كتالوج المتجر مع كتالوج المخازن (catalog_products) وربطه بالتنظيم.
   * إذا لم توجد الفئات في product_main_categories / product_sub_categories يتم إنشاؤها تلقائياً من التنظيم الموحد.
   */
  async syncToWarehouseCatalog(product: StoreCatalogProduct): Promise<void> {
    try {
      const { data: subCat } = await supabase
        .from('unified_sub_categories')
        .select('code, name, main_category_id')
        .eq('id', product.unified_sub_category_id)
        .single();
      if (!subCat?.code) return;

      let mainCategoryIdBigInt: number | null = null;
      let subCategoryIdBigInt: number | null = null;
      const { data: mainCat } = await supabase
        .from('unified_main_categories')
        .select('code, name')
        .eq('id', subCat.main_category_id)
        .single();

      if (mainCat?.code) {
        let pm = await supabase.from('product_main_categories').select('id').eq('code', mainCat.code).maybeSingle();
        if (pm?.data) {
          mainCategoryIdBigInt = Number(pm.data.id);
        } else {
          const { data: inserted } = await supabase
            .from('product_main_categories')
            .insert({ code: mainCat.code, name: mainCat.name || mainCat.code })
            .select('id')
            .single();
          if (inserted) mainCategoryIdBigInt = Number(inserted.id);
        }
      }

      let ps = await supabase.from('product_sub_categories').select('id').eq('code', subCat.code).maybeSingle();
      if (ps?.data) {
        subCategoryIdBigInt = Number(ps.data.id);
      } else if (mainCategoryIdBigInt != null) {
        const { data: inserted } = await supabase
          .from('product_sub_categories')
          .insert({
            code: subCat.code,
            name: subCat.name || subCat.code,
            main_id: mainCategoryIdBigInt,
          })
          .select('id')
          .single();
        if (inserted) subCategoryIdBigInt = Number(inserted.id);
      }

      const productCode = product.sku.startsWith('PRD-') ? product.sku : `PRD-${product.sku}`;
      const payload = {
        name: product.name_ar || product.name,
        sku: product.sku,
        product_code: productCode,
        description: product.description ?? null,
        images: product.image_url ? [product.image_url] : [],
        unified_sub_category_id: product.unified_sub_category_id,
        main_category_id: mainCategoryIdBigInt,
        sub_category_id: subCategoryIdBigInt,
      };

      const { data: existing } = await supabase.from('catalog_products').select('id').eq('sku', product.sku).maybeSingle();
      if (existing) {
        await supabase.from('catalog_products').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('catalog_products').insert(payload);
      }
      window.dispatchEvent(new Event('productCatalogUpdated'));
    } catch (e) {
      console.error('storeCatalogProductService.syncToWarehouseCatalog:', e);
    }
  },

  /**
   * إلغاء ربط منتج من كتالوج المخازن بالتنظيم (عند الحذف)
   */
  async unlinkFromWarehouseCatalog(sku: string): Promise<void> {
    try {
      const { data: row } = await supabase.from('catalog_products').select('id').eq('sku', sku).maybeSingle();
      if (row) {
        await supabase.from('catalog_products').update({ unified_sub_category_id: null }).eq('id', row.id);
        window.dispatchEvent(new Event('productCatalogUpdated'));
      }
    } catch (e) {
      console.error('storeCatalogProductService.unlinkFromWarehouseCatalog:', e);
    }
  },

  /**
   * إنشاء منتج جديد في كتالوج المتجر ومزامنته مع كتالوج المخازن
   */
  async create(
    payload: StoreCatalogProductInsert
  ): Promise<StoreCatalogProduct | null> {
    const { data, error } = await supabase
      .from('store_catalog_products')
      .insert({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('storeCatalogProductService.create:', error);
      toast.error(error.message || 'فشل في إضافة المنتج');
      return null;
    }
    const created = data as StoreCatalogProduct;
    await this.syncToWarehouseCatalog(created);
    toast.success('تم إضافة المنتج إلى كتالوج المتجر وربطه بكتالوج المخازن');
    return created;
  },

  /**
   * تحديث منتج في كتالوج المتجر ومزامنة كتالوج المخازن
   */
  async update(
    id: string,
    payload: StoreCatalogProductUpdate
  ): Promise<StoreCatalogProduct | null> {
    const { data, error } = await supabase
      .from('store_catalog_products')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('storeCatalogProductService.update:', error);
      toast.error(error.message || 'فشل في تحديث المنتج');
      return null;
    }
    const updated = data as StoreCatalogProduct;
    await this.syncToWarehouseCatalog(updated);
    toast.success('تم تحديث المنتج');
    return updated;
  },

  /**
   * حذف منتج من كتالوج المتجر وإلغاء ربطه من كتالوج المخازن
   */
  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    const sku = existing?.sku;
    const { error } = await supabase
      .from('store_catalog_products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('storeCatalogProductService.delete:', error);
      toast.error(error.message || 'فشل في حذف المنتج');
      return false;
    }
    if (sku) await this.unlinkFromWarehouseCatalog(sku);
    toast.success('تم حذف المنتج');
    return true;
  },

  /**
   * التحقق من وجود الجدول (للواجهة)
   */
  async isAvailable(): Promise<boolean> {
    const { error } = await supabase
      .from('store_catalog_products')
      .select('id')
      .limit(1);
    return !error;
  },
};
