'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { hasPermission, hasPermissionWithScope } from '../utils/permissions';

/**
 * خيارات هوك usePermission
 */
interface UsePermissionOptions {
  /**
   * معلومات النطاق للصلاحية (اختياري)
   */
  scope?: {
    type: string;
    value: string | number | object;
  };
}

/**
 * هوك مخصص للتحقق من الصلاحيات.
 * يتحقق دائمًا من قاعدة البيانات لضمان الدقة.
 * 
 * @param permissionCode رمز الصلاحية المطلوب التحقق منها
 * @param options خيارات إضافية (معلومات النطاق)
 * @returns حالة الصلاحية: hasAccess (بوليان)، loading (بوليان)
 */
export function usePermission(permissionCode: string, options: UsePermissionOptions = {}) {
  const { scope } = options;
  const { currentAdmin } = useAppSelector(state => state.auth);
  const adminId = currentAdmin?.id;
  
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    if (!adminId) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    let isMounted = true;
    
    const checkPermission = async () => {
      setLoading(true);
      try {
        let serverCheckResult = false;
        
        if (scope) {
          serverCheckResult = await hasPermissionWithScope(
            currentAdmin,
            permissionCode, 
            scope.type, 
            scope.value
          );
        } else {
          serverCheckResult = await hasPermission(adminId, permissionCode);
        }
        
        if (isMounted) {
          setHasAccess(serverCheckResult);
        }
      } catch (error) {
        console.error('خطأ في التحقق من الصلاحية:', error);
        if (isMounted) {
          setHasAccess(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    checkPermission();

    return () => {
      isMounted = false;
    };
  }, [adminId, permissionCode, scope?.type, scope?.value, currentAdmin]);
  
  return { hasAccess, loading };
}

/**
 * هوك مخصص للتحقق من مجموعة من الصلاحيات (يملك أي منها).
 * يتحقق دائمًا من قاعدة البيانات.
 * 
 * @param permissionCodes مصفوفة من رموز الصلاحيات
 * @returns حالة الصلاحية: hasAccess (بوليان)، loading (بوليان)
 */
export function useAnyPermission(permissionCodes: string[]) {
  const { currentAdmin } = useAppSelector(state => state.auth);
  const adminId = currentAdmin?.id;
  
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    if (!adminId) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    let isMounted = true;
    
    const checkPermissions = async () => {
      setLoading(true);
      try {
        const permissionChecks = await Promise.all(
          permissionCodes.map(code => hasPermission(adminId, code)) 
        );
        
        const hasAnyPermissionRemotely = permissionChecks.some(Boolean);
        if (isMounted) {
          setHasAccess(hasAnyPermissionRemotely);
        }
      } catch (error) {
        console.error('خطأ في التحقق من الصلاحيات:', error);
        if (isMounted) {
          setHasAccess(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    checkPermissions();

    return () => {
      isMounted = false;
    };
  }, [adminId, JSON.stringify(permissionCodes)]);
  
  return { hasAccess, loading };
}

/**
 * هوك مخصص للتحقق من مجموعة من الصلاحيات (يملك جميعها).
 * يتحقق دائمًا من قاعدة البيانات.
 * 
 * @param permissionCodes مصفوفة من رموز الصلاحيات
 * @returns حالة الصلاحية: hasAccess (بوليان)، loading (بوليان)
 */
export function useAllPermissions(permissionCodes: string[]) {
  const { currentAdmin } = useAppSelector(state => state.auth);
  const adminId = currentAdmin?.id;
  
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!adminId || permissionCodes.length === 0) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    let isMounted = true;
    
    const checkPermissions = async () => {
      setLoading(true);
      try {
        const permissionChecks = await Promise.all(
          permissionCodes.map(code => hasPermission(adminId, code)) 
        );
        
        const hasAllPermissionsRemotely = permissionChecks.every(Boolean);
        if (isMounted) {
          setHasAccess(hasAllPermissionsRemotely);
        }
      } catch (error) {
        console.error('خطأ في التحقق من الصلاحيات:', error);
        if (isMounted) {
          setHasAccess(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    checkPermissions();

    return () => {
      isMounted = false;
    };
  }, [adminId, JSON.stringify(permissionCodes)]);
  
  return { hasAccess, loading };
}

// يمكن إضافة هوك مماثل لصلاحيات النطاق لاحقًا
// export const useScopedPermission = (permissionCode: string, scopeType: string, scopeValue: string | number) => { ... };