export type PartnerType = "factory" | "crusher" | "merchant" | "other";
export type OrderStatus =
    | "pending"
    | "approved"
    | "processing"
    | "completed"
    | "cancelled"
    | "rejected";

export interface IndustrialPartner {
    id: string;
    name: string;
    type: PartnerType;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    commercial_register?: string;
    tax_card?: string;
    credit_limit: number;
    current_balance: number;
    created_at?: string;
}

export interface PartnerOrderItem {
    id?: string;
    order_id?: string;
    product_id: string; // From waste_data_admin
    product_name: string;
    quantity: number;
    unit: string;
    agreed_price: number;
    total_price?: number;
}

export interface PartnerOrder {
    id: string;
    partner_id: string;
    order_number?: number;
    partner?: IndustrialPartner; // For join queries
    status: OrderStatus;
    total_amount: number;
    delivery_date?: string;
    notes?: string;
    items?: PartnerOrderItem[];
    created_at?: string;
    updated_at?: string;
}

export interface CreatePartnerDTO
    extends Omit<IndustrialPartner, "id" | "created_at" | "updated_at"> {}
export interface CreateOrderDTO
    extends
        Omit<
            PartnerOrder,
            "id" | "order_number" | "created_at" | "updated_at" | "partner"
        > {
    items: PartnerOrderItem[];
}


