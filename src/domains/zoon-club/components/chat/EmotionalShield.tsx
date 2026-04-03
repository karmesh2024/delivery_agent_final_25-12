'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShield, FiCheck, FiX, FiLock, FiCpu } from 'react-icons/fi';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { archetypeEngine, type ArchetypeName } from '@/domains/zoon-club/services/archetypeEngine.service';
import { advancedPsychologicalEngine } from '@/domains/zoon-club/services/zoonAdvancedPsychologicalEngine.service';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

export interface EmotionalShieldProps {
  onToneReady: (toneInstruction: string) => void;
  onConsentChange: (isConsented: boolean) => void;
}

export function EmotionalShield({ onToneReady, onConsentChange }: EmotionalShieldProps) {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConsent, setShowConsent] = useState(false);
  const [archetype, setArchetype] = useState<ArchetypeName | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    checkStatus();
  }, [user]);

  const checkStatus = async () => {
    try {
      // 1. Check if user already has an archetype & consent
      const data = await archetypeEngine.getUserTone(user!.id);
      
      if (data.hasOptedIn) {
        // ✅ Already opted in -> Load tone silently
        setArchetype(data.archetype);
        if (data.toneInstruction) {
          onToneReady(data.toneInstruction);
        }
        onConsentChange(true);
      } else {
        // ❌ Not opted in -> Show consent dialog
        setShowConsent(true);
        onConsentChange(false);
      }
    } catch (error) {
      console.error('Error checking emotional shield status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      // 1. Save consent
      await archetypeEngine.setPersonalizationOptIn(user!.id, true);
      
      // 2. Compute initial archetype if missing (Cold Start)
      const profile = await advancedPsychologicalEngine.enrichProfile(user!.id);
      
      // Calculate locally to follow "Privacy First"
      const result = archetypeEngine.calculateArchetype({
        openness: profile.dimensions.openness.final,
        conscientiousness: profile.dimensions.conscientiousness.final,
        extraversion: profile.dimensions.extraversion.final,
        agreeableness: profile.dimensions.agreeableness.final,
        neuroticism: profile.dimensions.neuroticism.final
      });

      // 3. Save calculated archetype to DB
      // Note: Usually this happens via SQL trigger, but force update here for instant effect
      // await advancedPsychologicalEngine.forceUpdateArchetype(user!.id, result); 
      // (Assuming the trigger handles it on next interaction, we just use local result now)

      onToneReady(result.toneInstruction);
      onConsentChange(true);
      setArchetype(result.primary);
      setShowConsent(false);
      toast.success('تم تفعيل التخصيص الذكي! 🧠');

    } catch (error) {
      toast.error('حدث خطأ أثناء التفعيل');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setShowConsent(false);
    onConsentChange(false);
    // User chose standard experience
  };

  if (loading) return null;

  return (
    <AnimatePresence>
      {showConsent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <Card className="w-full max-w-md p-6 bg-white border-0 shadow-2xl relative overflow-hidden">
            {/* Visual Header */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50" />
            
            <div className="relative z-10 text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-2">
                <FiCpu size={32} className="text-indigo-600" />
              </div>
              
              <h2 className="text-xl font-black text-slate-800">تفعيل الذكاء الوجداني؟ 🧠</h2>
              
              <p className="text-sm text-slate-600 leading-relaxed">
                هل تسمح للمساعد الذكي "كارمش" بتحليل أسلوب كتابتك لتخصيص نبرة الحديث بما يناسب شخصيتك؟
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-right space-y-2">
                <div className="flex items-start gap-2">
                  <FiCheck className="text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-slate-600 font-bold">تجربة مخصصة تماماً لك (رسمية، ودودة، أو مختصرة).</p>
                </div>
                <div className="flex items-start gap-2">
                  <FiCheck className="text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-slate-600 font-bold">فهم أعمق لاحتياجاتك النفسية.</p>
                </div>
                <div className="flex items-start gap-2">
                  <FiLock className="text-indigo-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-indigo-600 font-bold">بياناتك مشفرة وتستخدم لتحسين تجربتك فقط.</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleAccept} 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11"
                >
                  نعم، وافق وفعّل الذكاء
                </Button>
                <Button 
                  onClick={handleDecline} 
                  variant="outline" 
                  className="flex-1 border-slate-200 text-slate-500 hover:bg-slate-50 h-11 font-bold"
                >
                  لا، شكراً
                </Button>
              </div>
              
              <p className="text-[9px] text-slate-400">يمكنك تغيير هذا الإعداد لاحقاً من الملف الشخصي.</p>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Subtle Tone Indicator (Active Mode) */}
      {!showConsent && archetype && (
        <div className="hidden">
          {/* هنا يمكن إضافة مؤشر صغير "Tone Active" في المستقبل */}
        </div>
      )}
    </AnimatePresence>
  );
}
