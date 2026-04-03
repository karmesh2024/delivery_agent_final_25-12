"use client";

import React, { useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { createProductRequest } from "@/domains/product-requests/store/productRequestsSlice";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import { ProductRequestForm } from "@/domains/product-requests/components/ProductRequestForm";
import type { ProductRequestCreate } from "@/domains/product-requests/types";
import { getCurrentUserId } from "@/lib/logger-safe";
import { useToast } from "@/shared/ui/use-toast";
import { Button } from "@/shared/ui/button";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

export default function NewProductRequestPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: ProductRequestCreate) => {
    const userId = await getCurrentUserId();
    if (!userId) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await dispatch(createProductRequest({ payload: data, userId })).unwrap();
      toast({
        title: "تم إنشاء الطلب",
        description: "تم تقديم طلب إضافة المنتج بنجاح",
      });
      router.push("/waste-management/product-requests");
    } catch (e) {
      toast({
        title: "خطأ",
        description: (e as Error).message ?? "فشل في إنشاء الطلب",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="طلب إضافة منتج جديد">
      <div className="p-6">
        <div className="mb-6 flex items-center gap-2">
          <Link href="/waste-management/product-requests">
            <Button variant="ghost" size="sm">
              العودة للقائمة
            </Button>
          </Link>
          <FiArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-6">طلب إضافة منتج جديد</h1>
        <ProductRequestForm
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="تقديم الطلب"
        />
      </div>
    </DashboardLayout>
  );
}
