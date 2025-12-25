"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SubCategoriesListPage } from '@/domains/product-categories/pages/SubCategoriesListPage';

const SubcategoriesContent: React.FC = () => {
  const searchParams = useSearchParams();
  const categoryId = searchParams?.get('categoryId');

  if (!categoryId) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-red-500">معرف الفئة مفقود. الرجاء العودة إلى صفحة الفئات.</p>
      </div>
    );
  }

  return <SubCategoriesListPage categoryId={categoryId} />;
};

const SubcategoriesPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        جاري التحميل...
      </div>
    }>
      <SubcategoriesContent />
    </Suspense>
  );
};

export default SubcategoriesPage;