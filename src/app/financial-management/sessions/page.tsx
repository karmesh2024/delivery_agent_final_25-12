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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { 
  FiCheckCircle, 
  FiClock, 
  FiDollarSign, 
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle
} from "react-icons/fi";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Session {
  id: string;
  customer_id: string;
  status: string;
  is_settled: boolean;
  total_value: number;
  base_points: number;
  bonus_points: number;
  total_points?: number;
  buy_total?: number;
  sell_total?: number;
  platform_profit?: number;
  profit_margin?: number;
  created_at: string;
  completed_at?: string;
  profiles?: {
    id: string;
    full_name?: string;
    username?: string;
  };
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingSession, setSettlingSession] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('completed');
  const [settledFilter, setSettledFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (settledFilter !== 'all') {
        params.append('is_settled', settledFilter === 'settled' ? 'true' : 'false');
      }

      const response = await fetch(`/api/admin/sessions?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, settledFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSettleSession = async (session: Session) => {
    setSelectedSession(session);
    setShowConfirmDialog(true);
  };

  const confirmSettle = async () => {
    if (!selectedSession) return;
    
    setSettlingSession(selectedSession.id);
    setShowConfirmDialog(false);
    
    try {
      const response = await fetch(`/api/admin/sessions/${selectedSession.id}/settle`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the list
        fetchSessions();
        alert('تم اعتماد الجلسة بنجاح');
      } else {
        alert(data.error || 'حدث خطأ أثناء اعتماد الجلسة');
      }
    } catch (error) {
      console.error('Error settling session:', error);
      alert('حدث خطأ أثناء اعتماد الجلسة');
    } finally {
      setSettlingSession(null);
      setSelectedSession(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy - HH:mm', { locale: ar });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatPoints = (points: number) => {
    return new Intl.NumberFormat('ar-EG').format(points || 0);
  };

  const getStatusBadge = (session: Session) => {
    if (session.is_settled) {
      return <Badge className="bg-green-100 text-green-800">معتمد</Badge>;
    }
    if (session.status === 'completed') {
      return <Badge className="bg-yellow-100 text-yellow-800">مكتمل - غير معتمد</Badge>;
    }
    if (session.status === 'in_progress') {
      return <Badge className="bg-blue-100 text-blue-800">جاري</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">{session.status}</Badge>;
  };

  // Stats
  const pendingCount = sessions.filter(s => !s.is_settled && s.status === 'completed').length;
  const settledCount = sessions.filter(s => s.is_settled).length;
  const totalValue = sessions.reduce((sum, s) => sum + (s.total_value || 0), 0);

  return (
    <DashboardLayout title="إدارة الجلسات">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">إدارة جلسات التجميع</h1>
            <p className="text-gray-600 mt-1">اعتماد وإدارة جلسات تجميع المخلفات</p>
          </div>
          <Button onClick={fetchSessions} variant="outline">
            <FiRefreshCw className="ml-2" />
            تحديث
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">إجمالي الجلسات</p>
                  <p className="text-2xl font-bold">{totalCount}</p>
                </div>
                <FiClock className="text-3xl text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">غير معتمدة</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <FiAlertCircle className="text-3xl text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">معتمدة</p>
                  <p className="text-2xl font-bold text-green-600">{settledCount}</p>
                </div>
                <FiCheckCircle className="text-3xl text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">إجمالي القيمة</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                </div>
                <FiDollarSign className="text-3xl text-green-500" />
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">جميع الحالات</option>
                <option value="completed">مكتملة</option>
                <option value="in_progress">جارية</option>
                <option value="pending">معلقة</option>
              </select>
              
              <select
                value={settledFilter}
                onChange={(e) => setSettledFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">الكل</option>
                <option value="unsettled">غير معتمدة</option>
                <option value="settled">معتمدة</option>
              </select>

              <div className="flex-1">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الجلسات</CardTitle>
            <CardDescription>
              جميع جلسات التجميع مع إمكانية الاعتماد
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <FiRefreshCw className="animate-spin text-2xl text-gray-400" />
                <span className="mr-2 text-gray-500">جاري التحميل...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                لا توجد جلسات
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الجلسة</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>الشراء</TableHead>
                      <TableHead>البيع</TableHead>
                      <TableHead>الربح</TableHead>
                      <TableHead>هامش الربح</TableHead>
                      <TableHead>النقاط الأساسية</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-mono text-sm">
                          {session.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {session.profiles?.full_name || session.profiles?.username || 'غير محدد'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {session.buy_total !== undefined && session.buy_total !== null
                            ? formatCurrency(session.buy_total)
                            : formatCurrency(session.total_value)}
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {session.sell_total !== undefined && session.sell_total !== null
                            ? formatCurrency(session.sell_total)
                            : '-'}
                        </TableCell>
                        <TableCell className={`font-bold ${
                          (session.platform_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {session.platform_profit !== undefined && session.platform_profit !== null
                            ? formatCurrency(session.platform_profit)
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {session.profit_margin !== undefined && session.profit_margin !== null ? (
                            <Badge variant={session.profit_margin >= 20 ? 'default' : 'secondary'}>
                              {session.profit_margin.toFixed(2)}%
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {formatPoints(session.base_points)} نقطة
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(session)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(session.created_at)}
                        </TableCell>
                        <TableCell>
                          {!session.is_settled && session.status === 'completed' && (
                            <Button
                              size="sm"
                              onClick={() => handleSettleSession(session)}
                              disabled={settlingSession === session.id}
                            >
                              {settlingSession === session.id ? (
                                <FiRefreshCw className="animate-spin ml-1" />
                              ) : (
                                <FiCheckCircle className="ml-1" />
                              )}
                              اعتماد
                            </Button>
                          )}
                          {session.is_settled && (
                            <span className="text-green-600 text-sm">✓ معتمد</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-gray-500">
                    عرض {sessions.length} من {totalCount} جلسة
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

        {/* Confirm Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد اعتماد الجلسة</DialogTitle>
              <DialogDescription>
                هل أنت متأكد من اعتماد هذه الجلسة؟ سيتم إضافة النقاط إلى محفظة العميل.
              </DialogDescription>
            </DialogHeader>
            
            {selectedSession && (
              <div className="space-y-3 py-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">العميل:</span>
                  <span className="font-medium">
                    {selectedSession.profiles?.full_name || 'غير محدد'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">القيمة المالية:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(selectedSession.total_value)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">النقاط الأساسية:</span>
                  <span className="font-medium">
                    {formatPoints(selectedSession.base_points)} نقطة
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">سيُضاف للمحفظة:</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency((selectedSession.base_points || 0) / 100)}
                  </span>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={confirmSettle}>
                <FiCheckCircle className="ml-2" />
                تأكيد الاعتماد
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
