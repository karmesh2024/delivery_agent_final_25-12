'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';

export default function EditWarehousePage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id as string | undefined;
  const warehouseId = idParam ? Number(idParam) : undefined;

  useEffect(() => {
    if (warehouseId) {
      router.replace(`/warehouse-management/warehouses/new?editId=${warehouseId}`);
    }
  }, [warehouseId, router]);

  return (
    <DashboardLayout title="تعديل المخزن">
      <div className="p-6">جاري التوجيه إلى صفحة التعديل...</div>
    </DashboardLayout>
  );
}


