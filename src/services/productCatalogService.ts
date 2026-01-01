import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface ProductCatalogItem {
  id?: number;
  warehouse_id: number | null;
  sku: string;
  product_code: string;
  name: string;
  brand?: string | null;
  brand_id?: number | string | null;
  brand_name_ar?: string | null;
  brand_name_en?: string | null;
  description?: string;
  main_category_id?: number;
  sub_category_id?: number;
  unit_mode: 'weight' | 'volume' | 'count' | 'dimension';
  unit_id?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  color?: string;
  size?: string;
  gender?: string;
  season?: string;
  fabric_type?: string;
  max_qty?: number;
  min_qty?: number;
  qr_code?: string | null;
  barcode?: string | null;
  production_date?: string;
  status?: string;
  compliance_certificates?: string;
  usage_warnings?: string;
  child_safe?: boolean;
  expiry_date?: string;
  storage_location?: string;
  storage_temperature?: string;
  special_storage_conditions?: string;
  stackable?: boolean;
  max_stack_height?: number;
  notes?: string;
  images?: string[];
  created_at?: string;
  warehouse?: { name: string };
  main_category?: { name: string };
  sub_category?: { name: string };
  unit?: { name: string };
}

export interface ProductMainCategory {
  id: number | string; // يمكن أن يكون UUID أو number
  code: string;
  name: string;
}

export interface ProductSubCategory {
  id: number | string; // يمكن أن يكون UUID أو number
  code: string;
  name: string;
  main_id: number | string; // يمكن أن يكون UUID أو number
}

export interface Unit {
  id: number;
  code: string;
  name: string;
}

class ProductCatalogService {
  // إضافة منتج جديد
  async addProduct(product: Omit<ProductCatalogItem, 'id' | 'created_at'>): Promise<ProductCatalogItem | null> {
    try {
      // تحويل UUID من unified_main_categories إلى bigint من product_main_categories
      let mainCategoryIdBigInt: number | null = null;
      let subCategoryIdBigInt: number | null = null;

      if (product.main_category_id) {
        const mainCategoryIdStr = product.main_category_id.toString();
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mainCategoryIdStr);
        
        if (isUUID) {
          // البحث عن code في unified_main_categories
          const { data: unifiedMainCategory } = await supabase
            .from('unified_main_categories')
            .select('code')
            .eq('id', mainCategoryIdStr)
            .single();
          
          if (unifiedMainCategory?.code) {
            // البحث عن bigint في product_main_categories
            const { data: oldMainCategory } = await supabase
              .from('product_main_categories')
              .select('id')
              .eq('code', unifiedMainCategory.code)
              .single();
            
            if (oldMainCategory) {
              mainCategoryIdBigInt = Number(oldMainCategory.id);
            }
          }
        } else {
          mainCategoryIdBigInt = Number(product.main_category_id);
        }
      }

      if (product.sub_category_id) {
        const subCategoryIdStr = product.sub_category_id.toString();
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subCategoryIdStr);
        
        if (isUUID) {
          // البحث عن code في unified_sub_categories
          const { data: unifiedSubCategory } = await supabase
            .from('unified_sub_categories')
            .select('code')
            .eq('id', subCategoryIdStr)
            .single();
          
          if (unifiedSubCategory?.code) {
            // البحث عن bigint في product_sub_categories
            const { data: oldSubCategory } = await supabase
              .from('product_sub_categories')
              .select('id')
              .eq('code', unifiedSubCategory.code)
              .single();
            
            if (oldSubCategory) {
              subCategoryIdBigInt = Number(oldSubCategory.id);
            }
          }
        } else {
          subCategoryIdBigInt = Number(product.sub_category_id);
        }
      }

      const productData = {
        ...product,
        main_category_id: mainCategoryIdBigInt,
        sub_category_id: subCategoryIdBigInt,
      };

      const { data, error } = await supabase
        .from('catalog_products')
        .insert([productData])
        .select()
        .single();

      if (error) {
        console.error('خطأ في إضافة المنتج:', error);
        toast.error(`حدث خطأ أثناء إضافة المنتج: ${error.message}`);
        return null;
      }

      toast.success('تم إضافة المنتج بنجاح');
      return data;
    } catch (error: any) {
      console.error('خطأ في إضافة المنتج:', error);
      toast.error(`حدث خطأ أثناء إضافة المنتج: ${error.message}`);
      return null;
    }
  }

  // تحديث منتج موجود
  async updateProduct(id: number, product: Partial<ProductCatalogItem>): Promise<ProductCatalogItem | null> {
    try {
      // تحويل UUID من unified_main_categories إلى bigint من product_main_categories
      let mainCategoryIdBigInt: number | null | undefined = undefined;
      let subCategoryIdBigInt: number | null | undefined = undefined;

      if (product.main_category_id !== undefined) {
        if (product.main_category_id === null) {
          mainCategoryIdBigInt = null;
        } else {
          const mainCategoryIdStr = product.main_category_id.toString();
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mainCategoryIdStr);
          
          if (isUUID) {
            // البحث عن code في unified_main_categories
            const { data: unifiedMainCategory } = await supabase
              .from('unified_main_categories')
              .select('code')
              .eq('id', mainCategoryIdStr)
              .single();
            
            if (unifiedMainCategory?.code) {
              // البحث عن bigint في product_main_categories
              const { data: oldMainCategory } = await supabase
                .from('product_main_categories')
                .select('id')
                .eq('code', unifiedMainCategory.code)
                .single();
              
              if (oldMainCategory) {
                mainCategoryIdBigInt = Number(oldMainCategory.id);
              }
            }
          } else {
            mainCategoryIdBigInt = Number(product.main_category_id);
          }
        }
      }

      if (product.sub_category_id !== undefined) {
        if (product.sub_category_id === null) {
          subCategoryIdBigInt = null;
        } else {
          const subCategoryIdStr = product.sub_category_id.toString();
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subCategoryIdStr);
          
          if (isUUID) {
            // البحث عن code في unified_sub_categories
            const { data: unifiedSubCategory } = await supabase
              .from('unified_sub_categories')
              .select('code')
              .eq('id', subCategoryIdStr)
              .single();
            
            if (unifiedSubCategory?.code) {
              // البحث عن bigint في product_sub_categories
              const { data: oldSubCategory } = await supabase
                .from('product_sub_categories')
                .select('id')
                .eq('code', unifiedSubCategory.code)
                .single();
              
              if (oldSubCategory) {
                subCategoryIdBigInt = Number(oldSubCategory.id);
              }
            }
          } else {
            subCategoryIdBigInt = Number(product.sub_category_id);
          }
        }
      }

      const productData: any = {
        ...product,
      };

      // إضافة bigint IDs فقط إذا تم تحديثها
      if (mainCategoryIdBigInt !== undefined) {
        productData.main_category_id = mainCategoryIdBigInt;
      }
      if (subCategoryIdBigInt !== undefined) {
        productData.sub_category_id = subCategoryIdBigInt;
      }

      const { data, error } = await supabase
        .from('catalog_products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('خطأ في تحديث المنتج:', error);
        toast.error(`حدث خطأ أثناء تحديث المنتج: ${error.message}`);
        return null;
      }

      toast.success('تم تحديث المنتج بنجاح');
      return data;
    } catch (error: any) {
      console.error('خطأ في تحديث المنتج:', error);
      toast.error(`حدث خطأ أثناء تحديث المنتج: ${error.message}`);
      return null;
    }
  }

  // جلب جميع المنتجات
  async getProducts(): Promise<ProductCatalogItem[]> {
    try {
      // الخطوة 1: جلب المنتجات من الكتالوج
      const { data: catalogItems, error: catalogError } = await supabase
        .from('catalog_products')
        .select(`
          *,
          warehouse:warehouses(name),
          unit:units(name)
        `)
        .order('created_at', { ascending: false });

      if (catalogError) {
        console.error('خطأ في جلب المنتجات:', catalogError);
        toast.error('حدث خطأ أثناء جلب المنتجات');
        return [];
      }

      if (!catalogItems || catalogItems.length === 0) {
        return [];
      }

      // الخطوة 2: جمع IDs الفئات القديمة
      const mainCategoryIds = new Set<number>();
      const subCategoryIds = new Set<number>();
      catalogItems.forEach(item => {
        if (item.main_category_id) mainCategoryIds.add(Number(item.main_category_id));
        if (item.sub_category_id) subCategoryIds.add(Number(item.sub_category_id));
      });

      // الخطوة 3: جلب الفئات من الجداول القديمة
      let oldMainCategories: any[] = [];
      let oldSubCategories: any[] = [];
      
      if (mainCategoryIds.size > 0) {
        const { data, error } = await supabase
          .from("product_main_categories")
          .select("id, code, name")
          .in("id", Array.from(mainCategoryIds));
        if (!error && data) {
          oldMainCategories = data;
        }
      }

      if (subCategoryIds.size > 0) {
        const { data, error } = await supabase
          .from("product_sub_categories")
          .select("id, code, name")
          .in("id", Array.from(subCategoryIds));
        if (!error && data) {
          oldSubCategories = data;
        }
      }

      // إنشاء maps للبحث السريع
      const oldMainCategoryMap = new Map(oldMainCategories.map(cat => [cat.id, cat]));
      const oldSubCategoryMap = new Map(oldSubCategories.map(cat => [cat.id, cat]));

      // الخطوة 4: جمع codes للبحث في الجداول الموحدة
      const mainCategoryCodes = new Set<string>();
      const subCategoryCodes = new Set<string>();
      oldMainCategories.forEach(cat => { if (cat.code) mainCategoryCodes.add(cat.code); });
      oldSubCategories.forEach(cat => { if (cat.code) subCategoryCodes.add(cat.code); });

      // الخطوة 5: جلب الفئات الموحدة
      let unifiedMainCategories: any[] = [];
      let unifiedSubCategories: any[] = [];
      
      if (mainCategoryCodes.size > 0) {
        const { data, error } = await supabase
          .from("unified_main_categories")
          .select("id, code, name, name_ar")
          .in("code", Array.from(mainCategoryCodes))
          .eq("is_active", true);
        if (!error && data) {
          unifiedMainCategories = data;
        }
      }

      if (subCategoryCodes.size > 0) {
        const { data, error } = await supabase
          .from("unified_sub_categories")
          .select("id, code, name, name_ar")
          .in("code", Array.from(subCategoryCodes))
          .eq("is_active", true);
        if (!error && data) {
          unifiedSubCategories = data;
        }
      }

      // إنشاء maps للبحث السريع
      const unifiedMainCategoryMap = new Map(unifiedMainCategories.map(cat => [cat.code, cat]));
      const unifiedSubCategoryMap = new Map(unifiedSubCategories.map(cat => [cat.code, cat]));

      // الخطوة 6: دمج البيانات
      const enrichedItems = catalogItems.map(item => {
        const oldMainCategory = item.main_category_id 
          ? oldMainCategoryMap.get(Number(item.main_category_id))
          : null;
        const oldSubCategory = item.sub_category_id
          ? oldSubCategoryMap.get(Number(item.sub_category_id))
          : null;

        const unifiedMainCategory = oldMainCategory?.code
          ? unifiedMainCategoryMap.get(oldMainCategory.code)
          : null;
        const unifiedSubCategory = oldSubCategory?.code
          ? unifiedSubCategoryMap.get(oldSubCategory.code)
          : null;

        return {
          ...item,
          main_category: unifiedMainCategory 
            ? { name: unifiedMainCategory.name, name_ar: unifiedMainCategory.name_ar }
            : (oldMainCategory ? { name: oldMainCategory.name, name_ar: oldMainCategory.name } : null),
          sub_category: unifiedSubCategory
            ? { name: unifiedSubCategory.name, name_ar: unifiedSubCategory.name_ar }
            : (oldSubCategory ? { name: oldSubCategory.name, name_ar: oldSubCategory.name } : null),
        };
      });

      return enrichedItems;
    } catch (error: any) {
      console.error('خطأ في جلب المنتجات:', error);
      toast.error('حدث خطأ أثناء جلب المنتجات');
      return [];
    }
  }

  // جلب منتج واحد
  async getProduct(id: number): Promise<ProductCatalogItem | null> {
    try {
      const { data, error } = await supabase
        .from('catalog_products')
        .select(`
          *,
          warehouse:warehouses(name),
          main_category:unified_main_categories(name, name_ar),
          sub_category:unified_sub_categories(name, name_ar),
          unit:units(name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('خطأ في جلب المنتج:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      console.error('خطأ في جلب المنتج:', error);
      return null;
    }
  }

  // حذف منتج
  async deleteProduct(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('catalog_products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('خطأ في حذف المنتج:', error);
        toast.error(`حدث خطأ أثناء حذف المنتج: ${error.message}`);
        return false;
      }

      toast.success('تم حذف المنتج بنجاح');
      return true;
    } catch (error: any) {
      console.error('خطأ في حذف المنتج:', error);
      toast.error(`حدث خطأ أثناء حذف المنتج: ${error.message}`);
      return false;
    }
  }

  // جلب الفئات الأساسية من الجداول الموحدة
  async getMainCategories(): Promise<ProductMainCategory[]> {
    try {
      console.log('🔍 جلب الفئات الأساسية من unified_main_categories...');
      const { data, error } = await supabase
        .from('unified_main_categories')
        .select('id, code, name, name_ar, item_type')
        .in('item_type', ['product', 'both'])
        .eq('is_active', true)
        .order('name_ar', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ خطأ في جلب الفئات الأساسية:', error);
        return [];
      }

      console.log(`✅ تم جلب ${data?.length || 0} فئة أساسية من unified_main_categories`);
      console.log('📋 الفئات:', data);

      // تحويل البيانات إلى الشكل المتوقع
      return (data || []).map(cat => ({
        id: cat.id, // استخدام UUID مباشرة
        code: cat.code,
        name: cat.name_ar || cat.name,
      }));
    } catch (error: any) {
      console.error('❌ خطأ في جلب الفئات الأساسية:', error);
      return [];
    }
  }

  // جلب الفئات الفرعية من الجداول الموحدة
  async getSubCategories(mainCategoryId?: number): Promise<ProductSubCategory[]> {
    try {
      let query = supabase
        .from('unified_sub_categories')
        .select('id, code, name, name_ar, main_category_id, item_type')
        .in('item_type', ['product', 'both'])
        .eq('is_active', true)
        .order('name');

      if (mainCategoryId) {
        // البحث عن main_category_id في unified_main_categories أولاً
        const { data: mainCategory } = await supabase
          .from('unified_main_categories')
          .select('id')
          .eq('id', mainCategoryId.toString())
          .single();
        
        if (mainCategory) {
          query = query.eq('main_category_id', mainCategory.id);
        } else {
          // محاولة البحث باستخدام mainCategoryId مباشرة
          query = query.eq('main_category_id', mainCategoryId.toString());
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('خطأ في جلب الفئات الفرعية:', error);
        return [];
      }

      // تحويل البيانات إلى الشكل المتوقع
      return (data || []).map(cat => ({
        id: cat.id, // استخدام UUID مباشرة
        code: cat.code,
        name: cat.name_ar || cat.name,
        main_id: cat.main_category_id, // استخدام UUID مباشرة
      }));
    } catch (error: any) {
      console.error('خطأ في جلب الفئات الفرعية:', error);
      return [];
    }
  }

  // جلب الوحدات
  async getUnits(): Promise<Unit[]> {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name');

      if (error) {
        console.error('خطأ في جلب الوحدات:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('خطأ في جلب الوحدات:', error);
      return [];
    }
  }

  // إضافة فئة أساسية جديدة - ملاحظة: يجب استخدام unifiedCategoriesService لإضافة فئات جديدة
  // هذه الدالة محفوظة للتوافق الخلفي فقط
  async addMainCategory(code: string, name: string): Promise<ProductMainCategory | null> {
    try {
      toast.error('يرجى استخدام صفحة إدارة التنظيم والتسلسل لإضافة فئات جديدة');
      console.warn('addMainCategory deprecated - use unifiedCategoriesService instead');
      return null;
    } catch (error: any) {
      console.error('خطأ في إضافة الفئة الأساسية:', error);
      return null;
    }
  }

  // إضافة فئة فرعية جديدة - ملاحظة: يجب استخدام unifiedCategoriesService لإضافة فئات جديدة
  // هذه الدالة محفوظة للتوافق الخلفي فقط
  async addSubCategory(code: string, name: string, mainId: number): Promise<ProductSubCategory | null> {
    try {
      toast.error('يرجى استخدام صفحة إدارة التنظيم والتسلسل لإضافة فئات جديدة');
      console.warn('addSubCategory deprecated - use unifiedCategoriesService instead');
      return null;
    } catch (error: any) {
      console.error('خطأ في إضافة الفئة الفرعية:', error);
      return null;
    }
  }

  // تحديث فئة أساسية - ملاحظة: يجب استخدام unifiedCategoriesService لتحديث فئات
  // هذه الدالة محفوظة للتوافق الخلفي فقط
  async updateMainCategory(id: number | string, code: string, name: string): Promise<ProductMainCategory | null> {
    try {
      const { data, error } = await supabase
        .from('unified_main_categories')
        .update({ code, name, name_ar: name })
        .eq('id', id.toString())
        .select('id, code, name, name_ar')
        .single();

      if (error) {
        console.error('خطأ في تحديث الفئة الأساسية:', error);
        toast.error(`حدث خطأ أثناء تحديث الفئة: ${error.message}`);
        return null;
      }

      toast.success('تم تحديث الفئة الأساسية بنجاح');
      return {
        id: data.id,
        code: data.code,
        name: data.name_ar || data.name,
      };
    } catch (error: any) {
      console.error('خطأ في تحديث الفئة الأساسية:', error);
      toast.error(`حدث خطأ أثناء تحديث الفئة: ${error.message}`);
      return null;
    }
  }

  // حذف فئة أساسية - ملاحظة: يجب استخدام unifiedCategoriesService لحذف فئات
  async deleteMainCategory(id: number | string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('unified_main_categories')
        .update({ is_active: false })
        .eq('id', id.toString());

      if (error) {
        console.error('خطأ في حذف الفئة الأساسية:', error);
        toast.error(`حدث خطأ أثناء حذف الفئة: ${error.message}`);
        return false;
      }

      toast.success('تم حذف الفئة الأساسية بنجاح');
      return true;
    } catch (error: any) {
      console.error('خطأ في حذف الفئة الأساسية:', error);
      toast.error(`حدث خطأ أثناء حذف الفئة: ${error.message}`);
      return false;
    }
  }

  // تحديث فئة فرعية - ملاحظة: يجب استخدام unifiedCategoriesService لتحديث فئات
  async updateSubCategory(id: number | string, code: string, name: string, mainId: number | string): Promise<ProductSubCategory | null> {
    try {
      const { data, error } = await supabase
        .from('unified_sub_categories')
        .update({ code, name, name_ar: name, main_category_id: mainId.toString() })
        .eq('id', id.toString())
        .select('id, code, name, name_ar, main_category_id')
        .single();

      if (error) {
        console.error('خطأ في تحديث الفئة الفرعية:', error);
        toast.error(`حدث خطأ أثناء تحديث الفئة الفرعية: ${error.message}`);
        return null;
      }

      toast.success('تم تحديث الفئة الفرعية بنجاح');
      return {
        id: data.id,
        code: data.code,
        name: data.name_ar || data.name,
        main_id: data.main_category_id,
      };
    } catch (error: any) {
      console.error('خطأ في تحديث الفئة الفرعية:', error);
      toast.error(`حدث خطأ أثناء تحديث الفئة الفرعية: ${error.message}`);
      return null;
    }
  }

  // حذف فئة فرعية - ملاحظة: يجب استخدام unifiedCategoriesService لحذف فئات
  async deleteSubCategory(id: number | string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('unified_sub_categories')
        .update({ is_active: false })
        .eq('id', id.toString());

      if (error) {
        console.error('خطأ في حذف الفئة الفرعية:', error);
        toast.error(`حدث خطأ أثناء حذف الفئة الفرعية: ${error.message}`);
        return false;
      }

      toast.success('تم حذف الفئة الفرعية بنجاح');
      return true;
    } catch (error: any) {
      console.error('خطأ في حذف الفئة الفرعية:', error);
      toast.error(`حدث خطأ أثناء حذف الفئة الفرعية: ${error.message}`);
      return false;
    }
  }

  // إضافة وحدة جديدة
  async addUnit(code: string, name: string): Promise<Unit | null> {
    try {
      const { data, error } = await supabase
        .from('units')
        .insert([{ code, name }])
        .select()
        .single();

      if (error) {
        console.error('خطأ في إضافة الوحدة:', error);
        toast.error(`حدث خطأ أثناء إضافة الوحدة: ${error.message}`);
        return null;
      }

      toast.success('تم إضافة الوحدة بنجاح');
      return data;
    } catch (error: any) {
      console.error('خطأ في إضافة الوحدة:', error);
      toast.error(`حدث خطأ أثناء إضافة الوحدة: ${error.message}`);
      return null;
    }
  }

  // تحديث وحدة
  async updateUnit(id: number, code: string, name: string): Promise<Unit | null> {
    try {
      const { data, error } = await supabase
        .from('units')
        .update({ code, name })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('خطأ في تحديث الوحدة:', error);
        toast.error(`حدث خطأ أثناء تحديث الوحدة: ${error.message}`);
        return null;
      }

      toast.success('تم تحديث الوحدة بنجاح');
      return data;
    } catch (error: any) {
      console.error('خطأ في تحديث الوحدة:', error);
      toast.error(`حدث خطأ أثناء تحديث الوحدة: ${error.message}`);
      return null;
    }
  }

  // حذف وحدة
  async deleteUnit(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('خطأ في حذف الوحدة:', error);
        toast.error(`حدث خطأ أثناء حذف الوحدة: ${error.message}`);
        return false;
      }

      toast.success('تم حذف الوحدة بنجاح');
      return true;
    } catch (error: any) {
      console.error('خطأ في حذف الوحدة:', error);
      toast.error(`حدث خطأ أثناء حذف الوحدة: ${error.message}`);
      return false;
    }
  }

  // التحقق من وجود SKU
  async checkSKUExists(sku: string, excludeId?: number): Promise<boolean> {
    try {
      let query = supabase
        .from('catalog_products')
        .select('id')
        .eq('sku', sku);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query.limit(1);

      if (error) {
        console.error('خطأ في التحقق من SKU:', error);
        return false;
      }

      return (data && data.length > 0);
    } catch (error: any) {
      console.error('خطأ في التحقق من SKU:', error);
      return false;
    }
  }

  // التحقق من وجود كود المنتج
  async checkProductCodeExists(productCode: string, excludeId?: number): Promise<boolean> {
    try {
      let query = supabase
        .from('catalog_products')
        .select('id')
        .eq('product_code', productCode);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query.limit(1);

      if (error) {
        console.error('خطأ في التحقق من كود المنتج:', error);
        return false;
      }

      return (data && data.length > 0);
    } catch (error: any) {
      console.error('خطأ في التحقق من كود المنتج:', error);
      return false;
    }
  }

  // توليد SKU فريد
  async generateUniqueSKU(): Promise<string> {
    let sku: string;
    let exists = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (exists && attempts < maxAttempts) {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      sku = `SKU-${timestamp}-${random}`;
      
      exists = await this.checkSKUExists(sku);
      attempts++;
    }

    if (exists) {
      throw new Error('فشل في توليد SKU فريد');
    }

    return sku!;
  }

  // توليد كود منتج فريد
  async generateUniqueProductCode(): Promise<string> {
    let productCode: string;
    let exists = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (exists && attempts < maxAttempts) {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      productCode = `PRD-${timestamp}-${random}`;
      
      exists = await this.checkProductCodeExists(productCode);
      attempts++;
    }

    if (exists) {
      throw new Error('فشل في توليد كود منتج فريد');
    }

    return productCode!;
  }

  // توليد كود منتج تسلسلي (PRD001, PRD002, ...)
  async generateSequentialProductCode(excludeCodes: string[] = []): Promise<string> {
    try {
      // جلب آخر أكواد SKU من جدول catalog_products
      const { data: catalogProducts, error: catalogError } = await supabase!
        .from('catalog_products')
        .select('sku')
        .not('sku', 'is', null)
        .like('sku', 'PRD%')
        .order('id', { ascending: false })
        .limit(100);

      if (catalogError) {
        console.error('خطأ في جلب بيانات catalog_products:', catalogError);
      }

      // جلب آخر أكواد SKU من جدول store_products
      const { data: storeProducts, error: storeError } = await supabase!
        .from('store_products')
        .select('sku')
        .not('sku', 'is', null)
        .like('sku', 'PRD%')
        .order('created_at', { ascending: false })
        .limit(100);

      if (storeError) {
        console.error('خطأ في جلب بيانات store_products:', storeError);
      }

      // دمج جميع الأكواد من كلا الجدولين
      const allCodes: string[] = [];
      if (catalogProducts) {
        catalogProducts.forEach(p => {
          if (p.sku) allCodes.push(p.sku);
        });
      }
      if (storeProducts) {
        storeProducts.forEach(p => {
          if (p.sku) allCodes.push(p.sku);
        });
      }

      let nextNumber = 1;
      
      if (allCodes.length > 0) {
        // استخراج الأرقام من الأكواد الموجودة (PRD001, PRD002, ...)
        const numbers = allCodes
          .filter(code => code && code.match(/^PRD\d+$/i))
          .map(code => {
            const match = code!.match(/^PRD(\d+)$/i);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter(num => !isNaN(num) && num > 0);

        if (numbers.length > 0) {
          nextNumber = Math.max(...numbers) + 1;
        }
      }

      // البحث عن أول كود متاح
      let searchNumber = nextNumber;
      while (searchNumber < nextNumber + 1000) {
        const testCode = `PRD${searchNumber.toString().padStart(3, '0')}`;
        
        // التحقق من أن الكود غير موجود في القائمة المستبعدة
        if (excludeCodes.includes(testCode)) {
          searchNumber++;
          continue;
        }
        
        // التحقق من وجود الكود في كلا الجدولين
        const existsInCatalog = await this.checkSKUExists(testCode);
        const existsInStore = await this.checkSKUInStoreProducts(testCode);
        
        if (!existsInCatalog && !existsInStore) {
          return testCode;
        }
        
        searchNumber++;
      }
      
      throw new Error('فشل في توليد كود منتج فريد - تم تجاوز الحد الأقصى للمحاولات');
    } catch (error: any) {
      console.error('خطأ في توليد الكود التسلسلي:', error);
      throw error;
    }
  }

  // التحقق من وجود SKU في جدول store_products
  async checkSKUInStoreProducts(sku: string): Promise<boolean> {
    try {
      const { data, error } = await supabase!
        .from('store_products')
        .select('id')
        .eq('sku', sku)
        .limit(1);

      if (error) {
        console.error('خطأ في التحقق من SKU في store_products:', error);
        return false;
      }

      return (data && data.length > 0);
    } catch (error: any) {
      console.error('خطأ في التحقق من SKU في store_products:', error);
      return false;
    }
  }

  // إضافة نوع منتج جديد
  async addProductType(name: string): Promise<{ id: number; name: string } | null> {
    try {
      const { data, error } = await supabase
        .from('warehouse_product_types')
        .insert([{ name }])
        .select('id, name')
        .single();

      if (error) {
        console.error('خطأ في إضافة نوع المنتج:', error);
        // إرجاع نوع منتج مؤقت في حالة عدم وجود الجدول
        return { id: Date.now(), name };
      }

      return data;
    } catch (error: any) {
      console.error('خطأ في إضافة نوع المنتج:', error);
      // إرجاع نوع منتج مؤقت في حالة الخطأ
      return { id: Date.now(), name };
    }
  }

  // جلب المخازن
  async getWarehouses(): Promise<{ id: number; name: string }[]> {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('خطأ في جلب المخازن:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('خطأ في جلب المخازن:', error);
      return [];
    }
  }

  // جلب أنواع المنتجات
  async getProductTypes(): Promise<{ id: number; name: string }[]> {
    try {
      const { data, error } = await supabase
        .from('warehouse_product_types')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('خطأ في جلب أنواع المنتجات:', error);
        // إرجاع قائمة افتراضية في حالة عدم وجود الجدول
        return [
          { id: 1, name: 'إلكترونيات' },
          { id: 2, name: 'ملابس' },
          { id: 3, name: 'أدوات منزلية' },
          { id: 4, name: 'مستحضرات تجميل' },
          { id: 5, name: 'منظفات' },
          { id: 6, name: 'كوزمتكس' }
        ];
      }

      return data || [];
    } catch (error: any) {
      console.error('خطأ في جلب أنواع المنتجات:', error);
      // إرجاع قائمة افتراضية في حالة الخطأ
      return [
        { id: 1, name: 'إلكترونيات' },
        { id: 2, name: 'ملابس' },
        { id: 3, name: 'أدوات منزلية' },
        { id: 4, name: 'مستحضرات تجميل' },
        { id: 5, name: 'منظفات' },
        { id: 6, name: 'كوزمتكس' }
      ];
    }
  }

  // جلب البراندز
  // تحديث براند
  async updateBrand(id: number, name: string, description?: string): Promise<{ id: number; name: string; description?: string } | null> {
    try {
      const { data, error } = await supabase
        .from('brands')
        .update({ name, description: description || null })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('خطأ في تحديث البراند:', error);
        toast.error(`حدث خطأ أثناء تحديث البراند: ${error.message}`);
        return null;
      }

      toast.success('تم تحديث البراند بنجاح');
      return data;
    } catch (error: any) {
      console.error('خطأ في تحديث البراند:', error);
      toast.error(`حدث خطأ أثناء تحديث البراند: ${error.message}`);
      return null;
    }
  }

  // حذف براند
  async deleteBrand(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('خطأ في حذف البراند:', error);
        toast.error(`حدث خطأ أثناء حذف البراند: ${error.message}`);
        return false;
      }

      toast.success('تم حذف البراند بنجاح');
      return true;
    } catch (error: any) {
      console.error('خطأ في حذف البراند:', error);
      toast.error(`حدث خطأ أثناء حذف البراند: ${error.message}`);
      return false;
    }
  }

  async getBrands(): Promise<{ id: number; name: string; logo_url?: string; logo_path?: string; description?: string }[]> {
    try {
      const { data, error } = await supabase
        .from('warehouse_product_brands')
        .select('id, name, logo_url, logo_path, description')
        .order('name');

      if (error) {
        console.error('خطأ في جلب البراندز:', error);
        // إرجاع قائمة افتراضية في حالة عدم وجود الجدول
        return [
          { id: 1, name: 'برسيل', description: 'منظفات ومنتجات العناية بالمنزل' },
          { id: 2, name: 'أريال', description: 'منظفات الغسيل والعناية بالملابس' },
          { id: 3, name: 'فيري', description: 'منظفات الأطباق والمنزل' },
          { id: 4, name: 'دوف', description: 'منتجات العناية الشخصية' },
          { id: 5, name: 'شامبو', description: 'منتجات العناية بالشعر' },
          { id: 6, name: 'كولجيت', description: 'منتجات العناية بالفم والأسنان' },
          { id: 7, name: 'نيفيا', description: 'منتجات العناية بالبشرة' },
          { id: 8, name: 'جونسون', description: 'منتجات العناية بالأطفال' },
          { id: 9, name: 'بيبسي', description: 'المشروبات الغازية' },
          { id: 10, name: 'كوكا كولا', description: 'المشروبات الغازية' }
        ];
      }

      return data || [];
    } catch (error: any) {
      console.error('خطأ في جلب البراندز:', error);
      // إرجاع قائمة افتراضية في حالة الخطأ
      return [
        { id: 1, name: 'برسيل', description: 'منظفات ومنتجات العناية بالمنزل' },
        { id: 2, name: 'أريال', description: 'منظفات الغسيل والعناية بالملابس' },
        { id: 3, name: 'فيري', description: 'منظفات الأطباق والمنزل' },
        { id: 4, name: 'دوف', description: 'منتجات العناية الشخصية' },
        { id: 5, name: 'شامبو', description: 'منتجات العناية بالشعر' },
        { id: 6, name: 'كولجيت', description: 'منتجات العناية بالفم والأسنان' },
        { id: 7, name: 'نيفيا', description: 'منتجات العناية بالبشرة' },
        { id: 8, name: 'جونسون', description: 'منتجات العناية بالأطفال' },
        { id: 9, name: 'بيبسي', description: 'المشروبات الغازية' },
        { id: 10, name: 'كوكا كولا', description: 'المشروبات الغازية' }
      ];
    }
  }

  // إضافة براند جديد
  async addBrand(name: string, logoFile?: File, description?: string): Promise<{ id: number; name: string; logo_url?: string; logo_path?: string; description?: string } | null> {
    try {
      let logoUrl: string | undefined;
      let logoPath: string | undefined;

      // رفع الصورة إذا تم توفيرها
      if (logoFile) {
        try {
          const fileExt = logoFile.name.split('.').pop();
          const fileName = `brand-${Date.now()}.${fileExt}`;
          const filePath = `brands/${fileName}`;

          // محاولة إنشاء bucket إذا لم يكن موجوداً
          const { data: buckets } = await supabase.storage.listBuckets();
          const bucketExists = buckets?.some(bucket => bucket.name === 'brand-logos');
          
          if (!bucketExists) {
            console.log('إنشاء bucket جديد للبراندز...');
            const { error: createError } = await supabase.storage.createBucket('brand-logos', {
              public: true,
              allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
              fileSizeLimit: 5242880 // 5MB
            });
            
            if (createError) {
              console.error('خطأ في إنشاء bucket:', createError);
              // المتابعة بدون الصورة
            } else {
              // إنشاء السياسات الأمنية للـ bucket الجديد
              console.log('إنشاء السياسات الأمنية...');
              try {
                // سياسة للقراءة العامة
                await supabase.rpc('exec_sql', {
                  sql_query: `
                    CREATE POLICY "Public Access" ON storage.objects
                    FOR SELECT USING (bucket_id = 'brand-logos');
                  `
                });
                
                // سياسة للرفع
                await supabase.rpc('exec_sql', {
                  sql_query: `
                    CREATE POLICY "Authenticated users can upload" ON storage.objects
                    FOR INSERT WITH CHECK (
                      bucket_id = 'brand-logos' 
                      AND auth.role() = 'authenticated'
                    );
                  `
                });
                
                // سياسة للتحديث
                await supabase.rpc('exec_sql', {
                  sql_query: `
                    CREATE POLICY "Authenticated users can update" ON storage.objects
                    FOR UPDATE USING (
                      bucket_id = 'brand-logos' 
                      AND auth.role() = 'authenticated'
                    );
                  `
                });
                
                // سياسة للحذف
                await supabase.rpc('exec_sql', {
                  sql_query: `
                    CREATE POLICY "Authenticated users can delete" ON storage.objects
                    FOR DELETE USING (
                      bucket_id = 'brand-logos' 
                      AND auth.role() = 'authenticated'
                    );
                  `
                });
                
                console.log('تم إنشاء السياسات الأمنية بنجاح');
              } catch (policyError) {
                console.error('خطأ في إنشاء السياسات الأمنية:', policyError);
              }
            }
          }

          // رفع الملف إلى Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('brand-logos')
            .upload(filePath, logoFile);

          if (uploadError) {
            console.error('خطأ في رفع الصورة:', uploadError);
            
            // إذا كان الخطأ متعلق بالسياسات الأمنية، حاول إنشاء سياسة عامة
            if (uploadError.message?.includes('row-level security policy') || uploadError.message?.includes('RLS')) {
              console.log('محاولة إنشاء سياسة عامة للرفع...');
              try {
                await supabase.rpc('exec_sql', {
                  sql_query: `
                    DROP POLICY IF EXISTS "Public upload" ON storage.objects;
                    CREATE POLICY "Public upload" ON storage.objects
                    FOR INSERT WITH CHECK (bucket_id = 'brand-logos');
                  `
                });
                
                // محاولة الرفع مرة أخرى
                const { data: retryUploadData, error: retryUploadError } = await supabase.storage
                  .from('brand-logos')
                  .upload(filePath, logoFile);
                
                if (!retryUploadError && retryUploadData) {
                  const { data: urlData } = supabase.storage
                    .from('brand-logos')
                    .getPublicUrl(filePath);
                  
                  logoUrl = urlData.publicUrl;
                  logoPath = filePath;
                  console.log('تم رفع الصورة بنجاح بعد إصلاح السياسات:', logoUrl);
                } else {
                  console.log('فشل في رفع الصورة حتى بعد إصلاح السياسات');
                }
              } catch (policyFixError) {
                console.error('خطأ في إصلاح السياسات:', policyFixError);
              }
            }
            
            // إذا لم يتم رفع الصورة بنجاح، المتابعة بدون صورة
            if (!logoUrl) {
              console.log('سيتم إضافة البراند بدون صورة');
            }
          } else {
            // الحصول على رابط عام للصورة
            const { data: urlData } = supabase.storage
              .from('brand-logos')
              .getPublicUrl(filePath);

            logoUrl = urlData.publicUrl;
            logoPath = filePath;
            console.log('تم رفع الصورة بنجاح:', logoUrl);
          }
        } catch (storageError) {
          console.error('خطأ في معالجة الصورة:', storageError);
          // المتابعة بدون الصورة
        }
      }

      // إضافة البراند إلى قاعدة البيانات
      const { data, error } = await supabase
        .from('warehouse_product_brands')
        .insert([{ name, logo_url: logoUrl, logo_path: logoPath, description }])
        .select('id, name, logo_url, logo_path, description')
        .single();

      if (error) {
        console.error('خطأ في إضافة البراند:', error);
        // إرجاع براند مؤقت في حالة عدم وجود الجدول
        return { id: Date.now(), name, logo_url: logoUrl, logo_path: logoPath, description };
      }

      return data;
    } catch (error: any) {
      console.error('خطأ في إضافة البراند:', error);
      // إرجاع براند مؤقت في حالة الخطأ
      return { id: Date.now(), name, description };
    }
  }
}

export const productCatalogService = new ProductCatalogService();
