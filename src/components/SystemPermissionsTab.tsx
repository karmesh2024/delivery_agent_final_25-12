'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { PermissionData as ApiPermissionData } from '@/domains/admins/types';
import { permissionsApi, getResources, getActions, getAdminGroups } from '@/services/permissionsApi';
import { AdminPermissions } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Label } from "@/shared/components/ui/label";
import { FiPlus, FiEdit, FiTrash2, FiInfo } from "react-icons/fi";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
// استخدم حوار الصلاحيات المخصص (يدعم العنوان والوصف والـ footer)
import { PermissionsUserDialog as UniversalDialog } from "@/app/permissions/components/PermissionsUserDialog";

// استيراد أزرار الحوار من الملف الصحيح
import { 
  PermissionsDialogConfirmButton as DialogConfirmButton, 
  PermissionsDialogCloseButton as DialogCloseButton, 
  PermissionsDialogDeleteButton as DialogDeleteButton 
} from "@/app/permissions/components/PermissionsUserDialog";

export const SystemPermissionsTab: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemPermissions, setSystemPermissions] = useState<ApiPermissionData[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPermission, setCurrentPermission] = useState<ApiPermissionData | null>(null);
  const [newPermissionDetails, setNewPermissionDetails] = useState<Partial<ApiPermissionData>>({});
  const [availableResources, setAvailableResources] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [availableActions, setAvailableActions] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [availableGroups, setAvailableGroups] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [permsRes, resourcesRes, actionsRes, groupsRes] = await Promise.all([
        permissionsApi.getAvailablePermissions(), 
        getResources(),
        getActions(),
        getAdminGroups()
      ]);

      if (permsRes.error) throw new Error(`Failed to fetch permissions: ${permsRes.error.message}`);
      if (resourcesRes.error) throw new Error(`Failed to fetch resources: ${resourcesRes.error.message}`);
      if (actionsRes.error) throw new Error(`Failed to fetch actions: ${actionsRes.error.message}`);
      if (groupsRes.error) throw new Error(`Failed to fetch groups: ${groupsRes.error.message}`);

      setSystemPermissions(permsRes.data || []);
      setAvailableResources(resourcesRes.data || []);
      setAvailableActions(actionsRes.data || []);
      setAvailableGroups(groupsRes.data || []);

    } catch (err: unknown) {
      console.error("Error fetching system permissions data:", err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPermissionClick = () => {
    setNewPermissionDetails({});
    setCurrentPermission(null);
    setIsAddModalOpen(true);
  };

  const handleEditPermissionClick = (permission: ApiPermissionData) => {
    setCurrentPermission(permission);
    setNewPermissionDetails({ 
      ...permission, 
      resource_id: permission.resource_id?.toString(),
      action_id: permission.action_id?.toString()
    });
    setIsEditModalOpen(true);
  };

  const handleDeletePermissionClick = (permissionId: string) => {
    const permissionToDelete = systemPermissions.find(p => p.id === permissionId);
    if (permissionToDelete) {
      setCurrentPermission(permissionToDelete);
      setIsDeleteModalOpen(true);
    } else {
      console.error("Permission not found for deletion:", permissionId);
    }
  };

  const handleAddPermissionSubmit = async () => {
    if (!newPermissionDetails.code || !newPermissionDetails.resource_id || !newPermissionDetails.action_id) {
      setError("Code, Resource, and Action are required.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        code: newPermissionDetails.code,
        description: newPermissionDetails.description || null,
        name: newPermissionDetails.name || null,
        resource_id: newPermissionDetails.resource_id,
        action_id: newPermissionDetails.action_id,
        group_id: newPermissionDetails.group_id || null,
      };
      const result = await permissionsApi.addPermission(payload);
      if (result.error) {
        throw result.error;
      }
      setIsAddModalOpen(false);
      fetchData(); // Refresh list
    } catch (err: unknown) {
      console.error("Error adding permission:", err);
      const message = err instanceof Error ? err.message : 'Failed to add permission';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPermissionSubmit = async () => {
    if (!currentPermission || !currentPermission.id) {
      setError("No permission selected for editing.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload: Partial<ApiPermissionData> = {};
      if (newPermissionDetails.code && newPermissionDetails.code !== currentPermission.code) payload.code = newPermissionDetails.code;
      if (newPermissionDetails.description !== currentPermission.description) payload.description = newPermissionDetails.description;
      if (newPermissionDetails.name !== (currentPermission as any).name) payload.name = newPermissionDetails.name;
      if (newPermissionDetails.resource_id && newPermissionDetails.resource_id !== currentPermission.resource_id) payload.resource_id = newPermissionDetails.resource_id;
      if (newPermissionDetails.action_id && newPermissionDetails.action_id !== currentPermission.action_id) payload.action_id = newPermissionDetails.action_id;
      if ((newPermissionDetails as any).group_id !== (currentPermission as any).group_id) (payload as any).group_id = (newPermissionDetails as any).group_id;

      if (Object.keys(payload).length === 0) {
          console.log("No changes detected for permission update.");
          setIsEditModalOpen(false);
          return;
      }

      const result = await permissionsApi.updatePermission(currentPermission.id, payload);
      if (result.error) {
        throw result.error;
      }
      setIsEditModalOpen(false);
      fetchData(); // Refresh list
    } catch (err: unknown) {
      console.error("Error updating permission:", err);
      const message = err instanceof Error ? err.message : 'Failed to update permission';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePermissionConfirm = async () => {
    if (!currentPermission || !currentPermission.id) {
      setError("No permission selected for deletion.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await permissionsApi.deletePermission(currentPermission.id);
      if (result.error) {
        throw result.error;
      }
      setIsDeleteModalOpen(false);
      setCurrentPermission(null);
      fetchData(); // Refresh list
    } catch (err: unknown) {
      console.error("Error deleting permission:", err);
      const message = err instanceof Error ? err.message : 'Failed to delete permission';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
        <CardHeader>
            <CardTitle>System Permissions Management</CardTitle>
            <CardDescription>Manage all available permissions in the system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
                <div/> { /* Placeholder for alignment */}
                <Button onClick={handleAddPermissionClick}><FiPlus className="mr-2" /> Add Permission</Button>
            </div>
            {isLoading && <p className="text-center py-4">Loading permissions...</p>}
            {error && <p className="text-red-500 text-center py-4">Error: {error}</p>}
            {!isLoading && !error && systemPermissions.length === 0 && (
                <p className="text-center py-4 text-gray-500">No system permissions found.</p>
            )}
            {!isLoading && !error && systemPermissions.length > 0 && (
                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                <th scope="col" className="relative px-4 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {systemPermissions.map((permission) => (
                                <tr key={permission.id}>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">{permission.code}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{permission.description}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{availableResources.find(r => r.id === permission.resource_id)?.name || permission.resource_id}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{availableActions.find(a => a.id === permission.action_id)?.name || permission.action_id}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditPermissionClick(permission)} className="text-blue-600 hover:text-blue-700"><FiEdit className="h-3 w-3"/></Button>
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeletePermissionClick(permission.id)}><FiTrash2 className="h-3 w-3"/></Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

             {/* Add Permission Dialog - تم استبدال Dialog بـ UniversalDialog */}
            <UniversalDialog
              isOpen={isAddModalOpen}
              onClose={() => {
                setIsAddModalOpen(false);
                setError(null);
                setNewPermissionDetails({});
              }}
              title="إضافة صلاحية جديدة"
              description="أدخل تفاصيل الصلاحية الجديدة. الحقول المطلوبة معلمة بـ *"
              maxWidth="35rem"
              footer={
                <>
                  <DialogCloseButton onClick={() => setIsAddModalOpen(false)} />
                  <DialogConfirmButton 
                    onClick={handleAddPermissionSubmit}
                    text="إضافة صلاحية"
                    disabled={isLoading || !newPermissionDetails.code || !newPermissionDetails.resource_id || !newPermissionDetails.action_id}
                    loading={isLoading}
                  />
                </>
              }
            >
              <div className="grid gap-4 py-2">
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  {/* Name Input */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <div className="flex items-center justify-end gap-1">
                        <Label htmlFor="perm-name" className="text-right">الاسم</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FiInfo className="text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>اسم وصفي يظهر للمستخدمين مثل "إنشاء طلب"</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input 
                          id="perm-name" 
                          value={newPermissionDetails.name || ''} 
                          onChange={(e) => setNewPermissionDetails({...newPermissionDetails, name: e.target.value})} 
                          className="col-span-3" 
                          placeholder="مثال: إنشاء طلب"
                      />
                  </div>
                  {/* Code Input */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <div className="flex items-center justify-end gap-1">
                      <Label htmlFor="perm-code" className="text-right">الرمز*</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FiInfo className="text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>صيغة ثابتة resource:action مثل orders:create ويجب أن تكون فريدة</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input 
                          id="perm-code" 
                          value={newPermissionDetails.code || ''} 
                          onChange={(e) => setNewPermissionDetails({...newPermissionDetails, code: e.target.value})} 
                          className="col-span-3" 
                          placeholder="مثال: orders:create" 
                      />
                  </div>
                  {/* Description Input */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <div className="flex items-center justify-end gap-1">
                      <Label htmlFor="perm-desc" className="text-right">الوصف</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FiInfo className="text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>شرح مختصر لما تسمح به هذه الصلاحية</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input 
                          id="perm-desc" 
                          value={newPermissionDetails.description || ''} 
                          onChange={(e) => setNewPermissionDetails({...newPermissionDetails, description: e.target.value})} 
                          className="col-span-3" 
                      />
                  </div>
                  {/* Group Select */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <div className="flex items-center justify-end gap-1">
                        <Label htmlFor="perm-group" className="text-right">المجموعة</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FiInfo className="text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>تنظيم الصلاحيات في مجموعات إدارية (اختياري)</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select 
                          value={newPermissionDetails.group_id ?? 'none'}
                          onValueChange={(value) => setNewPermissionDetails({...newPermissionDetails, group_id: value === 'none' ? null : value})}
                      >
                          <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="بدون مجموعة" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="none">بدون مجموعة</SelectItem>
                              {availableGroups.map(g => (
                                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  {/* Resource Select */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <div className="flex items-center justify-end gap-1">
                      <Label htmlFor="perm-resource" className="text-right">المورد*</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FiInfo className="text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>الكيان المستهدف بهذه الصلاحية مثل الطلبات أو الرسائل</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select 
                          value={newPermissionDetails.resource_id ?? undefined}
                          onValueChange={(value) => setNewPermissionDetails({...newPermissionDetails, resource_id: value})}
                      >
                          <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="اختر مورد..." />
                          </SelectTrigger>
                          <SelectContent>
                              {availableResources.map(res => (
                                  <SelectItem key={res.id} value={res.id}>{res.name} ({res.code})</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  {/* Action Select */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <div className="flex items-center justify-end gap-1">
                      <Label htmlFor="perm-action" className="text-right">الإجراء*</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FiInfo className="text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>نوع الفعل على المورد مثل عرض، إنشاء، إدارة، حذف</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select 
                          value={newPermissionDetails.action_id ?? undefined}
                          onValueChange={(value) => setNewPermissionDetails({...newPermissionDetails, action_id: value})}
                      >
                          <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="اختر إجراء..." />
                          </SelectTrigger>
                          <SelectContent>
                              {availableActions.map(act => (
                                  <SelectItem key={act.id} value={act.id}>{act.name} ({act.code})</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
              </div>
            </UniversalDialog>

            {/* Edit Permission Dialog - تم استبدال Dialog بـ UniversalDialog */}
            <UniversalDialog
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setError(null);
                setCurrentPermission(null);
              }}
              title="تعديل الصلاحية"
              description="قم بتعديل تفاصيل الصلاحية. الحقول المطلوبة معلمة بـ *"
              maxWidth="35rem"
              footer={
                <>
                  <DialogCloseButton onClick={() => setIsEditModalOpen(false)} />
                  <DialogConfirmButton 
                    onClick={handleEditPermissionSubmit}
                    text="حفظ التغييرات"
                    disabled={isLoading || !newPermissionDetails.code || !newPermissionDetails.resource_id || !newPermissionDetails.action_id}
                    loading={isLoading}
                  />
                </>
              }
            >
              <div className="grid gap-4 py-2">
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  {/* Code Input */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <div className="flex items-center justify-end gap-1">
                      <Label htmlFor="edit-perm-code" className="text-right">الرمز*</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FiInfo className="text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>resource:action مثل orders:manage</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input 
                          id="edit-perm-code" 
                          value={newPermissionDetails.code || ''} 
                          onChange={(e) => setNewPermissionDetails({...newPermissionDetails, code: e.target.value})} 
                          className="col-span-3" 
                          placeholder="مثال: orders:create" 
                      />
                  </div>
                  {/* Description Input */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <div className="flex items-center justify-end gap-1">
                      <Label htmlFor="edit-perm-desc" className="text-right">الوصف</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FiInfo className="text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>وصف موجز لغاية الصلاحية</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input 
                          id="edit-perm-desc" 
                          value={newPermissionDetails.description || ''} 
                          onChange={(e) => setNewPermissionDetails({...newPermissionDetails, description: e.target.value})} 
                          className="col-span-3" 
                      />
                  </div>
                  {/* Name Input */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <div className="flex items-center justify-end gap-1">
                        <Label htmlFor="edit-perm-name" className="text-right">الاسم</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FiInfo className="text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>اسم قابل للقراءة للمستخدمين</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input 
                          id="edit-perm-name" 
                          value={newPermissionDetails.name || ''} 
                          onChange={(e) => setNewPermissionDetails({...newPermissionDetails, name: e.target.value})} 
                          className="col-span-3" 
                      />
                  </div>
                  {/* Resource Select */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <div className="flex items-center justify-end gap-1">
                      <Label htmlFor="edit-perm-resource" className="text-right">المورد*</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FiInfo className="text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>الكيان الذي تنطبق عليه الصلاحية</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select 
                          value={newPermissionDetails.resource_id ?? undefined}
                          onValueChange={(value) => setNewPermissionDetails({...newPermissionDetails, resource_id: value})}
                      >
                          <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="اختر مورد..." />
                          </SelectTrigger>
                          <SelectContent>
                              {availableResources.map(res => (
                                  <SelectItem key={res.id} value={res.id}>{res.name} ({res.code})</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  {/* Action Select */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <div className="flex items-center justify-end gap-1">
                      <Label htmlFor="edit-perm-action" className="text-right">الإجراء*</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FiInfo className="text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>الفعل المطلوب على المورد</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select 
                          value={newPermissionDetails.action_id ?? undefined}
                          onValueChange={(value) => setNewPermissionDetails({...newPermissionDetails, action_id: value})}
                      >
                          <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="اختر إجراء..." />
                          </SelectTrigger>
                          <SelectContent>
                              {availableActions.map(act => (
                                  <SelectItem key={act.id} value={act.id}>{act.name} ({act.code})</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  {/* Group Select */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <div className="flex items-center justify-end gap-1">
                        <Label htmlFor="edit-perm-group" className="text-right">المجموعة</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FiInfo className="text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>اختياري لتنظيم الصلاحيات</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select 
                          value={newPermissionDetails.group_id ?? 'none'}
                          onValueChange={(value) => setNewPermissionDetails({...newPermissionDetails, group_id: value === 'none' ? null : value})}
                      >
                          <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="بدون مجموعة" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="none">بدون مجموعة</SelectItem>
                              {availableGroups.map(g => (
                                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
              </div>
            </UniversalDialog>

            {/* Delete Permission Dialog - تم استبدال Dialog بـ UniversalDialog */}
            <UniversalDialog
              isOpen={isDeleteModalOpen}
              onClose={() => {
                setIsDeleteModalOpen(false);
                setError(null);
              }}
              title="تأكيد حذف الصلاحية"
              description="هل أنت متأكد من رغبتك في حذف هذه الصلاحية؟ هذا الإجراء لا يمكن التراجع عنه."
              maxWidth="35rem"
              footer={
                <>
                  <DialogCloseButton onClick={() => setIsDeleteModalOpen(false)} />
                  <DialogDeleteButton 
                    onClick={handleDeletePermissionConfirm}
                    disabled={isLoading}
                    loading={isLoading}
                  />
                </>
              }
            >
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              {currentPermission && (
                  <div className="py-2">
                      <p className="mb-2"><strong>الرمز:</strong> {currentPermission.code}</p>
                      {currentPermission.description && (
                          <p className="mb-2"><strong>الوصف:</strong> {currentPermission.description}</p>
                      )}
                      <p className="mt-4 text-amber-600">هذا الإجراء لا يمكن التراجع عنه.</p>
                  </div>
              )}
            </UniversalDialog>
        </CardContent>
    </Card>
  );
};

export default SystemPermissionsTab;
