import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import IncomingOrdersPage from '@/domains/industrial-partners/pages/IncomingOrdersPage';

export default function Page() {
  return (
    <DashboardLayout title="طلبات الشراء الواردة">
      <IncomingOrdersPage />
    </DashboardLayout>
  );
}
