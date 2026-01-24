'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { clubPointsService } from '@/domains/club-zone/services/clubPointsService';
import { RecyclingConversionRequest, RecyclingConversionRequestStatus } from '@/domains/club-zone/types';

const statusLabel: Record<RecyclingConversionRequestStatus, string> = {
  PENDING: 'معلّق',
  APPROVED: 'تمت الموافقة',
  REJECTED: 'مرفوض',
};

const statusBadge: Record<RecyclingConversionRequestStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default function ClubConversionRequestsPage() {
  const [status, setStatus] = useState<RecyclingConversionRequestStatus | 'all'>('PENDING');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<RecyclingConversionRequest[]>([]);
  const [count, setCount] = useState(0);

  const filters = useMemo(() => {
    return {
      status: status === 'all' ? undefined : status,
      user_id: userId.trim() ? userId.trim() : undefined,
      limit: 50,
      offset: 0,
    };
  }, [status, userId]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await clubPointsService.listRecyclingConversionRequests(filters);
      setRows(res.data);
      setCount(res.count);
    } catch (error: any) {
      console.error('Error loading conversion requests:', error);
      // Extract error message properly
      let errorMessage = 'حدث خطأ أثناء تحميل الطلبات';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.code) {
        errorMessage = `خطأ ${error.code}: ${error.message || 'خطأ غير معروف'}`;
      }
      
      console.error('Full error details:', JSON.stringify(error, null, 2));
      alert(errorMessage);
      setRows([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch((error) => {
      console.error('Error in useEffect load:', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.user_id]);

  const requireAdminId = async (): Promise<string> => {
    const { data } = await supabase.auth.getUser();
    const id = data.user?.id;
    if (!id) throw new Error('يجب تسجيل الدخول');
    return id;
  };

  const approve = async (id: string) => {
    try {
      const adminId = await requireAdminId();
      setLoading(true);
      await clubPointsService.approveRecyclingConversionRequest({ requestId: id, processedBy: adminId });
      await load();
    } catch (error: any) {
      console.error('Error approving request:', error);
      const errorMessage = error?.message || 'حدث خطأ أثناء الموافقة على الطلب';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const reject = async (id: string) => {
    try {
      const adminId = await requireAdminId();
      const reason = window.prompt('سبب الرفض (اختياري):') || 'غير محدد';
      if (reason === null) return; // User cancelled
      setLoading(true);
      await clubPointsService.rejectRecyclingConversionRequest({
        requestId: id,
        processedBy: adminId,
        rejectionReason: reason,
      });
      await load();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      const errorMessage = error?.message || 'حدث خطأ أثناء رفض الطلب';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="طلبات تحويل المخلفات">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">طلبات تحويل المخلفات إلى نقاط النادي</h1>
            <p className="text-gray-600 mt-2">V1.3: المستخدم يقدّم طلب فقط، والأدمن يوافق/يرفض.</p>
          </div>
          <Button onClick={load} variant="outline" disabled={loading}>
            تحديث
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>فلاتر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>الحالة</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="PENDING">معلّق</SelectItem>
                    <SelectItem value="APPROVED">تمت الموافقة</SelectItem>
                    <SelectItem value="REJECTED">مرفوض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>user_id (اختياري)</Label>
                <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="UUID" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الطلبات ({count})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : rows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">لا توجد طلبات</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>نقاط مخلفات</TableHead>
                    <TableHead>نقاط نادي متوقعة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>ملاحظات</TableHead>
                    <TableHead>إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-semibold">{r.user_name || '-'}</div>
                        <div className="text-xs text-gray-500">{r.user_id}</div>
                      </TableCell>
                      <TableCell>{r.recycling_points}</TableCell>
                      <TableCell className="font-semibold">{r.club_points_expected}</TableCell>
                      <TableCell>
                        <Badge className={statusBadge[r.status]}>{statusLabel[r.status]}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {r.status === 'REJECTED' ? r.rejection_reason || '-' : '-'}
                      </TableCell>
                      <TableCell>
                        {r.status === 'PENDING' ? (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => approve(r.id)} disabled={loading}>
                              موافقة
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => reject(r.id)} disabled={loading}>
                              رفض
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

