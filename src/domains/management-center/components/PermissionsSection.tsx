'use client';

import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Card, CardContent } from "@/shared/components/ui/card";
import { FiHome, FiKey, FiShield, FiUsers, FiSettings } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAvailablePermissions } from '@/store/slices/permissionsSlice';
import { fetchRoles } from '@/domains/admins/store/permissionsSlice';
import dynamic from 'next/dynamic';
import { Admin } from '@/domains/management-center/types';
import SectionIntro from './SectionIntro';
import { KeyIcon } from 'lucide-react';

// Lazy load components that were previously internal to PermissionsPage
const OverviewTab = dynamic(() => import('@/components/OverviewTab'), {
  ssr: false,
});
const AdminPermissionsTab = dynamic(() => import('@/components/AdminPermissionsTab'), {
  ssr: false,
});
const RolesManagementTab = dynamic(() => import('@/components/RolesManagementTab'), {
  ssr: false,
});
const GroupsManagement = dynamic(() => import('@/components/GroupsManagement'), {
  ssr: false,
});
const AdminsListPage = dynamic(() => import('@/components/AdminsListPage'), {
  loading: () => <p>تحميل قائمة المسؤولين...</p>,
});
const SystemPermissionsTab = dynamic(() => import('@/components/SystemPermissionsTab'), {
  ssr: false,
});
const ResourcesActionsManagement = dynamic(() => import('@/components/ResourcesActionsManagement'), {
  ssr: false,
});
const HRManagement = dynamic(() => import('@/domains/management-center/components/HRManagement'), {
  ssr: false,
});

const PermissionsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentAdmin, isAuthenticated } = useAppSelector(state => state.auth);
  const { availablePermissions, loading } = useAppSelector(state => state.permissions);
  const { roles } = useAppSelector(state => state.permissionsManagement); // جلب الأدوار من permissionsManagement

  const admins = React.useMemo<Admin[]>(() => {
    if (currentAdmin) {
      return [{
          id: currentAdmin.id,
          email: currentAdmin.email,
          username: currentAdmin.username,
          full_name: currentAdmin.full_name,
          role_id: currentAdmin.role_id,
       }];
    }
    return [];
  }, [currentAdmin]);

  // State for tabs within PermissionsSection
  const [internalActiveTab, setInternalActiveTab] = React.useState('overview');

  React.useEffect(() => {
    if (isAuthenticated) {
      console.log('[PermissionsSection] Fetching permissions and roles...');
      dispatch(fetchAvailablePermissions());
      dispatch(fetchRoles());
    }
  }, [dispatch, isAuthenticated]);

  // Debug: Log availablePermissions when it changes
  React.useEffect(() => {
    console.log('[PermissionsSection] availablePermissions updated:', {
      count: availablePermissions?.length || 0,
      loading,
      permissions: availablePermissions?.slice(0, 3) // First 3 for debugging
    });
  }, [availablePermissions, loading]);

  return (
    <div className="space-y-6">
      <SectionIntro
        title="إدارة الصلاحيات"
        description="هذا القسم مخصص لإدارة أدوار وصلاحيات المسؤولين في النظام."
        example="يمكنك إنشاء أدوار جديدة، تعديل الصلاحيات الممنوحة لدور معين، أو تعيين أدوار مختلفة للمسؤولين لتحقيق التحكم الدقيق في الوصول."
        icon={KeyIcon}
      />
      <Card>
        <CardContent>
          <Tabs value={internalActiveTab} onValueChange={setInternalActiveTab}>
            <TabsList className="flex h-auto p-1 text-muted-foreground grid-cols-1 sm:grid-cols-2 md:grid-cols-8 gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 ">
              <TabsTrigger
                value="overview"
                className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
              >
                <FiHome className="h-4 w-4" />
                <span>نظرة عامة</span>
              </TabsTrigger>
              <TabsTrigger
                value="admin-permissions"
                className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
              >
                <FiKey className="h-4 w-4" />
                <span>صلاحيات المسؤول</span>
              </TabsTrigger>
              <TabsTrigger
                value="roles"
                className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
              >
                <FiShield className="h-4 w-4" />
                <span>الأدوار</span>
              </TabsTrigger>
              <TabsTrigger
                value="groups"
                className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
              >
                <FiUsers className="h-4 w-4" />
                <span>المجموعات</span>
              </TabsTrigger>
              <TabsTrigger
                value="admins"
                className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
              >
                <FiUsers className="h-4 w-4" />
                <span>المسؤولين</span>
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
              >
                <FiSettings className="h-4 w-4" />
                <span>النظام</span>
              </TabsTrigger>
              <TabsTrigger
                value="resources-actions"
                className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
              >
                <FiSettings className="h-4 w-4" />
                <span>الموارد والإجراءات</span>
              </TabsTrigger>
              <TabsTrigger
                value="hr"
                className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
              >
                <FiUsers className="h-4 w-4" />
                <span>إدارة الموارد البشرية</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              {internalActiveTab === 'overview' && <OverviewTab 
                  roles={roles || []} 
                  availablePermissions={availablePermissions || []} 
                  admins={admins || []} 
              />}
            </TabsContent>
            <TabsContent value="admin-permissions" className="mt-0">
              {internalActiveTab === 'admin-permissions' && <AdminPermissionsTab 
                  availablePermissions={availablePermissions || []} 
                  roles={roles || []} 
                  admins={admins || []} 
                  loading={loading}
                  currentAdmin={currentAdmin as Admin}
              />}
            </TabsContent>
            <TabsContent value="roles" className="mt-0">
              {internalActiveTab === 'roles' && <RolesManagementTab 
                  roles={roles || []} 
                  availablePermissions={availablePermissions || []} 
                  loading={loading}
                  dispatch={dispatch}
              />}
            </TabsContent>
            <TabsContent value="groups" className="mt-0">
              {internalActiveTab === 'groups' && <GroupsManagement />}
            </TabsContent>
            <TabsContent value="admins" className="mt-0">
              {internalActiveTab === 'admins' && <AdminsListPage isEmbedded={true} />}
            </TabsContent>
            <TabsContent value="system" className="mt-0">
              {internalActiveTab === 'system' && <SystemPermissionsTab />}
            </TabsContent>
            <TabsContent value="resources-actions" className="mt-0">
              {internalActiveTab === 'resources-actions' && <ResourcesActionsManagement />}
            </TabsContent>
            <TabsContent value="hr" className="mt-0">
              {internalActiveTab === 'hr' && <HRManagement />}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionsSection; 