"use client";

import { Provider } from 'react-redux';
import { store } from '@/store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import AgentOrdersTab from "@/domains/store-orders/components/AgentOrdersTab";
import UserOrdersTab from "@/domains/store-orders/components/UserOrdersTab";

export default function StoreOrdersPage() {
  return (
    <Provider store={store}>
      <div className="container mx-auto py-10">
        <Link 
          href="/store-management" 
          className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" /> العودة إلى إدارة المتاجر الإلكترونية
        </Link>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">إدارة طلبات المتاجر</h1>
          <p className="text-muted-foreground">
            متابعة وإدارة الطلبات الواردة من الوكلاء المعتمدين والمستخدمين
          </p>
        </div>

        <Tabs defaultValue="agents" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="agents">طلبات الوكلاء المعتمدين</TabsTrigger>
            <TabsTrigger value="users">طلبات المستخدمين</TabsTrigger>
          </TabsList>
          
          <TabsContent value="agents" className="mt-6">
            <AgentOrdersTab />
          </TabsContent>
          
          <TabsContent value="users" className="mt-6">
            <UserOrdersTab />
          </TabsContent>
        </Tabs>
      </div>
    </Provider>
  );
}

