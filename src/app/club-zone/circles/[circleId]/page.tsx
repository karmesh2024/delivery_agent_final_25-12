'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { zoonCirclesService, CircleResourceStatus } from '@/domains/zoon-club/services/zoonCirclesService';
import { supabase } from '@/lib/supabase';
import { FiLock, FiUnlock, FiMessageSquare, FiBookOpen, FiCalendar, FiCpu, FiArrowLeft, FiActivity } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function CircleZonePage() {
  const params = useParams();
  const router = useRouter();
  const circleId = params?.circleId as string;
  
  const [status, setStatus] = useState<CircleResourceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (circleId) {
      loadStatus();
    }
  }, [circleId]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await zoonCirclesService.getCircleResourcesStatus(circleId);
      setStatus(data);
    } catch (error) {
      console.error('Error loading circle status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070a] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="opacity-60 text-sm animate-pulse">جاري الاتصال بالعقل المحرك...</p>
        </div>
      </div>
    );
  }

  if (!status) return null;

  const features = [
    { 
      key: 'chat', 
      label: 'الدردشة الجماعية', 
      icon: <FiMessageSquare className="w-6 h-6" />, 
      unlocked: status.unlockedFeatures.chat,
      req: 40,
      description: 'تواصل فوري مع أعضاء الدائرة'
    },
    // ... other features
    { 
      key: 'library', 
      label: 'مكتبة المعرفة', 
      icon: <FiBookOpen className="w-6 h-6" />, 
      unlocked: status.unlockedFeatures.library,
      req: 60,
      description: 'مشاركة الملفات والمصادر التعليمية'
    },
    { 
      key: 'events', 
      label: 'الفعاليات', 
      icon: <FiCalendar className="w-6 h-6" />, 
      unlocked: status.unlockedFeatures.events,
      req: 75,
      description: 'تنظيم لقاءات وجلسات مشتركة'
    },
    { 
      key: 'aiAssistant', 
      label: 'المساعد الذكي (AI)', 
      icon: <FiCpu className="w-6 h-6" />, 
      unlocked: status.unlockedFeatures.aiAssistant,
      req: 90,
      description: 'تحليل متقدم واقتراحات ذكية للدائرة'
    }
  ];

  return (
    <div className="min-h-screen bg-[#05070a] text-white p-6 relative overflow-hidden" dir="rtl">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px]" />
            <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex justify-between items-center mb-12">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    منطقة الدائرة (Circle Zone)
                </h1>
                <p className="text-white/40 text-sm mt-1">مساحة العمل المشتركة</p>
            </div>
            <button 
                onClick={() => router.back()}
                className="bg-white/5 hover:bg-white/10 p-3 rounded-full border border-white/10 transition-colors"
            >
                <FiArrowLeft className="w-5 h-5" />
            </button>
        </div>

        {/* Harmony Meter (The Game Loop) */}
        <div className="relative z-10 mb-12 bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center">
            <div className="w-full flex justify-between items-end mb-4">
                <div className="flex items-center gap-3">
                    <FiActivity className={`w-6 h-6 ${status.harmonyScore > 50 ? 'text-green-400' : 'text-yellow-400'}`} />
                    <span className="text-lg font-bold">مستوى التناغم (Harmony)</span>
                </div>
                <span className="text-4xl font-black tracking-tighter">{status.harmonyScore.toFixed(0)}%</span>
            </div>
            
            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden relative">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${status.harmonyScore}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full relative ${
                        status.harmonyScore < 40 ? 'bg-red-500' :
                        status.harmonyScore < 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}
                >
                    <div className="absolute top-0 right-0 h-full w-full bg-gradient-to-l from-white/20 to-transparent" />
                </motion.div>

                {/* Markers for Unlocks */}
                {[40, 60, 75, 90].map(pt => (
                    <div key={pt} className="absolute top-0 h-full w-[2px] bg-white/20" style={{ right: `${pt}%` }} />
                ))}
            </div>

            {status.nextUnlock && (
                <div className="mt-4 text-sm bg-blue-500/10 text-blue-300 px-4 py-2 rounded-full border border-blue-500/20">
                    🔒 الهدف القادم: <strong>{status.nextUnlock.feature}</strong> (متبقي {Math.max(0, status.nextUnlock.requiredScore - status.harmonyScore).toFixed(0)}%)
                </div>
            )}
        </div>

        {/* Features Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
                <motion.div
                    key={feature.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                        feature.unlocked 
                            ? 'bg-white/5 border-white/10 hover:border-blue-500/50 cursor-pointer group' 
                            : 'bg-black/20 border-white/5 opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => {
                        if(feature.unlocked) {
                            if (feature.key === 'chat') {
                                router.push(`/club-zone/circles/${circleId}/chat`);
                            } else if (feature.key === 'library') {
                                router.push(`/club-zone/circles/${circleId}/library`);
                            } else if (feature.key === 'events') {
                                router.push(`/club-zone/circles/${circleId}/events`);
                            } else if (feature.key === 'aiAssistant') {
                                router.push(`/club-zone/circles/${circleId}/ai-assistant`);
                            } else {
                                alert(`قريباً: ${feature.label}`);
                            }
                        }
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${feature.unlocked ? 'bg-blue-600' : 'bg-white/5'}`}>
                            {feature.icon}
                        </div>
                        {feature.unlocked ? (
                             <FiUnlock className="text-green-500 w-5 h-5" />
                        ) : (
                             <div className="flex items-center gap-1 text-xs text-white/40">
                                 <FiLock className="w-3 h-3" />
                                 <span>يفتح عند {feature.req}%</span>
                             </div>
                        )}
                    </div>
                    
                    <h3 className={`text-xl font-bold mb-2 ${feature.unlocked ? 'text-white' : 'text-white/40'}`}>
                        {feature.label}
                    </h3>
                    <p className="text-sm text-white/40 leading-relaxed">
                        {feature.description}
                    </p>

                    {feature.unlocked && (
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/30 rounded-2xl transition-all pointer-events-none" />
                    )}
                </motion.div>
            ))}
        </div>

        {/* Harmony Network */}
        {status.members && status.members.length > 0 && (
          <div className="relative z-10 mt-12 bg-white/5 border border-white/10 rounded-3xl p-8">
             <div className="flex items-center gap-2 mb-6 text-white/60 uppercase tracking-widest text-sm font-bold">
                 <span>✨ شبكة التناغم (Harmony Network)</span>
             </div>

             <div className="flex flex-wrap gap-6 justify-center">
                 {status.members.map(member => (
                     <div key={member.id} className="relative group flex flex-col items-center">
                         <div className="w-16 h-16 rounded-full border-2 border-white/10 p-[2px] overflow-hidden bg-black/40 group-hover:border-blue-500 transition-colors shadow-xl">
                             <img 
                                src={member.avatar_url || 'https://api.dicebear.com/9.x/micah/svg?seed=' + member.name} 
                                className="w-full h-full rounded-full object-cover" 
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://api.dicebear.com/9.x/micah/svg?seed=fallback'; }}
                             />
                         </div>
                         {member.archetype && (
                             <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[9px] font-bold uppercase shadow-lg border border-white/10 z-10 whitespace-nowrap">
                                 {member.archetype}
                             </div>
                         )}
                         <div className="mt-4 text-xs font-bold text-white/80 group-hover:text-white transition-colors">
                             {member.name}
                         </div>
                     </div>
                 ))}
             </div>
          </div>
        )}
    </div>
  );
}
