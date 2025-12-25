'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import inventoryService from '@/domains/warehouse-management/services/inventoryService';
import { toast } from 'react-toastify';

interface InvoiceItemForm {
  product_id: string;
  quantity: number;
  unit?: string | null;
}

export default function NewWarehouseInvoicePage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const warehouseId = parseInt(id, 10);

  const [items, setItems] = useState<InvoiceItemForm[]>([
    { product_id: '', quantity: 1, unit: null },
  ]);

  const addRow = () => setItems((prev) => [...prev, { product_id: '', quantity: 1, unit: null }]);
  const removeRow = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateRow = (idx: number, patch: Partial<InvoiceItemForm>) =>
    setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // التحقق من صحة البيانات
      const validItems = items.filter(it => it.product_id && it.quantity > 0);
      if (validItems.length === 0) {
        toast.error('يرجى إدخال منتج واحد على الأقل مع الكمية');
        return;
      }

      // إنشاء رقم فاتورة تلقائي
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // إنشاء الفاتورة مع العناصر (مع حفظ سعر التكلفة)
      const response = await fetch('/api/warehouse/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouse_id: warehouseId,
          supplier_id: null, // يمكن إضافته لاحقاً
          invoice_number: invoiceNumber,
          invoice_date: new Date().toISOString(),
          items: validItems.map(it => ({
            product_id: it.product_id,
            catalog_product_id: null, // يمكن إضافته لاحقاً
            quantity: it.quantity,
            unit_price: null, // سيتم إدخال سعر التكلفة في إدارة التسعير
            measurement_unit: it.unit || 'piece',
            batch_number: null,
            expiry_date: null,
            notes: null,
          })),
          notes: null,
          created_by: null, // يمكن إضافة المستخدم الحالي لاحقاً
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في إنشاء الفاتورة');
      }

      const invoiceData = await response.json();

      // تسجيل حركات المخزون
      for (const it of validItems) {
        try {
          await inventoryService.recordInMovement({
            warehouse_id: warehouseId,
            product_id: it.product_id,
            quantity: it.quantity,
            price: null, // لا يوجد سعر في إدارة المخازن
            unit: it.unit ?? null,
            source_type: 'invoice',
            source_id: invoiceData.id, // ربط الحركة بالفاتورة
          });
        } catch (movementError) {
          console.error('Error recording inventory movement:', movementError);
          // لا نوقف العملية إذا فشل تسجيل الحركة
        }
      }

      toast.success('تم استلام الفاتورة بنجاح. سيتم إدخال سعر التكلفة في إدارة التسعير');
      router.push(`/warehouse-management/warehouses/${warehouseId}/inventory`);
    } catch (err: any) {
      console.error('Error submitting invoice:', err);
      toast.error(err.message || 'تعذر حفظ الفاتورة');
    }
  };

  return (
    <DashboardLayout title="استلام فاتورة للمخزن">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>بنود الفاتورة</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>معرّف المنتج/المخلف</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>الوحدة</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Input
                          placeholder="product_id"
                          value={row.product_id}
                          onChange={(e) => updateRow(idx, { product_id: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) => updateRow(idx, { quantity: parseFloat(e.target.value || '0') })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="مثال: piece | kg | liter"
                          value={row.unit ?? ''}
                          onChange={(e) => updateRow(idx, { unit: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="outline" onClick={() => removeRow(idx)}>
                          حذف
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={addRow}>
                  إضافة بند
                </Button>
                <Button type="submit">استلام الفاتورة</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

















