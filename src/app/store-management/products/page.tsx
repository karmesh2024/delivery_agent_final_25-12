"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import Link from "next/link";
import Image from 'next/image';
import { Input } from "@/shared/components/ui/input";
import { SearchIcon } from 'lucide-react';
import { Product } from '@/domains/products/types/types';
import { Spinner } from '@/shared/components/ui/spinner';

// سعر صرف افتراضي: 1 ريال سعودي = 8.2 جنيه مصري
// const SAR_TO_EGP_RATE = 8.2; // تم التعليق عليه لأن التحويل غير مطلوب

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const getProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Product[] = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'فشل في جلب المنتجات');
      } finally {
        setLoading(false);
      }
    };

    getProducts();
  }, []);

  const filteredProducts = products.filter(product =>
    product.name_ar.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="large" />
      </div>
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
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">عرض المنتجات</h1>
        <div className="relative w-full md:w-1/3">
          <Input
            type="text"
            placeholder="ابحث عن منتج..."
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">لا توجد منتجات متاحة حالياً.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            return (
              <Card key={product.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Link href={`/store-management/products/${product.id}`}>
                  {product.store_product_images && product.store_product_images.length > 0 ? (
                    product.store_product_images[0].media_type === 'video' ? (
                      <video
                        src={product.store_product_images[0].image_url}
                        className="w-full h-48 object-cover"
                        controls
                        loop
                        muted
                      />
                    ) : (
                      <img
                        src={product.store_product_images[0].image_url}
                        alt={product.name_ar || 'Product Image'}
                        className="w-full h-48 object-cover"
                      />
                    )
                  ) : product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name_ar || 'Product Image'}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                      لا توجد صورة
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      {product.name_ar || 'N/A'}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 line-clamp-2">
                      {product.description_ar || 'N/A'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between pb-4">
                    <span className="text-xl font-bold text-primary">
                      {product.store_product_prices && product.store_product_prices.length > 0
                        ? `${typeof product.store_product_prices[0].price === 'object' ? JSON.stringify(product.store_product_prices[0].price) : product.store_product_prices[0].price} جنيه مصري`
                        : `${product.default_selling_price != null ? (typeof product.default_selling_price === 'object' ? (product.default_selling_price as any).d?.[0] || JSON.stringify(product.default_selling_price) : product.default_selling_price) : 'N/A'} جنيه مصري`}
                    </span>
                    <Button variant="outline" size="sm">عرض التفاصيل</Button>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductsPage; 