import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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

        const formattedData = data?.map((item: any) => ({
            id: item.id,
            name: item.product?.name || "Unknown",
            unit: item.product?.price_unit || "Kg",
            price: item.buy_price,
            change: item.price_change_percentage,
            demand: item.demand_level,
            lastUpdated: item.last_update,
        })) || [];

        return NextResponse.json(formattedData);
    } catch (error) {
        console.error("Exchange API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, {
            status: 500,
        });
    }
}
