'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Button } from '@/shared/ui/button';
import Link from 'next/link';
import supplyOrdersService, { SupplyOrderHeader } from '@/domains/warehouse-management/services/supplyOrdersService';

export default function SupplyOrdersListPage() {
  const [rows, setRows] = useState<SupplyOrderHeader[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await supplyOrdersService.list();
        setRows(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <DashboardLayout title="طلبات التوريد">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>قائمة طلبات التوريد</CardTitle>
              <Link href="/warehouse-management/warehouses/1/supply-orders/new">
                <Button>إنشاء طلب جديد</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-6 text-center">جاري التحميل...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>المخزن</TableHead>
                    <TableHead>المورد</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.invoice_number}</TableCell>
                      <TableCell>{r.warehouse_id}</TableCell>
                      <TableCell>{r.supplier_id ?? '-'}</TableCell>
                      <TableCell>{r.invoice_date ?? '-'}</TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>{r.total_amount ?? 0}</TableCell>
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

















