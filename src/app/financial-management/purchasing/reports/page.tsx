'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Users, 
  FileText, 
  Download,
  Calendar,
  Building2,
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface OverviewReport {
  total_invoices: number;
  total_amount: number;
  invoices_by_status: Array<{
    status: string;
    count: number;
    total_amount: number;
  }>;
  top_suppliers: Array<{
    supplier_id: number;
    supplier_name: string;
    invoice_count: number;
    total_amount: number;
  }>;
  invoices_by_warehouse: Array<{
    warehouse_id: number;
    warehouse_name: string;
    invoice_count: number;
    total_amount: number;
  }>;
  recent_invoices: Array<{
    id: string;
    invoice_number: string;
    supplier_name: string | null;
    warehouse_name: string | null;
    total_amount: number;
    status: string;
    invoice_date: string | null;
  }>;
}

interface SupplierReport {
  supplier_id: number;
  supplier_name: string;
  contact_phone: string | null;
  email: string | null;
  rating: number | null;
  invoice_count: number;
  total_amount: number;
  average_amount: number;
}

interface WarehouseReport {
  warehouse_id: number;
  warehouse_name: string;
  location: string | null;
  invoice_count: number;
  total_amount: number;
  average_amount: number;
}

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  pending: 'قيد المراجعة',
  pending_approval: 'بانتظار الاعتماد',
  approved: 'معتمدة',
  assigned_to_warehouse: 'مُسندة للمخازن',
  partially_received: 'استلام جزئي',
  received_in_warehouse: 'تم الاستلام',
  ready_for_pricing: 'جاهزة للتسعير',
  priced: 'تم التسعير',
  rejected: 'مرفوضة',
  cancelled: 'ملغاة',
};

export default function PurchasingReportsPage() {
  const token = useAppSelector((state) => state.auth.token);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [overview, setOverview] = useState<OverviewReport | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierReport[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseReport[]>([]);

  const getHeaders = async (): Promise<HeadersInit> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    let authToken = token;
    
    if (!authToken && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || null;
      } catch (error) {
        console.warn('Error getting session:', error);
      }
    }
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    return headers;
  };

  const fetchReports = async (type: string) => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const params = new URLSearchParams({
        type,
      });
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/purchasing/reports?${params.toString()}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('فشل في جلب التقارير');
      }

      const data = await response.json();

      if (type === 'overview') {
        setOverview(data.overview);
      } else if (type === 'suppliers') {
        setSuppliers(data.suppliers || []);
      } else if (type === 'warehouses') {
        setWarehouses(data.warehouses || []);
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast.error(error?.message || 'فشل في جلب التقارير');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(activeTab);
  }, [activeTab, startDate, endDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  return (
    <DashboardLayout title="تقارير المشتريات">
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">تقارير المشتريات</h1>
            <p className="text-gray-600">
              عرض تقارير مفصلة عن المشتريات والموردين والمخازن
            </p>
          </div>
        </div>

        {/* فلاتر التاريخ */}
        <Card>
          <CardHeader>
            <CardTitle>فلاتر التاريخ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="startDate">من تاريخ</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="endDate">إلى تاريخ</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                >
                  إعادة تعيين
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="suppliers">
              <Users className="h-4 w-4 mr-2" />
              الموردين
            </TabsTrigger>
            <TabsTrigger value="warehouses">
              <Building2 className="h-4 w-4 mr-2" />
              المخازن
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p>جاري التحميل...</p>
                </CardContent>
              </Card>
            ) : overview ? (
              <>
                {/* إحصائيات رئيسية */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        إجمالي الفواتير
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{overview.total_invoices}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        إجمالي المبلغ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{formatCurrency(overview.total_amount)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* الفواتير حسب الحالة */}
                <Card>
                  <CardHeader>
                    <CardTitle>الفواتير حسب الحالة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {overview.invoices_by_status.map((status) => (
                        <div
                          key={status.status}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {statusLabels[status.status] || status.status}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {status.count} فاتورة
                            </span>
                          </div>
                          <span className="font-semibold">
                            {formatCurrency(status.total_amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* أفضل الموردين */}
                <Card>
                  <CardHeader>
                    <CardTitle>أفضل الموردين</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {overview.top_suppliers.map((supplier, index) => (
                        <div
                          key={supplier.supplier_id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">#{index + 1}</Badge>
                            <div>
                              <p className="font-semibold">{supplier.supplier_name}</p>
                              <p className="text-sm text-gray-600">
                                {supplier.invoice_count} فاتورة
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold">
                            {formatCurrency(supplier.total_amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* الفواتير حسب المخزن */}
                <Card>
                  <CardHeader>
                    <CardTitle>الفواتير حسب المخزن</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {overview.invoices_by_warehouse.map((warehouse) => (
                        <div
                          key={warehouse.warehouse_id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-semibold">{warehouse.warehouse_name}</p>
                            <p className="text-sm text-gray-600">
                              {warehouse.invoice_count} فاتورة
                            </p>
                          </div>
                          <span className="font-semibold">
                            {formatCurrency(warehouse.total_amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* آخر الفواتير */}
                <Card>
                  <CardHeader>
                    <CardTitle>آخر الفواتير</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {overview.recent_invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-semibold">{invoice.invoice_number}</p>
                            <p className="text-sm text-gray-600">
                              {invoice.supplier_name} - {invoice.warehouse_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(invoice.invoice_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(invoice.total_amount)}
                            </p>
                            <Badge variant="outline" className="mt-1">
                              {statusLabels[invoice.status] || invoice.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">لا توجد بيانات</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-6">
            {loading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p>جاري التحميل...</p>
                </CardContent>
              </Card>
            ) : suppliers.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>تقرير الموردين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right p-2">المورد</th>
                          <th className="text-right p-2">التقييم</th>
                          <th className="text-right p-2">عدد الفواتير</th>
                          <th className="text-right p-2">إجمالي المبلغ</th>
                          <th className="text-right p-2">متوسط المبلغ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suppliers.map((supplier) => (
                          <tr key={supplier.supplier_id} className="border-b">
                            <td className="p-2">
                              <div>
                                <p className="font-semibold">{supplier.supplier_name}</p>
                                {supplier.contact_phone && (
                                  <p className="text-sm text-gray-600">
                                    {supplier.contact_phone}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="p-2">
                              {supplier.rating ? (
                                <Badge variant="outline">{supplier.rating}/5</Badge>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="p-2">{supplier.invoice_count}</td>
                            <td className="p-2 font-semibold">
                              {formatCurrency(supplier.total_amount)}
                            </td>
                            <td className="p-2">
                              {formatCurrency(supplier.average_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">لا توجد بيانات</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="warehouses" className="space-y-6">
            {loading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p>جاري التحميل...</p>
                </CardContent>
              </Card>
            ) : warehouses.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>تقرير المخازن</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right p-2">المخزن</th>
                          <th className="text-right p-2">الموقع</th>
                          <th className="text-right p-2">عدد الفواتير</th>
                          <th className="text-right p-2">إجمالي المبلغ</th>
                          <th className="text-right p-2">متوسط المبلغ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {warehouses.map((warehouse) => (
                          <tr key={warehouse.warehouse_id} className="border-b">
                            <td className="p-2">
                              <p className="font-semibold">{warehouse.warehouse_name}</p>
                            </td>
                            <td className="p-2 text-sm text-gray-600">
                              {warehouse.location || '-'}
                            </td>
                            <td className="p-2">{warehouse.invoice_count}</td>
                            <td className="p-2 font-semibold">
                              {formatCurrency(warehouse.total_amount)}
                            </td>
                            <td className="p-2">
                              {formatCurrency(warehouse.average_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">لا توجد بيانات</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

