import { supabase } from "@/lib/supabase";
import { MarketBid, CreateMarketBidDTO } from "../partners/market-bids.types";

export const marketBidService = {
    async getBids(filters?: { subcategory_id?: number; product_id?: string; status?: string; industrial_order_id?: string }) {
        if (!supabase) return [];
        
        let query = supabase
            .from("market_bids")
            .select("*")
            .order("created_at", { ascending: false });

        if (filters?.subcategory_id) query = query.eq("subcategory_id", filters.subcategory_id);
        if (filters?.product_id) query = query.eq("product_id", filters.product_id);
        if (filters?.status) query = query.eq("status", filters.status);
        if (filters?.industrial_order_id) query = query.eq("industrial_order_id", filters.industrial_order_id);

        const { data, error } = await query;
        if (error) {
            console.error("Error fetching market bids:", error);
            return [];
        }
        return data as MarketBid[];
    },

    async createBid(bid: CreateMarketBidDTO) {
        if (!supabase) throw new Error("Supabase client not initialized");
        
        const { data, error } = await supabase
            .from("market_bids")
            .insert(bid)
            .select()
            .single();

        if (error) throw error;
        return data as MarketBid;
    },

    async updateBidStatus(id: string, status: MarketBid["status"]) {
        if (!supabase) throw new Error("Supabase client not initialized");
        
        const { data, error } = await supabase
            .from("market_bids")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as MarketBid;
    },

    // جلب أعلى عرض نشط لفئة معينة (لاستخدامه في الحاسبة)
    async getHighestActiveBid(subcategoryId: number) {
        if (!supabase) return null;
        
        const { data, error } = await supabase
            .from("market_bids")
            .select("*")
            .eq("subcategory_id", subcategoryId)
            .eq("status", "active")
            .order("bid_price", { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== "PGRST116") { // PGRST116 is "no rows returned"
            console.error("Error fetching highest bid:", error);
            return null;
        }
        return data as MarketBid | null;
    }
};
