import { Metadata } from "next";
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import OrderTrackingPage from "@/app/orders/[orderId]/page";

type Props = {
  params: {
    id: string;
  };
};

export const metadata: Metadata = {
  title: "تتبع الطلب | لوحة تحكم منصة التوصيل",
  description: "صفحة تتبع الطلب والمسارات بين المندوب والعميل",
};

// Server component that handles metadata and safely extracts the order ID
export default async function Page({ params }: Props) {
  // استخدام await لانتظار الحصول على params
  const resolvedParams = await params;
  
  // Extract the ID safely without destructuring to avoid errors
  let orderId = resolvedParams?.id || '';
  
  // Fix any formatting issues in the order ID
  // Remove any "5_" prefix that might be added incorrectly
  if (orderId.startsWith('5_')) {
    orderId = orderId.substring(2);
  }
  
  // Replace any * with _ in case of URL encoding issues
  orderId = orderId.replace(/\*/g, '_');
  
  // Try to fix UUID format if needed (replace underscores with hyphens)
  // This helps match the standard UUID format that the component might expect
  if (orderId.includes('_') && !orderId.includes('-')) {
    // This appears to be a UUID with underscores instead of hyphens
    orderId = orderId.replace(/_/g, '-');
  }
  
  // Render the dashboard layout with the order tracking page
  return (
    <DashboardLayout title="تتبع الطلب">
      <OrderTrackingPage orderId={orderId} />
    </DashboardLayout>
  );
}