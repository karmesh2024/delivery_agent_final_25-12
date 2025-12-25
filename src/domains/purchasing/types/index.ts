export type PurchaseInvoiceStatus =
  | 'draft'
  | 'pending'
  | 'pending_approval'
  | 'approved'
  | 'assigned_to_warehouse'
  | 'partially_received'
  | 'received_in_warehouse'
  | 'ready_for_pricing'
  | 'received'
  | 'priced'
  | 'rejected'
  | 'cancelled';

export interface PurchaseInvoiceItem {
  id?: string;
  product_id?: string | null;
  catalog_product_id?: string | null;
  sku?: string | null;
  name?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  measurement_unit?: string;
  discount_value?: number;
  notes?: string | null;
}

export interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  supplier_id?: number | null;
  supplier_name?: string | null;
  warehouse_id: number;
  warehouse_name?: string | null;
  invoice_date: string;
  received_date?: string | null;
  purchase_order_id?: string | null;
  assigned_to_pricing_at?: string | null;
  priced_at?: string | null;
  pricing_approved_by?: string | null;
  status: PurchaseInvoiceStatus;
  total_amount: number;
  currency?: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  items: PurchaseInvoiceItem[];
}

export interface PurchaseInvoiceFilters {
  status: PurchaseInvoiceStatus | 'all';
  supplierId?: number | null;
  search?: string;
}

export interface CreatePurchaseInvoiceInput {
  invoice_number?: string;
  supplier_id?: number | null;
  warehouse_id: number;
  invoice_date: string;
  received_date?: string | null;
  notes?: string | null;
  items: Array<{
    product_id?: string | null;
    catalog_product_id?: string | null;
    sku?: string | null;
    name?: string | null;
    quantity: number;
    unit_price: number;
    measurement_unit?: string;
    discount_value?: number;
    notes?: string | null;
  }>;
}

export type UpdatePurchaseInvoiceStatusPayload = {
  invoiceId: string;
  status: PurchaseInvoiceStatus;
};

// Purchase Order Types
export type PurchaseOrderStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent_to_supplier'
  | 'cancelled';

export interface PurchaseOrderItem {
  id?: string;
  catalog_product_id?: string | null;
  catalog_waste_id?: string | null;
  product_id?: string | null;
  sku?: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  measurement_unit?: string;
  notes?: string | null;
}

export interface PurchaseOrder {
  id: string;
  supplier_id?: number | null;
  supplier_name?: string | null;
  warehouse_id?: number | null;
  warehouse_name?: string | null;
  expected_delivery_date?: string | null;
  total_amount: number;
  status: PurchaseOrderStatus;
  notes?: string | null;
  created_by?: string | null;
  approved_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  items?: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderInput {
  supplier_id: number;
  warehouse_id: number;
  expected_delivery_date?: string | null;
  total_amount?: number;
  notes?: string | null;
  items?: Array<{
    catalog_product_id?: string | null;
    catalog_waste_id?: string | null;
    product_id?: string | null;
    sku?: string | null;
    name: string;
    quantity: number;
    unit_price: number;
    measurement_unit?: string;
    notes?: string | null;
  }>;
}

export interface UpdatePurchaseOrderInput {
  supplier_id?: number;
  warehouse_id?: number;
  expected_delivery_date?: string | null;
  total_amount?: number;
  status?: PurchaseOrderStatus;
  notes?: string | null;
}

export interface PurchaseOrderFilters {
  status?: PurchaseOrderStatus | 'all';
  supplierId?: number | null;
  warehouseId?: number | null;
}


