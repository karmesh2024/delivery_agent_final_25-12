import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger-safe';

/**
 * صلاحيات إدارة المخلفات
 */
export const WASTE_MANAGEMENT_PERMISSIONS = {
  // صلاحيات الكتالوج
  CATALOG_CREATE: 'waste:catalog:create',
  CATALOG_UPDATE: 'waste:catalog:update',
  CATALOG_DELETE: 'waste:catalog:delete',
  CATALOG_VIEW: 'waste:catalog:view',
  
  // صلاحيات التسعير
  PRICING_SET_BASE: 'waste:pricing:set_base',
  PRICING_UPDATE_SMALL: 'waste:pricing:update_small', // تغييرات صغيرة (< 10%)
  PRICING_UPDATE_LARGE: 'waste:pricing:update_large', // تغييرات كبيرة (>= 10%)
  PRICING_APPROVE: 'waste:pricing:approve', // الموافقة على التغييرات الكبيرة
  
  // صلاحيات البورصة
  EXCHANGE_VIEW: 'waste:exchange:view',
  EXCHANGE_MANAGE: 'waste:exchange:manage',
  
  // صلاحيات الشركاء الصناعيين
  PARTNERS_VIEW: 'waste:partners:view',
  PARTNERS_MANAGE: 'waste:partners:manage',
  PARTNERS_ORDERS_APPROVE: 'waste:partners:orders:approve',
  
  // صلاحيات الاستلام والتحقق
  RECEIVING_VIEW: 'waste:receiving:view',
  RECEIVING_VERIFY: 'waste:receiving:verify',
  RECEIVING_APPROVE: 'waste:receiving:approve',
  
  // صلاحيات مراقبة المخازن
  WAREHOUSE_MONITOR: 'waste:warehouse:monitor',
  WAREHOUSE_MANAGE: 'waste:warehouse:manage',
} as const;

/**
 * التحقق من صلاحية إدارة المخلفات
 */
export async function checkWasteManagementPermission(
  userId: string,
  permission: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // جلب معلومات المسؤول
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, role_id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return {
        allowed: false,
        reason: 'المستخدم غير موجود أو غير نشط'
      };
    }

    // التحقق من الصلاحية عبر الدور
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { data: rolePermission, error: roleError } = await supabase
      .from('role_permissions')
      .select('permission_id, permissions!inner(code)')
      .eq('role_id', admin.role_id)
      .eq('permissions.code', permission)
      .single();

    if (!roleError && rolePermission) {
      return { allowed: true };
    }

    // التحقق من الصلاحيات المخصصة للمسؤول (overrides)
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { data: override, error: overrideError } = await supabase
      .from('admin_permissions_overrides')
      .select('is_granted, permissions!inner(code)')
      .eq('admin_id', admin.id)
      .eq('permissions.code', permission)
      .eq('is_granted', true)
      .single();

    if (!overrideError && override) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `لا تملك الصلاحية: ${permission}`
    };
  } catch (error) {
    logger.error('خطأ في التحقق من صلاحية إدارة المخلفات:', error);
    return {
      allowed: false,
      reason: 'حدث خطأ أثناء التحقق من الصلاحيات'
    };
  }
}

/**
 * التحقق من صلاحية إدارة الكتالوج
 */
export async function canManageCatalog(
  userId: string,
  action: 'create' | 'update' | 'delete' | 'view'
): Promise<{ allowed: boolean; reason?: string }> {
  const permissionMap = {
    create: WASTE_MANAGEMENT_PERMISSIONS.CATALOG_CREATE,
    update: WASTE_MANAGEMENT_PERMISSIONS.CATALOG_UPDATE,
    delete: WASTE_MANAGEMENT_PERMISSIONS.CATALOG_DELETE,
    view: WASTE_MANAGEMENT_PERMISSIONS.CATALOG_VIEW,
  };

  return checkWasteManagementPermission(userId, permissionMap[action]);
}

/**
 * التحقق من صلاحية التسعير
 */
export async function canManagePricing(
  userId: string,
  action: 'set_base' | 'update_small' | 'update_large' | 'approve'
): Promise<{ allowed: boolean; reason?: string }> {
  const permissionMap = {
    set_base: WASTE_MANAGEMENT_PERMISSIONS.PRICING_SET_BASE,
    update_small: WASTE_MANAGEMENT_PERMISSIONS.PRICING_UPDATE_SMALL,
    update_large: WASTE_MANAGEMENT_PERMISSIONS.PRICING_UPDATE_LARGE,
    approve: WASTE_MANAGEMENT_PERMISSIONS.PRICING_APPROVE,
  };

  return checkWasteManagementPermission(userId, permissionMap[action]);
}

/**
 * التحقق من صلاحية الاستلام والتحقق
 */
export async function canManageReceiving(
  userId: string,
  action: 'view' | 'verify' | 'approve'
): Promise<{ allowed: boolean; reason?: string }> {
  const permissionMap = {
    view: WASTE_MANAGEMENT_PERMISSIONS.RECEIVING_VIEW,
    verify: WASTE_MANAGEMENT_PERMISSIONS.RECEIVING_VERIFY,
    approve: WASTE_MANAGEMENT_PERMISSIONS.RECEIVING_APPROVE,
  };

  return checkWasteManagementPermission(userId, permissionMap[action]);
}


