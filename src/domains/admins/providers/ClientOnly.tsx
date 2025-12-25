'use client';

import React, { ReactNode, useEffect, useState } from 'react';

/**
 * مكون يعرض محتواه فقط على جانب العميل
 * يساعد في منع مشاكل عدم تطابق hydration
 */
interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
} 