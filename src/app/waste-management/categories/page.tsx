"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCategories, deleteCategory, fetchCategoryBucketConfigsThunk } from '@/domains/product-categories/store/productCategoriesSlice';
import { useToast } from '@/shared/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { PlusIcon, Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/shared/ui/table';
import { UniversalDialog } from '@/shared/ui/universal-dialog';
import { CategoryForm } from '@/domains/product-categories/components/CategoryForm';
import { CategoryBasketConfigForm } from '@/domains/product-categories/components/CategoryBasketConfigForm';
import { CategoryBasketConfigDetails } from '@/domains/product-categories/components/CategoryBasketConfigDetails';
import { Category } from '@/types';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';

const ProductCategoriesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  const { data: categories, loading, error } = useAppSelector(state => state.productCategories.categories);
  const { data: categoryBucketConfigs } = useAppSelector(state => state.productCategories.categoryBucketConfigs);
  const { selectedCategory } = useAppSelector(state => state.productCategories);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | undefined>(undefined);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchCategoryBucketConfigsThunk());
  }, [dispatch]);

  const handleAddCategory = () => {
    setEditingCategoryId(undefined);
    setIsFormOpen(true);
  };

  const handleEditCategory = (categoryId: string) => {
    setEditingCategoryId(categoryId);
    setIsFormOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('هل أنت متأكد أنك تريد حذف هذه الفئة؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      try {
        await dispatch(deleteCategory(categoryId)).unwrap();
        toast({
          title: "تم بنجاح",
          description: "تم حذف الفئة بنجاح.",
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'فشل في حذف الفئة';
        toast({
          title: "خطأ",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategoryId(undefined);
  };

  if (error) {
    return (
      <DashboardLayout title="إدارة الفئات والمنتجات">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-red-500">حدث خطأ: {error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="إدارة الفئات والمنتجات">
      <div className="container mx-auto p-6" dir="rtl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl">إدارة الفئات الرئيسية</CardTitle>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Button onClick={handleAddCategory}>
                <PlusIcon className="h-4 w-4 mr-2" />
                إضافة فئة جديدة
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && categories.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">جاري تحميل الفئات...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">لا توجد فئات متاحة حالياً.</p>
                <Button onClick={handleAddCategory} className="mt-4">
                  إضافة فئة الآن
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">الصورة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category: Category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.description || '-'}</TableCell>
                      <TableCell>
                        {category.image_url ? (
                          <img src={category.image_url} alt={category.name} className="w-12 h-12 object-cover rounded-md" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditCategory(category.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/waste-management/categories/subcategories?categoryId=${category.id}`)}
                          >
                            الفئات الفرعية
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/waste-management/categories/basket-config-category/${category.id}`)}
                          >
                            إعدادات السلة
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <UniversalDialog
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          title={editingCategoryId ? "تعديل فئة" : "إضافة فئة جديدة"}
          description="أدخل معلومات الفئة في النموذج أدناه."
        >
          <CategoryForm
            categoryId={editingCategoryId}
            isOpen={isFormOpen}
            onClose={handleCloseForm}
          />
        </UniversalDialog>
      </div>
    </DashboardLayout>
  );
};

export default ProductCategoriesPage;


