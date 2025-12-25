'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { usePermission, useAnyPermission, useAllPermissions } from '@/domains/admins/hooks/usePermission';

/**
 * خيارات مكون حماية المسارات
 */
interface RouteGuardProps {
  /**
   * محتوى المكون الذي سيتم عرضه في حالة وجود الصلاحية
   */
  children: ReactNode;
  
  /**
   * رمز الصلاحية المطلوبة للوصول للمسار
   * يمكن تحديد مصفوفة من الصلاحيات إذا كان أي من هذه الصلاحيات كافية
   */
  requiredPermission: string | string[];
  
  /**
   * ما إذا كانت جميع الصلاحيات مطلوبة (في حالة المصفوفة)
   * الافتراضي: false (أي صلاحية كافية)
   */
  requireAll?: boolean;
  
  /**
   * المسار الذي سيتم التوجيه إليه في حالة عدم وجود الصلاحية
   * الافتراضي: /unauthorized
   */
  redirectTo?: string;
  
  /**
   * ما إذا كان سيتم التحقق من الصلاحية من الخادم
   * الافتراضي: false
   */
  serverCheck?: boolean;
  
  /**
   * معلومات النطاق للصلاحية (اختياري)
   */
  scope?: {
    type: string;
    value: string | number | object;
  };
  
  /**
   * ما إذا كان المستخدم يجب أن يكون مسجل دخول للوصول
   * الافتراضي: true
   */
  requireAuth?: boolean;
  
  /**
   * المسار الذي سيتم التوجيه إليه في حالة عدم تسجيل الدخول
   * الافتراضي: /login
   */
  loginPath?: string;
  
  /**
   * ما إذا كان سيتم إظهار مؤشر تحميل أثناء التحقق
   * الافتراضي: true
   */
  showLoading?: boolean;
  
  /**
   * مكون مخصص لعرضه أثناء التحميل
   */
  loadingComponent?: ReactNode;
}

/**
 * مكون حماية المسارات بالصلاحيات
 * 
 * يتحقق من صلاحيات المستخدم قبل عرض الصفحة، ويوجه المستخدم
 * إلى صفحة خطأ أو تسجيل الدخول إذا لم تكن لديه الصلاحيات.
 * 
 * مثال الاستخدام الأساسي:
 * ```tsx
 * // في ملف layout.tsx
 * export default function OrdersLayout({ children }) {
 *   return (
 *     <RouteGuard requiredPermission="orders:view">
 *       {children}
 *     </RouteGuard>
 *   );
 * }
 * ```
 * 
 * مثال استخدام متقدم:
 * ```tsx
 * // في ملف layout.tsx للمسؤولين
 * export default function AdminLayout({ children }) {
 *   return (
 *     <RouteGuard 
 *       requiredPermission={['admins:view', 'admins:manage']} 
 *       serverCheck={true}
 *       redirectTo="/dashboard"
 *     >
 *       {children}
 *     </RouteGuard>
 *   );
 * }
 * ```
 */
export function RouteGuard({
  children,
  requiredPermission,
  requireAll = false,
  redirectTo = '/unauthorized',
  serverCheck = false,
  scope,
  requireAuth = true,
  loginPath = '/login',
  showLoading = true,
  loadingComponent
}: RouteGuardProps) {
  // التوجيه والمسار الحالي
  const router = useRouter();
  const pathname = usePathname();
  
  // حالة المصادقة
  const { isAuthenticated, currentAdmin, loading: authLoading } = useAppSelector(state => state.auth);
  
  // حالات المكون
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // حالات الصلاحيات
  const singlePermission = typeof requiredPermission === 'string' 
    ? requiredPermission 
    : '';
  
  const multiplePermissions = Array.isArray(requiredPermission) 
    ? requiredPermission 
    : [];
  
  // استخدام أهوك الصلاحيات المناسبة
  const { hasAccess: singlePermissionAccess, loading: singlePermissionLoading } = 
    usePermission(singlePermission, { scope });
  
  const { hasAccess: anyPermissionAccess, loading: anyPermissionLoading } = 
    useAnyPermission(multiplePermissions);
  
  const { hasAccess: allPermissionsAccess, loading: allPermissionsLoading } = 
    useAllPermissions(multiplePermissions);
  
  // صلاحية الوصول النهائية
  const hasAccess = typeof requiredPermission === 'string'
    ? singlePermissionAccess
    : requireAll ? allPermissionsAccess : anyPermissionAccess;
  
  // حالة التحميل النهائية
  const loading = typeof requiredPermission === 'string'
    ? singlePermissionLoading
    : requireAll ? allPermissionsLoading : anyPermissionLoading;
  
  // التحقق من الصلاحيات وتوجيه المستخدم عند الحاجة
  useEffect(() => {
    // ننتظر حتى يتم تحميل المكون في المتصفح لتجنب أخطاء الهيدريشن
    if (!isMounted) {
      return;
    }

    // إذا كان التحميل جارياً، ننتظر
    if (authLoading || loading) {
      setIsChecking(true);
      return;
    }
    
    // إذا كان المستخدم غير مسجل دخول والمسار يتطلب تسجيل دخول
    if (requireAuth && !isAuthenticated && !currentAdmin) {
      // استثناء للمسارات التي لا تتطلب مصادقة
      if (pathname === loginPath) {
        setIsChecking(false);
        return;
      }
      
      // توجيه المستخدم إلى صفحة تسجيل الدخول
      const encodedPathname = pathname ? encodeURIComponent(pathname) : '/';
      router.push(`${loginPath}?returnUrl=${encodedPathname}`);
      return;
    }
    
    // إذا كان المستخدم لا يملك الصلاحية المطلوبة
    if (requireAuth && !hasAccess) {
      // استثناء للمسارات التي لا تتطلب صلاحيات أو صفحة غير مصرح
      if (pathname === redirectTo) {
        setIsChecking(false);
        return;
      }
      
      // توجيه المستخدم إلى صفحة غير مصرح
      router.push(redirectTo);
      return;
    }
    
    // إذا وصلنا إلى هنا، فالمستخدم يملك الصلاحية
    setHasPermission(true);
    setIsChecking(false);
  }, [
    authLoading, 
    loading, 
    isAuthenticated, 
    hasAccess, 
    requireAuth, 
    pathname, 
    router, 
    redirectTo, 
    loginPath, 
    currentAdmin,
    isMounted
  ]);
  
  // إذا كان التحقق جارياً، نعرض مؤشر تحميل أو لا شيء
  if (isChecking) {
    if (!showLoading) {
      return null;
    }
    
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // إذا وصلنا إلى هنا، فالمستخدم يملك الصلاحية ويمكن عرض المحتوى
  return <>{children}</>;
}