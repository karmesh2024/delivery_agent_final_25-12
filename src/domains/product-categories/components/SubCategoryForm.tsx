"use client";

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addSubCategory,
  addSubCategoryWithInitialPrice,
  updateSubCategory,
  fetchSubCategoryById
} from '@/domains/product-categories/store/productCategoriesSlice';
import { useToast } from '@/shared/ui/use-toast';
import { SubCategory } from '@/types';
import { UniversalDialog, FormData, DelegationData } from '@/shared/ui/universal-dialog';

interface SubCategoryFormProps {
  categoryId: string;
  subcategoryId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SubCategoryForm: React.FC<SubCategoryFormProps> = ({
  categoryId,
  subcategoryId,
  isOpen,
  onClose
}) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { data: categories } = useAppSelector(state => state.productCategories.categories);
  const { selectedSubCategory, selectedCategory } = useAppSelector(state => state.productCategories);

  const [formData, setFormData] = useState<Partial<SubCategory>>({
    name: '',
    description: '',
    image_url: '',
    category_id: categoryId,
    price: 0,
    points_per_kg: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // إذا كانت هناك عملية تعديل، قم بجلب بيانات الفئة الفرعية
    if (subcategoryId) {
      dispatch(fetchSubCategoryById(subcategoryId));
    }
  }, [subcategoryId, dispatch]);

  useEffect(() => {
    // تحديث نموذج البيانات عند استلام بيانات الفئة الفرعية
    if (subcategoryId && selectedSubCategory) {
      setFormData({
        name: selectedSubCategory.name || '',
        description: selectedSubCategory.description || '',
        image_url: selectedSubCategory.image_url || '',
        category_id: categoryId,
        price: selectedSubCategory.price !== null ? selectedSubCategory.price : 0,
        points_per_kg: selectedSubCategory.points_per_kg !== null ? selectedSubCategory.points_per_kg : 0,
      });
    }
  }, [subcategoryId, selectedSubCategory, categoryId]);

  // دالة لتحويل واجهة UniversalDialog إلى ours
  const handleDialogSubmit = (data: FormData | DelegationData) => {
    // التحقق من نوع البيانات - فقط في حالة FormData نكمل
    if ('name' in data) {
      const dialogFormData = data as FormData & { initial_exchange_buy_price?: number; initial_exchange_sell_price?: number };
      const convertedData: Partial<SubCategory> = {
        name: dialogFormData.name || '',
        description: dialogFormData.description || '',
        image_url: dialogFormData.image_url || '',
        category_id: dialogFormData.main_category_id || categoryId,
        price: formData.price || 0,
        points_per_kg: formData.points_per_kg || 0,
      };

      setIsSubmitting(true);
      
      const handleSubmit = async () => {
        try {
          if (subcategoryId) {
            // تحديث فئة فرعية موجودة
            await dispatch(updateSubCategory({ id: subcategoryId, subCategory: convertedData })).unwrap();
            toast({
              title: "تم بنجاح",
              description: "تم تحديث الفئة الفرعية بنجاح",
            });
          } else {
            const hasInitialPrice = typeof dialogFormData.initial_exchange_buy_price === 'number' && dialogFormData.initial_exchange_buy_price > 0;
            if (hasInitialPrice) {
              await dispatch(addSubCategoryWithInitialPrice({
                subCategory: convertedData,
                initialBuyPrice: dialogFormData.initial_exchange_buy_price,
                initialSellPrice: dialogFormData.initial_exchange_sell_price ?? undefined,
              })).unwrap();
              toast({
                title: "تم بنجاح",
                description: "تمت إضافة الفئة الفرعية مع سعر البورصة الأولي بنجاح",
              });
            } else {
              await dispatch(addSubCategory(convertedData)).unwrap();
              toast({
                title: "تم بنجاح",
                description: "تمت إضافة الفئة الفرعية بنجاح",
              });
            }
          }
          onClose();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
          toast({
            title: "خطأ",
            description: errorMessage,
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      handleSubmit();
    }
  };

  return (
    <div>
      <UniversalDialog
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleDialogSubmit}
        title={
          subcategoryId
            ? 'تعديل فئة فرعية'
            : 'إضافة فئة فرعية جديدة' + (selectedCategory ? ` لـ: ${selectedCategory.name}` : '')
        }
        type="subCategory"
        initialData={{
          ...(formData as object),
          main_category_id: (subcategoryId && selectedSubCategory?.category_id) || formData.category_id || categoryId,
          image_url: formData.image_url || '',
        } as FormData}
        mainCategories={(categories || []).map((c) => ({ id: c.id, name: c.name }))}
        loading={isSubmitting}
      />
    </div>
  );
};