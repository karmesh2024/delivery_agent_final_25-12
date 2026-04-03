'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card } from '@/shared/ui/card';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import { FiBookOpen, FiCpu, FiZap, FiShield, FiArrowRight, FiCodesandbox, FiList } from 'react-icons/fi';

const SECTIONS = [
  {
    title: 'القاموس النفسي (NLP)',
    description: 'إدارة الكلمات المفتاحية التي يستخدمها المحرك لتحليل التعليقات وتحديث الملفات النفسية.',
    href: '/admin/ai-settings/dictionary',
    icon: FiBookOpen,
    gradient: 'from-indigo-500 to-blue-600',
    stats: 'EXP Decay V5.2',
  },
  {
    title: 'النماذج الشخصية (Archetypes)',
    description: 'استعراض الملفات النفسية للمستخدمين، اختبار كشف التحول العاطفي، ومعاينة System Prompt.',
    href: '/admin/ai-settings/archetypes',
    icon: FiCpu,
    gradient: 'from-violet-500 to-purple-600',
    stats: '5 نماذج + Mood Detection',
  },
  {
    title: 'محلل المحتوى',
    description: 'تحليل تعليقات المستخدمين في الوقت الفعلي ومشاهدة تأثير EXP Decay على الملف النفسي.',
    href: '/admin/ai-settings/analyzer',
    icon: FiZap,
    gradient: 'from-orange-500 to-red-500',
    stats: 'Diminishing Returns + Ceiling Cap',
  },
  {
    title: 'استوديو المحتوى الذكي',
    description: 'أتمتة محتوى غرف النادي، تحديد الأهداف الأسبوعية لكل غرفة، والبحث الذكي عن الأخبار المحلية.',
    href: '/admin/ai-settings/content-studio',
    icon: FiShield,
    gradient: 'from-emerald-500 to-teal-600',
    stats: 'Orchestrator V1.2',
  },
];

const ZOON_SECTIONS = [
  {
    title: 'إعدادات المساعد الذكي',
    description: 'واجهة موحدة لإدارة مهارات الوكيل، طابور المراجعة، مشغلات المهام، وسجلات التنفيذ.',
    href: '/admin/ai-settings/assistant',
    icon: FiCpu,
    gradient: 'from-indigo-600 to-purple-700',
    stats: 'Unified Control Center',
  }
];

export default function AISettingsPage() {
  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/club-zone/rooms/management">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-indigo-600">
              <FiArrowRight className="rtl:rotate-180" /> العودة لإدارة الغرف
            </Button>
          </Link>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur">
                <FiShield size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black">🧠 المحرك النفسي الهجين</h1>
                <p className="text-[11px] text-white/60">Moharram Bek Psychology Engine V5.2</p>
              </div>
            </div>

            <p className="text-sm text-white/70 leading-relaxed max-w-xl">
              يجمع بين قوة الأرقام (Big Five + SQL) ومعنى الذكاء الاصطناعي (Gemini)
              لفهم احتياجات أهل محرم بك النفسية وتكييف التجربة لكل مستخدم.
            </p>

            <div className="flex gap-2 mt-4">
              <span className="text-[9px] bg-white/10 px-3 py-1 rounded-full font-bold">EXP Decay</span>
              <span className="text-[9px] bg-white/10 px-3 py-1 rounded-full font-bold">Time Decay 30d</span>
              <span className="text-[9px] bg-white/10 px-3 py-1 rounded-full font-bold">Mood Detection</span>
              <span className="text-[9px] bg-white/10 px-3 py-1 rounded-full font-bold">Privacy Opt-In</span>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SECTIONS.map((section, i) => (
            <Link key={section.href} href={section.href}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer h-full"
              >
                <Card className="p-0 overflow-hidden border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  <div className={`p-5 bg-gradient-to-r ${section.gradient} text-white`}>
                    <section.icon size={28} className="mb-3 opacity-90" />
                    <h3 className="text-sm font-black">{section.title}</h3>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                      {section.description}
                    </p>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-bold self-start">
                      {section.stats}
                    </span>
                  </div>
                </Card>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Zoon OS Section */}
        <div className="pt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-[2px] flex-1 bg-slate-100" />
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <FiCodesandbox className="text-indigo-600" />
              مركز تحكم Zoon OS
            </h2>
            <div className="h-[2px] flex-1 bg-slate-100" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ZOON_SECTIONS.map((section, i) => (
              <Link key={section.href} href={section.href}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 + 0.5 }}
                  className="group cursor-pointer h-full"
                >
                  <Card className="p-0 overflow-hidden border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col group">
                    <div className={`p-6 bg-gradient-to-br ${section.gradient} text-white relative overflow-hidden`}>
                      <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <section.icon size={100} />
                      </div>
                      <section.icon size={32} className="mb-4 relative z-10" />
                      <h3 className="text-xl font-black relative z-10">{section.title}</h3>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between bg-white relative z-10">
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        {section.description}
                      </p>
                      <div className="flex items-center justify-between">
                         <span className="text-[9px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black">
                           {section.stats}
                         </span>
                         <FiArrowRight className="text-slate-300 group-hover:text-indigo-600 transition-colors rtl:rotate-180" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
