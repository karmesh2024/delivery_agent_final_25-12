'use client';

import { ProductsListPage } from '@/domains/product-categories/pages/ProductsListPage';
import { Suspense } from 'react';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <ProductsListPage viewOnly />
    </Suspense>
  );
} 