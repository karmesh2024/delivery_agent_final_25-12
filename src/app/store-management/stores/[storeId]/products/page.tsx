'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { fetchProducts, addNewProduct, updateExistingProduct, deleteProduct } from '@/domains/products/store/productSlice';
import { Product } from '@/domains/products/types/types';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

export default function StoreProductsPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { products, loading, error } = useSelector((state: RootState) => state.products);

  const [storeName, setStoreName] = useState<string | null>(null);

  useEffect(() => {
    if (storeId) {
      dispatch(fetchProducts(storeId));

      const fetchStoreName = async () => {
        try {
          const response = await fetch(`/api/stores/${storeId}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setStoreName(data.name_ar || data.name_en || 'المتجر غير معروف'); // Use Arabic name, then English, then fallback
        } catch (err) {
          console.error('Failed to fetch store name:', err);
          setStoreName('المتجر غير معروف');
        }
      };
      fetchStoreName();
    }
  }, [dispatch, storeId]);

  const handleAddProductClick = () => {
    router.push(`/store-management/stores/${storeId}/products/new`);
  };

  const handleEditProductClick = (product: Product) => {
    router.push(`/store-management/stores/${storeId}/products/${product.id}`);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('هل أنت متأكد أنك تريد حذف هذا المنتج؟')) {
      await dispatch(deleteProduct(productId));
      dispatch(fetchProducts(storeId)); // Refresh list after deletion
    }
  };

  if (loading) {
    return <p>جاري تحميل المنتجات...</p>;
  }

  if (error) {
    return <p className="text-red-500">حدث خطأ: {error}</p>;
  }

  return (
    <div className="container mx-auto py-10">
      <Link href="/store-management/stores" className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-800">
        <FaArrowLeft className="mr-2" /> العودة إلى المتاجر
      </Link>
      <h1 className="text-3xl font-bold mb-6">المنتجات للمتجر: {storeName || storeId}</h1>

      <div className="flex justify-end mb-4">
        <Button onClick={handleAddProductClick}>إضافة منتج جديد</Button>
      </div>

      {products.length === 0 ? (
        <p>لا توجد منتجات لعرضها في هذا المتجر.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم (عربي)</TableHead>
                <TableHead>الاسم (انجليزي)</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>سعر التكلفة</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name_ar}</TableCell>
                  <TableCell>{product.name_en}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.cost_price?.toString()}</TableCell>
                  <TableCell>{product.stock_quantity}</TableCell>
                  <TableCell>{product.is_active ? 'مفعل' : 'معطل'}</TableCell>
                  <TableCell className="text-right flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditProductClick(product)}>
                      تعديل
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                      حذف
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
} 