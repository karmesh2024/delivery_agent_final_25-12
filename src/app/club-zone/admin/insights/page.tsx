'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { FiActivity, FiTarget, FiTrendingUp, FiPieChart, FiHeart, FiZap, FiBox } from "react-icons/fi";

const personalityData = [
  { subject: 'Openness', A: 85, fullMark: 100 },
  { subject: 'Conscientiousness', A: 65, fullMark: 100 },
  { subject: 'Extraversion', A: 90, fullMark: 100 },
  { subject: 'Agreeableness', A: 70, fullMark: 100 },
  { subject: 'Neuroticism', A: 40, fullMark: 100 },
];

const engagementData = [
  { name: 'السبت', visits: 400, actions: 240 },
  { name: 'الأحد', visits: 300, actions: 139 },
  { name: 'الاثنين', visits: 200, actions: 980 },
  { name: 'الثلاثاء', visits: 278, actions: 390 },
  { name: 'الأربعاء', visits: 189, actions: 480 },
  { name: 'الخميس', visits: 239, actions: 380 },
  { name: 'الجمعة', visits: 349, actions: 430 },
];

const archetypeData = [
  { name: 'Innovators', value: 400 },
  { name: 'Leaders', value: 300 },
  { name: 'Harmonizers', value: 300 },
  { name: 'Analysts', value: 200 },
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

export default function InsightsPage() {
  return (
    <DashboardLayout title="نبض زوون (Zoon Pulse) - تحليلات 2026">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FiActivity className="text-rose-500 animate-pulse" /> نبض النادي والتحليلات الذكية
            </h1>
            <p className="text-gray-500">تحليل الأثر النفسي والسلوكي لأعضاء نادي زوون</p>
          </div>
          <div className="flex gap-2">
             <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-bold border border-green-200 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                مراقبة مباشرة (Live)
             </div>
          </div>
        </div>

        {/* Scorecards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-sm font-medium">معدل التوافق العام</p>
                  <h3 className="text-3xl font-bold mt-1">88%</h3>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <FiHeart className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 text-xs flex items-center gap-1 text-blue-100">
                <FiTrendingUp /> زيادة بنسبة 4% عن الشهر الماضي
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">الأثر البيئي (كجم)</p>
                  <h3 className="text-3xl font-bold mt-1">1,240</h3>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <FiBox className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-4 text-xs text-emerald-100">تم جمعها من خلال مهام الغرف</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-amber-100 text-sm font-medium">نقاط Bazzzz الموزعة</p>
                  <h3 className="text-3xl font-bold mt-1">45.2K</h3>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <FiZap className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-4 text-xs text-amber-100">تفاعل اجتماعي نشط</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-purple-100 text-sm font-medium">اكتمال الـ Profiling</p>
                  <h3 className="text-3xl font-bold mt-1">92%</h3>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <FiTarget className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-4 text-xs text-purple-100">دقة عالية في تحليل الشخصية</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart: Personality Distribution */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiTarget className="text-indigo-600" /> البصمة النفسية للنادي (Psychological Fingerprint)
              </CardTitle>
              <CardDescription>توزيع سمات الشخصية الخمس الكبرى لمجتمع النادي الحالي</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={personalityData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Zoon Members"
                    dataKey="A"
                    stroke="#4f46e5"
                    fill="#4f46e5"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart: Weekly Activity */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiTrendingUp className="text-emerald-600" /> نبض النشاط الأسبوعي
              </CardTitle>
              <CardDescription>مقارنة بين الزيارات والتفاعلات الفعلية خلال الأيام الماضية</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="visits" name="الزيارات" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actions" name="التفاعلات" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart: Archetypes */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiPieChart className="text-amber-600" /> تحليل الأنماط الشخصية (Archetypes)
              </CardTitle>
              <CardDescription>توزيع المستخدمين بناءً على خوارزمية الأنماط (AI Detect)</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={archetypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {archetypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="middle" align="right" layout="vertical" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Area Chart: Growth */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiActivity className="text-rose-600" /> منحنى التأثير الاجتماعي
              </CardTitle>
              <CardDescription>نمو قوة الروابط داخل الدوائر الكونية</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagementData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="actions" stroke="#f43f5e" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
