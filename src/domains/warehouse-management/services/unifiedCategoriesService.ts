import { supabase } from "@/lib/supabase";
import { toast } from "react-toastify";

// =====================================================
// أنواع البيانات
// =====================================================

export type ItemType = "product" | "waste" | "both";

export interface UnifiedSector {
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UnifiedClassification {
  id: string;
  sector_id: string;
  name: string;
  name_ar?: string;
  description?: string;
  item_type: ItemType;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  sector?: UnifiedSector;
  available_units?: ClassificationUnit[];
  available_brands?: ClassificationBrand[];
}

export interface UnifiedMainCategory {
  id: string;
  classification_id: string;
  code: string;
  name: string;
  name_ar?: string;
  description?: string;
  item_type: ItemType;
  parent_id?: string | null;
  level: number;
  path: string;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  classification?: UnifiedClassification;
  parent?: UnifiedMainCategory;
  children?: UnifiedMainCategory[];
  sub_categories?: UnifiedSubCategory[];
  available_brands?: UnifiedBrand[];
}

export interface UnifiedSubCategory {
  id: string;
  main_category_id: string;
  code: string;
  name: string;
  name_ar?: string;
  description?: string;
  item_type: ItemType;
  parent_id?: string | null;
  level: number;
  path: string;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  main_category?: UnifiedMainCategory;
  parent?: UnifiedSubCategory;
  children?: UnifiedSubCategory[];
  available_brands?: UnifiedBrand[];
}

export interface UnifiedBrand {
  id: string;
  name_ar: string;
  name_en?: string;
  logo_url?: string;
  logo_path?: string;
  description_ar?: string;
  description_en?: string;
  website?: string;
  item_type?: ItemType; // نوع البراند: product, waste, both
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ClassificationUnit {
  id: string;
  classification_id: string;
  unit_id: number;
  is_default: boolean;
  sort_order: number;
  unit?: {
    id: number;
    code: string;
    name: string;
  };
}

export interface ClassificationBrand {
  id: string;
  classification_id: string;
  brand_id: string;
  is_default: boolean;
  sort_order: number;
  brand?: UnifiedBrand;
}

// =====================================================
// Service للتعامل مع الجداول الموحدة
// =====================================================

export const unifiedCategoriesService = {
  // =====================================================
  // القطاعات (Sectors)
  // =====================================================

  /**
   * جلب جميع القطاعات
   */
  async getSectors(): Promise<UnifiedSector[]> {
    try {
      const { data, error } = await supabase
        .from("warehouse_sectors")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error("خطأ في جلب القطاعات:", error);
      toast.error("فشل في جلب القطاعات");
      return [];
    }
  },

  // =====================================================
  // التصنيفات (Classifications)
  // =====================================================

  /**
   * جلب جميع التصنيفات
   */
  async getClassifications(): Promise<UnifiedClassification[]> {
    try {
      const { data, error } = await supabase
        .from("unified_classifications")
        .select(`
          *,
          sector:warehouse_sectors(*)
        `)
        .eq("is_active", true)
        .order("sort_order, name");

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error("خطأ في جلب التصنيفات:", error);
      toast.error("فشل في جلب التصنيفات");
      return [];
    }
  },

  /**
   * جلب التصنيفات حسب القطاع
   */
  async getClassificationsBySector(
    sectorId: string
  ): Promise<UnifiedClassification[]> {
    try {
      const { data, error } = await supabase
        .from("unified_classifications")
        .select(`
          *,
          sector:warehouse_sectors(*),
          classification_units(
            *,
            units:unit_id(*)
          ),
          classification_brands(
            *,
            brands:brand_id(*)
          )
        `)
        .eq("sector_id", sectorId)
        .eq("is_active", true)
        .order("sort_order, name");

      if (error) throw error;

      // تحويل البيانات إلى الشكل المطلوب
      return (data || []).map((item: any) => ({
        ...item,
        available_units: item.classification_units?.map((cu: any) => ({
          ...cu,
          unit: cu.units,
        })) || [],
        available_brands: item.classification_brands?.map((cb: any) => ({
          ...cb,
          brand: cb.brands,
        })) || [],
      }));
    } catch (error: any) {
      console.error("خطأ في جلب التصنيفات حسب القطاع:", error);
      toast.error("فشل في جلب التصنيفات");
      return [];
    }
  },

  /**
   * جلب تصنيف واحد
   */
  async getClassification(
    classificationId: string
  ): Promise<UnifiedClassification | null> {
    try {
      const { data, error } = await supabase
        .from("unified_classifications")
        .select(`
          *,
          sector:warehouse_sectors(*),
          classification_units(
            *,
            units:unit_id(*)
          ),
          classification_brands(
            *,
            brands:brand_id(*)
          )
        `)
        .eq("id", classificationId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        available_units: data.classification_units?.map((cu: any) => ({
          ...cu,
          unit: cu.units,
        })) || [],
        available_brands: data.classification_brands?.map((cb: any) => ({
          ...cb,
          brand: cb.brands,
        })) || [],
      };
    } catch (error: any) {
      console.error("خطأ في جلب التصنيف:", error);
      toast.error("فشل في جلب التصنيف");
      return null;
    }
  },

  /**
   * إضافة تصنيف جديد
   */
  async addClassification(
    classification: Omit<UnifiedClassification, "id" | "created_at" | "updated_at">
  ): Promise<UnifiedClassification | null> {
    try {
      const { data, error } = await supabase
        .from("unified_classifications")
        .insert(classification)
        .select(`
          *,
          sector:warehouse_sectors(*)
        `)
        .single();

      if (error) throw error;
      toast.success("تم إضافة التصنيف بنجاح");
      return data;
    } catch (error: any) {
      console.error("خطأ في إضافة التصنيف:", error);
      toast.error(error.message || "فشل في إضافة التصنيف");
      return null;
    }
  },

  /**
   * تحديث تصنيف
   */
  async updateClassification(
    id: string,
    updates: Partial<UnifiedClassification>
  ): Promise<UnifiedClassification | null> {
    try {
      const { data, error } = await supabase
        .from("unified_classifications")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          sector:warehouse_sectors(*)
        `)
        .single();

      if (error) throw error;
      toast.success("تم تحديث التصنيف بنجاح");
      return data;
    } catch (error: any) {
      console.error("خطأ في تحديث التصنيف:", error);
      toast.error(error.message || "فشل في تحديث التصنيف");
      return null;
    }
  },

  /**
   * حذف تصنيف
   */
  async deleteClassification(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("unified_classifications")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("تم حذف التصنيف بنجاح");
      return true;
    } catch (error: any) {
      console.error("خطأ في حذف التصنيف:", error);
      toast.error(error.message || "فشل في حذف التصنيف");
      return false;
    }
  },

  // =====================================================
  // الفئات الأساسية (Main Categories)
  // =====================================================

  /**
   * توليد كود فريد غير متكرر لفئة أساسية جديدة
   */
  async getNextMainCategoryCode(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("unified_main_categories")
        .select("code");

      if (error) throw error;

      const codes = (data || []).map((r: { code: string }) => r.code);
      const prefix = "MAIN-";
      const numericParts = codes
        .filter((c) => c && c.startsWith(prefix))
        .map((c) => parseInt(c.replace(prefix, ""), 10))
        .filter((n) => !isNaN(n));
      const nextNum = numericParts.length > 0 ? Math.max(...numericParts) + 1 : 1;
      return `${prefix}${String(nextNum).padStart(3, "0")}`;
    } catch (e: any) {
      console.error("خطأ في توليد كود الفئة الأساسية:", e);
      return `MAIN-${Date.now().toString(36).toUpperCase().slice(-4)}`;
    }
  },

  /**
   * جلب الفئات الأساسية حسب التصنيف
   */
  async getMainCategoriesByClassification(
    classificationId: string
  ): Promise<UnifiedMainCategory[]> {
    try {
      const { data, error } = await supabase
        .from("unified_main_categories")
        .select(`
          *,
          classification:unified_classifications!unified_main_categories_classification_id_fkey(*)
        `)
        .eq("classification_id", classificationId)
        .eq("is_active", true)
        .order("sort_order, name");

      if (error) {
        console.error("خطأ في جلب الفئات الأساسية:", error);
        throw error;
      }
      
      // جلب الفئات الفرعية والبراندز بشكل منفصل لتجنب مشاكل الـ join
      if (data && data.length > 0) {
        const mainCategoryIds = data.map((cat: any) => cat.id);
        
        // جلب الفئات الفرعية
        const { data: subCategoriesData } = await supabase
          .from("unified_sub_categories")
          .select("*")
          .in("main_category_id", mainCategoryIds)
          .eq("is_active", true);

        // جلب البراندز المرتبطة
        const { data: brandsData } = await supabase
          .from("main_category_brands")
          .select(`
            *,
            unified_brands!main_category_brands_brand_id_fkey(*)
          `)
          .in("main_category_id", mainCategoryIds);

        // ربط الفئات الفرعية والبراندز بالفئات الأساسية
        return (data || []).map((mainCat: any) => ({
          ...mainCat,
          sub_categories: subCategoriesData?.filter(
            (sub: any) => sub.main_category_id === mainCat.id
          ) || [],
          available_brands: brandsData?.filter(
            (brand: any) => brand.main_category_id === mainCat.id
          ).map((b: any) => b.unified_brands).filter(Boolean) || [],
        }));
      }
      
      return data || [];
    } catch (error: any) {
      console.error("خطأ في جلب الفئات الأساسية:", error);
      toast.error(error.message || "فشل في جلب الفئات الأساسية");
      return [];
    }
  },

  /**
   * جلب فئة أساسية واحدة
   */
  async getMainCategory(
    mainCategoryId: string
  ): Promise<UnifiedMainCategory | null> {
    try {
      const { data, error } = await supabase
        .from("unified_main_categories")
        .select(`
          *,
          classification:unified_classifications!unified_main_categories_classification_id_fkey(*)
        `)
        .eq("id", mainCategoryId)
        .single();

      if (error) {
        console.error("خطأ في جلب الفئة الأساسية:", error);
        throw error;
      }
      
      if (!data) return null;

      // جلب الفئات الفرعية بشكل منفصل
      const { data: subCategoriesData } = await supabase
        .from("unified_sub_categories")
        .select("*")
        .eq("main_category_id", mainCategoryId)
        .eq("is_active", true);

      return {
        ...data,
        sub_categories: subCategoriesData || [],
      };
    } catch (error: any) {
      console.error("خطأ في جلب الفئة الأساسية:", error);
      toast.error(error.message || "فشل في جلب الفئة الأساسية");
      return null;
    }
  },

  /**
   * إضافة فئة أساسية جديدة
   */
  async addMainCategory(
    mainCategory: Omit<UnifiedMainCategory, "id" | "created_at" | "updated_at">
  ): Promise<UnifiedMainCategory | null> {
    try {
      const { data, error } = await supabase
        .from("unified_main_categories")
        .insert(mainCategory)
        .select(`
          *,
          classification:unified_classifications(*)
        `)
        .single();

      if (error) throw error;
      toast.success("تم إضافة الفئة الأساسية بنجاح");
      return data;
    } catch (error: any) {
      console.error("خطأ في إضافة الفئة الأساسية:", error);
      toast.error(error.message || "فشل في إضافة الفئة الأساسية");
      return null;
    }
  },

  /**
   * تحديث فئة أساسية
   */
  async updateMainCategory(
    id: string,
    updates: Partial<UnifiedMainCategory>
  ): Promise<UnifiedMainCategory | null> {
    try {
      const { data, error } = await supabase
        .from("unified_main_categories")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          classification:unified_classifications(*)
        `)
        .single();

      if (error) throw error;
      toast.success("تم تحديث الفئة الأساسية بنجاح");
      return data;
    } catch (error: any) {
      console.error("خطأ في تحديث الفئة الأساسية:", error);
      toast.error(error.message || "فشل في تحديث الفئة الأساسية");
      return null;
    }
  },

  /**
   * حذف فئة أساسية
   */
  async deleteMainCategory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("unified_main_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("تم حذف الفئة الأساسية بنجاح");
      return true;
    } catch (error: any) {
      console.error("خطأ في حذف الفئة الأساسية:", error);
      toast.error(error.message || "فشل في حذف الفئة الأساسية");
      return false;
    }
  },

  // =====================================================
  // الفئات الفرعية (Sub Categories)
  // =====================================================

  /**
   * جلب الفئات الفرعية حسب الفئة الأساسية
   */
  async getSubCategoriesByMainCategory(
    mainCategoryId: string
  ): Promise<UnifiedSubCategory[]> {
    try {
      const { data, error } = await supabase
        .from("unified_sub_categories")
        .select(`
          *,
          main_category:unified_main_categories!unified_sub_categories_main_category_id_fkey(*)
        `)
        .eq("main_category_id", mainCategoryId)
        .eq("is_active", true)
        .order("sort_order, name");

      if (error) {
        console.error("خطأ في جلب الفئات الفرعية:", error);
        throw error;
      }

        // جلب البراندز المرتبطة بالفئات الفرعية
        if (data && data.length > 0) {
          const subCategoryIds = data.map((cat: any) => cat.id);
          const { data: brandsData } = await supabase
            .from("sub_category_brands")
            .select(`
              *,
              unified_brands!sub_category_brands_brand_id_fkey(*)
            `)
            .in("sub_category_id", subCategoryIds);

          // ربط البراندز بالفئات الفرعية
          return (data || []).map((subCat: any) => ({
            ...subCat,
            available_brands: brandsData?.filter(
              (brand: any) => brand.sub_category_id === subCat.id
            ).map((b: any) => b.unified_brands).filter(Boolean) || [],
          }));
        }

      return data || [];
    } catch (error: any) {
      console.error("خطأ في جلب الفئات الفرعية:", error);
      toast.error(error.message || "فشل في جلب الفئات الفرعية");
      return [];
    }
  },

  /**
   * إضافة فئة فرعية جديدة
   */
  async addSubCategory(
    subCategory: Omit<UnifiedSubCategory, "id" | "created_at" | "updated_at">
  ): Promise<UnifiedSubCategory | null> {
    try {
      const { data, error } = await supabase
        .from("unified_sub_categories")
        .insert(subCategory)
        .select(`
          *,
          main_category:unified_main_categories(*)
        `)
        .single();

      if (error) throw error;
      toast.success("تم إضافة الفئة الفرعية بنجاح");
      return data;
    } catch (error: any) {
      console.error("خطأ في إضافة الفئة الفرعية:", error);
      toast.error(error.message || "فشل في إضافة الفئة الفرعية");
      return null;
    }
  },

  /**
   * تحديث فئة فرعية
   */
  async updateSubCategory(
    id: string,
    updates: Partial<UnifiedSubCategory>
  ): Promise<UnifiedSubCategory | null> {
    try {
      const { data, error } = await supabase
        .from("unified_sub_categories")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          main_category:unified_main_categories(*)
        `)
        .single();

      if (error) throw error;
      toast.success("تم تحديث الفئة الفرعية بنجاح");
      return data;
    } catch (error: any) {
      console.error("خطأ في تحديث الفئة الفرعية:", error);
      toast.error(error.message || "فشل في تحديث الفئة الفرعية");
      return null;
    }
  },

  /**
   * حذف فئة فرعية
   */
  async deleteSubCategory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("unified_sub_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("تم حذف الفئة الفرعية بنجاح");
      return true;
    } catch (error: any) {
      console.error("خطأ في حذف الفئة الفرعية:", error);
      toast.error(error.message || "فشل في حذف الفئة الفرعية");
      return false;
    }
  },

  // =====================================================
  // ربط الوحدات والبراندز بالتصنيفات
  // =====================================================

  /**
   * ربط وحدة بتصنيف
   */
  async linkUnitToClassification(
    classificationId: string,
    unitId: number,
    isDefault: boolean = false
  ): Promise<ClassificationUnit | null> {
    try {
      const { data, error } = await supabase
        .from("classification_units")
        .insert({
          classification_id: classificationId,
          unit_id: unitId,
          is_default: isDefault,
        })
        .select(`
          *,
          units:unit_id(*)
        `)
        .single();

      if (error) throw error;
      toast.success("تم ربط الوحدة بالتصنيف بنجاح");
      return {
        ...data,
        unit: data.units,
      };
    } catch (error: any) {
      console.error("خطأ في ربط الوحدة:", error);
      toast.error(error.message || "فشل في ربط الوحدة");
      return null;
    }
  },

  /**
   * إلغاء ربط وحدة بتصنيف
   */
  async unlinkUnitFromClassification(
    classificationId: string,
    unitId: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("classification_units")
        .delete()
        .eq("classification_id", classificationId)
        .eq("unit_id", unitId);

      if (error) throw error;
      toast.success("تم إلغاء ربط الوحدة بنجاح");
      return true;
    } catch (error: any) {
      console.error("خطأ في إلغاء ربط الوحدة:", error);
      toast.error(error.message || "فشل في إلغاء ربط الوحدة");
      return false;
    }
  },

  /**
   * ربط براند بتصنيف
   */
  async linkBrandToClassification(
    classificationId: string,
    brandId: string,
    isDefault: boolean = false
  ): Promise<ClassificationBrand | null> {
    try {
      const { data, error } = await supabase
        .from("classification_brands")
        .insert({
          classification_id: classificationId,
          brand_id: brandId,
          is_default: isDefault,
        })
        .select(`
          *,
          brands:brand_id(*)
        `)
        .single();

      if (error) throw error;
      toast.success("تم ربط البراند بالتصنيف بنجاح");
      return {
        ...data,
        brand: data.brands,
      };
    } catch (error: any) {
      console.error("خطأ في ربط البراند:", error);
      toast.error(error.message || "فشل في ربط البراند");
      return null;
    }
  },

  /**
   * إلغاء ربط براند بتصنيف
   */
  async unlinkBrandFromClassification(
    classificationId: string,
    brandId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("classification_brands")
        .delete()
        .eq("classification_id", classificationId)
        .eq("brand_id", brandId);

      if (error) throw error;
      toast.success("تم إلغاء ربط البراند بنجاح");
      return true;
    } catch (error: any) {
      console.error("خطأ في إلغاء ربط البراند:", error);
      toast.error(error.message || "فشل في إلغاء ربط البراند");
      return false;
    }
  },

  // =====================================================
  // ربط البراندز بالفئات الأساسية والفرعية
  // =====================================================

  /**
   * ربط براند بفئة أساسية
   */
  async linkBrandToMainCategory(
    mainCategoryId: string,
    brandId: string,
    isDefault: boolean = false
  ): Promise<boolean> {
    try {
      // التحقق من وجود الربط مسبقاً
      const { data: existing } = await supabase
        .from("main_category_brands")
        .select("id")
        .eq("main_category_id", mainCategoryId)
        .eq("brand_id", brandId)
        .single();

      if (existing) {
        toast.info("البراند مرتبط بالفئة الأساسية بالفعل");
        return true;
      }

      const { error } = await supabase
        .from("main_category_brands")
        .insert({
          main_category_id: mainCategoryId,
          brand_id: brandId,
          is_default: isDefault,
        });

      if (error) {
        // إذا كان الخطأ بسبب duplicate key، نعتبره نجاح
        if (error.code === '23505') {
          toast.info("البراند مرتبط بالفئة الأساسية بالفعل");
          return true;
        }
        console.error("خطأ Supabase في ربط البراند بالفئة الأساسية:", error);
        throw error;
      }
      toast.success("تم ربط البراند بالفئة الأساسية بنجاح");
      return true;
    } catch (error: any) {
      console.error("خطأ في ربط البراند بالفئة الأساسية:", error);
      const errorMessage = error?.message || error?.details || JSON.stringify(error) || "فشل في ربط البراند";
      toast.error(errorMessage);
      return false;
    }
  },

  /**
   * ربط براند بفئة فرعية
   */
  async linkBrandToSubCategory(
    subCategoryId: string,
    brandId: string,
    isDefault: boolean = false
  ): Promise<boolean> {
    try {
      // التحقق من وجود الربط مسبقاً
      const { data: existing } = await supabase
        .from("sub_category_brands")
        .select("id")
        .eq("sub_category_id", subCategoryId)
        .eq("brand_id", brandId)
        .single();

      if (existing) {
        toast.info("البراند مرتبط بالفئة الفرعية بالفعل");
        return true;
      }

      const { error } = await supabase
        .from("sub_category_brands")
        .insert({
          sub_category_id: subCategoryId,
          brand_id: brandId,
          is_default: isDefault,
        });

      if (error) {
        // إذا كان الخطأ بسبب duplicate key، نعتبره نجاح
        if (error.code === '23505') {
          toast.info("البراند مرتبط بالفئة الفرعية بالفعل");
          return true;
        }
        console.error("خطأ Supabase في ربط البراند بالفئة الفرعية:", error);
        throw error;
      }
      toast.success("تم ربط البراند بالفئة الفرعية بنجاح");
      return true;
    } catch (error: any) {
      console.error("خطأ في ربط البراند بالفئة الفرعية:", error);
      const errorMessage = error?.message || error?.details || JSON.stringify(error) || "فشل في ربط البراند";
      toast.error(errorMessage);
      return false;
    }
  },

  /**
   * جلب البراندز المرتبطة بفئة أساسية
   */
  async getBrandsByMainCategory(mainCategoryId: string): Promise<UnifiedBrand[]> {
    try {
      const { data, error } = await supabase
        .from("main_category_brands")
        .select(`
          *,
          unified_brands!main_category_brands_brand_id_fkey(*)
        `)
        .eq("main_category_id", mainCategoryId);

      if (error) throw error;
      return (data || []).map((item: any) => item.unified_brands).filter(Boolean);
    } catch (error: any) {
      console.error("خطأ في جلب البراندز:", error);
      return [];
    }
  },

  /**
   * جلب البراندز المرتبطة بفئة فرعية
   */
  async getBrandsBySubCategory(subCategoryId: string): Promise<UnifiedBrand[]> {
    try {
      const { data, error } = await supabase
        .from("sub_category_brands")
        .select(`
          *,
          unified_brands!sub_category_brands_brand_id_fkey(*)
        `)
        .eq("sub_category_id", subCategoryId);

      if (error) throw error;
      return (data || []).map((item: any) => item.unified_brands).filter(Boolean);
    } catch (error: any) {
      console.error("خطأ في جلب البراندز:", error);
      return [];
    }
  },

  /**
   * إلغاء ربط براند بفئة أساسية
   */
  async unlinkBrandFromMainCategory(
    mainCategoryId: string,
    brandId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("main_category_brands")
        .delete()
        .eq("main_category_id", mainCategoryId)
        .eq("brand_id", brandId);

      if (error) throw error;
      toast.success("تم إلغاء ربط البراند بنجاح");
      return true;
    } catch (error: any) {
      console.error("خطأ في إلغاء ربط البراند:", error);
      toast.error(error.message || "فشل في إلغاء ربط البراند");
      return false;
    }
  },

  /**
   * إلغاء ربط براند بفئة فرعية
   */
  async unlinkBrandFromSubCategory(
    subCategoryId: string,
    brandId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("sub_category_brands")
        .delete()
        .eq("sub_category_id", subCategoryId)
        .eq("brand_id", brandId);

      if (error) throw error;
      toast.success("تم إلغاء ربط البراند بنجاح");
      return true;
    } catch (error: any) {
      console.error("خطأ في إلغاء ربط البراند:", error);
      toast.error(error.message || "فشل في إلغاء ربط البراند");
      return false;
    }
  },
};

