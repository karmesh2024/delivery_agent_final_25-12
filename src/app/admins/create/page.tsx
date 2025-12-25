'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import CreateAdminForm from '@/components/CreateAdminForm';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Card, CardContent } from '@/shared/components/ui/card';

export default function CreateAdminPage() {
  const router = useRouter();
  
  const handleSuccess = () => {
    // التوجيه إلى صفحة المسؤولين بعد الإنشاء بنجاح
    router.push('/admins');
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">إضافة مسؤول جديد</h1>
      
      <PermissionGuard 
        permissionCode="admins:create" 
        fallback={
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-lg text-red-500">ليس لديك صلاحية إنشاء مسؤولين جدد</p>
            </CardContent>
          </Card>
        }
      >
        <CreateAdminForm onSuccess={handleSuccess} />
      </PermissionGuard>
    </div>
  );
} 