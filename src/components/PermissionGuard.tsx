import React, { ReactNode, useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { hasPermission, hasPermissionWithScope } from '@/utils/permissions';
import { Admin } from '@/domains/admins/types';

/**
 * خصائص مكون حماية الصلاحيات
 */
interface PermissionGuardProps {
  /**
   * رمز الصلاحية المطلوبة للوصول للمحتوى
   */
  permissionCode: string;
  
  /**
   * محتوى المكون الذي سيتم عرضه إذا كان المستخدم يملك الصلاحية
   */
  children: ReactNode;
  
  /**
   * محتوى بديل يعرض إذا لم يكن المستخدم يملك الصلاحية (اختياري)
   */
  fallback?: ReactNode;
  
  /**
   * نوع النطاق للصلاحية (اختياري، مثل 'order', 'user', 'region')
   */
  scopeType?: string;
  
  /**
   * قيمة النطاق للصلاحية (اختياري، مثل معرف الطلب، معرف المستخدم، معرف المنطقة)
   */
  scopeValue?: string | number | object;
}

/**
 * مكون حماية العناصر بالصلاحيات
 * 
 * يتحقق دائمًا من قاعدة البيانات لضمان الدقة.
 */
export function PermissionGuard({ 
  permissionCode, 
  children, 
  fallback = null, 
  scopeType,
  scopeValue
}: PermissionGuardProps) {
  const { currentAdmin } = useAppSelector(state => state.auth);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (currentAdmin) {
        if (scopeType && scopeValue) {
          // التحقق من الصلاحيات القائمة على النطاق
          setHasAccess(await hasPermissionWithScope(currentAdmin, permissionCode, scopeType, scopeValue));
        } else {
          // التحقق من الصلاحيات العامة
          setHasAccess(await hasPermission(currentAdmin.id, permissionCode));
        }
      } else {
        setHasAccess(false); // لا يوجد مسؤول مسجل الدخول، لا يوجد وصول
      }
    };
    checkPermissions();
  }, [currentAdmin, permissionCode, scopeType, scopeValue]);

  if (hasAccess) {
    return <>{children}</>;
  } else {
    return <>{fallback}</>;
  }
}

/**
 * مكون عكس حماية الصلاحيات
 * 
 * يعرض المحتوى فقط إذا لم يكن المستخدم يملك الصلاحية المحددة
 * 
 * مثال الاستخدام:
 * ```tsx
 * <PermissionGuardInverse permissionCode="orders:delete">
 *   <p>ليس لديك صلاحية حذف الطلبات</p>
 * </PermissionGuardInverse>
 * ```
 */
export function PermissionGuardInverse(props: PermissionGuardProps) {
  // استخدام نفس مكون PermissionGuard مع عكس قيم children و fallback
  return (
    <PermissionGuard
      permissionCode={props.permissionCode}
      scopeType={props.scopeType}
      scopeValue={props.scopeValue}
      fallback={props.children}
    >
      {props.fallback || null}
    </PermissionGuard>
  );
}