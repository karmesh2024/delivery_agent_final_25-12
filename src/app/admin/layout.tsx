"use client";

import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import React from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // يمكنك هنا تحديد عنوان افتراضي لمجموعة صفحات الأدمن إذا أردت
  // أو تمرير العنوان ديناميكيًا من الصفحات الفرعية
  return <DashboardLayout title="Admin Panel">{children}</DashboardLayout>;
} 