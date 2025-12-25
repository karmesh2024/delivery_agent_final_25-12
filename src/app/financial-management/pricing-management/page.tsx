'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Receipt, 
  DollarSign, 
  Users, 
  TrendingUp, 
  FileText, 
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { INVOICE_STATUS_LABELS, CUSTOMER_TYPE_LABELS } from '@/domains/pricing/types/types';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';

interface WarehouseInvoice {
  id: string;
  invoice_number: string;
  warehouse_id: number;
  supplier_id: number | null;
  invoice_date: string;
  received_date: string | null;
  total_amount: string;
  status: 'pending' | 'received' | 'priced' | 'approved' | 'rejected';
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
  };
  warehouse_invoice_items?: Array<{
    id: string;
    quantity: string;
    unit_price: string;
    total_price: string;
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
  }>;
}

export default function PricingManagementPage() {
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState<WarehouseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    received: 0,
    priced: 0,
    total: 0,
  });
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);

  // جلب الفواتير
  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/pricing/invoices?status=all', {
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل في جلب الفواتير');
      }
      
      const data = await response.json();
      setInvoices(data.invoices || []);
      setStats(data.stats || { pending: 0, received: 0, priced: 0, total: 0 });
    } catch (error) {
      console.error('Error fetching invoices:', error);
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
    const statusConfig = {
      pending: { label: 'في انتظار', color: 'text-gray-600 border-gray-600' },
      received: { label: 'في انتظار التسعير', color: 'text-orange-600 border-orange-600' },
      priced: { label: 'مسعر', color: 'text-green-600 border-green-600' },
      approved: { label: 'معتمد', color: 'text-blue-600 border-blue-600' },
      rejected: { label: 'مرفوض', color: 'text-red-600 border-red-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة التسعير</h1>
        <p className="text-gray-600">
          إدارة الفواتير الواردة من المخازن وتحديد الأسعار للعملاء المختلفين
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير المعلقة</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.received}</div>
            <p className="text-xs text-muted-foreground">في انتظار التسعير</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير المسعرة</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.priced}</div>
            <p className="text-xs text-muted-foreground">فاتورة مسعرة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أنواع العملاء</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">عملاء، وكلاء، تجار، أخرى</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الفواتير</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">فاتورة إجمالي</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="invoices">الفواتير الواردة</TabsTrigger>
          <TabsTrigger value="pricing">تحديد الأسعار</TabsTrigger>
          <TabsTrigger value="customers">أنواع العملاء</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        {/* الفواتير الواردة */}
        <TabsContent value="invoices" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>الفواتير الواردة من المخازن</CardTitle>
                  <CardDescription>
                    استلام ومراجعة الفواتير الواردة من إدارة المخازن
                  </CardDescription>
                </div>
                <Button onClick={() => fetchInvoices()} variant="outline">
                  <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  <span className="mr-2 text-gray-500">جاري جلب الفواتير...</span>
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>لا توجد فواتير واردة</p>
                  <p className="text-sm">سيتم عرض الفواتير المستلمة من إدارة المخازن هنا</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => {
                    const itemsCount = invoice.warehouse_invoice_items?.length || 0;
                    const warehouseName = invoice.warehouses?.name || `مخزن #${invoice.warehouse_id}`;
                    const supplierName = invoice.suppliers?.name_ar || invoice.suppliers?.name || 'مورد غير محدد';
                    
                    return (
                      <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Receipt className={`h-8 w-8 ${
                              invoice.status === 'received' ? 'text-orange-600' :
                              invoice.status === 'priced' ? 'text-green-600' :
                              'text-blue-600'
                            }`} />
                            <div>
                              <h3 className="font-semibold">فاتورة #{invoice.invoice_number}</h3>
                              <p className="text-sm text-gray-600">من: {warehouseName}</p>
                              {invoice.suppliers && (
                                <p className="text-sm text-gray-600">المورد: {supplierName}</p>
                              )}
                              <p className="text-sm text-gray-600">
                                تاريخ: {formatDate(invoice.invoice_date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(invoice.status)}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/financial-management/pricing-management/invoices/${invoice.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              عرض
                            </Button>
                            {invoice.status === 'received' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.push(`/financial-management/pricing-management/invoices/${invoice.id}/price`)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                تسعير
                              </Button>
                            )}
                            {invoice.status === 'priced' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.push(`/financial-management/pricing-management/invoices/${invoice.id}/price`)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                تعديل
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-gray-600">
                          <p>
                            • {itemsCount} منتج • إجمالي: {parseFloat(invoice.total_amount).toLocaleString('ar-EG')} ج • 
                            حالة: {INVOICE_STATUS_LABELS[invoice.status]?.ar || invoice.status}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تحديد الأسعار */}
        <TabsContent value="pricing" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>تحديد الأسعار للعملاء</CardTitle>
                  <CardDescription>
                    تحديد أسعار البيع للعملاء المختلفين بناءً على الفواتير الواردة
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  تسعير منتج جديد
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>سيتم إضافة واجهة تحديد الأسعار هنا</p>
                <p className="text-sm">اختر فاتورة من تبويب الفواتير الواردة للبدء</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* أنواع العملاء */}
        <TabsContent value="customers" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>أنواع العملاء</CardTitle>
                  <CardDescription>
                    إدارة أنواع العملاء المختلفة وأسعارهم المخصصة
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة نوع عميل
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold">عملاء عاديون</h3>
                  <p className="text-sm text-gray-600">أسعار التجزئة</p>
                  <Badge variant="outline" className="mt-2">نشط</Badge>
                </div>

                <div className="border rounded-lg p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold">وكلاء معتمدون</h3>
                  <p className="text-sm text-gray-600">أسعار الجملة</p>
                  <Badge variant="outline" className="mt-2">نشط</Badge>
                </div>

                <div className="border rounded-lg p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h3 className="font-semibold">تجار</h3>
                  <p className="text-sm text-gray-600">أسعار خاصة</p>
                  <Badge variant="outline" className="mt-2">نشط</Badge>
                </div>

                <div className="border rounded-lg p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <h3 className="font-semibold">أخرى</h3>
                  <p className="text-sm text-gray-600">أسعار مخصصة</p>
                  <Badge variant="outline" className="mt-2">نشط</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* التقارير */}
        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>تقارير التسعير</CardTitle>
                  <CardDescription>
                    عرض تقارير مفصلة عن التسعير والأرباح
                  </CardDescription>
                </div>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  تصدير التقرير
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>سيتم إضافة التقارير هنا</p>
                <p className="text-sm">تقارير الأرباح، هامش الربح، وأداء التسعير</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}















