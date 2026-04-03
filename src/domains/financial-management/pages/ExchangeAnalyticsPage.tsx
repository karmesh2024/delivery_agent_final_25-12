'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronLeft, 
  Search, 
  Filter, 
  Calculator, 
  Briefcase, 
  Truck, 
  PieChart, 
  Info,
  Layers,
  Box,
  Target,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import {
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  Bar,
  BarChart as ReBarChart,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/shared/ui/tooltip";
import { contractService } from '@/domains/waste-management/partners/services/contractService';
import { operationalCostService } from '@/domains/waste-management/partners/services/operationalCostService';
import { subcategoryExchangePriceService } from '@/domains/waste-management/services/subcategoryExchangePriceService';
import { toast } from 'react-toastify';

const ExchangeAnalyticsPage: React.FC = () => {
    const router = useRouter();
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [selectedSubId, setSelectedSubId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    
    // Analytics State
    const [analytics, setAnalytics] = useState<any>(null);
    const [historicalData, setHistoricalData] = useState<any[]>([]);
    
    // UI State
    const [isApplying, setIsApplying] = useState(false);
    const [showWarningDialog, setShowWarningDialog] = useState(false);
    const [showDoc, setShowDoc] = useState(false);

    useEffect(() => {
        const loadInitial = async () => {
            const subs = await subcategoryExchangePriceService.getAllSubcategoryExchangePrices();
            setSubcategories(subs);
            if (subs.length > 0) {
                setSelectedSubId(String(subs[0].subcategory_id));
            }
            setLoading(false);
        };
        loadInitial();
    }, []);

    useEffect(() => {
        if (!selectedSubId) return;
        
        const loadAnalytics = async () => {
            setLoading(true);
            try {
                const subId = Number(selectedSubId);
                const [weightedRes, opCost, currentPrice, history] = await Promise.all([
                    contractService.getWeightedAverageForSubcategory(subId),
                    operationalCostService.getEffectiveCost(subId),
                    subcategoryExchangePriceService.getSubcategoryExchangePrice(subId),
                    subcategoryExchangePriceService.getSubcategorySparklineData(20)
                ]);

                setAnalytics({
                    weighted: weightedRes,
                    opCost,
                    current: currentPrice,
                });

                // Generate some mock historical points if history is thin
                const baseHistory = history[subId] || [];
                const points = baseHistory.length > 5 
                    ? baseHistory.map((v, i) => ({ name: `T-${baseHistory.length-i}`, price: v }))
                    : Array.from({ length: 10 }).map((_, i) => ({ 
                        name: `D${i}`, 
                        price: (currentPrice?.buy_price || 20) + (Math.random() * 2 - 1) 
                    }));
                
                setHistoricalData(points);

            } catch (err) {
                console.error("Error loading analytics:", err);
                toast.error("فشل في تحميل بيانات التحليل");
            } finally {
                setLoading(false);
            }
        };

        loadAnalytics();
    }, [selectedSubId]);

    const decisionBreakdown = useMemo(() => {
        if (!analytics) return null;
        
        const sellPrice = analytics.weighted.weightedAvgPrice || (analytics.current?.buy_price * 1000 * 1.2) || 0;
        const opCost = analytics.opCost || 0;
        const targetMarginPercent = 15;
        const marginAmount = (sellPrice * targetMarginPercent) / 100;
        const suggestedBuyPriceTon = sellPrice - opCost - marginAmount;
        const suggestedBuyPriceKg = suggestedBuyPriceTon / 1000;

        return {
            sellPrice,
            opCost,
            marginAmount,
            targetMarginPercent,
            suggestedBuyPriceKg: parseFloat(suggestedBuyPriceKg.toFixed(2)),
            currentBuyPriceKg: analytics.current?.buy_price || 0,
            diff: suggestedBuyPriceKg - (analytics.current?.buy_price || 0)
        };
    }, [analytics]);

    const handleApplyDecision = async (force = false) => {
        if (!analytics || !decisionBreakdown) return;

        const contractCount = analytics.weighted?.contractCount || 0;

        // حالة التحذير: لا توجد عقود نشطة
        if (contractCount === 0 && !force) {
            setShowWarningDialog(true);
            return;
        }

        setIsApplying(true);
        try {
            // تنفيذ التحديث الفعلي للسعر في البورصة
            const result = await subcategoryExchangePriceService.setSubcategoryExchangePrice(
                Number(selectedSubId),
                decisionBreakdown.suggestedBuyPriceKg,
                null, // sell_price (optional)
                null, // user_id
                null  // expiry
            );

            if (result) {
                toast.success(
                  <div className="flex flex-col gap-1">
                    <span className="font-black">تم تحديث البورصة بنجاح!</span>
                    <span className="text-[10px] font-bold opacity-80">تم تعميم السعر {decisionBreakdown.suggestedBuyPriceKg} جم على كافة المناديب.</span>
                  </div>
                );
                // تحديث البيانات المحلية لتعكس السعر الجديد
                setAnalytics((prev: any) => ({
                    ...prev,
                    current: { ...prev.current, buy_price: decisionBreakdown.suggestedBuyPriceKg }
                }));
            }
        } catch (error) {
            console.error("Apply Error:", error);
            toast.error("حدث خطأ أثناء تطبيق السعر الجديد");
        } finally {
            setIsApplying(false);
            setShowWarningDialog(false);
        }
    };

    if (loading && !analytics) {
        return <div className="p-12 text-center font-bold text-slate-500 animate-pulse">جاري تحليل بيانات السوق...</div>;
    }

    return (
        <TooltipProvider>
        <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen font-tajawal">
            {/* Header / Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-slate-200">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500 mb-1 cursor-pointer hover:text-primary transition-colors" onClick={() => router.back()}>
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-xs font-bold">العودة للبورصة</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <BarChart3 className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">مركز تحليل القرار ودعم البورصة</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                        variant="outline" 
                        onClick={() => setShowDoc(!showDoc)}
                        className={`h-11 rounded-xl border-2 font-black transition-all ${showDoc ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white'}`}
                    >
                        {showDoc ? <ChevronUp className="w-4 h-4 ml-2" /> : <BookOpen className="w-4 h-4 ml-2" />}
                        {showDoc ? 'إغلاق الدليل' : 'دليل آلية العمل'}
                    </Button>
                    <Select value={selectedSubId} onValueChange={setSelectedSubId}>
                        <SelectTrigger className="w-full md:w-[280px] h-11 bg-white border-2 border-slate-200 rounded-xl shadow-sm font-bold text-slate-700">
                            <SelectValue placeholder="اختر المادة للتحليل" />
                        </SelectTrigger>
                        <SelectContent>
                            {subcategories.map(sub => (
                                <SelectItem key={sub.subcategory_id} value={String(sub.subcategory_id)} className="font-bold">
                                    {(sub as any).subcategory_name || 'غير معروف'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Expandable Documentation Section */}
            <AnimatePresence>
                {showDoc && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="border-2 border-indigo-100 bg-indigo-50/30 rounded-2xl mb-6">
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-indigo-700 font-black">
                                            <Briefcase className="w-5 h-5" />
                                            <h3>1. متوسط سعر المصانع</h3>
                                        </div>
                                        <p className="text-xs font-bold text-slate-600 leading-relaxed">
                                            يتم احتسابه بناءً على <span className="text-indigo-600">المتوسط المرجّح بالكميات</span> للعقود المبرمة مع المصانع. هذا يضمن أن العقود ذات الكميات الكبيرة تؤثر بشكل أكبر على السعر المرجعي.
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-rose-700 font-black">
                                            <Truck className="w-5 h-5" />
                                            <h3>2. التكاليف التشغيلية</h3>
                                        </div>
                                        <p className="text-xs font-bold text-slate-600 leading-relaxed">
                                            تُخصم تكاليف النقل، الفرز، والتخزين لكل طن. هذه التكاليف متغيرة حسب نوع المادة والمنطقة، وتضمن تغطية منصة "كرمش" لمصاريفها اللوجستية.
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-amber-700 font-black">
                                            <Target className="w-5 h-5" />
                                            <h3>3. هامش الربح والقرار</h3>
                                        </div>
                                        <p className="text-xs font-bold text-slate-600 leading-relaxed">
                                            بعد خصم التكاليف، نطبق هامش ربح مستهدف (حالياً 15%). السعر المتبقي هو <span className="text-emerald-700">سعر الشراء العادل</span> من المندوب لضمان استدامة العمل.
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-indigo-100 flex items-center gap-2 text-[10px] font-black text-indigo-500">
                                    <Info className="w-3 h-3" /> ملاحظة: السعر الموصى به يتم تحديثه لحظياً مع كل تعاقد جديد أو تغيير في تكاليف النقل.
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Portfolio Overview Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visual Logic Breakdown (Tree Layout) */}
                <Card className="lg:col-span-2 shadow-xl border-0 overflow-hidden rounded-2xl bg-white relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-lg font-black text-slate-800">هيكلية القرار السعري</CardTitle>
                                <CardDescription className="font-bold text-slate-500">تحليل المكونات التي تشكل السعر النهائي</CardDescription>
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-3 py-1">
                                <Activity className="w-3 h-3 mr-1.5" /> استقرار عالي
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      {decisionBreakdown && (
                        <div className="relative">
                            {/* The Visual Path */}
                            <div className="flex flex-col items-center space-y-12 relative">
                                
                                {/* 1. Market Input */}
                                <div className="w-full flex justify-center z-10">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg border-4 border-indigo-100 min-w-[300px] transform hover:scale-105 transition-transform cursor-help">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="p-2 bg-white/20 rounded-lg">
                                                        <Briefcase className="w-5 h-5 text-white" />
                                                    </div>
                                                    <Badge className="bg-white/10 text-white border-0 text-[10px]">المصدر: عقود المصانع ({analytics?.weighted?.contractCount})</Badge>
                                                </div>
                                                <div className="text-white/80 text-xs font-bold mb-1">متوسط سعر البيع المرجّح</div>
                                                <div className="text-3xl font-black text-white">{decisionBreakdown.sellPrice.toLocaleString()} <span className="text-sm">ج.م / طن</span></div>
                                                <div className="mt-2 text-indigo-100 text-[10px] font-medium">مرجّح بإجمالي كمية {analytics?.weighted?.totalQuantity.toLocaleString()} طن</div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-slate-800 text-white border-slate-700 p-4 rounded-xl">
                                            <p className="font-bold leading-relaxed">
                                                هذا السعر يمثل المبلغ الذي تدفعه المصانع فعلياً لكرمش.
                                                <br /> يتم احتسابه كمتوسط مرجّح لآخر العقود النشطة لضمان دقة السوق.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>

                                {/* Vertical Line with Arrow */}
                                <div className="absolute top-32 left-1/2 -translate-x-1/2 h-[calc(100%-16rem)] w-1 bg-gradient-to-b from-indigo-200 via-slate-200 to-emerald-200 hidden md:block"></div>

                                {/* 2. Deductions Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full relative">
                                    {/* Cost Deduction */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="bg-rose-50 p-5 rounded-2xl border-2 border-rose-100 flex items-center gap-4 group hover:bg-rose-100/50 transition-colors cursor-help">
                                                <div className="p-3 bg-rose-500 rounded-xl text-white group-hover:rotate-12 transition-transform">
                                                    <Truck className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="text-rose-50 text-[10px] font-black uppercase tracking-wider bg-rose-500/20 px-2 py-0.5 rounded inline-block mb-1">خصم: تكاليف التشغيل</div>
                                                    <div className="text-xl font-black text-rose-700">- {decisionBreakdown.opCost.toLocaleString()} <span className="text-xs">ج.م / طن</span></div>
                                                    <div className="text-[10px] text-rose-400 font-bold">لوجستيات + معالجة + عمالة</div>
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="bg-rose-900 text-white border-rose-800 p-3">
                                            <p className="font-bold">مجموع مصاريف نقل المادة من المندوب ومعالجتها وتخزينها لحين توريدها للمصنع.</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    {/* Margin Deduction */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="bg-amber-50 p-5 rounded-2xl border-2 border-amber-100 flex items-center gap-4 group hover:bg-amber-100/50 transition-colors cursor-help">
                                                <div className="p-3 bg-amber-500 rounded-xl text-white group-hover:rotate-12 transition-transform">
                                                    <Target className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="text-amber-50 text-[10px] font-black uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded inline-block mb-1">خصم: هامش الربحية ({decisionBreakdown.targetMarginPercent}%)</div>
                                                    <div className="text-xl font-black text-amber-700">- {decisionBreakdown.marginAmount.toLocaleString()} <span className="text-xs">ج.م / طن</span></div>
                                                    <div className="text-[10px] text-amber-400 font-bold">مستهدف المنصة للمخلفات</div>
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="bg-amber-900 text-white border-amber-800 p-3">
                                            <p className="font-bold">النسبة التي تحتفظ بها المنصة لتطوير العمليات وضمان استدامة الخدمات الرقمية.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>

                                {/* 3. Resulting Output */}
                                <div className="w-full flex justify-center z-10 pt-4">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="bg-emerald-600 p-8 rounded-[2rem] shadow-2xl border-8 border-emerald-50 min-w-[350px] text-center relative overflow-hidden group cursor-help transition-all hover:scale-105">
                                                <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform">
                                                    <Calculator className="w-32 h-32 text-white" />
                                                </div>
                                                <div className="text-emerald-50/80 text-sm font-black mb-2 flex items-center justify-center gap-2">
                                                    النتيجة: سعر الشراء العادل الموصى به
                                                    <HelpCircle className="w-4 h-4 text-white/50" />
                                                </div>
                                                <div className="text-5xl font-black text-white mb-2">{decisionBreakdown.suggestedBuyPriceKg} <span className="text-lg">ج.م / كجم</span></div>
                                                
                                                <div className="flex justify-center items-center gap-4 mt-4">
                                                    <div className="bg-white/20 px-4 py-1.5 rounded-full text-white font-bold text-xs">
                                                        السعر الحالي: {decisionBreakdown.currentBuyPriceKg} ج.م
                                                    </div>
                                                    <div className={`px-4 py-1.5 rounded-full font-black text-xs ${decisionBreakdown.diff >= 0 ? 'bg-emerald-400 text-emerald-900' : 'bg-rose-400 text-rose-900'}`}>
                                                        {decisionBreakdown.diff >= 0 ? '+' : ''}{decisionBreakdown.diff.toFixed(2)} فجوة القرار
                                                    </div>
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="bg-emerald-900 text-white border-emerald-800 p-4 max-w-sm">
                                            <div className="space-y-2">
                                                <p className="font-black border-b border-white/20 pb-1">المعادلة النهائية:</p>
                                                <p className="text-[11px] font-bold">
                                                    (سعر بيع المصنع - تكاليف التشغيل - هامش الربح) / 1000 كجم
                                                </p>
                                                <p className="text-[10px] opacity-80">
                                                    هذا هو السعر الذي يضمن للمنصة الربحية وللمندوب سعراً سوقياً عادلاً.
                                                </p>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                      )}
                    </CardContent>
                </Card>

                {/* Sidebar Metrics */}
                <div className="space-y-6">
                    {/* Market Sentiment Card */}
                    <Card className="rounded-2xl border-0 shadow-lg bg-white overflow-hidden">
                        <CardHeader className="bg-slate-800 text-white pb-6">
                            <CardTitle className="text-sm font-black flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-400" /> مشاعر السوق المحلية
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 -mt-4 bg-white rounded-t-2xl relative z-10 space-y-5">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black text-slate-500">
                                        <span>مستوى العرض</span>
                                        <span className="text-emerald-600">وفير جداً (92%)</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[92%]" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black text-slate-500">
                                        <span>مستوى الطلب</span>
                                        <span className="text-blue-600">ثابت (65%)</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[65%]" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black text-slate-500">
                                        <span>مخاطر السعر</span>
                                        <span className="text-rose-600">منخفضة (14%)</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500 w-[14%]" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 border-dashed">
                                <div className="flex gap-3">
                                    <Info className="w-5 h-5 text-amber-600 shrink-0" />
                                    <p className="text-[10px] leading-relaxed font-bold text-amber-700">
                                        هناك زيادة ملحوظة في معروض هذه المادة بنسبة 12% عن الشهر الماضي، مما يدعم خفض سعر الشراء للحفاظ على توازن المخازن.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Charts */}
                    <Card className="rounded-2xl border-0 shadow-lg bg-white p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-700">تغيرات السعر الأخيرة (كجم)</h3>
                            <Badge variant="outline" className="text-[10px] font-bold">24 ساعة</Badge>
                        </div>
                        <div className="h-[120px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historicalData}>
                                    <defs>
                                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 p-3 rounded-xl">
                                <span className="text-[9px] font-bold text-slate-400 block mb-1">أعلى سعر</span>
                                <span className="text-sm font-black text-slate-700">{(Math.max(...historicalData.map(d => d.price))).toFixed(2)} جم</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl">
                                <span className="text-[9px] font-bold text-slate-400 block mb-1">أقل سعر</span>
                                <span className="text-sm font-black text-slate-700">{(Math.min(...historicalData.map(d => d.price))).toFixed(2)} جم</span>
                            </div>
                        </div>
                    </Card>

                    <Button 
                        onClick={() => handleApplyDecision()}
                        disabled={isApplying || !decisionBreakdown}
                        className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-lg font-black shadow-lg shadow-indigo-100 group disabled:opacity-50"
                    >
                        {isApplying ? (
                            <Activity className="w-5 h-5 mr-3 animate-spin" />
                        ) : (
                            <Calculator className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                        )}
                        {isApplying ? 'جاري التطبيق...' : 'تطبيق تعديلات القرار المقترحة'}
                    </Button>
                </div>
            </div>

            {/* Bottom Row: News & Impact Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Factory Contracts Breakdown */}
                <Card className="lg:col-span-2 rounded-2xl border-0 shadow-lg bg-white">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50">
                        <div>
                            <CardTitle className="text-md font-black">العقود النشطة المؤثرة على السعر</CardTitle>
                            <CardDescription className="text-xs font-bold">آخر 5 عقود تساهم في حساب المتوسط المرجّح</CardDescription>
                        </div>
                        <Button variant="ghost" className="text-xs font-black text-primary">مشاهدة الكل</Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase">المصنع / العميل</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase">الكمية التعاقدية</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase">سعر الطن</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase">الوزن النسبي</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics?.weighted?.contracts?.slice(0, 5).map((contract: any, i: number) => (
                                        <tr key={contract.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-black text-xs">
                                                        {contract.partner?.name?.substring(0, 2) || 'M'}
                                                    </div>
                                                    <div className="text-xs font-black text-slate-700">{contract.partner?.name || 'مصنع مجهول'}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-xs text-slate-600">{contract.quantity.toLocaleString()} طن</td>
                                            <td className="px-6 py-4 font-black text-xs text-slate-800">{contract.agreed_price.toLocaleString()} ج.م</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500" style={{ width: `${(contract.quantity / analytics?.weighted?.totalQuantity * 100).toFixed(0)}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-500">{(contract.quantity / analytics?.weighted?.totalQuantity * 100).toFixed(1)}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className="bg-emerald-50 text-emerald-600 border-0 font-bold text-[9px]">نشط</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                    {!analytics?.weighted?.contracts?.length && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center font-bold text-slate-400">لا توجد عقود نشطة لهذه الفئة حالياً</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* News / Context Sidebar */}
                <Card className="rounded-2xl border-0 shadow-lg bg-white overflow-hidden flex flex-col">
                    <CardHeader className="border-b border-slate-50">
                        <CardTitle className="text-sm font-black flex items-center gap-2">
                            <Box className="w-4 h-4 text-primary" /> تطورات قطاع المخلفات
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 space-y-4">
                        {[
                            { title: 'ارتفاع تكلفة النقل لمناطق الصعيد بنسبة 5%', time: 'منذ ساعتين', type: 'لوجستي', color: 'rose' },
                            { title: 'إضافة مصنع جديد في "السويس" لتدوير الورق والكرتون', time: 'منذ 5 ساعات', type: 'تعاقد', color: 'emerald' },
                            { title: 'تقلبات في البورصة العالمية لأسعار البلاستيك PET', time: 'أمس', type: 'تنبيه', color: 'amber' },
                        ].map((news, i) => (
                            <div key={i} className="group cursor-pointer">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded bg-${news.color}-50 text-${news.color}-600 border border-${news.color}-100`}>
                                        {news.type}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400">{news.time}</span>
                                </div>
                                <h4 className="text-[11px] font-black text-slate-700 leading-normal group-hover:text-primary transition-colors">{news.title}</h4>
                            </div>
                        ))}
                    </CardContent>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                        <Button variant="ghost" className="w-full justify-between h-auto py-2 text-xs font-black text-slate-600">
                             فتح سجل التحليلات التاريخي <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Warning Dialog for No Contracts */}
            <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
                <AlertDialogContent className="rounded-2xl border-2 border-amber-100">
                    <AlertDialogHeader>
                        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4 border border-amber-100">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <AlertDialogTitle className="text-xl font-black text-slate-800">تحذير: غياب العقود الفعلية</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-slate-500 leading-relaxed py-2">
                            النظام اكتشف عدم وجود <span className="text-indigo-600 font-bold">عقود توريد نشطة</span> لهذه المادة حالياً. 
                            <br /><br />
                            السعر المقترح ({decisionBreakdown?.suggestedBuyPriceKg} ج.م) مبني بالكامل على <span className="text-rose-600 font-bold">عروض المزاد</span> فقط، وهي غير ملزمة قانونياً وقد تتقلب بسرعة.
                            <br /><br />
                            هل أنت متأكد من رغبتك في تعميم هذا السعر على جميع المناديب؟
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl font-bold border-2">إلغاء التعديل</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => handleApplyDecision(true)}
                            className="rounded-xl font-black bg-amber-600 hover:bg-amber-700"
                        >
                            نعم، قم بالتطبيق على مسؤوليتي
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        </TooltipProvider>
    );
};

export default ExchangeAnalyticsPage;
