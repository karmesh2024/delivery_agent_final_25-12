'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  fetchAvailablePermissions,
  fetchRoles,
  addRole,
  updateRole,
  deleteRole,
} from '@/domains/admins/store/permissionsSlice';
import { AdminPermissions as StoreAdminPermissions, RoleBasicData, PermissionData as ApiPermissionData, Role } from '@/domains/admins/types';
import { 
  ExtendedPermissions,
  ScopedPermissions as SystemScopedPermissions,
  addScopedPermission,
  fromRawJsonbPermissions
} from '@/domains/admins/types/permissions';
import dynamic from 'next/dynamic';
import { PermissionGuard } from '@/components/PermissionGuard';
import { permissionsApi, getResources, getActions } from '@/services/permissionsApi';
import { supabase } from '@/lib/supabase';
import GroupsManagement from '@/components/GroupsManagement';
import RolesManagementTab from '@/components/RolesManagementTab';
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";

// أيقونات ومكونات UI
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { Badge } from "@/shared/components/ui/badge";
import { 
  FiKey, 
  FiUsers, 
  FiSettings, 
  FiShield, 
  FiCheckCircle, 
  FiXCircle, 
  FiSearch,
  FiSave,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiFilter,
  FiHome
} from "react-icons/fi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import {
  Label
} from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
// import { ScrollArea } from "@/shared/ui/scroll-area"; // Commented out missing import

// إضافة استيراد للمكون الجديد
import {
  UniversalDialog,
  DialogFooter as UniversalDialogFooter,
  DialogCloseButton,
  DialogConfirmButton,
  DialogDeleteButton
} from "@/shared/ui/universal-dialog";

import PermissionsSection from '../../domains/management-center/components/PermissionsSection';

// تعريف أنواع البيانات
interface LocalPermission {
  id: string;
  code: string;
  name?: string;
  description?: string | null;
  resource_id: string;
  action_id: string;
  group_id?: string;
}

interface LocalRole {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  level?: number;
  permissionCodes?: string[];
}

interface Admin {
  id: string;
  email?: string;
  username?: string;
  full_name?: string;
  role?: string;
  role_id?: string;
}

// تعريف أنواع صلاحيات النطاق
interface ScopedPermissions {
  [scopeType: string]: {
    [permissionCode: string]: string[];
  };
}

// تعريف أنواع الواجهة المحلية للصلاحيات
interface LocalAdminPermissions {
  [key: string]: boolean | ScopedPermissions | undefined;
  scoped_permissions?: ScopedPermissions;
}

// تعريف مكون نظرة عامة
interface OverviewTabProps {
  roles: LocalRole[];
  availablePermissions: LocalPermission[];
  admins: Admin[];
}

const OverviewTab = ({ roles, availablePermissions, admins }: OverviewTabProps) => (
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

interface PermissionsPageProps {
  isEmbedded?: boolean;
}

/**
 * صفحة إدارة الصلاحيات الاحترافية
 */
export default function PermissionsPage({ isEmbedded = false }: PermissionsPageProps) {
  return (
    <DashboardLayout title="إدارة الصلاحيات">
      <PermissionsSection />
    </DashboardLayout>
  );
}
