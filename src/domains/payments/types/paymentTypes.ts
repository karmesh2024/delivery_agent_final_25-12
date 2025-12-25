/**
 * إحصائيات لوحة تحكم المدفوعات
 */
export interface DashboardStats {
  totalRevenue: number;
  pendingPayoutsCount: number;
  successfulTransactionsCount: number;
  activeWalletsCount: number;
}

/**
 * نقطة بيانات لاتجاهات المعاملات
 */
export interface TransactionTrendPoint {
  name: string; // مثل: اسم الشهر أو التاريخ
  transactions: number; // عدد المعاملات
  revenue: number; // الإيرادات
}

/**
 * تفاصيل معاملة مالية
 */
export interface TransactionDetail {
  id: string;
  date: string; // ISO string format
  type: string; // e.g., 'DEPOSIT', 'WITHDRAWAL', 'ORDER_PAYMENT', 'REFUND', 'PAYOUT_TO_USER'
  amount: string; // Formatted string for display, e.g., "150.00"
  status: 'مكتملة' | 'قيد الانتظار' | 'فاشلة' | 'بانتظار الموافقة'; // Translated status
  user?: string; // Name of the primary user involved (e.g., payout requester, wallet owner for adjustment)
  description?: string | null;
  currency?: string;
  wallet_id?: string;
  balance_before?: number | null;
  balance_after?: number | null;
  related_order_id?: string | null;
  original_transaction_id?: string | null; // For linked transactions like refunds
  admin_actor_id?: string | null; // Admin who performed the action, if applicable
  reference_id?: string | null; // e.g., payment gateway reference
  external_payment_id?: string | null;
  related_entity_id?: string | null; // ID of related entity (e.g., order_id, user_id for profile changes)
  related_entity_type?: string | null; // Type of related entity (e.g., 'ORDER', 'USER_PROFILE')
  initiatedBy?: string; // 'ADMIN', 'USER', 'SYSTEM'
  metadata?: unknown; // from original definition

  // New fields for better display
  payoutRequestId?: string | null;
  adminNotes?: string | null;
  related_transaction_id?: string | null; // for wallet_transactions linking to central
  payment_method_details?: Record<string, unknown> | null;
  admin_id?: string | null;
  notes?: string | null; // general notes if any, different from adminNotes for payouts
  order_id?: string | null; // Explicit order_id if different from related_entity_id
  processedByAdminName?: string | null; // Name of the admin who processed/initiated, if applicable
}

/**
 * بيانات المحفظة
 */
export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED';
  wallet_type: 'CLIENT' | 'DELIVERY_BOY' | 'AGENT' | 'INTERNAL' | 'CUSTOMER_HOME' | 'COMPANY' | 'SYSTEM_FLOAT' | 'SYSTEM_REVENUE' | 'SYSTEM_FEES';
  cash_on_hand?: number;
  collected_materials_value?: number;
}

// Define WalletType enum based on the literal types used in Wallet interface
export enum WalletType {
  CLIENT = 'CLIENT',
  DELIVERY_AGENT = 'DELIVERY_BOY', // Assuming DELIVERY_BOY is the intended value for delivery agents
  AGENT = 'AGENT',
  INTERNAL = 'INTERNAL',
  CUSTOMER_HOME = 'CUSTOMER_HOME',
  COMPANY = 'COMPANY',
  SYSTEM_FLOAT = 'SYSTEM_FLOAT',
  SYSTEM_REVENUE = 'SYSTEM_REVENUE',
  SYSTEM_FEES = 'SYSTEM_FEES'
}

/**
 * بيانات السحب (طلبات السحب) - الواجهة الأساسية المطابقة لجدول payouts بشكل كبير
 */
export interface PayoutRequest {
  id: string;
  user_id: string; 
  wallet_id: string;
  amount_requested: number;
  amount_approved?: number | null;
  currency: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  payout_to_user_payment_method_id: string;
  admin_approver_id?: string | null;
  admin_notes?: string | null;
  user_notes?: string | null; 
  transaction_reference?: string | null;
  wallet_transaction_id?: string | null;
  requested_at: string; // Corresponds to created_at or requested_at in DB
  processed_at?: string | null;
  created_at: string; // Standard created_at from DB
  updated_at: string; // Standard updated_at from DB
}

/**
 * تفاصيل طلب السحب للعرض في الواجهة، تتضمن بيانات مرتبطة
 */
export interface PayoutRequestDetail extends PayoutRequest {
  user_name?: string | null;
  userEmail: string | null; // Email of the user requesting payout
  userPhone: string | null; // Phone of the user requesting payout
  userType: string; // Type of the user (e.g., 'مستخدم', 'مندوب')
  
  wallet_id: string; // Explicitly use wallet_id as it's a direct FK from payouts table
  walletBalance?: number | null; // Balance of the wallet at the time of request or processing
  walletType?: string; // Translated type of the wallet (e.g., 'زبون', 'مندوب توصيل')
  
  paymentMethodName?: string | null | undefined; // e.g., "Vodafone Cash", "Bank Transfer"
  paymentMethodCode?: string | null | undefined; // e.g., "VODAFONE_CASH"
  paymentMethodType?: string | null | undefined; // e.g., "MOBILE_MONEY"
  paymentMethodDetails?: string | null | undefined; // Combined/formatted string of bank details etc.

  // adminName is for the admin who approved/rejected, PayoutRequest has admin_approver_id
  adminName?: string | null; // Name of the admin who processed the request

  translatedStatus?: string; // Translated status for display
  
  // Fields from PayoutRequest are inherited, like:
  // id, user_id, amount_requested, currency, status, admin_notes, user_notes, etc.
}

/**
 * طريقة الدفع / السحب المرتبطة بالمستخدم
 */
export interface UserPaymentMethod {
  id: string;
  user_id: string;
  payment_method_id: string; // FK to payment_methods table
  details: Record<string, string | number | boolean | null | undefined>; // User-specific details, e.g., {"phone_number": "01xxxxxxxxx"}
  is_default: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'FROZEN' | 'SUSPENDED' | 'CLOSED'; // from item_status_enum
  verification_notes?: string | null;
  created_at: string;
  updated_at: string;

  // Optional: Include details from the joined payment_methods table for convenience
  method_name?: string; // e.g., "Vodafone Cash"
  method_code?: string; // e.g., "VODAFONE_CASH"
  method_type?: string; // e.g., "MOBILE_MONEY" (from payment_method_type_enum)
  method_logo_url?: string | null;
}

/**
 * واجهة لمعلومات المستخدم الأساسية (قد يتم نقلها إلى مكان مشترك إذا استخدمت في نطاقات أخرى)
 */
// export interface UserProfile {
//   id: string;
//   full_name: string | null;
//   avatar_url?: string | null;
// }

/**
 * واجهة للمحفظة مع اسم المستخدم المالك للمحفظة
 */
export interface WalletWithUserDetails extends Wallet {
  user_details: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone_number: string | null; 
  } | null;
  auth_users: null;
  // Removed derived_full_name, derived_email, derived_phone, user_profile_type_translation, user_profile_type_code
}

/**
 * واجهة لبيانات إحصائيات لوحة التحكم
 */
// ... existing code ...

// Profile-specific interfaces
export interface CustomerProfile {
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  profile_status: string | null;
}

export interface DeliveryProfile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  is_available: boolean | null;
  status: string | null;
  employment_status: string | null;
}

export interface AdminProfile {
  full_name: string | null;
  email: string | null;
  phone_number?: string | null;
}

export interface AuthUsersLite {
  id: string;
  email: string | null;
  phone: string | null;
  raw_user_meta_data?: {
    full_name?: string;
    name?: string;
    [key: string]: unknown; 
  };
  app_metadata?: {
    provider?: string;
    providers?: string[];
    [key: string]: unknown; 
  };
  customer_profile?: CustomerProfile[] | null; 
  delivery_profile?: DeliveryProfile[] | null; 
  admin_profile?: AdminProfile[] | null; 
}