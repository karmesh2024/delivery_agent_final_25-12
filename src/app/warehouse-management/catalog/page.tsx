'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Button } from '@/shared/ui/button';
import { FiEye, FiPlus, FiBarChart, FiCamera, FiLayers } from 'react-icons/fi';
import ProductCatalogFormWizard from './components/ProductCatalogFormWizard';
import WasteCatalogFormWizard from './components/WasteCatalogFormWizard';

export default function WarehouseCatalogPage() {
  return (
    <DashboardLayout title="كتالوج المخازن">
      <div className="p-6">
        {/* Header with actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">كتالوج المخازن</h1>
            <p className="text-gray-600 mt-2">إدارة المنتجات والمخلفات</p>
          </div>
          <div className="flex gap-2">
            <Link href="/warehouse-management/catalog/categories">
              <Button variant="outline">
                <FiLayers className="mr-2" />
                إدارة الفئات
              </Button>
            </Link>
            <Link href="/warehouse-management/catalog/view">
              <Button variant="outline">
                <FiEye className="mr-2" />
                عرض الكتالوج
              </Button>
            </Link>
            <Link href="/warehouse-management/catalog/stats">
              <Button variant="outline">
                <FiBarChart className="mr-2" />
                الإحصائيات
              </Button>
            </Link>
            <Link href="/warehouse-management/catalog/scanner">
              <Button variant="outline">
                <FiCamera className="mr-2" />
                مسح QR Code
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">إضافة منتج جديد</TabsTrigger>
            <TabsTrigger value="waste">إضافة مخلفات جديدة</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <ProductCatalogFormWizard />
          </TabsContent>

          <TabsContent value="waste" className="mt-6">
            <WasteCatalogFormWizard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}


