/**
 * صفحة الرسائل - ملف وسيط يستورد المكون من نطاق الرسائل
 */

import { Metadata } from 'next';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import MessagesPage from "@/domains/messages/pages/MessagesPage";

export const metadata: Metadata = {
  title: 'الرسائل | لوحة تحكم وكلاء التوصيل',
  description: 'إدارة الرسائل والإشعارات',
};

export default function MessagesRoute() {
  return (
    <DashboardLayout title="الرسائل والإشعارات">
      <MessagesPage />
    </DashboardLayout>
  );
}