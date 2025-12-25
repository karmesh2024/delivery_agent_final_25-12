'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import SupplierListPage from '@/domains/supplier-management/pages/SupplierListPage';

export default function SuppliersPage() {
  return (
    <DashboardLayout title="إدارة الموردين">
      <SupplierListPage />
    </DashboardLayout>
  );
} 