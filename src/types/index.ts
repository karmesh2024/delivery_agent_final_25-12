import { Database } from "../lib/database.types";

// تعريف نوع GeoPoint للإحداثيات الجغرافية
export interface GeoPoint {
  lat: number;
  lng: number;
}

// ======= أنواع بيانات الوكلاء الجديدة =======

// يمثل السجل الأساسي في جدول public.agents
export interface CoreAgent {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  password_set_by_admin?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseAgentResponse extends CoreAgent {
  details: RawAgentDetailsSupabase | null;
  profile: RawAgentProfileSupabase | null;
  wallets: Wallet[] | null;
  approved_agent_zones: ApprovedAgentZone[] | null;
  documents?: AgentDocument[] | null;
}

// يمثل السجل في جدول public.agent_details
export interface AgentDetails {
  id: string;
  agent_id: string;
  initial_balance?: number | null;
  currency?: string | null;
  wallet_type?: string | null;
  approved: boolean;
  notes?: string;
  storage_location?: string | null;
  region?: string | null;
  agent_type?: "individual" | "company" | null;
  payment_method?: string | null;
  payment_info?: Record<string, unknown> | null;
  function_specific_commissions?: AgentCommission[] | null;
  created_at: string;
  updated_at: string;
}

// يمثل السجل في جدول public.agent_profiles
export interface AgentProfile {
  id: string; // مفتاح خارجي لـ public.agents.id
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  billing_address?: string | null;
  payment_info?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface RawAgentProfileSupabase {
  id: string; // مفتاح خارجي لـ public.agents.id
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  billing_address?: string | null;
  payment_info?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// يمثل السجل في جدول public.wallets
export interface Wallet {
  id?: string; // قد يكون معرف تلقائي للمحفظة نفسها
  user_id: string; // مفتاح خارجي لـ auth.users.id
  balance: number;
  currency: string;
  wallet_type: string; // مثال: 'AGENT_WALLET', 'CUSTOMER_WALLET'
  created_at?: string; // قد يكون تلقائيًا
  updated_at?: string; // قد يكون تلقائيًا
}

// نوع مركب للوكلاء المعتمدين، يجمع بين جميع التفاصيل
export interface ApprovedAgent extends CoreAgent {
  details?: AgentDetails | null;
  profile?: AgentProfile | null;
  wallet?: Wallet | null;
  documents?: AgentDocument[];
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  approved_agent_zones?: ApprovedAgentZone[] | null;
}

// نوع البيانات لـ payload عند إنشاء وكيل جديد
export interface NewAgentPayload {
  phone: string;
  email?: string;
  password?: string;
  // تفاصيل الوكيل (من AgentDetails)
  storage_location?: string;
  region?: string;
  agent_type?: string;
  payment_method?: string;
  function_specific_commissions?: AgentCommission[];
  documents?: Record<string, unknown>;
  approved?: boolean;
  // ملف تعريف الوكيل (من AgentProfile)
  full_name: string;
  avatar_url?: string;
  billing_address?: string;
  payment_info?: Record<string, unknown>;
  // تفاصيل المحفظة الأولية (من Wallet)
  initial_balance?: number;
  currency?: string;
  wallet_type?: string; // لتجاوز القيمة الافتراضية إذا لزم الأمر
  // المناطق المعتمدة - New Field
  approved_agent_zones?: {
    geographic_zone_id: string;
    zone_name: string;
    is_active: boolean;
    is_primary: boolean;
  }[];
  // المستندات المرفوعة (ستحتوي على عناوين URL بعد الرفع)
  agent_documents?: {
    document_type: string;
    document_url: string;
    verification_status: "pending" | "approved" | "rejected";
  }[];
}

// نوع جديد لتمثيل منطقة وكيل معتمدة قبل إرسالها إلى قاعدة البيانات
export interface NewApprovedAgentZone {
  agent_id: string;
  geographic_zone_id: string;
  zone_name: string;
  is_active: boolean;
  is_primary: boolean;
}

export interface UpdateAgentPayload {
  // Common agent fields
  full_name?: string;
  phone?: string;
  email?: string;
  password?: string; // Only if admin wants to reset/set it

  // Agent Details
  storage_location?: string;
  region?: string;
  agent_type?: "individual" | "company" | null;
  payment_method?: string;
  function_specific_commissions?: AgentCommission[] | null;
  approved?: boolean;
  notes?: string;

  // Agent Profile
  avatar_url?: string;
  billing_address?: string;
  payment_info?: Record<string, unknown>;

  // Wallet
  initial_balance?: number; // For initial setting or adjustment if needed
  currency?: string;
  wallet_type?: string;

  // Approved Agent Zones (full replacement or specific updates)
  approved_agent_zones?: NewApprovedAgentZone[];

  // Agent Documents (for new uploads or updates)
  // This will be handled carefully with file uploads in the component,
  // but here we might receive URLs for existing documents or new ones.
  agent_documents?: {
    document_type: string;
    document_url?: string;
    verification_status?: "pending" | "approved" | "rejected";
    file?: File;
  }[];
}

// النماذج الأصلية
export interface Agent {
  id: string;
  name: string;
  status: "online" | "offline" | "busy";
  avatar_url?: string | null;
  location?: GeoPoint;
  rating?: number | null;
  total_deliveries?: number;
  phone?: string | null;
  last_active?: string | null;
  current_trip_id?: string | null;
  current_order_id?: string | null;
  // الحقول المضافة لتحسين تتبع حالة المندوب
  license_photo_url?: string;
  license_number?: string;
  status_reason?: string;
  status_changed_at?: string;
  // الحقول المضافة من جدول delivery_boys
  delivery_code?: string;
  delivery_code_status?: string;
  referral_code?: string;
  preferred_vehicle?: "tricycle" | "pickup_truck" | "light_truck" | undefined;
  badge_level?: number;
}

// ======= أنواع بيانات المسؤولين الجديدة =======

// نموذج مندوب التوصيل المعزز (يعكس جدول delivery_boys)
export interface DeliveryBoy {
  id: string;
  phone: string;
  email?: string | null;
  full_name: string;
  date_of_birth?: string | null;
  national_id?: string | null;
  preferred_vehicle?: "tricycle" | "pickup_truck" | "light_truck" | null;
  license_number?: string | null;
  phone_verification_status?: string | null;
  delivery_code?: string | null;
  delivery_code_status?: string | null;
  status: "active" | "inactive" | "suspended" | "off_duty";
  total_deliveries: number;
  total_earnings: number;
  rating: number;
  current_latitude?: number | null;
  current_longitude?: number | null;
  is_available: boolean;
  last_location_update?: string | null;
  referral_code?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  last_login?: string | null;
  // الحقول المضافة في المخطط المعزز
  profile_image_url?: string | null;
  device_info?: Record<string, unknown> | null;
  average_response_time?: number | null;
  completed_orders_count?: number | null;
  canceled_orders_count?: number | null;
  badge_level?: number | null;
  last_performance_review?: string | null;
  preferred_zones?: string[] | Record<string, unknown> | null;
}

// نموذج الأداء اليومي للمندوب
export interface DeliveryBoyDailyPerformance {
  id: string;
  delivery_boy_id: string;
  date: string;
  orders_completed: number;
  orders_canceled: number;
  total_distance: number;
  total_earnings: number;
  average_rating: number;
  online_hours: number;
  waste_weight_collected: number;
  created_at: string;
}

export interface Trip {
  id: string;
  agent_id: string;
  status: "assigned" | "in_progress" | "completed" | "canceled";
  start_location: {
    lat: number;
    lng: number;
    address: string;
  };
  end_location: {
    lat: number;
    lng: number;
    address: string;
  };
  distance: number;
  duration: number;
  created_at: string;
  updated_at: string;
  cost: number;
  customer_name: string;
  customer_phone: string;
  agent?: Agent;
}

// Define OrderDetailItem based on the structure observed in the DB jsonb
export interface OrderDetailItem {
  id: string;
  product_name: string;
  quantity?: number;
  total_weight?: number;
  price?: number;
  points?: number;
  category_name?: string;
  subcategory_name?: string;
}

export interface Order {
  id: string;
  status:
    | "pending"
    | "confirmed"
    | "in_progress"
    | "delivered"
    | "canceled"
    | "completed";
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_address?: string | null;
  customer_phone?: string | null;
  total_amount?: number | null;
  agent_id?: string | null;
  agent?: Agent | null;
  delivery_time?: number | null;
  delivery_location?: GeoPoint | string | { lat: number; lng: number } | null;
  delivery_address?: string | null;
  pickup_address?: string | null;
  pickup_location?: GeoPoint | string | { lat: number; lng: number } | null;
  order_number?: string | null;
  notes?: string | null;
  order_details?: OrderDetailItem[] | null;
  payment_method?: string | null;
  rating?: number | null;
}

// نموذج طلب التوصيل المعزز (يعكس جدول delivery_orders)
export interface DeliveryOrder {
  id: string;
  delivery_boy_id?: string;
  customer_order_id?: string;
  order_number: string;
  pickup_location: string | { lat: number; lng: number } | GeoPoint; // geometry type
  delivery_location: string | { lat: number; lng: number } | GeoPoint; // geometry type
  pickup_address: string;
  delivery_address: string;
  customer_name?: string;
  customer_phone: string;
  estimated_distance?: number;
  estimated_time?: number;
  expected_total_amount?: number;
  actual_total_amount?: number;
  is_verified?: boolean;
  actual_pickup_time?: string;
  actual_delivery_time?: string;
  notes?: string;
  voice_notes?: string[] | Record<string, string>;
  created_at: string;
  updated_at: string;
  order_id?: string;
  user_type?: string;
  status?: string;
  is_priority?: boolean;
  category_name?: string;
  subcategory_name?: string;
  // الحقول المضافة في المخطط المعزز
  analytics_data?: Record<string, unknown>;
  customer_feedback?: string;
  delivery_route?: GeoPoint[] | string;
  order_processing_time?: number;
  customer_waiting_time?: number;
  weather_conditions?: Record<string, string | number>;
  order_details?: OrderDetailItem[] | null;
}

// نموذج جلسة جمع النفايات
export interface WasteCollectionSession {
  id: string;
  delivery_order_id: string;
  delivery_boy_id: string;
  customer_id: string;
  status: string;
  total_weight?: number;
  total_amount?: number;
  total_points?: number;
  started_at?: string;
  completed_at?: string;
  location_lat?: number;
  location_lng?: number;
  payment_method?: string;
  payment_status?: string;
  signature_url?: string;
  created_at: string;
  updated_at: string;
  customer_approval_status?: string;
  customer_approval_timestamp?: string;
  customer_comment?: string;
  // الحقول المضافة في المخطط المعزز
  collection_efficiency?: number;
  collection_notes?: string;
  quality_score?: number;
  photos?: string[] | Record<string, string>;
}

// نموذج عنصر جمع النفايات
export interface WasteCollectionItem {
  id: string;
  session_id: string;
  waste_data_id: string;
  category_id: string;
  subcategory_id?: string;
  name: string;
  actual_weight: number;
  unit_price: number;
  total_price: number;
  earned_points?: number;
  measurement_photo_url?: string;
  created_at: string;
  updated_at: string;
}

// نموذج فاتورة النفايات
export interface WasteInvoice {
  id: string;
  session_id: string;
  invoice_number: string;
  subtotal: number;
  tax?: number;
  total: number;
  status: string;
  qr_code_url?: string;
  offline_code?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  order_id?: string;
  customer_approval_status?: string;
  customer_approval_timestamp?: string;
  customer_comment?: string;
  items?: Array<{ id: string; name: string; quantity: number; price: number }>;
}

// نموذج لإحصاءات لوحة التحكم
export interface AnalyticsDashboard {
  id: string;
  date: string;
  total_orders: number;
  completed_orders: number;
  canceled_orders: number;
  total_waste_collected: number;
  total_revenue: number;
  active_agents: number;
  average_delivery_time: number;
  average_collection_efficiency: number;
  stats_by_waste_type?: Record<string, number>;
  stats_by_area?: Record<string, number>;
  created_at: string;
  updated_at: string;
}

// نموذج المركبة
export interface DeliveryVehicle {
  id: string;
  registration_number: string;
  vehicle_type: string;
  capacity?: number;
  fuel_efficiency?: number;
  maintenance_status?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  assigned_agent_id?: string;
  status: string;
  location?: { lat: number; lng: number } | GeoPoint;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}
export type DeliveryBoyStatus =
  | "all"
  | "active"
  | "inactive"
  | "suspended"
  | "off_duty";
export type WasteCollectionStatus =
  | "all"
  | "pending"
  | "in_progress"
  | "completed"
  | "canceled";
export type CustomerApprovalStatus =
  | "all"
  | "pending"
  | "approved"
  | "rejected";
export interface OrderStats {
  avg_delivery_time: number;
  pending: number;
  total: number;
  in_progress: number;
  delivered: number;
  canceled: number;
  excellent_trips: number;
}

export type AgentStatus = "all" | "online" | "offline" | "busy";
export type OrderStatus =
  | "all"
  | "pending"
  | "confirmed"
  | "pickedUp"
  | "inReceipt"
  | "completed"
  | "cancelled"
  | "scheduled"
  | "returned"
  | "canceled"
  | "in_progress"
  | "delivered"
  | "assigned";
export type TripStatus =
  | "all"
  | "assigned"
  | "in_progress"
  | "completed"
  | "canceled";
export type TaskStatus = "all_tasks" | "on_going" | "scheduled";

// ======= أنواع بيانات نطاق الرسائل =======

/**
 * نوع بيانات رسالة
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  messageType?: string;
  metadata?: Record<string, unknown>;
  replyToId?: string; // معرف الرسالة المرد عليها
}

/**
 * نوع بيانات محادثة
 */
export interface Conversation {
  id: string;
  agentId: string;
  lastMessage: string;
  timestamp: Date;
  unread: boolean;
  type?: string;
}

/**
 * حالة صفحة الرسائل
 */
export interface MessagesState {
  conversations: Conversation[];
  messages: Message[];
  loading: boolean;
  searchTerm: string;
  messageInput: string;
  selectedConversation: string | null;
  agents: Agent[];
  error: string | null;
}

// نموذج مستند المندوب (يعكس جدول delivery_documents)
export interface DeliveryDocument {
  id: string;
  delivery_id: string;
  document_type: string;
  document_url: string;
  verification_status: "pending" | "verified" | "rejected";
  uploaded_at: string;
  expiry_date?: string; // تاريخ انتهاء الصلاحية للمستند
  reviewer_id?: string; // معرف المراجع/الآدمن الذي تحقق من المستند
  review_notes?: string; // ملاحظات المراجعة
  rejection_reason?: string; // سبب الرفض في حالة رفض المستند
  last_updated: string; // آخر تحديث للمستند
}

// حالة صلاحية المستند
export enum DocumentStatus {
  VALID = "valid", // صالح
  EXPIRING_SOON = "expiring_soon", // على وشك الانتهاء
  EXPIRED = "expired", // منتهي الصلاحية
  MISSING = "missing", // غير موجود
  REJECTED = "rejected", // مرفوض
}

// واجهة لنتائج استعلام SQL المسطحة في ApprovedAgentSummary
export interface RawApprovedAgentQueryResult {
  id: string;
  created_at: string;
  auth_user_id: string;
  profile_id: string | null;
  phone: string | null;
  avatar_url: string | null;
  username: string | null;
  full_name: string | null;
  email: string | null;
  details_id: string | null;
  approved: boolean | null;
  notes: string | null;
  initial_balance: number | null;
  currency: string | null;
  wallet_type: string | null;
  areas_covered: string | null;
  wallet_id: string | null;
  balance: number | null;
  wallet_created_at: string | null;
}

export interface AgentDocument {
  id: string;
  agent_id: string;
  document_type: DocumentType;
  document_url: string;
  verification_status: "pending" | "approved" | "rejected";
  uploaded_at: string;
  last_updated: string;
  expiry_date?: string | null;
  reviewer_id?: string | null;
  review_notes?: string | null;
  rejection_reason?: string | null;
  severity?: "low" | "medium" | "high";
}

export type ApprovedAgentZone =
  Database["public"]["Tables"]["approved_agent_zones"]["Row"];

export interface GeographicZone {
  id: string;
  name: string;
  description: string | null;
  area_polygon: GeoJSONPolygon;
  center_point: GeoJSONPoint;
  is_active: boolean;
  created_at: string;
}

export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export type CommissionUnit = "percentage" | "fixed_amount";

export type CommissionType =
  | "waste_purchase"
  | "product_sale"
  | "cash_withdrawal"
  | "other"; // إضافة "أخرى" كنوع عام

export interface AgentCommission {
  type: CommissionType;
  value: number;
  unit: CommissionUnit;
}

export interface RawAgentDetailsSupabase {
  id: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
  storage_location?: string | null;
  region?: string | null;
  agent_type?: "individual" | "company" | null;
  payment_method?: string | null;
  function_specific_commissions?: AgentCommission[] | null;
}

export type DocumentType =
  | "national_id_front"
  | "national_id_back"
  | "personal_photo"
  | "tax_card_front"
  | "tax_card_back"
  | "contract"
  | "other";

export const documentTypeLabels: Record<DocumentType, string> = {
  national_id_front: "الهوية الوطنية (الوجه الأمامي)",
  national_id_back: "الهوية الوطنية (الوجه الخلفي)",
  personal_photo: "الصورة الشخصية",
  tax_card_front: "البطاقة الضريبية (الوجه الأمامي)",
  tax_card_back: "البطاقة الضريبية (الوجه الخلفي)",
  contract: "العقد",
  other: "مستند آخر",
};

// أنواع إدارة الفئات والمنتجات
export interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SubCategory {
  id: string;
  name: string;
  category_id: string | null;
  description: string | null;
  image_url: string | null;
  price: number | null;
  points_per_kg: number | null;
  created_at: string | null;
  updated_at: string | null;
  categories?: {
    name: string;
  };
}

export interface WasteItem {
  id: string;
  name: string;
  category_id: string | null;
  subcategory_id: string | null;
  description: string | null;
  image_url: string | null;
  weight: number;
  price: number;
  quantity: number;
  points: number;
  initial_points: number;
  created_at: string | null;
  updated_at: string | null;
  categories?: {
    name: string;
  };
  subcategories?: {
    name: string;
  };
}

export type AdminPermissions = Record<string, boolean>;
