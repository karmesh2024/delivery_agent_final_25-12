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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { FiPlus, FiArrowRight, FiCodesandbox, FiSettings, FiGlobe, FiDatabase, FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface AISkill {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  webhook_url: string | null;
  input_schema: any;
  is_active: boolean;
}

export default function ZoonSkillsPage() {
  const [skills, setSkills] = useState<AISkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    type: 'webhook',
    webhook_url: '',
    input_schema: '{\n  "type": "object",\n  "properties": {\n    "query": { "type": "string" }\n  }\n}'
  });

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/zoon/skills');
      const data = await res.json();
      setSkills(data);
    } catch (error) {
      toast.error('فشل جلب المهارات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleAddSkill = async () => {
    try {
      let schema = {};
      try {
        schema = JSON.parse(formData.input_schema);
      } catch (e) {
        toast.error('خطأ في صيغة JSON Schema');
        return;
      }

      const res = await fetch('/api/zoon/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          input_schema: schema
        })
      });

      if (res.ok) {
        toast.success('تمت إضافة المهارة بنجاح');
        setIsAdding(false);
        fetchSkills();
      }
    } catch (error) {
      toast.error('خطأ في الحفظ');
    }
  };

  const toggleSkillStatus = async (skill: AISkill) => {
    try {
      const res = await fetch(`/api/zoon/skills/${skill.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...skill, is_active: !skill.is_active })
      });
      if (res.ok) {
        toast.success(`تم ${!skill.is_active ? 'تفعيل' : 'إلغاء تفعيل'} المهارة`);
        fetchSkills();
      }
    } catch (error) {
      toast.error('خطأ في التحديث');
    }
  };

  const deleteSkill = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المهارة؟')) return;
    try {
      const res = await fetch(`/api/zoon/skills/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف المهارة');
        fetchSkills();
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
            <FiCodesandbox className="text-blue-600" />
            مكتبة مهارات Zoon Agent
          </h1>
          <p className="text-slate-500 text-sm mt-1">إدارة أدوات الربح والتحليل والتحكم المتاحة للذكاء الاصطناعي</p>
        </div>

        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-200">
              <FiPlus /> إضافة مهارة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FiPlus className="text-blue-600" /> مهارة جديدة
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 rtl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-right">
                  <label className="text-xs font-bold text-slate-500">اسم المهارة (بالإنجليزية)</label>
                  <Input 
                    placeholder="search_orders" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2 text-right">
                  <label className="text-xs font-bold text-slate-500">نوع المهارة</label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData({...formData, type: v})}
                  >
                    <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webhook">Webhook خارجي</SelectItem>
                      <SelectItem value="internal">Internal API (داخلي)</SelectItem>
                      <SelectItem value="hitl">Human in the Loop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2 text-right">
                <label className="text-xs font-bold text-slate-500">وصف المهارة (للذكاء الاصطناعي)</label>
                <Textarea 
                  placeholder="تستخدم هذه المهارة لجلب..." 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-2 text-right">
                <label className="text-xs font-bold text-slate-500">رابط الـ Webhook</label>
                <Input 
                  placeholder="https://api.system.com/..." 
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({...formData, webhook_url: e.target.value})}
                  dir="ltr"
                />
              </div>

              <div className="space-y-2 text-right">
                <label className="text-xs font-bold text-slate-500">JSON Schema للمدخلات</label>
                <Textarea 
                  placeholder="{ ... }"
                  className="font-mono text-xs h-32"
                  value={formData.input_schema}
                  onChange={(e) => setFormData({...formData, input_schema: e.target.value})}
                  dir="ltr"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsAdding(false)}>إلغاء</Button>
              <Button onClick={handleAddSkill} className="bg-blue-600 hover:bg-blue-700">حفظ المهارة</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Skills Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 font-black">
            <TableRow>
              <TableHead className="text-right">المهارة</TableHead>
              <TableHead className="text-right">النوع</TableHead>
              <TableHead className="text-right">رابط الاستدعاء</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-center">الأدوات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10">جاري التحميل...</TableCell></TableRow>
            ) : skills.map(skill => (
              <TableRow key={skill.id} className={!skill.is_active ? "opacity-50" : ""}>
                <TableCell>
                  <div>
                    <div className="font-bold text-slate-900">{skill.name}</div>
                    <div className="text-[10px] text-slate-500 max-w-[200px] truncate">{skill.description}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1 px-2">
                    {skill.type === 'webhook' ? <FiGlobe size={10} /> : <FiDatabase size={10} />}
                    {skill.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-400 font-mono truncate max-w-[150px]" dir="ltr">
                  {skill.webhook_url || 'Internal'}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleSkillStatus(skill)}
                    className={skill.is_active ? "text-emerald-600" : "text-slate-400"}
                  >
                    {skill.is_active ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-400 hover:text-red-600"
                    onClick={() => deleteSkill(skill.id)}
                  >
                    <FiTrash2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      
      {/* Footer Info */}
      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-3">
        <FiSettings className="text-blue-600" />
        <p className="text-xs text-blue-700">
           يتم جلب هذه المهارات "على الهواء" (Dynamic Loading) عند كل استفسار للوكيل. أي مهارة يتم تفعيلها هنا ستظهر له في صندوق الأدوات فوراً.
        </p>
      </div>
    </div>
  );
}
