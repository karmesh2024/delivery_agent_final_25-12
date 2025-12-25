"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useParams } from 'next/navigation';
import { 
  fetchProductsBySubcategory, 
  deleteProduct,
  fetchCategoryById,
  fetchSubCategoryById
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
import { useRouter } from 'next/navigation';
import { ProductForm } from '@/domains/product-categories/components/ProductForm';

export const ProductsListPage: React.FC = () => {
  const params = useParams();
  const categoryId = params?.categoryId as string;
  const subcategoryId = params?.subcategoryId as string;
  
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  
  // Redux state
  const { data: products, loading, error } = useAppSelector(state => state.productCategories.products);
  const { selectedCategory, selectedSubCategory } = useAppSelector(state => state.productCategories);
  
  // Local state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  useEffect(() => {
    // جلب البيانات
    dispatch(fetchCategoryById(categoryId));
    dispatch(fetchSubCategoryById(subcategoryId));
    dispatch(fetchProductsBySubcategory(subcategoryId));
  }, [dispatch, categoryId, subcategoryId]);

  const handleAddProduct = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditProduct = (productId: string) => {
    setEditingProduct(productId);
  };

  const handleDirectDelete = async (productId: string) => {
    try {
      await dispatch(deleteProduct(productId)).unwrap();
      toast({
        title: "تم بنجاح",
        description: "تم حذف المنتج بنجاح",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "خطأ",
        description: "فشل حذف المنتج",
        variant: "destructive",
      });
    }
  };

  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
  };

  const closeEditDialog = () => {
    setEditingProduct(null);
  };

  const handleBackToSubcategories = () => {
    router.push(`/product-categories/subcategories/${categoryId}`);
  };

  if (loading && products.length === 0) {
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
              onClick={handleBackToSubcategories}
            >
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للفئات الفرعية
            </Button>
            <CardTitle className="text-2xl">
              إدارة المنتجات 
              {selectedCategory && selectedSubCategory && 
                ` للفئة: ${selectedCategory.name} - ${selectedSubCategory.name}`}
            </CardTitle>
          </div>
          <Button onClick={handleAddProduct}>
            <PlusIcon className="h-4 w-4 mr-2" />
            إضافة منتج جديد
          </Button>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">لا توجد منتجات متاحة لهذه الفئة الفرعية</p>
              <Button onClick={handleAddProduct} className="mt-4">
                إضافة منتج الآن
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">الوزن (كجم)</TableHead>
                  <TableHead className="text-right">السعر (جنيه مصري)</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">النقاط</TableHead>
                  <TableHead className="text-right">الصورة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.description || '-'}</TableCell>
                    <TableCell>{product.weight}</TableCell>
                    <TableCell>{product.price} جنيه مصري</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>{product.points}</TableCell>
                    <TableCell>
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
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
                          size="icon"
                          onClick={() => handleEditProduct(product.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDirectDelete(product.id)}
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

      {/* Add Product Form */}
      {isAddDialogOpen && (
        <ProductForm
          onClose={closeAddDialog}
          isOpen={isAddDialogOpen}
        />
      )}

      {/* Edit Product Form */}
      {editingProduct && (
        <ProductForm
          productId={editingProduct}
          onClose={closeEditDialog}
          isOpen={!!editingProduct}
        />
      )}
    </div>
  );
}; 