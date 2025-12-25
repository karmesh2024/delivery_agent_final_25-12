'use client';

import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { AdminsListPage } from '@/components/AdminsListPage';
import { RouteGuard } from '@/shared/components/RouteGuard';
import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

export default function Page() {
  // استخدام Redux للتحقق من حالة المصادقة
  const { isAuthenticated, currentAdmin } = useAppSelector(state => state.auth);

  useEffect(() => {
    console.log('[AdminsPage-AppRouter] Page component mounted');
    console.log('[AdminsPage-AppRouter] Authentication state:', { isAuthenticated, admin: currentAdmin?.email });
  }, [isAuthenticated, currentAdmin]);

  return (
    <DashboardLayout title="إدارة المسؤولين (App Router)">
      <RouteGuard requiredPermission="admins:view" redirectTo="/dashboard">
        <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded-md text-sm">
          هذه هي نسخة App Router الجديدة (src/app/admins/page.tsx)
        </div>
        <AdminsListPage />
      </RouteGuard>
    </DashboardLayout>
  );
} 