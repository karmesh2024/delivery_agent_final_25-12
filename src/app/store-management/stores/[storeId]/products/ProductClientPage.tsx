"use client";

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProducts, addNewProduct, updateExistingProduct, deleteProduct } from '@/domains/products/store/productSlice';
import { Product, ImageUploadData } from '@/domains/products/types/types';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Search } from 'lucide-react';
import { Spinner } from '@/shared/components/ui/spinner';
import { CustomDialog } from '@/shared/ui/custom-dialog';
import { toast } from 'sonner';
import ProductForm from '@/domains/products/components/ProductForm';
import Link from 'next/link';

interface ProductClientPageProps {
  initialProducts: Product[];
  storeId: string;
}

export default function ProductClientPage({ initialProducts, storeId }: ProductClientPageProps) {
  const dispatch = useAppDispatch();
  const { products, loading, error } = useAppSelector((state) => state.products);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Initialize Redux state with initialProducts fetched from server
  useEffect(() => {
    dispatch(fetchProducts(storeId));
  }, [dispatch, storeId]);

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المنتج "${productName}"؟`)) {
      toast.loading('جاري الحذف...', { id: 'delete-product-toast' });
      try {
        await dispatch(deleteProduct(productId)).unwrap();
        toast.dismiss('delete-product-toast');
        toast.success('تم حذف المنتج بنجاح');
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.dismiss('delete-product-toast');
        toast.error(`فشل الحذف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      }
    }
  };

  // Function to upload images to the API route
  const uploadProductImages = async (productId: string, images: ImageUploadData[]) => {
    if (images.length === 0) return;

    const formData = new FormData();
    const altTextsAr: { [key: number]: string } = {};
    const altTextsEn: { [key: number]: string } = {};
    const isPrimaryFlags: { [key: number]: boolean } = {};

    images.forEach((image, index) => {
      if (image.file) {
        formData.append('files', image.file);
        altTextsAr[index] = image.alt_text_ar || '';
        altTextsEn[index] = image.alt_text_en || '';
        isPrimaryFlags[index] = image.is_primary;
      }
    });

    if (Object.keys(altTextsAr).length > 0) {
      formData.append('altTextsAr', JSON.stringify(altTextsAr));
      formData.append('altTextsEn', JSON.stringify(altTextsEn));
      formData.append('isPrimaryFlags', JSON.stringify(isPrimaryFlags));
    }

    try {
      const response = await fetch(`/api/product-media/${productId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload images');
      }
      toast.success('تم تحميل الصور بنجاح.');
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(`فشل تحميل الصور: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  };

  const handleFormSubmit = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'average_rating' | 'ratings_count'>, imagesToUpload: ImageUploadData[]) => {
    toast.loading('جاري الحفظ...', { id: 'save-product-toast' });
    try {
      const savedProduct: Product = await dispatch(updateExistingProduct({ ...editingProduct!, ...productData })).unwrap();
        toast.success('تم تحديث المنتج بنجاح');

      // If there are images to upload, call the upload function
      if (imagesToUpload.length > 0 && savedProduct.id) {
        await uploadProductImages(savedProduct.id, imagesToUpload);
      }

      toast.dismiss('save-product-toast');
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.dismiss('save-product-toast');
      toast.error(`فشل الحفظ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  };

  const handleCloseFormDialog = () => {
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(product =>
    product.name_ar.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center h-64"><Spinner size="large" /></div>;
    }

    if (error) {
      return <div className="text-red-500 text-center p-4">حدث خطأ: {error}</div>;
    }

    if (filteredProducts.length === 0) {
      return <div className="text-center p-4">لا توجد منتجات.</div>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الاسم</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>السعر</TableHead>
            <TableHead>الكمية</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProducts.map((product: Product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name_ar}</TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell>{product.cost_price?.toString() || 'N/A'}</TableCell>
              <TableCell>{product.stock_quantity || 0}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${product.is_active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                  {product.is_active ? 'نشط' : 'غير نشط'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                    تعديل
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id, product.name_ar)}>
                    حذف
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <DashboardLayout title="منتجات المتجر">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">المنتجات</h1>
          <p className="text-muted-foreground">
            إدارة منتجات متجرك.
          </p>
        </div>
        <Link href={`/store-management/stores/${storeId}/products/new`}>
          <Button>
          إضافة منتج جديد
        </Button>
        </Link>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="ابحث عن منتج..."
            className="pl-8 sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg">
        {renderContent()}
      </div>

      {editingProduct && (
      <CustomDialog
          isOpen={!!editingProduct}
        onClose={handleCloseFormDialog}
          title="تعديل المنتج"
          description="عدّل تفاصيل المنتج من هنا."
      >
        <ProductForm
          initialData={editingProduct}
            shopId={storeId}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseFormDialog}
        />
      </CustomDialog>
      )}
    </DashboardLayout>
  );
} 