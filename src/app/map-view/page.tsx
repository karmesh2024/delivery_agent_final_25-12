/**
 * صفحة عرض الخريطة المتقدمة - معدلة لاستخدام هيكل DDD و Redux
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MapViewRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the consolidated map page
    router.replace("/map");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-muted-foreground">جاري التحويل إلى صفحة الخريطة الموحدة...</p>
      </div>
  );
}