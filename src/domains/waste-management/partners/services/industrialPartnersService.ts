import { supabase } from "@/lib/supabase";
import {
    CreateOrderDTO,
    CreatePartnerDTO,
    IndustrialPartner,
    PartnerOrder,
} from "../types";

export const industrialPartnersService = {
    // --- Partners ---
    async getPartners() {
        if (!supabase) throw new Error("Supabase client not initialized");
        const { data, error } = await supabase
            .from("industrial_partners")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data as IndustrialPartner[];
    },

    async getPartnerById(id: string) {
        if (!supabase) throw new Error("Supabase client not initialized");
        const { data, error } = await supabase
            .from("industrial_partners")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        return data as IndustrialPartner;
    },

    async createPartner(partner: CreatePartnerDTO) {
        if (!supabase) throw new Error("Supabase client not initialized");
        const { data, error } = await supabase
            .from("industrial_partners")
            .insert(partner)
            .select()
            .single();

        if (error) throw error;
        return data as IndustrialPartner;
    },

    async updatePartner(id: string, updates: Partial<IndustrialPartner>) {
        if (!supabase) throw new Error("Supabase client not initialized");
        const { data, error } = await supabase
            .from("industrial_partners")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as IndustrialPartner;
    },

    // --- Orders ---
    async getOrders() {
        if (!supabase) throw new Error("Supabase client not initialized");
        const { data, error } = await supabase
            .from("industrial_partner_orders")
            .select(`
        *,
        partner:industrial_partners(name, type),
        items:industrial_partner_order_items(*)
      `)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data as PartnerOrder[];
    },

    async createOrder(order: CreateOrderDTO) {
        if (!supabase) throw new Error("Supabase client not initialized");
        // 1. Create the order header
        const { data: orderData, error: orderError } = await supabase
            .from("industrial_partner_orders")
            .insert({
                partner_id: order.partner_id,
                status: order.status,
                total_amount: order.total_amount,
                delivery_date: order.delivery_date,
                notes: order.notes,
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Create the order items
        if (order.items && order.items.length > 0) {
            const itemsToInsert = order.items.map((item) => ({
                order_id: orderData.id,
                product_id: item.product_id === "" ? null : item.product_id, // Send null if empty string
                product_name: item.product_name,
                quantity: item.quantity,
                unit: item.unit,
                agreed_price: item.agreed_price,
            }));

            const { error: itemsError } = await supabase
                .from("industrial_partner_order_items")
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;
        }

        return orderData as PartnerOrder;
    },

    async updateOrderStatus(id: string, status: string) {
        if (!supabase) throw new Error("Supabase client not initialized");
        const { data, error } = await supabase
            .from("industrial_partner_orders")
            .update({ status })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as PartnerOrder;
    },
};


