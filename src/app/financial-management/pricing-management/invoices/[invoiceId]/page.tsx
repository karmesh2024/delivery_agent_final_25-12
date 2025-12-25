'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { 
  ArrowLeft, 
  Edit,
  Loader2,
  Receipt,
  Package,
  DollarSign,
  Calendar,
  Building2,
  Truck,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { CUSTOMER_TYPE_LABELS, PRICING_STATUS_LABELS, CustomerType } from '@/domains/pricing/types/types';
import { useAppSelector } from '@/store/hooks';

interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  catalog_product_id: string | null;
  quantity: string;
  unit_price: string;
  total_price: string;
  measurement_unit: string;
  batch_number: string | null;
  expiry_date: string | null;
  notes: string | null;
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
  notes: string | null;
  warehouses?: {
    id: number;
    name: string;
    location: string | null;
  };
  suppliers?: {
    id: number;
    name: string;
    name_ar: string | null;
    supplier_code: string | null;
    contact_phone: string | null;
    email: string | null;
  };
  warehouse_invoice_items: InvoiceItem[];
}

export default function InvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;
  const token = useAppSelector((state) => state.auth.token);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/pricing/invoices/${invoiceId}`, {
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل في جلب الفاتورة');
      }
      
      const data = await response.json();
      setInvoice(data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('فشل في جلب الفاتورة');
    } finally {
      setLoading(false);
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      pending: { label: 'في انتظار', color: 'text-gray-600 border-gray-600' },
      received: { label: 'في انتظار التسعير', color: 'text-orange-600 border-orange-600' },
      ready_for_pricing: { label: 'جاهزة للتسعير', color: 'text-orange-600 border-orange-600' },
      priced: { label: 'مسعرة', color: 'text-green-600 border-green-600' },
      approved: { label: 'معتمدة', color: 'text-blue-600 border-blue-600' },
      rejected: { label: 'مرفوضة', color: 'text-red-600 border-red-600' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
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
  const totalItems = invoice.warehouse_invoice_items.length;
  const pricedItems = invoice.warehouse_invoice_items.filter(
    item => item.product_pricing && item.product_pricing.length > 0
  ).length;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/financial-management/pricing-management')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          رجوع
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              تفاصيل الفاتورة
            </h1>
            <p className="text-gray-600">
              فاتورة #{invoice.invoice_number}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadge(invoice.status)}
            {(invoice.status === 'received' || invoice.status === 'ready_for_pricing' || invoice.status === 'priced') && (
              <Button 
                onClick={() => router.push(`/financial-management/pricing-management/invoices/${invoiceId}/price`)}
                variant="outline"
              >
                <Edit className="h-4 w-4 mr-2" />
                {(invoice.status === 'received' || invoice.status === 'ready_for_pricing') ? 'تسعير' : 'تعديل التسعير'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              معلومات الفاتورة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">رقم الفاتورة</p>
              <p className="font-semibold">{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">تاريخ الفاتورة</p>
              <p className="font-semibold">{formatDate(invoice.invoice_date)}</p>
            </div>
            {invoice.received_date && (
              <div>
                <p className="text-sm text-gray-500">تاريخ الاستلام</p>
                <p className="font-semibold">{formatDate(invoice.received_date)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">إجمالي الفاتورة</p>
              <p className="text-2xl font-bold text-blue-600">
                {parseFloat(invoice.total_amount).toLocaleString('ar-EG')} ج.م
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              معلومات المورد والمخزن
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">المخزن</p>
              <p className="font-semibold">{warehouseName}</p>
              {invoice.warehouses?.location && (
                <p className="text-sm text-gray-600">{invoice.warehouses.location}</p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-500">المورد</p>
              <p className="font-semibold">{supplierName}</p>
              {invoice.suppliers?.supplier_code && (
                <p className="text-sm text-gray-600">كود المورد: {invoice.suppliers.supplier_code}</p>
              )}
              {invoice.suppliers?.contact_phone && (
                <p className="text-sm text-gray-600">الهاتف: {invoice.suppliers.contact_phone}</p>
              )}
              {invoice.suppliers?.email && (
                <p className="text-sm text-gray-600">البريد: {invoice.suppliers.email}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                المنتجات ({totalItems})
              </CardTitle>
              <CardDescription>
                {pricedItems > 0 && (
                  <span className="text-green-600">
                    {pricedItems} منتج مسعر
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoice.warehouse_invoice_items.map((item) => {
              const productName = item.catalog_products?.name || 
                                 item.store_products?.name_ar || 
                                 'منتج غير محدد';
              const productSku = item.catalog_products?.sku || 
                                item.store_products?.sku || 
                                '-';
              const costPrice = parseFloat(item.unit_price);
              const hasPricing = item.product_pricing && item.product_pricing.length > 0;

              return (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{productName}</h3>
                      <p className="text-sm text-gray-600">SKU: {productSku}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span>الكمية: {parseFloat(item.quantity).toLocaleString('ar-EG')} {item.measurement_unit}</span>
                        <span>•</span>
                        <span>سعر الوحدة: {costPrice.toLocaleString('ar-EG')} ج.م</span>
                        <span>•</span>
                        <span className="font-semibold">
                          الإجمالي: {parseFloat(item.total_price).toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                      {item.batch_number && (
                        <p className="text-sm text-gray-500 mt-1">رقم الدفعة: {item.batch_number}</p>
                      )}
                      {item.expiry_date && (
                        <p className="text-sm text-gray-500">تاريخ الانتهاء: {formatDate(item.expiry_date)}</p>
                      )}
                    </div>
                    {hasPricing ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                    )}
                  </div>

                  {hasPricing && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold mb-3">أسعار البيع:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {item.product_pricing!.map((pricing) => {
                          const profitMargin = parseFloat(pricing.profit_margin);
                          const markupPercentage = parseFloat(pricing.markup_percentage);

                          return (
                            <div key={pricing.id} className="border rounded p-3 bg-gray-50">
                              <p className="text-sm font-semibold mb-1">
                                {CUSTOMER_TYPE_LABELS[pricing.customer_type].ar}
                              </p>
                              <p className="text-lg font-bold text-blue-600">
                                {parseFloat(pricing.selling_price).toLocaleString('ar-EG')} ج.م
                              </p>
                              <div className="text-xs text-gray-600 mt-1">
                                <p>هامش الربح: {profitMargin.toFixed(2)} ج.م</p>
                                <p>نسبة الربح: {markupPercentage.toFixed(2)}%</p>
                              </div>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {PRICING_STATUS_LABELS[pricing.status as keyof typeof PRICING_STATUS_LABELS]?.ar || pricing.status}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

