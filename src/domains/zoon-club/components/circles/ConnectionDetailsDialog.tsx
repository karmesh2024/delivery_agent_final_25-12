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
import { ZoonCircleConnection, ZoonCircleMember, ZoonCircle } from '../../services/zoonCirclesService';
import { FiTrash2, FiLink, FiInfo, FiUser, FiZap } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface ConnectionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: ZoonCircleConnection | null;
  fromCircle: ZoonCircle | null;
  toCircle: ZoonCircle | null;
  fromMember: ZoonCircleMember | null;
  toMember: ZoonCircleMember | null;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ZoonCircleConnection>) => void;
}

export const ConnectionDetailsDialog: React.FC<ConnectionDetailsDialogProps> = ({
  open,
  onOpenChange,
  connection,
  fromCircle,
  toCircle,
  fromMember,
  toMember,
  onDelete,
  onUpdate,
}) => {
  const [reason, setReason] = React.useState(connection?.reason || '');

  React.useEffect(() => {
    if (connection) {
      setReason(connection.reason || '');
    }
  }, [connection]);

  if (!connection) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#020617] text-white border-white/10 rounded-3xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-8 bg-gradient-to-br from-slate-900 to-blue-900/30 border-b border-white/5">
          <DialogTitle className="flex items-center gap-3 text-2xl font-black">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FiLink className="text-white" />
            </div>
            تعديل المسار الرابط
          </DialogTitle>
          <p className="text-slate-400 text-sm mt-1 font-medium italic">تحليل وتعديل الروابط النسيجية بين الكيانات.</p>
        </DialogHeader>

        <div className="p-8 space-y-8">
          {/* Visual Link Representation */}
          <div className="flex items-center justify-between py-6 px-4 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden group">
             <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             
             <div className="flex flex-col items-center gap-3 z-10">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-slate-800 flex items-center justify-center">
                    {fromMember?.avatar_url ? <img src={fromMember.avatar_url} className="w-full h-full object-cover" /> : <span className="text-3xl">{fromCircle?.icon || '⭕'}</span>}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center border-2 border-[#020617] shadow-lg">
                    <FiUser className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="text-center">
                   <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{fromCircle?.name}</div>
                   <div className="text-sm font-bold text-white leading-none">{fromMember?.name || 'مركز الدائرة'}</div>
                </div>
             </div>

             <div className="flex-1 flex flex-col items-center px-4">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent relative opacity-40">
                   <motion.div 
                     animate={{ x: [-30, 30, -30] }}
                     transition={{ repeat: Infinity, duration: 4 }}
                     className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-blue-400" 
                   />
                </div>
                <span className="text-[9px] bg-white/10 px-3 py-1 rounded-full border border-white/10 text-white font-black mt-3 uppercase tracking-tighter">
                   {connection.connection_type}
                </span>
             </div>

             <div className="flex flex-col items-center gap-3 z-10">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-slate-800 flex items-center justify-center">
                    {toMember?.avatar_url ? <img src={toMember.avatar_url} className="w-full h-full object-cover" /> : <span className="text-3xl">{toCircle?.icon || '⭕'}</span>}
                  </div>
                  <div className="absolute -bottom-2 -left-2 w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center border-2 border-[#020617] shadow-lg">
                    <FiZap className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="text-center">
                   <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{toCircle?.name}</div>
                   <div className="text-sm font-bold text-white leading-none">{toMember?.name || 'مركز الدائرة'}</div>
                </div>
             </div>
          </div>

          <div className="space-y-6">
             <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3 block">لماذا حدث هذا الارتباط؟</label>
                <Textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="اكتب تفاصيل طبيعة هذه العلاقة الاجتماعية..."
                  className="bg-slate-900/50 border-white/5 rounded-xl text-sm min-h-[100px] focus:ring-blue-500/20 text-white font-medium"
                />
             </div>
             
             <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-3">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">قوة الارتباط الحالي</label>
                   <span className="text-xs font-black text-blue-400">%{Math.round(connection.strength * 100)} توافق</span>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${connection.strength * 100}%` }}
                     className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                   />
                </div>
             </div>
          </div>
        </div>

        <DialogFooter className="p-8 bg-slate-900/50 border-t border-white/5 flex gap-3">
          <Button 
            variant="ghost" 
            className="flex-1 rounded-xl h-12 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 font-bold transition-all"
            onClick={() => {
              if (confirm('هل أنت متأكد من حذف هذا الارتباط من تاريخ الزوون؟')) {
                onDelete(connection.id);
                onOpenChange(false);
              }
            }}
          >
            <FiTrash2 className="ml-2" /> حذف الرابط
          </Button>
          <Button 
            className="flex-[2] rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-600/20 transition-all"
            onClick={() => {
              onUpdate(connection.id, { reason });
              onOpenChange(false);
            }}
          >
            حفظ التعديلات الكونية
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
