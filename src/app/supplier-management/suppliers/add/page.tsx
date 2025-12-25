'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import SupplierFormPage from '@/domains/supplier-management/pages/SupplierFormPage';

export default function AddSupplierPage() {
  return (
    <DashboardLayout title="إضافة مورد جديد">
      <SupplierFormPage />
    </DashboardLayout>
  );
} 