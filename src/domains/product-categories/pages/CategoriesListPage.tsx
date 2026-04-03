import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCategories, deleteCategory, deleteCategoryWithProducts } from '@/domains/product-categories/store/productCategoriesSlice';
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
import { useRouter } from 'next/navigation';
import { CategoryForm } from '../components/CategoryForm';
import { VisibilitySelect } from '../components/VisibilitySelect';
import { categoryService } from '../api/categoryService';
import { unwrapResult } from '@reduxjs/toolkit';
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

export const CategoriesListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  
  // Redux state
  const { data: categories, loading, error } = useAppSelector(state => state.productCategories.categories);
  
  // Local state for category form dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  
  // Local state for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [productCountForDelete, setProductCountForDelete] = useState<number>(0);
  
  // Estado para forzar la recarga
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    console.log('Cargando categorías...');
    dispatch(fetchCategories());
  }, [dispatch, refreshKey]);

  const handleAddCategory = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditCategory = (categoryId: string) => {
    setEditingCategory(categoryId);
  };

  const handleDeleteConfirmation = async (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setDeleteDialogOpen(true);
    const count = await categoryService.getProductCountByCategoryId(categoryId);
    setProductCountForDelete(count);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
    setProductCountForDelete(0);
  };

  const confirmDeleteOnly = async () => {
    if (!categoryToDelete) return;
    try {
      const resultAction = await dispatch(deleteCategory(categoryToDelete));
      const result = unwrapResult(resultAction);
      if (result === categoryToDelete) {
        toast({ title: "تم بنجاح", description: "تم حذف الفئة. الفئات الفرعية والمنتجات تبقى بدون فئة رئيسية (حسب إعداد قاعدة البيانات)." });
        setRefreshKey(prev => prev + 1);
      } else {
        toast({ title: "خطأ", description: "حدث خطأ أثناء حذف الفئة", variant: "destructive" });
      }
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as Error).message : "فشل حذف الفئة";
      toast({ title: "خطأ", description: errorMessage, variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      setProductCountForDelete(0);
    }
  };

  const confirmDeleteWithProducts = async () => {
    if (!categoryToDelete) return;
    try {
      const resultAction = await dispatch(deleteCategoryWithProducts(categoryToDelete));
      const result = unwrapResult(resultAction);
      if (result === categoryToDelete) {
        toast({ title: "تم بنجاح", description: "تم حذف الفئة وجميع الفئات الفرعية والمنتجات تحتها." });
        setRefreshKey(prev => prev + 1);
      } else {
        toast({ title: "خطأ", description: "حدث خطأ أثناء حذف الفئة مع المنتجات", variant: "destructive" });
      }
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as Error).message : "فشل حذف الفئة مع المنتجات";
      toast({ title: "خطأ", description: errorMessage, variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      setProductCountForDelete(0);
    }
  };

  const handleDirectDelete = (categoryId: string) => {
    handleDeleteConfirmation(categoryId);
  };

  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
    // Forzar recarga después de cerrar diálogo de añadir
    setRefreshKey(prev => prev + 1);
  };

  const closeEditDialog = () => {
    setEditingCategory(null);
    // Forzar recarga después de cerrar diálogo de editar
    setRefreshKey(prev => prev + 1);
  };

  const handleShowSubcategories = (categoryId: string) => {
    router.push(`/product-categories/subcategories/${categoryId}`);
  };

  const handleVisibilityChange = async (
    categoryId: string,
    visibility: { visible_to_client_app: boolean; visible_to_agent_app: boolean }
  ) => {
    try {
      const { error } = await categoryService.updateCategoryVisibility(categoryId, visibility);
      if (error) throw new Error(error);
      toast({ title: 'تم بنجاح', description: 'تم تحديث إعدادات الظهور' });
      setRefreshKey((prev) => prev + 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'فشل تحديث الظهور';
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
    }
  };

  if (loading && categories.length === 0) {
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
          <CardTitle className="text-2xl">إدارة الفئات</CardTitle>
          <Button onClick={handleAddCategory}>
            <PlusIcon className="h-4 w-4 mr-2" />
            إضافة فئة جديدة
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">لا توجد فئات متاحة</p>
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
                  <TableHead className="text-right">الظهور</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description || '-'}</TableCell>
                    <TableCell>
                      {category.image_url ? (
                        <img 
                          src={category.image_url} 
                          alt={category.name} 
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                          لا توجد صورة
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <VisibilitySelect
                        visibleToClientApp={category.visible_to_client_app ?? false}
                        visibleToAgentApp={category.visible_to_agent_app ?? false}
                        onVisibilityChange={(v) => handleVisibilityChange(category.id, v)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShowSubcategories(category.id)}
                        >
                          الفئات الفرعية
                        </Button>
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
                          onClick={() => handleDirectDelete(category.id)}
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

      {/* Category Form Dialog */}
      {isAddDialogOpen && (
        <CategoryForm
          onClose={closeAddDialog}
          isOpen={isAddDialogOpen}
        />
      )}

      {/* Edit Category Dialog */}
      {editingCategory && (
        <CategoryForm
          categoryId={editingCategory}
          onClose={closeEditDialog}
          isOpen={!!editingCategory}
        />
      )}

      {/* حوار الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) { setCategoryToDelete(null); setProductCountForDelete(0); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الفئة الرئيسية</AlertDialogTitle>
            <AlertDialogDescription>
              {productCountForDelete > 0
                ? `هذه الفئة تحتوي على ${productCountForDelete} منتج (ضمن فئاتها الفرعية أو مرتبط بها مباشرة). اختر أحد الخيارين:`
                : 'هل أنت متأكد من حذف هذه الفئة؟'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleCancelDelete}>إلغاء</AlertDialogCancel>
            {productCountForDelete > 0 ? (
              <>
                <AlertDialogAction onClick={confirmDeleteOnly} className="bg-muted text-muted-foreground">
                  حذف الفئة فقط (المنتجات والفئات الفرعية تبقى بدون فئة رئيسية)
                </AlertDialogAction>
                <AlertDialogAction onClick={confirmDeleteWithProducts} className="bg-destructive text-destructive-foreground">
                  حذف الفئة وجميع الفئات الفرعية والمنتجات تحتها
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction onClick={confirmDeleteOnly} className="bg-destructive text-destructive-foreground">
                حذف
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 