"use client";

import React, { useState } from 'react';
import { PaymentsStats } from "@/components/payments/StatsCards";
import { TransactionCharts } from "@/components/payments/PaymentCharts";
import { RecentTransactionsTable } from "@/components/payments/RecentTransactionsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import WalletsTable from "@/components/payments/WalletsTable";
import PayoutRequestsTable from "@/components/payments/PayoutRequestsTable";
import WalletStats from "@/components/payments/WalletStats";
import { Button } from "@/shared/ui/button";
import DetailedReports from '@/components/payments/DetailedReports';
import { AllTransactionsTable } from '@/components/payments/AllTransactionsTable';
import { TransactionDetail } from '@/domains/payments/types/paymentTypes';
import { UniversalDialog } from "@/shared/ui/universal-dialog";

interface PaymentsContentProps {
  isEmbedded?: boolean;
}

const PaymentsContent: React.FC<PaymentsContentProps> = ({ isEmbedded = false }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [walletView, setWalletView] = useState<"stats" | "table">("stats");
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetail | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleViewTransactionDetails = (transaction: TransactionDetail) => {
    setSelectedTransaction(transaction);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedTransaction(null);
  };

  return (
    <div className={!isEmbedded ? "p-6 space-y-8" : "space-y-6"}> {/* Adjust padding based on embedding */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex h-auto p-1 text-muted-foreground grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 ">
          <TabsTrigger
            value="dashboard"
            className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            لوحة التحكم
          </TabsTrigger>
          <TabsTrigger
            value="wallets"
            className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            المحافظ
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            المعاملات
          </TabsTrigger>
          <TabsTrigger
            value="payouts"
            className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            طلبات السحب
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            التقارير
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="space-y-8 mt-4">
            <PaymentsStats />
            <TransactionCharts />
            <RecentTransactionsTable />
          </div>
        </TabsContent>

        <TabsContent value="wallets">
          <div className="space-y-4 mt-4">
            <div className="flex items-center space-x-2 mb-4 rtl:space-x-reverse border-b pb-2">
              <p className="text-sm font-medium text-gray-600 ml-2">عرض:</p>
              <Button 
                variant={walletView === "stats" ? "default" : "outline"} 
                size="sm"
                onClick={() => setWalletView("stats")}
              >
                إحصائيات المحافظ
              </Button>
              <Button 
                variant={walletView === "table" ? "default" : "outline"} 
                size="sm"
                onClick={() => setWalletView("table")}
              >
                قائمة المحافظ
              </Button>
            </div>
            {walletView === "stats" && <WalletStats />}
            {walletView === "table" && <WalletsTable />}
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <div className="mt-4">
            <AllTransactionsTable onViewDetails={handleViewTransactionDetails} />
          </div>
        </TabsContent>

        <TabsContent value="payouts">
          <div className="mt-4">
            <PayoutRequestsTable />
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="mt-4">
            <DetailedReports />
          </div>
        </TabsContent>
      </Tabs>

      {selectedTransaction && (
        <UniversalDialog
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`تفاصيل المعاملة: ${selectedTransaction.id}`}
          description="عرض تفصيلي لبيانات المعاملة المحددة."
          footer={
            <Button variant="outline" onClick={closeDetailsModal}>إغلاق</Button>
          }
        >
          <div className="grid gap-4 py-4 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <p><strong>المعرف:</strong></p><p>{selectedTransaction.id}</p>
              <p><strong>التاريخ:</strong></p><p>{new Date(selectedTransaction.date).toLocaleString('ar-EG')}</p>
              <p><strong>النوع:</strong></p><p>{selectedTransaction.type}</p>
              <p><strong>المبلغ:</strong></p><p>{selectedTransaction.amount} {selectedTransaction.currency}</p>
              <p><strong>الحالة:</strong></p><p>{selectedTransaction.status}</p>
              <p><strong>المستخدم:</strong></p><p>{selectedTransaction.user || '-'}</p>
              <p><strong>الوصف:</strong></p><p>{selectedTransaction.description || '-'}</p>
              <p><strong>معرف المحفظة:</strong></p><p>{selectedTransaction.wallet_id}</p>
              {selectedTransaction.balance_before !== null && selectedTransaction.balance_before !== undefined && 
                <><p><strong>الرصيد قبل:</strong></p><p>{selectedTransaction.balance_before.toFixed(2)}</p></>}
              {selectedTransaction.balance_after !== null && selectedTransaction.balance_after !== undefined &&
                <><p><strong>الرصيد بعد:</strong></p><p>{selectedTransaction.balance_after.toFixed(2)}</p></>}
              {selectedTransaction.order_id && 
                <><p><strong>معرف الطلب:</strong></p><p>{selectedTransaction.order_id}</p></>}
              {selectedTransaction.related_transaction_id && 
                <><p><strong>المعاملة المرتبطة:</strong></p><p>{selectedTransaction.related_transaction_id}</p></>}
              {selectedTransaction.initiatedBy && 
                <><p><strong>منشئ المعاملة:</strong></p><p>{selectedTransaction.initiatedBy}</p></>}
              {selectedTransaction.admin_id && 
                <><p><strong>المسؤول:</strong></p><p>{selectedTransaction.admin_id}</p></>}
              {selectedTransaction.notes && 
                <><p><strong>ملاحظات:</strong></p><p>{selectedTransaction.notes}</p></>}
               {selectedTransaction.payment_method_details && (
                <>
                  <p className="col-span-2"><strong>تفاصيل طريقة الدفع:</strong></p>
                  <div className="col-span-2 pl-4">
                    {Object.entries(selectedTransaction.payment_method_details).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-2">
                        <p className="font-medium">{key}:</p>
                        <p>{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </UniversalDialog>
      )}
    </div>
  );
};

export default PaymentsContent; 