'use client';

import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import IndustrialPartnersPage from '@/domains/waste-management/partners/pages/IndustrialPartnersPage';

export default function Page() {
  return (
    <DashboardLayout title="قائمة الشركاء">
      <IndustrialPartnersPage />
    </DashboardLayout>
  );
}


