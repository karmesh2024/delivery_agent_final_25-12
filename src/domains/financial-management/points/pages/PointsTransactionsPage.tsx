'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchPointsTransactions } from '../store/pointsSlice';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Filter, Download, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { PointsTransactionType } from '../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { InfoTooltip } from '../components/InfoTooltip';
import {
  TooltipProvider,
} from '@/shared/components/ui/tooltip';

export default function PointsTransactionsPage() {
  const dispatch = useAppDispatch();
  const { transactions, transactionsCount, loading } = useAppSelector((state) => state.points);
  const [filters, setFilters] = useState({
    transaction_type: '',
    start_date: '',
    end_date: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadTransactions();
  }, [currentPage, filters]);

  const loadTransactions = () => {
    const offset = (currentPage - 1) * itemsPerPage;
    dispatch(fetchPointsTransactions({
      ...filters,
      limit: itemsPerPage,
      offset,
    }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      EARNED: 'كسب',
      USED: 'استخدام',
      EXPIRED: 'انتهاء صلاحية',
      ADJUSTED: 'تعديل',
      REFUNDED: 'استرداد',
      BONUS: 'مكافأة',
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      EARNED: 'bg-green-100 text-green-800',
      USED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
      ADJUSTED: 'bg-blue-100 text-blue-800',
      REFUNDED: 'bg-yellow-100 text-yellow-800',
      BONUS: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const totalPages = Math.ceil(transactionsCount / itemsPerPage);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">معاملات النقاط</h1>
              <InfoTooltip
                content="هذه الصفحة تعرض جميع معاملات النقاط في النظام. يمكنك تتبع كيف كسب العملاء النقاط، وكيف استخدموها، وأي تعديلات تمت. يمكنك استخدام الفلاتر للبحث عن معاملات محددة."
                side="right"
              />
            </div>
            <p className="text-gray-600 mt-2">
              تتبع جميع معاملات النقاط (كسب، استخدام، تعديل)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadTransactions}>
              <RefreshCw className="ml-2 h-4 w-4" />
              تحديث
            </Button>
            <Button variant="outline">
              <Download className="ml-2 h-4 w-4" />
              تصدير
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center">
                <Filter className="ml-2 h-4 w-4" />
                الفلاتر
              </CardTitle>
              <InfoTooltip
                content="استخدم الفلاتر للبحث عن معاملات محددة. يمكنك الفلترة حسب نوع المعاملة (كسب، استخدام، إلخ)، أو حسب الفترة الزمنية. اترك الحقول فارغة لعرض جميع المعاملات."
                side="right"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="transaction_type">نوع المعاملة</Label>
                  <InfoTooltip
                    content="اختر نوع المعاملة: كسب (EARNED) - عندما يكسب العميل نقاط، استخدام (USED) - عندما يستخدم العميل نقاط، تعديل (ADJUSTED) - تعديل يدوي من الإدارة، انتهاء صلاحية (EXPIRED) - نقاط منتهية الصلاحية، استرداد (REFUNDED) - استرداد نقاط، مكافأة (BONUS) - نقاط مكافأة إضافية."
                    side="right"
                  />
                </div>
                <Select
                  value={filters.transaction_type || undefined}
                  onValueChange={(value) => handleFilterChange('transaction_type', value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الأنواع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value={PointsTransactionType.EARNED}>كسب</SelectItem>
                    <SelectItem value={PointsTransactionType.USED}>استخدام</SelectItem>
                    <SelectItem value={PointsTransactionType.EXPIRED}>انتهاء صلاحية</SelectItem>
                    <SelectItem value={PointsTransactionType.ADJUSTED}>تعديل</SelectItem>
                    <SelectItem value={PointsTransactionType.REFUNDED}>استرداد</SelectItem>
                    <SelectItem value={PointsTransactionType.BONUS}>مكافأة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="start_date">من تاريخ</Label>
                  <InfoTooltip
                    content="تاريخ بداية الفترة الزمنية للبحث. سيتم عرض المعاملات من هذا التاريخ فصاعداً."
                    side="right"
                  />
                </div>
                <Input
                  id="start_date"
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="end_date">إلى تاريخ</Label>
                  <InfoTooltip
                    content="تاريخ نهاية الفترة الزمنية للبحث. سيتم عرض المعاملات حتى هذا التاريخ."
                    side="right"
                  />
                </div>
                <Input
                  id="end_date"
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setFilters({ transaction_type: '', start_date: '', end_date: '' });
                    setCurrentPage(1);
                  }}
                >
                  مسح الفلاتر
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>قائمة المعاملات</CardTitle>
              <InfoTooltip
                content="هذه القائمة تعرض جميع معاملات النقاط. كل صف يمثل معاملة واحدة. الأرقام باللون الأخضر تعني إضافة نقاط، والأرقام باللون الأحمر تعني خصم نقاط."
                side="right"
              />
            </div>
            <CardDescription>
              إجمالي المعاملات: {transactionsCount}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد معاملات
              </div>
            ) : (
              <>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        التاريخ
                        <InfoTooltip content="تاريخ ووقت حدوث المعاملة" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        العميل
                        <InfoTooltip content="اسم العميل ورقم هاتفه" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        نوع المعاملة
                        <InfoTooltip content="نوع المعاملة: كسب، استخدام، تعديل، إلخ" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        النقاط
                        <InfoTooltip content="عدد النقاط في المعاملة (إيجابي = إضافة، سلبي = خصم)" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        الرصيد قبل
                        <InfoTooltip content="رصيد النقاط قبل المعاملة" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        الرصيد بعد
                        <InfoTooltip content="رصيد النقاط بعد المعاملة" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        القيمة المالية
                        <InfoTooltip content="القيمة المالية للنقاط في هذه المعاملة بالجنيه" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        الوصف
                        <InfoTooltip content="وصف أو ملاحظات حول المعاملة" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        الطلب
                        <InfoTooltip content="رقم الطلب المرتبط بالمعاملة (إن وجد)" side="top" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.created_at), 'yyyy-MM-dd HH:mm', { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.customer_name || 'غير معروف'}</div>
                            {transaction.customer_phone && (
                              <div className="text-xs text-gray-500">{transaction.customer_phone}</div>
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
                        <TableCell>{transaction.balance_before}</TableCell>
                        <TableCell className="font-semibold">{transaction.balance_after}</TableCell>
                        <TableCell>
                          {transaction.points_value
                            ? `${transaction.points_value.toFixed(2)} ج.م`
                            : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transaction.description || '-'}
                        </TableCell>
                        <TableCell>
                          {transaction.order_number ? (
                            <span className="text-xs text-blue-600">{transaction.order_number}</span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
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
    </TooltipProvider>
  );
}
