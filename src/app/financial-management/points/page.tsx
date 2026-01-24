'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { FiSettings, FiDollarSign, FiList, FiBarChart2 } from "react-icons/fi";
import Link from "next/link";
import { InfoTooltip } from '@/domains/financial-management/points/components/InfoTooltip';
import {
  TooltipProvider,
} from '@/shared/components/ui/tooltip';

export default function PointsManagementPage() {
  return (
    <TooltipProvider>
      <DashboardLayout title="إدارة النقاط">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">إدارة النقاط</h1>
            <InfoTooltip
              content="نظام إدارة النقاط الشامل يتيح لك إدارة جميع جوانب نظام النقاط والمكافآت. يتضمن: إعدادات النقاط لكل فئة فرعية، تسعير النقاط، تتبع المعاملات، والتقارير الشاملة. استخدم القوائم أدناه للانتقال إلى كل قسم."
              side="right"
            />
          </div>
          <p className="text-gray-600 mb-6">إدارة نظام النقاط والمكافآت للعملاء</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* بطاقة إعدادات النقاط */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center text-xl">
                  <FiSettings className="mr-2 text-blue-500" />
                  إعدادات النقاط
                </CardTitle>
                <InfoTooltip
                  content="في هذه الصفحة يمكنك إضافة وتعديل إعدادات النقاط لكل فئة فرعية. حدد عدد النقاط لكل كيلوجرام، السعر، قيمة النقطة، نطاق الوزن، ومضاعف المكافأة."
                  side="top"
                />
              </div>
              <CardDescription>
                إدارة إعدادات النقاط لكل فئة فرعية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                قم بتحديد النقاط لكل كيلوجرام وقيمة النقطة لكل فئة فرعية من المخلفات.
              </p>
              <Link href="/financial-management/points/settings">
                <Button className="w-full">
                  الانتقال إلى الإعدادات
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* بطاقة تسعير النقاط */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center text-xl">
                  <FiDollarSign className="mr-2 text-green-500" />
                  تسعير النقاط
                </CardTitle>
                <InfoTooltip
                  content="في هذه الصفحة يمكنك تحديث القيمة المالية للنقاط لكل فئة فرعية. يتم حفظ جميع التغييرات في سجل التاريخ. يمكنك أيضاً رؤية متوسط قيمة النقطة والقيمة المالية الإجمالية."
                  side="top"
                />
              </div>
              <CardDescription>
                تحديد وتحديث القيمة المالية للنقاط
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                قم بتحديد قيمة النقطة بالجنيه المصري وتحديثها بناءً على السوق.
              </p>
              <Link href="/financial-management/points/pricing">
                <Button className="w-full">
                  الانتقال إلى التسعير
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة معاملات النقاط */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center text-xl">
                  <FiList className="mr-2 text-purple-500" />
                  معاملات النقاط
                </CardTitle>
                <InfoTooltip
                  content="في هذه الصفحة يمكنك عرض وتتبع جميع معاملات النقاط. استخدم الفلاتر للبحث حسب نوع المعاملة، العميل، أو الفترة الزمنية. يمكنك أيضاً تصدير البيانات."
                  side="top"
                />
              </div>
              <CardDescription>
                تتبع جميع معاملات النقاط
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                عرض وتتبع جميع معاملات النقاط (كسب، استخدام، تعديل).
              </p>
              <Link href="/financial-management/points/transactions">
                <Button className="w-full">
                  عرض المعاملات
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* بطاقة تقارير النقاط */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center text-xl">
                  <FiBarChart2 className="mr-2 text-orange-500" />
                  تقارير النقاط
                </CardTitle>
                <InfoTooltip
                  content="في هذه الصفحة يمكنك استعراض تقارير وإحصائيات شاملة عن نظام النقاط. حدد فترة زمنية لرؤية ملخص النقاط الممنوحة والمستخدمة، القيمة المالية، وأفضل العملاء. يمكنك تصدير التقرير."
                  side="top"
                />
              </div>
              <CardDescription>
                تحليلات وإحصائيات شاملة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                استعرض تقارير النقاط الممنوحة والمستخدمة والقيمة المالية.
              </p>
              <Link href="/financial-management/points/reports">
                <Button className="w-full">
                  عرض التقارير
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
}
