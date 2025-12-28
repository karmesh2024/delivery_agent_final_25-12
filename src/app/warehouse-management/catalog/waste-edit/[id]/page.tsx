'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';
import { wasteCatalogService, WasteCatalogItem } from '@/services/wasteCatalogService';
import WasteCatalogFormWizard from '../../components/WasteCatalogFormWizard';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

export default function EditWastePage() {
  const params = useParams();
  const router = useRouter();
  const wasteId = params?.id ? Number(params.id) : null;
  const [waste, setWaste] = useState<WasteCatalogItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (wasteId) {
      loadWaste();
    } else {
      toast.error('معرف المخلفات غير صحيح');
      router.push('/warehouse-management/catalog/view');
    }
  }, [wasteId]);

  const loadWaste = async () => {
    if (!wasteId) return;
    
    setIsLoading(true);
    try {
      const data = await wasteCatalogService.getWasteMaterial(wasteId);
      if (data) {
        setWaste(data);
      } else {
        toast.error('المخلفات غير موجودة');
        router.push('/warehouse-management/catalog/view');
      }
    } catch (error) {
      console.error('خطأ في جلب المخلفات:', error);
      toast.error('فشل في جلب بيانات المخلفات');
      router.push('/warehouse-management/catalog/view');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="تعديل المخلفات">
        <div className="p-6">
          <div className="text-center py-8">جاري تحميل بيانات المخلفات...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!waste) {
    return (
      <DashboardLayout title="تعديل المخلفات">
        <div className="p-6">
          <div className="text-center py-8 text-red-500">المخلفات غير موجودة</div>
          <Link href="/warehouse-management/catalog/view">
            <Button>العودة إلى قائمة المخلفات</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="تعديل المخلفات">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">تعديل المخلفات</h1>
            <p className="text-gray-600 mt-2">{waste.waste_no}</p>
          </div>
          <Link href="/warehouse-management/catalog/view">
            <Button variant="outline">
              <FiArrowRight className="mr-2" />
              العودة إلى قائمة المخلفات
            </Button>
          </Link>
        </div>

        <WasteCatalogFormWizard wasteId={wasteId!} initialData={waste} />
      </div>
    </DashboardLayout>
  );
}
