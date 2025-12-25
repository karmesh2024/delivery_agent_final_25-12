/**
 * صفحة التحليلات - ملف وسيط يستورد المكون من نطاق التحليلات
 */

import { Metadata } from 'next';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import AnalyticsPage from "@/domains/analytics/pages/AnalyticsPage";

export const metadata: Metadata = {
  title: 'التحليلات | لوحة تحكم وكلاء التوصيل',
  description: 'إحصائيات وتحليلات أداء وكلاء التوصيل والطلبات',
};

export default function AnalyticsRoute() {
  return (
    <DashboardLayout title="التحليلات والإحصائيات">
      <AnalyticsPage />
    </DashboardLayout>
  );
}