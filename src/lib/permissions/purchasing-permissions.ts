import { hasPermission } from '@/utils/permissions';

/**
 * صلاحيات إدارة المشتريات
 */
export const PURCHASING_PERMISSIONS = {
  // إدارة الفواتير
  CREATE_INVOICE: 'purchasing:invoices:create',
  VIEW_INVOICES: 'purchasing:invoices:view',
  EDIT_INVOICE: 'purchasing:invoices:edit',
  DELETE_INVOICE: 'purchasing:invoices:delete',
  APPROVE_INVOICE: 'purchasing:invoices:approve',
  SEND_TO_WAREHOUSE: 'purchasing:invoices:send_to_warehouse',
  SEND_TO_PRICING: 'purchasing:invoices:send_to_pricing',
  
  // إدارة الموردين
  MANAGE_SUPPLIERS: 'purchasing:suppliers:manage',
} as const;

/**
 * صلاحيات إدارة المخازن
 */
export const WAREHOUSE_PERMISSIONS = {
  // أوامر الإسناد
  VIEW_ASSIGNMENTS: 'warehouse:assignments:view',
  RECEIVE_ASSIGNMENT: 'warehouse:assignments:receive',
  UPDATE_ASSIGNMENT: 'warehouse:assignments:update',
  
  // إدارة المخزون
  VIEW_INVENTORY: 'warehouse:inventory:view',
  MANAGE_INVENTORY: 'warehouse:inventory:manage',
} as const;

// Export for backward compatibility
export { WAREHOUSE_PERMISSIONS as WAREHOUSE_ASSIGNMENT_PERMISSIONS };

/**
 * صلاحيات إدارة التسعير
 */
export const PRICING_PERMISSIONS = {
  // إدارة الأسعار
  VIEW_PRICING: 'pricing:view',
  SET_PRICING: 'pricing:set',
  APPROVE_PRICING: 'pricing:approve',
  VIEW_COST_PRICE: 'pricing:view_cost', // صلاحية خاصة لرؤية سعر التكلفة
} as const;

/**
 * التحقق من صلاحية إدارة المشتريات
 */
export async function checkPurchasingPermission(
  userId: string | null | undefined,
  permission: keyof typeof PURCHASING_PERMISSIONS
): Promise<boolean> {
  if (!userId) return false;
  return await hasPermission(userId, PURCHASING_PERMISSIONS[permission]);
}

/**
 * التحقق من صلاحية إدارة المخازن
 */
export async function checkWarehousePermission(
  userId: string | null | undefined,
  permission: keyof typeof WAREHOUSE_PERMISSIONS
): Promise<boolean> {
  if (!userId) return false;
  return await hasPermission(userId, WAREHOUSE_PERMISSIONS[permission]);
}

/**
 * التحقق من صلاحية إدارة التسعير
 */
export async function checkPricingPermission(
  userId: string | null | undefined,
  permission: keyof typeof PRICING_PERMISSIONS
): Promise<boolean> {
  if (!userId) return false;
  return await hasPermission(userId, PRICING_PERMISSIONS[permission]);
}

