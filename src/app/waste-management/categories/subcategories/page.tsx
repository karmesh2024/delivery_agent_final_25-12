'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** إعادة توجيه إلى المصدر الموحد إدارة الفئات والمنتجات */
export default function WasteSubcategoriesRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const q = searchParams?.toString() || '';
    router.replace('/product-categories/subcategories' + (q ? '?' + q : ''));
  }, [searchParams, router]);
  return <div className="p-6 text-center">جاري التحويل إلى إدارة الفئات والمنتجات...</div>;
}
