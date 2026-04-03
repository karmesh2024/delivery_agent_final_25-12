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

// ══════════════════════════════════════════════
// نظام العقود
// ══════════════════════════════════════════════

export type ContractType = "one_time" | "short_term" | "long_term";
export type ContractStatus = "draft" | "active" | "completed" | "cancelled" | "expired";

export interface PartnerContract {
    id: string;
    partner_id: string;
    bid_id?: string;
    subcategory_id?: number;
    contract_type: ContractType;
    agreed_price: number;               // سعر البيع للطن
    operational_cost_override?: number;  // NULL = استخدم افتراضي الفئة
    quantity: number;                    // الكمية الإجمالية بالطن
    delivered_quantity: number;          // ما تم توريده فعلاً
    unit: string;
    start_date?: string;
    end_date?: string;
    status: ContractStatus;
    approved_by?: string;
    approved_at?: string;
    affects_exchange_price: boolean;     // هل يؤثر العقد على سعر البورصة المرجح؟
    notes?: string;
    created_at?: string;
    updated_at?: string;
    // Join relations
    partner?: IndustrialPartner;
}

export interface CreateContractDTO
    extends Omit<PartnerContract, "id" | "delivered_quantity" | "created_at" | "updated_at" | "partner"> {}

// ══════════════════════════════════════════════
// التكاليف التشغيلية لكل فئة مادة
// ══════════════════════════════════════════════

export interface CategoryOperationalCost {
    id: string;
    subcategory_id: number;
    transport_cost: number;   // تكلفة النقل/طن
    sorting_cost: number;     // تكلفة الفرز/طن
    storage_cost: number;     // تكلفة التخزين/طن
    total_cost: number;       // المجموع (محسوب تلقائياً)
    notes?: string;
    updated_at?: string;
}
