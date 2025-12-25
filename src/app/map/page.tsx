/**
 * ملف وسيط لصفحة خريطة المندوبين
 * 
 * هذا الملف يستورد المكون MapViewPage من النطاق المناسب
 * وفقًا لهيكلية التصميم الموجه بالنطاقات DDD
 */

"use client";

import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import MapViewPage from "@/domains/mapping/pages/MapViewPage";

export default function MapPage() {
  return (
    <DashboardLayout title="خريطة المندوبين">
      <MapViewPage />
    </DashboardLayout>
  );
}