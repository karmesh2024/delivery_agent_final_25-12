"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCustomerById, clearSelectedCustomer } from '@/domains/customers/store/customersSlice';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Loader2, ArrowLeft, Edit, Trash, Phone, Mail, MapPin, Clipboard, Clock } from 'lucide-react';
import { formatDate, formatCurrency } from '@/shared/utils/formatters';
import { AddressType, CustomerStatus, CustomerType } from '@/domains/customers/types';

export default function CustomerDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { selectedCustomer, isLoading, error } = useAppSelector((state) => state.customers);

  useEffect(() => {
    if (id) {
      dispatch(fetchCustomerById(id as string));
    }

    return () => {
      dispatch(clearSelectedCustomer());
    };
  }, [dispatch, id]);

  const handleGoBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/customers/${id}/edit`);
  };

  const handleDelete = () => {
    // Confirmation logic would go here
    console.log(`Delete customer ${id}`);
  };

  // Status badge color
  const getStatusColor = (status: CustomerStatus) => {
    switch (status) {
      case CustomerStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case CustomerStatus.INACTIVE:
        return 'bg-gray-100 text-gray-800';
      case CustomerStatus.BLOCKED:
        return 'bg-red-100 text-red-800';
      case CustomerStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <DashboardLayout title="تفاصيل العميل">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="تفاصيل العميل">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={handleGoBack}>العودة للخلف</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedCustomer) {
    return (
      <DashboardLayout title="تفاصيل العميل">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="mb-4">لم يتم العثور على بيانات العميل</p>
          <Button onClick={handleGoBack}>العودة للخلف</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`العميل: ${selectedCustomer.fullName}`}>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex justify-between items-center">
          <Button variant="ghost" className="gap-1" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
            العودة للخلف
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" className="gap-1" onClick={handleEdit}>
              <Edit className="h-4 w-4" />
              تعديل
            </Button>
            <Button variant="destructive" className="gap-1" onClick={handleDelete}>
              <Trash className="h-4 w-4" />
              حذف
            </Button>
          </div>
        </div>

        {/* Customer profile summary */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center md:items-start">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={selectedCustomer.avatarUrl} />
                  <AvatarFallback>{getInitials(selectedCustomer.fullName)}</AvatarFallback>
                </Avatar>
                <Badge className={`${getStatusColor(selectedCustomer.status as CustomerStatus)}`}>
                  {selectedCustomer.status}
                </Badge>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-2xl font-bold">{selectedCustomer.fullName}</h1>
                  <p className="text-muted-foreground">
                    {selectedCustomer.customerType === CustomerType.BUSINESS 
                      ? `${selectedCustomer.businessProfile?.companyName || selectedCustomer.organizationName || 'اسم الشركة غير متوفر'} (شركة)` 
                      : selectedCustomer.customerType === CustomerType.AGENT
                      ? 'وكيل'
                      : selectedCustomer.customerType === CustomerType.HOUSEHOLD
                      ? 'عميل فرد'
                      : 'عميل (أخرى)'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCustomer.phoneNumber}</span>
                  </div>
                  
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>مسجل منذ {formatDate(selectedCustomer.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clipboard className="h-4 w-4 text-muted-foreground" />
                    <span>اللغة المفضلة: {selectedCustomer.preferredLanguage}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:w-1/4">
                <Card className="bg-gray-50">
                  <CardHeader className="p-3 pb-0">
                    <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <p className="text-xl font-bold">{selectedCustomer.totalOrders}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-50">
                  <CardHeader className="p-3 pb-0">
                    <p className="text-sm text-muted-foreground">إجمالي الإنفاق</p>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <p className="text-xl font-bold">{formatCurrency(selectedCustomer.totalSpent)}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-50">
                  <CardHeader className="p-3 pb-0">
                    <p className="text-sm text-muted-foreground">نقاط الولاء</p>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <p className="text-xl font-bold">{selectedCustomer.loyaltyPoints}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-50">
                  <CardHeader className="p-3 pb-0">
                    <p className="text-sm text-muted-foreground">رصيد المحفظة</p>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <p className="text-xl font-bold">{formatCurrency(selectedCustomer.walletBalance || 0)}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="addresses">
          <TabsList className="mb-4">
            <TabsTrigger value="addresses">العناوين</TabsTrigger>
            <TabsTrigger value="orders">الطلبات</TabsTrigger>
            <TabsTrigger value="transactions">المعاملات المالية</TabsTrigger>
            {(selectedCustomer.customerType === CustomerType.BUSINESS && selectedCustomer.businessProfile) || 
             (selectedCustomer.customerType === CustomerType.AGENT && selectedCustomer.agentDetails) ? (
              <TabsTrigger value="detailedProfile">ملف التعريف التفصيلي</TabsTrigger>
            ) : null}
            <TabsTrigger value="preferences">التفضيلات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <CardTitle>عناوين العميل</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCustomer.addresses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">لا توجد عناوين مسجلة لهذا العميل</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCustomer.addresses.map((address) => (
                      <Card key={address.id} className={`border ${address.isDefault ? 'border-blue-500' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {address.addressType === AddressType.HOME ? 'المنزل' : 
                                 address.addressType === AddressType.WORK ? 'العمل' : 'آخر'}
                              </span>
                            </div>
                            {address.isDefault && (
                              <Badge variant="outline" className="text-blue-500 border-blue-500">افتراضي</Badge>
                            )}
                          </div>
                          <p className="mb-1">{address.addressLine}</p>
                          {(address.city || address.area) && (
                            <p className="text-muted-foreground text-sm">
                              {[address.city, address.area].filter(Boolean).join(', ')}
                            </p>
                          )}
                          {(address.buildingNumber || address.floorNumber || address.apartmentNumber) && (
                            <p className="text-muted-foreground text-sm">
                              {[
                                address.buildingNumber && `مبنى ${address.buildingNumber}`,
                                address.floorNumber && `طابق ${address.floorNumber}`,
                                address.apartmentNumber && `شقة ${address.apartmentNumber}`
                              ].filter(Boolean).join(', ')}
                            </p>
                          )}
                          {address.additionalDirections && (
                            <p className="text-muted-foreground text-sm mt-2">
                              {address.additionalDirections}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>طلبات العميل</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  سيتم تطوير هذا القسم لاحقاً لعرض طلبات العميل
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>المعاملات المالية</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  سيتم تطوير هذا القسم لاحقاً لعرض المعاملات المالية للعميل
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Detailed Profile Tab Content */}
          {(selectedCustomer.customerType === CustomerType.BUSINESS && selectedCustomer.businessProfile) && (
            <TabsContent value="detailedProfile">
              <Card>
                <CardHeader>
                  <CardTitle>ملف الشركة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedCustomer.businessProfile?.companyName && <InfoRow label="اسم الشركة" value={selectedCustomer.businessProfile.companyName} />}
                  {selectedCustomer.businessProfile?.commercialRegistrationNumber && <InfoRow label="السجل التجاري" value={selectedCustomer.businessProfile.commercialRegistrationNumber} />}
                  {selectedCustomer.businessProfile?.businessType && <InfoRow label="نوع العمل" value={selectedCustomer.businessProfile.businessType} />}
                  {selectedCustomer.businessProfile?.businessSubtype && <InfoRow label="النوع الفرعي للعمل" value={selectedCustomer.businessProfile.businessSubtype} />}
                  {selectedCustomer.businessProfile?.taxNumber && <InfoRow label="الرقم الضريبي" value={selectedCustomer.businessProfile.taxNumber} />}
                  {selectedCustomer.businessProfile?.contactPersonName && <InfoRow label="اسم مسؤول الاتصال" value={selectedCustomer.businessProfile.contactPersonName} />}
                  {selectedCustomer.businessProfile?.contactPhone && <InfoRow label="هاتف مسؤول الاتصال" value={selectedCustomer.businessProfile.contactPhone} />}
                  {selectedCustomer.businessProfile?.paymentMethod && <InfoRow label="طريقة الدفع" value={selectedCustomer.businessProfile.paymentMethod} />}
                  {selectedCustomer.businessProfile?.address && <InfoRow label="عنوان الشركة" value={selectedCustomer.businessProfile.address} />}
                  <InfoRow label="الحالة" value={selectedCustomer.businessProfile?.approved ? "معتمد" : "غير معتمد"} />
                  {/* Consider how to display specialPricing and documents (JSONB) */}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {(selectedCustomer.customerType === CustomerType.AGENT && selectedCustomer.agentDetails) && (
            <TabsContent value="detailedProfile">
              <Card>
                <CardHeader>
                  <CardTitle>ملف الوكيل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedCustomer.agentDetails?.storageLocation && <InfoRow label="موقع التخزين" value={selectedCustomer.agentDetails.storageLocation} />}
                  {selectedCustomer.agentDetails?.region && <InfoRow label="المنطقة" value={selectedCustomer.agentDetails.region} />}
                  {selectedCustomer.agentDetails?.areaCovered && <InfoRow label="منطقة التغطية" value={selectedCustomer.agentDetails.areaCovered} />}
                  {selectedCustomer.agentDetails?.agentType && <InfoRow label="نوع الوكيل" value={selectedCustomer.agentDetails.agentType} />}
                  {selectedCustomer.agentDetails?.commissionRate !== undefined && <InfoRow label="نسبة العمولة" value={`${selectedCustomer.agentDetails.commissionRate}%`} />}
                  {selectedCustomer.agentDetails?.paymentMethod && <InfoRow label="طريقة الدفع" value={selectedCustomer.agentDetails.paymentMethod} />}
                  <InfoRow label="الحالة" value={selectedCustomer.agentDetails?.approved ? "معتمد" : "غير معتمد"} />
                  {/* Consider how to display documents (JSONB) */}
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>تفضيلات العميل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">معلومات أساسية</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">اللغة المفضلة</span>
                        <span>{selectedCustomer.preferredLanguage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">نوع العميل</span>
                        <span>
                          {selectedCustomer.customerType === CustomerType.BUSINESS ? 'شركة' : 'فرد'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">حالة الحساب</span>
                        <Badge className={`${getStatusColor(selectedCustomer.status as CustomerStatus)}`}>
                          {selectedCustomer.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">معلومات النشاط</h3>
                    <div className="space-y-2">
                      {selectedCustomer.firstOrderDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">تاريخ أول طلب</span>
                          <span>{formatDate(selectedCustomer.firstOrderDate)}</span>
                        </div>
                      )}
                      {selectedCustomer.lastOrderDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">تاريخ آخر طلب</span>
                          <span>{formatDate(selectedCustomer.lastOrderDate)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">تاريخ التسجيل</span>
                        <span>{formatDate(selectedCustomer.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Helper component for displaying info rows (can be moved to a separate file)
const InfoRow = ({ label, value }: { label: string; value: string | number | undefined }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}; 