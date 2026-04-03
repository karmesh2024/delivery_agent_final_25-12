"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  fetchSubCategories, 
  deleteSubCategory, 
  deleteSubCategoryWithProducts,
  fetchCategoryById,
  fetchCategories
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
import { VisibilitySelect } from '@/domains/product-categories/components/VisibilitySelect';
import { categoryService } from '@/domains/product-categories/api/categoryService';
import { useAnyPermission } from '@/domains/admins/hooks/usePermission';
import { CATEGORY_EDIT_PERMISSION_CODES } from '@/constants/categoryPermissions';
import Link from 'next/link';

interface SubCategoriesListPageProps {
  categoryId: string;
  /** عند true: عرض فقط للمراجعة (التعديل من إدارة التنظيم والتسلسل فقط) */
  viewOnly?: boolean;
  /** عند true: يسمح بالتحكم في الظهور حتى لو لم تتوفر صلاحيات ROLE */
  forceEditVisibility?: boolean;
}

export const SubCategoriesListPage: React.FC<SubCategoriesListPageProps> = ({
  categoryId,
  viewOnly = false,
  forceEditVisibility = false,
}) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  const { hasAccess: hasEditPermission, loading: permissionLoading } = useAnyPermission([...CATEGORY_EDIT_PERMISSION_CODES]);
  const canEditCategories = (!viewOnly && hasEditPermission) || forceEditVisibility;

  // Redux state
  const { data: subcategories, loading, error } = useAppSelector(state => state.productCategories.subcategories);
  const { selectedCategory } = useAppSelector(state => state.productCategories);
  
  // Local state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<string | null>(null);
  const [productCountForDelete, setProductCountForDelete] = useState<number>(0);
  const [isAddBasketConfigDialogOpen, setIsAddBasketConfigDialogOpen] = useState(false);

  useEffect(() => {
    // جلب الفئات الرئيسية (لاختيار الفئة الأساسية عند الإضافة) والفئة الحالية والفئات الفرعية
    dispatch(fetchCategories());
    dispatch(fetchCategoryById(categoryId));
    dispatch(fetchSubCategories(categoryId));
  }, [dispatch, categoryId]);

  const handleAddSubCategory = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditSubCategory = (subcategoryId: string) => {
    setEditingSubCategory(subcategoryId);
  };

  const handleDeleteConfirmation = async (subcategoryId: string) => {
    setSubcategoryToDelete(subcategoryId);
    setIsDeleteDialogOpen(true);
    const count = await categoryService.getProductCountBySubcategoryId(subcategoryId);
    setProductCountForDelete(count);
  };

  const confirmDeleteOnly = async () => {
    if (!subcategoryToDelete) return;
    try {
      await dispatch(deleteSubCategory(subcategoryToDelete)).unwrap();
      toast({ title: "تم بنجاح", description: "تم حذف الفئة الفرعية. المنتجات تبقى بدون فئة." });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل حذف الفئة الفرعية", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setSubcategoryToDelete(null);
      setProductCountForDelete(0);
    }
  };

  const confirmDeleteWithProducts = async () => {
    if (!subcategoryToDelete) return;
    try {
      await dispatch(deleteSubCategoryWithProducts(subcategoryToDelete)).unwrap();
      toast({ title: "تم بنجاح", description: "تم حذف الفئة الفرعية وجميع المنتجات تحتها." });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل حذف الفئة والمنتجات", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setSubcategoryToDelete(null);
      setProductCountForDelete(0);
    }
  };

  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
  };

  const closeEditDialog = () => {
    setEditingSubCategory(null);
  };

  const handleVisibilityChange = async (
    subcategoryId: string,
    visibility: { visible_to_client_app: boolean; visible_to_agent_app: boolean }
  ) => {
    try {
      const { error } = await categoryService.updateSubCategoryVisibility(subcategoryId, visibility);
      if (error) throw new Error(error);
      toast({ title: 'تم بنجاح', description: 'تم تحديث إعدادات الظهور' });
      dispatch(fetchSubCategories(categoryId));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'فشل تحديث الظهور';
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
    }
  };

  const handleBackToCategories = () => {
    router.push('/product-categories');
  };

  if (loading && subcategories.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">جاري تحميل البيانات...</div>
    );
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
          {canEditCategories && (
            <Button onClick={handleAddSubCategory}>
              <PlusIcon className="h-4 w-4 mr-2" />
              إضافة فئة فرعية جديدة
            </Button>
          )}
        </CardHeader>
        {(viewOnly || (!permissionLoading && !canEditCategories)) && (
          <div className="px-6 pb-2 text-sm text-amber-800 bg-amber-50 border-b border-amber-200" role="alert">
            للمراجعة فقط. التعديل من{' '}
            <Link href="/general-management/organization-structure" className="font-medium underline">
              إدارة التنظيم والتسلسل
            </Link>
            فقط.
          </div>
        )}
        <CardContent>
          {subcategories.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">لا توجد فئات فرعية متاحة لهذه الفئة</p>
              {canEditCategories && (
                <Button onClick={handleAddSubCategory} className="mt-4">
                  إضافة فئة فرعية الآن
                </Button>
              )}
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
                  <TableHead className="text-right">الظهور</TableHead>
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
                      {canEditCategories ? (
                        <VisibilitySelect
                          visibleToClientApp={subcategory.visible_to_client_app ?? false}
                          visibleToAgentApp={subcategory.visible_to_agent_app ?? false}
                          onVisibilityChange={(v) => handleVisibilityChange(subcategory.id, v)}
                        />
                      ) : (
                        <span className="text-muted-foreground">
                          {subcategory.visible_to_client_app ? 'عميل' : '-'} / {subcategory.visible_to_agent_app ? 'وكيل' : '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
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
                        {canEditCategories && (
                          <>
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
                              onClick={() => handleDeleteConfirmation(subcategory.id)}
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!open) { setSubcategoryToDelete(null); setProductCountForDelete(0); } setIsDeleteDialogOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الفئة الفرعية</AlertDialogTitle>
            <AlertDialogDescription>
              {productCountForDelete > 0
                ? `هذه الفئة تحتوي على ${productCountForDelete} منتج. اختر أحد الخيارين:`
                : 'هل أنت متأكد من حذف هذه الفئة الفرعية؟'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            {productCountForDelete > 0 ? (
              <>
                <AlertDialogAction onClick={confirmDeleteOnly} className="bg-muted text-muted-foreground">
                  حذف الفئة فقط (المنتجات تبقى بدون فئة)
                </AlertDialogAction>
                <AlertDialogAction onClick={confirmDeleteWithProducts} className="bg-destructive text-destructive-foreground">
                  حذف الفئة وجميع المنتجات تحتها
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