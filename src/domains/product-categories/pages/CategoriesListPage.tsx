import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCategories, deleteCategory } from '@/domains/product-categories/store/productCategoriesSlice';
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
import { unwrapResult } from '@reduxjs/toolkit';
import { 
  UniversalDialog
} from '@/shared/ui/universal-dialog';

// استيراد أزرار الحوار من الملف الصحيح
import { 
  PermissionsDialogConfirmButton as DialogConfirmButton, 
  PermissionsDialogCloseButton as DialogCloseButton
} from '@/app/permissions/components/PermissionsUserDialog';

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

  const handleDeleteConfirmation = (categoryId: string) => {
    console.log('بدء عملية التأكيد على حذف الفئة:', categoryId);
    setCategoryToDelete(categoryId);
    setDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    console.log('تم إلغاء عملية الحذف');
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const confirmDelete = async () => {
    console.log('تأكيد حذف الفئة:', categoryToDelete);
    if (categoryToDelete) {
      try {
        console.log('Iniciando proceso de eliminación para categoría ID:', categoryToDelete);
        const resultAction = await dispatch(deleteCategory(categoryToDelete));
        const result = unwrapResult(resultAction);
        
        console.log('Resultado de la acción de eliminación:', result);
        
        if (result === categoryToDelete) {
          // حذف ناجح
          toast({
            title: "تم بنجاح",
            description: "تم حذف الفئة بنجاح",
          });
          // Forzar recarga después de eliminar
          setRefreshKey(prev => prev + 1);
        } else {
          // حدث خطأ غير متوقع
          toast({
            title: "خطأ",
            description: "حدث خطأ غير متوقع أثناء حذف الفئة",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error al eliminar categoría:', error);
        
        // استخراج رسالة الخطأ
        let errorMessage = "فشل حذف الفئة";
        if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = error.message as string;
        }
        
        toast({
          title: "خطأ",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
      }
    }
  };

  const handleDirectDelete = async (categoryId: string) => {
    console.log('بدء عملية الحذف المباشر للفئة:', categoryId);
    try {
      // استدعاء عملية الحذف مباشرة بدون نافذة تأكيد
      const resultAction = await dispatch(deleteCategory(categoryId));
      const result = unwrapResult(resultAction);
      
      console.log('نتيجة عملية الحذف المباشر:', result);
      
      if (result === categoryId) {
        // حذف ناجح
        toast({
          title: "تم بنجاح",
          description: "تم حذف الفئة بنجاح",
        });
        // إعادة تحميل القائمة
        setRefreshKey(prev => prev + 1);
      } else {
        // خطأ غير متوقع
        toast({
          title: "خطأ",
          description: "حدث خطأ غير متوقع أثناء الحذف المباشر",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('خطأ في عملية الحذف المباشر:', error);
      
      // استخراج رسالة الخطأ
      let errorMessage = "فشل الحذف المباشر";
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = error.message as string;
      }
      
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    }
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

      {/* حوار الحذف الجديد باستخدام UniversalDialog */}
      <UniversalDialog
        isOpen={deleteDialogOpen}
        onClose={handleCancelDelete}
        title="تأكيد الحذف"
        description="هل أنت متأكد من حذف هذه الفئة؟ هذا الإجراء لا يمكن التراجع عنه. سيؤدي حذف الفئة إلى حذف جميع الفئات الفرعية والمنتجات المرتبطة بها."
        footer={
          <>
            <DialogCloseButton onClick={handleCancelDelete} />
            <DialogConfirmButton 
              onClick={confirmDelete} 
              text="حذف" 
            />
          </>
        }
      >
        <div className="py-4 text-center">
          <p className="text-red-500 font-bold">سيتم حذف هذه الفئة بشكل نهائي!</p>
        </div>
      </UniversalDialog>
    </div>
  );
}; 