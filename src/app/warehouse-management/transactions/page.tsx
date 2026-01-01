'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TransactionsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // إعادة التوجيه تلقائياً إلى صفحة movements
    router.replace('/warehouse-management/movements');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">جاري إعادة التوجيه...</p>
    </div>
  );
}


