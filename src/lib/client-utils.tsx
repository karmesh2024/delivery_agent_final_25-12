/**
 * وظائف مساعدة للتعامل مع مشاكل hydration وتجنب عدم تطابق العميل والخادم
 */

import React, { useEffect, useState, ReactNode } from 'react';

/**
 * التحقق مما إذا كنا على جانب العميل (المتصفح) أم لا
 */
export const isClientSide = typeof window !== 'undefined';

/**
 * Hook للتحقق من أننا على جانب العميل
 * يمكن استخدامه لتأخير عرض المكونات حتى يكتمل التحميل الأولي
 * مما يساعد على تجنب مشاكل عدم تطابق hydration
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return isClient;
}

/**
 * مكون يعرض محتواه فقط على جانب العميل
 * مفيد لمكونات تستخدم API المتصفح مثل localStorage أو وظائف window
 * أو مكونات قد تختلف بين الخادم والعميل
 */
interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ClientOnly({ 
  children, 
  fallback = null 
}: ClientOnlyProps): JSX.Element {
  const isClient = useIsClient();
  
  if (!isClient) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * وظيفة للقراءة الآمنة من localStorage/sessionStorage
 * تتحقق أولاً من أننا على جانب العميل لتجنب الأخطاء
 */
export function getStorageItem(storage: 'local' | 'session', key: string, defaultValue: any = null): any {
  if (!isClientSide) {
    return defaultValue;
  }
  
  try {
    const storageObj = storage === 'local' ? localStorage : sessionStorage;
    const value = storageObj.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (error) {
    console.error(`خطأ في قراءة ${key} من ${storage}Storage:`, error);
    return defaultValue;
  }
}

/**
 * وظيفة للكتابة الآمنة إلى localStorage/sessionStorage
 * تتحقق أولاً من أننا على جانب العميل لتجنب الأخطاء
 */
export function setStorageItem(storage: 'local' | 'session', key: string, value: string): boolean {
  if (!isClientSide) {
    return false;
  }
  
  try {
    const storageObj = storage === 'local' ? localStorage : sessionStorage;
    storageObj.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`خطأ في كتابة ${key} إلى ${storage}Storage:`, error);
    return false;
  }
} 