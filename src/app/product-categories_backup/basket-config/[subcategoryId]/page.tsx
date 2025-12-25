'use client';

import React from 'react';
import { SubCategoryBasketConfigPage } from '@/domains/product-categories/pages/SubCategoryBasketConfigPage';
import { RouteGuard } from '@/shared/components/RouteGuard';

interface PageProps {
  params: {
    subcategoryId: string;
  };
}

const BasketConfigManagementPage: React.FC<PageProps> = ({ params }) => {
  return (
    <RouteGuard requiredPermission="product-categories:manage-basket-configs">
      <SubCategoryBasketConfigPage subcategoryId={params.subcategoryId} />
    </RouteGuard>
  );
};

export default BasketConfigManagementPage; 