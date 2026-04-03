'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** إعادة توجيه إلى الإدارة العامة - تم نقل إدارة التنظيم والتسلسل */
export default function OrganizationStructureRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/general-management/organization-structure');
  }, [router]);
  return null;
}


