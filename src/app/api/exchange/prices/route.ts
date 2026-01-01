import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// تعريف نوع البيانات للاستخدام في API
interface ExchangePriceItem {
    id: number;
    product_id: string;
    buy_price: number;
    sell_price?: number;
    last_actual_purchase_price?: number;
    price_change_percentage?: number;
    demand_level?: string;
    last_update?: string;
    product?: {
        name: string;
        price_unit?: string;
    } | null;
}

export async function GET() {
    try {
        if (!supabase) {
            return NextResponse.json({
                error: "Supabase client not initialized",
            }, { status: 500 });
        }

        const { data, error } = await supabase
            .from("stock_exchange")
            .select(`
        id,
        product_id,
        buy_price,
        sell_price,
        last_actual_purchase_price,
        price_change_percentage,
        demand_level,
        last_update,
        product:waste_data_admin(name, price_unit)
      `)
            .order("buy_price", { ascending: false });

        if (error) {
            console.error("Exchange API Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const formattedData = data?.map((item: {
            id: number;
            product_id: string;
            buy_price: number;
            sell_price?: number;
            last_actual_purchase_price?: number;
            price_change_percentage?: number;
            demand_level?: string;
            last_update?: string;
            product?: { name: string; price_unit?: string; } | { name: string; price_unit?: string; }[] | null;
        }) => {
            // حساب نسبة التغير بناءً على last_actual_purchase_price
            let change = item.price_change_percentage || 0;
            if (item.last_actual_purchase_price && item.buy_price) {
                const lastPrice = Number(item.last_actual_purchase_price);
                const currentPrice = Number(item.buy_price);
                if (lastPrice > 0) {
                    change = ((currentPrice - lastPrice) / lastPrice) * 100;
                }
            }
            
            // معالجة product (قد يكون array أو object)
            const product = Array.isArray(item.product) ? item.product[0] : item.product;
            
            return {
                id: item.id,
                product_id: item.product_id,
                name: product?.name || "Unknown",
                unit: product?.price_unit || "Kg",
                current_price: item.buy_price,
                sell_price: item.sell_price, // سعر بيع المصنع (للطن)
                last_purchase_price: item.last_actual_purchase_price,
                change: change,
                demand: item.demand_level,
                lastUpdated: item.last_update,
            };
        }) || [];

        return NextResponse.json(formattedData);
    } catch (error) {
        console.error("Exchange API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, {
            status: 500,
        });
    }
}
