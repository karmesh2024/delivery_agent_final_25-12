'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addRole } from '@/domains/admins/store/permissionsSlice';
import { fetchAvailablePermissions } from '@/store/slices/permissionsSlice';
import { PermissionData, RoleBasicData } from '@/domains/admins/types';

// UI Components
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { FormDialog } from '@/shared/components/ui/FormDialog';
// import { ScrollArea } from '@/shared/ui/scroll-area'; // Uncomment if needed and available

interface AddRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // Pass available permissions to avoid fetching them again inside the dialog
  availablePermissions: PermissionData[];
}

export const AddRoleDialog: React.FC<AddRoleDialogProps> = ({ 
  isOpen, 
  onClose,
  availablePermissions: propAvailablePermissions 
}) => {
  const dispatch = useAppDispatch();
  const { loading, availablePermissions: reduxAvailablePermissions } = useAppSelector(state => state.permissions);
  
  // استخدام الصلاحيات من props أو من Redux - استخدام useMemo لتجنب إعادة الحساب
  const availablePermissions = useMemo(() => {
    return propAvailablePermissions && propAvailablePermissions.length > 0 
      ? propAvailablePermissions 
      : reduxAvailablePermissions || [];
  }, [propAvailablePermissions, reduxAvailablePermissions]);

  // Debug: Log availablePermissions and fetch if empty
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    console.log('[AddRoleDialog] availablePermissions:', {
      fromProps: propAvailablePermissions?.length || 0,
      fromRedux: reduxAvailablePermissions?.length || 0,
      final: availablePermissions.length,
      isArray: Array.isArray(availablePermissions),
      isEmpty: availablePermissions.length === 0,
      firstFew: availablePermissions?.slice(0, 3),
      propAvailablePermissions: propAvailablePermissions,
      reduxAvailablePermissions: reduxAvailablePermissions
    });
    
    // إذا كانت الصلاحيات فارغة، نجلبها مباشرة - مرة واحدة فقط
    if (availablePermissions.length === 0 && isOpen && !hasFetchedRef.current) {
      console.log('[AddRoleDialog] No permissions available, fetching...');
      hasFetchedRef.current = true;
      dispatch(fetchAvailablePermissions())
        .then((result) => {
          console.log('[AddRoleDialog] fetchAvailablePermissions result:', result);
        })
        .catch((error) => {
          console.error('[AddRoleDialog] fetchAvailablePermissions error:', error);
          hasFetchedRef.current = false; // إعادة تعيين في حالة الخطأ
        });
    }
    // إعادة تعيين flag عند إغلاق النافذة
    if (!isOpen) {
      hasFetchedRef.current = false;
    }
  }, [availablePermissions.length, isOpen, dispatch, propAvailablePermissions, reduxAvailablePermissions]);

  // Internal state for the form
  const [newRoleData, setNewRoleData] = useState<{
    name: string;
    code: string;
    description: string;
    level: number;
  }>({ name: '', code: '', description: '', level: 10 });

  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setNewRoleData({ name: '', code: '', description: '', level: 10 });
      setSelectedPermissionIds([]);
    }
  }, [isOpen]);

  // Group available permissions for display in modal
  const groupedModalPermissions = useMemo(() => {
    console.log('[AddRoleDialog] Grouping permissions. availablePermissions:', availablePermissions?.length);
    if (!availablePermissions || availablePermissions.length === 0) {
      console.log('[AddRoleDialog] No permissions to group');
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
    console.log('[AddRoleDialog] Grouped permissions:', Object.keys(result), 'groups count:', Object.keys(result).length);
    return result;
  }, [availablePermissions]);

  // Handler for permission checkbox changes
  const handlePermissionChange = (permissionId: string, checked: boolean | string) => {
      setSelectedPermissionIds(prevIds => {
          if (checked) {
              return [...prevIds, permissionId];
          } else {
              return prevIds.filter(id => id !== permissionId);
          }
      });
  };

  // Submit handler
  const handleAddRoleSubmit = () => {
    if (!newRoleData.name || !newRoleData.code) {
      console.error('[AddRoleDialog] Role name or code is missing.');
      // Optionally show an alert to the user here
      return; 
    }
    
    const roleBasicData: RoleBasicData = {
      name: newRoleData.name,
      code: newRoleData.code,
      description: newRoleData.description,
      level: newRoleData.level,
      is_active: true 
    };
    
    const permissionIds = selectedPermissionIds;
    
    console.log('[AddRoleDialog] Dispatching addRole action with:', { roleBasicData, permissionIds });
    dispatch(addRole({ roleData: roleBasicData, permissionIds }))
      .unwrap()
      .then(() => {
        alert('تم إضافة الدور بنجاح'); 
        onClose(); // Close dialog on success
      })
      .catch((error: Error) => {
        console.error('Error adding role:', error);
        alert(`حدث خطأ عند إضافة الدور: ${error.message}`);
      });
  };

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title="إضافة دور جديد"
      maxWidth="44rem"
      footer={(
        <>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button 
            onClick={handleAddRoleSubmit} 
            disabled={!newRoleData.name || !newRoleData.code || loading}
          >
            {loading ? 'جاري الإضافة...' : 'إضافة الدور'}
          </Button>
        </>
      )}
    >
      {/* Form Content - Updated Layout */}
      <div className="space-y-5 py-3"> {/* زيادة التباعد الرأسي */}
        {/* Basic Role Data Inputs - Stacked Layout */}
        <div> {/* Wrapper div for Name */} 
          <Label htmlFor="role-name" className="block mb-2 text-base font-medium">اسم الدور</Label>
          <Input id="role-name" value={newRoleData.name} onChange={(e) => setNewRoleData({...newRoleData, name: e.target.value})} placeholder="مثال: مدير المبيعات" className="bg-white dark:bg-gray-950" />
        </div>
        
        <div> {/* Wrapper div for Code */} 
          <Label htmlFor="role-code" className="block mb-2 text-base font-medium">رمز الدور</Label>
          <Input id="role-code" value={newRoleData.code} onChange={(e) => setNewRoleData({...newRoleData, code: e.target.value})} placeholder="مثال: sales_manager" className="bg-white dark:bg-gray-950" />
        </div>

        <div> {/* Wrapper div for Description */} 
          <Label htmlFor="role-desc" className="block mb-2 text-base font-medium">الوصف</Label>
          <Input id="role-desc" value={newRoleData.description} onChange={(e) => setNewRoleData({...newRoleData, description: e.target.value})} placeholder="وصف مختصر للدور" className="bg-white dark:bg-gray-950" />
        </div>

        <div> {/* Wrapper div for Level */} 
          <Label htmlFor="role-level" className="block mb-2 text-base font-medium">المستوى</Label>
          <Input id="role-level" type="number" value={newRoleData.level} onChange={(e) => setNewRoleData({...newRoleData, level: parseInt(e.target.value) || 0})} className="bg-white dark:bg-gray-950" />
        </div>

        {/* Permissions Selection Section - Adjusted Height */}
        <div className="pt-4 border-t dark:border-gray-700"> {/* زيادة التباعد العلوي */} 
            <Label className="text-lg font-semibold mb-3 block">الصلاحيات</Label>
            <div 
              className="h-80 w-full rounded-md border dark:border-gray-700 p-4 bg-white/50 dark:bg-gray-800/50"
              style={{ overflowY: 'auto' }} // إضافة خاصية overflow-y كنمط مباشر بدل كلاس
            > 
                <div className="space-y-4">
                    {Object.entries(groupedModalPermissions).map(([groupName, permissions]) => (
                        <div key={groupName}>
                            <h4 className="text-md font-medium mb-2 text-primary border-b pb-1 dark:border-gray-700">{groupName}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                {permissions.map(permission => (
                                    <div key={permission.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                                        <Checkbox 
                                            id={`perm-${permission.id}`}
                                            checked={selectedPermissionIds.includes(permission.id)}
                                            onCheckedChange={(checked) => handlePermissionChange(permission.id, checked)}
                                            aria-labelledby={`perm-label-${permission.id}`}
                                        />
                                        <label
                                            id={`perm-label-${permission.id}`}
                                            htmlFor={`perm-${permission.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {permission.description || permission.code}
                                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 rtl:mr-1 rtl:ml-0">({permission.code})</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {Object.keys(groupedModalPermissions).length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">لا توجد صلاحيات متاحة للعرض.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </FormDialog>
  );
}; 