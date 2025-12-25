'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';
import { productCatalogService, ProductCatalogItem } from '@/services/productCatalogService';
import ProductCatalogForm from '../../components/ProductCatalogFormWizard';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

export default function EditCatalogProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id ? Number(params.id) : null;
  const [product, setProduct] = useState<ProductCatalogItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      loadProduct();
    } else {
      toast.error('معرف المنتج غير صحيح');
      router.push('/warehouse-management/catalog/view');
    }
  }, [productId]);

  const loadProduct = async () => {
    if (!productId) return;
    
    setIsLoading(true);
    try {
      const data = await productCatalogService.getProduct(productId);
      if (data) {
        setProduct(data);
      } else {
        toast.error('المنتج غير موجود');
        router.push('/warehouse-management/catalog/view');
      }
    } catch (error) {
      console.error('خطأ في جلب المنتج:', error);
      toast.error('فشل في جلب بيانات المنتج');
      router.push('/warehouse-management/catalog/view');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="تعديل المنتج">
        <div className="p-6">
          <div className="text-center py-8">جاري تحميل بيانات المنتج...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout title="تعديل المنتج">
        <div className="p-6">
          <div className="text-center py-8 text-red-500">المنتج غير موجود</div>
          <Link href="/warehouse-management/catalog/view">
            <Button>العودة إلى قائمة المنتجات</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="تعديل المنتج">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">تعديل المنتج</h1>
            <p className="text-gray-600 mt-2">{product.name}</p>
          </div>
          <Link href="/warehouse-management/catalog/view">
            <Button variant="outline">
              <FiArrowRight className="mr-2" />
              العودة إلى قائمة المنتجات
            </Button>
          </Link>
        </div>

        <ProductCatalogForm productId={productId!} initialData={product} />
      </div>
    </DashboardLayout>
  );
}

