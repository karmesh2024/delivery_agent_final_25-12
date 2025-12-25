import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Product, MainCategory, SubCategory, Brand } from '@/domains/products/types/types';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Prisma } from '@prisma/client';
import { ColorInput } from '@/shared/ui/color-input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { FiInfo } from 'react-icons/fi';

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'average_rating' | 'ratings_count'>) => void;
  onCancel: () => void;
  shopId: string;
}

interface Field {
  name: string;
  label_ar: string;
  label_en?: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'color';
  options?: string[];
  required?: boolean;
  is_decimal?: boolean; // For number type to specify decimal steps
}

interface SchemaTemplate {
  fields: Field[];
}

interface ProductType {
  id: string;
  name_ar: string;
  name_en: string | null;
  schema_template: SchemaTemplate;
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  shopId,
}) => {
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'average_rating' | 'ratings_count'> & { product_type_id?: string | null, dynamic_attributes?: Prisma.JsonObject | null }>({
    shop_id: shopId,
    main_category_id: initialData?.main_category_id || null,
    subcategory_id: initialData?.subcategory_id || null,
    brand_id: initialData?.brand_id || null,
    name_ar: initialData?.name_ar || '',
    name_en: initialData?.name_en || null,
    description_ar: initialData?.description_ar || null,
    description_en: initialData?.description_en || null,
    short_description_ar: initialData?.short_description_ar || null,
    short_description_en: initialData?.short_description_en || null,
    sku: initialData?.sku || '',
    barcode: initialData?.barcode || null,
    cost_price: initialData?.cost_price || null,
    stock_quantity: initialData?.stock_quantity || null,
    min_stock_level: initialData?.min_stock_level || null,
    weight: initialData?.weight || null,
    dimensions: initialData?.dimensions || null,
    loyalty_points_earned: initialData?.loyalty_points_earned || null,
    gift_description_ar: initialData?.gift_description_ar || null,
    gift_description_en: initialData?.gift_description_en || null,
    is_active: initialData?.is_active ?? true,
    is_featured: initialData?.is_featured ?? false,
    meta_title_ar: initialData?.meta_title_ar || null,
    meta_title_en: initialData?.meta_title_en || null,
    meta_description_ar: initialData?.meta_description_ar || null,
    meta_description_en: initialData?.meta_description_en || null,
    tags: initialData?.tags || null,
    product_type_id: initialData?.product_type_id || null,
    dynamic_attributes: initialData?.dynamic_attributes || null,
  });

  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [selectedProductTypeSchema, setSelectedProductTypeSchema] = useState<Field[] | null>(null);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    // Initialize formData with initialData, including new fields
    setFormData({
      shop_id: shopId,
      main_category_id: initialData?.main_category_id || null,
      subcategory_id: initialData?.subcategory_id || null,
      brand_id: initialData?.brand_id || null,
      name_ar: initialData?.name_ar || '',
      name_en: initialData?.name_en || null,
      description_ar: initialData?.description_ar || null,
      description_en: initialData?.description_en || null,
      short_description_ar: initialData?.short_description_ar || null,
      short_description_en: initialData?.short_description_en || null,
      sku: initialData?.sku || '',
      barcode: initialData?.barcode || null,
      cost_price: initialData?.cost_price || null,
      stock_quantity: initialData?.stock_quantity || null,
      min_stock_level: initialData?.min_stock_level || null,
      weight: initialData?.weight || null,
      dimensions: initialData?.dimensions || null,
      loyalty_points_earned: initialData?.loyalty_points_earned || null,
      gift_description_ar: initialData?.gift_description_ar || null,
      gift_description_en: initialData?.gift_description_en || null,
      is_active: initialData?.is_active ?? true,
      is_featured: initialData?.is_featured ?? false,
      meta_title_ar: initialData?.meta_title_ar || null,
      meta_title_en: initialData?.meta_title_en || null,
      meta_description_ar: initialData?.meta_description_ar || null,
      meta_description_en: initialData?.meta_description_en || null,
      tags: initialData?.tags || null,
      product_type_id: initialData?.product_type_id || null,
      dynamic_attributes: initialData?.dynamic_attributes || null,
    });
  }, [initialData, shopId]);

  // Fetch product types
  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        const response = await fetch('/api/product-types');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ProductType[] = await response.json();
        setProductTypes(data);

        // If initialData has a product_type_id, set its schema
        if (initialData?.product_type_id) {
          const selectedType = data.find(type => type.id === initialData.product_type_id);
          if (selectedType) {
            setSelectedProductTypeSchema(selectedType.schema_template.fields);
          }
        }
      } catch (error) {
        console.error('Error fetching product types:', error);
      }
    };
    fetchProductTypes();
  }, [initialData]);

  useEffect(() => {
    setBrands([]);
  }, [formData.main_category_id]);

  useEffect(() => {
    const fetchMainCategories = async () => {
      try {
        const response = await fetch(`/api/main-categories?shop_id=${shopId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMainCategories(data);
      } catch (error) {
        console.error("Failed to fetch main categories:", error);
      }
    };

    const fetchBrands = async () => {
      try {
        const response = await fetch(`/api/brands?shop_id=${shopId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setBrands(data);
      } catch (error) {
        console.error("Failed to fetch brands:", error);
      }
    };

    if (shopId) {
      fetchMainCategories();
      fetchBrands();
    }
  }, [shopId]);

  useEffect(() => {
    if (formData.main_category_id) {
      const fetchSubCategories = async () => {
        try {
          const response = await fetch(`/api/subcategories?main_category_id=${formData.main_category_id}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setSubcategories(data);
        } catch (error) {
          console.error("Failed to fetch subcategories:", error);
        }
      };
      fetchSubCategories();
    } else {
      setSubcategories([]);
    }
  }, [formData.main_category_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? null : Number(value),
    }));
  };

  const handleDecimalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? null : parseFloat(value),
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? null : value.split(',').map(tag => tag.trim()),
    }));
  };

  const handleDimensionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    try {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? null : JSON.parse(value),
      }));
    } catch (error) {
      console.error("Invalid JSON for", name, ":", value);
      // Optionally, set an error state here
    }
  };

  const handleDynamicAttributeChange = (name: string, value: Prisma.JsonValue | null) => {
    setFormData((prev) => ({
      ...prev,
      dynamic_attributes: {
        ...(prev.dynamic_attributes || {}),
        [name]: value,
      } as Prisma.JsonObject,
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!formData.name_ar || !formData.sku || !formData.main_category_id) {
      alert('الاسم العربي، SKU، ومعرف الفئة الرئيسية حقول مطلوبة.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-4">
          <div>
            <Label htmlFor="name_ar" className="flex items-center gap-2">
              الاسم (عربي)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">اسم المنتج باللغة العربية كما سيظهر للمستخدمين.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="name_ar"
              name="name_ar"
              value={formData.name_ar}
              onChange={handleChange}
              required
              placeholder="مثال: تي شيرت قطني، هاتف ذكي"
            />
          </div>
          <div>
            <Label htmlFor="name_en" className="flex items-center gap-2">
              الاسم (انجليزي)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">اسم المنتج باللغة الإنجليزية (اختياري).</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="name_en"
              name="name_en"
              value={formData.name_en ?? ''}
              onChange={handleChange}
              placeholder="مثال: Cotton T-shirt, Smartphone"
            />
          </div>

          <div>
            <Label htmlFor="main_category_id">الفئة الرئيسية</Label>
            <Select
              name="main_category_id"
              value={formData.main_category_id ?? ''}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, main_category_id: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر فئة رئيسية" />
              </SelectTrigger>
              <SelectContent>
                {mainCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="subcategory_id">الفئة الفرعية (اختياري)</Label>
            <Select
              name="subcategory_id"
              value={formData.subcategory_id ?? ''}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, subcategory_id: value }))}
              disabled={!formData.main_category_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر فئة فرعية" />
              </SelectTrigger>
              <SelectContent>
                {subcategories.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    {subcategory.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="brand_id">العلامة التجارية (اختياري)</Label>
            <Select
              name="brand_id"
              value={formData.brand_id ?? ''}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, brand_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر علامة تجارية" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="product_type_id">نوع المنتج (اختياري)</Label>
            <Select
              name="product_type_id"
              value={formData.product_type_id ?? ''}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, product_type_id: value }));
                const selectedType = productTypes.find(type => type.id === value);
                setSelectedProductTypeSchema(selectedType ? selectedType.schema_template.fields : null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع المنتج" />
              </SelectTrigger>
              <SelectContent>
                {productTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProductTypeSchema && selectedProductTypeSchema.length > 0 && (
            <div className="space-y-4 border p-4 rounded-md">
              <h3 className="text-lg font-semibold">الخصائص الديناميكية لنوع المنتج</h3>
              {selectedProductTypeSchema.map((field) => (
                <div key={field.name}>
                  <Label htmlFor={field.name} className="flex items-center gap-2">
                    {field.label_ar}
                    {field.required && <span className="text-red-500">*</span>}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">{field.label_en || field.label_ar}</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={typeof formData.dynamic_attributes?.[field.name] === 'object' && formData.dynamic_attributes?.[field.name] !== null
                        ? JSON.stringify(formData.dynamic_attributes[field.name])
                        : formData.dynamic_attributes?.[field.name]?.toString() ?? ''}
                      onChange={(e) => handleDynamicAttributeChange(field.name, e.target.value === '' ? null : e.target.value)}
                      required={field.required}
                      rows={3}
                    />
                  ) : field.type === 'checkbox' ? (
                    <Checkbox
                      id={field.name}
                      name={field.name}
                      checked={!!formData.dynamic_attributes?.[field.name]}
                      onCheckedChange={(checked) => handleDynamicAttributeChange(field.name, checked)}
                    />
                  ) : field.type === 'select' && field.options ? (
                    <Select
                      name={field.name}
                      value={formData.dynamic_attributes?.[field.name]?.toString() ?? ''}
                      onValueChange={(value) => handleDynamicAttributeChange(field.name, value === '' ? null : value)}
                      required={field.required}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`اختر ${field.label_ar}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'color' ? (
                    <ColorInput
                      id={field.name}
                      name={field.name}
                      value={formData.dynamic_attributes?.[field.name]?.toString() ?? ''}
                      onChange={(e) => handleDynamicAttributeChange(field.name, e.target.value === '' ? null : e.target.value)}
                      required={field.required}
                    />
                  ) : (
                    <Input
                      id={field.name}
                      name={field.name}
                      type={field.type === 'number' ? 'number' : 'text'}
                      step={field.is_decimal ? '0.01' : '1'}
                      value={typeof formData.dynamic_attributes?.[field.name] === 'object' && formData.dynamic_attributes?.[field.name] !== null
                        ? JSON.stringify(formData.dynamic_attributes[field.name])
                        : formData.dynamic_attributes?.[field.name]?.toString() ?? ''}
                      onChange={(e) => {
                        let valueToPass: Prisma.JsonValue | null;
                        if (field.type === 'number') {
                          valueToPass = e.target.value === '' ? null : Number(e.target.value);
                        } else {
                          valueToPass = e.target.value === '' ? null : e.target.value;
                        }
                        handleDynamicAttributeChange(field.name, valueToPass);
                      }}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div>
            <Label htmlFor="description_ar" className="flex items-center gap-2">
              الوصف الكامل (عربي)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">وصف المنتج التفصيلي باللغة العربية.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Textarea
              id="description_ar"
              name="description_ar"
              value={formData.description_ar ?? ''}
              onChange={handleChange}
              rows={4}
              placeholder="مثال: هذا المنتج مصنوع من أجود أنواع القطن المصري، يتميز بمتانته ومقاومته للتآكل ومناسب للاستخدام اليومي."
            />
          </div>
          <div>
            <Label htmlFor="description_en" className="flex items-center gap-2">
              الوصف الكامل (انجليزي)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Detailed product description in English (optional).</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Textarea
              id="description_en"
              name="description_en"
              value={formData.description_en ?? ''}
              onChange={handleChange}
              rows={4}
              placeholder="Example: This product is made from the finest Egyptian cotton, known for its durability and supreme softness, suitable for daily use."
            />
          </div>
          <div>
            <Label htmlFor="short_description_ar" className="flex items-center gap-2">
              وصف إضافي (عربي)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">وصف موجز أو نقاط رئيسية للمنتج باللغة العربية.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Textarea
              id="short_description_ar"
              name="short_description_ar"
              value={formData.short_description_ar ?? ''}
              onChange={handleChange}
              rows={2}
              placeholder="مثال: تصميم عصري، مريح وعملي، متوفر بألوان متعددة."
            />
          </div>
          <div>
            <Label htmlFor="short_description_en" className="flex items-center gap-2">
              وصف إضافي (انجليزي)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Short description or key features in English (optional).</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Textarea
              id="short_description_en"
              name="short_description_en"
              value={formData.short_description_en ?? ''}
              onChange={handleChange}
              rows={2}
              placeholder="Example: Modern design, comfortable and practical, available in multiple colors."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku" className="flex items-center gap-2">
                SKU
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">رمز تعريف المنتج الفريد (مطلوب).</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                placeholder="مثال: SKU12345, PROD789"
              />
            </div>
            <div>
              <Label htmlFor="barcode" className="flex items-center gap-2">
                الباركود (اختياري)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">رمز الباركود الخاص بالمنتج.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="barcode"
                name="barcode"
                value={formData.barcode ?? ''}
                onChange={handleChange}
                placeholder="مثال: 1234567890128"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost_price" className="flex items-center gap-2">
                سعر التكلفة (اختياري)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">تكلفة شراء المنتج.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="cost_price"
                name="cost_price"
                type="number"
                step="0.01"
                value={formData.cost_price?.toString() ?? ''}
                onChange={handleDecimalChange}
                placeholder="مثال: 50.00"
              />
            </div>
            <div>
              <Label htmlFor="stock_quantity" className="flex items-center gap-2">
                الكمية في المخزون (اختياري)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">الكمية المتوفرة من المنتج في المخزون.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="stock_quantity"
                name="stock_quantity"
                type="number"
                value={formData.stock_quantity?.toString() ?? ''}
                onChange={handleNumberChange}
                placeholder="مثال: 100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_stock_level" className="flex items-center gap-2">
                الحد الأدنى للمخزون (اختياري)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">مستوى المخزون الذي يتطلب إعادة الطلب.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="min_stock_level"
                name="min_stock_level"
                type="number"
                value={formData.min_stock_level?.toString() ?? ''}
                onChange={handleNumberChange}
                placeholder="مثال: 10"
              />
            </div>
            <div>
              <Label htmlFor="weight" className="flex items-center gap-2">
                الوزن (اختياري)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">وزن المنتج (كجم/جرام).</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                step="0.01"
                value={formData.weight?.toString() ?? ''}
                onChange={handleDecimalChange}
                placeholder="مثال: 0.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dimensions" className="flex items-center gap-2">
              الأبعاد (اختياري)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">أبعاد المنتج (الطولxالعرضxالارتفاع) بالمتر.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="dimensions"
              name="dimensions"
              value={formData.dimensions ? JSON.stringify(formData.dimensions) : ''}
              onChange={handleDimensionsChange}
              placeholder="مثال: 10x10x5 (LengthxWidthxHeight)"
            />
          </div>

          <div>
            <Label htmlFor="loyalty_points_earned" className="flex items-center gap-2">
              نقاط الولاء المكتسبة (اختياري)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">عدد نقاط الولاء التي يكسبها العميل عند شراء هذا المنتج.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="loyalty_points_earned"
              name="loyalty_points_earned"
              type="number"
              value={formData.loyalty_points_earned?.toString() ?? ''}
              onChange={handleNumberChange}
              placeholder="مثال: 10"
            />
          </div>

          <div>
            <Label htmlFor="gift_description_ar" className="flex items-center gap-2">
              وصف الهدية (عربي)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">وصف خاص إذا كان المنتج هدية باللغة العربية.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Textarea
              id="gift_description_ar"
              name="gift_description_ar"
              value={formData.gift_description_ar ?? ''}
              onChange={handleChange}
              rows={3}
              placeholder="مثال: تغليف هدية فاخرة، يتضمن بطاقة تهنئة."
            />
          </div>
          <div>
            <Label htmlFor="gift_description_en" className="flex items-center gap-2">
              وصف الهدية (انجليزي)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Gift description in English (optional).</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Textarea
              id="gift_description_en"
              name="gift_description_en"
              value={formData.gift_description_en ?? ''}
              onChange={handleChange}
              rows={3}
              placeholder="Example: Special gift wrapping, includes a greeting card."
            />
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Checkbox
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked: boolean) => handleCheckboxChange('is_active', checked)}
            />
            <Label htmlFor="is_active">
              المنتج نشط
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">تحديد ما إذا كان المنتج مرئياً ومتاحاً للشراء.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Checkbox
              id="is_featured"
              name="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked: boolean) => handleCheckboxChange('is_featured', checked)}
            />
            <Label htmlFor="is_featured">
              المنتج مميز
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">تحديد ما إذا كان المنتج سيظهر في قسم المنتجات المميزة.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div>
            <Label htmlFor="meta_title_ar" className="flex items-center gap-2">
              عنوان الميتا (عربي)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">عنوان SEO للمنتج باللغة العربية.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="meta_title_ar"
              name="meta_title_ar"
              value={formData.meta_title_ar ?? ''}
              onChange={handleChange}
              placeholder="مثال: أفضل تي شيرت قطني 2023"
            />
          </div>
          <div>
            <Label htmlFor="meta_title_en" className="flex items-center gap-2">
              عنوان الميتا (انجليزي)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">SEO title for the product in English (optional).</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="meta_title_en"
              name="meta_title_en"
              value={formData.meta_title_en ?? ''}
              onChange={handleChange}
              placeholder="Example: Best Cotton T-shirt 2023"
            />
          </div>

          <div>
            <Label htmlFor="meta_description_ar" className="flex items-center gap-2">
              وصف الميتا (عربي)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">وصف SEO للمنتج باللغة العربية.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Textarea
              id="meta_description_ar"
              name="meta_description_ar"
              value={formData.meta_description_ar ?? ''}
              onChange={handleChange}
              rows={3}
              placeholder="مثال: تسوق الآن أفضل تي شيرت قطني مريح وعصري بجودة عالية."
            />
          </div>
          <div>
            <Label htmlFor="meta_description_en" className="flex items-center gap-2">
              وصف الميتا (انجليزي)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">SEO description for the product in English (optional).</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Textarea
              id="meta_description_en"
              name="meta_description_en"
              value={formData.meta_description_en ?? ''}
              onChange={handleChange}
              rows={3}
              placeholder="Example: Shop now for the best comfortable and stylish cotton t-shirt with high quality."
            />
          </div>

          <div>
            <Label htmlFor="tags" className="flex items-center gap-2">
              الكلمات المفتاحية (اختياري)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">الكلمات المفتاحية للمنتج مفصولة بفواصل (كومات).</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Textarea
              id="tags"
              name="tags"
              value={formData.tags?.join(', ') ?? ''}
              onChange={handleTagsChange}
              rows={2}
              placeholder="مثال: ملابس، قطن، صيفي، رجالي"
            />
          </div>

          <div>
            <Label htmlFor="default_selling_price" className="flex items-center gap-2">
              سعر البيع الافتراضي (اختياري)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">سعر البيع المقترح للمنتج.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="default_selling_price"
              name="default_selling_price"
              type="number"
              step="0.01"
              value={formData.default_selling_price?.toString() ?? ''}
              onChange={handleDecimalChange}
              placeholder="مثال: 75.00"
            />
          </div>
          <div>
            <Label htmlFor="default_profit_margin" className="flex items-center gap-2">
              هامش الربح الافتراضي (اختياري)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">هامش الربح الافتراضي كنسبة مئوية.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="default_profit_margin"
              name="default_profit_margin"
              type="number"
              step="0.01"
              value={formData.default_profit_margin?.toString() ?? ''}
              onChange={handleDecimalChange}
              placeholder="مثال: 0.25 (يمثل 25%)"
            />
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Checkbox
              id="auto_calculate_prices"
              name="auto_calculate_prices"
              checked={formData.auto_calculate_prices ?? false}
              onCheckedChange={(checked: boolean) => handleCheckboxChange('auto_calculate_prices', checked)}
            />
            <Label htmlFor="auto_calculate_prices">
              حساب الأسعار تلقائياً
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">تحديد ما إذا كان سعر البيع وهامش الربح يحسبان تلقائياً.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
      {/* Submit and Cancel Buttons */}
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit">
          {initialData ? 'تعديل المنتج' : 'إضافة المنتج'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm; 