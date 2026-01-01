import { supabase } from "@/lib/supabase";
import { toast } from "react-toastify";

export interface Unit {
  id: number;
  code: string;
  name: string;
}

export const unifiedUnitsService = {
  /**
   * جلب جميع الوحدات
   */
  async getUnits(): Promise<Unit[]> {
    try {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .order("name");

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error("خطأ في جلب الوحدات:", error);
      toast.error("فشل في جلب الوحدات");
      return [];
    }
  },

  /**
   * جلب وحدة واحدة
   */
  async getUnit(unitId: number): Promise<Unit | null> {
    try {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("id", unitId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("خطأ في جلب الوحدة:", error);
      toast.error("فشل في جلب الوحدة");
      return null;
    }
  },

  /**
   * إضافة وحدة جديدة
   */
  async addUnit(unit: { code: string; name: string }): Promise<Unit | null> {
    try {
      const { data, error } = await supabase
        .from("units")
        .insert(unit)
        .select()
        .single();

      if (error) throw error;
      toast.success("تم إضافة الوحدة بنجاح");
      return data;
    } catch (error: any) {
      console.error("خطأ في إضافة الوحدة:", error);
      toast.error(error.message || "فشل في إضافة الوحدة");
      return null;
    }
  },

  /**
   * تحديث وحدة
   */
  async updateUnit(id: number, updates: Partial<Unit>): Promise<Unit | null> {
    try {
      const { data, error } = await supabase
        .from("units")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      toast.success("تم تحديث الوحدة بنجاح");
      return data;
    } catch (error: any) {
      console.error("خطأ في تحديث الوحدة:", error);
      toast.error(error.message || "فشل في تحديث الوحدة");
      return null;
    }
  },

  /**
   * حذف وحدة
   */
  async deleteUnit(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("units")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("تم حذف الوحدة بنجاح");
      return true;
    } catch (error: any) {
      console.error("خطأ في حذف الوحدة:", error);
      toast.error(error.message || "فشل في حذف الوحدة");
      return false;
    }
  },
};

