'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { PurchaseOrder, PurchaseOrderStatus } from '@/domains/purchasing/types';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Edit, Trash2, CheckCircle, XCircle, Package } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

const statusLabels: Record<PurchaseOrderStatus, string> = {
  draft: 'مسودة',
  pending_approval: 'بانتظار الاعتماد',
  approved: 'معتمدة',
  sent_to_supplier: 'مرسلة للمورد',
  cancelled: 'ملغاة',
};

const statusColors: Record<PurchaseOrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  sent_to_supplier: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-slate-200 text-slate-700',
};

export default function PurchaseOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const token = useAppSelector((state) => state.auth.token);

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<PurchaseOrderStatus | ''>('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, token]);

  const getHeaders = async (): Promise<HeadersInit> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    let authToken = token;
    
    if (!authToken && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || null;
      } catch (error) {
        console.warn('Error getting session:', error);
      }
    }
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    return headers;
  };

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const response = await fetch(`/api/purchasing/purchase-orders/${orderId}`, {
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في جلب أمر الشراء');
      }

      const data = await response.json();
      setOrder(data.order);
      setNewStatus(data.order.status);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      toast.error(error.message || 'فشل في جلب أمر الشراء');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || !order || newStatus === order.status) return;

    setUpdating(true);
    try {
      const headers = await getHeaders();
      const response = await fetch(`/api/purchasing/purchase-orders/${orderId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في تحديث الحالة');
      }

      const data = await response.json();
      setOrder(data.order);
      toast.success('تم تحديث حالة أمر الشراء بنجاح');
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'فشل في تحديث الحالة');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف أمر الشراء؟ لا يمكن التراجع عن هذه العملية.')) {
      return;
    }

    setDeleting(true);
    try {
      const headers = await getHeaders();
      const response = await fetch(`/api/purchasing/purchase-orders/${orderId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في حذف أمر الشراء');
      }

      toast.success('تم حذف أمر الشراء بنجاح');
      router.push('/financial-management/purchasing/purchase-orders');
    } catch (error: any) {
      console.error('Error deleting order:', error);
      toast.error(error.message || 'فشل في حذف أمر الشراء');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="تفاصيل أمر الشراء">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="mr-2 text-gray-500">جاري تحميل أمر الشراء...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout title="تفاصيل أمر الشراء">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">أمر الشراء غير موجود</p>
            <Link href="/financial-management/purchasing/purchase-orders">
              <Button variant="outline" className="mt-4">
                العودة إلى قائمة أوامر الشراء
              </Button>
            </Link>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const canEdit = order.status === 'draft' || order.status === 'pending_approval';
  const canDelete = order.status === 'draft';

  return (
    <DashboardLayout title="تفاصيل أمر الشراء">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/financial-management/purchasing/purchase-orders">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">تفاصيل أمر الشراء</h1>
              <p className="text-gray-600">معلومات تفصيلية عن أمر الشراء</p>
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <Link href={`/financial-management/purchasing/purchase-orders/${orderId}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  تعديل
                </Button>
              </Link>
            )}
            {canDelete && (
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    جاري الحذف...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    حذف
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>بيانات أمر الشراء</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">المورد</p>
                  <p className="font-semibold">{order.supplier_name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">المخزن</p>
                  <p className="font-semibold">{order.warehouse_name || `مخزن #${order.warehouse_id}`}</p>
                </div>
                {order.expected_delivery_date && (
                  <div>
                    <p className="text-sm text-gray-600">تاريخ التسليم المتوقع</p>
                    <p className="font-semibold">
                      {new Date(order.expected_delivery_date).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">المبلغ الإجمالي</p>
                  <p className="font-semibold text-lg text-blue-700">
                    {order.total_amount.toLocaleString('ar-EG', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    ج.م
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الحالة</p>
                  <Badge className={cn(statusColors[order.status], 'font-semibold')}>
                    {statusLabels[order.status]}
                  </Badge>
                </div>
                {order.created_at && (
                  <div>
                    <p className="text-sm text-gray-600">تاريخ الإنشاء</p>
                    <p className="font-semibold">
                      {new Date(order.created_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
              {order.notes && (
                <div>
                  <p className="text-sm text-gray-600">ملاحظات</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>إدارة الحالة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canEdit && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">تغيير الحالة</label>
                  <div className="flex gap-2">
                    <Select
                      value={newStatus}
                      onValueChange={(value) => setNewStatus(value as PurchaseOrderStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">مسودة</SelectItem>
                        <SelectItem value="pending_approval">بانتظار الاعتماد</SelectItem>
                        <SelectItem value="approved">معتمدة</SelectItem>
                        <SelectItem value="sent_to_supplier">مرسلة للمورد</SelectItem>
                        <SelectItem value="cancelled">ملغاة</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleStatusUpdate} disabled={updating || newStatus === order.status}>
                      {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تحديث'}
                    </Button>
                  </div>
                </div>
              )}

              {!canEdit && (
                <div className="text-sm text-gray-500">
                  لا يمكن تعديل حالة أمر الشراء في هذه المرحلة
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                بنود أمر الشراء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>SKU / رقم</TableHead>
                    <TableHead>اسم المنتج/المخلفات</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>الوحدة</TableHead>
                    <TableHead>سعر الوحدة</TableHead>
                    <TableHead className="text-left">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{item.sku || '—'}</TableCell>
                      <TableCell>{item.name || '—'}</TableCell>
                      <TableCell>{item.quantity.toLocaleString('ar-EG')}</TableCell>
                      <TableCell>{item.measurement_unit || 'قطعة'}</TableCell>
                      <TableCell>
                        {item.unit_price.toLocaleString('ar-EG', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        ج.م
                      </TableCell>
                      <TableCell className="font-semibold">
                        {item.total_price.toLocaleString('ar-EG', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        ج.م
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-bold">
                    <TableCell colSpan={6} className="text-right">
                      إجمالي أمر الشراء:
                    </TableCell>
                    <TableCell className="text-lg text-blue-700">
                      {order.total_amount.toLocaleString('ar-EG', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      ج.م
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

