/**
 * الواجهة الأمامية لصفحة تتبع الطلب
 * محدثة لاستخدام Domain-Driven Design والاعتماد على Redux المُعد على مستوى التطبيق 
 */

"use client";

import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import { OrderTrackingView } from "@/components/OrderTrackingView";
// نستخدم Redux من خلال ملف providers.tsx المُعد على مستوى التطبيق
// لذا لا نحتاج لاستيراد Provider هنا

type OrderTrackingClientProps = {
  orderId: string;
};

export default function OrderTrackingClient({ orderId }: OrderTrackingClientProps) {
  return (
    <DashboardLayout title="تتبع الطلب">
      {/* 
        لا نحتاج لتغليف المكون بـ Redux Provider هنا
        لأن التطبيق بأكمله مغلف بالفعل من خلال src/app/providers.tsx
      */}
      <OrderTrackingView orderId={orderId} />
    </DashboardLayout>
  );
}