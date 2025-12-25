"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCustomers, setFilters, resetFilters, diagnoseCustomersIssue } from '@/domains/customers/store/customersSlice';
import { CustomerFilters } from '@/domains/customers/types';
import { CustomersTable } from '@/domains/customers/components/CustomersTable';
import { CustomersFilters } from '@/domains/customers/components/CustomersFilters';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Loader2, UserPlus, Download, Upload, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { toast } from '@/shared/ui/use-toast';

export default function CustomersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { customers, isLoading, filters, totalCount } = useAppSelector((state) => state.customers);

  // جلب بيانات العملاء عند تحميل الصفحة
  useEffect(() => {
    dispatch(fetchCustomers(filters));
  }, [dispatch, filters]);

  // التعامل مع تغيير الفلاتر
  const handleFilterChange = (newFilters: Partial<CustomerFilters>) => {
    dispatch(setFilters(newFilters));
  };

  // إعادة تعيين الفلاتر
  const handleResetFilters = () => {
    dispatch(resetFilters());
  };

  // الانتقال إلى صفحة تفاصيل العميل
  const handleViewCustomer = (customerId: string) => {
    router.push(`/customers/${customerId}`);
  };

  // الانتقال إلى صفحة تعديل العميل
  const handleEditCustomer = (customerId: string) => {
    router.push(`/customers/${customerId}/edit`);
  };

  // التعامل مع حذف العميل
  const handleDeleteCustomer = (customerId: string) => {
    // هنا يمكن إضافة تأكيد قبل الحذف
    console.log(`حذف العميل: ${customerId}`);
    // dispatch(deleteCustomer(customerId))
  };

  // التوجه إلى صفحة إضافة عميل جديد
  const handleAddCustomer = () => {
    router.push('/customers/new');
  };

  // تشخيص مشكلة عدم ظهور العملاء
  const handleDiagnoseIssue = async () => {
    try {
      dispatch(diagnoseCustomersIssue());
      toast({
        title: "تشخيص المشكلة",
        description: "يرجى مراجعة وحدة تحكم المتصفح (F12) للاطلاع على نتائج التشخيص",
      });
    } catch (error) {
      console.error("فشل في تشخيص المشكلة", error);
    }
  };

  return (
    <DashboardLayout title="إدارة العملاء">
      <div className="space-y-4">
        {/* عنوان الصفحة وإحصائيات سريعة */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">إدارة العملاء</h1>
            <p className="text-muted-foreground">عرض وإدارة بيانات العملاء</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" className="gap-2" onClick={handleAddCustomer}>
              <UserPlus className="h-4 w-4" />
              إضافة عميل جديد
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              تصدير
            </Button>
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              استيراد
            </Button>
            {totalCount === 0 && (
              <Button variant="destructive" className="gap-2" onClick={handleDiagnoseIssue}>
                <AlertTriangle className="h-4 w-4" />
                تشخيص المشكلة
              </Button>
            )}
          </div>
        </div>

        {/* بطاقات الإحصائيات */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>إجمالي العملاء</CardDescription>
              <CardTitle className="text-2xl">{totalCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>عملاء نشطين</CardDescription>
              <CardTitle className="text-2xl">
                {customers.filter(c => c.status === 'active').length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* بطاقات أنواع العملاء */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>عملاء أفراد</CardDescription>
              <CardTitle className="text-2xl">
                {customers.filter(c => c.customerType === 'household').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>عملاء شركات</CardDescription>
              <CardTitle className="text-2xl">
                {customers.filter(c => c.customerType === 'business').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>الوكلاء</CardDescription>
              <CardTitle className="text-2xl">
                {customers.filter(c => c.customerType === 'agent').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>أخرى</CardDescription>
              <CardTitle className="text-2xl">
                {customers.filter(c => c.customerType === 'other').length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* فلاتر البحث */}
        <CustomersFilters 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          onResetFilters={handleResetFilters} 
        />

        {/* جدول العملاء */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <CustomersTable 
            customers={customers} 
            onView={handleViewCustomer} 
            onEdit={handleEditCustomer} 
            onDelete={handleDeleteCustomer} 
          />
        )}

        {/* ترقيم الصفحات - يمكن إضافته لاحقاً */}
      </div>
    </DashboardLayout>
  );
} 