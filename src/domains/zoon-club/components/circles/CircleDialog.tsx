import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/shared/components/ui/form';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoonCircle, ZoonCircleCategory } from '../../services/zoonCirclesService';
import { FiInfo, FiZap, FiDribbble, FiTarget, FiShield, FiHeart, FiUsers, FiPlus, FiTrash2, FiArrowUp, FiArrowDown } from 'react-icons/fi';

const circleSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  type: z.string().min(1, 'يرجى اختيار نوع الدائرة'),
  color: z.string(),
  icon: z.string(),
  description: z.string().optional(),
  
  // Smart Design Fields (صبحت مصفوفات لدعم الترتيب)
  constitution: z.array(z.string()).optional(),
  essence: z.array(z.string()).optional(),
  compass: z.array(z.string()).optional(),
  soul_filter: z.array(z.string()).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'MIXED']),
});

type CircleFormValues = z.infer<typeof circleSchema>;

interface CircleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Partial<ZoonCircle>) => void;
  circle?: ZoonCircle | null;
  categories: ZoonCircleCategory[];
  onManageCategories?: () => void;
}

const COLORS = [
  { name: 'أزرق', value: '#3b82f6' },
  { name: 'بنفسجي', value: '#8b5cf6' },
  { name: 'أخضر', value: '#10b981' },
  { name: 'أصفر', value: '#f59e0b' },
  { name: 'برتقالي', value: '#f97316' },
  { name: 'أحمر', value: '#ef4444' },
  { name: 'وردي', value: '#ec4899' },
  { name: 'زمردي', value: '#059669' },
  { name: 'نيلي', value: '#6366f1' },
];

const ICONS = ['👤', '💼', '👥', '🎯', '🏠', '🎓', '❤️', '🌟', '🚀', '🎨', '🧩', '🧘', '🌍', '🛠️', '📣'];

export const CircleDialog: React.FC<CircleDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  circle,
  categories,
  onManageCategories,
}) => {
  // وظيفة مساعدة لتحويل النص المخزن إلى مصفوفة نظيفة
  const parseSmartField = (value: any) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      return value.split('\n').map(item => item.trim()).filter(Boolean);
    }
    return [];
  };

  const form = useForm<CircleFormValues>({
    resolver: zodResolver(circleSchema),
    defaultValues: {
      name: circle?.name || '',
      type: circle?.type || '',
      color: circle?.color || '#3b82f6',
      icon: circle?.icon || '⭕',
      description: circle?.description || '',
      constitution: parseSmartField(circle?.constitution),
      essence: parseSmartField(circle?.essence),
      compass: parseSmartField(circle?.compass),
      soul_filter: parseSmartField(circle?.soul_filter),
      visibility: circle?.visibility || 'PRIVATE',
    },
  });
  
  // تحديث البيانات عند فتح النافذة أو تغيير الدائرة
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: circle?.name || '',
        type: circle?.type || '',
        color: circle?.color || '#3b82f6',
        icon: circle?.icon || '⭕',
        description: circle?.description || '',
        constitution: parseSmartField(circle?.constitution),
        essence: parseSmartField(circle?.essence),
        compass: parseSmartField(circle?.compass),
        soul_filter: parseSmartField(circle?.soul_filter),
        visibility: circle?.visibility || 'PRIVATE',
      });
    }
  }, [circle, open, form]);

  const handleFormSubmit = (values: CircleFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  const SmartLabel = ({ label, tooltip, icon }: { label: string, tooltip: string, icon?: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="font-bold text-slate-300">{label}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger type="button" className="text-slate-500 hover:text-blue-400 transition-colors">
            <FiInfo className="w-4 h-4" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs bg-slate-900 text-white border-white/10 p-3 shadow-xl">
            <p className="text-xs leading-relaxed">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  const SmartListInput = ({ 
    label, 
    tooltip, 
    icon, 
    fieldName 
  }: { 
    label: string, 
    tooltip: string, 
    icon: React.ReactNode, 
    fieldName: keyof CircleFormValues 
  }) => {
    const list = form.watch(fieldName) as string[] || [];
    const [inputValue, setInputValue] = React.useState('');

    const addItem = () => {
      if (inputValue.trim()) {
        form.setValue(fieldName, [...list, inputValue.trim()] as any);
        setInputValue('');
      }
    };

    const removeItem = (index: number) => {
      const newList = [...list];
      newList.splice(index, 1);
      form.setValue(fieldName, newList as any);
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === list.length - 1) return;
      
      const newList = [...list];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
      form.setValue(fieldName, newList as any);
    };

    return (
      <div className="space-y-3">
        <SmartLabel label={label} tooltip={tooltip} icon={icon} />
        
        <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
          {/* List Items */}
          <div className="max-h-48 overflow-y-auto p-2 space-y-2 custom-scrollbar min-h-[60px]">
            {list.length === 0 && (
              <div className="text-center py-4 text-slate-500 text-[10px] italic">لم يتم إضافة ركائز بعد...</div>
            )}
            <AnimatePresence initial={false}>
              {list.map((item, index) => (
                <motion.div 
                  key={`${item}-${index}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5 group"
                >
                  <div className="flex flex-col gap-0.5">
                    <button 
                      type="button"
                      onClick={() => moveItem(index, 'up')}
                      className={`p-0.5 text-slate-500 hover:text-blue-400 transition-colors ${index === 0 ? 'invisible' : ''}`}
                    >
                      <FiArrowUp className="w-3 h-3" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => moveItem(index, 'down')}
                      className={`p-0.5 text-slate-500 hover:text-blue-400 transition-colors ${index === list.length - 1 ? 'invisible' : ''}`}
                    >
                      <FiArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="flex-1 text-xs text-slate-300 font-medium">{item}</span>
                  <button 
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-1.5 text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="p-2 bg-white/5 border-t border-white/5 flex gap-2">
            <Input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addItem(); } }}
              placeholder={`أضف ركيزة للـ ${label.split(' ')[0]}...`}
              className="h-9 text-xs rounded-lg border-white/10 bg-slate-900/50 text-white placeholder:text-slate-600 focus:ring-blue-500/20"
            />
            <button 
              type="button" 
              onClick={addItem}
              className="h-9 w-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xl shadow-blue-600/20 shrink-0 transition-all hover:scale-105 active:scale-95"
            >
              <FiPlus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden bg-[#020617] border-white/10 shadow-2xl rounded-[32px] text-white">
        <DialogHeader className="p-8 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-b border-white/5">
          <DialogTitle className="text-2xl font-black flex items-center gap-4">
             <div className="bg-blue-600/20 p-2.5 rounded-2xl backdrop-blur-md">
                <FiZap className="w-7 h-7 text-blue-400" />
             </div>
             {circle ? 'تعديل أبعاد المدار' : 'برمجة مدار ذكي جديد'}
          </DialogTitle>
          <p className="text-slate-400 text-sm mt-1 font-medium italic opacity-80">صهر القيم والقواعد لبناء مجرة اجتماعية متماسكة.</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="w-full justify-start h-auto p-2 bg-slate-950/40 border-b border-white/5 gap-2">
                <TabsTrigger value="basic" className="px-8 py-2.5 rounded-xl text-slate-500 font-black data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">
                  المعالم الأساسية
                </TabsTrigger>
                <TabsTrigger value="smart" className="px-8 py-2.5 rounded-xl text-slate-500 font-black data-[state=active]:bg-white/10 data-[state=active]:text-white flex items-center gap-2 transition-all">
                  التصميم الذكي <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-xl shadow-blue-600/20">Pro</span>
                </TabsTrigger>
              </TabsList>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {/* Basic Content */}
                <TabsContent value="basic" className="space-y-8 mt-0 p-8">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">اسم الدائرة الكونية</FormLabel>
                        <FormControl>
                          <Input className="rounded-xl border-white/10 h-12 bg-white/5 text-white focus:ring-4 focus:ring-blue-500/20 placeholder:text-slate-600 font-bold transition-all" placeholder="مثلاً: بؤرة الإبداع، مجمع الشركاء..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">نوع المدار</FormLabel>
                          <div className="flex gap-2">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="rounded-xl border-white/10 h-12 flex-1 bg-white/5 text-white font-bold transition-all">
                                  <SelectValue placeholder="اختر التصنيف" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-2xl border-white/10 bg-[#0f172a] text-white shadow-2xl p-2">
                                {categories.length > 0 ? (
                                  categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name} className="rounded-xl py-3 cursor-pointer focus:bg-blue-600 transition-colors">
                                      <div className="flex items-center gap-3">
                                        <span className="text-xl">{cat.icon}</span>
                                        <span className="font-bold">{cat.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="p-4 text-center text-slate-500 text-sm">لا يوجد تصنيفات حالياً</div>
                                )}
                              </SelectContent>
                            </Select>
                            <button 
                              type="button" 
                              onClick={onManageCategories}
                              className="w-12 h-12 rounded-xl border border-white/10 text-slate-500 hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/10 transition-all shrink-0 flex items-center justify-center"
                              title="إدارة التصنيفات"
                            >
                              <FiPlus className="w-5 h-5" />
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">الرمز الجوهري</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl border-white/10 h-12 bg-white/5 text-white font-bold transition-all">
                                <SelectValue placeholder="اختر أيقونة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-2xl border-white/10 bg-[#0f172a] text-white shadow-2xl">
                              <div className="grid grid-cols-5 gap-1 p-3">
                                {ICONS.map(icon => (
                                  <SelectItem key={icon} value={icon} className="justify-center cursor-pointer hover:bg-blue-600/20 rounded-xl h-12 w-12 flex items-center transition-colors">
                                    <span className="text-2xl">{icon}</span>
                                  </SelectItem>
                                ))}
                              </div>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">البصمة اللونية</FormLabel>
                        <div className="flex flex-wrap gap-4 pt-1">
                          {COLORS.map(c => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => field.onChange(c.value)}
                              className={`w-10 h-10 rounded-full border-4 transition-all hover:scale-125 ${field.value === c.value ? 'scale-125 border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'border-white/5 opacity-40 hover:opacity-100'}`}
                              style={{ backgroundColor: c.value, boxShadow: field.value === c.value ? `0 0 25px ${c.value}aa` : 'none' }}
                              title={c.name}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">رسالة الدائرة (الوجدانية)</FormLabel>
                        <FormControl>
                          <Textarea className="rounded-xl border-white/10 min-h-[100px] resize-none bg-white/5 text-white font-medium transition-all focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-600" placeholder="اكتب الهدف السامي الذي تسعى هذه الدائرة لتحقيقه..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Smart Content */}
                <TabsContent value="smart" className="space-y-10 mt-0 p-8">
                  <div className="bg-blue-600/5 border border-blue-500/20 p-6 rounded-2xl flex items-start gap-5 mb-4">
                     <div className="bg-blue-600/20 p-3 rounded-2xl text-blue-400 shadow-xl shadow-blue-900/20">
                        <FiDribbble className="w-6 h-6 animate-spin-slow" />
                     </div>
                     <div>
                        <h4 className="text-blue-400 font-black text-sm underline decoration-blue-500/30 underline-offset-4 tracking-tight">نظام الهندسة الاجتماعية المتقدمة</h4>
                        <p className="text-slate-400 text-xs leading-relaxed mt-1.5 font-medium">قم بتعريف "دستور" الدائرة وقيمها. هذه الركائز تساعد تجربة الزوون في جلب الأشخاص الأكثر توافقاً مع رؤيتك.</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SmartListInput 
                      fieldName="constitution"
                      icon={<FiShield className="text-indigo-500" />}
                      label="دستور التقارب (السياسات)" 
                      tooltip="القواعد غير المكتوبة التي تحكم التفاعل داخل الدائرة. كيف نتحدث؟ كيف نعبر عن الاختلاف؟ ما هي الخطوط الحمراء؟" 
                    />

                    <SmartListInput 
                      fieldName="essence"
                      icon={<FiHeart className="text-red-500" />}
                      label="نبض الدائرة (القيم)" 
                      tooltip="المحركات النفسية للأعضاء. هل الدائرة قائمة على (النمو)، (الأمان)، (المغامرة)، أم (العطاء)؟" 
                    />
                    
                    <SmartListInput 
                      fieldName="compass"
                      icon={<FiTarget className="text-orange-500" />}
                      label="بوصلة الاهتمام (الأولويات)" 
                      tooltip="ما هو الشيء الذي إذا فقدته الدائرة فقدت معناها؟ التعلم؟ الضحك المهذب؟ التقدم المهني؟" 
                    />

                    <SmartListInput 
                      fieldName="soul_filter"
                      icon={<FiUsers className="text-blue-500" />}
                      label="فلتر الأرواح (معايير العضوية)" 
                      tooltip="من هو الشخص الذي يضيف لهذه الدائرة؟ ومن هو الشخص الذي قد يربك توازنها؟" 
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem className="mt-8">
                        <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">بعد الدائرة (الخصوصية الكونية)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl border-white/10 h-14 bg-white/5 text-white font-black transition-all">
                              <SelectValue placeholder="اختر البعد" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl border-white/10 bg-[#0f172a] text-white shadow-2xl p-2">
                            <SelectItem value="PRIVATE" className="rounded-xl py-3 cursor-pointer focus:bg-blue-600">
                              <div className="flex flex-col">
                                <span className="font-black text-sm">خاصة (فضاء شخصي)</span>
                                <span className="text-[10px] text-slate-500">لا يراها سواك والأعضاء المدعوين بالاسم.</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="PUBLIC" className="rounded-xl py-3 cursor-pointer focus:bg-blue-600">
                              <div className="flex flex-col">
                                <span className="font-black text-sm">عامة (فضاء مفتوح)</span>
                                <span className="text-[10px] text-slate-500">يمكن لأي شخص طلب الانضمام أو رؤيتها في الاكتشاف.</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="MIXED" className="rounded-xl py-3 cursor-pointer focus:bg-blue-600">
                              <div className="flex flex-col">
                                <span className="font-black text-sm">مختلطة (فضاء هجين)</span>
                                <span className="text-[10px] text-slate-500">الأعضاء فقط يرون التفاصيل، لكن الغرباء يلمحون الوجود.</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </div>

              <div className="p-8 bg-slate-950/50 border-t border-white/5 flex sm:justify-between items-center gap-4">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 text-slate-500 font-bold hover:text-white hover:bg-white/5 px-8">إلغاء التشكيل</Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 text-white rounded-xl h-14 font-black transition-all hover:-translate-y-0.5 active:translate-y-0">
                  {circle ? 'تثبيت الأبعاد الكونية' : 'بدء خلق المدار'}
                </Button>
              </div>
            </Tabs>
          </form>
        </Form>
      </DialogContent>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </Dialog>
  );
};
