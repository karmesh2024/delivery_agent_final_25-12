'use client';

import React, { useState } from 'react';
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { FileText, ShoppingCart, Activity } from 'lucide-react';
import ContractsPage from "@/domains/waste-management/partners/pages/ContractsPage";
import IncomingOrdersPage from "@/domains/waste-management/partners/pages/IncomingOrdersPage";

export default function PartnersOperationsPage() {
  const [activeTab, setActiveTab] = useState('contracts');

  return (
    <DashboardLayout title="إدارة عمليات الشركاء الصناعيين">
      <div className="container mx-auto p-0 space-y-6" dir="rtl">
        <Tabs defaultValue="contracts" className="w-full" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-slate-100 mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
                <Activity size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800">إدارة التوريد والتعاقدات</h1>
                <p className="text-xs text-slate-500 font-medium">التحكم في الطلبات المباشرة وعقود التوريد طويلة الأمد</p>
              </div>
            </div>

            <TabsList className="grid grid-cols-2 w-[400px] h-11 bg-slate-100/50 p-1">
              <TabsTrigger value="contracts" className="font-bold gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600">
                <FileText size={16} />
                إدارة العقود
              </TabsTrigger>
              <TabsTrigger value="orders" className="font-bold gap-2 data-[state=active]:bg-white data-[state=active]:text-orange-600">
                <ShoppingCart size={16} />
                طلبات السوق المباشرة
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="contracts" className="mt-0 animate-in fade-in duration-300">
            <ContractsPage />
          </TabsContent>

          <TabsContent value="orders" className="mt-0 animate-in fade-in duration-300">
            <IncomingOrdersPage />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
