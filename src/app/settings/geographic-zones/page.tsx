"use client";

import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import dynamic from 'next/dynamic';
import { PermissionGuard } from '@/components/PermissionGuard';

const DirectMapEditor = dynamic(
  () => import('@/domains/settings/components/DirectMapEditor').then(mod => mod.DirectMapEditor),
  { ssr: false }
);

export default function GeographicZonesPage() {
  return (
    <DashboardLayout title="إدارة المناطق الجغرافية">
      <PermissionGuard permissionCode="settings:manage" fallback={<div>ليس لديك صلاحية لإدارة المناطق الجغرافية</div>}>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">إدارة المناطق الجغرافية</h1>
          <p className="text-muted-foreground">
            قم بإضافة وتعديل المناطق الجغرافية التي يمكن استخدامها عند تعيين مناطق عمل المندوبين.
          </p>
          
          <DirectMapEditor />
        </div>
      </PermissionGuard>
    </DashboardLayout>
  );
} 