'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { AdminPermissions as StoreAdminPermissions, RoleBasicData, PermissionData as ApiPermissionData, Role } from '@/domains/admins/types/index';
import {
  ExtendedPermissions,
  ScopedPermissions as SystemScopedPermissions,
  addScopedPermission,
  fromRawJsonbPermissions
} from '@/domains/admins/types/permissions';
import { PermissionGuard } from '@/components/PermissionGuard';
import { supabase } from '@/lib/supabase';

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
  FiShield,
  FiSearch,
  FiSave,
  FiEdit,
  FiXCircle,
  FiFilter,
} from "react-icons/fi";
import {
  Label
} from "@/shared/components/ui/label";

import { Admin, LocalRole, LocalPermission, ScopedPermissions } from '@/domains/management-center/types';
import { toast } from '@/shared/ui/toast';

interface AdminPermissionsTabProps {
  availablePermissions: LocalPermission[];
  roles: LocalRole[];
  admins: Admin[];
  loading: boolean;
  currentAdmin: Admin;
}

export const AdminPermissionsTab: React.FC<AdminPermissionsTabProps> = ({
  availablePermissions,
  roles,
  admins,
  loading,
  currentAdmin
}) => {
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [permissionFilter, setPermissionFilter] = useState('all');
  const [editMode, setEditMode] = useState(false);
  const [localPermissions, setLocalPermissions] = useState<Record<string, boolean>>({});
  const [scopedPermissions, setScopedPermissions] = useState<ScopedPermissions>({});

  // Initialize selectedAdminId with currentAdmin if available on first render
  useEffect(() => {
    if (currentAdmin?.id && !selectedAdminId) {
      setSelectedAdminId(currentAdmin.id);
    }
  }, [currentAdmin, selectedAdminId]);

  // When selectedAdminId changes, fetch/load their permissions
  useEffect(() => {
    const admin = admins.find(a => a.id === selectedAdminId);
    if (admin?.permissions) {
      const parsedPermissions = fromRawJsonbPermissions(admin.permissions);
      // Filter out non-boolean permissions (like scoped_permissions)
      const generalPermissions: Record<string, boolean> = {};
      for (const key in parsedPermissions.permissions) {
        if (typeof parsedPermissions.permissions[key] === 'boolean') {
          generalPermissions[key] = parsedPermissions.permissions[key] as boolean;
        }
      }
      setLocalPermissions(generalPermissions || {}); // Use the filtered generalPermissions
      setScopedPermissions(parsedPermissions.scoped_permissions || {});
    } else {
      // Reset if no permissions or no admin selected
      setLocalPermissions({});
      setScopedPermissions({});
    }
    setEditMode(false); // Exit edit mode when admin changes
  }, [selectedAdminId, admins]);

  // Memoized grouped permissions (for filters)
  const groupedPermissions = useMemo(() => {
    // Check if availablePermissions is null, undefined, or empty array
    if (!availablePermissions || !Array.isArray(availablePermissions) || availablePermissions.length === 0) {
      console.log('[AdminPermissionsTab] No available permissions:', {
        availablePermissions,
        isArray: Array.isArray(availablePermissions),
        length: availablePermissions?.length
      });
      return {};
    }
    
    console.log('[AdminPermissionsTab] Processing permissions:', {
      count: availablePermissions.length,
      permissions: availablePermissions.slice(0, 3) // Log first 3 for debugging
    });
    
    const groups: Record<string, ApiPermissionData[]> = {};
    
    availablePermissions.forEach(permission => {
      const group = permission.resource_id || 'General';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(permission as ApiPermissionData); // Ensure ApiPermissionData type
    });
    
    const result = Object.entries(groups)
        .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
        .reduce((acc, [key, value]) => {
            acc[key] = value.sort((a, b) => a.code.localeCompare(b.code));
            return acc;
        }, {} as Record<string, ApiPermissionData[]>);
    
    console.log('[AdminPermissionsTab] Grouped permissions:', {
      groupCount: Object.keys(result).length,
      groups: Object.keys(result)
    });
    
    return result;
        
  }, [availablePermissions]);
  
  // Memoized filtered permissions (for display)
  const filteredPermissions = useMemo(() => {
    const groups = { ...groupedPermissions };
    let filteredGroupEntries = Object.entries(groups);

    console.log('[AdminPermissionsTab] Filtering permissions:', {
      initialGroupCount: Object.keys(groups).length,
      searchQuery,
      permissionFilter,
      localPermissionsCount: Object.keys(localPermissions).length
    });

    if (searchQuery || permissionFilter !== 'all') {
        filteredGroupEntries = filteredGroupEntries.map(([groupName, permissions]) => {
            const filtered = permissions.filter(permission => {
                const lowerSearchQuery = searchQuery.toLowerCase();
                const matchesSearch = searchQuery 
                    ? permission.code.toLowerCase().includes(lowerSearchQuery) ||
                      (permission.description?.toLowerCase().includes(lowerSearchQuery) || false)
                    : true;
                
                let matchesFilter = true;
                if (permissionFilter !== 'all') {
                    const isEnabled = localPermissions[permission.code] === true;
                    matchesFilter = permissionFilter === 'enabled' ? isEnabled : !isEnabled;
                }
                
                return matchesSearch && matchesFilter;
            });
            return [groupName, filtered] as [string, ApiPermissionData[]];
        });
    }
    
    const result = Object.fromEntries(
        filteredGroupEntries.filter(([, permissions]) => permissions.length > 0)
    );
    
    console.log('[AdminPermissionsTab] Filtered permissions result:', {
      finalGroupCount: Object.keys(result).length,
      groups: Object.keys(result),
      totalPermissions: Object.values(result).reduce((sum, perms) => sum + perms.length, 0)
    });
    
    return result;
}, [groupedPermissions, searchQuery, permissionFilter, localPermissions]);

  // Save updated permissions for the selected admin
  const handleSavePermissions = useCallback(async () => {
    if (selectedAdminId) {
      const finalPermissionsJson: Record<string, unknown> = {};

      Object.entries(localPermissions).forEach(([key, value]) => {
        finalPermissionsJson[key] = value;
      });

      if (Object.keys(scopedPermissions).length > 0) {
          finalPermissionsJson['scoped_permissions'] = scopedPermissions;
      }

      console.log('[AdminPermissionsTab] handleSavePermissions - Sending data:', {
        adminId: selectedAdminId,
        permissions: finalPermissionsJson
      });

      try {
        if (!supabase) {
            console.error('Supabase client is not available.');
            toast({ type: 'error', title: 'خطأ', description: 'خطأ في الاتصال بقاعدة البيانات.' });
            return;
        }

        const { data, error } = await supabase
          .from('admins')
          .update({ permissions: finalPermissionsJson })
          .eq('id', selectedAdminId)
          .select();

        if (error) {
          console.error('Error saving permissions:', JSON.stringify(error, null, 2));
          toast({ type: 'error', title: 'خطأ', description: `حدث خطأ أثناء حفظ الصلاحيات: ${error.message}` });
          return;
        }

        console.log('Permissions saved successfully:', data);
        toast({ type: 'success', title: 'تم بنجاح', description: 'تم حفظ تغييرات الصلاحيات بنجاح!' });
        setEditMode(false);

      } catch (err) {
        console.error('Unexpected error saving permissions:', err);
        toast({ type: 'error', title: 'خطأ', description: 'حدث خطأ غير متوقع أثناء حفظ الصلاحيات.' });
      }
    } else {
       console.warn('[AdminPermissionsTab] handleSavePermissions - No admin selected.');
       toast({ type: 'warning', title: 'تنبيه', description: 'الرجاء تحديد مسؤول أولاً.' });
    }
  }, [selectedAdminId, localPermissions, scopedPermissions]);
  
  // Add a new value to a scoped permission for the selected admin
  const handleAddScopeValue = useCallback((scopeType: string, permissionCode: string, value: string) => {
    setScopedPermissions((prev: ScopedPermissions) => {
      const newScoped = JSON.parse(JSON.stringify(prev));
      
      if (!newScoped[scopeType]) {
        newScoped[scopeType] = {};
      }
      if (!newScoped[scopeType][permissionCode]) {
        newScoped[scopeType][permissionCode] = [];
      }
      if (!newScoped[scopeType][permissionCode].includes(value)) {
        newScoped[scopeType][permissionCode].push(value);
      }
      return newScoped;
    });
  }, []);
  
  // Remove a value from a scoped permission for the selected admin
  const handleRemoveScopeValue = useCallback((scopeType: string, permissionCode: string, value: string) => {
    setScopedPermissions((prev: ScopedPermissions) => {
      const newScoped = JSON.parse(JSON.stringify(prev));
      
      if (newScoped[scopeType]?.[permissionCode]) {
        newScoped[scopeType][permissionCode] = newScoped[scopeType][permissionCode]
          .filter((v: string) => v !== value);
        
        if (newScoped[scopeType][permissionCode].length === 0) {
          delete newScoped[scopeType][permissionCode];
        }
        if (Object.keys(newScoped[scopeType]).length === 0) {
          delete newScoped[scopeType];
        }
      }
      return newScoped;
    });
  }, []);

  // Assign a role to the selected admin
  const handleAssignRole = useCallback(async () => {
    if (selectedAdminId && selectedRoleId) {
      try {
        console.log(`[AdminPermissionsTab] Assigning role ${selectedRoleId} to admin ${selectedAdminId}. New role_id: ${selectedRoleId}`);

        if (!supabase) {
            console.error('Supabase client is not available.');
            toast({ type: 'error', title: 'خطأ', description: 'خطأ في الاتصال بقاعدة البيانات.' });
            return;
        }

        const { data, error } = await supabase
          .from('admins') 
          .update({ role_id: selectedRoleId })
          .eq('id', selectedAdminId)
          .select() 

        if (error) {
          console.error('Error assigning role:', JSON.stringify(error, null, 2));
          toast({ type: 'error', title: 'خطأ', description: `حدث خطأ أثناء تعيين الدور: ${error.message}` });
          return;
        }

        console.log('Role assigned successfully:', data);
        toast({ type: 'success', title: 'تم بنجاح', description: 'تم تعيين الدور بنجاح!' });

      } catch (err) {
        console.error('Unexpected error assigning role:', err);
        toast({ type: 'error', title: 'خطأ', description: 'حدث خطأ غير متوقع.' });
      }
    } else {
      console.warn('Admin ID or Role ID is missing for assignment.');
    }
  }, [selectedAdminId, selectedRoleId]);
  
  // Toggle a general permission for the selected admin
  const handleTogglePermission = useCallback((code: string) => {
    setLocalPermissions(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  }, []);

  return ( 
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-1">إدارة صلاحيات المسؤول</h2>
          <p className="text-gray-500">تحكم في الصلاحيات والوصول لحساب مسؤول محدد</p>
        </div>
        {!editMode ? (
          <PermissionGuard permissionCode="admins:manage">
            <Button 
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2"
              disabled={!selectedAdminId}
            >
              <FiEdit />
              <span>تعديل الصلاحيات</span>
            </Button>
          </PermissionGuard>
        ) : (
          <div className="flex gap-2">
            <PermissionGuard permissionCode="admins:manage">
              <Button 
                onClick={handleSavePermissions}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <FiSave />
                <span>حفظ التغييرات</span>
              </Button>
            </PermissionGuard>
            <Button 
              onClick={() => {
                 setEditMode(false);
                 // Re-fetch to discard changes
                 const admin = admins.find(a => a.id === selectedAdminId);
                 if (admin?.permissions) {
                    const parsedPermissions = fromRawJsonbPermissions(admin.permissions);
                    const generalPermissions: Record<string, boolean> = {};
                    for (const key in parsedPermissions.permissions) {
                      if (typeof parsedPermissions.permissions[key] === 'boolean') {
                        generalPermissions[key] = parsedPermissions.permissions[key] as boolean;
                      }
                    }
                    setLocalPermissions(generalPermissions || {});
                    setScopedPermissions(parsedPermissions.scoped_permissions || {});
                 } else {
                    setLocalPermissions({});
                    setScopedPermissions({});
                 }
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FiXCircle />
              <span>إلغاء</span>
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiUsers className="h-5 w-5 text-primary" />
              <span>معلومات المسؤول</span>
            </CardTitle>
            <CardDescription>
              اختر المسؤول المطلوب إدارة صلاحياته
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">المسؤول:</Label>
                <Select
                  value={selectedAdminId}
                  onValueChange={(value) => {
                     setSelectedAdminId(value);
                  }}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مسؤولًا" />
                  </SelectTrigger>
                  <SelectContent>
                    {admins?.map((admin: Admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.full_name || admin.email || admin.username}
                      </SelectItem>
                    ))}
                    {(!admins || admins.length === 0) && (
                       <SelectItem value="no-admins" disabled>لا يوجد مسؤولين</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">البريد الإلكتروني:</Label>
                <div className="p-2 bg-gray-100 rounded text-gray-700 text-sm">
                  {admins.find(a => a.id === selectedAdminId)?.email || '-'}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">الدور الحالي:</Label>
                <div className="p-2 bg-gray-100 rounded text-gray-700 flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="font-normal">
                      {roles?.find(r => r.id === admins.find(a => a.id === selectedAdminId)?.role_id)?.name || 'غير محدد'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiShield className="h-5 w-5 text-primary" />
              <span>تعيين دور</span>
            </CardTitle>
            <CardDescription>
              تعيين أو تغيير دور المسؤول
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">الدور:</Label>
                <Select
                  value={selectedRoleId}
                  onValueChange={setSelectedRoleId}
                  disabled={loading || !editMode || !selectedAdminId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر دورًا" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                    {(!roles || roles.length === 0) && (
                       <SelectItem value="no-roles" disabled>لا توجد أدوار متاحة</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-4">
                <PermissionGuard permissionCode="admins:manage">
                  <Button 
                    onClick={handleAssignRole}
                    className="w-full"
                    disabled={!selectedAdminId || !selectedRoleId || !editMode}
                  >
                    تعيين الدور المحدد
                  </Button>
                </PermissionGuard>
              </div>
              
              <div className="pt-2 text-xs text-gray-500">
                <p>سيؤدي تعيين دور إلى استبدال الدور الحالي للمسؤول.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiKey className="h-5 w-5 text-primary" />
            <span>صلاحيات المسؤول</span>
          </CardTitle>
          <CardDescription>
            إدارة صلاحيات الوصول لهذا المسؤول
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث عن صلاحية..."
                className="pl-9 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={!selectedAdminId}
              />
            </div>
            <Select value={permissionFilter} onValueChange={setPermissionFilter} disabled={!selectedAdminId}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الصلاحيات</SelectItem>
                <SelectItem value="enabled">المفعلة فقط</SelectItem>
                <SelectItem value="disabled">المعطلة فقط</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-8">
            {Object.keys(filteredPermissions).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">لا توجد صلاحيات تطابق معايير البحث/الفلترة</p>
              </div>
            ) : (
              Object.entries(filteredPermissions).map(([groupName, permissions]) => (
                <div key={groupName} className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2 mb-4">
                    <FiFilter className="h-4 w-4 text-primary" />
                    <span>{groupName}</span>
                    <Badge variant="outline" className="ml-2 font-normal">
                      {permissions.length}
                    </Badge>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {permissions.map(permission => (
                      <div 
                        key={permission.id}
                        className={`
                          p-4 border rounded-lg flex flex-col justify-between 
                          transition-colors duration-150
                          ${localPermissions[permission.code] ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-gray-50 border-gray-200'}
                        `}
                      >
                        <div>
                          <div className="font-medium flex items-center justify-between">
                            <span className="font-mono">{permission.code}</span>
                            <Switch 
                              checked={!!localPermissions[permission.code]} 
                              onCheckedChange={() => handleTogglePermission(permission.code)}
                              disabled={!editMode}
                              aria-label={`Toggle ${permission.code}`}
                            />
                          </div>
                          {permission.description && (
                            <div className="text-xs text-gray-600 mt-1">{permission.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t p-6">
          {editMode && (
            <div className="flex gap-2">
              <Button 
                onClick={handleSavePermissions}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <FiSave />
                <span>حفظ التغييرات للصلاحيات</span>
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminPermissionsTab;
