'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { FiPlus, FiEdit, FiTrash2, FiInfo } from 'react-icons/fi';
import { 
  getResources, getActions,
  createResource, updateResource, deleteResource,
  createAction, updateAction, deleteAction
} from '@/services/permissionsApi';
import { PermissionsUserDialog as Dialog } from '@/app/permissions/components/PermissionsUserDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';

type Resource = { id: string; name: string; code: string; description?: string | null; is_active: boolean };
type Action = { id: string; name: string; code: string; description?: string | null };

export default function ResourcesActionsManagement() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // dialogs state
  const [openResDialog, setOpenResDialog] = useState(false);
  const [openActDialog, setOpenActDialog] = useState(false);
  const [editingRes, setEditingRes] = useState<Resource | null>(null);
  const [editingAct, setEditingAct] = useState<Action | null>(null);
  const [resForm, setResForm] = useState({ name: '', code: '', description: '' });
  const [actForm, setActForm] = useState({ name: '', code: '', description: '' });

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resRes, actRes] = await Promise.all([getResources(), getActions()]);
      if (resRes.error) throw resRes.error as any;
      if (actRes.error) throw actRes.error as any;
      setResources((resRes.data || []).map(r => ({ ...r, is_active: (r as any).is_active ?? true })) as Resource[]);
      setActions((actRes.data || []) as Action[]);
    } catch (e: any) {
      setError(e?.message || 'Failed to load resources/actions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  // Handlers Resources
  const handleOpenAddRes = () => {
    setEditingRes(null);
    setResForm({ name: '', code: '', description: '' });
    setOpenResDialog(true);
  };
  const handleOpenEditRes = (r: Resource) => {
    setEditingRes(r);
    setResForm({ name: r.name, code: r.code, description: r.description || '' });
    setOpenResDialog(true);
  };
  const submitRes = async () => {
    setLoading(true);
    setError(null);
    try {
      if (editingRes) {
        const { error } = await updateResource(editingRes.id, { name: resForm.name, code: resForm.code, description: resForm.description });
        if (error) throw error as any;
      } else {
        const { error } = await createResource({ name: resForm.name, code: resForm.code, description: resForm.description });
        if (error) throw error as any;
      }
      setOpenResDialog(false);
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to save resource');
    } finally {
      setLoading(false);
    }
  };
  const removeRes = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await deleteResource(id);
      if (error) throw error as any;
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete resource');
    } finally {
      setLoading(false);
    }
  };

  // Handlers Actions
  const handleOpenAddAct = () => {
    setEditingAct(null);
    setActForm({ name: '', code: '', description: '' });
    setOpenActDialog(true);
  };
  const handleOpenEditAct = (a: Action) => {
    setEditingAct(a);
    setActForm({ name: a.name, code: a.code, description: a.description || '' });
    setOpenActDialog(true);
  };
  const submitAct = async () => {
    setLoading(true);
    setError(null);
    try {
      if (editingAct) {
        const { error } = await updateAction(editingAct.id, { name: actForm.name, code: actForm.code, description: actForm.description });
        if (error) throw error as any;
      } else {
        const { error } = await createAction({ name: actForm.name, code: actForm.code, description: actForm.description });
        if (error) throw error as any;
      }
      setOpenActDialog(false);
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to save action');
    } finally {
      setLoading(false);
    }
  };
  const removeAct = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await deleteAction(id);
      if (error) throw error as any;
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete action');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-red-500 text-sm">{String(error)}</p>}

      {/* Resources Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>الموارد (resources)</CardTitle>
          <Button onClick={handleOpenAddRes}><FiPlus className="mr-2"/> إضافة مورد</Button>
        </CardHeader>
        <CardContent>
          {loading && <p>جار التحميل...</p>}
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">الاسم</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">الكود</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">الوصف</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resources.map(r => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 text-sm">{r.name}</td>
                    <td className="px-4 py-2 text-sm font-mono">{r.code}</td>
                    <td className="px-4 py-2 text-sm">{r.description}</td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEditRes(r)} className="text-blue-600"><FiEdit/></Button>
                      <Button variant="ghost" size="sm" onClick={() => removeRes(r.id)} className="text-red-600"><FiTrash2/></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>الإجراءات (actions)</CardTitle>
          <Button onClick={handleOpenAddAct}><FiPlus className="mr-2"/> إضافة إجراء</Button>
        </CardHeader>
        <CardContent>
          {loading && <p>جار التحميل...</p>}
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">الاسم</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">الكود</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">الوصف</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {actions.map(a => (
                  <tr key={a.id}>
                    <td className="px-4 py-2 text-sm">{a.name}</td>
                    <td className="px-4 py-2 text-sm font-mono">{a.code}</td>
                    <td className="px-4 py-2 text-sm">{a.description}</td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEditAct(a)} className="text-blue-600"><FiEdit/></Button>
                      <Button variant="ghost" size="sm" onClick={() => removeAct(a.id)} className="text-red-600"><FiTrash2/></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Resource Dialog */}
      <Dialog
        isOpen={openResDialog}
        onClose={() => setOpenResDialog(false)}
        title={editingRes ? 'تعديل مورد' : 'إضافة مورد'}
        description="أدخل بيانات المورد. الكود يجب أن يكون فريدًا"
        maxWidth="32rem"
        footer={
          <>
            <button onClick={() => setOpenResDialog(false)} className="px-2 h-7 text-xs border rounded">إلغاء</button>
            <button onClick={submitRes} className="px-2 h-7 text-xs bg-blue-600 text-white rounded" disabled={loading}>حفظ</button>
          </>
        }
      >
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="flex items-center justify-end gap-1">
              <Label className="text-right">الاسم</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>اسم المورد الظاهر للمستخدمين (مثلاً: الطلبات)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input className="col-span-3" value={resForm.name} onChange={e => setResForm({ ...resForm, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="flex items-center justify-end gap-1">
              <Label className="text-right">الكود</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>رمز فريد بالإنجليزية والشرطات السفلية فقط (مثل: orders)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input className="col-span-3" value={resForm.code} onChange={e => setResForm({ ...resForm, code: e.target.value })} placeholder="مثل: orders" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="flex items-center justify-end gap-1">
              <Label className="text-right">الوصف</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>شرح مختصر لما يمثله المورد في النظام (اختياري)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input className="col-span-3" value={resForm.description} onChange={e => setResForm({ ...resForm, description: e.target.value })} placeholder="مثلاً: إدارة عمليات الفرز" />
          </div>
        </div>
      </Dialog>

      {/* Action Dialog */}
      <Dialog
        isOpen={openActDialog}
        onClose={() => setOpenActDialog(false)}
        title={editingAct ? 'تعديل إجراء' : 'إضافة إجراء'}
        description="أدخل بيانات الإجراء. الكود يجب أن يكون فريدًا"
        maxWidth="32rem"
        footer={
          <>
            <button onClick={() => setOpenActDialog(false)} className="px-2 h-7 text-xs border rounded">إلغاء</button>
            <button onClick={submitAct} className="px-2 h-7 text-xs bg-blue-600 text-white rounded" disabled={loading}>حفظ</button>
          </>
        }
      >
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="flex items-center justify-end gap-1">
              <Label className="text-right">الاسم</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>اسم الإجراء الظاهر (عرض، إنشاء، إدارة...)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input className="col-span-3" value={actForm.name} onChange={e => setActForm({ ...actForm, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="flex items-center justify-end gap-1">
              <Label className="text-right">الكود</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>رمز فريد للإجراء (view, create, manage, delete)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input className="col-span-3" value={actForm.code} onChange={e => setActForm({ ...actForm, code: e.target.value })} placeholder="مثل: view / create" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="flex items-center justify-end gap-1">
              <Label className="text-right">الوصف</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>شرح مختصر لما يقوم به هذا الإجراء (اختياري)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input className="col-span-3" value={actForm.description} onChange={e => setActForm({ ...actForm, description: e.target.value })} />
          </div>
        </div>
      </Dialog>
    </div>
  );
}


