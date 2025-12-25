'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { PurchaseInvoicesTable } from '@/domains/purchasing/components/PurchaseInvoicesTable';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchPurchaseInvoices,
  setPurchasingFilters,
  updatePurchaseInvoiceStatus,
} from '@/domains/purchasing/store/purchasingSlice';
import { PurchaseInvoiceStatus } from '@/domains/purchasing/types';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';

const statusFilters: Array<{ value: PurchaseInvoiceStatus | 'all'; label: string }> = [
  { value: 'all', label: 'الكل' },
  { value: 'draft', label: 'مسودة' },
  { value: 'pending', label: 'قيد المراجعة' },
  { value: 'pending_approval', label: 'بانتظار الاعتماد' },
  { value: 'approved', label: 'معتمدة' },
  { value: 'assigned_to_warehouse', label: 'مُسندة للمخازن' },
  { value: 'partially_received', label: 'استلام جزئي' },
  { value: 'received_in_warehouse', label: 'تم الاستلام بالمخزن' },
  { value: 'ready_for_pricing', label: 'جاهزة للتسعير' },
  { value: 'priced', label: 'تم التسعير' },
  { value: 'rejected', label: 'مرفوضة' },
  { value: 'cancelled', label: 'ملغاة' },
];

export default function PurchasingManagementPage() {
  const dispatch = useAppDispatch();
  const { invoices, loading, filters } = useAppSelector((state) => state.purchasing);

  useEffect(() => {
    dispatch(fetchPurchaseInvoices(filters));
  }, [dispatch, filters.status, filters.supplierId, filters.search]);

  const handleStatusChange = async (invoiceId: string, status: PurchaseInvoiceStatus) => {
    try {
      await dispatch(updatePurchaseInvoiceStatus({ invoiceId, status })).unwrap();
      toast.success('تم إرسال الفاتورة إلى إدارة التسعير');
    } catch (error: any) {
      toast.error(error?.message || 'تعذر تحديث حالة الفاتورة');
    }
  };

  return (
    <DashboardLayout title="إدارة المشتريات">
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">إدارة المشتريات</h1>
            <p className="text-gray-600">
              استلام فواتير الموردين، مراجعتها، وتحويلها لإدارة التسعير مع سجل كامل للحالات.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/financial-management/purchasing/purchase-orders">
              <Button variant="outline">
                أوامر الشراء
              </Button>
            </Link>
            <Link href="/financial-management/purchasing/reports">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                التقارير
              </Button>
            </Link>
            <Link href="/financial-management/purchasing/invoices/new">
              <Button>إضافة فاتورة مشتريات</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>التصفية حسب الحالة</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={filters.status === filter.value ? 'default' : 'outline'}
                onClick={() => dispatch(setPurchasingFilters({ status: filter.value }))}
              >
                {filter.label}
                {filter.value !== 'all' && (
                  <Badge className="ml-2 bg-black/10 text-black">
                    {invoices.filter((inv) => inv.status === filter.value).length}
                  </Badge>
                )}
              </Button>
            ))}
          </CardContent>
        </Card>

        <PurchaseInvoicesTable invoices={invoices} loading={loading} onStatusChange={handleStatusChange} />
      </div>
    </DashboardLayout>
  );
}


