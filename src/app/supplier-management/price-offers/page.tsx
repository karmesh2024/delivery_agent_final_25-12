'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import PriceOfferPage from '@/domains/supplier-management/pages/PriceOfferPage';

export default function PriceOffersPage() {
  return (
    <DashboardLayout title="عروض الأسعار">
      <PriceOfferPage />
    </DashboardLayout>
  );
} 