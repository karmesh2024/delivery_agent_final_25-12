'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import ExchangeDashboardPage from '@/domains/financial-management/pages/ExchangeDashboardPage';

export default function ExchangePage() {
  return (
    <DashboardLayout title="البورصة">
      <ExchangeDashboardPage />
    </DashboardLayout>
  );
} 