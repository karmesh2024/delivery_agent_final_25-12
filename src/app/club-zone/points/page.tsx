'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchPointsTransactions, fetchUserPointsSummary, activateMonthlyPoints } from '@/domains/club-zone/store/clubZoneSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { FiStar, FiFilter, FiRefreshCw, FiExternalLink, FiClock, FiCheckCircle, FiXCircle, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ClubPointsTransactionType, PointsSource } from '@/domains/club-zone/types';
import { supabase } from '@/lib/supabase';

export default function ClubPointsPage() {
  const dispatch = useAppDispatch();
  const { pointsTransactions, pointsTransactionsCount, loading, userPointsSummary } = useAppSelector((state) => state.clubZone);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    transaction_type: 'all' as string,
    source: 'all' as string,
    start_date: '',
    end_date: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [pointsSummaryError, setPointsSummaryError] = useState<string | null>(null);
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [activatingMonthly, setActivatingMonthly] = useState(false);

  useEffect(() => {
    loadTransactions();
    loadCurrentUser();
  }, [currentPage, filters, viewUserId]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const userIdToView = viewUserId || user.id;
        // محاولة جلب ملخص النقاط للمستخدم
        try {
          await dispatch(fetchUserPointsSummary(userIdToView)).unwrap();
          setPointsSummaryError(null);
        } catch (error: any) {
          // إذا لم يكن لديه wallet أو حدث خطأ
          console.log('User may not have a points wallet:', error?.message);
          setPointsSummaryError(error?.message || 'لا يوجد محفظة نقاط لهذا المستخدم');
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error);
      setPointsSummaryError('حدث خطأ أثناء تحميل بيانات المستخدم');
    }
  };

  const handleViewUserPoints = async (userId: string) => {
    setViewUserId(userId);
    try {
      await dispatch(fetchUserPointsSummary(userId)).unwrap();
      setPointsSummaryError(null);
    } catch (error: any) {
      setPointsSummaryError(error?.message || 'لا يوجد محفظة نقاط لهذا المستخدم');
    }
  };

  const handleActivateMonthlyPoints = async () => {
    if (!currentUserId) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }

    // الحصول على الشهر الحالي بصيغة YYYY-MM
    const now = new Date();
    const settlementMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const confirmed = window.confirm(
      `هل أنت متأكد من اعتماد النقاط الشهرية لشهر ${settlementMonth}؟\n\n` +
      'سيتم تحويل جميع النقاط المعلقة (PENDING) إلى نقاط متاحة (AVAILABLE) لجميع المستخدمين.\n\n' +
      '⚠️ تحذير: هذه العملية لا يمكن التراجع عنها.'
    );

    if (!confirmed) return;

    setActivatingMonthly(true);
    try {
      await dispatch(activateMonthlyPoints({
        settlementMonth,
        processedBy: currentUserId,
        notes: `اعتماد نقاط شهر ${settlementMonth} من لوحة التحكم`
      })).unwrap();

      alert(`✅ تم اعتماد النقاط الشهرية بنجاح لشهر ${settlementMonth}`);
      
      // تحديث البيانات
      await loadCurrentUser();
      loadTransactions();
    } catch (error: any) {
      console.error('Error activating monthly points:', error);
      
      let errorMessage = error?.message || 'حدث خطأ غير معروف';
      
      // ✅ V1.5.1: رسالة خطأ أوضح إذا كانت المشكلة في "Failed to fetch"
      if (errorMessage.includes('Failed to fetch') || 
          errorMessage.includes('فشل الاتصال بخادم قاعدة البيانات') ||
          (error?.name === 'TypeError' && errorMessage.includes('fetch'))) {
        errorMessage = 
          '❌ فشل الاتصال بخادم قاعدة البيانات.\n\n' +
          'الأسباب المحتملة:\n' +
          '1. مشكلة في الاتصال بالإنترنت\n' +
          '2. Supabase غير متاح مؤقتاً\n' +
          '3. مشكلة في إعدادات CORS\n\n' +
          'الحل:\n' +
          '- تحقق من اتصالك بالإنترنت\n' +
          '- حاول مرة أخرى بعد بضع ثوان\n' +
          '- تحقق من Supabase Dashboard للتأكد من أن الخدمة تعمل\n' +
          '- تحقق من Console في المتصفح لمزيد من التفاصيل';
      }
      // ✅ V1.5.1: رسالة خطأ أوضح إذا كانت المشكلة في duplicate key
      else if (errorMessage.includes('duplicate key') || 
          errorMessage.includes('monthly_points_settlement_settlement_month_key') ||
          errorMessage.includes('تم اعتماد نقاطه مسبقاً')) {
        errorMessage = 
          '❌ هذا الشهر تم اعتماد نقاطه مسبقاً.\n\n' +
          'لا يمكن اعتماد نفس الشهر مرتين.\n\n' +
          'إذا كنت تريد إعادة الاعتماد، يجب حذف السجل القديم أولاً من جدول monthly_points_settlement.';
      }
      // رسالة خطأ أوضح إذا كانت المشكلة في عدم وجود الدالة
      else if (errorMessage.includes('Could not find the function') || 
          errorMessage.includes('activate_monthly_points') ||
          error?.code === '42883') {
        errorMessage = 
          '❌ الدالة activate_monthly_points غير موجودة في قاعدة البيانات.\n\n' +
          'الحل:\n' +
          '1. افتح Supabase Dashboard > SQL Editor\n' +
          '2. شغّل الملف: supabase/migrations/20250122_fix_activate_monthly_points_duplicate_check.sql\n' +
          '3. أو اذهب إلى Settings > API واضغط Refresh Schema Cache\n\n' +
          'راجع ملف: docs/FIX_activate_monthly_points.md للتفاصيل';
      }
      
      alert(`❌ فشل اعتماد النقاط الشهرية:\n\n${errorMessage}`);
    } finally {
      setActivatingMonthly(false);
    }
  };

  const loadTransactions = () => {
    const offset = (currentPage - 1) * itemsPerPage;
    const queryFilters: any = {
      limit: itemsPerPage,
      offset,
    };

    if (filters.transaction_type !== 'all') {
      queryFilters.transaction_type = filters.transaction_type as ClubPointsTransactionType;
    }
    if (filters.source !== 'all') {
      queryFilters.source = filters.source as PointsSource;
    }
    if (filters.start_date) {
      queryFilters.start_date = filters.start_date;
    }
    if (filters.end_date) {
      queryFilters.end_date = filters.end_date;
    }

    dispatch(fetchPointsTransactions(queryFilters));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const getTransactionTypeLabel = (type: ClubPointsTransactionType) => {
    const labels: Record<ClubPointsTransactionType, string> = {
      EARNED: 'كسب',
      USED: 'استخدام',
      ACTIVATED: 'اعتماد شهري',
      EXPIRED: 'انتهاء صلاحية',
      ADJUSTED: 'تعديل',
      BONUS: 'مكافأة',
      CONVERTED: 'محول',
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type: ClubPointsTransactionType) => {
    const colors: Record<string, string> = {
      EARNED: 'bg-green-100 text-green-800',
      ACTIVATED: 'bg-blue-100 text-blue-800',
      USED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
      ADJUSTED: 'bg-blue-100 text-blue-800',
      BONUS: 'bg-purple-100 text-purple-800',
      CONVERTED: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getSourceLabel = (source?: PointsSource) => {
    if (!source) return '-';
    const labels: Record<PointsSource, string> = {
      waste_collection: 'استبدال مخلفات',
      ad_view: 'مشاهدة إعلان',
      event_attendance: 'حضور فعالية',
      admin_bonus: 'مكافأة إدارية',
      reward_redeem: 'استبدال جائزة',
      radio_stream: 'راديو كارمش',
      monthly_settlement: 'اعتماد شهري',
    };
    return labels[source] || source;
  };

  const totalPages = Math.ceil(pointsTransactionsCount / itemsPerPage);

  return (
    <DashboardLayout title="إدارة النقاط">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">إدارة نقاط النادي</h1>
            <p className="text-gray-600 mt-2">
              عرض وتتبع جميع معاملات نقاط النادي
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleActivateMonthlyPoints}
              disabled={activatingMonthly || !currentUserId}
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FiCalendar className="ml-2" />
              {activatingMonthly ? 'جاري الاعتماد...' : 'اعتماد النقاط الشهرية'}
            </Button>
            <Button asChild variant="outline">
              <a href="/club-zone/points/conversions">
                <FiExternalLink className="ml-2" />
                طلبات تحويل المخلفات
              </a>
            </Button>
            <Button onClick={loadTransactions} variant="outline">
              <FiRefreshCw className="ml-2" />
              تحديث
            </Button>
          </div>
        </div>

        {/* Points Summary Card - V1.3 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>ملخص رصيد النقاط</CardTitle>
                <CardDescription>
                  V1.3: {viewUserId ? 'رصيد المستخدم المحدد' : 'رصيدك الحالي من نقاط النادي'}
                </CardDescription>
              </div>
              {viewUserId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewUserId(null);
                    loadCurrentUser();
                  }}
                >
                  عرض رصيدي
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pointsSummaryError ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">{pointsSummaryError}</p>
                {!viewUserId && (
                  <p className="text-sm text-gray-400">
                    ملاحظة: إذا كنت أدمن وليس لديك محفظة نقاط، يمكنك عرض نقاط مستخدم آخر من خلال البحث في المعاملات أدناه
                  </p>
                )}
              </div>
            ) : userPointsSummary ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-900 flex items-center">
                  <FiClock className="mr-2" />
                  رصيد هذا الشهر (قيد الاعتماد)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-900">{userPointsSummary.pending_points}</div>
                <p className="text-xs text-yellow-700 mt-1">نقاط معلقة - ستُعتمد نهاية الشهر</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-900 flex items-center">
                  <FiCheckCircle className="mr-2" />
                  رصيدك المتاح الآن
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900">{userPointsSummary.available_points}</div>
                <p className="text-xs text-green-700 mt-1">نقاط جاهزة للاستخدام</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-gray-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                  <FiXCircle className="mr-2" />
                  النقاط المستخدمة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{userPointsSummary.used_points}</div>
                <p className="text-xs text-gray-700 mt-1">نقاط تم استبدالها في الجوائز</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-900 flex items-center">
                  <FiStar className="mr-2" />
                  إجمالي مدى الحياة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{userPointsSummary.lifetime_points}</div>
                <p className="text-xs text-blue-700 mt-1">جميع النقاط المكتسبة منذ البداية</p>
              </CardContent>
            </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                جاري تحميل ملخص النقاط...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FiFilter className="mr-2" />
              الفلاتر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="transaction_type">نوع المعاملة</Label>
                <Select
                  value={filters.transaction_type}
                  onValueChange={(value) => handleFilterChange('transaction_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الأنواع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value={ClubPointsTransactionType.EARNED}>كسب</SelectItem>
                    <SelectItem value={'ACTIVATED'}>اعتماد شهري</SelectItem>
                    <SelectItem value={ClubPointsTransactionType.USED}>استخدام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="source">المصدر</Label>
                <Select
                  value={filters.source}
                  onValueChange={(value) => handleFilterChange('source', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="جميع المصادر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المصادر</SelectItem>
                    <SelectItem value="waste_collection">استبدال مخلفات</SelectItem>
                    <SelectItem value="admin_bonus">مكافأة إدارية</SelectItem>
                    <SelectItem value="reward_redeem">استبدال جائزة</SelectItem>
                    <SelectItem value="radio_stream">راديو كارمش</SelectItem>
                    <SelectItem value="monthly_settlement">اعتماد شهري</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="start_date">من تاريخ</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end_date">إلى تاريخ</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({ transaction_type: 'all', source: 'all', start_date: '', end_date: '' });
                  setCurrentPage(1);
                }}
              >
                مسح الفلاتر
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>معاملات النقاط ({pointsTransactionsCount})</CardTitle>
            <CardDescription>
              جميع معاملات نقاط النادي
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : pointsTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد معاملات
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>النقاط</TableHead>
                      <TableHead>المصدر</TableHead>
                      <TableHead>الرصيد قبل</TableHead>
                      <TableHead>الرصيد بعد</TableHead>
                      <TableHead>الوصف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pointsTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.created_at), 'yyyy-MM-dd HH:mm', { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{transaction.user_name || '-'}</span>
                            {transaction.user_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleViewUserPoints(transaction.user_id)}
                                title="عرض نقاط هذا المستخدم"
                              >
                                عرض النقاط
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
                            {getTransactionTypeLabel(transaction.transaction_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className={transaction.points > 0 ? 'text-green-600' : 'text-red-600'}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </TableCell>
                        <TableCell>{getSourceLabel(transaction.source)}</TableCell>
                        <TableCell>{transaction.points_before}</TableCell>
                        <TableCell className="font-semibold">{transaction.points_after}</TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.description || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">
                      صفحة {currentPage} من {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        السابق
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        التالي
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
