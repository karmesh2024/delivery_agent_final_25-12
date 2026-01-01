'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import OrganizationStructurePage from '@/domains/warehouse-management/pages/OrganizationStructurePage';

export default function OrganizationStructureRoute() {
  return (
    <DashboardLayout title="إدارة التنظيم والتسلسل">
      <OrganizationStructurePage />
    </DashboardLayout>
  );
}


