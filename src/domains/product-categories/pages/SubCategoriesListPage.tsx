"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  fetchSubCategories, 
  deleteSubCategory, 
  fetchCategoryById
} from '@/domains/product-categories/store/productCategoriesSlice';
import { useToast } from '@/shared/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { PlusIcon, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/shared/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { SubCategoryForm } from '@/domains/product-categories/components/SubCategoryForm';
import { AddBasketConfigForm } from '@/domains/product-categories/components/AddBasketConfigForm';

interface SubCategoriesListPageProps {
  categoryId: string;
}

export const SubCategoriesListPage: React.FC<SubCategoriesListPageProps> = ({ categoryId }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  
  // Redux state
  const { data: subcategories, loading, error } = useAppSelector(state => state.productCategories.subcategories);
  const { selectedCategory } = useAppSelector(state => state.productCategories);
  
  // Local state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<string | null>(null);
  const [isAddBasketConfigDialogOpen, setIsAddBasketConfigDialogOpen] = useState(false);

  useEffect(() => {
    // جلب الفئة الرئيسية والفئات الفرعية التابعة لها
    dispatch(fetchCategoryById(categoryId));
    dispatch(fetchSubCategories(categoryId));
  }, [dispatch, categoryId]);

  const handleAddSubCategory = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditSubCategory = (subcategoryId: string) => {
    setEditingSubCategory(subcategoryId);
  };

  const handleDeleteConfirmation = (subcategoryId: string) => {
    setSubcategoryToDelete(subcategoryId);
    setIsDeleteDialogOpen(true);
  };

  const handleDirectDelete = async (subcategoryId: string) => {
    try {
      await dispatch(deleteSubCategory(subcategoryId)).unwrap();
      toast({
        title: "تم بنجاح",
        description: "تم حذف الفئة الفرعية بنجاح",
      });
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast({
        title: "خطأ",
        description: "فشل حذف الفئة الفرعية",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (subcategoryToDelete) {
      try {
        await dispatch(deleteSubCategory(subcategoryToDelete)).unwrap();
        toast({
          title: "تم بنجاح",
          description: "تم حذف الفئة الفرعية بنجاح",
        });
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل حذف الفئة الفرعية",
          variant: "destructive",
        });
      } finally {
        setIsDeleteDialogOpen(false);
        setSubcategoryToDelete(null);
      }
    }
  };

  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
  };

  const closeEditDialog = () => {
    setEditingSubCategory(null);
  };

  const handleBackToCategories = () => {
    router.push('/product-categories');
  };

  if (loading && subcategories.length === 0) {
    return <div className="flex justify-center items-center min-h-[400px]">جاري تحميل البيانات...</div>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-red-500">حدث خطأ: {error}</div>
      </div>
    );
  }

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
              العودة للفئات
            </Button>
            <CardTitle className="text-2xl">
              إدارة الفئات الفرعية {selectedCategory && `لـ: ${selectedCategory.name}`}
            </CardTitle>
          </div>
          <Button onClick={handleAddSubCategory}>
            <PlusIcon className="h-4 w-4 mr-2" />
            إضافة فئة فرعية جديدة
          </Button>
        </CardHeader>
        <CardContent>
          {subcategories.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">لا توجد فئات فرعية متاحة لهذه الفئة</p>
              <Button onClick={handleAddSubCategory} className="mt-4">
                إضافة فئة فرعية الآن
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">النقاط لكل كجم</TableHead>
                  <TableHead className="text-right">الصورة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcategories.map((subcategory) => (
                  <TableRow key={subcategory.id}>
                    <TableCell className="font-medium">{subcategory.name}</TableCell>
                    <TableCell>{subcategory.description || '-'}</TableCell>
                    <TableCell>{subcategory.price || 0} جنيه مصري</TableCell>
                    <TableCell>{subcategory.points_per_kg || 0} نقطة</TableCell>
                    <TableCell>
                      {subcategory.image_url ? (
                        <img 
                          src={subcategory.image_url} 
                          alt={subcategory.name} 
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                          لا توجد صورة
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() => router.push(`/product-categories/products/${categoryId}/${subcategory.id}`)}
                        >
                          المنتجات
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/product-categories/basket-config/${subcategory.id}`)}
                        >
                          إعدادات السلة
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSubCategory(subcategory.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDirectDelete(subcategory.id)}
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add SubCategory Form */}
      {isAddDialogOpen && (
        <SubCategoryForm
          categoryId={categoryId}
          onClose={closeAddDialog}
          isOpen={isAddDialogOpen}
        />
      )}

      {/* Edit SubCategory Form */}
      {editingSubCategory && (
        <SubCategoryForm
          categoryId={categoryId}
          subcategoryId={editingSubCategory}
          onClose={closeEditDialog}
          isOpen={!!editingSubCategory}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه الفئة الفرعية؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيؤدي حذف الفئة الفرعية إلى حذف جميع المنتجات المرتبطة بها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 