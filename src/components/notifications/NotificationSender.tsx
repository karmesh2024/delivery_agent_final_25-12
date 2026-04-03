'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Bell, Send, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

// تعريف مخطط البيانات باستخدام Zod لضمان صحة المدخلات
const notificationSchema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل'),
  message: z.string().min(10, 'الرسالة يجب أن تكون 10 أحرف على الأقل'),
  type: z.string().default('info'),
  priority: z.string().default('medium'),
  source_department: z.string(),
  target_user_id: z.string().optional(),
  target_role: z.string().optional(),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

interface NotificationSenderProps {
  defaultTargetId?: string;
  defaultTargetRole?: 'customer' | 'delivery' | 'agent';
  department: 'customer_mgmt' | 'waste_mgmt' | 'financial_mgmt' | 'system_ops';
  trigger?: React.ReactNode;
}

export function NotificationSender({ 
  defaultTargetId, 
  defaultTargetRole, 
  department,
  trigger 
}: NotificationSenderProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // إعداد النموذج مع القيم الافتراضية
  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      message: '',
      type: 'info',
      priority: 'medium',
      source_department: department,
      target_user_id: defaultTargetId || '',
      target_role: defaultTargetRole || '',
    },
  });

  const onSubmit = async (values: NotificationFormValues) => {
    setIsSubmitting(true);
    try {
      // إرسال البيانات لجدول المقترحات للمراجعة
      const response = await fetch('/api/notifications/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('فشل في إرسال المقترح');

      toast.success('تم إرسال المقترح لمركز الإدارة للمراجعة');
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error('حدث خطأ أثناء إرسال المقترح، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Bell className="h-4 w-4" />
            إرسال إشعار
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-none bg-slate-950 text-white shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Bell className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">نظام الإشعارات الموحد</DialogTitle>
              <DialogDescription className="text-slate-400">
                إرسال تنبيه من إدارة {
                  department === 'customer_mgmt' ? 'العملاء' :
                  department === 'waste_mgmt' ? 'المخلفات' :
                  department === 'financial_mgmt' ? 'المالية' : 'النظام'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>عنوان الإشعار</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="مثال: تحديث في أسعار الجمع..." 
                      className="bg-slate-900 border-slate-800 focus:ring-blue-500" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>نص الرسالة</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="اكتب تفاصيل الإشعار هنا..." 
                      className="bg-slate-900 border-slate-800 min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>نوع التنبيه</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-900 border-slate-800">
                          <SelectValue placeholder="اختر النوع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        <SelectItem value="info">معلومات عامة</SelectItem>
                        <SelectItem value="alert">تنبيه هام</SelectItem>
                        <SelectItem value="price_update">تحديث أسعار</SelectItem>
                        <SelectItem value="system">تحديث نظام</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الأولوية</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-900 border-slate-800">
                          <SelectValue placeholder="اختر الأولوية" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        <SelectItem value="low">منخفضة</SelectItem>
                        <SelectItem value="medium">متوسطة</SelectItem>
                        <SelectItem value="high">مرتفعة جداً</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="p-3 bg-blue-500/10 rounded-md border border-blue-500/20 text-xs text-blue-300">
              <div className="flex items-center gap-2 mb-1 font-bold">
                <ShieldCheck className="h-3 w-3" />
                معلومات الاستهداف:
              </div>
              {defaultTargetId ? (
                <p>مستهدف: مستخدم محدد (ID: {defaultTargetId})</p>
              ) : defaultTargetRole ? (
                <p>مستهدف: جميع {defaultTargetRole === 'delivery' ? 'المناديب' : defaultTargetRole === 'agent' ? 'الوكلاء' : 'العملاء'}</p>
              ) : (
                <p>يرجى اختيار فئة المستهدفين من الإعدادات المتقدمة.</p>
              )}
            </div>

            <DialogFooter>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 h-11 transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">جاري الإرسال...</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    تأكيد وإرسال الإشعار
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
