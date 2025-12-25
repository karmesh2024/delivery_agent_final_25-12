"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Product, ImageUploadData, ProductType, ProductPriceFormData, TargetAudience, MainCategory, SubCategory, CommonProductFormData } from '@/domains/products/types/types';
import { Prisma } from '@prisma/client';
import BasicInfoForm from '@/domains/products/components/BasicInfoForm';
import DetailedDataForm from '@/domains/products/components/DetailedDataForm';
import MediaUploadForm from '@/domains/products/components/MediaUploadForm';
import PricingForm from '@/domains/products/components/PricingForm';
import InventoryForm from '@/domains/products/components/InventoryForm';
import { toast } from '@/shared/ui/use-toast';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import { productCatalogService } from '@/services/productCatalogService';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Label } from '@/shared/components/ui/label';

const NewProductPage = () => {
  const params = useParams();
  const storeId = params.storeId as string;
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('basic-info');
  const [currentPricingTab, setCurrentPricingTab] = useState('pricing');
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [targetAudiences, setTargetAudiences] = useState<TargetAudience[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [storeBrands, setStoreBrands] = useState<{ id: string; name_ar: string; name_en?: string | null; description_ar?: string | null }[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [selectedCatalogProductId, setSelectedCatalogProductId] = useState<string>('');

  const [formData, setFormData] = useState<CommonProductFormData>({
    shop_id: storeId,
    main_category_id: '',
    name_ar: '',
    sku: '',
    is_active: true,
    is_featured: false,
    // Initialize other nullable fields to null or appropriate defaults
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

  const findCatalogProduct = useCallback(
    (catalogProductId?: string) => {
      const targetId = catalogProductId || selectedCatalogProductId;
      if (!targetId) return null;
      return catalogProducts.find((p) => String(p.id) === String(targetId)) || null;
    },
    [catalogProducts, selectedCatalogProductId],
  );

const findMatchingMainCategory = useCallback(
    (catalogProductId?: string) => {
      const catalogProduct = findCatalogProduct(catalogProductId);
      if (!catalogProduct) return null;

      let matchingCategory =
        mainCategories.find(
          (cat: any) =>
            cat.catalog_category_id && String(cat.catalog_category_id) === String(catalogProduct.main_category_id),
        ) || null;

      if (!matchingCategory) {
        matchingCategory =
          mainCategories.find(
            (cat: any) =>
              catalogProduct.name &&
              typeof cat.name_ar === 'string' &&
              (cat.name_ar.toLowerCase().includes(catalogProduct.name.toLowerCase()) ||
                catalogProduct.name.toLowerCase().includes(cat.name_ar.toLowerCase())),
          ) || null;
      }

      return matchingCategory || null;
    },
    [findCatalogProduct, mainCategories],
  );

  const findMatchingBrandId = useCallback(
    (catalogProduct: any) => {
      if (!catalogProduct) return null;
      const catalogBrandId = catalogProduct.brand_id || catalogProduct.store_brand_id;
      if (catalogBrandId) {
        const exactBrand = storeBrands.find(
          (brand) => brand.id === String(catalogBrandId) || brand.id === catalogBrandId,
        );
        if (exactBrand) {
          return exactBrand.id;
        }
      }

      const brandName =
        (typeof catalogProduct.brand === 'string' && catalogProduct.brand) ||
        catalogProduct.brand_name_ar ||
        catalogProduct.brand_name_en ||
        '';

      if (!brandName) {
        return null;
      }

      const normalizedName = brandName.trim().toLowerCase();
      const matchingBrand = storeBrands.find((brand) => {
        const arabicMatch = brand.name_ar?.trim().toLowerCase() === normalizedName;
        const englishMatch = brand.name_en?.trim().toLowerCase() === normalizedName;
        return arabicMatch || englishMatch;
      });

      return matchingBrand?.id || null;
    },
    [storeBrands],
  );

  const ensureStoreBrandForCatalogProduct = useCallback(
    async (catalogProduct: any) => {
      if (!catalogProduct) return null;
      const existingId = findMatchingBrandId(catalogProduct);
      if (existingId) {
        return existingId;
      }

      const brandNameAr =
        (typeof catalogProduct.brand === 'string' && catalogProduct.brand) ||
        catalogProduct.brand_name_ar ||
        catalogProduct.brand_name_en ||
        '';

      if (!brandNameAr) {
        return null;
      }

      try {
        const response = await fetch('/api/brands', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shop_id: storeId,
            name_ar: brandNameAr,
            name_en: catalogProduct.brand_name_en || brandNameAr,
            description_ar: catalogProduct.brand_description || catalogProduct.description || null,
            description_en: catalogProduct.brand_description || null,
          }),
        });

        if (!response.ok) {
          console.error('Failed to create store brand from catalog', await response.text());
          return null;
        }

        const newBrand = await response.json();
        setStoreBrands((prev) => [...prev, newBrand]);
        return newBrand.id;
      } catch (error) {
        console.error('Error ensuring store brand:', error);
        return null;
      }
    },
    [findMatchingBrandId, storeId],
  );

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
        const response = await fetch(`/api/target-audiences?shop_id=${storeId}`); // Assuming this API exists
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
        setStoreName(data.name_ar || data.name_en || 'المتجر غير معروف'); // Use Arabic name, then English, then fallback
      } catch (err) {
        console.error('Failed to fetch store name:', err);
        setStoreName('المتجر غير معروف');
      }
    };

    const fetchMainCategories = async () => {
      try {
        const response = await fetch(`/api/main-categories?shop_id=${storeId}`);
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
    
    // جلب منتجات الكتالوج
    const fetchCatalogProducts = async () => {
      try {
        const products = await productCatalogService.getProducts();
        setCatalogProducts(products || []);
      } catch (error) {
        console.error("Failed to fetch catalog products:", error);
      }
    };
    fetchCatalogProducts();
  }, [storeId]);

  useEffect(() => {
    if (!formData.main_category_id && selectedCatalogProductId) {
      const matchingCategory = findMatchingMainCategory(selectedCatalogProductId);
      if (matchingCategory) {
        setFormData((prev) => ({
          ...prev,
          main_category_id: matchingCategory.id,
        }));
      }
    }
  }, [formData.main_category_id, selectedCatalogProductId, findMatchingMainCategory]);

  useEffect(() => {
    if (formData.main_category_id) {
      const fetchSubCategories = async () => {
        try {
          const response = await fetch(`/api/subcategories?main_category_id=${formData.main_category_id}&shop_id=${storeId}`);
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
      setSubCategories([]); // Clear subcategories if no main category is selected
    }
  }, [formData.main_category_id, storeId]);

  const handleFormChange = useCallback(
    <K extends keyof CommonProductFormData>(field: K, value: CommonProductFormData[K]) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  // دالة لاختيار المنتج من الكتالوج وتعبئة البيانات تلقائياً
  const handleCatalogProductSelect = useCallback(
    async (catalogProductId: string, options?: { silent?: boolean }) => {
      setSelectedCatalogProductId(catalogProductId);
      const catalogProduct = catalogProducts.find((p) => String(p.id) === catalogProductId);

      if (catalogProduct) {
        const matchedBrandId = await ensureStoreBrandForCatalogProduct(catalogProduct);
        const resolvedBarcode =
          catalogProduct.barcode ||
          catalogProduct.product_code ||
          catalogProduct.qr_code ||
          null;

        setFormData((prev) => ({
          ...prev,
          name_ar: catalogProduct.name || prev.name_ar,
          sku: catalogProduct.sku || prev.sku,
          description_ar: catalogProduct.description || prev.description_ar,
          weight: catalogProduct.weight ? Number(catalogProduct.weight) : prev.weight,
          barcode: resolvedBarcode || prev.barcode,
          brand_id: matchedBrandId || prev.brand_id,
        }));

        if (catalogProduct.images && Array.isArray(catalogProduct.images) && catalogProduct.images.length > 0) {
          const catalogImages = catalogProduct.images.map((img: string, index: number) => ({
            url: img,
            image_url: img,
            alt_text_ar: catalogProduct.name || '',
            alt_text_en: catalogProduct.name || null,
            is_primary: index === 0,
            type: 'image' as const,
          }));

          setFormData((prev) => ({
            ...prev,
            images: catalogImages,
          }));

          if (!options?.silent) {
            toast({
              title: 'تم نسخ الصور',
              description: `تم نسخ ${catalogImages.length} صورة أساسية من الكتالوج. يمكنك إضافة صور دعائية إضافية لاحقاً.`,
            });
          }
        }

        const matchingCategory = findMatchingMainCategory(catalogProductId);

        if (matchingCategory) {
          setFormData((prev) => ({
            ...prev,
            main_category_id: matchingCategory.id,
          }));

          if (!options?.silent) {
            toast({
              title: 'تم اقتراح الفئة',
              description: `تم اختيار فئة المتجر: ${matchingCategory.name_ar}`,
            });
          }
        }

        if (!options?.silent) {
          toast({
            title: 'تم التعبئة',
            description: `تم تعبئة المعلومات الأساسية من الكتالوج: ${catalogProduct.name}`,
          });
        }
      }
    },
    [catalogProducts, findMatchingMainCategory, ensureStoreBrandForCatalogProduct],
  );

  const handleCatalogSelectFromDropdown = useCallback(
    (catalogProductId: string) => {
      handleCatalogProductSelect(catalogProductId);
    },
    [handleCatalogProductSelect],
  );

  const handleInventoryCatalogDetection = useCallback(
    (catalogProductId: string) => {
      handleCatalogProductSelect(catalogProductId, { silent: true });
    },
    [handleCatalogProductSelect],
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
    console.log('Product Data to submit:', formData);
    
    let catalogProductId = selectedCatalogProductId;

    if (!catalogProductId) {
      const matchedBySku = catalogProducts.find(
        (product) => product.sku && formData.sku && product.sku.toLowerCase() === formData.sku.toLowerCase(),
      );
      if (matchedBySku) {
        catalogProductId = String(matchedBySku.id);
        setSelectedCatalogProductId(catalogProductId);
      }
    }
    
    // التحقق من اختيار منتج من الكتالوج
    if (!catalogProductId) {
      toast({
        title: "خطأ",
        description: "يجب اختيار منتج من كتالوج المخازن أولاً",
        variant: "destructive",
      });
      return;
    }
    
    let ensuredMainCategoryId = formData.main_category_id?.trim() || '';
    if (!ensuredMainCategoryId) {
      const matchingCategory = findMatchingMainCategory(catalogProductId);
      if (matchingCategory) {
        ensuredMainCategoryId = matchingCategory.id;
        setFormData((prev) => ({
          ...prev,
          main_category_id: matchingCategory.id,
        }));
      }
    }

    if (!ensuredMainCategoryId && mainCategories.length > 0) {
      const fallbackCategory = mainCategories[0];
      ensuredMainCategoryId = fallbackCategory.id;
      setFormData((prev) => ({
        ...prev,
        main_category_id: fallbackCategory.id,
      }));
      toast({
        title: "تم اختيار فئة افتراضية",
        description: `لم يتم العثور على فئة مطابقة، تم اختيار الفئة: ${fallbackCategory.name_ar}`,
      });
    }

    // التحقق من وجود main_category_id
    if (!ensuredMainCategoryId) {
      toast({
        title: "خطأ",
        description: "يجب اختيار فئة رئيسية للمنتج. يرجى اختيار فئة من القائمة.",
        variant: "destructive",
      });
      setCurrentTab('basic-info');
      return;
    }
    
    try {
      const productPayload = { 
        ...formData,
        main_category_id: ensuredMainCategoryId,
        catalog_product_id: catalogProductId || null, // ربط المنتج بالكتالوج (يتم تحويله إلى BigInt في service)
        // لا نضيف timestamp للـ SKU لأن SKU يأتي من الكتالوج
      };

      // Separate images and prices from product data for initial product creation
      const { images, prices, ...finalProductPayload } = productPayload;
      const imagesWithFiles = images.filter((img) => img.file);
      const catalogImages = images.filter(
        (img) => !img.file && (img.image_url || img.url),
      );

      const productResponse = await fetch(`/api/stores/${storeId}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalProductPayload),
      });

      if (!productResponse.ok) {
        const errorData = await productResponse.json();
        throw new Error(errorData.message || 'Failed to create product');
      }

      const createdProduct: Product = await productResponse.json();
      const productId = createdProduct.id;

      // Handle images upload
      if (imagesWithFiles.length > 0) {
        const imageUploadPromises = imagesWithFiles.map(async (imageData) => {
            const imageFormData = new FormData();
          imageFormData.append('file', imageData.file as File);
            imageFormData.append('alt_text_ar', imageData.alt_text_ar);
            if (imageData.alt_text_en) {
              imageFormData.append('alt_text_en', imageData.alt_text_en);
            }
            imageFormData.append('is_primary', String(imageData.is_primary));
            imageFormData.append('product_id', productId);
            imageFormData.append('type', imageData.type);

            const imageResponse = await fetch(`/api/product-assets/${productId}/images`, {
              method: 'POST',
              body: imageFormData,
            });

            if (!imageResponse.ok) {
              const errorData = await imageResponse.json();
              throw new Error(errorData.message || 'Failed to upload image');
            }
            return imageResponse.json();
        });
        await Promise.all(imageUploadPromises);
      }

      if (catalogImages.length > 0) {
        const catalogImagePromises = catalogImages.map(async (imageData, index) => {
          const response = await fetch(
            `/api/stores/${storeId}/products/${productId}/images`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                image_url: imageData.image_url || imageData.url,
                alt_text_ar: imageData.alt_text_ar,
                alt_text_en: imageData.alt_text_en,
                is_primary: imageData.is_primary ?? index === 0,
                sort_order: index,
                media_type: imageData.type ?? 'image',
              }),
            },
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message || 'Failed to save catalog image',
            );
          }

          return response.json();
        });

        await Promise.all(catalogImagePromises);
      }

      // Upload prices
      for (const price of prices) {
        // Ensure price.product_id is set to the newly created productId
        price.product_id = productId;
        const priceResponse = await fetch(
          `/api/stores/${storeId}/products/${productId}/prices`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(price),
          }
        );

        if (!priceResponse.ok) {
          const errorData = await priceResponse.json();
          throw new Error(errorData.message || 'Failed to save product price');
        }
      }

      toast({
        title: "نجاح",
        description: "تم إنشاء المنتج بنجاح.",
      });
      console.log('Attempting to navigate to:', `/store-management/stores/${storeId}/products`);
      router.push(`/store-management/stores/${storeId}/products`);
      console.log('router.push executed.');
      return;
    } catch (error: unknown) {
      console.error("Error submitting product:", error);
      toast({
        title: "خطأ",
        description: `فشل إنشاء المنتج: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Link href={`/store-management/stores/${storeId}/products`} className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-800">
        <FaArrowLeft className="mr-2" /> العودة إلى المنتجات
      </Link>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
        إضافة منتج جديد للمتجر: {storeName}
      </h1>
        <Link href="/warehouse-management/catalog">
          <Button variant="outline">
            إضافة منتج جديد إلى الكتالوج
          </Button>
        </Link>
      </div>

      {/* اختيار المنتج من كتالوج المخازن */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Label className="text-sm font-semibold mb-2 block">
          اختيار المنتج من كتالوج المخازن *
        </Label>
        <p className="text-xs text-gray-600 mb-3">
          يجب اختيار المنتج من كتالوج المخازن أولاً. سيتم تعبئة المعلومات الأساسية تلقائياً.
        </p>
        <Select value={selectedCatalogProductId} onValueChange={handleCatalogSelectFromDropdown}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر منتج من كتالوج المخازن" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {catalogProducts.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">لا توجد منتجات في الكتالوج</div>
              ) : (
                catalogProducts.map((product: any) => (
                  <SelectItem key={product.id} value={String(product.id)}>
                    {product.name} - {product.sku} ({product.product_code})
                  </SelectItem>
                ))
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
        {!selectedCatalogProductId && (
          <p className="text-xs text-amber-600 mt-2">
            ⚠️ يجب اختيار منتج من الكتالوج قبل المتابعة
          </p>
        )}
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic-info">المعلومات الأساسية</TabsTrigger>
          <TabsTrigger value="detailed-data">البيانات التفصيلية</TabsTrigger>
          <TabsTrigger value="media">الصور والوسائط</TabsTrigger>
          <TabsTrigger value="pricing">التسعير والمخزون</TabsTrigger>
        </TabsList>

        <TabsContent value="basic-info" className="mt-4">
          <BasicInfoForm
            formData={formData}
            onFormChange={handleFormChange}
            mainCategories={mainCategories}
            subCategories={subCategories}
            targetAudiences={targetAudiences}
            productTypes={productTypes}
            storeBrands={storeBrands}
            isEditing={false}
          />
          <div className="flex justify-end mt-4">
            <Button onClick={handleNextTab}>التالي</Button>
          </div>
        </TabsContent>

        <TabsContent value="detailed-data" className="mt-4">
          <DetailedDataForm
            formData={formData}
            onFormChange={handleFormChange}
            productTypes={productTypes}
            onDynamicAttributesChange={handleDynamicAttributesChange}
            isEditing={false}
          />
          <div className="flex justify-between mt-4">
            <Button onClick={handlePreviousTab} variant="outline">السابق</Button>
            <Button onClick={handleNextTab}>التالي</Button>
          </div>
        </TabsContent>

        <TabsContent value="media" className="mt-4">
          <MediaUploadForm
            formData={formData}
            onImagesChange={handleImagesChange}
            isEditing={false}
          />
          <div className="flex justify-between mt-4">
            <Button onClick={handlePreviousTab} variant="outline">السابق</Button>
            <Button onClick={handleNextTab}>التالي</Button>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="mt-4">
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
                isEditing={false}
              />
            </TabsContent>

            <TabsContent value="inventory" className="mt-4">
              <InventoryForm
                formData={formData}
                onFormChange={handleFormChange}
                isEditing={false}
                onCatalogProductDetected={handleInventoryCatalogDetection}
              />
            </TabsContent>
          </Tabs>
          <div className="flex justify-end mt-4">
            <Button onClick={handleSubmit}>حفظ المنتج</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewProductPage;