import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { ZoonCircle, ZoonCircleMember } from '../../services/zoonCirclesService';
import { FiArrowRight, FiCopy, FiMove, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: ZoonCircleMember | null;
  fromCircle: ZoonCircle | null;
  toCircle: ZoonCircle | null;
  onConfirm: (type: 'move' | 'copy', reason: string) => void;
}

export const TransferDialog: React.FC<TransferDialogProps> = ({
  open,
  onOpenChange,
  member,
  fromCircle,
  toCircle,
  onConfirm,
}) => {
  const [type, setType] = React.useState<'move' | 'copy'>('move');
  const [reason, setReason] = React.useState('');

  const handleConfirm = () => {
    onConfirm(type, reason);
    onOpenChange(false);
  };

  if (!member || !fromCircle || !toCircle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#020617] text-white border-white/10 rounded-3xl overflow-hidden p-0 shadow-2xl">
        <DialogHeader className="p-8 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-b border-white/5">
          <DialogTitle className="text-2xl font-black flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <FiMove className="w-5 h-5" />
             </div>
             إعادة توجيه المسار الكوني
          </DialogTitle>
          <p className="text-slate-400 text-sm mt-2 font-medium">
             أنت على وشك نقل <span className="text-blue-400 font-bold">{member.name}</span> عبر طبقات الزوون.
          </p>
        </DialogHeader>

        <div className="p-8 space-y-8">
          {/* Transfer Visualization */}
          <div className="flex items-center justify-between py-6 px-4 bg-white/5 rounded-2xl border border-white/5 relative">
             <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-3xl shadow-xl">
                   {fromCircle.icon}
                </div>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{fromCircle.name}</span>
             </div>

             <div className="flex-1 flex flex-col items-center px-4">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 relative">
                   <motion.div 
                     animate={{ x: [-20, 20, -20] }}
                     transition={{ repeat: Infinity, duration: 3 }}
                     className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]" 
                   />
                </div>
                <span className="text-[10px] font-bold text-blue-400 mt-2 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20 uppercase">
                   {type === 'move' ? 'نقل كامل' : 'نسخ (ازدواجية)'}
                </span>
             </div>

             <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-3xl shadow-xl ring-2 ring-blue-500/20">
                   {toCircle.icon}
                </div>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{toCircle.name}</span>
             </div>
          </div>

          {/* Selection Options */}
          <div className="grid grid-cols-1 gap-4">
             <button 
               onClick={() => setType('move')}
               className={`flex items-start gap-4 p-4 rounded-2xl border transition-all text-right ${type === 'move' ? 'bg-blue-600/10 border-blue-600 ring-4 ring-blue-600/10' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
             >
                <div className={`w-6 h-6 rounded-full border-2 mt-1 flex-shrink-0 flex items-center justify-center ${type === 'move' ? 'border-blue-500 bg-blue-500' : 'border-slate-700'}`}>
                   {type === 'move' && <FiCheckCircle className="text-white w-4 h-4" />}
                </div>
                <div>
                   <h4 className="font-black text-sm text-white mb-1 flex items-center gap-2">
                      نقل كامل (Move)
                      <span className="text-[9px] bg-slate-700 px-1.5 py-0.5 rounded uppercase">شائع</span>
                   </h4>
                   <p className="text-xs text-slate-400 leading-relaxed font-medium">سيغادر العضو الدائرة الحالية نهائياً وينضم للجديدة. مناسب إذا تغيرت طبيعة العلاقة بالكامل.</p>
                </div>
             </button>

             <button 
               onClick={() => setType('copy')}
               className={`flex items-start gap-4 p-4 rounded-2xl border transition-all text-right ${type === 'copy' ? 'bg-indigo-600/10 border-indigo-600 ring-4 ring-indigo-600/10' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
             >
                <div className={`w-6 h-6 rounded-full border-2 mt-1 flex-shrink-0 flex items-center justify-center ${type === 'copy' ? 'border-indigo-500 bg-indigo-500' : 'border-slate-700'}`}>
                   {type === 'copy' && <FiCheckCircle className="text-white w-4 h-4" />}
                </div>
                <div>
                   <h4 className="font-black text-sm text-white mb-1">نسخ (Copy / Multirole)</h4>
                   <p className="text-xs text-slate-400 leading-relaxed font-medium">سيبقى العضو في الدائرتين معاً. مثالي لمن يمثل "شريك عمل" وفي نفس الوقت "صديق مقرب".</p>
                </div>
             </button>
          </div>

          <div>
             <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3 block">لماذا حدث هذا التحول؟ (اختياري)</label>
             <Textarea 
               value={reason}
               onChange={(e) => setReason(e.target.value)}
               placeholder="مثلاً: بدأنا مشروعاً مشتركاً، أو تطورت العلاقة لصداقة..."
               className="bg-slate-900/50 border-white/5 rounded-xl text-sm min-h-[80px] focus:ring-blue-500/20 text-white font-medium"
             />
          </div>
        </div>

        <DialogFooter className="p-8 bg-slate-900/50 border-t border-white/5 flex gap-3">
           <Button 
             variant="ghost" 
             onClick={() => onOpenChange(false)}
             className="flex-1 rounded-xl font-bold text-slate-400 hover:text-white transition-colors"
           >
              إلغاء العملية
           </Button>
           <Button 
             onClick={handleConfirm}
             className={`flex-1 rounded-xl h-12 font-black transition-all shadow-xl ${type === 'move' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'}`}
           >
              تأكيد التوجيه
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
