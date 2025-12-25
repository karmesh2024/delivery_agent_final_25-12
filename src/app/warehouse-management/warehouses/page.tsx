'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import WarehouseListPage from '@/domains/warehouse-management/pages/WarehouseListPage';

export default function WarehousesPage() {
  return (
    <DashboardLayout title="إدارة المخازن">
      <WarehouseListPage />
    </DashboardLayout>
  );
} 