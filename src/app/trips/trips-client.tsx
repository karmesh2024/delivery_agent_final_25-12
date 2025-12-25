"use client";

/**
 * مكون عميل لصفحة الرحلات يستخدم تخطيط لوحة التحكم
 */

import { TripsPage } from '@/domains/trips/pages/TripsPage';
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";

export default function TripsPageClient() {
  return (
    <DashboardLayout title="إدارة الرحلات">
      <TripsPage />
    </DashboardLayout>
  );
}