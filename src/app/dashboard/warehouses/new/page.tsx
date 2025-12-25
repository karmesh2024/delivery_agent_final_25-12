'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToNewWarehouse() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/warehouse-management/warehouses/new');
  }, [router]);
  return null;
}



