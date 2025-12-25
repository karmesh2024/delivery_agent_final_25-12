'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import InventoryManagementPage from '@/domains/warehouse-management/pages/InventoryManagementPage';

export default function InventoryPage() {
  const [error, setError] = useState<Error | null>(null);
  
  return (
    <DashboardLayout title="إدارة المخزون">
      <InventoryManagementPage />
    </DashboardLayout>
  );
} 