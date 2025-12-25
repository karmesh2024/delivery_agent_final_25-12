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
import PaymentSectionsIntro from '@/components/payments/PaymentSectionsIntro';
import { AllTransactionsTable } from '@/components/payments/AllTransactionsTable';
import { TransactionDetail } from '@/domains/payments/types/paymentTypes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/ui/dialog";
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import PaymentsContent from "@/domains/payments/components/PaymentsContent";

interface PaymentsPageProps {
  isEmbedded?: boolean;
}

export default function PaymentsPage({ isEmbedded = false }: PaymentsPageProps) {
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
    <DashboardLayout title="المدفوعات">
      <PaymentsContent isEmbedded={isEmbedded} />
    </DashboardLayout>
  );
} 