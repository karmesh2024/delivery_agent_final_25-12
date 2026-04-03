'use client';

import { OperationalProductsPage } from '@/domains/product-categories/pages/OperationalProductsPage';
import { Suspense } from 'react';

export default function AllProductsPage() {
  return (
    <Suspense fallback={<div className="p-6">جاري التحميل...</div>}>
      <OperationalProductsPage />
    </Suspense>
  );
}
