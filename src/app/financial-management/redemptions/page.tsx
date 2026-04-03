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
  FiXCircle,
  FiClock, 
  FiDollarSign, 
  FiRefreshCw,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiCheck,
  FiX
} from "react-icons/fi";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Redemption {
  id: string;
  customer_id: string;
  amount_egp: number;
  points_redeemed: number;
  redemption_type: string;
  status: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  processed_at?: string;
  profiles?: {
    id: string;
    full_name?: string;
    username?: string;
    wallet_balance?: number;
    store_points?: number;
  };
}

export default function RedemptionsPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRedemption, setProcessingRedemption] = useState<string | null>(null);
  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('cash');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  const fetchRedemptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (typeFilter && typeFilter !== 'all') {
        params.append('redemption_type', typeFilter);
      }

      const response = await fetch(`/api/admin/redemptions?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setRedemptions(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching redemptions:', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    fetchRedemptions();
  }, [fetchRedemptions]);

  const handleProcessRedemption = async (redemption: Redemption, action: 'approve' | 'reject') => {
    setSelectedRedemption(redemption);
    setPendingAction(action);
    setReferenceNumber('');
    setNotes('');
    setShowConfirmDialog(true);
  };

  const confirmProcess = async () => {
    if (!selectedRedemption || !pendingAction) return;
    
    setProcessingRedemption(selectedRedemption.id);
    setShowConfirmDialog(false);
    
    try {
      const response = await fetch(`/api/admin/redemptions/${selectedRedemption.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: pendingAction,
          referenceNumber: referenceNumber || undefined,
          notes: notes || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchRedemptions();
        alert(pendingAction === 'approve' 
          ? 'تمت الموافقة على طلب السحب بنجاح' 
          : 'تم رفض طلب السحب وإرجاع النقاط');
      } else {
        alert(data.error || 'حدث خطأ أثناء معالجة الطلب');
      }
    } catch (error) {
      console.error('Error processing redemption:', error);
      alert('حدث خطأ أثناء معالجة الطلب');
    } finally {
      setProcessingRedemption(null);
      setSelectedRedemption(null);
      setPendingAction(null);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">معلق</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800">موافق عليه</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">مكتمل</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">مرفوض</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">ملغي</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'cash':
        return <Badge className="bg-green-100 text-green-800">سحب نقدي</Badge>;
      case 'product':
        return <Badge className="bg-blue-100 text-blue-800">منتج</Badge>;
      case 'gift':
        return <Badge className="bg-purple-100 text-purple-800">هدية</Badge>;
      case 'donation':
        return <Badge className="bg-orange-100 text-orange-800">تبرع</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{type}</Badge>;
    }
  };

  // Stats
  const pendingCount = redemptions.filter(r => r.status === 'pending').length;
  const pendingAmount = redemptions
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + (r.amount_egp || 0), 0);
  const completedCount = redemptions.filter(r => r.status === 'completed').length;

  return (
    <DashboardLayout title="طلبات السحب">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">إدارة طلبات السحب</h1>
            <p className="text-gray-600 mt-1">مراجعة ومعالجة طلبات السحب والاستبدال</p>
          </div>
          <Button onClick={fetchRedemptions} variant="outline">
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
                  <p className="text-sm text-gray-500">إجمالي الطلبات</p>
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
                  <p className="text-sm text-gray-500">طلبات معلقة</p>
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
                  <p className="text-sm text-gray-500">مبلغ معلق</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</p>
                </div>
                <FiDollarSign className="text-3xl text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">مكتملة</p>
                  <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                </div>
                <FiCheckCircle className="text-3xl text-green-500" />
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
                <option value="pending">معلق</option>
                <option value="approved">موافق عليه</option>
                <option value="completed">مكتمل</option>
                <option value="rejected">مرفوض</option>
              </select>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">جميع الأنواع</option>
                <option value="cash">سحب نقدي</option>
                <option value="product">منتج</option>
                <option value="gift">هدية</option>
                <option value="donation">تبرع</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Redemptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة طلبات السحب</CardTitle>
            <CardDescription>
              جميع طلبات السحب والاستبدال مع إمكانية المعالجة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <FiRefreshCw className="animate-spin text-2xl text-gray-400" />
                <span className="mr-2 text-gray-500">جاري التحميل...</span>
              </div>
            ) : redemptions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                لا توجد طلبات
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الطلب</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>النقاط</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redemptions.map((redemption) => (
                      <TableRow key={redemption.id}>
                        <TableCell className="font-mono text-sm">
                          {redemption.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {redemption.profiles?.full_name || redemption.profiles?.username || 'غير محدد'}
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(redemption.redemption_type)}
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(redemption.amount_egp)}
                        </TableCell>
                        <TableCell>
                          {formatPoints(redemption.points_redeemed)} نقطة
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(redemption.status)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(redemption.created_at)}
                        </TableCell>
                        <TableCell>
                          {redemption.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleProcessRedemption(redemption, 'approve')}
                                disabled={processingRedemption === redemption.id}
                              >
                                {processingRedemption === redemption.id ? (
                                  <FiRefreshCw className="animate-spin" />
                                ) : (
                                  <FiCheck className="ml-1" />
                                )}
                                موافقة
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleProcessRedemption(redemption, 'reject')}
                                disabled={processingRedemption === redemption.id}
                              >
                                <FiX className="ml-1" />
                                رفض
                              </Button>
                            </div>
                          )}
                          {redemption.status === 'completed' && (
                            <span className="text-green-600 text-sm">✓ مكتمل</span>
                          )}
                          {redemption.status === 'rejected' && (
                            <span className="text-red-600 text-sm">✗ مرفوض</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-gray-500">
                    عرض {redemptions.length} من {totalCount} طلب
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
              <DialogTitle>
                {pendingAction === 'approve' ? 'تأكيد الموافقة على الطلب' : 'تأكيد رفض الطلب'}
              </DialogTitle>
              <DialogDescription>
                {pendingAction === 'approve' 
                  ? 'هل أنت متأكد من الموافقة على هذا الطلب؟'
                  : 'هل أنت متأكد من رفض هذا الطلب؟ سيتم إرجاع النقاط للعميل.'}
              </DialogDescription>
            </DialogHeader>
            
            {selectedRedemption && (
              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">العميل:</span>
                    <span className="font-medium">
                      {selectedRedemption.profiles?.full_name || 'غير محدد'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">المبلغ:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(selectedRedemption.amount_egp)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">النقاط:</span>
                    <span className="font-medium">
                      {formatPoints(selectedRedemption.points_redeemed)} نقطة
                    </span>
                  </div>
                </div>
                
                {pendingAction === 'approve' && (
                  <div className="space-y-3 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        رقم المرجع (اختياري)
                      </label>
                      <Input
                        placeholder="رقم التحويل البنكي أو المرجع"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        ملاحظات (اختياري)
                      </label>
                      <Input
                        placeholder="أي ملاحظات إضافية"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={confirmProcess}
                variant={pendingAction === 'reject' ? 'destructive' : 'default'}
              >
                {pendingAction === 'approve' ? (
                  <>
                    <FiCheckCircle className="ml-2" />
                    تأكيد الموافقة
                  </>
                ) : (
                  <>
                    <FiXCircle className="ml-2" />
                    تأكيد الرفض
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
