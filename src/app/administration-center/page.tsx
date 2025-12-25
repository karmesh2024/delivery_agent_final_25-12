'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { ManagementProvider, useManagement } from '@/domains/management-center/contexts/ManagementContext';
import { ManagementTab } from '@/domains/management-center/types';
import { FiUsers, FiCreditCard, FiKey, FiHome } from 'react-icons/fi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";

// Lazy load sections
const AdminsSection = dynamic(() => import('../../domains/management-center/components/AdminsSection'), {
  loading: () => <p>تحميل قسم المسؤولين...</p>,
});
const PaymentsSection = dynamic(() => import('../../domains/management-center/components/PaymentsSection'), {
  loading: () => <p>تحميل قسم المدفوعات...</p>,
});
const PermissionsSection = dynamic(() => import('../../domains/management-center/components/PermissionsSection'), {
  loading: () => <p>تحميل قسم الصلاحيات...</p>,
});

const OverviewSection: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <FiHome className="h-5 w-5 text-primary" />
        <span>نظرة عامة على مركز الإدارة</span>
      </CardTitle>
      <CardDescription>
        مرحباً بك في مركز الإدارة الموحد. استخدم التبويبات أعلاه للتنقل بين الأقسام المختلفة.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-gray-600">يوفر هذا المركز وصولاً شاملاً لإدارة:</p>
      <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
        <li>المسؤولين وصلاحياتهم.</li>
        <li>معالجة المدفوعات.</li>
        <li>تعريف الأدوار والصلاحيات على مستوى النظام.</li>
      </ul>
    </CardContent>
  </Card>
);

const ManagementPageContent: React.FC = () => {
  const { activeTab, setActiveTab } = useManagement();

  const tabs: ManagementTab[] = useMemo(() => [
    { id: 'overview', name: 'نظرة عامة', icon: FiHome },
    { id: 'admins', name: 'المسؤولون', icon: FiUsers },
    { id: 'payments', name: 'المدفوعات', icon: FiCreditCard },
    { id: 'permissions', name: 'الصلاحيات', icon: FiKey },
  ], []);

  return (
    <DashboardLayout title="مركز الإدارة">
      <div className="p-6 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex h-auto p-1 text-muted-foreground grid-cols-1 sm:grid-cols-2 md:grid-cols-auto gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 ">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            {activeTab === 'overview' && <OverviewSection />}
          </TabsContent>
          <TabsContent value="admins" className="mt-0">
            {activeTab === 'admins' && <AdminsSection />}
          </TabsContent>
          <TabsContent value="payments" className="mt-0">
            {activeTab === 'payments' && <PaymentsSection />}
          </TabsContent>
          <TabsContent value="permissions" className="mt-0">
            {activeTab === 'permissions' && <PermissionsSection />}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default function ManagementPage() {
  return (
    <ManagementProvider>
      <ManagementPageContent />
    </ManagementProvider>
  );
} 