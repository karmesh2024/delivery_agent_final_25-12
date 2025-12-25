import { AdminPermissions } from './index';

/**
 * نوع صلاحيات النطاق (مفتاح: نوع النطاق، القيمة: مخطط صلاحيات النطاق)
 */
export interface ScopedPermissions {
  [scopeType: string]: {
    [permissionCode: string]: string[];
  };
}

/**
 * نوع صلاحيات المسؤول الموسعة التي تشمل صلاحيات النطاق
 * وتم فصلها عن AdminPermissions لتجنب مشاكل التنميط
 */
export interface ExtendedPermissions {
  /** الصلاحيات العامة */
  permissions: AdminPermissions;
  /** صلاحيات النطاق المحددة */
  scoped_permissions?: ScopedPermissions;
}

/**
 * معلومات نطاق الصلاحية
 */
export interface PermissionScopeInfo {
  type: string;
  value: string;
}

/**
 * إضافة صلاحية إلى كائن الصلاحيات الموسعة
 */
export function addPermission(
  extendedPermissions: ExtendedPermissions,
  permissionCode: string,
  value: boolean = true
): ExtendedPermissions {
  return {
    ...extendedPermissions,
    permissions: {
      ...extendedPermissions.permissions,
      [permissionCode]: value
    }
  };
}

/**
 * إضافة صلاحية نطاق إلى كائن الصلاحيات الموسعة
 */
export function addScopedPermission(
  extendedPermissions: ExtendedPermissions,
  permissionCode: string,
  scopeType: string,
  scopeValue: string
): ExtendedPermissions {
  // إنشاء نسخة جديدة من كائن الصلاحيات
  const newExtendedPermissions = { ...extendedPermissions };
  
  // التأكد من وجود كائن صلاحيات النطاق
  if (!newExtendedPermissions.scoped_permissions) {
    newExtendedPermissions.scoped_permissions = {};
  }
  
  // التأكد من وجود كائن نوع النطاق
  if (!newExtendedPermissions.scoped_permissions[scopeType]) {
    newExtendedPermissions.scoped_permissions[scopeType] = {};
  }
  
  // التأكد من وجود مصفوفة الصلاحية
  if (!newExtendedPermissions.scoped_permissions[scopeType][permissionCode]) {
    newExtendedPermissions.scoped_permissions[scopeType][permissionCode] = [];
  }
  
  // إضافة قيمة النطاق إذا لم تكن موجودة بالفعل
  if (!newExtendedPermissions.scoped_permissions[scopeType][permissionCode].includes(scopeValue)) {
    newExtendedPermissions.scoped_permissions[scopeType][permissionCode].push(scopeValue);
  }
  
  return newExtendedPermissions;
}

/**
 * (مهملة - Deprecated) التحقق المحلي من وجود صلاحية.
 * يوصى باستخدام الدالة غير المتزامنة `hasPermission` من `utils/permissions.ts` 
 * أو استدعاء API المناسب للتحقق الدقيق من قاعدة البيانات.
 */
/*
export function hasPermission(
  extendedPermissions: ExtendedPermissions,
  permissionCode: string
): boolean {
  // التحقق من وجود الصلاحية العامة
  return extendedPermissions.permissions[permissionCode] === true;
}
*/

/**
 * (مهملة - Deprecated) التحقق المحلي من وجود صلاحية نطاق.
 * يوصى باستخدام الدالة غير المتزامنة `hasPermissionWithScope` من `utils/permissions.ts` 
 * أو استدعاء API المناسب للتحقق الدقيق من قاعدة البيانات.
 */
/*
export function hasPermissionWithScope(
  extendedPermissions: ExtendedPermissions,
  permissionCode: string,
  scopeType: string,
  scopeValue: string
): boolean {
  // التحقق من وجود الصلاحية العامة أولاً
  if (hasPermission(extendedPermissions, permissionCode)) {
    return true;
  }
  
  // التحقق من وجود صلاحية النطاق
  return !!(
    extendedPermissions.scoped_permissions &&
    extendedPermissions.scoped_permissions[scopeType] &&
    extendedPermissions.scoped_permissions[scopeType][permissionCode] &&
    extendedPermissions.scoped_permissions[scopeType][permissionCode].includes(scopeValue)
  );
}
*/

/**
 * تحويل من AdminPermissions إلى ExtendedPermissions
 */
export function toExtendedPermissions(permissions: AdminPermissions): ExtendedPermissions {
  return {
    permissions: { ...permissions }
  };
}

/**
 * نوع لتمثيل البيانات الخام للصلاحيات كما تأتي من قاعدة البيانات
 */
export interface RawPermissionsData {
  // استخدام نوع فهرس فقط للخصائص الأخرى غير المحددة بالاسم
  [key: string]: unknown;
  // تعريف الخصائص المعروفة بشكل صريح
  scoped_permissions?: {
    [scopeType: string]: {
      [permissionCode: string]: string[];
    };
  };
}

/**
 * محول من jsonb الخام إلى ExtendedPermissions
 * هذا مفيد عند استلام بيانات من قاعدة البيانات
 */
export function fromRawJsonbPermissions(rawPermissions: RawPermissionsData | null | undefined): ExtendedPermissions {
  const result: ExtendedPermissions = {
    permissions: {}
  };
  
  if (!rawPermissions) return result;
  
  // استخراج الصلاحيات العامة
  Object.keys(rawPermissions).forEach(key => {
    if (key !== 'scoped_permissions' && typeof rawPermissions[key] === 'boolean') {
      result.permissions[key] = rawPermissions[key] as boolean;
    }
  });
  
  // استخراج صلاحيات النطاق
  if (rawPermissions.scoped_permissions) {
    result.scoped_permissions = rawPermissions.scoped_permissions;
  }
  
  return result;
}