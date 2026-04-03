import { supabase } from "@/lib/supabase";
import { CategoryOperationalCost } from "../types";

export const operationalCostService = {

    // جلب جميع التكاليف التشغيلية
    async getAllCosts() {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from("category_operational_costs")
            .select("*")
            .order("subcategory_id");

        if (error) {
            console.error("خطأ في جلب التكاليف التشغيلية:", error);
            return [];
        }
        return data as CategoryOperationalCost[];
    },

    // جلب تكلفة فئة محددة
    async getCostBySubcategory(subcategoryId: number) {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from("category_operational_costs")
            .select("*")
            .eq("subcategory_id", subcategoryId)
            .maybeSingle();

        if (error) {
            console.error("خطأ في جلب تكلفة الفئة:", error);
            return null;
        }
        return data as CategoryOperationalCost | null;
    },

    // إنشاء أو تحديث تكلفة فئة (Upsert)
    async upsertCost(subcategoryId: number, costs: {
        transport_cost: number;
        sorting_cost: number;
        storage_cost: number;
        notes?: string;
    }) {
        if (!supabase) throw new Error("Supabase client not initialized");

        const { data, error } = await supabase
            .from("category_operational_costs")
            .upsert(
                {
                    subcategory_id: subcategoryId,
                    transport_cost: costs.transport_cost,
                    sorting_cost: costs.sorting_cost,
                    storage_cost: costs.storage_cost,
                    notes: costs.notes || null,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "subcategory_id" }
            )
            .select()
            .single();

        if (error) throw error;
        return data as CategoryOperationalCost;
    },

    // جلب التكلفة الفعلية لعقد (مع fallback للافتراضي)
    async getEffectiveCost(subcategoryId: number, contractOverride?: number | null): Promise<number> {
        // أولوية 1: تكلفة مخصصة للعقد
        if (contractOverride != null && contractOverride > 0) {
            return contractOverride;
        }

        // أولوية 2: تكلفة افتراضية للفئة
        const categoryCost = await this.getCostBySubcategory(subcategoryId);
        return categoryCost?.total_cost || 0;
    },
};
