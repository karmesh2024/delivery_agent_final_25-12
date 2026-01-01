"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCategoryBucketConfigsThunk } from '@/domains/product-categories/store/productCategoriesSlice';
import { useToast } from '@/shared/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { CategoryBasketConfigDetails } from '@/domains/product-categories/components/CategoryBasketConfigDetails';

const CategoryBasketConfigPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams();
  const categoryId = params.categoryId as string;

  const { data: categoryBucketConfigs, loading, error } = useAppSelector(state => state.productCategories.categoryBucketConfigs);

  useEffect(() => {
    dispatch(fetchCategoryBucketConfigsThunk());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({
        title: "خطأ",
        description: `فشل في جلب إعدادات سلة الفئات الرئيسية: ${error}`,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleBackToCategories = () => {
    router.push('/waste-management/categories');
  };

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Button
              variant="outline"
              size="sm"
              className="mb-2"
              onClick={handleBackToCategories}
            >
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للفئات الرئيسية
            </Button>
            <CardTitle className="text-2xl">
              إعدادات سلة الفئة الرئيسية
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CategoryBasketConfigDetails categoryId={categoryId} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryBasketConfigPage;


