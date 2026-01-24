import PointsPricingPage from '@/domains/financial-management/points/pages/PointsPricingPage';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout title="تسعير النقاط">
      <PointsPricingPage />
    </DashboardLayout>
  );
}
