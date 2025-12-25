import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger-safe';

/**
 * دالة للتحقق من الصلاحيات المدمجة (System + Warehouse Hierarchy)
 * تتحقق من:
 * 1. صلاحية النظام (system permission) - مثل warehouses:create
 * 2. صلاحية المخزن الهرمية (warehouse permission) - مثل create_warehouse
 * 3. المستوى الهرمي المسموح
 */
export async function checkWarehouseOperationPermission(
  userId: string,
  warehouseId: number | null,
  systemPermission: string, // مثل 'warehouses:create'
  warehousePermission: string, // مثل 'create_warehouse'
  targetLevel?: string // المستوى المطلوب إنشاؤه (لعمليات الإنشاء)
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // 1. التحقق من صلاحية النظام
    const hasSystemPermission = await checkSystemPermission(userId, systemPermission);
    if (!hasSystemPermission) {
      return {
        allowed: false,
        reason: `لا تملك صلاحية النظام: ${systemPermission}`
      };
    }

    // 2. إذا كان هناك مخزن محدد (الأب)، التحقق من صلاحية المخزن الهرمية
    if (warehouseId) {
      const hasWarehousePermission = await checkWarehouseHierarchyPermission(
        warehouseId,
        warehousePermission
      );
      if (!hasWarehousePermission) {
        return {
          allowed: false,
          reason: `لا تملك صلاحية المخزن: ${warehousePermission}`
        };
      }

      // 3. للعمليات التي تتطلب مستوى معين (مثل إنشاء مخزن)
      // نتحقق من أن المخزن الأب يمكنه إنشاء المستوى المطلوب
      if (targetLevel) {
        const warehouseLevel = await getWarehouseLevel(warehouseId);
        if (warehouseLevel) {
          const allowedLevels = getAllowedChildLevels(warehouseLevel);
          if (!allowedLevels.includes(targetLevel as any)) {
            return {
              allowed: false,
              reason: `المستوى ${targetLevel} غير مسموح تحت المستوى ${warehouseLevel}`
            };
          }
        } else {
          return {
            allowed: false,
            reason: 'تعذر تحديد مستوى المخزن الأب'
          };
        }
      }
    } else if (targetLevel) {
      // إذا لم يكن هناك مخزن أب، يجب أن يكون المستوى المطلوب هو "country" فقط
      // (لأن الدولة فقط يمكن إنشاؤها مباشرة تحت الإدارة العليا)
      if (targetLevel !== 'country') {
        return {
          allowed: false,
          reason: 'يجب تحديد مخزن أب لإنشاء مخزن على مستوى ' + targetLevel
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    logger.error('خطأ في التحقق من صلاحيات المخزن:', error);
    return {
      allowed: false,
      reason: 'حدث خطأ أثناء التحقق من الصلاحيات'
    };
  }
}

/**
 * التحقق من صلاحية النظام (System Permission)
 */
async function checkSystemPermission(userId: string, permissionCode: string): Promise<boolean> {
  try {
    // جلب معلومات المسؤول
    const { data: admin, error: adminError } = await supabase!
      .from('admins')
      .select('id, role_id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return false;
    }

    // التحقق من الصلاحية عبر الدور
    const { data: rolePermission, error: roleError } = await supabase!
      .from('role_permissions')
      .select('permission_id, permissions!inner(code)')
      .eq('role_id', admin.role_id)
      .eq('permissions.code', permissionCode)
      .single();

    if (!roleError && rolePermission) {
      return true;
    }

    // التحقق من الصلاحيات المخصصة للمسؤول (overrides)
    const { data: override, error: overrideError } = await supabase!
      .from('admin_permissions_overrides')
      .select('is_granted, permissions!inner(code)')
      .eq('admin_id', admin.id)
      .eq('permissions.code', permissionCode)
      .eq('is_granted', true)
      .single();

    if (!overrideError && override) {
      return true;
    }

    return false;
  } catch (error) {
    logger.error('خطأ في التحقق من صلاحية النظام:', error);
    return false;
  }
}

/**
 * التحقق من صلاحية المخزن الهرمية (Warehouse Hierarchy Permission)
 */
async function checkWarehouseHierarchyPermission(
  warehouseId: number,
  permissionType: string
): Promise<boolean> {
  try {
    // التحقق من الصلاحيات المباشرة
    const { data: permission, error: permError } = await supabase!
      .from('warehouse_permissions')
      .select('permission_value, expires_at')
      .eq('warehouse_id', warehouseId)
      .eq('permission_type', permissionType)
      .single();

    if (!permError && permission) {
      // التحقق من انتهاء الصلاحية
      if (permission.expires_at) {
        const expiresAt = new Date(permission.expires_at);
        if (expiresAt < new Date()) {
          return false; // الصلاحية منتهية
        }
      }
      return permission.permission_value === true;
    }

    // التحقق من الصلاحيات المفوضة
    const { data: delegation, error: delError } = await supabase!
      .from('permission_delegations')
      .select('permission_types, expires_at, delegator_warehouse_id')
      .eq('delegatee_warehouse_id', warehouseId)
      .eq('is_active', true)
      .single();

    if (!delError && delegation) {
      // التحقق من انتهاء التفويض
      if (delegation.expires_at) {
        const expiresAt = new Date(delegation.expires_at);
        if (expiresAt < new Date()) {
          return false;
        }
      }

      // التحقق من أن الصلاحية المطلوبة موجودة في قائمة الصلاحيات المفوضة
      if (Array.isArray(delegation.permission_types) && 
          delegation.permission_types.includes(permissionType)) {
        // التحقق من أن المخزن المفوض لديه الصلاحية
        const { data: delegatorPerm, error: delegatorError } = await supabase!
          .from('warehouse_permissions')
          .select('permission_value')
          .eq('warehouse_id', delegation.delegator_warehouse_id)
          .eq('permission_type', permissionType)
          .single();

        if (!delegatorError && delegatorPerm && delegatorPerm.permission_value === true) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    logger.error('خطأ في التحقق من صلاحية المخزن الهرمية:', error);
    return false;
  }
}

/**
 * جلب مستوى المخزن
 */
async function getWarehouseLevel(warehouseId: number): Promise<string | null> {
  try {
    // محاولة أولى: من جدول warehouses مباشرة
    const { data: warehouse, error: warehouseError } = await supabase!
      .from('warehouses')
      .select('warehouse_level, level_id')
      .eq('id', warehouseId)
      .single();

    if (!warehouseError && warehouse) {
      // إذا كان هناك warehouse_level مباشرة (VARCHAR)
      if (warehouse.warehouse_level) {
        return warehouse.warehouse_level;
      }
      
      // إذا كان هناك level_id (UUID)، نحتاج جلب الكود من warehouse_levels
      if (warehouse.level_id) {
        const { data: level, error: levelError } = await supabase!
          .from('warehouse_levels')
          .select('code')
          .eq('id', warehouse.level_id)
          .single();
        
        if (!levelError && level) {
          return level.code;
        }
      }
    }

    // محاولة ثانية: من جدول warehouse_hierarchy
    const { data: hierarchy, error: hierarchyError } = await supabase!
      .from('warehouse_hierarchy')
      .select('level_id, warehouse_levels!inner(code)')
      .eq('warehouse_id', warehouseId)
      .maybeSingle();

    if (!hierarchyError && hierarchy) {
      if ((hierarchy.warehouse_levels as any)?.code) {
        return (hierarchy.warehouse_levels as any).code;
      }
      
      if (hierarchy.level_id) {
        const { data: level, error: levelError } = await supabase!
          .from('warehouse_levels')
          .select('code')
          .eq('id', hierarchy.level_id)
          .single();
        
        if (!levelError && level) {
          return level.code;
        }
      }
    }

    return null;
  } catch (error) {
    logger.error('خطأ في جلب مستوى المخزن:', error);
    return null;
  }
}

/**
 * جلب المستويات المسموح إنشاؤها تحت مستوى معين
 */
function getAllowedChildLevels(level: string): string[] {
  const levelMap: Record<string, string[]> = {
    'admin': ['country', 'city', 'district'],
    'country': ['city', 'district'],
    'city': ['district'],
    'district': []
  };
  return levelMap[level] || [];
}

/**
 * خريطة الصلاحيات: ربط صلاحيات النظام بصلاحيات المخازن
 */
export const PERMISSION_MAPPING: Record<string, { system: string; warehouse: string }> = {
  create_warehouse: {
    system: 'warehouses:create',
    warehouse: 'create_warehouse'
  },
  edit_warehouse: {
    system: 'warehouses:update',
    warehouse: 'edit_warehouse'
  },
  delete_warehouse: {
    system: 'warehouses:delete',
    warehouse: 'delete_warehouse'
  },
  view_reports: {
    system: 'reports:view',
    warehouse: 'view_reports'
  },
  manage_permissions: {
    system: 'warehouses:manage',
    warehouse: 'manage_permissions'
  },
  delegate_permissions: {
    system: 'warehouses:manage',
    warehouse: 'delegate_permissions'
  }
};

/**
 * دالة مساعدة للتحقق من صلاحية عملية مخزن معينة
 */
export async function canPerformWarehouseOperation(
  userId: string,
  warehouseId: number | null,
  operation: keyof typeof PERMISSION_MAPPING,
  targetLevel?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const mapping = PERMISSION_MAPPING[operation];
  if (!mapping) {
    return {
      allowed: false,
      reason: `عملية غير معروفة: ${operation}`
    };
  }

  return checkWarehouseOperationPermission(
    userId,
    warehouseId,
    mapping.system,
    mapping.warehouse,
    targetLevel
  );
}

