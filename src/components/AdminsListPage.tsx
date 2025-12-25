'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAdmins } from '@/store/adminsSlice';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { FiUserPlus, FiEdit, FiTrash2, FiKey } from 'react-icons/fi';
import CreateAdminForm from '@/components/CreateAdminForm';
import { AdminDialogButton } from '@/components/AdminDialogButton';
import { UniversalDialog } from '@/shared/ui/universal-dialog';
import { PermissionsUserDialog } from '@/app/permissions/components/PermissionsUserDialog';
import { Admin } from '@/domains/admins/types';

interface AdminsListPageProps {
  isEmbedded?: boolean;
}

export function AdminsListPage({ isEmbedded }: AdminsListPageProps) {
  const dispatch = useAppDispatch();
  const { items: admins, loading, error } = useAppSelector(state => state.admins);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAdmins());
  }, [dispatch]);

  const handleRefreshAdmins = () => {
    console.log('[AdminsListPage] Refreshing admins list');
    dispatch(fetchAdmins()); // Refresh the admin list
  };

  if (loading) {
    return <div className="py-8 text-center">جاري تحميل بيانات المسؤولين...</div>;
  }

  if (error) {
    return <div className="py-8 text-center text-red-500">حدث خطأ: {error}</div>;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">إدارة المسؤولين</h1>
        
        <PermissionGuard permissionCode="admins:create">
          <AdminDialogButton onSuccess={handleRefreshAdmins} />
        </PermissionGuard>
      </div>
      {admins && admins.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">لا يوجد مسؤولون حتى الآن</p>
          <AdminDialogButton 
            onSuccess={handleRefreshAdmins}
            buttonText="إضافة أول مسؤول"
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {admins.map((admin: Admin) => (
            <Card key={admin.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{admin.full_name}</CardTitle>
                <p className="text-sm text-gray-500">{admin.email}</p>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm"><strong>اسم المستخدم:</strong> {admin.username}</p>
                  <p className="text-sm"><strong>الدور:</strong> {admin.role}</p>
                  {admin.phone && <p className="text-sm"><strong>الهاتف:</strong> {admin.phone}</p>}
                </div>
                
                <div className="flex space-x-2 space-x-reverse justify-end">
                  <PermissionGuard permissionCode="admins:update">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admins/edit/${admin.id}`}>
                        <FiEdit className="h-4 w-4 ml-1" />
                        تعديل
                      </Link>
                    </Button>
                  </PermissionGuard>
                  
                  <PermissionGuard permissionCode="admins:manage">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admins/permissions/${admin.id}`}>
                        <FiKey className="h-4 w-4 ml-1" />
                        الصلاحيات
                      </Link>
                    </Button>
                  </PermissionGuard>
                  
                  <PermissionGuard permissionCode="admins:delete">
                    <Button variant="destructive" size="sm">
                      <FiTrash2 className="h-4 w-4 ml-1" />
                      حذف
                    </Button>
                  </PermissionGuard>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminsListPage; 