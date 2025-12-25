'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import inventoryService, { WarehouseInventoryRow, InventoryMovementRow } from '@/domains/warehouse-management/services/inventoryService';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';

export default function WarehouseInventoryPage() {
  const params = useParams();
  const { id } = params as { id: string };

  const [inventory, setInventory] = useState<WarehouseInventoryRow[]>([]);
  const [movements, setMovements] = useState<InventoryMovementRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const wid = parseInt(id, 10);
        const [inv, mov] = await Promise.all([
          inventoryService.getWarehouseInventory(wid),
          inventoryService.getRecentMovements(wid, 20),
        ]);
        setInventory(inv);
        setMovements(mov);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <DashboardLayout title="المخزون">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>مخزون المخزن #{id}</CardTitle>
              <div className="flex gap-2">
                <Link href={`/warehouse-management/warehouses/${id}/invoices/new`}>
                  <Button>استلام فاتورة</Button>
                </Link>
                <Link href={`/warehouse-management/movements`}>
                  <Button variant="outline">حركة المخزون</Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center p-6">جاري التحميل...</div>
            ) : inventory.length === 0 ? (
              <div className="text-gray-600">لا توجد بيانات مخزون لهذا المخزن.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنتج</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>الوحدة</TableHead>
                    <TableHead>آخر تحديث</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.product_id}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>{row.unit}</TableCell>
                      <TableCell>{row.last_updated?.toString()?.slice(0, 19).replace('T', ' ')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أحدث الحركات</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center p-6">جاري التحميل...</div>
            ) : movements.length === 0 ? (
              <div className="text-gray-600">لا توجد حركات حديثة.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نوع الحركة</TableHead>
                    <TableHead>المنتج</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>المصدر</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.movement_type}</TableCell>
                      <TableCell>{m.product_id}</TableCell>
                      <TableCell>{m.quantity}</TableCell>
                      <TableCell>{m.price ?? '-'}</TableCell>
                      <TableCell>{m.source_type ?? '-'}</TableCell>
                      <TableCell>{m.created_at?.toString()?.slice(0, 19).replace('T', ' ')}</TableCell>
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


