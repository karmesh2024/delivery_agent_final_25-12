'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { FiDollarSign, FiTruck, FiCheckCircle } from "react-icons/fi";
import Link from "next/link";

export default function ApprovalsHubPage() {
  return (
    <DashboardLayout title="طلبات الموافقة">
      <div className="p-6 space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">طلبات الموافقة</h1>
          <p className="text-gray-500 mt-2">
            إدارة جميع طلبات الموافقة في نظام إدارة المخلفات
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* بطاقة طلبات الموافقة على الأسعار */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <div className="p-3 rounded-lg bg-blue-50 mr-3">
                  <FiDollarSign className="text-blue-600 text-2xl" />
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
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  عرض طلبات الموافقة على الأسعار
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* بطاقة طلبات الاستلام */}
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <div className="p-3 rounded-lg bg-green-50 mr-3">
                  <FiTruck className="text-green-600 text-2xl" />
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
                <Button className="w-full bg-green-600 hover:bg-green-700">
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


