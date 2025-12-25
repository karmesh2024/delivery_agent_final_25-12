'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { FiHome } from "react-icons/fi";
import { LocalRole, LocalPermission, Admin } from '@/domains/management-center/types';

interface OverviewTabProps {
  roles: LocalRole[];
  availablePermissions: LocalPermission[];
  admins: Admin[];
}

export const OverviewTab = ({ roles, availablePermissions, admins }: OverviewTabProps) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>الأدوار</CardTitle>
          <CardDescription>إجمالي عدد الأدوار في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{roles?.length || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>الصلاحيات</CardTitle>
          <CardDescription>إجمالي عدد الصلاحيات المتاحة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{availablePermissions?.length || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>المسؤولين</CardTitle>
          <CardDescription>إجمالي عدد المسؤولين النشطين</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{admins?.length || 0}</div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default OverviewTab; 