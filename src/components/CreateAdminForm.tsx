'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { createAdmin } from '@/store/adminsSlice';
import { Role, Admin } from '@/domains/admins/types';
import { edgeFunctionsApi } from '@/services/edgeFunctionsApi';
import { toast } from '@/shared/ui/toast';
import { CreateAdminDto } from '@/domains/admins/types';

// مكونات واجهة المستخدم
import {
  Card,
  CardContent,
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
import {
  DialogSelect,
  DialogSelectContent,
  DialogSelectItem,
  DialogSelectTrigger,
  DialogSelectValue,
} from "@/shared/components/ui/DialogSelect";
import { SimpleSelect } from "@/shared/components/ui/SimpleSelect";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { FiSave, FiUser } from "react-icons/fi";
import { AlertCircle, Loader2 } from "lucide-react";

interface CreateAdminFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
  inDialog?: boolean;
}

const CreateAdminForm = ({ onClose, onSuccess, inDialog }: CreateAdminFormProps) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  
  // حقول النموذج
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [username, setUsername] = useState('');
  const [initialBalance, setInitialBalance] = useState<number | undefined>(0);
  const [createWallet, setCreateWallet] = useState(true);
  
  // جلب قائمة الأدوار
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        console.log('[CreateAdminForm] Fetching roles from API');
        const response = await fetch('/api/roles');
        
        if (!response.ok) {
          throw new Error(`Error fetching roles: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[CreateAdminForm] Roles API response:', data);
        
        if (data && data.success && Array.isArray(data.roles)) {
          console.log('[CreateAdminForm] تم استلام الأدوار بنجاح:', data.roles);
          // سجل تشخيصي لعرض الأدوار المهمة
          console.log('[CreateAdminForm] أدوار مهمة:', data.roles.filter((role: Role) => 
            role.code === 'admin' || role.code === 'super_admin'
          ));

          // ترتيب الأدوار حسب المستوى (تنازلي)
          const sortedRoles = [...data.roles].sort((a, b) => 
            (b.level || 0) - (a.level || 0)
          );
          console.log('[CreateAdminForm] الأدوار بعد الترتيب:', sortedRoles);
          
          setRoles(sortedRoles);
          
          // إذا كانت القائمة غير فارغة، اختر "رئيس مجلس الادارة" افتراضيًا أو الدور الأول
          if (sortedRoles.length > 0 && !roleId) {
            // البحث عن دور "رئيس مجلس الادارة" أولاً
            const adminRole = sortedRoles.find(role => role.code === 'admin');
            if (adminRole) {
              console.log('[CreateAdminForm] تعيين دور رئيس مجلس الادارة كافتراضي:', adminRole.id);
              setRoleId(adminRole.id);
            } else {
              console.log('[CreateAdminForm] تعيين الدور الأول كافتراضي:', sortedRoles[0].id);
              setRoleId(sortedRoles[0].id);
            }
          }
        } else if (data && Array.isArray(data)) {
          console.log('[CreateAdminForm] تم استلام الأدوار بنجاح (صيغة بسيطة):', data);
          setRoles(data);
          
          // إذا كانت القائمة غير فارغة، اختر الدور الأول افتراضيًا
          if (data.length > 0 && !roleId) {
            console.log('[CreateAdminForm] Setting default role:', data[0].id);
            setRoleId(data[0].id);
          }
          } else {
          console.error('Unexpected roles format:', data);
          // استخدام قيم افتراضية ثابتة للأدوار إذا فشل الجلب
          const defaultRoles = [
            { id: '00000000-0000-0000-0000-000000000003', name: 'مدير مساعد', code: 'manager', level: 60, is_system: true, is_active: true },
            { id: '00000000-0000-0000-0000-000000000004', name: 'مشرف', code: 'supervisor', level: 40, is_system: true, is_active: true },
            { id: '00000000-0000-0000-0000-000000000005', name: 'دعم فني وخدمة عملاء', code: 'support', level: 30, is_system: true, is_active: true },
            { id: '00000000-0000-0000-0000-000000000006', name: 'مراقب - صلاحيات عرض فقط', code: 'viewer', level: 10, is_system: true, is_active: true },
            { id: '6786b241-8c2f-49b5-9947-6377fb5348fe', name: 'رئيس مجلس الادارة', code: 'admin', level: 100, is_system: true, is_active: true },
            { id: 'b98dc2ff-d97d-4f5a-a7bb-c9b864268c4c', name: 'مدير النظام', code: 'super_admin', level: 100, is_system: true, is_active: true },
            { id: 'c03d006e-f7fd-4def-89cd-c610c744255f', name: 'مدير المبيعات', code: 'sales_manager', level: 60, is_system: true, is_active: true }
          ] as Role[];
          console.log('[CreateAdminForm] استخدام الأدوار الافتراضية:', defaultRoles);
          setRoles(defaultRoles);
          
          // اختر الدور الأول افتراضيًا
          if (!roleId) {
            console.log('[CreateAdminForm] Setting default role from fallback:', defaultRoles[0].id);
            setRoleId(defaultRoles[0].id);
          }
        }
      } catch (error) {
        console.error('[CreateAdminForm] فشل في جلب الأدوار:', error);
        // استخدام قيم افتراضية ثابتة للأدوار إذا فشل الجلب
        const defaultRoles = [
          { id: '00000000-0000-0000-0000-000000000003', name: 'مدير مساعد', code: 'manager', level: 60, is_system: true, is_active: true },
          { id: '00000000-0000-0000-0000-000000000004', name: 'مشرف', code: 'supervisor', level: 40, is_system: true, is_active: true },
          { id: '00000000-0000-0000-0000-000000000005', name: 'دعم فني وخدمة عملاء', code: 'support', level: 30, is_system: true, is_active: true },
          { id: '00000000-0000-0000-0000-000000000006', name: 'مراقب - صلاحيات عرض فقط', code: 'viewer', level: 10, is_system: true, is_active: true },
          { id: '6786b241-8c2f-49b5-9947-6377fb5348fe', name: 'رئيس مجلس الادارة', code: 'admin', level: 100, is_system: true, is_active: true },
          { id: 'b98dc2ff-d97d-4f5a-a7bb-c9b864268c4c', name: 'مدير النظام', code: 'super_admin', level: 100, is_system: true, is_active: true },
          { id: 'c03d006e-f7fd-4def-89cd-c610c744255f', name: 'مدير المبيعات', code: 'sales_manager', level: 60, is_system: true, is_active: true }
        ] as Role[];
        console.log('[CreateAdminForm] استخدام الأدوار الافتراضية بعد خطأ:', defaultRoles);
        setRoles(defaultRoles);
        
        // اختر الدور الأول افتراضيًا
        if (!roleId) {
          console.log('[CreateAdminForm] Setting default role after error:', defaultRoles[0].id);
          setRoleId(defaultRoles[0].id);
        }
      }
    };
    
    fetchRoles();
  }, []);
  
  // وظيفة إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // إعادة تعيين حالة الخطأ
    setFormError(null);
    
    // التحقق من كلمة المرور المطابقة
    if (password !== confirmPassword) {
      setFormError('كلمات المرور غير متطابقة');
      toast({
        type: 'error',
        title: 'خطأ',
        description: 'كلمات المرور غير متطابقة'
      });
      return;
    }
    
    // التحقق من إدخال البيانات المطلوبة
    if (!email || !password || !fullName || !roleId) {
      console.log('[CreateAdminForm] Missing required fields:', { 
        email: !!email, 
        password: !!password, 
        fullName: !!fullName, 
        roleId: roleId 
      });
      
      setFormError('الرجاء إكمال كافة الحقول المطلوبة');
      toast({
        type: 'error',
        title: 'خطأ',
        description: 'الرجاء إكمال كافة الحقول المطلوبة'
      });
        return;
      }

    // إظهار حالة الإرسال
    console.log('[CreateAdminForm] Submitting form with data:', { 
      email, 
      full_name: fullName, 
      username,
      role_id: roleId,
      createWallet,
      initialBalance: createWallet ? initialBalance : undefined
    });

    setLoading(true);
    setProcessingStatus('جاري إنشاء المسؤول...');
    
    try {
      // استدعاء دالة createAdmin thunk، والتي ستتعامل مع استدعاء الـ API
      const actionResult = await dispatch(createAdmin({
        email,
        password,
        confirm_password: confirmPassword,
        username,
        full_name: fullName,
        role_id: roleId,
        initial_balance: createWallet ? initialBalance : undefined,
      }));
      
      // التحقق مما إذا كانت عملية الـ thunk قد تمت بنجاح أو فشلت
      if (createAdmin.fulfilled.match(actionResult)) {
        setProcessingStatus('تم إنشاء المسؤول بنجاح!');
        toast({
          type: 'success',
          title: 'تم بنجاح',
          description: 'تم إنشاء المسؤول بنجاح'
        });
        
        // إغلاق النموذج بعد النجاح
        if (onSuccess) onSuccess();
        if (inDialog && onClose) onClose();
      } else if (createAdmin.rejected.match(actionResult)) {
        const error = actionResult.payload as string; // Payload is the error message
        console.error('[CreateAdminForm] Error creating admin (thunk rejected):', error);
        setProcessingStatus(null);
        
        // تحسين رسائل الخطأ
        let errorMsg = error || 'خطأ غير معروف';
        let errorTitle = 'خطأ';
        
        if (errorMsg.includes('البريد الإلكتروني موجود') || 
            errorMsg.includes('duplicate key') ||
            errorMsg.includes('مسجل بالفعل') ||
            errorMsg.includes('already been registered') ||
            errorMsg.includes('unique constraint')) {
          errorTitle = 'البريد الإلكتروني مستخدم';
            errorMsg = 'هذا البريد الإلكتروني مسجل بالفعل. الرجاء استخدام بريد إلكتروني آخر.';
        }
        
        toast({
          type: 'error',
          title: errorTitle,
          description: errorMsg
        });
      }

    } catch (error) { // This catch block might not be hit if thunk rejects properly
      console.error('[CreateAdminForm] Unexpected error during admin creation dispatch:', error);
      setProcessingStatus(null);
      toast({
        type: 'error',
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع أثناء إنشاء المسؤول'
      });
    } finally {
      setLoading(false);
    }
  };

  // إضافة عرض رسالة الخطأ في النموذج
  const errorAlert = formError ? (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>خطأ</AlertTitle>
      <AlertDescription>{formError}</AlertDescription>
    </Alert>
  ) : null;

  // إضافة عرض حالة المعالجة
  const statusAlert = processingStatus ? (
    <Alert variant="default" className="mb-4 bg-blue-50">
      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      <AlertTitle>حالة العملية</AlertTitle>
      <AlertDescription>{processingStatus}</AlertDescription>
    </Alert>
  ) : null;

  return (
    <Card className={`w-full max-w-xl mx-auto ${inDialog ? 'shadow-none border-0' : 'shadow-md'}`}>
      <CardHeader>
        <CardTitle className="text-center text-xl">{inDialog ? 'إنشاء مسؤول جديد' : 'إضافة مسؤول جديد'}</CardTitle>
          <div className="mt-2">
            <p>معلومات هامة:</p>
            <p className="text-xs mt-1">عند إنشاء مسؤول جديد، سيتم استخدام دالة Supabase Edge Function (create-admin) لإنشاء المستخدم والأدمن.</p>
            <p className="text-xs mt-1">تأكد من اختيار الدور المناسب وإكمال كافة البيانات المطلوبة.</p>
          </div>
      </CardHeader>
      
      <CardContent>
        {errorAlert}
        {statusAlert}
      
        <form onSubmit={handleSubmit} className="space-y-4">
        {/* بيانات المستخدم الأساسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني <span className="text-red-500">*</span>
              </label>
            <input
                type="email"
              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="example@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم المستخدم <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="username123"
                value={username}
                onChange={(e) => setUsername(e.target.value.trim())}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
              الاسم الكامل <span className="text-red-500">*</span>
              </label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="محمد أحمد"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              كلمة المرور <span className="text-red-500">*</span>
              </label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="*********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
                required
              minLength={8}
              />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تأكيد كلمة المرور <span className="text-red-500">*</span>
              </label>
            <input
                type="password"
              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="*********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
                required
              minLength={8}
              />
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الدور <span className="text-red-500">*</span>
              </label>
              <SimpleSelect
                options={roles.map(role => ({ value: role.id, label: role.name }))}
              value={roleId}
                onChange={(value) => {
                  console.log('[CreateAdminForm] Role selected:', value);
                  setRoleId(value);
                }}
                placeholder="-- اختر الدور --"
                className="w-full"
              />
              {/* عرض قيمة الدور المحددة للتشخيص */}
              {roleId && (
                <div className="text-xs text-blue-600 mt-1">
                  تم اختيار الدور: {roleId} - {roles.find(r => r.id === roleId)?.name || ''}
                </div>
              )}
              {roles.length === 0 && (
                <div className="text-xs text-amber-600 mt-1">
                  <span className="inline-block animate-spin mr-1">&#9696;</span>
                  جاري تحميل الأدوار... إذا استمرت المشكلة، يرجى تحديث الصفحة.
                </div>
              )}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-400 mt-1">
                  الأدوار المتاحة: {roles.length} دور
                </div>
              )}
          </div>
        </div>
        
        {/* خيارات المحفظة */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center mb-4">
            <input
              id="createWallet"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={createWallet}
              onChange={(e) => setCreateWallet(e.target.checked)}
            />
            <label htmlFor="createWallet" className="mr-2 block text-sm font-medium text-gray-700">
              إنشاء محفظة مع المستخدم
            </label>
            </div>

          {createWallet && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الرصيد الأولي (جنيه مصري)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                value={initialBalance}
                onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                min={0}
                step="0.01"
              />
            </div>
          )}
        </div>

        {/* أزرار التحكم */}
          <div className="flex justify-between items-center pt-4">
            <div>
              {inDialog && onClose ? (
                <Button 
            type="button"
                  variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            إلغاء
                </Button>
              ) : null}
            </div>
            
            <Button 
            type="submit"
            disabled={loading}
          >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <FiSave className="mr-2 h-4 w-4" />
                  إنشاء المسؤول
                </>
              )}
            </Button>
        </div>
      </form>
      </CardContent>
    </Card>
    );
};

export default CreateAdminForm; 