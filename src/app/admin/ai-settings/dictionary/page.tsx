'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { advancedPsychologicalEngine } from '@/domains/zoon-club/services/zoonAdvancedPsychologicalEngine.service';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { 
  FiPlus, 
  FiTrash2, 
  FiBookOpen, 
  FiTrendingUp, 
  FiSearch,
  FiFilter,
  FiArrowRight
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const TRAITS = [
  { value: 'openness', label: 'الانفتاح (Openness)', color: 'bg-purple-100 text-purple-700' },
  { value: 'conscientiousness', label: 'الضمير (Conscientiousness)', color: 'bg-blue-100 text-blue-700' },
  { value: 'extraversion', label: 'الانبساط (Extraversion)', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'agreeableness', label: 'الوفاق (Agreeableness)', color: 'bg-green-100 text-green-700' },
  { value: 'neuroticism', label: 'الاستقرار (Stability/Inverted)', color: 'bg-rose-100 text-rose-700' },
];

const CATEGORIES = ['general', 'social', 'technical', 'leadership', 'emotional', 'creative'];

export default function PsychologicalDictionaryPage() {
  const [dictionary, setDictionary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // New Keyword State
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedTrait, setSelectedTrait] = useState('agreeableness');
  const [weight, setWeight] = useState('1.0');
  const [category, setCategory] = useState('general');

  useEffect(() => {
    fetchDictionary();
  }, []);

  const fetchDictionary = async () => {
    try {
      const data = await advancedPsychologicalEngine.getDictionary();
      setDictionary(data);
    } catch (error) {
      toast.error('خطأ في جلب القاموس');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    try {
      await advancedPsychologicalEngine.addKeyword(
        newKeyword.trim(),
        selectedTrait,
        parseFloat(weight),
        category
      );
      toast.success('تمت إضافة الكلمة بنجاح');
      setNewKeyword('');
      fetchDictionary();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('هذه الكلمة موجودة بالفعل في القاموس');
      } else {
        toast.error('حدث خطأ أثناء الإضافة');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الكلمة؟')) return;
    try {
      await advancedPsychologicalEngine.deleteKeyword(id);
      toast.success('تم حذف الكلمة');
      setDictionary(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const filtered = dictionary.filter(item => 
    item.keyword.toLowerCase().includes(search.toLowerCase()) ||
    item.trait.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/admin/ai-settings">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-indigo-600">
              <FiArrowRight className="rtl:rotate-180" /> العودة لإعدادات المحرك
            </Button>
          </Link>
        </div>
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center gap-4 bg-indigo-50 border-indigo-100">
            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg">
              <FiBookOpen size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-600">إجمالي الكلمات</p>
              <h3 className="text-2xl font-black">{dictionary.length} كلمة</h3>
            </div>
          </Card>
          
          <Card className="p-4 flex items-center gap-4 bg-emerald-50 border-emerald-100">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg">
              <FiTrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-600">دقة التحليل</p>
              <h3 className="text-2xl font-black">مرتفع (Advanced)</h3>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
            <p className="text-xs opacity-70 mb-1">توضيح</p>
            <p className="text-[11px] leading-relaxed">
              هذه الكلمات يستخدمها المحرك لتحليل تعليقات المستخدمين في الوقت الفعلي وتحديث ملفاتهم النفسية.
            </p>
          </Card>
        </div>

        {/* Add Section */}
        <Card className="p-6 border-slate-200 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FiPlus className="text-indigo-600" /> إضافة كلمة مفتاحية جديدة
          </h2>
          
          <form onSubmit={handleAddWord} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 mr-1">الكلمة</label>
              <Input 
                placeholder="أدخل الكلمة (مثلاً: رائع)" 
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="bg-slate-50 border-slate-200 focus:ring-indigo-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 mr-1">السمة المرتبطة</label>
              <Select value={selectedTrait} onValueChange={setSelectedTrait}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRAITS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 mr-1">القوة (Weight)</label>
              <Input 
                type="number" 
                step="0.1" 
                min="0.1" 
                max="5.0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="bg-slate-50 border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 mr-1">التصنيف</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-slate-50 border-slate-200 uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="uppercase">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 w-full md:w-auto shadow-md">
              إضافة للقاموس
            </Button>
          </form>
        </Card>

        {/* Dictionary Table */}
        <Card className="p-0 overflow-hidden shadow-sm border-slate-200">
          <div className="p-4 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="relative w-full md:w-72">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  placeholder="بحث في القاموس..." 
                  className="pl-10 bg-white border-slate-200 text-sm h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             <div className="flex gap-2">
               <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-bold">
                 <FiFilter /> تصفية
               </Button>
             </div>
          </div>
          
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-right font-black">الكلمة</TableHead>
                <TableHead className="text-center font-black">السمة النفسية</TableHead>
                <TableHead className="text-center font-black">الوزن التنسيبي</TableHead>
                <TableHead className="text-center font-black">التصنيف</TableHead>
                <TableHead className="text-left font-black">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filtered.map((item) => {
                  const traitInfo = TRAITS.find(t => t.value === item.trait);
                  return (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <TableCell className="font-bold text-slate-800">{item.keyword}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={`${traitInfo?.color} border-none font-bold text-[10px]`}>
                          {traitInfo?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-slate-600">
                        x{parseFloat(item.weight).toFixed(1)}
                      </TableCell>
                      <TableCell className="text-center">
                         <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full uppercase font-bold text-slate-500">
                            {item.category}
                         </span>
                      </TableCell>
                      <TableCell className="text-left">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(item.id)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-full h-8 w-8 p-0"
                        >
                          <FiTrash2 size={16} />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
          
          {filtered.length === 0 && (
            <div className="py-20 text-center text-slate-400 font-medium">
              لم يتم العثور على كلمات مطابقة للبحث
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
