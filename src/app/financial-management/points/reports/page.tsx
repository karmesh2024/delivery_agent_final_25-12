import PointsReportsPage from '@/domains/financial-management/points/pages/PointsReportsPage';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout title="تقارير النقاط">
      <PointsReportsPage />
    </DashboardLayout>
  );
}
