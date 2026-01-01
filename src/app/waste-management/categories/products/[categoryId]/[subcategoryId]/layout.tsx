'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout title="إدارة المنتجات">
      {children}
    </DashboardLayout>
  );
}


