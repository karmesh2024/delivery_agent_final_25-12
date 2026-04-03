'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import ExchangeAnalyticsPage from '@/domains/financial-management/pages/ExchangeAnalyticsPage';

export default function AnalyticsPage() {
  return (
    <DashboardLayout title="مركز تحليلات البورصة والقرار">
      <ExchangeAnalyticsPage />
    </DashboardLayout>
  );
}
