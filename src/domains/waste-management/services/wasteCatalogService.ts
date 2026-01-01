import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { canManageCatalog } from './wasteManagementPermissions';
import { getCurrentUserId } from '@/lib/logger-safe';

export interface WasteCatalogItem {
  id?: number;
  waste_no: string;
  warehouse_id: number | null;
  registration_date: string;
  source?: string;
  sector_id?: number;
  client_type_id?: number;
  source_code?: string;
  reason_id?: number;
  related_product_id?: number;
  main_category_id?: number;
  sub_category_id?: number;
  plastic_type_id?: number;
  metal_type_id?: number;
  plastic_code?: string;
  plastic_shape?: string;
  plastic_color?: string;
  plastic_cleanliness?: string;
  plastic_hardness?: string;
  metal_shape?: string;
  metal_condition?: string;
  paper_type?: string;
  paper_condition?: string;
  paper_print_type?: string;
  glass_type?: string;
  glass_shape?: string;
  fabric_type?: string;
  fabric_condition?: string;
  fabric_cut_type?: string;
  unit_mode: "weight" | "volume" | "count" | "dimension";
  unit_id?: number;
  weight?: number;
  volume?: number;
  count?: number;
  length?: number;
  width?: number;
  height?: number;
  recyclable?: boolean;
  quality_grade?: string;
  impurities_percent?: number;
  sorting_status?: string;
  contamination_level?: string;
  disposal_reason?: string;
  disposal_method?: string;
  expected_price?: number;
  expected_total?: number;
  temp_location?: string;
  rack_row_col?: string;
  storage_conditions?: string;
  stackable?: boolean;
  max_stack_height?: number;
  max_storage_days?: number;
  alert_on_exceed?: boolean;
  status?: string;
  images?: string[];
  documents?: string[];
  env_carbon_saving?: number;
  env_energy_saving?: number;
  env_water_saving?: number;
  env_trees_saved?: number;
  qr_code?: string;
  notes?: string;
  emergency_flags?: {
    urgent_processing: boolean;
    special_approvals: boolean;
    health_hazard: boolean;
    environmental_hazard: boolean;
  };
  is_returnable_after_sorting?: boolean;
  initial_sorting_from_supplier?: string | null;
}

class WasteCatalogService {
  /**
   * إضافة مخلفات جديدة (مع التحقق من الصلاحيات)
   */
  async addWaste(
    waste: Omit<WasteCatalogItem, "id" | "created_at">,
  ): Promise<WasteCatalogItem | null> {
    try {
      // التحقق من الصلاحيات
      const userId = await getCurrentUserId();
      if (!userId) {
        toast.error('يجب تسجيل الدخول أولاً');
        return null;
      }

      const permissionCheck = await canManageCatalog(userId, 'create');
      if (!permissionCheck.allowed) {
        toast.error(permissionCheck.reason || 'ليس لديك صلاحية لإضافة مخلفات');
        return null;
      }

      // تحضير البيانات للحفظ
      const sourceCode = waste.source_code || (typeof waste.source === 'string' ? waste.source : null);
      
      const wasteData = {
        ...waste,
        sector_id: waste.sector_id || null,
        client_type_id: waste.client_type_id || null,
        source_code: sourceCode || null,
        reason_id: waste.reason_id || null,
        source: sourceCode || null,
      };

      const { data, error } = await supabase!
        .from("catalog_waste_materials")
        .insert([wasteData])
        .select()
        .single();

      if (error) {
        console.error("خطأ في إضافة المخلفات:", error);
        toast.error(`حدث خطأ أثناء إضافة المخلفات: ${error.message}`);
        return null;
      }

      toast.success("تم إضافة المخلفات بنجاح");
      return data;
    } catch (error) {
      console.error("خطأ في إضافة المخلفات:", error);
      toast.error(
        `حدث خطأ أثناء إضافة المخلفات: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }`,
      );
      return null;
    }
  }

  /**
   * تحديث مخلفات موجودة (مع التحقق من الصلاحيات)
   */
  async updateWaste(
    id: number,
    waste: Partial<WasteCatalogItem>,
  ): Promise<WasteCatalogItem | null> {
    try {
      // التحقق من الصلاحيات
      const userId = await getCurrentUserId();
      if (!userId) {
        toast.error('يجب تسجيل الدخول أولاً');
        return null;
      }

      const permissionCheck = await canManageCatalog(userId, 'update');
      if (!permissionCheck.allowed) {
        toast.error(permissionCheck.reason || 'ليس لديك صلاحية لتعديل مخلفات');
        return null;
      }

      const { data, error } = await supabase!
        .from("catalog_waste_materials")
        .update(waste)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("خطأ في تحديث المخلفات:", error);
        toast.error(`حدث خطأ أثناء تحديث المخلفات: ${error.message}`);
        return null;
      }

      toast.success("تم تحديث المخلفات بنجاح");
      return data;
    } catch (error) {
      console.error("خطأ في تحديث المخلفات:", error);
      toast.error(
        `حدث خطأ أثناء تحديث المخلفات: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }`,
      );
      return null;
    }
  }

  /**
   * حذف مخلفات (مع التحقق من الصلاحيات)
   */
  async deleteWaste(id: number): Promise<boolean> {
    try {
      // التحقق من الصلاحيات
      const userId = await getCurrentUserId();
      if (!userId) {
        toast.error('يجب تسجيل الدخول أولاً');
        return false;
      }

      const permissionCheck = await canManageCatalog(userId, 'delete');
      if (!permissionCheck.allowed) {
        toast.error(permissionCheck.reason || 'ليس لديك صلاحية لحذف مخلفات');
        return false;
      }

      const { error } = await supabase!
        .from("catalog_waste_materials")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("خطأ في حذف المخلفات:", error);
        toast.error(`حدث خطأ أثناء حذف المخلفات: ${error.message}`);
        return false;
      }

      toast.success("تم حذف المخلفات بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في حذف المخلفات:", error);
      toast.error(
        `حدث خطأ أثناء حذف المخلفات: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }`,
      );
      return false;
    }
  }

  /**
   * جلب جميع المخلفات
   */
  async getWasteMaterials(): Promise<WasteCatalogItem[]> {
    try {
      // الخطوة 1: جلب المخلفات من الكتالوج
      const { data: catalogItems, error: catalogError } = await supabase!
        .from("catalog_waste_materials")
        .select(`
          *,
          warehouse:warehouses(name),
          unit:units(name),
          related_product:catalog_products(name, sku)
        `)
        .order("created_at", { ascending: false });

      if (catalogError) {
        console.error("خطأ في جلب المخلفات:", catalogError);
        toast.error("حدث خطأ أثناء جلب المخلفات");
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
        const { data, error } = await supabase!
          .from("waste_main_categories")
          .select("id, code, name")
          .in("id", Array.from(mainCategoryIds));
        if (!error && data) {
          oldMainCategories = data;
        }
      }

      if (subCategoryIds.size > 0) {
        const { data, error } = await supabase!
          .from("waste_sub_categories")
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
        const { data, error } = await supabase!
          .from("unified_main_categories")
          .select("id, code, name, name_ar")
          .in("code", Array.from(mainCategoryCodes))
          .eq("is_active", true);
        if (!error && data) {
          unifiedMainCategories = data;
        }
      }

      if (subCategoryCodes.size > 0) {
        const { data, error } = await supabase!
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
    } catch (error) {
      console.error("خطأ في جلب المخلفات:", error);
      return [];
    }
  }
}

export const wasteCatalogService = new WasteCatalogService();
export default wasteCatalogService;

