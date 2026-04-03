'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { FiDollarSign, FiTrendingUp, FiPieChart, FiFileText, FiTarget, FiShoppingBag, FiTag, FiCheckCircle, FiCreditCard, FiList, FiShield, FiGift } from "react-icons/fi";
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

          {/* بطاقة إدارة النقاط */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiTag className="mr-2 text-indigo-500" />
                إدارة النقاط
              </CardTitle>
              <CardDescription>
                إدارة نظام النقاط والمكافآت للعملاء
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                إعدادات النقاط، التسعير، المعاملات والتقارير الشاملة.
              </p>
              <Link href="/financial-management/points">
                <Button className="w-full">
                  إدارة النقاط
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة جلسات التجميع */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiCheckCircle className="mr-2 text-green-500" />
                جلسات التجميع
              </CardTitle>
              <CardDescription>
                اعتماد وإدارة جلسات تجميع المخلفات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                مراجعة واعتماد جلسات التجميع لإتاحة السحب للعملاء.
              </p>
              <Link href="/financial-management/sessions">
                <Button className="w-full">
                  إدارة الجلسات
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة طلبات السحب */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiCreditCard className="mr-2 text-blue-500" />
                طلبات السحب
              </CardTitle>
              <CardDescription>
                مراجعة ومعالجة طلبات السحب والاستبدال
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                الموافقة أو رفض طلبات سحب النقاط من العملاء.
              </p>
              <Link href="/financial-management/redemptions">
                <Button className="w-full">
                  إدارة طلبات السحب
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة سجل المعاملات */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiList className="mr-2 text-gray-500" />
                سجل المعاملات
              </CardTitle>
              <CardDescription>
                تتبع جميع حركات النقاط والمحفظة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Audit Log لجميع معاملات النقاط والمحفظة المالية.
              </p>
              <Link href="/financial-management/audit-log">
                <Button className="w-full">
                  عرض السجل
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة الاحتياطيات المالية */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiTrendingUp className="mr-2 text-emerald-500" />
                الاحتياطيات المالية
              </CardTitle>
              <CardDescription>
                إدارة الالتزامات والأصول والنسب المالية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                متابعة الاحتياطيات المالية، نسبة التغطية، والسيولة المتاحة.
              </p>
              <Link href="/financial-management/reserves">
                <Button className="w-full">
                  عرض الاحتياطيات
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة الربحية */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiTrendingUp className="mr-2 text-green-500" />
                الربحية
              </CardTitle>
              <CardDescription>
                متابعة الربحية من جلسات التجميع
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                عرض إجمالي الشراء والبيع والربح وهامش الربح من جميع الجلسات.
              </p>
              <Link href="/financial-management/profitability">
                <Button className="w-full">
                  عرض الربحية
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة حدود السحب */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiShield className="mr-2 text-orange-500" />
                حدود السحب
              </CardTitle>
              <CardDescription>
                إدارة الحدود اليومية والأسبوعية والشهرية للسحب
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                تحديد الحد الأقصى للمبلغ وعدد المعاملات المسموحة للعملاء.
              </p>
              <Link href="/financial-management/withdrawal-limits">
                <Button className="w-full">
                  إدارة الحدود
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة قواعد store_points */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiGift className="mr-2 text-purple-500" />
                قواعد نقاط المتجر
              </CardTitle>
              <CardDescription>
                إدارة قواعد منح نقاط البونص للعملاء
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                إنشاء وإدارة قواعد منح نقاط البونص مثل نقاط ترحيبية، بونص حسب الفئة، وعروض موسمية.
              </p>
              <Link href="/financial-management/store-points-rules">
                <Button className="w-full">
                  إدارة القواعد
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 