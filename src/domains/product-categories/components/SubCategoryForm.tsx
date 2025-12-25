"use client";

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addSubCategory,
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

// واجهة محسنة للبيانات من Dialog
interface SubCategoryDialogData {
  name: string;
  description: string;
  image_url?: string;
  price?: number;
  points_per_kg?: number;
  [key: string]: unknown;
}

export const SubCategoryForm: React.FC<SubCategoryFormProps> = ({
  categoryId,
  subcategoryId,
  isOpen,
  onClose
}) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { selectedSubCategory } = useAppSelector(state => state.productCategories);
  const { selectedCategory } = useAppSelector(state => state.productCategories);

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
      const formData = data as FormData;
      const dialogData = formData as unknown as SubCategoryDialogData;
      const convertedData: Partial<SubCategory> = {
        name: formData.name || '',
        description: formData.description || '',
        image_url: dialogData.image_url || '',
        category_id: categoryId,
        price: dialogData.price || 0,
        points_per_kg: dialogData.points_per_kg || 0,
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
            // إضافة فئة فرعية جديدة
            await dispatch(addSubCategory(convertedData)).unwrap();
            toast({
              title: "تم بنجاح",
              description: "تمت إضافة الفئة الفرعية بنجاح",
            });
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
        initialData={formData as unknown as FormData}
        loading={isSubmitting}
      />
    </div>
  );
};