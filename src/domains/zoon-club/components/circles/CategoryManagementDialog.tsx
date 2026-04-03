import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ZoonCircleCategory } from '../../services/zoonCirclesService';
import { FiPlus, FiTrash2, FiLayout, FiEdit3, FiGrid } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface CategoryManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ZoonCircleCategory[];
  onAdd: (values: Partial<ZoonCircleCategory>) => void;
  onDelete: (id: string) => void;
}

const ICONS = ['🔵', '👤', '💼', '👨‍👩‍👧‍👦', '📊', '🎓', '🎨', '🚀', '❤️', '🌟', '🧩', '🌍', '🛠️', '📣', '💡'];
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#059669', '#f97316'];

export const CategoryManagementDialog: React.FC<CategoryManagementDialogProps> = ({
  open,
  onOpenChange,
  categories,
  onAdd,
  onDelete,
}) => {
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🔵');
  const [newColor, setNewColor] = useState('#3b82f6');

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd({ name: setNewNameVal(newName), icon: newIcon, color: newColor });
      setNewName('');
    }
  };

  // وظيفة مساعدة لتصحيح التسميات العربية إذا لزم الأمر
  const setNewNameVal = (name: string) => {
    return name.replace('الهيدجة', 'الدائرة الذكية');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-[#020617] text-white border-white/10 rounded-[32px] shadow-2xl">
        <DialogHeader className="p-8 bg-gradient-to-br from-slate-900 to-blue-900/40 border-b border-white/5 relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <FiGrid className="w-32 h-32 rotate-12" />
          </div>
          <DialogTitle className="text-2xl font-black flex items-center gap-4 relative z-10">
             <div className="bg-blue-600/20 p-3 rounded-2xl backdrop-blur-md">
                <FiLayout className="w-6 h-6 text-blue-400" />
             </div>
             برمجة أبعاد الزوون
          </DialogTitle>
          <p className="text-slate-400 text-sm mt-2 font-medium relative z-10">
             قم بصياغة تصنيفات فريدة لمجراتك الخاصة، لتميز كل فضاء بهويته المستقلة.
          </p>
        </DialogHeader>

        <div className="p-8 space-y-8">
          {/* Add New Category Card */}
          <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 transition-all group-hover:w-2 shadow-[0_0_10px_#3b82f6]" />
             <h4 className="text-[10px] font-black text-slate-500 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                <FiEdit3 /> صياغة تصنيف جديد
             </h4>
             
             <div className="flex gap-3 mb-6">
                <Input 
                   value={newName}
                   onChange={(e) => setNewName(e.target.value)}
                   className="rounded-xl border-white/10 h-12 text-sm font-bold bg-slate-900/50 text-white focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-slate-600" 
                   placeholder="مثلاً: بؤرة التعاون، نادي القراءة..." 
                />
                <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 rounded-xl h-12 px-6 shadow-xl shadow-blue-600/20 flex items-center gap-2 font-black transition-all hover:-translate-y-0.5 active:translate-y-0">
                   <FiPlus className="w-5 h-5" />
                   <span>إضافة</span>
                </Button>
             </div>
             
             <div className="space-y-4">
                <div>
                   <span className="text-[10px] font-black text-slate-500 block mb-2 uppercase tracking-wider">الرمز الجوهري:</span>
                   <div className="flex flex-wrap gap-2">
                      {ICONS.map(icon => (
                         <button 
                            key={icon}
                            type="button"
                            onClick={() => setNewIcon(icon)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-white/5 border border-white/5 shadow-sm hover:shadow-md ${newIcon === icon ? 'ring-2 ring-blue-500 scale-110 text-2xl bg-white/10 shadow-blue-500/20' : 'text-xl grayscale-[0.5] hover:grayscale-0 hover:bg-white/10'}`}
                         >
                            {icon}
                         </button>
                      ))}
                   </div>
                </div>

                <div>
                   <span className="text-[10px] font-black text-slate-500 block mb-2 uppercase tracking-wider">البصمة اللونية:</span>
                   <div className="flex flex-wrap gap-2">
                      {COLORS.map(color => (
                         <button 
                            key={color}
                            type="button"
                            onClick={() => setNewColor(color)}
                            className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-125 ${newColor === color ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-white/20 shadow-sm'}`}
                            style={{ backgroundColor: color }}
                         />
                      ))}
                   </div>
                </div>
             </div>
          </div>

          {/* Current Categories List */}
          <div className="relative">
             <div className="flex items-center justify-between mb-4 px-1">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                   المجرات النشطة حالياً
                </h4>
                <div className="text-[9px] bg-white/10 text-slate-400 px-3 py-1 rounded-full font-black uppercase tracking-tighter">
                   {categories.length} أنواع فريدة
                </div>
             </div>

             <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar pb-4 min-h-[100px]">
                <AnimatePresence initial={false}>
                   {categories.map((cat) => (
                      <motion.div 
                        key={cat.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all hover:bg-white/[0.07] group"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-transform group-hover:scale-110" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                               {cat.icon}
                            </div>
                            <div>
                               <div className="font-black text-white text-sm tracking-tight">{cat.name}</div>
                               <div className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase tracking-widest">تكوين ذكي</div>
                            </div>
                         </div>
                         <button 
                            onClick={() => onDelete(cat.id)}
                            className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-rose-500/20"
                         >
                            <FiTrash2 className="w-4 h-4" />
                         </button>
                      </motion.div>
                   ))}
                </AnimatePresence>
                {categories.length === 0 && (
                   <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-[24px] bg-white/[0.02]">
                      <div className="text-slate-700 text-3xl mb-2">🌑</div>
                      <div className="text-slate-500 text-sm font-bold">لا توجد تصنيفات مخصصة بعد</div>
                      <div className="text-slate-600 text-[10px] mt-1 font-medium italic">ابدأ ببرمجة أول تصنيف لترتيب زوونك الخاص</div>
                   </div>
                )}
             </div>
          </div>
        </div>

        <div className="p-8 bg-slate-900/50 border-t border-white/5 flex justify-between items-center">
           <p className="text-[10px] text-slate-500 font-bold max-w-[250px] leading-relaxed italic">تذكر أن حذف تصنيف سيؤدي إلى فقدان فلترة الدوائر المندرجة تحته في المتصفح العلوي.</p>
           <Button onClick={() => onOpenChange(false)} variant="ghost" className="rounded-xl font-black text-slate-400 hover:text-white hover:bg-white/5 px-8">إغلاق المجلد</Button>
        </div>
      </DialogContent>

      <style jsx>{`
         .custom-scrollbar::-webkit-scrollbar { width: 4px; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </Dialog>
  );
};
