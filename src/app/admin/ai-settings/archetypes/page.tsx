'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/shared/ui/table";
import { advancedPsychologicalEngine } from '@/domains/zoon-club/services/zoonAdvancedPsychologicalEngine.service';
import { archetypeEngine, type ArchetypeName, type MoodSnapshot } from '@/domains/zoon-club/services/archetypeEngine.service';
import { toast } from 'react-hot-toast';
import {
  FiSearch, FiUser, FiCpu, FiShield, FiActivity, FiMessageCircle, FiZap, FiArrowRight
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════
// ثوابت التصميم
// ═══════════════════════════════════════════════════════════════

const ARCHETYPE_META: Record<string, {
  label: string; emoji: string; color: string; bgGradient: string;
}> = {
  strategist: { label: 'المُخطط', emoji: '🎯', color: 'text-violet-700', bgGradient: 'from-violet-500 to-purple-600' },
  operator: { label: 'المُنفذ', emoji: '⚙️', color: 'text-blue-700', bgGradient: 'from-blue-500 to-cyan-600' },
  connector: { label: 'المُربط', emoji: '🤝', color: 'text-amber-700', bgGradient: 'from-amber-400 to-orange-500' },
  creator: { label: 'المُبتكر', emoji: '✨', color: 'text-pink-700', bgGradient: 'from-pink-500 to-rose-600' },
  stabilizer: { label: 'المُثبت', emoji: '🛡️', color: 'text-emerald-700', bgGradient: 'from-emerald-500 to-teal-600' },
  emerging: { label: 'قيد التشكّل', emoji: '🌱', color: 'text-slate-600', bgGradient: 'from-slate-400 to-slate-500' },
};

const TRAIT_COLORS: Record<string, string> = {
  openness: 'bg-purple-500',
  conscientiousness: 'bg-blue-500',
  extraversion: 'bg-amber-500',
  agreeableness: 'bg-emerald-500',
  neuroticism: 'bg-rose-500',
};

const TRAIT_LABELS: Record<string, string> = {
  openness: 'الانفتاح',
  conscientiousness: 'الالتزام',
  extraversion: 'الانبساط',
  agreeableness: 'الوفاق',
  neuroticism: 'العصبية',
};

// ═══════════════════════════════════════════════════════════════
// مكون شريط التقدم
// ═══════════════════════════════════════════════════════════════

function TraitBar({ trait, value }: { trait: string; value: number }) {
  const color = TRAIT_COLORS[trait] || 'bg-slate-400';
  const label = TRAIT_LABELS[trait] || trait;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-bold text-slate-500 w-16 text-right">{label}</span>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-[11px] font-mono font-bold text-slate-600 w-8">{Math.round(value)}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// مكون اختبار المزاج اللحظي
// ═══════════════════════════════════════════════════════════════

function MoodTester() {
  const [messages, setMessages] = useState(['', '', '']);
  const [result, setResult] = useState<MoodSnapshot | null>(null);

  const handleTest = () => {
    const filtered = messages.filter(m => m.trim());
    if (filtered.length === 0) {
      toast.error('أدخل رسالة واحدة على الأقل');
      return;
    }
    const snapshot = archetypeEngine.detectMoodShift(filtered);
    setResult(snapshot);
  };

  const moodColors: Record<string, string> = {
    very_positive: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    positive: 'bg-green-100 text-green-800 border-green-300',
    neutral: 'bg-slate-100 text-slate-700 border-slate-300',
    negative: 'bg-orange-100 text-orange-800 border-orange-300',
    very_negative: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <Card className="p-6 border-slate-200 shadow-sm">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <FiActivity className="text-orange-500" /> اختبار كشف التحول العاطفي
      </h3>
      <p className="text-[11px] text-slate-500 mb-4">
        أدخل 3 رسائل متتالية لمحاكاة محادثة — سيكشف النظام إذا حدث تحول في المزاج.
      </p>
      <div className="space-y-2 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 w-16">رسالة {i + 1}</span>
            <Input
              value={msg}
              onChange={(e) => {
                const copy = [...messages];
                copy[i] = e.target.value;
                setMessages(copy);
              }}
              placeholder={i === 0 ? 'مثلاً: رائع! خدمة ممتازة' : i === 1 ? 'مثلاً: بس ممكن تحسنوا' : 'مثلاً: مفيش فايدة'}
              className="text-sm bg-slate-50 border-slate-200"
            />
          </div>
        ))}
      </div>
      <Button onClick={handleTest} className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm w-full gap-2">
        <FiZap /> تحليل المزاج اللحظي
      </Button>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-3"
        >
          <div className={`p-4 rounded-xl border-2 ${moodColors[result.mood]}`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold">المزاج المكتشف</p>
                <p className="text-xl font-black">{result.dominantEmotion}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold">الثقة</p>
                <p className="text-xl font-black">{result.confidence}%</p>
              </div>
            </div>
          </div>

          {result.shouldOverrideTone && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-[11px] font-bold text-red-700 flex items-center gap-1">
                ⚠️ تحول عاطفي مكتشف — سيتم تغيير النبرة:
              </p>
              <p className="text-[10px] mt-1 text-red-600 leading-relaxed">
                {result.overrideToneInstruction}
              </p>
            </div>
          )}

          {!result.shouldOverrideTone && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-[11px] font-bold text-emerald-700">✅ لا يوجد تحول عاطفي — النبرة الأصلية مناسبة.</p>
            </div>
          )}
        </motion.div>
      )}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// مكون اختبار Prompt Builder
// ═══════════════════════════════════════════════════════════════

function PromptPreview() {
  const [archetype, setArchetype] = useState<ArchetypeName>('connector');
  const [optIn, setOptIn] = useState(true);

  const result = archetypeEngine.calculateArchetype({
    openness: archetype === 'creator' ? 85 : archetype === 'strategist' ? 80 : 50,
    conscientiousness: archetype === 'operator' ? 90 : archetype === 'strategist' ? 75 : 50,
    extraversion: archetype === 'connector' ? 85 : 40,
    agreeableness: archetype === 'connector' ? 80 : archetype === 'stabilizer' ? 80 : 50,
    neuroticism: archetype === 'stabilizer' ? 20 : 50,
  });

  const prompt = archetypeEngine.buildSystemPrompt({
    baseToneInstruction: result.toneInstruction,
    moodSnapshot: null,
    hasOptedIn: optIn,
    userName: 'أحمد',
  });

  return (
    <Card className="p-6 border-slate-200 shadow-sm">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <FiMessageCircle className="text-indigo-500" /> معاينة System Prompt
      </h3>

      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(ARCHETYPE_META) as string[]).filter(k => k !== 'emerging').map((key) => {
          const meta = ARCHETYPE_META[key];
          return (
            <Button
              key={key}
              variant={archetype === key ? 'default' : 'outline'}
              size="sm"
              className={`text-xs font-bold gap-1 ${archetype === key ? `bg-gradient-to-r ${meta.bgGradient} text-white border-none` : ''}`}
              onClick={() => setArchetype(key as ArchetypeName)}
            >
              {meta.emoji} {meta.label}
            </Button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="rounded" />
        <span className="text-xs font-bold text-slate-600">موافقة الخصوصية مفعلة</span>
      </div>

      <div className="bg-slate-900 text-green-400 p-4 rounded-xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
        {prompt}
      </div>

      <div className="mt-3 flex gap-2">
        <Badge className="bg-violet-100 text-violet-700 border-none text-[10px] font-bold">
          النمط: {ARCHETYPE_META[result.primary]?.emoji} {ARCHETYPE_META[result.primary]?.label}
        </Badge>
        <Badge className="bg-slate-100 text-slate-600 border-none text-[10px] font-bold">
          الثانوي: {ARCHETYPE_META[result.secondary]?.emoji} {ARCHETYPE_META[result.secondary]?.label}
        </Badge>
        <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-bold">
          التحية: {result.toneKeywords.greetingStyle}
        </Badge>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════

export default function ArchetypeDashboardPage() {
  const [userId, setUserId] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [archetypeData, setArchetypeData] = useState<any>(null);
  const [keywordStats, setKeywordStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!userId.trim()) {
      toast.error('أدخل معرف المستخدم');
      return;
    }
    setLoading(true);
    try {
      const [profileData, arcData, stats] = await Promise.all([
        advancedPsychologicalEngine.enrichProfile(userId),
        advancedPsychologicalEngine.getArchetypeForUser(userId),
        advancedPsychologicalEngine.getKeywordUsageStats(userId),
      ]);
      setProfile(profileData);
      setArchetypeData(arcData);
      setKeywordStats(stats);
    } catch (error) {
      toast.error('خطأ في جلب بيانات المستخدم');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const meta = archetypeData?.archetype ? ARCHETYPE_META[archetypeData.archetype] : ARCHETYPE_META['emerging'];

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/admin/ai-settings">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-indigo-600">
              <FiArrowRight className="rtl:rotate-180" /> العودة لإعدادات المحرك
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 col-span-2 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 text-white shadow-xl">
            <h2 className="text-xl font-black mb-1">🧠 محرك النماذج النفسية V5.2</h2>
            <p className="text-[11px] opacity-80 leading-relaxed">
              يحلل سلوك المستخدم عبر EXP Decay ويصنفه ضمن 5 نماذج شخصية (Archetypes)
              لتكييف نبرة الشات الذكي. يدعم كشف التحول العاطفي اللحظي.
            </p>
          </Card>

          <Card className="p-4 flex items-center gap-3 bg-slate-50 border-slate-200">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow">
              <FiShield size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600">الأمان</p>
              <p className="text-xs font-bold text-slate-700">RLS + search_path + EXP Decay</p>
            </div>
          </Card>
        </div>

        {/* Search User */}
        <Card className="p-5 border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <FiUser className="text-indigo-500" /> استعراض ملف مستخدم
          </h3>
          <div className="flex gap-3">
            <Input
              placeholder="أدخل معرف المستخدم (UUID)..."
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="bg-slate-50 border-slate-200 font-mono text-sm flex-1"
            />
            <Button onClick={handleSearch} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2">
              <FiSearch /> {loading ? 'جارٍ...' : 'بحث'}
            </Button>
          </div>
        </Card>

        {/* User Profile Result */}
        {profile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Archetype Card */}
            <Card className="p-0 overflow-hidden shadow-lg">
              <div className={`p-6 bg-gradient-to-br ${meta?.bgGradient || 'from-slate-400 to-slate-500'} text-white text-center`}>
                <p className="text-4xl mb-2">{meta?.emoji}</p>
                <h3 className="text-xl font-black">{meta?.label}</h3>
                <p className="text-[10px] opacity-80 mt-1">
                  {archetypeData?.secondary && `الثانوي: ${ARCHETYPE_META[archetypeData.secondary]?.label || archetypeData.secondary}`}
                </p>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold text-slate-400 mb-1">تعليمات النبرة لـ Gemini:</p>
                <p className="text-[11px] leading-relaxed text-slate-600 bg-slate-50 p-3 rounded-lg">
                  {archetypeData?.toneInstruction || 'لم يتحدد بعد'}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">الموافقة على التخصيص:</span>
                  <Badge className={archetypeData?.hasOptedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                    {archetypeData?.hasOptedIn ? '✅ مفعل' : '❌ غير مفعل'}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Traits Chart */}
            <Card className="p-5 col-span-2 border-slate-200 shadow-sm">
              <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                <FiCpu className="text-purple-500" /> الأبعاد الخمسة (Big Five)
              </h4>
              <div className="space-y-3">
                <TraitBar trait="openness" value={profile.dimensions?.openness?.final || 0} />
                <TraitBar trait="conscientiousness" value={profile.dimensions?.conscientiousness?.final || 0} />
                <TraitBar trait="extraversion" value={profile.dimensions?.extraversion?.final || 0} />
                <TraitBar trait="agreeableness" value={profile.dimensions?.agreeableness?.final || 0} />
                <TraitBar trait="neuroticism" value={profile.dimensions?.neuroticism?.final || 0} />
              </div>

              {/* Keyword Stats */}
              {keywordStats.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-xs font-bold text-slate-500 mb-2">أكثر الكلمات تأثيراً (آخر 20):</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {keywordStats.map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-[9px] font-bold bg-slate-100 text-slate-600 gap-1">
                        {kw.keyword_text}
                        <span className="text-slate-400">×{kw.usage_count}</span>
                        <span className="text-indigo-600">+{parseFloat(kw.total_impact).toFixed(1)}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Tools Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MoodTester />
          <PromptPreview />
        </div>

      </div>
    </div>
  );
}
