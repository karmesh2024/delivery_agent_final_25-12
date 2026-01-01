import { supabase } from "@/lib/supabase";
import { toast } from "react-toastify";
import { UnifiedBrand, ItemType } from "./unifiedCategoriesService";

export const unifiedBrandsService = {
  /**
   * جلب جميع البراندز
   */
  async getBrands(itemType?: ItemType): Promise<UnifiedBrand[]> {
    try {
      let query = supabase
        .from("unified_brands")
        .select("*")
        .eq("is_active", true);

      // إذا تم تحديد نوع العنصر، قم بالفلترة
      if (itemType) {
        // جلب البراندز التي تطابق النوع المحدد أو "both"
        query = query.in("item_type", [itemType, "both"]);
      }

      const { data, error } = await query.order("sort_order, name_ar");

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error("خطأ في جلب البراندز:", error);
      toast.error("فشل في جلب البراندز");
      return [];
    }
  },

  /**
   * جلب براندز المنتجات فقط
   */
  async getProductBrands(): Promise<UnifiedBrand[]> {
    return this.getBrands('product');
  },

  /**
   * جلب براندز المخلفات والروبابيكيا والمستعمل فقط
   */
  async getWasteBrands(): Promise<UnifiedBrand[]> {
    return this.getBrands('waste');
  },

  /**
   * جلب براند واحد
   */
  async getBrand(brandId: string): Promise<UnifiedBrand | null> {
    try {
      const { data, error } = await supabase
        .from("unified_brands")
        .select("*")
        .eq("id", brandId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("خطأ في جلب البراند:", error);
      toast.error("فشل في جلب البراند");
      return null;
    }
  },

  /**
   * إضافة براند جديد
   */
  async addBrand(
    brand: Omit<UnifiedBrand, "id" | "created_at" | "updated_at">
  ): Promise<UnifiedBrand | null> {
    try {
      const { data, error } = await supabase
        .from("unified_brands")
        .insert(brand)
        .select()
        .single();

      if (error) throw error;
      toast.success("تم إضافة البراند بنجاح");
      return data;
    } catch (error: any) {
      console.error("خطأ في إضافة البراند:", error);
      toast.error(error.message || "فشل في إضافة البراند");
      return null;
    }
  },

  /**
   * تحديث براند
   */
  async updateBrand(
    id: string,
    updates: Partial<UnifiedBrand>
  ): Promise<UnifiedBrand | null> {
    try {
      const { data, error } = await supabase
        .from("unified_brands")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      toast.success("تم تحديث البراند بنجاح");
      return data;
    } catch (error: any) {
      console.error("خطأ في تحديث البراند:", error);
      toast.error(error.message || "فشل في تحديث البراند");
      return null;
    }
  },

  /**
   * حذف براند
   */
  async deleteBrand(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("unified_brands")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("تم حذف البراند بنجاح");
      return true;
    } catch (error: any) {
      console.error("خطأ في حذف البراند:", error);
      toast.error(error.message || "فشل في حذف البراند");
      return false;
    }
  },
};

