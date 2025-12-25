'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  DollarSign,
  TrendingUp,
  Calculator,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { CUSTOMER_TYPE_LABELS, CustomerType } from '@/domains/pricing/types/types';
import { useAppSelector } from '@/store/hooks';
import { supabase } from '@/lib/supabase';

interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  catalog_product_id: string | null;
  quantity: string;
  unit_price: string;
  total_price: string;
  measurement_unit: string;
  catalog_products?: {
    id: string;
    name: string;
    sku: string;
  } | null;
  store_products?: {
    id: string;
    name_ar: string;
    name_en: string | null;
    sku: string;
  } | null;
  product_pricing?: Array<{
    id: string;
    customer_type: CustomerType;
    cost_price: string;
    selling_price: string;
    markup_percentage: string;
    profit_margin: string;
    status: string;
  }>;
}

interface Invoice {
  id: string;
  invoice_number: string;
  warehouse_id: number;
  supplier_id: number | null;
  invoice_date: string;
  received_date: string | null;
  total_amount: string;
  status: string;
  warehouses?: {
    id: number;
    name: string;
    location: string | null;
  };
  suppliers?: {
    id: number;
    name: string;
    name_ar: string | null;
  };
  warehouse_invoice_items: InvoiceItem[];
}

const CUSTOMER_TYPES: CustomerType[] = ['retail', 'agent', 'wholesale', 'other'];

export default function InvoicePricingPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;
  const token = useAppSelector((state) => state.auth.token);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Cost prices state: { [itemId]: costPrice }
  const [costPrices, setCostPrices] = useState<Record<string, string>>({});
  
  // Discounts state: { [itemId]: discountValue }
  const [discounts, setDiscounts] = useState<Record<string, string>>({});
  
  // Pricing state: { [itemId]: { [customerType]: sellingPrice } }
  const [pricing, setPricing] = useState<Record<string, Record<CustomerType, string>>>({});

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const getHeaders = async (): Promise<HeadersInit> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // الحصول على التوكن من Redux store أو من Supabase مباشرة
    let authToken = token;
    
    console.log('[PricePage] getHeaders: Token from Redux:', token ? 'exists' : 'missing');
    
    if (!authToken && supabase) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[PricePage] getHeaders: Error getting session:', error);
        } else {
          authToken = session?.access_token || null;
          console.log('[PricePage] getHeaders: Token from Supabase:', authToken ? 'exists' : 'missing');
        }
      } catch (sessionError) {
        console.error('[PricePage] getHeaders: Error getting session from Supabase:', sessionError);
      }
    }
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      console.log('[PricePage] getHeaders: Authorization header set');
    } else {
      console.error('[PricePage] getHeaders: No token available!');
    }
    
    return headers;
  };

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pricing/invoices/${invoiceId}`, {
        headers: await getHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل في جلب الفاتورة');
      }
      
      const data = await response.json();
      
      console.log('[PricePage] Invoice data received:', {
        invoiceId: data.id,
        itemsCount: data.warehouse_invoice_items?.length || 0,
        items: data.warehouse_invoice_items?.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          catalog_product_id: item.catalog_product_id,
          catalog_products: item.catalog_products,
          store_products: item.store_products,
        })),
      });
      
      setInvoice(data);
      
      // تحميل أسعار التكلفة والخصومات الموجودة
      const existingCostPrices: Record<string, string> = {};
      const existingDiscounts: Record<string, string> = {};
      data.warehouse_invoice_items?.forEach((item: InvoiceItem) => {
        // إذا كان unit_price موجوداً وليس 0، استخدمه
        const unitPrice = parseFloat(item.unit_price || '0');
        if (unitPrice > 0) {
          existingCostPrices[item.id] = item.unit_price;
        }
        // استخراج الخصم من notes (إذا كان موجوداً)
        // في نظام المشتريات، الخصم يُحفظ في notes كرقم
        if (item.notes && !isNaN(Number(item.notes))) {
          existingDiscounts[item.id] = item.notes;
        }
      });
      setCostPrices(existingCostPrices);
      setDiscounts(existingDiscounts);
      
      // تحميل الأسعار الموجودة
      const existingPricing: Record<string, Record<CustomerType, string>> = {};
      data.warehouse_invoice_items?.forEach((item: InvoiceItem) => {
        existingPricing[item.id] = {
          retail: '',
          agent: '',
          wholesale: '',
          other: '',
        };
        
        item.product_pricing?.forEach((p) => {
          existingPricing[item.id][p.customer_type] = p.selling_price;
        });
      });
      
      setPricing(existingPricing);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('فشل في جلب الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  const handleCostPriceChange = (itemId: string, value: string) => {
    setCostPrices((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const handleDiscountChange = (itemId: string, value: string) => {
    setDiscounts((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  // حساب سعر التكلفة الفعلي بعد الخصم
  const getEffectiveCostPrice = (itemId: string, baseCostPrice: number): number => {
    const discount = parseFloat(discounts[itemId] || '0');
    const totalPrice = baseCostPrice * parseFloat(invoice?.warehouse_invoice_items.find(i => i.id === itemId)?.quantity || '1');
    const totalAfterDiscount = totalPrice - discount;
    const quantity = parseFloat(invoice?.warehouse_invoice_items.find(i => i.id === itemId)?.quantity || '1');
    return quantity > 0 ? totalAfterDiscount / quantity : baseCostPrice;
  };

  const handlePriceChange = (itemId: string, customerType: CustomerType, value: string) => {
    setPricing((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [customerType]: value,
      },
    }));
  };

  const calculateProfit = (costPrice: number, sellingPrice: number) => {
    if (!costPrice || !sellingPrice) return { margin: 0, percentage: 0 };
    const margin = sellingPrice - costPrice;
    // نسبة الربح من سعر البيع (Profit Margin) = (الربح ÷ سعر البيع) × 100
    const percentage = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
    return { margin, percentage };
  };

  const handleSave = async () => {
    if (!invoice) return;

    try {
      setSaving(true);
      
      // الحصول على headers مرة واحدة
      const headers = await getHeaders();
      
      // أولاً: حفظ أسعار التكلفة والخصومات في warehouse_invoice_items
      const costPricePromises: Promise<any>[] = [];
      
      Object.entries(costPrices).forEach(([itemId, costPrice]) => {
        const price = parseFloat(costPrice);
        if (!isNaN(price) && price > 0) {
          const discount = discounts[itemId] ? parseFloat(discounts[itemId]) : 0;
          const item = invoice.warehouse_invoice_items.find(i => i.id === itemId);
          const quantity = item ? parseFloat(item.quantity) : 1;
          
          // حساب total_price مع مراعاة الخصم
          const totalPrice = (price * quantity) - discount;
          
          costPricePromises.push(
            fetch(`/api/warehouse/invoices/items/${itemId}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                unit_price: price,
                total_price: totalPrice,
                notes: discount > 0 ? discount.toString() : null, // حفظ الخصم في notes
              }),
            })
          );
        }
      });

      // انتظار حفظ أسعار التكلفة
      if (costPricePromises.length > 0) {
        await Promise.all(costPricePromises);
      }
      
      // ثانياً: حفظ أسعار البيع
      const pricingPromises: Promise<any>[] = [];
      
      Object.entries(pricing).forEach(([itemId, customerPricing]) => {
        const item = invoice.warehouse_invoice_items.find(i => i.id === itemId);
        if (!item) return;

        // الحصول على سعر التكلفة (من state أو من item)
        const baseCostPrice = parseFloat(costPrices[itemId] || item.unit_price || '0');
        if (baseCostPrice <= 0) {
          toast.warning(`يرجى إدخال سعر التكلفة للمنتج ${item.catalog_products?.name || item.store_products?.name_ar || itemId} أولاً`);
          return;
        }

        // حساب سعر التكلفة الفعلي بعد الخصم
        const costPrice = getEffectiveCostPrice(itemId, baseCostPrice);

        Object.entries(customerPricing).forEach(([customerType, sellingPrice]) => {
          const price = parseFloat(sellingPrice);
          if (!isNaN(price) && price > 0) {
            const requestBody = {
              invoice_item_id: itemId,
              customer_type: customerType,
              selling_price: price,
              cost_price: costPrice, // إرسال سعر التكلفة مع طلب حفظ السعر
            };
            
            console.log('[PricePage] Saving pricing:', requestBody);
            
            pricingPromises.push(
              fetch('/api/pricing/products', {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody),
              }).then(async (response) => {
                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  console.error('[PricePage] Error saving pricing:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData,
                  });
                  throw new Error(errorData.error || `خطأ في حفظ السعر: ${response.status}`);
                }
                return response;
              })
            );
          }
        });
      });

      if (pricingPromises.length === 0 && costPricePromises.length === 0) {
        toast.warning('يرجى إدخال سعر تكلفة واحد على الأقل أو سعر بيع واحد على الأقل');
        return;
      }

      if (pricingPromises.length > 0) {
        const results = await Promise.allSettled(pricingPromises);
        
        // التحقق من وجود أخطاء
        const errors = results.filter(r => r.status === 'rejected');
        if (errors.length > 0) {
          console.error('Errors saving pricing:', errors);
          const errorMessages = errors.map((e: any) => e.reason?.message || 'خطأ غير معروف').join(', ');
          throw new Error(`فشل في حفظ بعض الأسعار: ${errorMessages}`);
        }
        
        // التحقق من استجابات HTTP
        for (const result of results) {
          if (result.status === 'fulfilled') {
            const response = result.value;
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `خطأ في حفظ السعر: ${response.status}`);
            }
          }
        }
      }

      // تحديث حالة الفاتورة إلى "مسعرة"
      await fetch(`/api/pricing/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'priced' }),
      });

      toast.success('تم حفظ الأسعار بنجاح');
      router.push(`/financial-management/pricing-management/invoices/${invoiceId}`);
    } catch (error) {
      console.error('Error saving pricing:', error);
      toast.error('فشل في حفظ الأسعار');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="mr-2 text-gray-500">جاري جلب بيانات الفاتورة...</span>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <p className="text-gray-600">الفاتورة غير موجودة</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const warehouseName = invoice.warehouses?.name || `مخزن #${invoice.warehouse_id}`;
  const supplierName = invoice.suppliers?.name_ar || invoice.suppliers?.name || 'مورد غير محدد';

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          رجوع
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              تسعير المنتجات
            </h1>
            <p className="text-gray-600">
              فاتورة #{invoice.invoice_number} • {warehouseName} • {supplierName}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              تاريخ الفاتورة: {formatDate(invoice.invoice_date)}
            </p>
          </div>
          
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                حفظ الأسعار
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Invoice Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ملخص الفاتورة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-gray-500">إجمالي المنتجات</Label>
              <p className="text-xl font-semibold">{invoice.warehouse_invoice_items.length}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">إجمالي الفاتورة</Label>
              <p className="text-xl font-semibold">
                {parseFloat(invoice.total_amount).toLocaleString('ar-EG')} ج.م
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">الحالة</Label>
              <Badge variant="outline" className="mt-1">
                {invoice.status === 'received' || invoice.status === 'ready_for_pricing' ? 'في انتظار التسعير' : 
                 invoice.status === 'priced' ? 'مسعرة' : invoice.status}
              </Badge>
            </div>
            <div>
              <Label className="text-sm text-gray-500">تاريخ الاستلام</Label>
              <p className="text-sm">
                {invoice.received_date ? formatDate(invoice.received_date) : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Pricing */}
      <div className="space-y-6">
        {invoice.warehouse_invoice_items.map((item) => {
          const productName = item.catalog_products?.name || 
                             item.store_products?.name_ar || 
                             'منتج غير محدد';
          const productSku = item.catalog_products?.sku || 
                            item.store_products?.sku || 
                            '-';
          const existingCostPrice = parseFloat(item.unit_price || '0');
          const costPrice = parseFloat(costPrices[item.id] || item.unit_price || '0');
          const itemPricing = pricing[item.id] || {
            retail: '',
            agent: '',
            wholesale: '',
            other: '',
          };

          return (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{productName}</CardTitle>
                    <CardDescription>
                      SKU: {productSku} • الكمية: {parseFloat(item.quantity).toLocaleString('ar-EG')} {item.measurement_unit}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* حقل إدخال سعر التكلفة والخصم */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-blue-900 mb-2 block">
                      سعر التكلفة من المورد (ج.م)
                    </Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={costPrices[item.id] || (existingCostPrice > 0 ? existingCostPrice.toString() : '')}
                        onChange={(e) => handleCostPriceChange(item.id, e.target.value)}
                        placeholder="أدخل سعر التكلفة"
                        className="max-w-xs"
                      />
                      {costPrice > 0 && (
                        <span className="text-sm text-gray-600">
                          سعر الوحدة: {costPrice.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-blue-900 mb-2 block">
                      الخصم على البند (ج.م)
                    </Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={discounts[item.id] || ''}
                        onChange={(e) => handleDiscountChange(item.id, e.target.value)}
                        placeholder="أدخل قيمة الخصم"
                        className="max-w-xs"
                      />
                      {discounts[item.id] && parseFloat(discounts[item.id]) > 0 && (
                        <span className="text-sm text-green-600">
                          خصم: {parseFloat(discounts[item.id]).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
                        </span>
                      )}
                    </div>
                  </div>

                  {/* عرض سعر التكلفة الفعلي بعد الخصم */}
                  {costPrice > 0 && discounts[item.id] && parseFloat(discounts[item.id]) > 0 && (
                    <div className="pt-3 border-t border-blue-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-blue-900">سعر التكلفة الفعلي بعد الخصم:</span>
                        <span className="text-lg font-bold text-blue-700">
                          {getEffectiveCostPrice(item.id, costPrice).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
                        </span>
                      </div>
                    </div>
                  )}

                  {costPrice <= 0 && (
                    <p className="text-xs text-orange-600 mt-2">
                      ⚠️ يجب إدخال سعر التكلفة قبل تحديد أسعار البيع
                    </p>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <Label className="text-sm font-semibold mb-3 block">أسعار البيع لأنواع العملاء:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {CUSTOMER_TYPES.map((customerType) => {
                    const sellingPrice = parseFloat(itemPricing[customerType] || '0');
                    // استخدام سعر التكلفة الفعلي بعد الخصم
                    const effectiveCost = getEffectiveCostPrice(item.id, costPrice);
                    const profit = calculateProfit(effectiveCost, sellingPrice);
                    const hasPrice = sellingPrice > 0;

                    return (
                      <div key={customerType} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">
                            {CUSTOMER_TYPE_LABELS[customerType].ar}
                          </Label>
                          {hasPrice && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        
                        <div>
                          <Label className="text-sm text-gray-500">سعر البيع (ج.م)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={itemPricing[customerType]}
                            onChange={(e) => handlePriceChange(item.id, customerType, e.target.value)}
                            placeholder="0.00"
                            className="mt-1"
                          />
                        </div>

                        {hasPrice && (
                          <div className="space-y-1 pt-2 border-t">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">هامش الربح:</span>
                              <span className={`font-semibold ${
                                profit.margin >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {profit.margin.toFixed(2)} ج.م
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">نسبة الربح:</span>
                              <span className={`font-semibold ${
                                profit.percentage >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {profit.percentage.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Save Button (Bottom) */}
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="min-w-[200px]">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              حفظ جميع الأسعار
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

