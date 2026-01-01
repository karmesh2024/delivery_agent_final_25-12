'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import PricingManagementPage from '@/domains/waste-management/pages/PricingManagementPage';

export default function PricingPage() {
  return (
    <DashboardLayout title="إدارة التسعير والبورصة">
      <PricingManagementPage />
    </DashboardLayout>
  );
}


