import PointsTransactionsPage from '@/domains/financial-management/points/pages/PointsTransactionsPage';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout title="معاملات النقاط">
      <PointsTransactionsPage />
    </DashboardLayout>
  );
}
