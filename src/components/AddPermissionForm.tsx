'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { addPermission } from '@/domains/admins/store/permissionsSlice';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardFooter,
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
import { Textarea } from "@/shared/components/ui/textarea";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { FiSave, FiAlertCircle } from "react-icons/fi";

// تعريف أنواع البيانات
interface Resource {
  id: string;
  name: string;
  code: string;
}

interface Action {
  id: string;
  name: string;
  code: string;
}

interface Group {
  id: string;
  name: string;
}

interface AddPermissionFormProps {
  onSuccess?: () => void;
}

/**
 * نموذج إضافة صلاحية جديدة
 * يتضمن حقول لإدخال بيانات الصلاحية مع قوائم منسدلة للـ Resource و Action و Group
 */
export function AddPermissionForm({ onSuccess }: AddPermissionFormProps) {
  const dispatch = useAppDispatch();
  
  // حالات النموذج
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [actionId, setActionId] = useState('');
  const [groupId, setGroupId] = useState('');
  
  // حالات البيانات المرجعية
  const [resources, setResources] = useState<Resource[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  // حالات النموذج
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // جلب البيانات المرجعية عند تحميل المكون
  useEffect(() => {
    fetchResources();
    fetchActions();
    fetchGroups();
  }, []);
  
  // جلب الموارد من قاعدة البيانات
  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('id, name, code')
        .order('name');
      
      if (error) throw error;
      
      setResources(data || []);
    } catch (err) {
      console.error('خطأ في جلب الموارد:', err);
      setError('حدث خطأ أثناء جلب قائمة الموارد');
    }
  };
  
  // جلب الإجراءات من قاعدة البيانات
  const fetchActions = async () => {
    try {
      const { data, error } = await supabase
        .from('actions')
        .select('id, name, code')
        .order('name');
      
      if (error) throw error;
      
      setActions(data || []);
    } catch (err) {
      console.error('خطأ في جلب الإجراءات:', err);
      setError('حدث خطأ أثناء جلب قائمة الإجراءات');
    }
  };
  
  // جلب المجموعات من قاعدة البيانات
  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_groups')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      
      setGroups(data || []);
    } catch (err) {
      console.error('خطأ في جلب المجموعات:', err);
      setError('حدث خطأ أثناء جلب قائمة المجموعات');
    }
  };
  
  // توليد كود الصلاحية تلقائيًا عند اختيار المورد والإجراء
  useEffect(() => {
    if (resourceId && actionId) {
      const selectedResource = resources.find(r => r.id === resourceId);
      const selectedAction = actions.find(a => a.id === actionId);
      
      if (selectedResource && selectedAction) {
        // توليد الكود بتنسيق resource:action
        const generatedCode = `${selectedResource.code}:${selectedAction.code}`;
        setCode(generatedCode);
        
        // اقتراح اسم للصلاحية إذا لم يتم إدخاله
        if (!name) {
          const generatedName = `${selectedAction.name} ${selectedResource.name}`;
          setName(generatedName);
        }
      }
    }
  }, [resourceId, actionId, resources, actions, name]);
  
  // إعادة تعيين النموذج
  const resetForm = () => {
    setCode('');
    setName('');
    setDescription('');
    setResourceId('');
    setActionId('');
    setGroupId('');
    setError(null);
  };
  
  // إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // التحقق من الحقول المطلوبة
      if (!code || !resourceId || !actionId) {
        throw new Error('يرجى ملء جميع الحقول المطلوبة');
      }
      
      // إنشاء كائن الصلاحية الجديدة
      const newPermission = {
        code,
        name,
        description,
        resource_id: resourceId,
        action_id: actionId,
        group_id: groupId || null
      };
      
      // إضافة الصلاحية إلى قاعدة البيانات
      const { data, error: supabaseError } = await supabase
        .from('permissions')
        .insert([newPermission])
        .select();
      
      if (supabaseError) throw supabaseError;
      
      // إضافة الصلاحية إلى حالة Redux
      if (data && data.length > 0) {
        dispatch(addPermission(data[0]));
        setSuccess(true);
        resetForm();
        
        // استدعاء دالة النجاح إذا تم توفيرها
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      console.error('خطأ في إضافة الصلاحية:', err);
      setError(err.message || 'حدث خطأ أثناء إضافة الصلاحية');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <Alert variant="destructive">
              <FiAlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <AlertDescription>تم إضافة الصلاحية بنجاح</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* اختيار المورد */}
            <div className="space-y-2">
              <Label htmlFor="resource">المورد <span className="text-red-500">*</span></Label>
              <Select
                value={resourceId}
                onValueChange={setResourceId}
                required
              >
                <SelectTrigger id="resource">
                  <SelectValue placeholder="اختر المورد" />
                </SelectTrigger>
                <SelectContent>
                  {resources.map((resource) => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* اختيار الإجراء */}
            <div className="space-y-2">
              <Label htmlFor="action">الإجراء <span className="text-red-500">*</span></Label>
              <Select
                value={actionId}
                onValueChange={setActionId}
                required
              >
                <SelectTrigger id="action">
                  <SelectValue placeholder="اختر الإجراء" />
                </SelectTrigger>
                <SelectContent>
                  {actions.map((action) => (
                    <SelectItem key={action.id} value={action.id}>
                      {action.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="code">كود الصلاحية <span className="text-red-500">*</span></Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="مثال: users:create"
              required
            />
            <p className="text-xs text-gray-500">يتم توليد الكود تلقائيًا عند اختيار المورد والإجراء</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">اسم الصلاحية</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: إنشاء مستخدم"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">وصف الصلاحية</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للصلاحية وما تسمح به"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="group">المجموعة</Label>
            <Select
              value={groupId}
              onValueChange={setGroupId}
            >
              <SelectTrigger id="group">
                <SelectValue placeholder="اختر المجموعة (اختياري)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">بدون مجموعة</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={loading}
          >
            إعادة تعيين
          </Button>
          
          <Button
            type="submit"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <FiSave className="h-4 w-4" />
            {loading ? 'جاري الحفظ...' : 'حفظ الصلاحية'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}