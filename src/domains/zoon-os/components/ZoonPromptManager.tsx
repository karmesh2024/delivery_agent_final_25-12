'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Textarea } from '@/shared/components/ui/textarea';
import { Input } from '@/shared/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/shared/components/ui/dialog';
import { FiPlus, FiCheck, FiFileText, FiClock, FiUser, FiActivity, FiShield, FiTrash2 } from 'react-icons/fi';
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

export default function ZoonPromptManager() {
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
      if (res.ok && Array.isArray(data)) {
        setPrompts(data);
      } else if (!res.ok) {
        toast.error('فشل جلب البيانات: ' + (data.error || 'خطأ غير معروف'));
      } else {
        console.error('Expected prompts array but got:', data);
        setPrompts([]);
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
  
  // حذف نسخة
  const deletePrompt = async (id: string) => {
    if (!window.confirm('بعد الحذف، لن تتمكن من استعادة هذه النسخة. هل أنت متأكد؟')) {
      return;
    }

    try {
      const res = await fetch(`/api/zoon/prompts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('تم حذف النسخة بنجاح');
        fetchPrompts();
      } else {
        toast.error('فشل الحذف: ' + data.error);
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
          created_by: 'مدير النظام'
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
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <FiActivity className="text-indigo-600" />
            إدارة شخصية Zoon OS
          </h3>
          <p className="text-slate-500 text-xs mt-1">إدارة وإصدارات الـ System Prompt للوكيل الذكي</p>
        </div>

        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-200">
              <FiPlus /> إصدار نسخة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FiPlus className="text-indigo-600" />
                تحديث برومبت الوكيل
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-right">
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
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
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
                        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white" dir="rtl">
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

                      {!p.is_active && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                          onClick={() => deletePrompt(p.id)}
                        >
                          <FiTrash2 size={16} />
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
