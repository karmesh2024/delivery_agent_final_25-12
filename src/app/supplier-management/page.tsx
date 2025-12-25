'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { FiShoppingBag, FiTag, FiFile, FiUsers, FiClipboard } from "react-icons/fi";
import Link from "next/link";

export default function SupplierManagement() {
  return (
    <DashboardLayout title="إدارة الموردين">
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">إدارة الموردين</h1>
        <p className="text-gray-600 mb-6">إدارة الموردين، عروض الأسعار، والتعاقدات</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* بطاقة الموردين */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiUsers className="mr-2 text-blue-500" />
                الموردين
              </CardTitle>
              <CardDescription>
                إدارة بيانات وملفات الموردين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                عرض وإدارة بيانات الموردين وتصنيفاتهم وتقييمهم.
              </p>
              <Link href="/supplier-management/suppliers">
                <Button className="w-full">
                  إدارة الموردين
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* بطاقة عروض الأسعار */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiTag className="mr-2 text-green-500" />
                عروض الأسعار
              </CardTitle>
              <CardDescription>
                إدارة عروض الأسعار المقدمة من الموردين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                تلقي ومراجعة وإدارة عروض الأسعار من الموردين.
              </p>
              <Link href="/supplier-management/price-offers">
                <Button className="w-full">
                  إدارة عروض الأسعار
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* بطاقة العقود */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiFile className="mr-2 text-purple-500" />
                العقود
              </CardTitle>
              <CardDescription>
                إدارة عقود التوريد مع الموردين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                إنشاء وإدارة عقود التوريد وضبط شروط العمل مع الموردين.
              </p>
              <Link href="/supplier-management/contracts">
                <Button className="w-full">
                  إدارة العقود
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* بطاقة طلبات الشراء */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiShoppingBag className="mr-2 text-yellow-500" />
                طلبات الشراء
              </CardTitle>
              <CardDescription>
                إدارة طلبات الشراء للموردين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                إنشاء وإدارة طلبات الشراء والتفاوض مع الموردين.
              </p>
              <Link href="/supplier-management/purchase-orders">
                <Button className="w-full">
                  إدارة طلبات الشراء
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة التقييم */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <FiClipboard className="mr-2 text-red-500" />
                تقييم الموردين
              </CardTitle>
              <CardDescription>
                نظام تقييم وتصنيف الموردين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                تقييم أداء الموردين ومتابعة مستويات الجودة والالتزام.
              </p>
              <Link href="/supplier-management/evaluation">
                <Button className="w-full">
                  تقييم الموردين
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 