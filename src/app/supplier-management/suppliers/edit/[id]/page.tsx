'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import SupplierFormPage from '@/domains/supplier-management/pages/SupplierFormPage';

interface EditSupplierPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditSupplierPage({ params }: EditSupplierPageProps) {
  const unwrappedParams = React.use(params);
  const supplierId = unwrappedParams.id;

  return (
    <DashboardLayout title="تعديل بيانات المورد">
      <SupplierFormPage supplierId={supplierId} />
    </DashboardLayout>
  );
} 