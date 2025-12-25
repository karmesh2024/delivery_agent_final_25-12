'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import Link from 'next/link';
import supplyOrdersService from '@/domains/warehouse-management/services/supplyOrdersService';
import inventoryService from '@/domains/warehouse-management/services/inventoryService';
import { toast } from 'react-toastify';
import { supplierService } from '@/domains/supplier-management/services/supplierService';
import { approvedAgentService } from '@/domains/approved-agents/api/approvedAgentService';
import { getAgents } from '@/lib/supabase';
import { productCatalogService } from '@/services/productCatalogService';

// دالة لتحويل unit code إلى measurement_unit enum value
const convertUnitCodeToMeasurementUnit = (unitCode: string | null | undefined): 'piece' | 'dozen' | 'kg' | 'liter' | 'pack' | 'box' | 'set' | 'other' | null => {
  if (!unitCode) return null;
  
  const unitCodeUpper = unitCode.toUpperCase();
  
  // خريطة تحويل unit codes إلى measurement_unit enum values
  const unitMapping: Record<string, 'piece' | 'dozen' | 'kg' | 'liter' | 'pack' | 'box' | 'set' | 'other'> = {
    'PCS': 'piece',
    'PIECE': 'piece',
    'قطعة': 'piece',
    'DOZEN': 'dozen',
    'دزينة': 'dozen',
    'KG': 'kg',
    'كيلوجرام': 'kg',
    'كجم': 'kg',
    'L': 'liter',
    'LITER': 'liter',
    'لتر': 'liter',
    'PACK': 'pack',
    'كيس': 'pack',
    'BAG': 'pack',
    'BOX': 'box',
    'صندوق': 'box',
    'SET': 'set',
    'مجموعة': 'set',
  };
  
  return unitMapping[unitCodeUpper] || 'other';
};

function NewSupplyOrderForm() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const search = useSearchParams();
  const warehouseId = parseInt(id, 10);

  // توليد رقم فاتورة فريد: timestamp + random number
  const generateUniqueInvoiceNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000); // رقم عشوائي من 0 إلى 999
    return `INV-${timestamp}-${random}`;
  };

  const [invoiceNumber, setInvoiceNumber] = useState(generateUniqueInvoiceNumber());
  const [sourceType, setSourceType] = useState<'supplier'|'agent'|'delivery'>('supplier');
  const [sourceId, setSourceId] = useState<string>('');
  const [orderType, setOrderType] = useState<'product'|'waste'>('product');
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit: '' }]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [units, setUnits] = useState<{ id: number; code: string; name: string }[]>([]);

  // Prefill from link
  useEffect(() => {
    const st = search?.get('sourceType') as any;
    const sid = search?.get('sourceId') || '';
    const ot = search?.get('orderType') as any;
    if (st) setSourceType(st);
    if (sid) setSourceId(sid);
    if (ot) setOrderType(ot);
  }, [search]);

  // Load lists
  useEffect(() => {
    (async () => {
      try { const s = await supplierService.getAll(); setSuppliers(s || []); } catch {}
      try { const { agents: a } = await approvedAgentService.getApprovedAgents(); setAgents(a || []); } catch {}
      try { const d = await getAgents(); setDeliveryBoys(d || []); } catch {}
      try { 
        const products = await productCatalogService.getProducts(); 
        setCatalogProducts(products || []); 
      } catch {}
      try { 
        const unitsList = await productCatalogService.getUnits(); 
        setUnits(unitsList || []); 
      } catch {}
    })();
  }, []);

  const addRow = () => setItems((p) => [...p, { product_id: '', quantity: 1, unit: '' }]);
  const updateRow = (i: number, patch: any) => setItems((p) => p.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));

  // الحصول على معلومات المنتج المحدد
  const getSelectedProduct = (productId: string) => {
    return catalogProducts.find(p => String(p.id) === productId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // التحقق من أن جميع المنتجات موجودة في الكتالوج
      const invalidItems = items.filter(it => !it.product_id);
      if (invalidItems.length > 0) {
        toast.error('يجب اختيار منتج من كتالوج المخازن لكل بند');
        return;
      }

      // التحقق من صحة معرفات المنتجات
      const ensuredItems = items.map((it) => {
        const product = getSelectedProduct(it.product_id);
        if (!product) {
          throw new Error(`المنتج المحدد غير موجود في الكتالوج: ${it.product_id}`);
        }
        return {
          ...it,
          product_id: String(product.id), // تأكد من تحويل BigInt إلى string
        };
      });

      // محاولة إنشاء طلب التوريد مع إعادة المحاولة في حالة تكرار رقم الفاتورة
      let currentInvoiceNumber = invoiceNumber;
      let orderId: string | null = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (!orderId && retryCount < maxRetries) {
        try {
      const header = {
            invoice_number: currentInvoiceNumber,
        warehouse_id: warehouseId,
        supplier_id: sourceType === 'supplier' && sourceId ? parseInt(sourceId, 10) : null,
        invoice_date: new Date().toISOString(),
        status: 'pending' as const,
      };
          orderId = await supplyOrdersService.create(header, ensuredItems.map((r) => ({
        invoice_id: '', // filled in the service
            product_id: null, // لا نستخدم product_id لأننا نستخدم catalog_product_id
            catalog_product_id: r.product_id, // استخدام catalog_product_id لأن المنتجات من كتالوج المخازن
        quantity: r.quantity,
            unit_price: 0, // التسعير يتم من وظيفة إدارة التسعير في الإدارة المالية
            measurement_unit: convertUnitCodeToMeasurementUnit(r.unit) || 'piece', // تحويل unit code إلى measurement_unit enum
      })));
        } catch (err: any) {
          // إذا كان الخطأ بسبب تكرار رقم الفاتورة، قم بتوليد رقم جديد والمحاولة مرة أخرى
          if (err?.code === '23505' || err?.message?.includes('duplicate key') || err?.message?.includes('invoice_number')) {
            retryCount++;
            if (retryCount < maxRetries) {
              currentInvoiceNumber = generateUniqueInvoiceNumber();
              console.log(`تم اكتشاف تكرار في رقم الفاتورة. إعادة المحاولة برقم جديد: ${currentInvoiceNumber}`);
              continue;
            } else {
              throw new Error('فشل إنشاء طلب التوريد بعد عدة محاولات بسبب تكرار أرقام الفواتير. يرجى المحاولة مرة أخرى.');
            }
          }
          // إذا كان الخطأ مختلفاً، قم برميه مباشرة
          throw err;
        }
      }

      if (!orderId) {
        throw new Error('فشل إنشاء طلب التوريد');
      }

      // mark received and register inventory IN movements
      await supplyOrdersService.markReceived(orderId);
      
      // تسجيل حركات المخزون لكل منتج
      for (const it of ensuredItems) {
        try {
        await inventoryService.recordInMovement({
          warehouse_id: warehouseId,
            catalog_product_id: it.product_id, // استخدام catalog_product_id لأن المنتجات من كتالوج المخازن
          quantity: it.quantity,
            price: 0, // التسعير يتم من وظيفة إدارة التسعير في الإدارة المالية
          unit: it.unit || null,
          source_type: sourceType,
          source_id: sourceId || null,
        });
        } catch (inventoryError: any) {
          console.error('Error recording inventory movement:', inventoryError);
          toast.error(`فشل تحديث المخزون للمنتج: ${inventoryError.message || 'خطأ غير معروف'}`);
          throw inventoryError; // إعادة رمي الخطأ لإيقاف العملية
        }
      }

      toast.success('تم إنشاء طلب التوريد واستلامه وتحديث المخزون');
      router.push('/warehouse-management/supply-orders');
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      const errorMessage = err?.message || 'خطأ غير معروف';
      toast.error(`تعذر حفظ طلب التوريد: ${errorMessage}`);
    }
  };

  return (
    <DashboardLayout title="إنشاء طلب توريد">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">إنشاء طلب توريد</h1>
          <Link href="/warehouse-management/catalog">
            <Button variant="outline">
              إضافة منتج جديد إلى الكتالوج
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>رأس الطلب</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm">رقم الطلب</label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">المخزن</label>
              <Input disabled value={warehouseId} />
            </div>
            <div>
              <label className="text-sm">نوع الطلب</label>
              <Select value={orderType} onValueChange={(v)=>setOrderType(v as any)}>
                <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="product">منتج</SelectItem>
                    <SelectItem value="waste">مخلفات</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">جهة التوريد</label>
              <Select value={sourceType} onValueChange={(v)=>{setSourceType(v as any); setSourceId('');}}>
                <SelectTrigger><SelectValue placeholder="اختر الجهة" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="supplier">مورد</SelectItem>
                    <SelectItem value="agent">وكيل</SelectItem>
                    <SelectItem value="delivery">دليفري بوي</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">اختيار الجهة</label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger><SelectValue placeholder="اختر من القائمة" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {sourceType==='supplier' && suppliers.map((s:any)=> (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                    {sourceType==='agent' && agents.map((a:any)=> (
                      <SelectItem key={a.id} value={String(a.id)}>{a.full_name || a.name}</SelectItem>
                    ))}
                    {sourceType==='delivery' && deliveryBoys.map((d:any)=> (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name || d.full_name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>بنود الطلب</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              {items.map((r, i) => {
                const selectedProduct = getSelectedProduct(r.product_id);
                return (
                <div key={i} className="space-y-2 border rounded-md p-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div>
                        <label className="text-sm mb-1 block">اختيار المنتج من الكتالوج *</label>
                        <Select value={r.product_id} onValueChange={(value) => {
                          updateRow(i, { product_id: value });
                          const product = getSelectedProduct(value);
                          if (product && product.unit_id && units.length > 0) {
                            // تعبئة الوحدة تلقائياً من معلومات المنتج
                            const productUnit = units.find(u => u.id === Number(product.unit_id));
                            if (productUnit) {
                              updateRow(i, { unit: productUnit.code });
                            } else {
                              // إذا لم توجد وحدة محددة، نستخدم الوحدة الافتراضية حسب unit_mode
                              const unitMode = product.unit_mode;
                              const defaultUnit = unitMode === 'count' ? units.find(u => u.code === 'piece') :
                                                unitMode === 'weight' ? units.find(u => u.code === 'kg') :
                                                unitMode === 'volume' ? units.find(u => u.code === 'liter') :
                                                units.find(u => u.code === 'piece');
                              if (defaultUnit) {
                                updateRow(i, { unit: defaultUnit.code });
                              }
                            }
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر منتج من الكتالوج" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {catalogProducts.length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-gray-500">لا توجد منتجات في الكتالوج</div>
                              ) : (
                                catalogProducts.map((product: any) => (
                                  <SelectItem key={product.id} value={String(product.id)}>
                                    {product.name} - {product.sku} ({product.product_code})
                                  </SelectItem>
                                ))
                              )}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm mb-1 block">الكمية *</label>
                        <Input type="number" min={1} value={r.quantity} onChange={(e) => updateRow(i, { quantity: parseFloat(e.target.value || '0') })} />
                      </div>
                      <div>
                        <label className="text-sm mb-1 block">الوحدة</label>
                        <Select value={r.unit} onValueChange={(value) => updateRow(i, { unit: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الوحدة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {units.length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-gray-500">جاري تحميل الوحدات...</div>
                              ) : (
                                units.map((unit) => (
                                  <SelectItem key={unit.id} value={unit.code}>
                                    {unit.name} ({unit.code})
                                  </SelectItem>
                                ))
                              )}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button type="button" variant="outline" onClick={() => removeRow(i)}>حذف</Button>
                      </div>
                    </div>
                    {selectedProduct && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <strong>معلومات المنتج:</strong> {selectedProduct.name} | 
                        SKU: {selectedProduct.sku} | 
                        الكود: {selectedProduct.product_code} |
                        {selectedProduct.brand && ` العلامة: ${selectedProduct.brand}`}
                    </div>
                  )}
                </div>
                );
              })}
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={addRow}>إضافة بند</Button>
                <Button type="submit">حفظ واستلام</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function NewSupplyOrderPage() {
  return (
    <Suspense fallback={
      <DashboardLayout title="جاري التحميل...">
        <div className="flex justify-center items-center min-h-[400px]">
          جاري التحميل...
        </div>
      </DashboardLayout>
    }>
      <NewSupplyOrderForm />
    </Suspense>
  );
}
