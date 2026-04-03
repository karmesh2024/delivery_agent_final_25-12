'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { FiPackage, FiDatabase, FiSettings, FiBarChart2, FiFileText, FiTag } from "react-icons/fi";
import Link from "next/link";

export default function GeneralManagementPage() {
  return (
    <DashboardLayout title="الإدارة العامة">
      <div className="p-6 space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">الإدارة العامة</h1>
          <p className="text-gray-500 mt-2">
            المنظومة الشاملة لإدارة الأنظمة والعمليات العامة في المنصة
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* بطاقة كتالوج المخازن */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <div className="p-3 rounded-lg bg-blue-50 mr-3">
                  <FiDatabase className="text-blue-600 text-2xl" />
                </div>
                كتالوج المخازن
              </CardTitle>
              <CardDescription className="mt-2">
                عرض وإدارة المنتجات والمخلفات في كتالوج المخازن
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600 text-sm">
                إدارة شاملة لجميع المنتجات والمخلفات المسجلة في كتالوج المخازن، مع إمكانية البحث والفلترة والتحرير.
              </p>
              <Link href="/warehouse-management/catalog/view">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  فتح كتالوج المخازن
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة إدارة المخازن */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <div className="p-3 rounded-lg bg-purple-50 mr-3">
                  <FiPackage className="text-purple-600 text-2xl" />
                </div>
                إدارة المخازن
              </CardTitle>
              <CardDescription className="mt-2">
                إدارة المخزون، التوريدات، والحركة المخزنية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600 text-sm">
                إدارة المخازن الهرمية، المخزون، التوريدات، والحركة المخزنية.
              </p>
              <Link href="/warehouse-management">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  فتح إدارة المخازن
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة إدارة التنظيم والتسلسل */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <div className="p-3 rounded-lg bg-cyan-50 mr-3">
                  <FiTag className="text-cyan-600 text-2xl" />
                </div>
                إدارة التنظيم والتسلسل
              </CardTitle>
              <CardDescription className="mt-2">
                إدارة القطاعات، التصنيفات، الفئات الأساسية والفرعية، الوحدات والبراندز
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600 text-sm">
                نظام موحد لإدارة القطاعات، التصنيفات، الفئات والبراندز في نظام متكامل.
              </p>
              <Link href="/general-management/organization-structure">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                  <FiTag className="mr-2" />
                  فتح إدارة التنظيم والتسلسل
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة التقارير والإحصائيات */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <div className="p-3 rounded-lg bg-orange-50 mr-3">
                  <FiBarChart2 className="text-orange-600 text-2xl" />
                </div>
                التقارير والإحصائيات
              </CardTitle>
              <CardDescription className="mt-2">
                تقارير شاملة وإحصائيات عن الأداء والعمليات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600 text-sm">
                عرض التقارير والإحصائيات الشاملة عن الأداء والعمليات في النظام.
              </p>
              <Link href="/analytics">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  فتح التقارير والإحصائيات
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة الإعدادات العامة */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <div className="p-3 rounded-lg bg-gray-50 mr-3">
                  <FiSettings className="text-gray-600 text-2xl" />
                </div>
                الإعدادات العامة
              </CardTitle>
              <CardDescription className="mt-2">
                إعدادات النظام العامة والتكوينات الأساسية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600 text-sm">
                إدارة الإعدادات العامة للنظام والتكوينات الأساسية.
              </p>
              <Link href="/settings">
                <Button className="w-full bg-gray-600 hover:bg-gray-700">
                  فتح الإعدادات العامة
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة مركز إدارة الإشعارات */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-blue-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <div className="p-3 rounded-lg bg-indigo-50 mr-3">
                  <FiSettings className="text-indigo-600 text-2xl" />
                </div>
                مركز إدارة الإشعارات
              </CardTitle>
              <CardDescription className="mt-2">
                إدارة طلبات الإشعارات، مراجعتها، واعتمادها قبل الإرسال
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600 text-sm">
                النظام المركزي لمراجعة جميع الإشعارات المقترحة من الإدارات المختلفة لضمان الجودة قبل وصولها للمستخدمين.
              </p>
              <Link href="/general-management/notifications-center">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  فتح مركز الإشعارات
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة الوثائق */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <div className="p-3 rounded-lg bg-teal-50 mr-3">
                  <FiFileText className="text-teal-600 text-2xl" />
                </div>
                الوثائق
              </CardTitle>
              <CardDescription className="mt-2">
                الوثائق والدلائل الإرشادية للنظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600 text-sm">
                الوثائق والدلائل الإرشادية لاستخدام النظام.
              </p>
              <Button className="w-full bg-teal-600 hover:bg-teal-700" disabled>
                قريباً
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
