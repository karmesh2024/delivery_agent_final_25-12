'use client';

import React, { useEffect, useState } from 'react';
import { abTestingService } from '../../services/zoonABTestingService';
import { Activity, Users, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// تعريف أنواع البيانات للعرض
interface DashboardMetrics {
  totalUsers: number;
  groupA: { count: number; avgHarmony: number; retention7Day: number };
  groupB: { count: number; avgHarmony: number; retention7Day: number };
  guardrails: { safe: boolean; violations: string[] };
}

export const MindEngineDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const liveMetrics = await abTestingService.getDashboardMetrics();
      setMetrics(liveMetrics);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-500 gap-4">
        <Activity className="w-12 h-12 animate-spin text-indigo-600" />
        <span className="animate-pulse font-medium">جاري استدعاء العقل المحرك (Connecting to Mind Engine)... 🧠</span>
      </div>
    );
  }

  if (!metrics) return null;

  const harmonyImprovement = ((metrics.groupB.avgHarmony - metrics.groupA.avgHarmony) / metrics.groupA.avgHarmony) * 100;
  const retentionImprovement = ((metrics.groupB.retention7Day - metrics.groupA.retention7Day) / metrics.groupA.retention7Day) * 100;
  const winner = harmonyImprovement > 0 && retentionImprovement > 0 ? 'B' : 'A';

  return (
    <div className="space-y-8 p-6 bg-slate-50 min-h-screen" dir="rtl">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-8 h-8 text-indigo-600" />
            لوحة العقل المحرك (The Mind)
          </h1>
          <p className="text-slate-500 mt-1">مراقبة التجارب والخوارزميات النفسية الحية</p>
        </div>
        <div className="flex gap-2">
           <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold border border-green-200 flex items-center gap-1">
             <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
             نظام A/B نشط
           </span>
        </div>
      </div>

      {/* Guardrails Status */}
      <Card className={`border-l-4 ${metrics.guardrails.safe ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                {metrics.guardrails.safe ? <CheckCircle className="text-green-500 w-8 h-8" /> : <AlertTriangle className="text-red-500 w-8 h-8" />}
                <div>
                    <h3 className="text-lg font-bold text-slate-900">حالة خطوط الحماية (Guardrails)</h3>
                    <p className="text-slate-500 text-sm">
                        {metrics.guardrails.safe 
                            ? 'جميع المؤشرات الحيوية للنظام تعمل ضمن الحدود الآمنة.' 
                            : 'هناك انتهاك لبعض معايير السلامة! يرجى التدخل.'}
                    </p>
                </div>
            </div>
            {!metrics.guardrails.safe && (
                <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold">إيقاف التجربة فوراً</button>
            )}
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Users */}
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">إجمالي المشاركين</CardTitle></CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-slate-900">{metrics.totalUsers.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1 flex justify-between">
                    <span>A: {metrics.groupA.count}</span>
                    <span>B: {metrics.groupB.count}</span>
                </div>
            </CardContent>
        </Card>

        {/* Harmony Score */}
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">متوسط التوافق (Harmony)</CardTitle></CardHeader>
            <CardContent>
                <div className="flex items-end gap-2">
                    <div className="text-3xl font-bold text-slate-900">{metrics.groupB.avgHarmony.toFixed(1)}</div>
                    <span className={`text-sm font-bold mb-1 ${harmonyImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {harmonyImprovement > 0 ? '+' : ''}{harmonyImprovement.toFixed(1)}%
                    </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">مقارنة بالمجموعة A: {metrics.groupA.avgHarmony.toFixed(1)}</div>
            </CardContent>
        </Card>

        {/* Retention */}
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">معدل البقاء (7-Day)</CardTitle></CardHeader>
            <CardContent>
                <div className="flex items-end gap-2">
                    <div className="text-3xl font-bold text-slate-900">{(metrics.groupB.retention7Day * 100).toFixed(0)}%</div>
                    <span className={`text-sm font-bold mb-1 ${retentionImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {retentionImprovement > 0 ? '+' : ''}{retentionImprovement.toFixed(1)}%
                    </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">مقارنة بالمجموعة A: {(metrics.groupA.retention7Day * 100).toFixed(0)}%</div>
            </CardContent>
        </Card>

      </div>

      {/* Comparison Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white">
              <CardHeader>
                  <CardTitle>تحليل النتائج الحالية</CardTitle>
                  <CardDescription>الاستراتيجية B (الجريئة) تظهر تفوقاً ملحوظاً</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-6">
                      {/* Harmony Comparison Bar */}
                      <div>
                          <div className="flex justify-between text-sm mb-1">
                              <span>التوافق (Harmony)</span>
                              <span className="font-bold text-green-600">B تتفوق بـ {harmonyImprovement.toFixed(1)}%</span>
                          </div>
                          <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
                              <div style={{ width: '48%' }} className="bg-slate-400 h-full relative group">
                                  <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white opacity-0 group-hover:opacity-100">A</span>
                              </div>
                              <div style={{ width: '52%' }} className="bg-indigo-600 h-full relative group">
                                <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white opacity-0 group-hover:opacity-100">B</span>
                              </div>
                          </div>
                      </div>

                       {/* Retention Comparison Bar */}
                       <div>
                          <div className="flex justify-between text-sm mb-1">
                              <span>البقاء (Retention)</span>
                              <span className="font-bold text-green-600">B تتفوق بـ {retentionImprovement.toFixed(1)}%</span>
                          </div>
                          <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
                              <div style={{ width: '45%' }} className="bg-slate-400 h-full"></div>
                              <div style={{ width: '55%' }} className="bg-teal-500 h-full"></div>
                          </div>
                      </div>
                  </div>
                  
                  <div className="mt-8 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                      <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                          <BarChart2 className="w-4 h-4" />
                          توصية العقل (AI Recommendation)
                      </h4>
                      <p className="text-sm text-indigo-700 mt-1">
                          بناءً على البيانات الحالية، الاستراتيجية <strong>(B)</strong> تحقق توازناً أفضل للدائرة. 
                          يُنصح بالانتظار <strong>4 أيام</strong> أخرى قبل اعتمادها رسمياً للوصول لمستوى ثقة 95%.
                      </p>
                  </div>
              </CardContent>
          </Card>
          
          <Card className="bg-white">
              <CardHeader>
                  <CardTitle>الإعدادات الحالية (Configuration)</CardTitle>
                  <CardDescription>المتحكمات في التجربة الحية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                      <span className="text-sm font-medium">اسم التجربة</span>
                      <code className="text-xs bg-slate-200 px-2 py-1 rounded">weight_strategy_v1</code>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                      <span className="text-sm font-medium">حجم العينة المستهدف</span>
                      <span className="text-sm font-bold">1000 مستخدم / مجموعة</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                      <span className="text-sm font-medium">الحد الأدنى للتوافق (Guardrail)</span>
                      <span className="text-sm font-bold text-red-600">60%</span>
                  </div>
                  <div className="border-t pt-4 mt-4">
                      <p className="text-xs text-slate-400 mb-2">منطقة الخطر</p>
                      <button className="w-full py-2 border border-red-200 text-red-600 rounded hover:bg-red-50 text-sm font-medium transition-colors">
                          إعادة تعيين التجربة (Reset Experiment)
                      </button>
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
};
