'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/shared/components/ui/dialog';
import { FiPlus, FiArrowRight, FiZap, FiClock, FiTrash2, FiPlay, FiStopCircle, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';
import { toast } from 'sonner';

interface ScheduledTrigger {
  id: string;
  task_name: string;
  description: string | null;
  trigger_type: 'cron' | 'condition';
  cron_expression: string | null;
  condition_query: string | null;
  condition_operator: string | null;
  condition_value: string | null;
  prompt_template: string;
  is_active: boolean;
  last_run_at: string | null;
}

export default function ZoonTriggersPage() {
  const [triggers, setTriggers] = useState<ScheduledTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    task_name: '',
    description: '',
    trigger_type: 'cron' as 'cron' | 'condition',
    cron_expression: '0 9 * * *',
    condition_query: '',
    condition_operator: '>',
    condition_value: '0',
    prompt_template: ''
  });

  const fetchTriggers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/zoon/triggers');
      const data = await res.json();
      setTriggers(data);
    } catch (error) {
      toast.error('فشل جلب المشغلات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriggers();
  }, []);

  const handleAddTrigger = async () => {
    try {
      if (!formData.task_name || !formData.prompt_template) {
        toast.error('يرجى ملء الحقول الأساسية');
        return;
      }

      if (formData.trigger_type === 'cron' && !formData.cron_expression) {
        toast.error('يرجى إدخال تعبير Cron');
        return;
      }

      const res = await fetch('/api/zoon/triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('تمت إضافة المهمة بنجاح');
        setIsAdding(false);
        fetchTriggers();
      }
    } catch (error) {
      toast.error('خطأ في الحفظ');
    }
  };

  const toggleStatus = async (trigger: ScheduledTrigger) => {
    try {
      const res = await fetch(`/api/zoon/triggers/${trigger.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !trigger.is_active })
      });
      if (res.ok) {
        toast.success(`تم ${!trigger.is_active ? 'تفعيل' : 'إيقاف'} المهمة`);
        fetchTriggers();
      }
    } catch (error) {
      toast.error('خطأ في التحديث');
    }
  };

  const deleteTrigger = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;
    try {
      const res = await fetch(`/api/zoon/triggers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم الحذف');
        fetchTriggers();
      }
    } catch (error) {
      toast.error('خطأ في الحذف');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/ai-settings">
              <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-indigo-600">
                <FiArrowRight /> العودة للإعدادات
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <FiZap className="text-orange-500" />
            مشغلات المهام والذكاء (Triggers)
          </h1>
          <p className="text-slate-500 text-sm mt-1">برمجة الوكيل ليعمل زمنياً (Cron) أو عند تحقق شروط محددة (Conditions)</p>
        </div>

        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2 shadow-lg shadow-orange-200">
              <FiPlus /> مشغل تلقائي جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FiZap className="text-orange-500" /> إضافة مشغل تلقائي ذكي
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 rtl text-right">
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">اسم المهمة</label>
                    <Input 
                      placeholder="مثال: تنبيه التأخير" 
                      value={formData.task_name}
                      onChange={(e) => setFormData({...formData, task_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">نوع التشغيل</label>
                    <select 
                      className="w-full border p-2 rounded-md text-sm"
                      value={formData.trigger_type}
                      onChange={(e) => setFormData({...formData, trigger_type: e.target.value as any})}
                    >
                      <option value="cron">مجـدول (Cron Job)</option>
                      <option value="condition">شرطـي (Monitoring Condition)</option>
                    </select>
                  </div>
               </div>
              
              {formData.trigger_type === 'cron' ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">توقيت التنفيذ (Cron Expression)</label>
                  <Input 
                    placeholder="0 9 * * *" 
                    value={formData.cron_expression}
                    onChange={(e) => setFormData({...formData, cron_expression: e.target.value})}
                    dir="ltr"
                  />
                  <p className="text-[10px] text-slate-400">مثال: 0 9 * * * (يومياً 9 صباحاً)</p>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                   <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">استعلام SQL للتحقق (يجب أن يعيد رقم واحد)</label>
                    <Textarea 
                      placeholder="SELECT count(*) FROM delivery_orders WHERE status = 'delayed'"
                      className="font-mono text-xs h-20"
                      value={formData.condition_query}
                      onChange={(e) => setFormData({...formData, condition_query: e.target.value})}
                      dir="ltr"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500">المعامل</label>
                      <select 
                        className="w-full border p-2 rounded-md text-sm"
                        value={formData.condition_operator || ''}
                        onChange={(e) => setFormData({...formData, condition_operator: e.target.value})}
                      >
                        <option value=">">أكبر من</option>
                        <option value="<">أصغر من</option>
                        <option value="=">يساوي</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500">القيمة</label>
                      <Input 
                        type="number"
                        value={formData.condition_value || ''}
                        onChange={(e) => setFormData({...formData, condition_value: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">التوجيه للوكيل (Prompt Template)</label>
                <Textarea 
                  placeholder="ماذا يفعل الوكيل عند الإطلاق؟ (مثلاً: حلل البيانات وأرسل تقرير...)" 
                  className="min-h-[120px]"
                  value={formData.prompt_template}
                  onChange={(e) => setFormData({...formData, prompt_template: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsAdding(false)}>إلغاء</Button>
              <Button onClick={handleAddTrigger} className="bg-orange-500 hover:bg-orange-600 text-white">تفعيل المشغل</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Triggers Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50 font-black">
            <TableRow>
              <TableHead className="text-right">اسم المهمة</TableHead>
              <TableHead className="text-right">النوع</TableHead>
              <TableHead className="text-right">التوقيت / الشرط</TableHead>
              <TableHead className="text-right">آخر تشغيل</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-center">حذف</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10">جاري التحميل...</TableCell></TableRow>
            ) : triggers.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">لا توجد مهام نشطة حالياً</TableCell></TableRow>
            ) : triggers.map(item => (
              <TableRow key={item.id} className={!item.is_active ? "opacity-50" : ""}>
                <TableCell>
                  <div className="font-bold text-slate-900">{item.task_name}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={item.trigger_type === 'cron' ? 'text-blue-600' : 'text-orange-600'}>
                    {item.trigger_type === 'cron' ? 'مجدول' : 'شرطي'}
                  </Badge>
                </TableCell>
                <TableCell>
                   <code className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-mono" dir="ltr">
                     {item.trigger_type === 'cron' ? item.cron_expression : `${item.condition_operator} ${item.condition_value}`}
                   </code>
                </TableCell>
                <TableCell className="text-[10px] text-slate-400 font-mono">
                  {item.last_run_at ? new Date(item.last_run_at).toLocaleString('ar-EG') : 'قيد الانتظار'}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleStatus(item)}
                    className={item.is_active ? "text-emerald-500" : "text-slate-300"}
                  >
                    {item.is_active ? <FiPlay size={18} /> : <FiStopCircle size={18} />}
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-400 hover:text-red-600"
                    onClick={() => deleteTrigger(item.id)}
                  >
                    <FiTrash2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-4 items-center">
          <FiClock className="text-blue-500 shrink-0" size={24} />
          <p className="text-[11px] text-slate-600 leading-relaxed">
            <strong>المشغل المجدول (Cron):</strong> ينفذ المهمة في وقت محدد بدقة. مثالي للتقارير الدورية (يومياً، أسبوعياً).
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-4 items-center">
          <FiAlertCircle className="text-orange-500 shrink-0" size={24} />
          <p className="text-[11px] text-orange-800 leading-relaxed">
            <strong>المشغل الشرطي (Condition):</strong> يراقب قاعدة البيانات باستمرار. مثالي للتنبيهات الفورية (تأخر الطلبات، نقص المخزون).
          </p>
        </div>
      </div>
    </div>
  );
}
