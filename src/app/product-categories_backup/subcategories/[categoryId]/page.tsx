"use client";

import { SubCategoriesListPage } from '@/domains/product-categories';
import { useParams } from 'next/navigation';

export default function Page() {
  // استخدام useParams بدلاً من استلام params كـ prop
  const params = useParams();
  
  // التعامل مع حالة params قد تكون null
  const categoryId = params && params.categoryId 
    ? (Array.isArray(params.categoryId) ? params.categoryId[0] : params.categoryId as string)
    : '';
  
  if (!categoryId) {
    return <div className="p-6 text-center">لم يتم العثور على معرف الفئة</div>;
  }
  
  return (
    <SubCategoriesListPage categoryId={categoryId} />
  );
} 