'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchBazzzzTypes, createBazzzzType, updateBazzzzType, deleteBazzzzType } from '@/domains/zoon-club/store/zoonClubSlice';
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { FiPlus, FiEdit2, FiTrash2, FiZap, FiAward, FiSmile } from "react-icons/fi";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BazzzzType } from '@/domains/zoon-club/services/zoonClubService';
import { toast } from 'react-hot-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { FiInfo, FiActivity, FiUser, FiSettings, FiTarget, FiBookOpen, FiCpu, FiLayers, FiCheckCircle, FiList, FiEdit } from "react-icons/fi";

const bazzzzSchema = z.object({
  name_ar: z.string().min(2, 'الاسم مطلوب'),
  name_en: z.string().min(2, 'English name is required'),
  icon: z.string().min(1, 'الأيقونة مطلوبة'),
  points_given: z.number().int('يجب أن يكون رقماً صحيحاً'),
  psychological_impact: z.object({
    openness: z.number().default(0),
    conscientiousness: z.number().default(0),
    extraversion: z.number().default(0),
    agreeableness: z.number().default(0),
    neuroticism: z.number().default(0),
  }).optional(),
});

type BazzzzFormValues = z.infer<typeof bazzzzSchema>;

import { RootState } from '@/store';

export default function BazzzzManagerPage() {
  const dispatch = useAppDispatch();
  const { bazzzzTypes, loading } = useAppSelector((state: RootState) => state.zoonClub);
  const [isOpen, setIsOpen] = useState(false);
  const [editingType, setEditingType] = useState<BazzzzType | null>(null);

  const form = useForm<BazzzzFormValues>({
    resolver: zodResolver(bazzzzSchema),
    defaultValues: {
      name_ar: '',
      name_en: '',
      icon: '',
      points_given: 1,
      psychological_impact: {
        openness: 0,
        conscientiousness: 0,
        extraversion: 0,
        agreeableness: 0,
        neuroticism: 0,
      }
    }
  });

  useEffect(() => {
    dispatch(fetchBazzzzTypes());
  }, [dispatch]);

  const handleEdit = (type: BazzzzType) => {
    setEditingType(type);
    form.reset({
      name_ar: type.name_ar,
      name_en: type.name_en,
      icon: type.icon,
      points_given: type.points_given,
      psychological_impact: {
        openness: type.psychological_impact?.openness ?? 0,
        conscientiousness: type.psychological_impact?.conscientiousness ?? 0,
        extraversion: type.psychological_impact?.extraversion ?? 0,
        agreeableness: type.psychological_impact?.agreeableness ?? 0,
        neuroticism: type.psychological_impact?.neuroticism ?? 0,
      }
    });
    setIsOpen(true);
  };

  const handleAddNew = () => {
    setEditingType(null);
    form.reset({
      name_ar: '',
      name_en: '',
      icon: '',
      points_given: 1,
      psychological_impact: {
        openness: 0,
        conscientiousness: 0,
        extraversion: 0,
        agreeableness: 0,
        neuroticism: 0,
      }
    });
    setIsOpen(true);
  };

  const onSubmit = async (values: BazzzzFormValues) => {
    try {
      if (editingType) {
        await dispatch(updateBazzzzType({ id: editingType.id, updates: values })).unwrap();
        toast.success('تم تحديث النوع بنجاح');
      } else {
        await dispatch(createBazzzzType(values)).unwrap();
        toast.success('تم إضافة نوع جديد');
      }
      setIsOpen(false);
    } catch (err) {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا النوع؟ سيؤثر ذلك على التفاعلات القديمة.')) {
      try {
        await dispatch(deleteBazzzzType(id)).unwrap();
        toast.success('تم الحذف بنجاح');
      } catch (err) {
        toast.error('فشل الحذف');
      }
    }
  };

  return (
    <DashboardLayout title="إدارة أنواع الـ Bazzzz - نادي زوون">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">مكتبة التفاعلات (Bazzzz)</h1>
            <p className="text-gray-500">التحكم في أنواع الـ Bazzzz، النقاط، والتأثيرات النفسية (نظام 2026)</p>
          </div>
          <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <FiPlus /> إضافة نوع جديد
          </Button>
        </div>

        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
            <TabsTrigger value="grid" className="gap-2">
              <FiActivity className="w-4 h-4" /> أنواع التفاعلات
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-2">
              <FiInfo className="w-4 h-4" /> دليل النظام
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bazzzzTypes.map((type) => (
                <TooltipProvider key={type.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="relative overflow-hidden group border-2 hover:border-blue-400 transition-all cursor-default">
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(type);
                          }}>
                            <FiEdit2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(type.id);
                          }}>
                            <FiTrash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <CardHeader className="pb-2">
                          <div className="text-5xl mb-2">{type.icon}</div>
                          <CardTitle>{type.name_ar}</CardTitle>
                          <CardDescription className="uppercase text-[10px] font-mono">{type.name_en}</CardDescription>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <span className="text-sm text-blue-700 font-medium">النقاط الممنوحة:</span>
                            <span className="text-xl font-bold text-blue-800 flex items-center gap-1">
                              <FiAward className="w-4 h-4" /> {type.points_given}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">التأثير النفسي (2026 Engine)</span>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(type.psychological_impact || {}).map(([key, val]) => (
                                <div key={key} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded border">
                                  <span className="text-gray-500 capitalize">{key}:</span>
                                  <span className={`font-bold ${Number(val) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                    {Number(val) > 0 ? `+${val}` : (val as any)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px] text-center">
                      <p>بطاقة تفاعل <strong>{type.name_ar}</strong>: هذا النوع يمنح {type.points_given} نقطة ويؤثر على السمات النفسية للعضو حسب توزيع المحرك.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="info">
            <Card className="border-blue-100 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <FiInfo className="w-5 h-5" /> دليل نظام التفاعلات (Bazzzz)
                </CardTitle>
                <CardDescription>نظام متطور لتحليل السلوك وتوزيع المكافآت لعام 2026</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2">
                      <FiAward className="w-5 h-5" /> آلية النقاط
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      كل نوع من أنواع الـ Bazzzz يمثل فعلاً يقوم به المستخدم. عند تنفيذ التفاعل، يتم منح نقاط فورية للمستخدم تساهم في رفع ترتيبه داخل النادي وفتح مميزات جديدة.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2">
                      <FiZap className="w-5 h-5" /> المحرك النفسي (2026 Engine)
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      لا تقتصر التفاعلات على النقاط فقط، بل لكل نوع بصمة نفسية تؤثر على السمات الخمس الكبرى للعضو، مما يسمح للنظام بفهم شخصية المستخدم وتوجيه المحتوى والخدمات له بدقة فائقة.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border-2 border-blue-100 space-y-4">
                  <h3 className="font-bold text-blue-900 flex items-center gap-2">
                    <FiUser className="w-5 h-5" /> شرح سمات الشخصية المتأثرة:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="font-bold block text-blue-700">Openness (الانفتاح)</span>
                      <span className="text-[11px] text-gray-500">مدى ميل المستخدم للاستكشاف والأفكار الجديدة والابتكار.</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="font-bold block text-blue-700">Conscientiousness (اليقظة)</span>
                      <span className="text-[11px] text-gray-500">مستوى الانضباط، التنظيم، والاجتهاد في إتمام المهام.</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="font-bold block text-blue-700">Extraversion (الانبساط)</span>
                      <span className="text-[11px] text-gray-500">الحيوية، والتفاعل الاجتماعي مع أعضاء النادي الآخرين.</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="font-bold block text-blue-700">Agreeableness (الوفاق)</span>
                      <span className="text-[11px] text-gray-500">مدى اللطف، التعاون، والروح الإيجابية مع الوسط المحيط.</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="font-bold block text-blue-700">Neuroticism (العصابية)</span>
                      <span className="text-[11px] text-gray-500">التوازن العاطفي والقدرة على التعامل مع الضغوط والمواقف.</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 p-5 bg-white rounded-xl border-2 border-indigo-100">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                      <FiCpu className="w-5 h-5 text-indigo-600" /> أثر السلوك على التصنيف النفسي
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      عندما يختار العميل تفاعلاً معياً (Bazzzz)، فإنه يرسل "إشارة سلوكية" لا إرادية. المحرك يقوم بدمج هذه الإشارات لبناء <strong>الملف النفسي الرقمي</strong>. 
                      مثلاً، العميل الذي يكثر من استخدام تفاعلات ذات وزن عالٍ في "Openness" يتم تصنيفه كشخصية "مبتكرة/مستكشفة"، مما يغير نوعية التحديات والعروض التي تظهر له في واجهة التطبيق.
                    </p>
                  </div>

                  <div className="space-y-4 p-5 bg-white rounded-xl border-2 border-emerald-100">
                    <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                      <FiTarget className="w-5 h-5 text-emerald-600" /> تخصيص المحتوى الذكي
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      تصنيف العميل ليس مجرد ملصق، بل هو <strong>دينامو حركي</strong>. النظام يعيد ترتيب الأقسام، واختيار نبرة الخطاب (Tone of Voice)، وحتى لون الواجهات أحياناً بناءً على التصنيف الغالب. 
                      التفاعل بالـ Bazzzz هو المفتاح الذي يحدد هل العميل يحتاج إلى محتوى "محفز وتنافسي" أم محتوى "هادئ ومنظم".
                    </p>
                  </div>
                </div>

                <div className="space-y-4 p-6 bg-blue-900 text-white rounded-2xl shadow-lg border-b-4 border-blue-700">
                  <h3 className="font-bold text-xl flex items-center gap-2 text-blue-300">
                    <FiLayers className="w-6 h-6" /> رؤية النظام وخوارزمية توزيع التأثير النفسي
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm opacity-95">
                    <div className="space-y-3">
                      <h4 className="font-bold text-blue-200 border-b border-blue-800 pb-1">كيف يقيس النظام هذه القيم؟</h4>
                      <p className="leading-relaxed">
                        النظام لا يتعامل مع القيم كأرقام جامدة، بل كـ <strong>"أثقال ترجيحية"</strong> في نموذج تراكمي. 
                        عند كل تفاعل، يتم إضافة القيمة المحددة إلى رصيد العضو في تلك السمة، ثم يتم <strong>تطبيع البيانات (Normalization)</strong> لإنتاج نسبة مئوية تعكس شخصية العضو مقارنة بمتوسط المجتمع.
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-blue-100">
                        <li>القيم المنخفضة (1-3): تغير التصنيف ببطء (ثبات عالي).</li>
                        <li>القيم المتوسطة (5-8): تعبر عن سلوك واضح ومميز.</li>
                        <li>القيم العالية (10+): قادرة على تغيير تصنيف العميل فوراً.</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-bold text-blue-200 border-b border-blue-800 pb-1">ببساطة.. كيف تختار الأرقام الصحيحة؟ (دليل الموظف)</h4>
                      <p className="leading-relaxed text-[13px]">
                        فكر في الأرقام كأنها "بصمة" تتركها في ملف العميل الشخصي:
                      </p>
                      <div className="bg-blue-800/40 p-4 rounded-xl border border-blue-700 space-y-3 shadow-inner">
                        <div className="flex items-start gap-2">
                          <div className="bg-blue-400 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">1</div>
                          <p><span className="text-blue-300 font-bold">لو وضعت رقم كبير (10 فأكثر):</span> سيعتبر النظام هذا العميل "خبيراً" أو "قائداً" في هذه الصفة فوراً ومن أول مرة. (استخدمها للأفعال النادرة والمبهرة فقط).</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="bg-blue-400 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">2</div>
                          <p><span className="text-blue-300 font-bold">لو وضعت رقم صغير (1 إلى 4):</span> أنت تبني شخصية العميل "بهدوء"؛ سيحتاج لتكرار الفعل عدة مرات لكي يقتنع النظام أن هذه هي صفته الحقيقية. (مثالية للتفاعلات اليومية العادية).</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="bg-blue-400 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">3</div>
                          <p><span className="text-blue-300 font-bold">لو وضعت صفر (0):</span> كأنك تقول للنظام "تجاهل هذه الصفة تماماً في هذا التفاعل". هذا يحمي ملف العميل من التشتت والنتائج العشوائية.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="bg-blue-400 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">4</div>
                          <p><span className="text-blue-300 font-bold">نصيحة ذهبية:</span> اجعل رقم (5) هو مقياسك الثابت. اسأل نفسك: هل هذا الفعل أقوى من المعتاد؟ ضع (7-8). هل هو بسيط؟ ضع (2-3).</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm opacity-90">
                    <div className="space-y-2">
                      <h4 className="font-bold text-blue-300 underline decoration-blue-500/30">ضبط التوازن المجتمعي</h4>
                      <p>تستطيع الإدارة رفع أوزان "الوفاق" (Agreeableness) في التفاعلات الشائعة لتشجيع بيئة إيجابية داخل النادي بشكل غير مباشر (Nudging).</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-blue-300 underline decoration-blue-500/30">قياس نبض النادي</h4>
                      <p>من خلال مراقبة أي أنواع Bazzzz يتم استخدامها أكثر، تفهم الإدارة الحالة النفسية العامة للمجتمع (مثلاً: هل هناك توتر عام؟ هل هناك روح إبداعية؟).</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-blue-300 underline decoration-blue-500/30">توجيه السلوك المستقبلي</h4>
                      <p>التحكم في الأوزان هو "عصا المايسترو"؛ توجيه العملاء نحو قيم معينة تخدم أهداف الاستدامة أو التفاعل المجتمعي التي يتبناها التطبيق.</p>
                    </div>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 p-5 border-2 border-slate-200 rounded-xl bg-white">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <FiList className="w-5 h-5 text-blue-600" /> أمثلة عملية للإعدادات
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                        <strong>1. تفاعل "فكرة عبقرية":</strong> نقاط عالية (20)، تأثير +10 على <span className="text-blue-700">Openness</span>. يستخدم للمستخدمين الذين يشاركون حلولاً إبداعية.
                      </div>
                      <div className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                        <strong>2. تفاعل "دقة متناهية":</strong> نقاط (10)، تأثير +10 على <span className="text-green-700">Conscientiousness</span>. يستخدم عند التزام المستخدم بمواعيد التسليم بدقة.
                      </div>
                      <div className="p-2 bg-purple-50 rounded border-l-4 border-purple-500">
                        <strong>3. تفاعل "نجم الاجتماع":</strong> نقاط (15)، تأثير +5 على <span className="text-purple-700">Extraversion</span> و +5 على <span className="text-purple-700">Agreeableness</span>.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-5 border-2 border-slate-200 rounded-xl bg-white">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <FiCheckCircle className="w-5 h-5 text-green-600" /> دليل الإعداد خطوة بخطوة
                    </h3>
                    <ol className="space-y-2 text-xs text-gray-600 list-decimal list-inside">
                      <li>اضغط على زر <strong>"إضافة نوع جديد"</strong> بالأعلى.</li>
                      <li>اختر <strong>أيقونة (Emoji)</strong> تعبر بصرياً عن طبيعة التفاعل (مثلاً: 🚀 للانطلاق، 🤝 للمساعدة).</li>
                      <li>حدد <strong>النقاط الممنوحة</strong>: تعبر عن الأهمية المادية للتفاعل في نظام المكافآت.</li>
                      <li><strong>توزيع التأثير النفسي</strong>: هذه هي الأداة الأهم. حدد كيف سيغير هذا التفاعل "رؤية النظام" لشخصية المستخدم.</li>
                      <li>اضغط <strong>"حفظ النوع"</strong> لتبدأ آلة التحليل في رصد هذا التفاعل فوراً.</li>
                    </ol>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-xs">
                  <FiSettings className="w-5 h-5 flex-shrink-0" />
                  <p><strong>ملاحظة للمسؤول:</strong> تغيير هذه القيم سيؤثر فوراً على كيفية حساب نقاط وتوازن شخصيات الأعضاء في جميع التفاعلات المستقبلية.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FiEdit className="text-blue-600" /> {editingType ? 'تعديل نوع Bazzzz' : 'إضافة نوع جديد'}
              </DialogTitle>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  <strong>دليل العمل السريع:</strong> ابدأ بتحديد الاسم والأيقونة، ثم استخدم <strong>"محاكي التأثير"</strong> بالأسفل لضبط الأوزان النفسية. تذكر أن مجموع الأوزان يحدد "قوة" هذا التفاعل في تغيير شخصية العميل.
                </p>
              </div>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name_ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم بالعربية</FormLabel>
                        <FormControl><Input placeholder="مثال: إبداع" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>English Name</FormLabel>
                        <FormControl><Input placeholder="e.g. Creative" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الأيقونة (Emoji)</FormLabel>
                        <FormControl><Input placeholder="🎨" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="points_given"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>النقاط</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-blue-500/20"></div>
                  <FormLabel className="flex items-center gap-2 text-blue-600 font-bold">
                    <FiZap className="w-4 h-4" /> توزيع التأثير النفسي (Psychological Impact)
                  </FormLabel>
                  
                  <TooltipProvider>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'openness', label: 'Openness', desc: '1-4: فضول بسيط، 5-9: مستكشف نشط، 10+: مبتكر جذري' },
                        { id: 'conscientiousness', label: 'Conscientiousness', desc: '1-4: منظم، 5-9: مجتهد جداً، 10+: منضبط بشكل فائق' },
                        { id: 'extraversion', label: 'Extraversion', desc: '1-4: ودود، 5-9: اجتماعي بارز، 10+: قائد محرك للمجموعات' },
                        { id: 'agreeableness', label: 'Agreeableness', desc: '1-4: متعاون، 5-9: مصلح إيجابي، 10+: رمز للوفاق واللطف' },
                        { id: 'neuroticism', label: 'Neuroticism', desc: '1-4: هدوء، 5-9: اتزان نفسي عالي، 10+: صخرة صمود عاطفي' },
                      ].map((trait) => (
                        <FormField
                          key={trait.id}
                          control={form.control}
                          name={`psychological_impact.${trait.id}` as any}
                          render={({ field }) => (
                            <FormItem>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-help">
                                    <FormLabel className="text-[10px] capitalize text-gray-500 flex items-center justify-between">
                                      {trait.label}
                                      <FiInfo className="w-3 h-3 text-blue-400" />
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        className="h-8 text-sm focus:border-blue-400 focus:ring-blue-400" 
                                        {...field} 
                                        value={field.value ?? 0}
                                        onChange={e => field.onChange(Number(e.target.value) || 0)} 
                                      />
                                    </FormControl>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p className="text-[10px]">{trait.desc}</p>
                                </TooltipContent>
                              </Tooltip>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </TooltipProvider>

                  {/* Real-time Impact Simulator */}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">مقياس قوة التأثير (Simulator)</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-mono">
                        Total Power: {Object.values(form.watch('psychological_impact') || {}).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      {Object.entries(form.watch('psychological_impact') || {}).map(([key, val], idx) => {
                        const total = Object.values(form.watch('psychological_impact') || {}).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
                        const width = total > 0 ? (Number(val) / total) * 100 : 0;
                        const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];
                        return (
                          <div 
                            key={key} 
                            style={{ width: `${width}%` }} 
                            className={`${colors[idx % colors.length]} h-full transition-all duration-500`}
                          />
                        );
                      })}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                       {Object.entries(form.watch('psychological_impact') || {}).filter(([_, v]) => Number(v) > 0).map(([k, v], idx) => (
                         <div key={k} className="flex items-center gap-1 text-[9px] font-bold">
                           <div className={`w-1.5 h-1.5 rounded-full ${['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'][idx % 5]}`}></div>
                           <span className="text-slate-600 capitalize">{k}: {v}</span>
                         </div>
                       ))}
                    </div>
                    <div className="mt-3 p-2 bg-indigo-50 rounded border border-indigo-100 text-[10px] text-indigo-700 italic">
                      {(() => {
                        const values = form.watch('psychological_impact') || {};
                        const maxTrait = Object.entries(values).reduce((a, b) => (Number(b[1]) > Number(a[1]) ? b : a), ['', 0]);
                        if (Number(maxTrait[1]) > 0) {
                          return `هذا الإعداد سيجعل النظام يرى العميل كشخصية يغلب عليها ميزة "${maxTrait[0]}" بقوة تأثير ${maxTrait[1]}.`;
                        }
                        return "أدخل قيماً في الحقول أعلاه لبدء المحاكاة...";
                      })()}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>إلغاء</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">حفظ النوع</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
