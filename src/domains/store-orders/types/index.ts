/**
 * Store Orders Domain Types
 * أنواع البيانات الخاصة بطلبات المتاجر
 */

export type StoreOrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'refunded' 
  | 'completed';

export type StorePaymentMethod = 
  | 'cash_on_delivery' 
  | 'credit_card' 
  | 'bank_transfer' 
  | 'wallet';

export type StorePaymentStatus = 
  | 'pending' 
  | 'completed' 
  | 'failed' 
  | 'refunded';

export type StoreOrderFulfillmentStatus = 
  | 'pending'      // في انتظار التجميع
  | 'collecting'    // قيد التجميع
  | 'verifying'     // قيد التحقق
  | 'packaging'     // قيد التغليف
  | 'ready'         // جاهز للتسليم
  | 'completed';    // تم التسليم

export interface ShippingAddress {
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  [key: string]: unknown;
}

export interface StoreOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product_data?: {
    name_ar?: string;
    name_en?: string;
    image_url?: string;
    sku?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

export interface StoreOrder {
  id: string;
  order_number: string;
  customer_id: string | null;
  shop_id: string;
  status: StoreOrderStatus;
  fulfillment_status?: StoreOrderFulfillmentStatus; // حالة التجميع في المخزن
  final_amount: number;
  payment_method: StorePaymentMethod | null;
  payment_status: StorePaymentStatus;
  shipping_address: ShippingAddress | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Fulfillment stage timestamps
  pending_at?: string | null;
  collecting_at?: string | null;
  verifying_at?: string | null;
  packaging_at?: string | null;
  ready_at?: string | null;
  completed_at?: string | null;
  // Relations
  shop?: {
    id: string;
    name_ar: string;
    name_en?: string | null;
  };
  customer?: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  agent?: {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
  items?: StoreOrderItem[];
}

export interface StoreOrdersFilters {
  status?: StoreOrderStatus | 'all';
  shop_id?: string;
  customer_id?: string;
  payment_status?: StorePaymentStatus;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

export interface StoreOrdersState {
  orders: StoreOrder[];
  filteredOrders: StoreOrder[];
  selectedOrder: StoreOrder | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  filters: StoreOrdersFilters;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

