import React from 'react';
import Link from 'next/link';
import { PurchaseInvoice, PurchaseInvoiceStatus } from '../types';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/lib/utils';

interface PurchaseInvoicesTableProps {
  invoices: PurchaseInvoice[];
  loading?: boolean;
  onStatusChange?: (invoiceId: string, status: PurchaseInvoiceStatus) => void;
}

const statusLabels: Record<PurchaseInvoiceStatus, string> = {
  draft: 'مسودة',
  pending: 'قيد المراجعة',
  pending_approval: 'بانتظار الاعتماد',
  approved: 'معتمدة',
  assigned_to_warehouse: 'مُسندة للمخازن',
  partially_received: 'استلام جزئي',
  received_in_warehouse: 'تم الاستلام بالمخزن',
  ready_for_pricing: 'جاهزة للتسعير',
  received: 'مستلمة',
  priced: 'تم التسعير',
  rejected: 'مرفوضة',
  cancelled: 'ملغاة',
};

const statusColors: Record<PurchaseInvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-800',
  pending_approval: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  assigned_to_warehouse: 'bg-sky-100 text-sky-800',
  partially_received: 'bg-orange-100 text-orange-800',
  received_in_warehouse: 'bg-blue-100 text-blue-800',
  ready_for_pricing: 'bg-indigo-100 text-indigo-800',
  received: 'bg-cyan-100 text-cyan-800',
  priced: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-200 text-slate-700',
};

const emptyFallback = (
  <div className="py-16 text-center text-gray-500">
    لا توجد فواتير مشتريات حالياً. قم بإضافة فاتورة جديدة.
  </div>
);

export const PurchaseInvoicesTable: React.FC<PurchaseInvoicesTableProps> = ({
  invoices,
  loading,
  onStatusChange,
}) => {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الفاتورة</TableHead>
              <TableHead>المورد</TableHead>
              <TableHead>المخزن</TableHead>
              <TableHead>تاريخ الفاتورة</TableHead>
              <TableHead>إجمالي الفاتورة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                  جاري تحميل فواتير المشتريات...
                </TableCell>
              </TableRow>
            )}
            {!loading && invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>{emptyFallback}</TableCell>
              </TableRow>
            )}
            {!loading &&
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{invoice.supplier_name || '—'}</TableCell>
                  <TableCell>{invoice.warehouse_name || `مخزن #${invoice.warehouse_id}`}</TableCell>
                  <TableCell>{new Date(invoice.invoice_date).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell>{Number(invoice.total_amount).toLocaleString('ar-EG')} ج.م</TableCell>
                  <TableCell>
                    <Badge className={cn(statusColors[invoice.status], 'font-semibold')}>
                      {statusLabels[invoice.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2 justify-end">
                    <Link href={`/financial-management/purchasing/invoices/${invoice.id}`}>
                      <Button variant="outline" size="sm">
                        عرض
                      </Button>
                    </Link>
                    {['draft', 'pending', 'pending_approval', 'approved', 'assigned_to_warehouse', 'received_in_warehouse'].includes(
                      invoice.status
                    ) && (
                      <Button
                        size="sm"
                        onClick={() => onStatusChange?.(invoice.id, 'ready_for_pricing')}
                        variant="default"
                      >
                        إرسال للتسعير
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PurchaseInvoicesTable;


