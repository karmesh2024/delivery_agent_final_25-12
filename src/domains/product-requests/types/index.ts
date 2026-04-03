/**
 * أنواع طلبات إضافة المنتجات الجديدة
 */

export type ProductRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "needs_revision";

export type ProductRequestPriority = "normal" | "high" | "urgent";

export interface ProductRequest {
  id: string;
  request_number: string;
  requested_by_user_id: string;
  requested_by_department: string | null;
  product_name: string;
  main_category_id: number | null;
  sub_category_id: number | null;
  description: string | null;
  specifications: Record<string, unknown> | null;
  proposed_price: number | null;
  cost_price: number | null;
  profit_margin_percentage: number | null;
  market_study_url: string | null;
  financial_analysis_url: string | null;
  logistics_assessment_url: string | null;
  procurement_report_url: string | null;
  status: ProductRequestStatus;
  priority: ProductRequestPriority;
  reviewed_by_user_id: string | null;
  review_notes: string | null;
  rejection_reason: string | null;
  catalog_waste_id: number | null;
  waste_data_id: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  approved_at: string | null;
  // علاقات (من select مع join)
  waste_main_categories?: { id: number; name: string } | null;
  waste_sub_categories?: { id: number; name: string } | null;
}

export type ProductRequestCreate = Omit<
  ProductRequest,
  | "id"
  | "request_number"
  | "catalog_waste_id"
  | "waste_data_id"
  | "created_at"
  | "updated_at"
  | "reviewed_at"
  | "approved_at"
  | "reviewed_by_user_id"
> & {
  request_number?: string;
};

export type ProductRequestUpdate = Partial<
  Pick<
    ProductRequest,
    | "status"
    | "review_notes"
    | "rejection_reason"
    | "reviewed_by_user_id"
    | "reviewed_at"
    | "approved_at"
  >
>;
