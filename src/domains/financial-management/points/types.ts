/**
 * Types and Interfaces for Points Management System
 */

export interface PointsConfiguration {
  id: string;
  subcategory_id: string;
  points_per_kg: number;
  price_per_kg: number;
  point_value: number;
  is_active: boolean;
  min_weight?: number;
  max_weight?: number;
  bonus_multiplier?: number;
  description?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  subcategory_name?: string;
  category_name?: string;
}

export interface PointsConfigurationFormData {
  subcategory_id: string;
  points_per_kg: number;
  price_per_kg: number;
  point_value: number;
  is_active: boolean;
  min_weight?: number;
  max_weight?: number;
  bonus_multiplier?: number;
  description?: string;
}

export interface PointsTransaction {
  id: string;
  profile_id: string;
  transaction_type: PointsTransactionType;
  points: number;
  points_value?: number; // القيمة المالية للنقاط
  balance_before: number;
  balance_after: number;
  description?: string;
  related_order_id?: string;
  related_collection_id?: string;
  created_by?: string;
  created_at: string;
  // Joined data
  customer_name?: string;
  customer_phone?: string;
  order_number?: string;
}

export enum PointsTransactionType {
  EARNED = 'EARNED', // كسب نقاط
  USED = 'USED', // استخدام نقاط
  EXPIRED = 'EXPIRED', // انتهاء صلاحية
  ADJUSTED = 'ADJUSTED', // تعديل يدوي
  REFUNDED = 'REFUNDED', // استرداد
  BONUS = 'BONUS', // مكافأة
}

export interface PointsValueHistory {
  id: string;
  points_configuration_id?: string;
  old_value: number;
  new_value: number;
  change_reason?: string;
  changed_by?: string;
  changed_at: string;
  // Joined data
  subcategory_name?: string;
}

export interface PointsReport {
  total_points_granted: number;
  total_points_used: number;
  total_points_pending: number;
  total_financial_value: number;
  points_by_category: Array<{
    category_name: string;
    points_granted: number;
    points_used: number;
    financial_value: number;
  }>;
  transactions_count: number;
  period_start: string;
  period_end: string;
}

export interface PointsSummary {
  total_customers_with_points: number;
  total_points_balance: number;
  total_financial_value: number;
  average_points_per_customer: number;
  top_customers: Array<{
    customer_id: string;
    customer_name: string;
    points_balance: number;
    financial_value: number;
  }>;
}

export interface PointsPricingSettings {
  default_point_value: number;
  min_point_value: number;
  max_point_value: number;
  points_expiry_days?: number;
  max_points_per_transaction?: number;
  conversion_rate?: number; // معدل التحويل (مثال: 100 نقطة = 10 جنيه)
}
