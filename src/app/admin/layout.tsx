"use client";

import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import React from "react";

import { usePathname } from "next/navigation";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const isAiSettings = pathname?.startsWith('/admin/ai-settings');

  return <DashboardLayout title="Admin Panel" hideSidebar={isAiSettings}>{children}</DashboardLayout>;
} 