'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import inventoryService from '@/domains/warehouse-management/services/inventoryService';

export default function MovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{warehouseId?: string; productId?: string; from?: string; to?: string}>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await inventoryService.getRecentMovements(0 as any, 50).catch(() => []);
        setMovements(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <DashboardLayout title="حركة المخزون">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>البحث</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input placeholder="Warehouse ID" value={filters.warehouseId || ''} onChange={(e) => setFilters((p) => ({...p, warehouseId: e.target.value}))} />
            <Input placeholder="Product ID" value={filters.productId || ''} onChange={(e) => setFilters((p) => ({...p, productId: e.target.value}))} />
            <Input type="date" value={filters.from || ''} onChange={(e) => setFilters((p) => ({...p, from: e.target.value}))} />
            <Input type="date" value={filters.to || ''} onChange={(e) => setFilters((p) => ({...p, to: e.target.value}))} />
            <div className="col-span-full flex justify-end">
              <Button disabled>بحث (لاحقًا)</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>سجل الحركات</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-6 text-center">جاري التحميل...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المخزن</TableHead>
                    <TableHead>المنتج</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.warehouse_id}</TableCell>
                      <TableCell>{m.product_id}</TableCell>
                      <TableCell>{m.movement_type}</TableCell>
                      <TableCell>{m.quantity}</TableCell>
                      <TableCell>{m.price ?? '-'}</TableCell>
                      <TableCell>{m.created_at?.toString()?.slice(0,19).replace('T',' ')}</TableCell>
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

















