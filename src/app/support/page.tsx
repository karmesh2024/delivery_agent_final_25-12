/**
 * صفحة الدعم الفني - ملف وسيط يستورد المكون من نطاق الدعم
 */

import { Metadata } from 'next';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import SupportPage from "@/domains/support/pages/SupportPage";

export const metadata: Metadata = {
  title: 'الدعم الفني | لوحة تحكم وكلاء التوصيل',
  description: 'مركز المساعدة والدعم الفني',
};

export default function SupportRoute() {
  return (
    <DashboardLayout title="الدعم الفني">
      <SupportPage />
    </DashboardLayout>
  );
}