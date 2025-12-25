import { Prisma } from '@prisma/client';

// Enums
export type CustomerType = 'retail' | 'agent' | 'wholesale' | 'other';
export type InvoiceStatus = 'pending' | 'received' | 'priced' | 'approved' | 'rejected';
export type PricingStatus = 'draft' | 'pending_approval' | 'approved' | 'active' | 'inactive';

// Warehouse Invoice
export interface WarehouseInvoice {
  id: string;
  invoice_number: string;
  warehouse_id: number;
  supplier_id: number | null;
  invoice_date: Date;
  received_date: Date | null;
  total_amount: Prisma.Decimal;
  status: InvoiceStatus;
  notes: string | null;
  created_by: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  warehouse_invoice_items?: WarehouseInvoiceItem[];
}

// Warehouse Invoice Item
export interface WarehouseInvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  quantity: Prisma.Decimal;
  unit_price: Prisma.Decimal;
  total_price: Prisma.Decimal;
  measurement_unit: string;
  batch_number: string | null;
  expiry_date: Date | null;
  notes: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  warehouse_invoices?: WarehouseInvoice;
  store_products?: any; // Product type
  product_pricing?: ProductPricing[];
}

// Customer Pricing Rules
export interface CustomerPricingRule {
  id: string;
  customer_type: CustomerType;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  markup_percentage: Prisma.Decimal;
  discount_percentage: Prisma.Decimal;
  min_order_amount: Prisma.Decimal | null;
  max_discount_amount: Prisma.Decimal | null;
  is_active: boolean | null;
  priority: number | null;
  created_at: Date | null;
  updated_at: Date | null;
}

// Product Pricing
export interface ProductPricing {
  id: string;
  invoice_item_id: string;
  customer_type: CustomerType;
  cost_price: Prisma.Decimal;
  selling_price: Prisma.Decimal;
  markup_percentage: Prisma.Decimal;
  profit_margin: Prisma.Decimal;
  status: PricingStatus;
  effective_from: Date;
  effective_to: Date | null;
  approved_by: string | null;
  approved_at: Date | null;
  notes: string | null;
  created_by: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  warehouse_invoice_items?: WarehouseInvoiceItem;
  pricing_history?: PricingHistory[];
}

// Pricing History
export interface PricingHistory {
  id: string;
  product_pricing_id: string;
  old_cost_price: Prisma.Decimal | null;
  old_selling_price: Prisma.Decimal | null;
  new_cost_price: Prisma.Decimal | null;
  new_selling_price: Prisma.Decimal | null;
  change_reason: string | null;
  changed_by: string;
  changed_at: Date | null;
  product_pricing?: ProductPricing;
}

// Form Data Types
export interface WarehouseInvoiceFormData {
  invoice_number: string;
  warehouse_id: number;
  supplier_id: number | null;
  invoice_date: Date;
  received_date: Date | null;
  total_amount: number;
  status: InvoiceStatus;
  notes: string | null;
  items: WarehouseInvoiceItemFormData[];
}

export interface WarehouseInvoiceItemFormData {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  measurement_unit: string;
  batch_number: string | null;
  expiry_date: Date | null;
  notes: string | null;
}

export interface ProductPricingFormData {
  invoice_item_id: string;
  customer_type: CustomerType;
  cost_price: number;
  selling_price: number;
  markup_percentage: number;
  profit_margin: number;
  status: PricingStatus;
  effective_from: Date;
  effective_to: Date | null;
  notes: string | null;
}

export interface CustomerPricingRuleFormData {
  customer_type: CustomerType;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  markup_percentage: number;
  discount_percentage: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  is_active: boolean;
  priority: number;
}

// Extended types with relations
export interface WarehouseInvoiceWithItems extends WarehouseInvoice {
  warehouse_invoice_items: (WarehouseInvoiceItem & {
    store_products: {
      id: string;
      name_ar: string;
      name_en: string | null;
      sku: string;
    };
  })[];
}

export interface ProductPricingWithDetails extends ProductPricing {
  warehouse_invoice_items: WarehouseInvoiceItem & {
    store_products: {
      id: string;
      name_ar: string;
      name_en: string | null;
      sku: string;
    };
  };
}

// Customer type labels
export const CUSTOMER_TYPE_LABELS: Record<CustomerType, { ar: string; en: string }> = {
  retail: { ar: 'عملاء التجزئة', en: 'Retail Customers' },
  agent: { ar: 'الوكلاء المعتمدون', en: 'Approved Agents' },
  wholesale: { ar: 'تجار الجملة', en: 'Wholesale Traders' },
  other: { ar: 'عملاء آخرون', en: 'Other Customers' },
};

// Invoice status labels
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, { ar: string; en: string }> = {
  pending: { ar: 'في انتظار', en: 'Pending' },
  received: { ar: 'مستلمة', en: 'Received' },
  priced: { ar: 'مسعرة', en: 'Priced' },
  approved: { ar: 'معتمدة', en: 'Approved' },
  rejected: { ar: 'مرفوضة', en: 'Rejected' },
};

// Pricing status labels
export const PRICING_STATUS_LABELS: Record<PricingStatus, { ar: string; en: string }> = {
  draft: { ar: 'مسودة', en: 'Draft' },
  pending_approval: { ar: 'في انتظار الموافقة', en: 'Pending Approval' },
  approved: { ar: 'معتمد', en: 'Approved' },
  active: { ar: 'نشط', en: 'Active' },
  inactive: { ar: 'غير نشط', en: 'Inactive' },
};
