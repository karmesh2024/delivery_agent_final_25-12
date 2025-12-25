'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { FiPackage, FiTruck, FiRefreshCw, FiList, FiBarChart2, FiLayers } from "react-icons/fi";
import Link from "next/link";

export default function WarehouseManagement() {
  return (
    <DashboardLayout title="إدارة المخازن">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">إدارة المخازن</h1>
            <p className="text-gray-600">إدارة المخزون، التوريدات، والحركة المخزنية</p>
          </div>
          <Link href="/warehouse-management/warehouses/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <FiPackage className="mr-2" />
              إضافة مخزن جديد
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* بطاقة الهيكل الهرمي */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiLayers className="mr-2 text-purple-500" />
                الهيكل الهرمي للمخازن
              </CardTitle>
              <CardDescription>
                عرض وإدارة الهيكل التنظيمي للمخازن
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                إدارة المخازن الهرمية (مخزن أم - مخزن مدينة - مخزن منطقة) وربطها بالقطاعات المختلفة.
              </p>
              <Link href="/warehouse-management/admin-settings">
                <Button className="w-full">إعدادات الإدارة العليا</Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* بطاقة المخازن الموجودة */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiList className="mr-2 text-purple-500" />
                المخازن الموجودة
              </CardTitle>
              <CardDescription>
                عرض وإدارة المخازن الموجودة في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                عرض قائمة المخازن الموجودة وتفاصيلها وإمكانية تعديلها أو حذفها.
              </p>
              <Link href="/warehouse-management/warehouses">
                <Button className="w-full">
                  عرض المخازن
                </Button>
              </Link>
            </CardContent>
          </Card>
          {/* بطاقة المخزون */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiPackage className="mr-2 text-blue-500" />
                المخزون
              </CardTitle>
              <CardDescription>
                إدارة وعرض المنتجات المتوفرة في المخازن
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                عرض كميات المخزون المتوفرة وتفاصيلها ومواقع التخزين.
              </p>
              <Link href="/warehouse-management/inventory">
                <Button className="w-full">
                  عرض المخزون
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* بطاقة أوامر الإسناد */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiTruck className="mr-2 text-blue-500" />
                أوامر الإسناد
              </CardTitle>
              <CardDescription>
                استقبال وتتبع أوامر الإسناد من إدارة المشتريات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                عرض أوامر الإسناد وتسجيل الكميات المستلمة من الموردين.
              </p>
              <Link href="/warehouse-management/assignments">
                <Button className="w-full">
                  عرض أوامر الإسناد
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة حركة المخزون */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiRefreshCw className="mr-2 text-green-500" />
                حركة المخزون
              </CardTitle>
              <CardDescription>
                متابعة عمليات الاستلام والصرف والتحويل
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                تسجيل وتتبع عمليات الاستلام والصرف والتحويلات بين المخازن.
              </p>
              <Link href="/warehouse-management/transactions">
                <Button className="w-full">
                  إدارة حركة المخزون
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          
          {/* بطاقة الجرد */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiList className="mr-2 text-yellow-500" />
                الجرد المخزني
              </CardTitle>
              <CardDescription>
                عمليات الجرد الدورية والمخزنية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                إدارة عمليات الجرد الدورية والسنوية وتسوية فروقات المخزون.
              </p>
              <Link href="/warehouse-management/inventory-count">
                <Button className="w-full">
                  إدارة الجرد المخزني
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة تقارير المخازن */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiBarChart2 className="mr-2 text-red-500" />
                تقارير المخازن
              </CardTitle>
              <CardDescription>
                عرض وإنشاء تقارير مخزنية مفصلة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                استعراض تقارير مستويات المخزون، والمنتجات الأكثر والأقل حركة.
              </p>
              <Link href="/warehouse-management/reports">
                <Button className="w-full">
                  عرض تقارير المخازن
                </Button>
              </Link>
            </CardContent>
          </Card>

        {/* بطاقة الفئات المرنة */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl">
              <FiLayers className="mr-2 text-orange-500" />
              الفئات المرنة الجديدة
            </CardTitle>
            <CardDescription>
              نظام هرمي مرن لإدارة الفئات بدون حدود للمستويات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              نظام جديد يسمح بإنشاء فئات هرمية غير محدودة المستويات مع إمكانية ربطها بالقطاعات.
            </p>
            <div className="space-y-2">
              <Link href="/warehouse-management/admin-settings/flexible-categories">
                <Button className="w-full">إدارة الفئات المرنة</Button>
              </Link>
              <Link href="/warehouse-management/admin-settings/hierarchical-categories">
                <Button variant="outline" className="w-full">النظام القديم</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* بطاقة كتالوج المخازن */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl">
              <FiList className="mr-2 text-indigo-500" />
              كتالوج المخازن
            </CardTitle>
            <CardDescription>
              إدارة كتالوج المنتجات ومواد المخلفات المرجعية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              إنشاء وتصنيف العناصر المرجعية للمنتجات والمخلفات وربطها بالمخازن.
            </p>
            <Link href="/warehouse-management/catalog">
              <Button className="w-full">فتح الكتالوج</Button>
            </Link>
          </CardContent>
        </Card>

        {/* بطاقة لوحة الطلبيات */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl">
              <FiPackage className="mr-2 text-teal-500" />
              لوحة الطلبيات
            </CardTitle>
            <CardDescription>
              متابعة وتنفيذ طلبات التجميع والتغليف
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              لوحة عرض الطلبات الواردة من المتاجر لمتابعة مراحل التجميع والتحقق والتغليف والتسليم.
            </p>
            <Link href="/warehouse-management/orders-board">
              <Button className="w-full bg-teal-600 hover:bg-teal-700">
                <FiPackage className="mr-2" />
                فتح لوحة الطلبيات
              </Button>
            </Link>
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 