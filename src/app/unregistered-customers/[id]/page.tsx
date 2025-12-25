"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUnregisteredCustomerDetails } from '@/domains/customers/store/unregisteredCustomersSlice';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Loader2, ArrowLeft, Phone, User, Calendar, DollarSign, Package2, MapPin } from 'lucide-react';
import { formatDate, formatCurrency } from '@/shared/utils/formatters';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';

export default function UnregisteredCustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { selectedCustomer, isLoading } = useAppSelector((state) => state.unregisteredCustomers);

  // جلب بيانات العميل غير المسجل عند تحميل الصفحة
  useEffect(() => {
    if (id) {
      dispatch(fetchUnregisteredCustomerDetails(id as string));
    }
  }, [dispatch, id]);

  // العودة إلى صفحة العملاء غير المسجلين
  const handleBack = () => {
    router.back();
  };

  // عرض حالة الدفع بلون مناسب
  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0 px-3 py-1">مكتمل</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-0 px-3 py-1">قيد الانتظار</Badge>;
      case 'cancelled':
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-0 px-3 py-1">ملغي</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0 px-3 py-1">قيد المعالجة</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-0 px-3 py-1">{status || 'غير معروف'}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="تفاصيل العميل غير المسجل">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedCustomer) {
    return (
      <DashboardLayout title="تفاصيل العميل غير المسجل">
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-1">لم يتم العثور على العميل</h3>
          <p className="text-muted-foreground mb-4">
            لم يتم العثور على بيانات العميل المطلوب
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`تفاصيل العميل: ${selectedCustomer.name}`}>
      <div className="space-y-4">
        {/* زر العودة وعنوان الصفحة */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة
          </Button>
        </div>

        {/* بطاقة معلومات العميل */}
        <Card className="border-2 border-blue-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 pb-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-3">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>معلومات العميل غير المسجل</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4 flex items-center">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">الاسم</p>
                  <p className="font-medium text-lg">{selectedCustomer.name}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">رقم الهاتف</p>
                  <p className="font-medium text-lg">{selectedCustomer.phone}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 flex items-center">
                <div className="bg-orange-100 p-2 rounded-full mr-3">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">تاريخ الإنشاء</p>
                  <p className="font-medium">
                    {formatDate(selectedCustomer.createdAt)}
                    <span className="text-xs text-gray-500 mr-2">
                      {new Date(selectedCustomer.createdAt).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 flex items-center">
                <div className="bg-purple-100 p-2 rounded-full mr-3">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">تاريخ آخر تحديث</p>
                  <p className="font-medium">
                    {formatDate(selectedCustomer.updatedAt)}
                    <span className="text-xs text-gray-500 mr-2">
                      {new Date(selectedCustomer.updatedAt).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* عمليات التجميع */}
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-3">
                  <Package2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>عمليات التجميع</CardTitle>
                  <CardDescription className="mt-1">
                    {selectedCustomer.collections?.length 
                      ? `عدد العمليات: ${selectedCustomer.collections.length}` 
                      : 'لا توجد عمليات تجميع لهذا العميل'}
                  </CardDescription>
                </div>
              </div>
              {selectedCustomer.collections && selectedCustomer.collections.length > 0 && (
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md font-medium">
                  {selectedCustomer.collections.length} عملية
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedCustomer.collections?.length ? (
              <div className="flex flex-col justify-center items-center h-48 text-center p-6 bg-gray-50">
                <div className="bg-white p-4 rounded-full mb-4 shadow-sm">
                  <Package2 className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-700">لا توجد عمليات تجميع</h3>
                <p className="text-gray-500 max-w-md">
                  لم يتم العثور على أي عمليات تجميع مسجلة لهذا العميل حتى الآن
                </p>
              </div>
            ) : (
              <Table className="border border-gray-200 rounded-md">
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="text-center font-bold py-3 w-16">#</TableHead>
                    <TableHead className="text-center font-bold py-3">تاريخ التجميع</TableHead>
                    <TableHead className="text-center font-bold py-3">الوكيل</TableHead>
                    <TableHead className="text-center font-bold py-3">الوزن الكلي</TableHead>
                    <TableHead className="text-center font-bold py-3">المبلغ الكلي</TableHead>
                    <TableHead className="text-center font-bold py-3">حالة الدفع</TableHead>
                    <TableHead className="text-center font-bold py-3">الموقع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCustomer.collections.map((collection, index) => (
                    <TableRow 
                      key={collection.id}
                      className="hover:bg-blue-50 transition-colors border-b border-gray-100"
                    >
                      <TableCell className="text-center font-medium py-3">{index + 1}</TableCell>
                      <TableCell className="text-center py-3">
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{formatDate(collection.collectionDate)}</span>
                          <span className="text-xs text-gray-500 mt-1">
                            {new Date(collection.collectionDate).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        {collection.agent ? (
                          <div className="flex flex-col items-center">
                            <div className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-md mb-1">
                              وكيل
                            </div>
                            <span className="font-medium text-sm">{collection.agent.fullName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">غير متاح</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-3 font-medium">
                        {collection.totalWeight ? (
                          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md">
                            {collection.totalWeight} كجم
                          </span>
                        ) : (
                          <span className="text-gray-500">غير متاح</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-3 font-medium text-green-600">
                        {collection.totalAmount ? formatCurrency(collection.totalAmount) : 'غير متاح'}
                      </TableCell>
                      <TableCell className="text-center py-3">
                        {getPaymentStatusBadge(collection.paymentStatus)}
                      </TableCell>
                      <TableCell className="text-center py-3">
                        {collection.locationAddress ? (
                          <div className="flex items-center justify-center">
                            <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="truncate max-w-[150px]" title={collection.locationAddress}>
                              {collection.locationAddress}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">غير متاح</span>
                        )}
                      </TableCell>
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