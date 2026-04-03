export type BidSource = "phone" | "whatsapp" | "person" | "app";
export type BidStatus = "active" | "accepted" | "contracted" | "rejected" | "expired";

export interface MarketBid {
    id: string;
    industrial_order_id?: string;
    subcategory_id?: number;
    product_id?: string;
    bidder_name: string;
    partner_id?: string;
    bid_price: number;
    currency: string;
    quantity?: number;
    unit: string;
    delivery_date?: string;
    expiry_date?: string;
    source: BidSource;
    status: BidStatus;
    entered_by?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CreateMarketBidDTO extends Omit<MarketBid, "id" | "created_at" | "updated_at"> {}
