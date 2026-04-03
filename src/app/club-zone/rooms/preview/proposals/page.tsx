'use client';

import React, { useEffect } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { CircleProposalCard } from '@/domains/zoon-club/components/CircleProposalCard';
import { motion } from 'framer-motion';
import { FiStar, FiInfo, FiTrendingUp, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCircles } from '@/domains/zoon-club/store/zoonClubSlice';

export default function CircleProposalsPreview() {
  const dispatch = useAppDispatch();
  const { circles, loading } = useAppSelector((state) => state.zoonClub);
  const { currentAdmin } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCircles());
  }, [dispatch]);

  const handleJoin = (name: string) => {
    toast.success(`تم إرسال طلب انضمامك لـ ${name}`);
  };

  if (!currentAdmin?.user_id) {
    return (
      <DashboardLayout title="مقترحات الدوائر">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-bold text-slate-700">يرجى تسجيل الدخول لعرض مقترحاتك</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="مقترحات الدوائر (نظام 2026)">
      <div className="max-w-6xl mx-auto p-6 space-y-10 min-h-screen bg-slate-50/50">
        
        {/* Hero Section: AI Analysis */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
            <div className="space-y-4 text-right">
              <div className="bg-white/10 backdrop-blur-md inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 text-sm font-bold">
                <FiStar className="text-yellow-400 fill-yellow-400" /> تحليل البصمة النفسية (AI)
              </div>
              <h1 className="text-4xl font-black leading-tight leading-arabic">
                أهلاً بك يا بطل! <br/>
                لقد وجدنا لك <span className="text-indigo-300">مجتمعات تشبهك</span>
              </h1>
              <p className="text-indigo-100 max-w-xl text-lg opacity-80">
                بناءً على تفاعلاتك الأخيرة بـ (Energy Bazzzz) وقيمك الموثقة، 
                قمنا بترشيح هذه الدوائر الكونية لك لتعظيم أثرك ونقاطك.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-white/20 flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-400 flex items-center justify-center text-3xl font-bold shadow-inner">
                92%
              </div>
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest text-center">
                دقة المطابقة الحالية
              </p>
            </div>
          </div>
          
          {/* Decorative circles */}
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-10 right-10 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl"></div>
        </motion.div>

        {/* Categories / Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4 group hover:border-indigo-500 transition-colors">
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-lg"><FiTrendingUp className="w-6 h-6" /></div>
              <div>
                <p className="text-gray-400 text-xs font-bold">نقاط الدائرة مفعّلة</p>
                <h4 className="font-black text-lg">+2.5x Points</h4>
              </div>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4 group hover:border-emerald-500 transition-colors">
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg"><FiCheckCircle className="w-6 h-6" /></div>
              <div>
                <p className="text-gray-400 text-xs font-bold">حالة التوافق</p>
                <h4 className="font-black text-lg">مثالي (Ideal)</h4>
              </div>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4 group hover:border-amber-500 transition-colors">
              <div className="bg-amber-50 text-amber-600 p-3 rounded-lg"><FiInfo className="w-6 h-6" /></div>
              <div>
                <p className="text-gray-400 text-xs font-bold">الروابط المتاحة</p>
                <h4 className="font-black text-lg">{(circles?.length || 0)} دائرة كونية</h4>
              </div>
           </div>
        </div>

        {/* Proposals Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 border-r-4 border-indigo-600 pr-4">
            الدوائر الموصى بها لك (Cosmic Proposals)
          </h2>
          
          {loading ? (
             <div className="flex justify-center py-20">
               <FiLoader className="w-10 h-10 animate-spin text-indigo-600" />
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {circles.map((p) => (
                <CircleProposalCard 
                  key={p.id}
                  circleId={p.id}
                  userId={currentAdmin.user_id!}
                  circleName={p.name}
                  description={p.description || "لا يوجد وصف لهذه الدائرة حالياً."}
                  memberCount={p.member_count || 0}
                  type={p.circle_type || "SOCIAL"}
                  onJoin={() => handleJoin(p.name)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Banner */}
        <div className="mt-12 text-center py-10 bg-indigo-50/50 rounded-3xl border-2 border-dashed border-indigo-100">
           <p className="text-indigo-600 font-medium">
             هل تبحث عن شيء محدد؟ يمكنك دائماً تصفح <span className="font-bold underline cursor-pointer">كتالوج الدوائر الكامل</span>
           </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

