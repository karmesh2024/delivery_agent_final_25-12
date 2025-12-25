/**
 * صفحة الرحلات - ملف وسيط يستورد المكون من نطاق الرحلات
 */

import { Metadata } from 'next';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { TripsPage } from '@/domains/trips/pages/TripsPage';

export const metadata: Metadata = {
  title: 'إدارة الرحلات | لوحة تحكم وكلاء التوصيل',
  description: 'إدارة وتتبع رحلات وكلاء التوصيل',
};

export default function TripsRoute() {
  return (
    <DashboardLayout title="إدارة الرحلات">
      <TripsPage />
    </DashboardLayout>
  );
}