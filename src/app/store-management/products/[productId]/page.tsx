"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import Link from "next/link";
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Product } from '@/domains/products/types/types';
import { Spinner } from '@/shared/components/ui/spinner';

// سعر صرف افتراضي: 1 ريال سعودي = 8.2 جنيه مصري
// const SAR_TO_EGP_RATE = 8.2;

const ProductDetailsPage: React.FC = () => {
  const params = useParams();
  const { productId } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{ image_url: string; media_type?: string | null } | null>(null);

  useEffect(() => {
    const getProductDetails = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Product = await response.json();
        setProduct(data);
        if (data && data.store_product_images && data.store_product_images.length > 0) {
          const primaryMedia = data.store_product_images.find(img => img.is_primary);
          setSelectedMedia(primaryMedia || data.store_product_images[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'فشل في جلب تفاصيل المنتج');
      } finally {
        setLoading(false);
      }
    };

    getProductDetails();
  }, [productId]);

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

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-500">المنتج غير موجود.</p>
      </div>
    );
  }

  // const priceInSAR = product.store_product_prices && product.store_product_prices.length > 0
  //   ? parseFloat(product.store_product_prices[0].price.toString())
  //   : parseFloat(product.default_selling_price?.toString() || '0');
  // const priceInEGP = (priceInSAR * SAR_TO_EGP_RATE).toFixed(2);

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <Button asChild className="mb-6">
        <Link href="/store-management/products">العودة إلى المنتجات</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold mb-2">{product.name_ar}</CardTitle>
          <CardDescription className="text-lg text-gray-700">{product.description_ar || 'لا يوجد وصف.'}</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="relative w-full h-80 rounded-lg overflow-hidden shadow-md mb-4">
              {selectedMedia && (selectedMedia.media_type === 'video' ? (
                <video
                  src={selectedMedia.image_url}
                  controls
                  className="w-full h-full object-contain rounded-lg"
                  autoPlay
                  loop
                  muted
                />
              ) : (
                <Image
                  src={selectedMedia.image_url || '/images/product_placeholder.png'}
                  alt={product.name_ar}
                  fill
                  priority
                  sizes="(min-width: 768px) 35vw, 80vw"
                  className="object-contain rounded-lg"
                />
              ))}
            </div>
            {product.store_product_images && product.store_product_images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto p-2 border rounded-lg">
                {product.store_product_images.map((media, index) => (
                  <div
                    key={index}
                    className={`relative w-20 h-20 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 ${selectedMedia?.image_url === media.image_url ? 'border-primary' : 'border-transparent'}`}
                    onClick={() => setSelectedMedia(media)}
                  >
                    {media.media_type === 'video' ? (
                      <video
                        src={media.image_url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={media.image_url}
                        alt={media.alt_text_ar || `Media ${index + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="text-2xl font-bold text-primary">
              {product.store_product_prices && product.store_product_prices.length > 0
                ? `${product.store_product_prices[0].price.toString()} جنيه مصري`
                : `${product.default_selling_price?.toString() || 'N/A'} جنيه مصري`}
            </div>
            {product.dynamic_attributes && Object.keys(product.dynamic_attributes).length > 0 && (
              <>
                <h3 className="text-xl font-semibold mt-4">تفاصيل إضافية:</h3>
                <ul className="list-disc list-inside space-y-2">
                  {Object.entries(product.dynamic_attributes).map(([key, value], index) => (
                    <li key={index} className="text-gray-700">
                      <span className="font-semibold">{key}:</span> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <Button className="mt-6 w-full md:w-auto">إضافة إلى السلة</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductDetailsPage; 