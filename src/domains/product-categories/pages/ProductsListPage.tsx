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
import { Switch } from '@/shared/components/ui/switch';
import { useRouter } from 'next/navigation';
import { ProductForm } from '@/domains/product-categories/components/ProductForm';
import { VisibilitySelect } from '@/domains/product-categories/components/VisibilitySelect';
import { productService } from '@/domains/product-categories/services/productService';
import { getSubcategoryExchangePrice, computeProductPricePerKg } from '@/domains/waste-management/services/subcategoryExchangePriceService';
import { useAnyPermission } from '@/domains/admins/hooks/usePermission';
import { CATEGORY_EDIT_PERMISSION_CODES } from '@/constants/categoryPermissions';
import Link from 'next/link';

interface ProductsListPageProps {
  /** عند true: عرض فقط للمراجعة (التعديل من إدارة التنظيم والتسلسل فقط) */
  viewOnly?: boolean;
  /** عند true: يسمح بالتحكم في الظهور حتى لو لم تتوفر صلاحيات ROLE */
  forceEditVisibility?: boolean;
}

export const ProductsListPage: React.FC<ProductsListPageProps> = ({
  viewOnly = false,
  forceEditVisibility = false,
}) => {
  const params = useParams();
  const categoryId = params?.categoryId as string;
  const subcategoryId = params?.subcategoryId as string;

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  const { hasAccess: hasEditPermission, loading: permissionLoading } = useAnyPermission([...CATEGORY_EDIT_PERMISSION_CODES]);
  const canEditCategories = (!viewOnly && hasEditPermission) || forceEditVisibility;

  // Redux state
  const { data: products, loading, error } = useAppSelector(state => state.productCategories.products);
  const { selectedCategory, selectedSubCategory } = useAppSelector(state => state.productCategories);
  
  // Local state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [subcategoryBuyPrice, setSubcategoryBuyPrice] = useState<number | null>(null);

  useEffect(() => {
    // جلب البيانات
    dispatch(fetchCategoryById(categoryId));
    dispatch(fetchSubCategoryById(subcategoryId));
    dispatch(fetchProductsBySubcategory(subcategoryId));
  }, [dispatch, categoryId, subcategoryId]);

  useEffect(() => {
    if (!subcategoryId) return;
    getSubcategoryExchangePrice(Number(subcategoryId)).then((p) => {
      setSubcategoryBuyPrice(p?.buy_price ?? null);
    });
  }, [subcategoryId]);

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

  const handleVisibilityChange = async (
    productId: string,
    visibility: { visible_to_client_app: boolean; visible_to_agent_app: boolean }
  ) => {
    try {
      await productService.updateProductVisibility(productId, visibility);
      toast({ title: 'تم بنجاح', description: 'تم تحديث إعدادات الظهور' });
      dispatch(fetchProductsBySubcategory(subcategoryId));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'فشل تحديث الظهور';
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
    }
  };

  const handleToggleFeatured = async (productId: string, currentValue: boolean) => {
    try {
      await productService.updateProduct(productId, {
        is_onboarding_featured: !currentValue
      });
      toast({
        title: "تم بنجاح",
        description: currentValue 
          ? "تم إلغاء تمييز المنتج في الاقتراحات الذكية" 
          : "تم تمييز المنتج في الاقتراحات الذكية",
      });
      // تحديث قائمة المنتجات
      dispatch(fetchProductsBySubcategory(subcategoryId));
    } catch (error) {
      console.error("Error updating featured status:", error);
      toast({
        title: "خطأ",
        description: "فشل تحديث حالة التمييز",
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
          {canEditCategories && (
            <Button onClick={handleAddProduct}>
              <PlusIcon className="h-4 w-4 mr-2" />
              إضافة منتج جديد
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
          {products.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">لا توجد منتجات متاحة لهذه الفئة الفرعية</p>
              {canEditCategories && (
                <Button onClick={handleAddProduct} className="mt-4">
                  إضافة منتج الآن
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">الوزن (كجم)</TableHead>
                  <TableHead className="text-right">السعر (جنيه مصري)</TableHead>
                  <TableHead className="text-right">السعر الفعلي (ج/كجم)</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">النقاط</TableHead>
                  <TableHead className="text-right">الصورة</TableHead>
                  <TableHead className="text-right">الظهور</TableHead>
                  <TableHead className="text-right">إظهار في الاقتراحات الذكية</TableHead>
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
                    <TableCell>
                      {subcategoryBuyPrice != null
                        ? computeProductPricePerKg(subcategoryBuyPrice, product as { id: string; price_premium_percentage?: number | null; price_premium_fixed_amount?: number | null; [k: string]: unknown }).toFixed(2)
                        : typeof (product.price_per_kg ?? product.price) === 'number'
                          ? Number(product.price_per_kg ?? product.price).toFixed(2)
                          : '-'}
                    </TableCell>
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
                      {canEditCategories ? (
                        <VisibilitySelect
                          visibleToClientApp={product.visible_to_client_app ?? false}
                          visibleToAgentApp={product.visible_to_agent_app ?? false}
                          onVisibilityChange={(v) => handleVisibilityChange(product.id, v)}
                        />
                      ) : (
                        <span className="text-muted-foreground">
                          {product.visible_to_client_app ? 'عميل' : '-'} / {product.visible_to_agent_app ? 'وكيل' : '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {canEditCategories ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={product.is_onboarding_featured || false}
                            onCheckedChange={() => handleToggleFeatured(product.id, product.is_onboarding_featured || false)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {product.is_onboarding_featured ? 'مميز' : 'غير مميز'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          {product.is_onboarding_featured ? 'مميز' : 'غير مميز'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {canEditCategories && (
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
                      )}
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