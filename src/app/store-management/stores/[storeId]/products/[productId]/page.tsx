"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Product, ImageUploadData, ProductType, ProductPriceData, ProductPriceFormData, TargetAudience, MainCategory, SubCategory, CommonProductFormData } from '@/domains/products/types/types';
import { Prisma } from '@prisma/client';
import BasicInfoForm from '@/domains/products/components/BasicInfoForm';
import DetailedDataForm from '@/domains/products/components/DetailedDataForm';
import MediaUploadForm from '@/domains/products/components/MediaUploadForm';
import PricingForm from '@/domains/products/components/PricingForm';
import InventoryForm from '@/domains/products/components/InventoryForm';
import { toast } from '@/shared/ui/use-toast';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import { uploadFile, getPublicImageUrl, supabase } from '@/lib/supabase'; // Import supabase client and upload functions

// Define the structure of the image object as it comes directly from the backend API
interface BackendProductImageRaw {
  id: string;
  product_id: string;
  image_url: string; // This is the key from the database/backend
  alt_text_ar: string;
  alt_text_en: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: Date; // Assuming Date object after JSON parsing
}

// Define a type that extends Product to include related entities returned by the API
interface ProductDetailResponse extends Product {
  prices?: ProductPriceData[];
  images?: BackendProductImageRaw[]; // This now accurately reflects the backend response
}

// Define a common base structure for product data when editing for the form state
type EditProductFormData = CommonProductFormData & { id: string; };

export default function EditProductPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const productId = params.productId as string; // Get product ID from URL
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('basic-info');
  const [currentPricingTab, setCurrentPricingTab] = useState('pricing');
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [targetAudiences, setTargetAudiences] = useState<TargetAudience[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [storeBrands, setStoreBrands] = useState<{ id: string; name_ar: string; name_en?: string | null }[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [errorLoadingProduct, setErrorLoadingProduct] = useState<string | null>(null);

  const [formData, setFormData] = useState<EditProductFormData>({
    id: productId, // Set product ID
    shop_id: storeId,
    main_category_id: '',
    name_ar: '',
    sku: '',
    is_active: true,
    is_featured: false,
    subcategory_id: null,
    brand_id: null,
    name_en: null,
    description_ar: null,
    description_en: null,
    short_description_ar: null,
    short_description_en: null,
    barcode: null,
    cost_price: null,
    stock_quantity: null,
    min_stock_level: null,
    weight: null,
    dimensions: null,
    loyalty_points_earned: null,
    gift_description_ar: null,
    gift_description_en: null,
    meta_title_ar: null,
    meta_title_en: null,
    meta_description_ar: null,
    meta_description_en: null,
    tags: null,
    product_type_id: null,
    dynamic_attributes: null,
    default_selling_price: null,
    default_profit_margin: null,
    auto_calculate_prices: true,
    measurement_unit: 'piece',
    prices: [],
    images: [],
  });

  // Fetch product data on component mount
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const response = await fetch(`/api/stores/${storeId}/products/${productId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ProductDetailResponse = await response.json(); // Use ProductDetailResponse

        // Convert Prisma.JsonValue to string[] for tags if it's not already
        const tagsArray = Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === 'string') : [];

        setFormData({
          ...data,
          id: data.id, // Ensure ID is explicitly included
          main_category_id: data.main_category_id || null,
          product_type_id: data.product_type_id || null,
          dynamic_attributes: (data.dynamic_attributes || null) as Prisma.JsonObject | null,
          tags: tagsArray,
          prices: (data.prices || []).map(price => ({
            ...price,
            effective_from: price.effective_from ? new Date(price.effective_from) : undefined,
            effective_to: price.effective_to ? new Date(price.effective_to) : undefined,
          })) as ProductPriceFormData[],
          images: (data.images || []).map((img: BackendProductImageRaw) => ({
            id: img.id,
            url: img.image_url, // Use image_url from backend
            alt_text_ar: img.alt_text_ar,
            alt_text_en: img.alt_text_en,
            is_primary: img.is_primary,
            type: img.image_url && (img.image_url.endsWith('.mp4') || img.image_url.endsWith('.mov')) ? 'video' : 'image', // Dynamically determine type based on extension
          })) as ImageUploadData[],
        });
      } catch (error) {
        console.error("Failed to fetch product data:", error);
        setErrorLoadingProduct("فشل تحميل بيانات المنتج.");
        toast({
          title: "خطأ",
          description: "فشل تحميل بيانات المنتج.",
          variant: "destructive",
        });
      } finally {
        setLoadingProduct(false);
      }
    };

    if (productId) {
      fetchProductData();
    }
  }, [productId, storeId]);

  // Existing fetches for product types, target audiences, main categories, store name
  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        const response = await fetch('/api/product-types');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProductTypes(data);
      } catch (error) {
        console.error("Failed to fetch product types:", error);
        toast({
          title: "خطأ",
          description: "فشل جلب أنواع المنتجات.",
          variant: "destructive",
        });
      }
    };

    const fetchTargetAudiences = async () => {
      try {
        const response = await fetch(`/api/target-audiences?shop_id=${storeId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTargetAudiences(data);
      } catch (error) {
        console.error("Failed to fetch target audiences:", error);
        toast({
          title: "خطأ",
          description: "فشل جلب الجماهير المستهدفة.",
          variant: "destructive",
        });
      }
    };

    const fetchStoreName = async () => {
      try {
        const response = await fetch(`/api/stores/${storeId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setStoreName(data.name_ar || data.name_en || 'المتجر غير معروف');
      } catch (err) {
        console.error('Failed to fetch store name:', err);
        setStoreName('المتجر غير معروف');
      }
    };

    const fetchMainCategories = async () => {
      try {
        const response = await fetch('/api/main-categories');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMainCategories(data);
      } catch (error) {
        console.error("Failed to fetch main categories:", error);
        toast({
          title: "خطأ",
          description: "فشل جلب الفئات الرئيسية.",
          variant: "destructive",
        });
      }
    };

    const fetchStoreBrands = async () => {
      try {
        const response = await fetch(`/api/brands?shop_id=${storeId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setStoreBrands(data || []);
      } catch (error) {
        console.error('Failed to fetch store brands:', error);
      }
    };

    fetchProductTypes();
    fetchTargetAudiences();
    fetchStoreName();
    fetchMainCategories();
    fetchStoreBrands();
  }, [storeId]);

  useEffect(() => {
    if (formData.main_category_id) {
      const fetchSubCategories = async () => {
        try {
          const response = await fetch(`/api/subcategories?main_category_id=${formData.main_category_id}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setSubCategories(data);
        } catch (error) {
          console.error("Failed to fetch subcategories:", error);
          toast({
            title: "خطأ",
            description: "فشل جلب الفئات الفرعية.",
            variant: "destructive",
          });
        }
      };
      fetchSubCategories();
    } else {
      setSubCategories([]);
    }
  }, [formData.main_category_id]);

  const handleFormChange = useCallback(
    <K extends keyof CommonProductFormData>(field: K, value: CommonProductFormData[K]) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const handleDynamicAttributesChange = useCallback((attributes: Prisma.JsonObject) => {
    setFormData((prev) => ({
      ...prev,
      dynamic_attributes: attributes,
    }));
  }, []);

  const handleImagesChange = useCallback((imagesData: ImageUploadData[]) => {
    setFormData((prev) => ({
      ...prev,
      images: imagesData,
    }));
  }, []);

  const handlePricesChange = useCallback((pricesData: ProductPriceFormData[]) => {
    setFormData((prev) => ({
      ...prev,
      prices: pricesData,
    }));
  }, []);

  const handleNextTab = () => {
    const tabs = ['basic-info', 'detailed-data', 'media', 'pricing'];
    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex < tabs.length - 1) {
      setCurrentTab(tabs[currentIndex + 1]);
    }
  };

  const handlePreviousTab = () => {
    const tabs = ['basic-info', 'detailed-data', 'media', 'pricing'];
    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex > 0) {
      setCurrentTab(tabs[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    console.log('Product Data to submit for update:', formData);
    try {
      const imagesToUpload = formData.images.filter(img => img.file);
      const existingImages = formData.images.filter(img => !img.file);

      const uploadedImagePromises = imagesToUpload.map(async (img) => {
        if (img.file) {
          const bucketName = 'product-images'; // Corrected bucket name to match Supabase
          const folderPath = `products/${storeId}/${productId}`;
          // Sanitize filename to remove problematic characters, especially Arabic ones
          const sanitizedFileName = img.file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
          const fileName = `${Date.now()}-${sanitizedFileName}`;

          const { path, error: uploadError } = await uploadFile(bucketName, img.file, folderPath, fileName);

          if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            // Do not throw here, just return null so it can be filtered out
            return null; // Return null on upload error
          }

          if (path) {
            const publicUrl = getPublicImageUrl(bucketName, path);
            if (publicUrl) {
              return {
                id: img.id, // Keep the existing temp ID or generate new if needed
                image_url: publicUrl, // Use the public URL from Supabase
                alt_text_ar: img.alt_text_ar,
                alt_text_en: img.alt_text_en,
                is_primary: img.is_primary,
                type: img.type, // 'image' or 'video'
              };
            }
          }
        }
        return null; // Return null if file is missing or publicUrl not obtained
      });

      const uploadedImages = await Promise.all(uploadedImagePromises);

      // Filter out any nulls if an upload failed and ensure image_url is present
      const successfulUploadedImages = uploadedImages.filter(
        (img): img is ImageUploadData & { id: string | undefined; image_url: string } =>
          img !== null && typeof img.image_url === 'string' && img.image_url !== ''
      );

      // Combine existing images with newly uploaded images
      const finalImages = [...existingImages.map(img => ({
        id: img.id,
        image_url: img.image_url || img.url, // Ensure image_url is prioritized, fallback to url if needed for existing
        alt_text_ar: img.alt_text_ar,
        alt_text_en: img.alt_text_en,
        is_primary: img.is_primary,
        type: img.type,
      })), ...successfulUploadedImages];

      // Prepare product data for submission
      const productDataToSubmit = {
        ...formData,
        images: finalImages, // Send the updated image data with public URLs
      };

      const productResponse = await fetch(`/api/stores/${storeId}/products/${productId}`, {
        method: 'PUT', // Use PUT for updates
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productDataToSubmit), // Send the updated product data
      });

      if (!productResponse.ok) {
        const errorData = await productResponse.json();
        throw new Error(errorData.message || 'Failed to update product');
      }

      toast({
        title: "نجاح",
        description: "تم تحديث المنتج بنجاح.",
      });
      router.push(`/store-management/stores/${storeId}/products`);
    } catch (error: unknown) {
      console.error("Failed to update product:", error);
      toast({
        title: "خطأ",
        description: `فشل تحديث المنتج: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  if (loadingProduct) {
    return <p className="text-center text-lg mt-8">جاري تحميل بيانات المنتج...</p>;
  }

  if (errorLoadingProduct) {
    return <p className="text-center text-red-500 text-lg mt-8">{errorLoadingProduct}</p>;
  }

  return (
    <div className="container mx-auto py-10">
      <Link href={`/store-management/stores/${storeId}/products`} className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-800">
        <FaArrowLeft className="mr-2" /> العودة إلى منتجات المتجر {storeName}
      </Link>
      <h1 className="text-3xl font-bold mb-6">تعديل المنتج: {formData.name_ar || formData.name_en || formData.sku}</h1>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic-info">المعلومات الأساسية</TabsTrigger>
          <TabsTrigger value="detailed-data">البيانات التفصيلية</TabsTrigger>
          <TabsTrigger value="media">الصور والفيديوهات</TabsTrigger>
          <TabsTrigger value="pricing">التسعير والمخزون</TabsTrigger>
        </TabsList>
        <TabsContent value="basic-info">
          <BasicInfoForm
            formData={formData}
            onFormChange={handleFormChange}
            productTypes={productTypes}
            mainCategories={mainCategories}
            subCategories={subCategories}
            storeBrands={storeBrands}
            targetAudiences={targetAudiences}
            isEditing={true} // Indicate editing mode
          />
        </TabsContent>
        <TabsContent value="detailed-data">
          <DetailedDataForm
            formData={formData}
            onFormChange={handleFormChange}
            onDynamicAttributesChange={handleDynamicAttributesChange}
            productTypes={productTypes}
            isEditing={true}
          />
        </TabsContent>
        <TabsContent value="media">
          <MediaUploadForm
            formData={formData}
            onImagesChange={handleImagesChange}
            isEditing={true}
          />
        </TabsContent>
        <TabsContent value="pricing">
          <Tabs value={currentPricingTab} onValueChange={setCurrentPricingTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pricing">التسعير والجمهور</TabsTrigger>
              <TabsTrigger value="inventory">المخزون</TabsTrigger>
            </TabsList>

            <TabsContent value="pricing" className="mt-4">
              <PricingForm
                formData={formData}
                onFormChange={handleFormChange}
                onPricesChange={handlePricesChange}
                targetAudiences={targetAudiences}
                isEditing={true}
              />
            </TabsContent>

            <TabsContent value="inventory" className="mt-4">
              <InventoryForm
                formData={formData}
                onFormChange={handleFormChange}
                isEditing={true}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end space-x-2">
        {currentTab !== 'basic-info' && (
          <Button variant="outline" onClick={handlePreviousTab}>
            السابق
          </Button>
        )}
        {currentTab !== 'pricing' && (
          <Button onClick={handleNextTab}>
            التالي
          </Button>
        )}
        {currentTab === 'pricing' && (
          <Button onClick={handleSubmit}>
            تعديل المنتج
          </Button>
        )}
      </div>
    </div>
  );
}