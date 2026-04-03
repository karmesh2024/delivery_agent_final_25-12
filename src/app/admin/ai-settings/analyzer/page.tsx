'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { advancedPsychologicalEngine } from '@/domains/zoon-club/services/zoonAdvancedPsychologicalEngine.service';
import { toast } from 'react-hot-toast';
import { FiZap, FiFileText, FiTarget, FiBarChart2, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════
// ثوابت
// ═══════════════════════════════════════════════════════════════

const TRAIT_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  openness: { label: 'الانفتاح', color: 'bg-purple-100 text-purple-700', emoji: '🎨' },
  conscientiousness: { label: 'الالتزام', color: 'bg-blue-100 text-blue-700', emoji: '📏' },
  extraversion: { label: 'الانبساط', color: 'bg-amber-100 text-amber-700', emoji: '📢' },
  agreeableness: { label: 'الوفاق', color: 'bg-emerald-100 text-emerald-700', emoji: '🤝' },
  neuroticism: { label: 'العصبية', color: 'bg-rose-100 text-rose-700', emoji: '⚡' },
};

// ═══════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════

export default function ContentAnalyzerPage() {
  const [userId, setUserId] = useState('');
  const [commentText, setCommentText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const handleAnalyze = async () => {
    if (!userId.trim()) {
      toast.error('أدخل معرف المستخدم أولاً');
      return;
    }
    if (!commentText.trim()) {
      toast.error('أدخل نص التعليق للتحليل');
      return;
    }

    setLoading(true);
    try {
      const data = await advancedPsychologicalEngine.analyzeCommentAdaptive(userId, commentText);
      if (data) {
        setResult(data);
        setHistory(prev => [{ text: commentText, result: data, time: new Date() }, ...prev].slice(0, 10));
        toast.success(`تم تحليل التعليق — ${data.keywords_found} كلمة مكتشفة`);
      } else {
        toast.error('لم يتم إرجاع نتائج');
      }
    } catch (error) {
      toast.error('حدث خطأ في التحليل');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const topTraits = result
    ? Object.entries(result)
        .filter(([key]) => Object.keys(TRAIT_LABELS).includes(key))
        .filter(([, val]) => (val as number) > 0)
        .sort(([, a], [, b]) => (b as number) - (a as number))
    : [];

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/admin/ai-settings">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-indigo-600">
              <FiArrowRight className="rtl:rotate-180" /> العودة لإعدادات المحرك
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <FiFileText className="text-indigo-500" /> محلل المحتوى النفسي
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              جرّب تحليل تعليق لمستخدم — شاهد كيف يؤثر EXP Decay على ملفه النفسي في الوقت الفعلي.
            </p>
          </div>
          <Link href="/admin/ai-settings/archetypes">
            <Button variant="outline" size="sm" className="gap-2 text-xs font-bold">
              <FiArrowLeft /> لوحة النماذج
            </Button>
          </Link>
        </div>

        {/* Input Section */}
        <Card className="p-6 border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50" />

          <div className="space-y-4 relative z-10">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">معرف المستخدم (UUID)</label>
              <Input
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="bg-slate-50 border-slate-200 font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">نص التعليق</label>
              <textarea
                placeholder="مثلاً: شكراً على التنظيم الرائع والخطة الممتازة لتطوير الحي..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full h-24 p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                dir="rtl"
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold w-full h-11 text-sm gap-2 shadow-lg"
            >
              <FiZap className={loading ? 'animate-spin' : ''} />
              {loading ? 'جارٍ التحليل...' : 'تحليل التعليق (EXP Decay)'}
            </Button>
          </div>
        </Card>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Score Card */}
              <Card className="p-5 border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <FiTarget className="text-violet-500" /> التأثير المحسوب (لهذا التعليق)
                </h3>

                <div className="space-y-3">
                  {topTraits.length > 0 ? (
                    topTraits.map(([trait, value]) => {
                      const meta = TRAIT_LABELS[trait];
                      return (
                        <div key={trait} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{meta?.emoji}</span>
                            <span className="text-sm font-bold text-slate-700">{meta?.label}</span>
                          </div>
                          <Badge className={`${meta?.color} border-none font-black text-sm px-3`}>
                            +{(value as number).toFixed(2)}
                          </Badge>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      لم يتم اكتشاف كلمات مؤثرة في هذا التعليق
                    </div>
                  )}
                </div>
              </Card>

              {/* Meta Card */}
              <Card className="p-5 border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <FiBarChart2 className="text-emerald-500" /> البيانات الوصفية
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs font-bold text-slate-500">الكلمات المكتشفة</span>
                    <span className="text-sm font-black text-indigo-600">{result.keywords_found}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs font-bold text-slate-500">نموذج التسجيل</span>
                    <Badge className="bg-violet-100 text-violet-700 border-none text-[10px] font-bold">
                      {result.scoring_model}
                    </Badge>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs font-bold text-slate-500">الحد الأقصى/كلمة</span>
                    <span className="text-sm font-black text-slate-600">15 نقطة</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs font-bold text-slate-500">نوع التناقص</span>
                    <span className="text-sm font-bold text-slate-600">EXP(-n × 0.25)</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {history.length > 0 && (
          <Card className="p-5 border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold mb-4">📜 سجل التحليلات (آخر 10)</h3>
            <div className="space-y-2">
              {history.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-[11px]">
                  <span className="font-bold text-slate-700 truncate max-w-[50%]">&ldquo;{item.text}&rdquo;</span>
                  <div className="flex gap-2 items-center">
                    <Badge className="bg-indigo-100 text-indigo-700 border-none font-bold">
                      {item.result.keywords_found} كلمة
                    </Badge>
                    <span className="text-slate-400 text-[9px]">
                      {new Date(item.time).toLocaleTimeString('ar-EG')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
