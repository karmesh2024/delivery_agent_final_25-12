import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { ZoonCircle, ZoonCircleMember } from '../../services/zoonCirclesService';
import { FiLink, FiUserPlus, FiSearch, FiSend, FiZap, FiArrowRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface DirectLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: ZoonCircleMember | null;
  circles: ZoonCircle[];
  onLinkToCircle: (circleId: string, reason: string) => void;
  onSendToPerson: (personId: string, reason: string) => void;
}

// Mocked friends/admins for now as requested
const MOCK_FRIENDS = [
  { id: 'f1', name: 'أحمد الكرماني', role: 'وكيل منطقة أ', avatar: '👨‍💼' },
  { id: 'f2', name: 'سارة التميمي', role: 'مديرة مجرة الإبداع', avatar: '👩‍🎨' },
  { id: 'f3', name: 'ياسين الحلبي', role: 'مشرف قطاع الشباب', avatar: '🧔' },
];

export const DirectLinkDialog: React.FC<DirectLinkDialogProps> = ({
  open,
  onOpenChange,
  member,
  circles,
  onLinkToCircle,
  onSendToPerson,
}) => {
  const [tab, setTab] = useState<'CIRCLE' | 'PERSON'>('CIRCLE');
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!member) return null;

  const handleConfirm = () => {
    if (!selectedId) return;
    if (tab === 'CIRCLE') {
      onLinkToCircle(selectedId, reason);
    } else {
      onSendToPerson(selectedId, reason);
    }
    onOpenChange(false);
  };

  const filteredCircles = circles.filter(c => c.name.includes(search));
  const filteredFriends = MOCK_FRIENDS.filter(f => f.name.includes(search));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-[#020617] text-white border-white/10 rounded-[32px] overflow-hidden p-0 shadow-2xl">
        <DialogHeader className="p-8 bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border-b border-white/5 relative">
          <div className="absolute top-4 right-8 opacity-10">
             <FiZap className="w-24 h-24 rotate-12" />
          </div>
          <DialogTitle className="text-2xl font-black flex items-center gap-3 relative z-10">
             <div className="bg-blue-600/20 p-2.5 rounded-2xl backdrop-blur-md">
                <FiLink className="w-6 h-6 text-blue-400" />
             </div>
             الربط الكوني المباشر
          </DialogTitle>
          <p className="text-slate-400 text-sm mt-2 font-medium relative z-10">
             أنت الآن بصدد صهر علاقة <span className="text-blue-400 font-bold">{member.name}</span> بمدار جديد أو وكيل آخر.
          </p>
        </DialogHeader>

        <div className="p-8 space-y-6">
           {/* Tab Switcher */}
           <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
              <button 
                onClick={() => { setTab('CIRCLE'); setSelectedId(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${tab === 'CIRCLE' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                 <FiZap /> ربط بمدار (دائرة)
              </button>
              <button 
                onClick={() => { setTab('PERSON'); setSelectedId(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${tab === 'PERSON' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                 <FiUserPlus /> إرسال لوكيل زميل
              </button>
           </div>

           {/* Search Area */}
           <div className="relative">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" />
              <Input 
                 placeholder={tab === 'CIRCLE' ? "ابحث عن المدار المنشود..." : "ابحث عن الوكيل المستهدف..."}
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="bg-white/5 border-white/5 h-12 pr-11 text-sm rounded-xl focus:ring-blue-500/20"
              />
           </div>

           {/* Results List */}
           <div className="max-h-[220px] overflow-y-auto space-y-2 custom-scrollbar pr-2">
              <AnimatePresence mode="wait">
                 {tab === 'CIRCLE' ? (
                   filteredCircles.map(circle => (
                     <motion.div
                       key={circle.id}
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       onClick={() => setSelectedId(circle.id)}
                       className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${selectedId === circle.id ? 'bg-blue-600/20 border-blue-500' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                     >
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shadow-lg">
                              {circle.icon}
                           </div>
                           <div>
                              <div className="text-sm font-black text-white">{circle.name}</div>
                              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{circle.type}</div>
                           </div>
                        </div>
                        {selectedId === circle.id && <FiZap className="text-blue-400 animate-pulse" />}
                     </motion.div>
                   ))
                 ) : (
                   filteredFriends.map(friend => (
                     <motion.div
                       key={friend.id}
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       onClick={() => setSelectedId(friend.id)}
                       className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${selectedId === friend.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                     >
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-2xl shadow-lg">
                              {friend.avatar}
                           </div>
                           <div>
                              <div className="text-sm font-black text-white">{friend.name}</div>
                              <div className="text-[10px] text-indigo-400 font-bold">{friend.role}</div>
                           </div>
                        </div>
                        {selectedId === friend.id && <FiSend className="text-indigo-400 animate-bounce" />}
                     </motion.div>
                   ))
                 )}
              </AnimatePresence>
           </div>

           {/* Description Area */}
           <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">رسالة الارتباط (الهدف من الربط):</label>
              <Textarea 
                 value={reason}
                 onChange={(e) => setReason(e.target.value)}
                 className="bg-white/5 border-white/5 rounded-xl min-h-[80px] text-sm text-white focus:ring-blue-500/10 placeholder:text-slate-700"
                 placeholder="لماذا ترسل هذا العضو؟ ذكر الصديق بمهمته..."
              />
           </div>
        </div>

        <DialogFooter className="p-8 bg-slate-900/50 border-t border-white/5 gap-3">
           <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold text-slate-500 hover:text-white">إلغاء</Button>
           <Button 
              onClick={handleConfirm}
              disabled={!selectedId}
              className={`flex-1 rounded-xl h-12 font-black transition-all shadow-xl ${!selectedId ? 'bg-slate-800 opacity-50 cursor-not-allowed' : (tab === 'CIRCLE' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20')}`}
           >
              {tab === 'CIRCLE' ? 'إتمام الربط المداري' : 'إرسال التوصية فوراً'}
           </Button>
        </DialogFooter>
      </DialogContent>

      <style jsx global>{`
         .custom-scrollbar::-webkit-scrollbar { width: 4px; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </Dialog>
  );
};
