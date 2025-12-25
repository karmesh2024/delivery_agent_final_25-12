'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks'; // Assuming hooks are in store root
import { deleteRole, updateRole, fetchRoles } from '@/domains/admins/store/permissionsSlice'; // Use fetchRoles from permissionsSlice to get code and permissionCodes
import { Role, RoleBasicData, PermissionData } from '@/domains/admins/types'; // Adjust path if needed

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"; // Adjust path
import { Button } from "@/shared/components/ui/button"; // Adjust path
import { Badge } from "@/shared/components/ui/badge"; // Adjust path
import { 
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
} from "react-icons/fi"; // Adjust path

// إزالة استيرادات مكون CustomDialog
// import { CustomDialog, DialogFooter as CustomDialogFooter } from "@/shared/ui/custom-dialog";

// إزالة استيراد مباشر لمكتبة Radix Dialog
// import * as DialogPrimitive from "@radix-ui/react-dialog";

import { AddRoleDialog } from './AddRoleDialog'; // Assuming it's in the same directory
import { EditRoleDialog } from './EditRoleDialog'; 
import type { AppDispatch } from '@/store'; // Adjust if your store location is different

// استيراد المكون العام للنوافذ المنبثقة
import { 
  UniversalDialog
} from "@/shared/ui/universal-dialog";

// استيراد DialogFooter من الملف الصحيح
import { DialogFooter as UniversalDialogFooter } from "@/shared/ui/custom-dialog";

// استيراد أزرار الحوار من الملف الصحيح
import { 
  PermissionsDialogConfirmButton as DialogConfirmButton, 
  PermissionsDialogCloseButton as DialogCloseButton, 
  PermissionsDialogDeleteButton as DialogDeleteButton 
} from "@/app/permissions/components/PermissionsUserDialog";

// Props interface for the new component
interface RolesManagementTabProps {
  roles: Role[];
  availablePermissions: PermissionData[];
  loading: boolean; // Loading state from parent/redux
  dispatch: AppDispatch; // Pass dispatch function as prop
}

// ================================
// Roles Management Tab Component
// ================================
function RolesManagementTab({
  roles,
  availablePermissions,
  loading,
  dispatch // Destructure props
}: RolesManagementTabProps) {
  console.log("[RolesManagementTab Component] Rendering...", {
    rolesLength: roles?.length,
    availablePermissionsLength: availablePermissions?.length
  });
  
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentRoleId, setCurrentRoleId] = useState<string>('');
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null); // For handling update errors
  const [isUpdating, setIsUpdating] = useState(false); // For loading state during update
  
  // إضافة حالات جديدة خاصة بنموذج التحرير المباشر
  const [editRoleData, setEditRoleData] = useState<RoleBasicData>({
    name: '',
    code: '',
    description: '',
    level: 10,
    is_active: true
  });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  // تجميع الصلاحيات حسب المجموعة - نستخدم نفس المنطق الموجود في EditRoleDialog
  const groupedPermissions = React.useMemo(() => {
    if (!availablePermissions) return {};
    const groups: Record<string, PermissionData[]> = {};
    availablePermissions.forEach(permission => {
        const resourceIdentifier = permission.resource_name || permission.resource_id || 'General';
        if (!groups[resourceIdentifier]) {
            groups[resourceIdentifier] = [];
        }
        groups[resourceIdentifier].push(permission);
    });
    return Object.entries(groups)
        .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
        .reduce((acc, [key, value]) => {
            acc[key] = value.sort((a, b) => a.code.localeCompare(b.code));
            return acc;
        }, {} as Record<string, PermissionData[]>);
  }, [availablePermissions]);

  // تسجيل دخول على مستوى عال للتحقق من صحة المكون
  useEffect(() => {
    console.log("[RolesManagementTab Component] Initial mount");
    return () => console.log("[RolesManagementTab Component] Unmounting");
  }, []);

  // Event Handlers
  const openAddRoleModal = () => { 
    console.log('[RolesManagementTab Component] Opening Add Role Dialog');
    setIsAddRoleModalOpen(true);
  };

  const handleEditRoleClick = useCallback((role: Role) => { 
    console.log('[RolesManagementTab] Edit button clicked for role:', role);
    console.log('[RolesManagementTab] Role code:', role.code);
    console.log('[RolesManagementTab] Role permissionCodes:', role.permissionCodes);
    
    // تعيين الدور للتعديل - تأكد من تمرير جميع البيانات
    setRoleToEdit({
      ...role,
      code: role.code || '', // تأكد من وجود code
      permissionCodes: role.permissionCodes || [] // تأكد من وجود permissionCodes
    });
    
    // تعيين بيانات النموذج بناءً على بيانات الدور
    setEditRoleData({
      name: role.name || '',
      code: role.code || '',
      description: role.description || '',
      level: role.level || 10,
      is_active: role.is_active !== undefined ? role.is_active : true,
    });
    
    // لا نعيّن selectedPermissionIds هنا لأن EditRoleDialog سيتعامل معها
    // لأن role.permissionCodes يحتوي على codes وليس IDs
    
    // فتح النافذة مباشرة
    console.log('[RolesManagementTab] Opening modal...');
    setIsEditRoleModalOpen(true);
    
    // تسجيل إضافي بعد فتح النافذة
    setTimeout(() => {
      console.log('[RolesManagementTab] Modal state after open:', isEditRoleModalOpen);
      console.log('[RolesManagementTab] Modal element in DOM:', document.querySelector('div[style*="position: fixed"][style*="inset: 0"]') !== null);
    }, 100);
  }, []);

  const handleCloseEditDialog = () => {
    console.log('[RolesManagementTab] Closing edit dialog...');
    // نغلق النافذة مباشرة
    setIsEditRoleModalOpen(false);
    
    // تنظيف البيانات
    setRoleToEdit(null);
    setEditRoleData({
      name: '',
      code: '',
      description: '',
      level: 10,
      is_active: true
    });
    setSelectedPermissionIds([]);
    
    console.log('[RolesManagementTab] Dialog closed, state reset');
  };

  const handlePermissionChange = (permissionId: string, checked: boolean | string) => {
    setSelectedPermissionIds(prevIds => {
      if (checked) {
        return [...prevIds, permissionId];
      } else {
        return prevIds.filter(id => id !== permissionId);
      }
    });
  };

  const handleDeleteRoleClick = (roleId: string) => {
    setCurrentRoleId(roleId);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteRoleConfirm = () => {
      if (!currentRoleId) return;
      // Use the passed dispatch function
      dispatch(deleteRole(currentRoleId))
        .unwrap()
        .then(() => {
          setIsDeleteConfirmOpen(false);
          alert('تم حذف الدور بنجاح'); // Consider using toast notifications
          // Optionally dispatch fetchRoles() here if not handled by parent
        })
        .catch((error: Error) => {
          alert(`حدث خطأ: ${error.message}`); // Consider using toast notifications
        });
  };

  // دالة حفظ التغييرات - مباشرة في هذا المكون
  const handleSaveRoleChanges = async () => {
    if (!roleToEdit) {
      console.error('[RolesManagementTab Component] Cannot save: roleToEdit is null');
      return;
    }
    
    if (!editRoleData.name || !editRoleData.code) {
      setUpdateError("الاسم والرمز مطلوبان");
      return;
    }
    
    setUpdateError(null);
    setIsUpdating(true);
    
    try {
      // console.log('[RolesManagementTab Component] Attempting to save role changes for roleId:', roleToEdit.id);
      // console.log('[RolesManagementTab Component] Role data to send:', { roleData: editRoleData, permissionIds: selectedPermissionIds });
      // استخدام dispatch المستلم كخاصية
      await dispatch(updateRole({
        roleId: roleToEdit.id,
        roleData: editRoleData,
        permissionIds: selectedPermissionIds
      })).unwrap();
      
      alert('تم تحديث الدور بنجاح!');
      handleCloseEditDialog();
      dispatch(fetchRoles()); // إعادة تحميل قائمة الأدوار
    } catch (err: unknown) {
      console.error("[RolesManagementTab Component] Failed to update role:", err);
      const message = (typeof err === 'object' && err !== null && 'message' in err) ? (err as Error).message : 'حدث خطأ غير معروف';
      setUpdateError(message || 'فشل تحديث الدور.');
    } finally {
      setIsUpdating(false);
    }
  };

  // استخدام useEffect لرصد التغييرات في الحالات
  useEffect(() => {
    console.log('[RolesManagementTab Component] isEditRoleModalOpen changed:', isEditRoleModalOpen, 'current DOM element exists:', document.querySelector('.fixed.inset-0.flex.items-center.justify-center') !== null);
  }, [isEditRoleModalOpen]);

  useEffect(() => {
    console.log('[RolesManagementTab Component] roleToEdit changed:', roleToEdit);
  }, [roleToEdit]);

  // JSX for Roles Management Tab
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-1">إدارة الأدوار</h2>
          <p className="text-gray-500">تعريف وإدارة أدوار النظام وصلاحياتها</p>
        </div>
        <Button 
          onClick={openAddRoleModal}
          className="flex items-center gap-2"
        >
          <FiPlus />
          <span>إضافة دور جديد</span>
        </Button>
      </div>
      
      {/* Role list rendering */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {roles?.map(role => (
          <Card key={role.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex justify-between items-center">
                <CardTitle>{role.name}</CardTitle>
                {/* Assuming role.level exists and is relevant */}
                {role.level !== undefined && <Badge variant="outline">{role.level}</Badge>}
              </div>
              {/* Assuming role.code exists */}
              {role.code && <CardDescription>{role.code}</CardDescription>}
            </CardHeader>
            <CardContent className="pt-6">
              {role.description && (
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
              )}
              <div className="space-y-1">
                <div className="text-sm font-medium">الصلاحيات:</div>
                 {/* Assuming role.permissionCodes might not exist directly,
                     or use role.permissions if that's the structure */}
                <Badge variant="secondary">
                  {/* Use permissionCodes if available, otherwise fallback */} 
                  {role.permissionCodes?.length ?? 0} 
                </Badge> 
              </div>
            </CardContent>
            <CardFooter className="border-t flex justify-end gap-2 py-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => {
                  try {
                    console.log('تم النقر على زر التعديل');
                    alert('سيتم فتح نافذة التعديل الآن');
                    handleEditRoleClick(role);
                  } catch (error) {
                    console.error('Error when clicking edit button:', error);
                  }
                }}
              >
                <FiEdit className="h-3 w-3" /> تعديل
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 text-red-600 hover:text-red-700"
                onClick={() => handleDeleteRoleClick(role.id)} 
                // Disable delete for system roles if needed, based on role.is_system
                disabled={role.is_system} 
              >
                <FiTrash2 className="h-3 w-3" /> حذف
              </Button>
            </CardFooter>
          </Card>
        ))}
        {!roles?.length && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">لا توجد أدوار معرفة حاليًا</p>
            <Button className="mt-4" onClick={openAddRoleModal}> 
              إضافة دور جديد
            </Button>
          </div>
        )}
      </div>

      {/* Render the separate dialogs */}
      <AddRoleDialog 
        isOpen={isAddRoleModalOpen} 
        onClose={() => setIsAddRoleModalOpen(false)}
        availablePermissions={availablePermissions || []} 
      />
      
      {/* نافذة تعديل الدور باستخدام EditRoleDialog */}
      <EditRoleDialog
        isOpen={isEditRoleModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseEditDialog();
          }
        }}
        roleToEdit={roleToEdit}
        availablePermissions={availablePermissions || []}
        onSave={async (updatedRoleData: RoleBasicData, permissionIds: string[]) => {
          if (!roleToEdit) {
            throw new Error('لا يوجد دور للتعديل');
          }
          
          setUpdateError(null);
          setIsUpdating(true);
          
          try {
            console.log('[RolesManagementTab] Updating role with:', {
              roleId: roleToEdit.id,
              roleData: updatedRoleData,
              permissionIdsCount: permissionIds.length,
              permissionIds: permissionIds
            });
            
            const result = await dispatch(updateRole({
              roleId: roleToEdit.id,
              roleData: updatedRoleData,
              permissionIds: permissionIds
            })).unwrap();
            
            console.log('[RolesManagementTab] Role updated successfully:', result);
            alert('تم تحديث الدور بنجاح!');
            handleCloseEditDialog();
            dispatch(fetchRoles()); // إعادة تحميل قائمة الأدوار
          } catch (err: unknown) {
            console.error("[RolesManagementTab Component] Failed to update role:", err);
            const message = (typeof err === 'object' && err !== null && 'message' in err) ? (err as Error).message : 'حدث خطأ غير معروف';
            setUpdateError(message || 'فشل تحديث الدور.');
            throw err; // Re-throw to let EditRoleDialog handle it
          } finally {
            setIsUpdating(false);
          }
        }}
      />
      
      {/* نافذة تأكيد الحذف */}
      <UniversalDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="تأكيد الحذف"
        description="هل أنت متأكد من رغبتك في حذف هذا الدور؟ لا يمكن التراجع عن هذه العملية."
      >
        <UniversalDialogFooter>
          <DialogCloseButton onClick={() => setIsDeleteConfirmOpen(false)} />
          <DialogDeleteButton onClick={handleDeleteRoleConfirm} disabled={loading} loading={loading} />
        </UniversalDialogFooter>
      </UniversalDialog>
    </div>
  );
}

// Export the component as default export
export default RolesManagementTab; 