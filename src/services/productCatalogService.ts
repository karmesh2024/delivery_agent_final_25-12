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
  id: number;
  code: string;
  name: string;
}

export interface ProductSubCategory {
  id: number;
  code: string;
  name: string;
  main_id: number;
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
      const { data, error } = await supabase
        .from('catalog_products')
        .insert([product])
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
      const { data, error } = await supabase
        .from('catalog_products')
        .update(product)
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
      const { data, error } = await supabase
        .from('catalog_products')
        .select(`
          *,
          warehouse:warehouses(name),
          main_category:product_main_categories(name),
          sub_category:product_sub_categories(name),
          unit:units(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب المنتجات:', error);
        toast.error('حدث خطأ أثناء جلب المنتجات');
        return [];
      }

      return data || [];
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
          main_category:product_main_categories(name),
          sub_category:product_sub_categories(name),
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

  // جلب الفئات الأساسية
  async getMainCategories(): Promise<ProductMainCategory[]> {
    try {
      const { data, error } = await supabase
        .from('product_main_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('خطأ في جلب الفئات الأساسية:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('خطأ في جلب الفئات الأساسية:', error);
      return [];
    }
  }

  // جلب الفئات الفرعية
  async getSubCategories(mainCategoryId?: number): Promise<ProductSubCategory[]> {
    try {
      let query = supabase
        .from('product_sub_categories')
        .select('*')
        .order('name');

      if (mainCategoryId) {
        query = query.eq('main_id', mainCategoryId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('خطأ في جلب الفئات الفرعية:', error);
        return [];
      }

      return data || [];
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

  // إضافة فئة أساسية جديدة
  async addMainCategory(code: string, name: string): Promise<ProductMainCategory | null> {
    try {
      const { data, error } = await supabase
        .from('product_main_categories')
        .insert([{ code, name }])
        .select()
        .single();

      if (error) {
        console.error('خطأ في إضافة الفئة الأساسية:', error);
        toast.error(`حدث خطأ أثناء إضافة الفئة: ${error.message}`);
        return null;
      }

      toast.success('تم إضافة الفئة الأساسية بنجاح');
      return data;
    } catch (error: any) {
      console.error('خطأ في إضافة الفئة الأساسية:', error);
      toast.error(`حدث خطأ أثناء إضافة الفئة: ${error.message}`);
      return null;
    }
  }

  // إضافة فئة فرعية جديدة
  async addSubCategory(code: string, name: string, mainId: number): Promise<ProductSubCategory | null> {
    try {
      const { data, error } = await supabase
        .from('product_sub_categories')
        .insert([{ code, name, main_id: mainId }])
        .select()
        .single();

      if (error) {
        console.error('خطأ في إضافة الفئة الفرعية:', error);
        toast.error(`حدث خطأ أثناء إضافة الفئة الفرعية: ${error.message}`);
        return null;
      }

      toast.success('تم إضافة الفئة الفرعية بنجاح');
      return data;
    } catch (error: any) {
      console.error('خطأ في إضافة الفئة الفرعية:', error);
      toast.error(`حدث خطأ أثناء إضافة الفئة الفرعية: ${error.message}`);
      return null;
    }
  }

  // تحديث فئة أساسية
  async updateMainCategory(id: number, code: string, name: string): Promise<ProductMainCategory | null> {
    try {
      const { data, error } = await supabase
        .from('product_main_categories')
        .update({ code, name })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('خطأ في تحديث الفئة الأساسية:', error);
        toast.error(`حدث خطأ أثناء تحديث الفئة: ${error.message}`);
        return null;
      }

      toast.success('تم تحديث الفئة الأساسية بنجاح');
      return data;
    } catch (error: any) {
      console.error('خطأ في تحديث الفئة الأساسية:', error);
      toast.error(`حدث خطأ أثناء تحديث الفئة: ${error.message}`);
      return null;
    }
  }

  // حذف فئة أساسية
  async deleteMainCategory(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_main_categories')
        .delete()
        .eq('id', id);

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

  // تحديث فئة فرعية
  async updateSubCategory(id: number, code: string, name: string, mainId: number): Promise<ProductSubCategory | null> {
    try {
      const { data, error } = await supabase
        .from('product_sub_categories')
        .update({ code, name, main_id: mainId })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('خطأ في تحديث الفئة الفرعية:', error);
        toast.error(`حدث خطأ أثناء تحديث الفئة الفرعية: ${error.message}`);
        return null;
      }

      toast.success('تم تحديث الفئة الفرعية بنجاح');
      return data;
    } catch (error: any) {
      console.error('خطأ في تحديث الفئة الفرعية:', error);
      toast.error(`حدث خطأ أثناء تحديث الفئة الفرعية: ${error.message}`);
      return null;
    }
  }

  // حذف فئة فرعية
  async deleteSubCategory(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_sub_categories')
        .delete()
        .eq('id', id);

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
