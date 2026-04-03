'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { FiTrendingUp, FiBriefcase, FiPackage, FiDollarSign, FiTruck, FiPlusCircle, FiBell } from "react-icons/fi";
import Link from "next/link";
import { NotificationSender } from '@/components/notifications/NotificationSender';

export default function WasteManagementHub() {
  return (
    <DashboardLayout title="إدارة المخلفات">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">إدارة المخلفات</h1>
            <p className="text-gray-500 mt-2">
              المنظومة الشاملة لإدارة المخلفات من التصنيف والتسعير وحتى البيع للشركاء الصناعيين
            </p>
          </div>
          <NotificationSender 
            department="waste_mgmt" 
            trigger={
              <Button className="gap-2 bg-amber-600 hover:bg-amber-700">
                <FiBell /> إرسال تنبيه أسعار/عام
              </Button>
            }
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* بطاقة إدارة التسعير والبورصة */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <div className="p-3 rounded-lg bg-indigo-50 mr-3">
                  <FiTrendingUp className="text-indigo-600 text-2xl" />
                </div>
                إدارة التسعير والبورصة
              </CardTitle>
              <CardDescription className="mt-2">
                إدارة أسعار المخلفات الأساسية ومتابعة البورصة والتغيرات السوقية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600 text-sm">
                إدارة السعر الأساسي لكل مخلف بشكل مستقل ومتابعة أسعار السوق والتغيرات الحاصلة.
              </p>
              <Link href="/waste-management/pricing">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  إدارة التسعير والبورصة
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* بطاقة إدارة الشركاء الصناعيين */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <div className="p-3 rounded-lg bg-orange-50 mr-3">
                  <FiBriefcase className="text-orange-600 text-2xl" />
                </div>
                إدارة الشركاء الصناعيين
              </CardTitle>
              <CardDescription className="mt-2">
                إدارة المصانع والكسارات والتجار والمشترين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600 text-sm">
                تسجيل وإدارة الشركاء الصناعيين ومتابعة طلبات الشراء الواردة منهم.
              </p>
              <Link href="/waste-management/partners">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  إدارة الشركاء الصناعيين
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* بطاقة طلبات إضافة المنتجات الجديدة */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <div className="p-3 rounded-lg bg-amber-50 mr-3">
                  <FiPlusCircle className="text-amber-600 text-2xl" />
                </div>
                طلبات إضافة المنتجات الجديدة
              </CardTitle>
              <CardDescription className="mt-2">
                تقديم ومراجعة طلبات إضافة منتجات جديدة مع الموافقة والمزامنة التلقائية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600 text-sm">
                تقديم طلب إضافة منتج جديد، مراجعته من مدير المخلفات، والموافقة لإضافته تلقائياً للكتالوج والمنتجات.
              </p>
              <Link href="/waste-management/product-requests">
                <Button className="w-full bg-amber-600 hover:bg-amber-700">
                  طلبات إضافة المنتجات الجديدة
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة طلبات الموافقة على الأسعار */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <div className="p-3 rounded-lg bg-purple-50 mr-3">
                  <FiDollarSign className="text-purple-600 text-2xl" />
                </div>
                طلبات الموافقة على الأسعار
              </CardTitle>
              <CardDescription className="mt-2">
                مراجعة والموافقة على تغييرات الأسعار الكبيرة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600 text-sm">
                طلبات تغيير الأسعار التي تتجاوز 10% وتحتاج إلى موافقة من مدير المخلفات.
              </p>
              <Link href="/waste-management/pricing-approvals">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  عرض طلبات الموافقة على الأسعار
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة طلبات استلام المخلفات */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <div className="p-3 rounded-lg bg-teal-50 mr-3">
                  <FiTruck className="text-teal-600 text-2xl" />
                </div>
                طلبات استلام المخلفات
              </CardTitle>
              <CardDescription className="mt-2">
                التحقق والموافقة على استلام المخلفات من جميع المصادر
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600 text-sm">
                طلبات الاستلام من الدليفري بوي، الموردين، الوكلاء، والمصادر المباشرة.
              </p>
              <Link href="/waste-management/receiving">
                <Button className="w-full bg-teal-600 hover:bg-teal-700">
                  عرض طلبات الاستلام
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

