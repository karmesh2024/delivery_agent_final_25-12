'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Textarea } from '@/shared/components/ui/textarea';
import { Input } from '@/shared/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/shared/components/ui/dialog';
import { FiPlus, FiCheck, FiArrowRight, FiFileText, FiClock, FiUser, FiActivity, FiShield } from 'react-icons/fi';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface SystemPrompt {
  id: string;
  version: number;
  content: string;
  is_active: boolean;
  created_by: string | null;
  note: string | null;
  created_at: string;
}

export default function ZoonPromptsPage() {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newNote, setNewNote] = useState('');

  // جلب البيانات
  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/zoon/prompts');
      const data = await res.json();
      if (res.ok) {
        setPrompts(data);
      } else {
        toast.error('فشل جلب البيانات: ' + data.error);
      }
    } catch (error) {
      toast.error('خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  // تفعيل نسخة
  const activatePrompt = async (id: string) => {
    try {
      const res = await fetch(`/api/zoon/prompts/${id}/activate`, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        toast.success('تم تفعيل النسخة الجديدة بنجاح');
        fetchPrompts();
      } else {
        toast.error('فشل التفعيل: ' + data.error);
      }
    } catch (error) {
      toast.error('خطأ في الاتصال');
    }
  };

  // إضافة نسخة جديدة
  const handleAddPrompt = async () => {
    if (!newContent.trim()) {
      toast.error('يرجى كتابة محتوى البرومبت');
      return;
    }

    try {
      const res = await fetch('/api/zoon/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
          note: newNote,
          created_by: 'مدير النظام' // يمكن استبداله بـ User Session لاحقاً
        })
      });

      if (res.ok) {
        toast.success('تمت إضافة نسخة جديدة بنجاح');
        setIsAdding(false);
        setNewContent('');
        setNewNote('');
        fetchPrompts();
      } else {
        const data = await res.json();
        toast.error('فشل الحفظ: ' + data.error);
      }
    } catch (error) {
      toast.error('خطأ في الاتصال');
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
            <FiActivity className="text-indigo-600" />
            إدارة شخصية Zoon OS
          </h1>
          <p className="text-slate-500 text-sm mt-1">إدارة وإصدارات الـ System Prompt للوكيل الذكي</p>
        </div>

        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-200">
              <FiPlus /> إصدار نسخة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FiPlus className="text-indigo-600" />
                تحديث برومبت الوكيل
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 rtl">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">محتوى السيستم برومبت (System Prompt)</label>
                <Textarea 
                  placeholder="أكتب التعليمات الأساسية للوكيل هنا..."
                  className="min-h-[400px] font-mono text-sm leading-relaxed"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">ملاحظات الإصدار</label>
                <Input 
                  placeholder="مثال: إضافة مهارات تسويقية جديدة، تحسين لغة الرد..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsAdding(false)}>إلغاء</Button>
              <Button onClick={handleAddPrompt} className="bg-indigo-600 hover:bg-indigo-700">حفظ كمسودة</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 font-black">
              <TableRow>
                <TableHead className="text-right w-[80px]">النسخة</TableHead>
                <TableHead className="text-right">المحتوى</TableHead>
                <TableHead className="text-right">الملاحظات</TableHead>
                <TableHead className="text-right">بواسطة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-center">الإجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400">جاري التحميل...</TableCell>
                </TableRow>
              ) : prompts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400">لا توجد نسخ مسجلة حالياً</TableCell>
                </TableRow>
              ) : (
                prompts.map((p) => (
                  <TableRow key={p.id} className={p.is_active ? "bg-indigo-50/30" : ""}>
                    <TableCell className="font-bold text-indigo-700">V{p.version}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-slate-500 text-xs font-mono">
                      {p.content}
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">{p.note || '-'}</TableCell>
                    <TableCell className="text-slate-500 text-xs">
                       <span className="flex items-center gap-1"><FiUser size={10} /> {p.created_by || 'Unknown'}</span>
                    </TableCell>
                    <TableCell className="text-slate-400 text-[10px]">
                       <span className="flex items-center gap-1"><FiClock size={10} /> {new Date(p.created_at).toLocaleDateString('ar-EG')}</span>
                    </TableCell>
                    <TableCell>
                      {p.is_active ? (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1 px-2 py-0.5 shadow-sm shadow-emerald-100 uppercase text-[9px] font-black">
                         <FiCheck size={10} /> فعال الآن
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 border-slate-200 text-[9px]">غير فعال</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600">
                              <FiFileText size={16} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  <FiFileText className="text-indigo-600" /> مراجعة النسخة V{p.version}
                                </span>
                                {p.is_active && (
                                  <Badge className="bg-emerald-500">فعال ومستخدم الآن</Badge>
                                )}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-700 select-all">
                              {p.content}
                            </div>
                            <DialogFooter>
                               {!p.is_active && (
                                 <Button onClick={() => activatePrompt(p.id)} className="bg-indigo-600 hover:bg-indigo-700">تفعيل هذه النسخة فوراً</Button>
                               )}
                               <Button variant="outline" onClick={() => {}}>إغلاق</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {!p.is_active && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px] gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                            onClick={() => activatePrompt(p.id)}
                          >
                            تفعيل
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Advisory Card */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-4 items-start">
        <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
          <FiShield size={20} />
        </div>
        <div>
          <h4 className="text-sm font-black text-amber-900">تنبيه أمني هام</h4>
          <p className="text-xs text-amber-700 leading-relaxed mt-1">
            تغيير الـ System Prompt يؤثر فوراً على سلوك الوكيل في جميع الدردشات الجارية والعمليات الخلفية. 
            يرجى التأكد من أن التعليمات الجديدة لا تحتوي على ثغرات أمنية أو تناقضات برمجية قبل التفعيل.
          </p>
        </div>
      </div>
    </div>
  );
}
