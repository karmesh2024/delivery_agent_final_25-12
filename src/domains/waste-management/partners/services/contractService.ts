import { supabase } from "@/lib/supabase";
import {
    PartnerContract,
    CreateContractDTO,
    ContractStatus,
} from "../types";

export const contractService = {

    // جلب جميع العقود مع بيانات الشريك
    async getContracts(filters?: { status?: ContractStatus; subcategory_id?: number; partner_id?: string }) {
        if (!supabase) return [];

        let query = supabase
            .from("partner_contracts")
            .select(`
                *,
                partner:industrial_partners(id, name, type, contact_person)
            `)
            .order("created_at", { ascending: false });

        if (filters?.status) query = query.eq("status", filters.status);
        if (filters?.subcategory_id) query = query.eq("subcategory_id", filters.subcategory_id);
        if (filters?.partner_id) query = query.eq("partner_id", filters.partner_id);

        const { data, error } = await query;
        if (error) {
            console.error("خطأ في جلب العقود:", error);
            return [];
        }
        return data as PartnerContract[];
    },

    // جلب العقود النشطة غير المستنفدة لفئة معينة (للحاسبة)
    async getActiveContractsForSubcategory(subcategoryId: number) {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from("partner_contracts")
            .select(`
                *,
                partner:industrial_partners(id, name)
            `)
            .eq("subcategory_id", subcategoryId)
            .eq("status", "active")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("خطأ في جلب العقود النشطة:", error);
            return [];
        }

        // تصفية: فقط العقود التي لم تُستنفد كميتها والتي مسموح لها بالتأثير على السعر
        return (data as PartnerContract[]).filter(
            c => c.delivered_quantity < c.quantity && c.affects_exchange_price !== false
        );
    },

    // إنشاء عقد جديد
    async createContract(contract: CreateContractDTO) {
        if (!supabase) throw new Error("Supabase client not initialized");

        const { data, error } = await supabase
            .from("partner_contracts")
            .insert({
                ...contract,
                delivered_quantity: 0,
                affects_exchange_price: contract.affects_exchange_price ?? true,
            })
            .select(`
                *,
                partner:industrial_partners(id, name, type)
            `)
            .single();

        if (error) throw error;
        return data as PartnerContract;
    },

    // تحديث حالة العقد
    async updateContractStatus(id: string, status: ContractStatus, approvedBy?: string) {
        if (!supabase) throw new Error("Supabase client not initialized");

        const updateData: Record<string, unknown> = {
            status,
            updated_at: new Date().toISOString(),
        };

        if (status === "active" && approvedBy) {
            updateData.approved_by = approvedBy;
            updateData.approved_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from("partner_contracts")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as PartnerContract;
    },

    // تحديث الكمية الموردة
    async updateDeliveredQuantity(id: string, additionalQuantity: number) {
        if (!supabase) throw new Error("Supabase client not initialized");

        // جلب القيمة الحالية أولاً
        const { data: current, error: fetchError } = await supabase
            .from("partner_contracts")
            .select("delivered_quantity, quantity, status")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;

        const newDelivered = Number(current.delivered_quantity) + additionalQuantity;

        const updateData: Record<string, unknown> = {
            delivered_quantity: newDelivered,
            updated_at: new Date().toISOString(),
        };

        // إذا وصلت الكمية الموردة للحد الأقصى → العقد مكتمل تلقائياً
        if (newDelivered >= Number(current.quantity)) {
            updateData.status = "completed";
        }

        const { data, error } = await supabase
            .from("partner_contracts")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as PartnerContract;
    },

    // حساب المتوسط المرجّح بالكميات لفئة معينة
    async getWeightedAverageForSubcategory(subcategoryId: number) {
        const contracts = await this.getActiveContractsForSubcategory(subcategoryId);

        if (contracts.length === 0) {
            return { weightedAvgPrice: 0, totalQuantity: 0, contractCount: 0, contracts: [] };
        }

        const totalValue = contracts.reduce(
            (sum, c) => sum + (Number(c.agreed_price) * Number(c.quantity)), 0
        );
        const totalQuantity = contracts.reduce(
            (sum, c) => sum + Number(c.quantity), 0
        );

        return {
            weightedAvgPrice: totalQuantity > 0 ? totalValue / totalQuantity : 0,
            totalQuantity,
            contractCount: contracts.length,
            contracts,
        };
    },

    // تحديث عقد
    async updateContract(id: string, updates: Partial<PartnerContract>) {
        if (!supabase) throw new Error("Supabase client not initialized");

        const { data, error } = await supabase
            .from("partner_contracts")
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as PartnerContract;
    },
};
