import PointsSettingsPage from '@/domains/financial-management/points/pages/PointsSettingsPage';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';

export default function Page() {
  return (
    <DashboardLayout title="إعدادات النقاط">
      <PointsSettingsPage />
    </DashboardLayout>
  );
}
