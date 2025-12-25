"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { SubCategoriesListPage } from '@/domains/product-categories/pages/SubCategoriesListPage';

const SubcategoriesPage: React.FC = () => {
  const searchParams = useSearchParams();
  const categoryId = searchParams?.get('categoryId');

  if (!categoryId) {
    // Handle case where categoryId is missing, e.g., redirect or show an error
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-red-500">معرف الفئة مفقود. الرجاء العودة إلى صفحة الفئات.</p>
      </div>
    );
  }

  return <SubCategoriesListPage categoryId={categoryId} />;
};

export default SubcategoriesPage; 