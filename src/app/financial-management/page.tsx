'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { FiDollarSign, FiTrendingUp, FiPieChart, FiFileText, FiTarget, FiShoppingBag } from "react-icons/fi";
import Link from "next/link";

export default function FinancialManagement() {
  return (
    <DashboardLayout title="الإدارة المالية">
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">الإدارة المالية</h1>
        <p className="text-gray-600 mb-6">إدارة الميزانية، الأموال والمعاملات المالية للنظام</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* بطاقة البورصة */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiTrendingUp className="mr-2 text-blue-500" />
                البورصة
              </CardTitle>
              <CardDescription>
                متابعة أسعار المنتجات في البورصة والتغيرات الحاصلة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                منصة تعرض أسعار المنتجات بناءً على العرض والطلب وتحليل السوق.
              </p>
              <Link href="/financial-management/exchange">
                <Button className="w-full">
                  الانتقال إلى البورصة
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* بطاقة المحاسبة */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiDollarSign className="mr-2 text-green-500" />
                المحاسبة
              </CardTitle>
              <CardDescription>
                إدارة المعاملات المالية والمصروفات والإيرادات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                تتبع الإيرادات والمصروفات وإنشاء التقارير المالية.
              </p>
              <Link href="/financial-management/accounting">
                <Button className="w-full">
                  الانتقال إلى المحاسبة
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* بطاقة التقارير المالية */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiPieChart className="mr-2 text-purple-500" />
                التقارير المالية
              </CardTitle>
              <CardDescription>
                عرض وإنشاء تقارير مالية مفصلة وتحليلات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                استعرض تقارير الأرباح والخسائر والميزانيات والتحليلات المالية.
              </p>
              <Link href="/financial-management/reports">
                <Button className="w-full">
                  عرض التقارير المالية
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* بطاقة الفواتير */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiFileText className="mr-2 text-yellow-500" />
                الفواتير
              </CardTitle>
              <CardDescription>
                إدارة الفواتير الصادرة والواردة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                إنشاء وإدارة الفواتير وتتبع المدفوعات والمستحقات.
              </p>
              <Link href="/financial-management/invoices">
                <Button className="w-full">
                  إدارة الفواتير
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة إدارة المشتريات */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiShoppingBag className="mr-2 text-orange-500" />
                إدارة المشتريات
              </CardTitle>
              <CardDescription>
                استلام فواتير الموردين ومراجعتها وتحويلها لإدارة التسعير
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                بوابة مركزية لمتابعة فواتير الشراء، حالات الاعتماد، وتحويلها تلقائياً لفرق التسعير.
              </p>
              <Link href="/financial-management/purchasing">
                <Button className="w-full">
                  إدارة المشتريات
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة إدارة التسعير */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiTarget className="mr-2 text-red-500" />
                إدارة التسعير
              </CardTitle>
              <CardDescription>
                إدارة الفواتير الواردة وتحديد الأسعار للعملاء
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                استلام فواتير المخازن وتحديد أسعار البيع للعملاء المختلفين.
              </p>
              <Link href="/financial-management/pricing-management">
                <Button className="w-full">
                  إدارة التسعير
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 