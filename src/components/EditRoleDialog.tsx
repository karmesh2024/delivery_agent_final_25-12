'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAvailablePermissions } from '@/store/slices/permissionsSlice';
import { Role, RoleBasicData, PermissionData } from '@/domains/admins/types'; // Adjust path if needed

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"; // Adjust path to your UI library
import { Button } from "@/shared/components/ui/button"; // Adjust path
import { Input } from "@/shared/components/ui/input"; // Adjust path
import { Label } from "@/shared/ui/label"; // Adjust path
import { Checkbox } from "@/shared/components/ui/checkbox"; // Adjust path
// import { ScrollArea } from "@/shared/ui/scroll-area"; // Uncomment if you use ScrollArea

interface EditRoleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  roleToEdit: Role | null;
  availablePermissions: PermissionData[];
  onSave: (updatedRoleData: RoleBasicData, permissionIds: string[]) => Promise<void>;
}

export function EditRoleDialog({ 
  isOpen, 
  onOpenChange,
  roleToEdit, 
  availablePermissions: propAvailablePermissions,
  onSave
}: EditRoleDialogProps) {
  const dispatch = useAppDispatch();
  const { availablePermissions: reduxAvailablePermissions } = useAppSelector(state => state.permissions);
  
  // استخدام الصلاحيات من props أو من Redux - استخدام useMemo لتجنب إعادة الحساب
  const availablePermissions = useMemo(() => {
    return propAvailablePermissions && propAvailablePermissions.length > 0 
      ? propAvailablePermissions 
      : reduxAvailablePermissions || [];
  }, [propAvailablePermissions, reduxAvailablePermissions]);

  const [roleData, setRoleData] = useState<RoleBasicData>({ 
    name: '', 
    code: '', 
    description: '', 
    level: 10,
    is_active: true,
  });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // إضافة حالة داخلية للتتبع
  const [isDialogMounted, setIsDialogMounted] = useState(false);

  // --- DEBUG LOG ---
  console.log('[EditRoleDialog] Rendering. isOpen:', isOpen, 'roleToEdit:', roleToEdit);
  console.log('[EditRoleDialog] availablePermissions:', {
    fromProps: propAvailablePermissions?.length || 0,
    fromRedux: reduxAvailablePermissions?.length || 0,
    final: availablePermissions.length,
    isArray: Array.isArray(availablePermissions),
    isEmpty: availablePermissions.length === 0,
    firstFew: availablePermissions?.slice(0, 3),
    propAvailablePermissions: propAvailablePermissions,
    reduxAvailablePermissions: reduxAvailablePermissions
  });
  
  // جلب الصلاحيات إذا كانت فارغة - استخدام ref لتجنب الجلب المتكرر
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    console.log('[EditRoleDialog] useEffect - availablePermissions.length:', availablePermissions.length, 'isOpen:', isOpen, 'hasFetched:', hasFetchedRef.current);
    
    if (availablePermissions.length === 0 && isOpen && !hasFetchedRef.current) {
      console.log('[EditRoleDialog] No permissions available, fetching...');
      hasFetchedRef.current = true;
      dispatch(fetchAvailablePermissions())
        .then((result) => {
          console.log('[EditRoleDialog] fetchAvailablePermissions result:', result);
        })
        .catch((error) => {
          console.error('[EditRoleDialog] fetchAvailablePermissions error:', error);
          hasFetchedRef.current = false; // إعادة تعيين في حالة الخطأ
        });
    }
    // إعادة تعيين flag عند إغلاق النافذة
    if (!isOpen) {
      hasFetchedRef.current = false;
    }
  }, [availablePermissions.length, isOpen, dispatch]);

  // إضافة useEffect للتأكد من أن المكون قد تم تحميله
  useEffect(() => {
    setIsDialogMounted(true);
    console.log('[EditRoleDialog] Component mounted');

    // تنظيف عند إزالة المكون
    return () => {
      setIsDialogMounted(false);
      console.log('[EditRoleDialog] Component unmounted');
    };
  }, []);

  // تسجيل التغيرات في حالة isOpen
  useEffect(() => {
    console.log('[EditRoleDialog] isOpen changed to:', isOpen, 'Dialog mounted:', isDialogMounted);
  }, [isOpen, isDialogMounted]);

  // تسجيل بيانات roleData عند التغيير
  useEffect(() => {
    console.log('[EditRoleDialog] roleData updated:', roleData);
  }, [roleData]);

  // Effect to populate form when roleToEdit changes or dialog opens
  useEffect(() => {
    console.log('[EditRoleDialog] useEffect for roleData. isOpen:', isOpen, 'roleToEdit:', roleToEdit);
    console.log('[EditRoleDialog] availablePermissions:', availablePermissions?.length);
    console.log('[EditRoleDialog] roleToEdit.code:', roleToEdit?.code);
    console.log('[EditRoleDialog] roleToEdit.permissionCodes:', roleToEdit?.permissionCodes);
    
    if (isOpen && roleToEdit) {
      // تعيين البيانات بتأخير قصير للتأكد من استقرار الحالة
      // نستخدم timeout أطول إذا كانت الصلاحيات غير جاهزة
      const delay = availablePermissions && availablePermissions.length > 0 ? 50 : 300;
      
      setTimeout(() => {
        console.log('[EditRoleDialog] Setting roleData with delay:', delay);
        console.log('[EditRoleDialog] roleToEdit full object:', JSON.stringify(roleToEdit, null, 2));
        
        setRoleData({
          name: roleToEdit.name || '',
          code: roleToEdit.code || '', // تأكد من أن code موجود
          description: roleToEdit.description || '',
          level: roleToEdit.level || 10,
          is_active: roleToEdit.is_active !== undefined ? roleToEdit.is_active : true,
        });
        
        // تحويل permissionCodes إلى IDs للمطابقة
        // roleToEdit.permissionCodes يحتوي على رموز (codes) وليس IDs
        // نحتاج إلى العثور على IDs المقابلة من availablePermissions
        if (roleToEdit.permissionCodes && roleToEdit.permissionCodes.length > 0 && availablePermissions && availablePermissions.length > 0) {
          const matchingIds = availablePermissions
            .filter(perm => roleToEdit.permissionCodes?.includes(perm.code))
            .map(perm => perm.id);
          console.log('[EditRoleDialog] Matching permission IDs:', {
            permissionCodesCount: roleToEdit.permissionCodes.length,
            availablePermissionsCount: availablePermissions.length,
            matchingIdsCount: matchingIds.length,
            matchingIds: matchingIds
          });
          setSelectedPermissionIds(matchingIds);
        } else {
          console.log('[EditRoleDialog] No permissions to set:', {
            hasPermissionCodes: !!roleToEdit.permissionCodes,
            permissionCodesLength: roleToEdit.permissionCodes?.length || 0,
            hasAvailablePermissions: !!availablePermissions,
            availablePermissionsLength: availablePermissions?.length || 0
          });
          setSelectedPermissionIds([]);
        }
        setError(null);
      }, delay);
    } else if (!isOpen) {
      // إعادة تعيين الحالة عند الإغلاق
      setRoleData({ name: '', code: '', description: '', level: 10, is_active: true });
      setSelectedPermissionIds([]);
      setError(null);
    }
  }, [isOpen, roleToEdit, availablePermissions]);

  // Group permissions for display (similar to the page component)
  const groupedModalPermissions = useMemo(() => {
    console.log('[EditRoleDialog] Grouping permissions. availablePermissions:', availablePermissions?.length);
    if (!availablePermissions || availablePermissions.length === 0) {
      console.log('[EditRoleDialog] No permissions to group');
      return {};
    }
    const groups: Record<string, PermissionData[]> = {};
    availablePermissions.forEach(permission => {
        const resourceIdentifier = permission.resource_name || permission.resource_id || 'General';
        if (!groups[resourceIdentifier]) {
            groups[resourceIdentifier] = [];
        }
        groups[resourceIdentifier].push(permission);
    });
    const result = Object.entries(groups)
        .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
        .reduce((acc, [key, value]) => {
            acc[key] = value.sort((a, b) => a.code.localeCompare(b.code));
            return acc;
        }, {} as Record<string, PermissionData[]>);
    console.log('[EditRoleDialog] Grouped permissions:', Object.keys(result), 'groups count:', Object.keys(result).length);
    return result;
  }, [availablePermissions]);

  // Debug log after groupedModalPermissions is defined
  useEffect(() => {
    console.log('[EditRoleDialog] groupedModalPermissions keys:', Object.keys(groupedModalPermissions));
  }, [groupedModalPermissions]);

  const handlePermissionChange = (permissionId: string, checked: boolean | string) => {
    setSelectedPermissionIds(prevIds => {
      if (checked) {
        return [...prevIds, permissionId];
      } else {
        return prevIds.filter(id => id !== permissionId);
      }
    });
  };

  const handleSaveChanges = async () => {
    if (!roleToEdit) {
      console.error('[EditRoleDialog] Cannot save: roleToEdit is null');
      return;
    }
    
    if (!roleData.name || !roleData.code) {
        setError("Role Name and Code are required.");
        return;
    }
    
    setError(null);
    setIsLoading(true);
    
    const roleUpdateData: RoleBasicData = {
        name: roleData.name,
        code: roleData.code,
        description: roleData.description || null,
        level: roleData.level,
        is_active: roleData.is_active,
    };

    try {
        console.log('[EditRoleDialog] Calling onSave with:', {
          roleUpdateData,
          permissionIdsCount: selectedPermissionIds.length,
          permissionIds: selectedPermissionIds
        });
        await onSave(roleUpdateData, selectedPermissionIds);
        console.log('[EditRoleDialog] Save successful');
        // تأخير في إغلاق النافذة
        setTimeout(() => {
          console.log('[EditRoleDialog] Closing dialog after save success');
          onOpenChange(false);
        }, 50);
    } catch (err: unknown) {
        console.error("[EditRoleDialog] Failed to update role:", err);
        const message = (typeof err === 'object' && err !== null && 'message' in err) ? (err as Error).message : 'An unknown error occurred';
        setError(message || 'فشل تحديث الدور. يرجى المحاولة مرة أخرى.');
    } finally {
        setIsLoading(false);
    }
  };

  // لا تقم بتصيير المكون إذا كان الدور للتعديل غير موجود وكانت النافذة مفتوحة
  if (isOpen && !roleToEdit) {
    console.log('[EditRoleDialog] Not rendering - isOpen but no roleToEdit');
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل الدور: {roleToEdit?.name}</DialogTitle>
          <DialogDescription>
            قم بتعديل تفاصيل وصلاحيات هذا الدور
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Role Data Inputs - تحسين التنسيق */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role-name" className="text-sm font-medium">الاسم *</Label>
              <Input 
                id="edit-role-name" 
                value={roleData.name} 
                onChange={(e) => setRoleData({...roleData, name: e.target.value})} 
                className="bg-white" 
                disabled={isLoading}
                placeholder="أدخل اسم الدور"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role-code" className="text-sm font-medium">الرمز *</Label>
              <Input 
                id="edit-role-code" 
                value={roleData.code} 
                onChange={(e) => setRoleData({...roleData, code: e.target.value})} 
                className="bg-white" 
                disabled={isLoading}
                placeholder="أدخل رمز الدور"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-role-desc" className="text-sm font-medium">الوصف</Label>
              <Input 
                id="edit-role-desc" 
                value={roleData.description || ''} 
                onChange={(e) => setRoleData({...roleData, description: e.target.value})} 
                className="bg-white" 
                disabled={isLoading}
                placeholder="أدخل وصف الدور (اختياري)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role-level" className="text-sm font-medium">المستوى</Label>
              <Input 
                id="edit-role-level" 
                type="number" 
                value={roleData.level} 
                onChange={(e) => setRoleData({...roleData, level: parseInt(e.target.value) || 0})} 
                className="bg-white" 
                disabled={isLoading}
                placeholder="مستوى الدور"
              />
            </div>
          </div>

          {/* Permissions Section - تحسين التنسيق */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-semibold">الصلاحيات</Label>
              {availablePermissions && availablePermissions.length > 0 && (
                <span className="text-sm text-gray-500">
                  ({selectedPermissionIds.length} من {availablePermissions.length} محددة)
                </span>
              )}
            </div>
            <div className="h-96 w-full rounded-md border bg-gray-50 p-4 overflow-y-auto">
              {availablePermissions && availablePermissions.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedModalPermissions).map(([groupName, permissions]) => (
                    <div key={groupName} className="bg-white rounded-lg p-4 border">
                      <h4 className="text-sm font-semibold mb-3 text-gray-700 pb-2 border-b">
                        {groupName}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {permissions.map(permission => (
                          <div 
                            key={permission.id} 
                            className="flex items-start space-x-2 rtl:space-x-reverse p-2 rounded hover:bg-gray-50 transition-colors"
                          >
                            <Checkbox 
                              id={`perm-${permission.id}`}
                              checked={selectedPermissionIds.includes(permission.id)}
                              onCheckedChange={(checked) => handlePermissionChange(permission.id, checked)}
                              disabled={isLoading}
                              className="mt-1"
                            />
                            <Label 
                              htmlFor={`perm-${permission.id}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              <span className="font-medium text-gray-900">{permission.code}</span>
                              {permission.description && (
                                <span className="text-gray-500 block text-xs mt-1">{permission.description}</span>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <p className="text-gray-500 mb-2">لا توجد صلاحيات متاحة للعرض</p>
                  <p className="text-xs text-gray-400">
                    {availablePermissions === undefined || availablePermissions === null 
                      ? 'جاري تحميل الصلاحيات...' 
                      : 'يرجى التأكد من جلب الصلاحيات من قاعدة البيانات'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          {error && <p className="text-red-500 text-sm mr-auto">خطأ: {error}</p>}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>إلغاء</Button>
          <Button onClick={handleSaveChanges} disabled={isLoading || !roleData.name || !roleData.code}>
            {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 