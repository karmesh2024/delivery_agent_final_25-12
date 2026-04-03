'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
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
  FiRefreshCw,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiArrowUp,
  FiArrowDown,
  FiDollarSign,
  FiGift
} from "react-icons/fi";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Transaction {
  id: string;
  profile_id: string;
  type: 'wallet' | 'store';
  amount: number;
  before_balance: number;
  after_balance: number;
  source: string;
  reference_id?: string;
  description?: string;
  created_at: string;
  profiles?: {
    id: string;
    full_name?: string;
    username?: string;
  };
}

export default function AuditLogPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 50;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (typeFilter && typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      
      if (sourceFilter && sourceFilter !== 'all') {
        params.append('source', sourceFilter);
      }

      const response = await fetch(`/api/admin/transactions?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, sourceFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy - HH:mm:ss', { locale: ar });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: number, type: string) => {
    if (type === 'wallet') {
      // تحويل من نقاط إلى جنيه
      const egp = amount / 100;
      return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 2
      }).format(egp);
    }
    return `${new Intl.NumberFormat('ar-EG').format(amount)} نقطة`;
  };

  const formatBalance = (balance: number, type: string) => {
    if (type === 'wallet') {
      const egp = balance / 100;
      return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 2
      }).format(egp);
    }
    return `${new Intl.NumberFormat('ar-EG').format(balance)} نقطة`;
  };

  const getTypeBadge = (type: string) => {
    if (type === 'wallet') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <FiDollarSign className="ml-1" size={12} />
          محفظة
        </Badge>
      );
    }
    return (
      <Badge className="bg-purple-100 text-purple-800">
        <FiGift className="ml-1" size={12} />
        متجر
      </Badge>
    );
  };

  const getAmountBadge = (amount: number, type: string) => {
    const isPositive = amount > 0;
    return (
      <span className={`flex items-center font-mono ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <FiArrowUp className="ml-1" /> : <FiArrowDown className="ml-1" />}
        {formatAmount(Math.abs(amount), type)}
      </span>
    );
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      'waste_collection_session': 'جلسة تجميع',
      'points_redemption': 'استبدال نقاط',
      'admin_adjustment': 'تعديل إداري',
      'system': 'النظام',
      'refund': 'إرجاع',
      'bonus': 'مكافأة',
    };
    return labels[source] || source;
  };

  const exportToCSV = () => {
    const headers = ['التاريخ', 'العميل', 'النوع', 'المبلغ', 'الرصيد قبل', 'الرصيد بعد', 'المصدر', 'الوصف'];
    const rows = transactions.map(t => [
      formatDate(t.created_at),
      t.profiles?.full_name || 'غير محدد',
      t.type === 'wallet' ? 'محفظة' : 'متجر',
      t.amount,
      t.before_balance,
      t.after_balance,
      getSourceLabel(t.source),
      t.description || ''
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Stats
  const walletTransactions = transactions.filter(t => t.type === 'wallet').length;
  const storeTransactions = transactions.filter(t => t.type === 'store').length;
  const positiveTransactions = transactions.filter(t => t.amount > 0).length;
  const negativeTransactions = transactions.filter(t => t.amount < 0).length;

  return (
    <DashboardLayout title="سجل المعاملات">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">سجل المعاملات (Audit Log)</h1>
            <p className="text-gray-600 mt-1">تتبع جميع حركات النقاط والمحفظة</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline">
              <FiDownload className="ml-2" />
              تصدير CSV
            </Button>
            <Button onClick={fetchTransactions} variant="outline">
              <FiRefreshCw className="ml-2" />
              تحديث
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">إجمالي المعاملات</p>
                  <p className="text-2xl font-bold">{totalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">معاملات المحفظة</p>
                  <p className="text-2xl font-bold text-green-600">{walletTransactions}</p>
                </div>
                <FiDollarSign className="text-3xl text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">معاملات المتجر</p>
                  <p className="text-2xl font-bold text-purple-600">{storeTransactions}</p>
                </div>
                <FiGift className="text-3xl text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">إيداع / سحب</p>
                  <p className="text-2xl font-bold">
                    <span className="text-green-600">{positiveTransactions}</span>
                    {' / '}
                    <span className="text-red-600">{negativeTransactions}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <FiFilter className="text-gray-500" />
                <span className="text-sm font-medium">الفلترة:</span>
              </div>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">جميع الأنواع</option>
                <option value="wallet">المحفظة</option>
                <option value="store">المتجر</option>
              </select>
              
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">جميع المصادر</option>
                <option value="waste_collection_session">جلسة تجميع</option>
                <option value="points_redemption">استبدال نقاط</option>
                <option value="admin_adjustment">تعديل إداري</option>
                <option value="system">النظام</option>
                <option value="refund">إرجاع</option>
              </select>

              <div className="flex-1">
                <Input
                  placeholder="بحث عن عميل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>سجل المعاملات</CardTitle>
            <CardDescription>
              جميع حركات النقاط والمحفظة المالية
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <FiRefreshCw className="animate-spin text-2xl text-gray-400" />
                <span className="mr-2 text-gray-500">جاري التحميل...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                لا توجد معاملات
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الرصيد قبل</TableHead>
                      <TableHead>الرصيد بعد</TableHead>
                      <TableHead>المصدر</TableHead>
                      <TableHead>الوصف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(transaction.created_at)}
                        </TableCell>
                        <TableCell>
                          {transaction.profiles?.full_name || transaction.profiles?.username || 'غير محدد'}
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(transaction.type)}
                        </TableCell>
                        <TableCell>
                          {getAmountBadge(transaction.amount, transaction.type)}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-500">
                          {formatBalance(transaction.before_balance, transaction.type)}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium">
                          {formatBalance(transaction.after_balance, transaction.type)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getSourceLabel(transaction.source)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                          {transaction.description || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-gray-500">
                    عرض {transactions.length} من {totalCount} معاملة
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <FiChevronRight className="ml-1" />
                      السابق
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      صفحة {page} من {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      التالي
                      <FiChevronLeft className="mr-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
