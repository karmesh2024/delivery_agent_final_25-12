'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { 
  FiTrendingUp, 
  FiTrendingDown,
  FiDollarSign,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiBarChart2,
  FiCalendar,
  FiDownload
} from "react-icons/fi";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Loader2 } from "lucide-react";
import { ProfitabilityCharts } from './components/ProfitabilityCharts';

interface ProfitabilityStats {
  total_buy: number;
  total_sell: number;
  total_profit: number;
  average_profit_margin: number;
  session_count: number;
  period: string;
}

interface ProfitabilitySession {
  id: string;
  customer_id: string;
  customer_name?: string;
  status: string;
  is_settled: boolean;
  buy_total: number;
  sell_total: number;
  platform_profit: number;
  profit_margin: number;
  created_at: string;
  completed_at?: string;
}

export default function ProfitabilityPage() {
  const [stats, setStats] = useState<ProfitabilityStats | null>(null);
  const [sessions, setSessions] = useState<ProfitabilitySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [chartsLoading, setChartsLoading] = useState(false);
  
  // Filters
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [minProfit, setMinProfit] = useState('');
  const [maxProfit, setMaxProfit] = useState('');
  const [minMargin, setMinMargin] = useState('');
  const [maxMargin, setMaxMargin] = useState('');
  const [settledFilter, setSettledFilter] = useState<string>('all');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period: period
      });
      
      if (period === 'custom' && fromDate && toDate) {
        params.append('from_date', fromDate);
        params.append('to_date', toDate);
      }

      const response = await fetch(`/api/admin/profitability?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [period, fromDate, toDate]);

  const fetchSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (minProfit) params.append('min_profit', minProfit);
      if (maxProfit) params.append('max_profit', maxProfit);
      if (minMargin) params.append('min_margin', minMargin);
      if (maxMargin) params.append('max_margin', maxMargin);
      if (settledFilter !== 'all') {
        params.append('is_settled', settledFilter === 'settled' ? 'true' : 'false');
      }

      const response = await fetch(`/api/admin/profitability/sessions?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  }, [page, fromDate, toDate, minProfit, maxProfit, minMargin, maxMargin, settledFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const fetchChartsData = useCallback(async () => {
    try {
      setChartsLoading(true);
      
      // جلب بيانات Time Series
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      params.append('period', period === 'custom' ? 'daily' : period);

      const timeSeriesResponse = await fetch(`/api/admin/profitability/time-series?${params}`);
      const timeSeriesResult = await timeSeriesResponse.json();
      if (timeSeriesResult.success) {
        setTimeSeriesData(timeSeriesResult.data || []);
      }

      // جلب بيانات الفئات
      const categoryResponse = await fetch(`/api/admin/profitability/by-category?${params}`);
      const categoryResult = await categoryResponse.json();
      if (categoryResult.success) {
        setCategoryData(categoryResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching charts data:', error);
    } finally {
      setChartsLoading(false);
    }
  }, [fromDate, toDate, period]);

  useEffect(() => {
    fetchChartsData();
  }, [fetchChartsData]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);

      const response = await fetch(`/api/admin/profitability/export?${params}`);
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `profitability-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting:', error);
      alert('حدث خطأ أثناء التصدير');
    }
  };

  const handlePeriodChange = (newPeriod: 'daily' | 'weekly' | 'monthly' | 'custom') => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setFromDate('');
      setToDate('');
    }
  };

  if (loading && !stats) {
    return (
      <DashboardLayout title="الربحية">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="الربحية">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">الربحية</h1>
            <p className="text-gray-600 mt-1">متابعة الربحية من جلسات التجميع</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport.bind(null, 'csv')} variant="outline">
              <FiDownload className="ml-2" />
              تصدير CSV
            </Button>
            <Button onClick={() => { fetchStats(); fetchSessions(); fetchChartsData(); }} variant="outline">
              <FiRefreshCw className="ml-2" />
              تحديث
            </Button>
          </div>
        </div>

        {/* Period Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FiCalendar className="mr-2" />
              اختيار الفترة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">اليوم</SelectItem>
                  <SelectItem value="weekly">هذا الأسبوع</SelectItem>
                  <SelectItem value="monthly">هذا الشهر</SelectItem>
                  <SelectItem value="custom">فترة مخصصة</SelectItem>
                </SelectContent>
              </Select>

              {period === 'custom' && (
                <>
                  <Input
                    type="date"
                    placeholder="من تاريخ"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-[180px]"
                  />
                  <Input
                    type="date"
                    placeholder="إلى تاريخ"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-[180px]"
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  إجمالي الشراء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.total_buy.toLocaleString('ar-EG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ج.م
                </div>
                <p className="text-xs text-gray-500 mt-1">ما ندفعه للعملاء</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  إجمالي البيع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total_sell.toLocaleString('ar-EG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ج.م
                </div>
                <p className="text-xs text-gray-500 mt-1">ما نحصل عليه من البيع</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                  <FiTrendingUp className="mr-1" />
                  إجمالي الربح
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  {stats.total_profit.toLocaleString('ar-EG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ج.م
                </div>
                <p className="text-xs text-gray-500 mt-1">الربح الصافي</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  هامش الربح المتوسط
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.average_profit_margin.toFixed(2)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.session_count} جلسة
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        {!chartsLoading && (timeSeriesData.length > 0 || categoryData.length > 0) && (
          <ProfitabilityCharts 
            timeSeriesData={timeSeriesData}
            categoryData={categoryData}
          />
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FiFilter className="mr-2" />
              فلاتر الجلسات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">الربح الأدنى</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minProfit}
                  onChange={(e) => setMinProfit(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">الربح الأقصى</label>
                <Input
                  type="number"
                  placeholder="100000"
                  value={maxProfit}
                  onChange={(e) => setMaxProfit(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">هامش الربح الأدنى (%)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minMargin}
                  onChange={(e) => setMinMargin(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">حالة الاعتماد</label>
                <Select value={settledFilter} onValueChange={setSettledFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="settled">معتمدة</SelectItem>
                    <SelectItem value="pending">غير معتمدة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <FiBarChart2 className="mr-2" />
                الجلسات مع تفاصيل الربحية
              </span>
              <Badge variant="outline">{totalCount} جلسة</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد جلسات
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>العميل</TableHead>
                        <TableHead>الشراء</TableHead>
                        <TableHead>البيع</TableHead>
                        <TableHead>الربح</TableHead>
                        <TableHead>هامش الربح</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            {format(new Date(session.created_at), 'yyyy-MM-dd', { locale: ar })}
                          </TableCell>
                          <TableCell>{session.customer_name || 'غير معروف'}</TableCell>
                          <TableCell>
                            {session.buy_total.toLocaleString('ar-EG', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })} ج.م
                          </TableCell>
                          <TableCell>
                            {session.sell_total.toLocaleString('ar-EG', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })} ج.م
                          </TableCell>
                          <TableCell>
                            <span className={`font-bold ${
                              session.platform_profit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {session.platform_profit.toLocaleString('ar-EG', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })} ج.م
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={session.profit_margin >= 20 ? 'default' : 'secondary'}>
                              {session.profit_margin.toFixed(2)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={session.is_settled ? 'default' : 'outline'}>
                              {session.is_settled ? 'معتمدة' : 'غير معتمدة'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      صفحة {page} من {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <FiChevronRight />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <FiChevronLeft />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
