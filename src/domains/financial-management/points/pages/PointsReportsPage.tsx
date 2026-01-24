'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchPointsReport, fetchPointsSummary } from '../store/pointsSlice';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { TrendingUp, TrendingDown, DollarSign, Users, Download } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { InfoTooltip } from '../components/InfoTooltip';
import {
  TooltipProvider,
} from '@/shared/components/ui/tooltip';

export default function PointsReportsPage() {
  const dispatch = useAppDispatch();
  const { report, summary, loading } = useAppSelector((state) => state.points);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    dispatch(fetchPointsReport({
      startDate: dateRange.start,
      endDate: dateRange.end,
    }));
    dispatch(fetchPointsSummary());
  };

  const handleDateChange = (key: string, value: string) => {
    setDateRange({ ...dateRange, [key]: value });
  };

  const handleGenerateReport = () => {
    loadData();
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">تقارير النقاط</h1>
              <InfoTooltip
                content="هذه الصفحة تعرض تقارير وإحصائيات شاملة عن نظام النقاط. يمكنك رؤية إجمالي النقاط الممنوحة والمستخدمة، القيمة المالية الإجمالية، وأفضل العملاء. يمكنك تحديد فترة زمنية محددة لتوليد تقرير مخصص."
                side="right"
              />
            </div>
            <p className="text-gray-600 mt-2">
              تحليلات وإحصائيات شاملة عن نظام النقاط
            </p>
          </div>
          <Button variant="outline">
            <Download className="ml-2 h-4 w-4" />
            تصدير التقرير
          </Button>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>الفترة الزمنية</CardTitle>
              <InfoTooltip
                content="حدد الفترة الزمنية التي تريد إنشاء تقرير عنها. سيتم حساب جميع الإحصائيات بناءً على المعاملات التي حدثت في هذه الفترة."
                side="right"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="start_date">من تاريخ</Label>
                  <InfoTooltip
                    content="تاريخ بداية الفترة الزمنية للتقرير"
                    side="right"
                  />
                </div>
                <Input
                  id="start_date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="end_date">إلى تاريخ</Label>
                  <InfoTooltip
                    content="تاريخ نهاية الفترة الزمنية للتقرير"
                    side="right"
                  />
                </div>
                <Input
                  id="end_date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleGenerateReport} className="w-full">
                  توليد التقرير
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="ml-2 h-4 w-4" />
                  <span>العملاء بالنقاط</span>
                  <InfoTooltip
                    content="إجمالي عدد العملاء الذين لديهم رصيد نقاط أكبر من صفر. يمثل عدد العملاء النشطين في نظام النقاط."
                    side="top"
                    className="mr-2"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_customers_with_points}</div>
                <p className="text-xs text-gray-500 mt-1">عميل لديه نقاط</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="ml-2 h-4 w-4" />
                  <span>إجمالي النقاط</span>
                  <InfoTooltip
                    content="إجمالي رصيد النقاط المعلقة لجميع العملاء. هذه هي النقاط التي لم يتم استخدامها بعد."
                    side="top"
                    className="mr-2"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.total_points_balance.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">نقطة معلقة</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="ml-2 h-4 w-4" />
                  <span>القيمة المالية</span>
                  <InfoTooltip
                    content="القيمة المالية الإجمالية لجميع النقاط المعلقة. يتم حسابها بضرب إجمالي النقاط في متوسط قيمة النقطة."
                    side="top"
                    className="mr-2"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.total_financial_value.toFixed(2)} ج.م
                </div>
                <p className="text-xs text-gray-500 mt-1">القيمة الإجمالية</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <span>متوسط النقاط</span>
                  <InfoTooltip
                    content="متوسط عدد النقاط لكل عميل. يتم حسابه بقسمة إجمالي النقاط على عدد العملاء الذين لديهم نقاط."
                    side="top"
                    className="mr-2"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.average_points_per_customer.toFixed(0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">نقطة لكل عميل</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Report Details */}
        {report && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>ملخص الفترة</CardTitle>
                  <InfoTooltip
                    content="ملخص شامل لمعاملات النقاط في الفترة المحددة. يعرض النقاط الممنوحة والمستخدمة والمعلقة، بالإضافة إلى القيمة المالية وعدد المعاملات."
                    side="right"
                  />
                </div>
                <CardDescription>
                  من {format(new Date(report.period_start), 'yyyy-MM-dd')} إلى{' '}
                  {format(new Date(report.period_end), 'yyyy-MM-dd')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">النقاط الممنوحة:</span>
                    <InfoTooltip
                      content="إجمالي النقاط التي تم منحها للعملاء في هذه الفترة (من معاملات الكسب والمكافآت)"
                      side="right"
                    />
                  </div>
                  <span className="font-bold text-green-600">
                    +{report.total_points_granted.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">النقاط المستخدمة:</span>
                    <InfoTooltip
                      content="إجمالي النقاط التي استخدمها العملاء في هذه الفترة (من معاملات الاستخدام والانتهاء)"
                      side="right"
                    />
                  </div>
                  <span className="font-bold text-red-600">
                    -{report.total_points_used.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">النقاط المعلقة:</span>
                    <InfoTooltip
                      content="إجمالي النقاط المعلقة حالياً لدى جميع العملاء (لم يتم استخدامها بعد)"
                      side="right"
                    />
                  </div>
                  <span className="font-bold">
                    {report.total_points_pending.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">القيمة المالية:</span>
                    <InfoTooltip
                      content="القيمة المالية الإجمالية للنقاط المعلقة بالجنيه المصري"
                      side="right"
                    />
                  </div>
                  <span className="font-bold text-lg">
                    {report.total_financial_value.toFixed(2)} ج.م
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">عدد المعاملات:</span>
                    <InfoTooltip
                      content="إجمالي عدد معاملات النقاط التي حدثت في هذه الفترة"
                      side="right"
                    />
                  </div>
                  <span className="font-bold">{report.transactions_count}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>أفضل العملاء</CardTitle>
                  <InfoTooltip
                    content="قائمة بأفضل 10 عملاء من حيث رصيد النقاط. يعرض اسم العميل، رصيد النقاط، والقيمة المالية للنقاط."
                    side="right"
                  />
                </div>
                <CardDescription>أعلى 10 عملاء من حيث النقاط</CardDescription>
              </CardHeader>
              <CardContent>
                {summary && summary.top_customers.length > 0 ? (
                  <div className="space-y-2">
                    {summary.top_customers.map((customer, index) => (
                      <div
                        key={customer.customer_id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <div className="font-medium">
                            #{index + 1} {customer.customer_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {customer.points_balance.toLocaleString()} نقطة
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {customer.financial_value.toFixed(2)} ج.م
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد بيانات
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">جاري التحميل...</div>
        )}
      </div>
    </TooltipProvider>
  );
}
