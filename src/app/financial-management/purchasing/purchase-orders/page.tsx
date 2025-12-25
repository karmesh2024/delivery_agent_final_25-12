'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { PurchaseOrder, PurchaseOrderStatus } from '@/domains/purchasing/types';
import { toast } from 'sonner';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
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

const statusFilters: Array<{ value: PurchaseOrderStatus | 'all'; label: string }> = [
  { value: 'all', label: 'الكل' },
  { value: 'draft', label: 'مسودة' },
  { value: 'pending_approval', label: 'بانتظار الاعتماد' },
  { value: 'approved', label: 'معتمدة' },
  { value: 'sent_to_supplier', label: 'مرسلة للمورد' },
  { value: 'cancelled', label: 'ملغاة' },
];

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all');
  const token = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, token]);

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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const headers = await getHeaders();
      const response = await fetch(`/api/purchasing/purchase-orders?${params.toString()}`, {
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في جلب أوامر الشراء');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error: any) {
      console.error('Error fetching purchase orders:', error);
      toast.error(error.message || 'حدث خطأ أثناء جلب أوامر الشراء');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="أوامر الشراء">
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">أوامر الشراء</h1>
            <p className="text-gray-600">
              إدارة أوامر الشراء من الموردين وتتبع حالاتها.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/financial-management/purchasing/purchase-orders/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                إضافة أمر شراء
              </Button>
            </Link>
            <Link href="/financial-management/purchasing">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                فواتير المشتريات
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>التصفية حسب الحالة</CardTitle>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PurchaseOrderStatus | 'all')}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusFilters.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>قائمة أوامر الشراء</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المورد</TableHead>
                  <TableHead>المخزن</TableHead>
                  <TableHead>تاريخ التسليم المتوقع</TableHead>
                  <TableHead>المبلغ الإجمالي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-gray-500">جاري تحميل أوامر الشراء...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-gray-500">
                      لا توجد أوامر شراء حالياً. قم بإضافة أمر شراء جديد.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.supplier_name || '—'}</TableCell>
                      <TableCell>{order.warehouse_name || `مخزن #${order.warehouse_id}`}</TableCell>
                      <TableCell>
                        {order.expected_delivery_date
                          ? new Date(order.expected_delivery_date).toLocaleDateString('ar-EG')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {order.total_amount.toLocaleString('ar-EG', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        ج.م
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(statusColors[order.status], 'font-semibold')}>
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString('ar-EG')
                          : '—'}
                      </TableCell>
                      <TableCell className="flex gap-2 justify-end">
                        <Link href={`/financial-management/purchasing/purchase-orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            عرض
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

