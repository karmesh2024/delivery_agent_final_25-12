import React, { useState, useEffect } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { FiInfo } from 'react-icons/fi';
import { Product, ProductPriceData, TargetAudience, ProductPriceFormData, ImageUploadData, ProductType, MainCategory, SubCategory, CommonProductFormData } from '@/domains/products/types/types';
import { Prisma } from '@prisma/client';

interface PricingFormProps {
  formData: CommonProductFormData;
  onFormChange: <K extends keyof CommonProductFormData>(field: K, value: CommonProductFormData[K]) => void;
  onPricesChange: (prices: ProductPriceFormData[]) => void;
  targetAudiences: TargetAudience[];
  isEditing: boolean; // Renamed from isEditMode
}

const PricingForm: React.FC<PricingFormProps> = ({
  formData,
  onFormChange,
  onPricesChange,
  targetAudiences,
  isEditing,
}) => {
  const [currentPriceEntry, setCurrentPriceEntry] = useState<ProductPriceFormData>({
    price: new Prisma.Decimal(0),
    price_name_ar: '',
    price_name_en: null,
    target_audience_id: null,
    is_on_sale: false,
    sale_price: null,
    price_type: 'selling', // Default to selling price
    profit_margin: null,
    min_price: null,
    max_discount_percentage: new Prisma.Decimal(0),
    is_negotiable: false,
    effective_from: new Date(),
    effective_to: null,
  });

  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    // Reset currentPriceEntry if isEditing changes or formData.prices changes significantly
    if (isEditing && formData.prices.length > 0 && editIndex !== null) {
      const priceToEdit = formData.prices[editIndex];
      setCurrentPriceEntry({
        ...priceToEdit,
        price: priceToEdit.price ? new Prisma.Decimal(priceToEdit.price) : new Prisma.Decimal(0),
        sale_price: priceToEdit.sale_price ? new Prisma.Decimal(priceToEdit.sale_price) : null,
        profit_margin: priceToEdit.profit_margin ? new Prisma.Decimal(priceToEdit.profit_margin) : null,
        min_price: priceToEdit.min_price ? new Prisma.Decimal(priceToEdit.min_price) : null,
        max_discount_percentage: priceToEdit.max_discount_percentage ? new Prisma.Decimal(priceToEdit.max_discount_percentage) : new Prisma.Decimal(0),
        effective_from: priceToEdit.effective_from ? new Date(priceToEdit.effective_from) : undefined, // Ensure Date object
        effective_to: priceToEdit.effective_to ? new Date(priceToEdit.effective_to) : undefined,       // Ensure Date object
      });
    } else if (!isEditing || formData.prices.length === 0) {
      // Reset when not editing or no prices
      setCurrentPriceEntry({
        price: new Prisma.Decimal(0),
        price_name_ar: '',
        price_name_en: null,
        target_audience_id: null,
        is_on_sale: false,
        sale_price: null,
        price_type: 'selling',
        profit_margin: null,
        min_price: null,
        max_discount_percentage: new Prisma.Decimal(0),
        is_negotiable: false,
        effective_from: new Date(),
        effective_to: null,
      });
      setEditIndex(null);
    }
  }, [isEditing, formData.prices, editIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCurrentPriceEntry((prev) => {
      let newValue: Prisma.Decimal | string | boolean | Date | null;
      if (type === 'checkbox') {
        newValue = checked;
      } else if (name === 'price') {
        newValue = value === '' ? new Prisma.Decimal(0) : new Prisma.Decimal(value);
      } else if (['sale_price', 'profit_margin', 'min_price', 'max_discount_percentage'].includes(name)) {
        newValue = value === '' ? null : new Prisma.Decimal(value);
      } else if (name === 'effective_from' || name === 'effective_to') {
        newValue = value === '' ? null : new Date(value);
      } else {
        newValue = value;
      }
      return {
        ...prev,
        [name as keyof ProductPriceFormData]: newValue,
      };
    });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentPriceEntry((prev) => ({
      ...prev,
      [name]: value === '' ? null : value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value === '' ? null : parseInt(value, 10);
    onFormChange(name as keyof CommonProductFormData, numericValue);
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentPriceEntry((prev) => ({
      ...prev,
      [name]: value === 'null-audience' || value === 'null-price-type' ? null : value,
    }));
  };

  const handleAddOrUpdatePrice = () => {
    if (currentPriceEntry.price_name_ar === '') {
      alert('الرجاء إدخال اسم السعر العربي.');
      return;
    }
    if (!currentPriceEntry.price || currentPriceEntry.price.lessThanOrEqualTo(0)) {
      alert('يجب أن يكون السعر أكبر من صفر.');
      return;
    }
    if (currentPriceEntry.is_on_sale && (!currentPriceEntry.sale_price || currentPriceEntry.sale_price.lessThanOrEqualTo(0))) {
      alert('يجب تحديد سعر بيع صالح إذا كان المنتج معروضًا للبيع.');
      return;
    }

    let updatedPrices: ProductPriceFormData[];
    if (editIndex !== null) {
      updatedPrices = formData.prices.map((price, index) => // Changed from productPrices to formData.prices
        index === editIndex ? currentPriceEntry : price
      );
    } else {
      const isDuplicate = formData.prices.some(p => // Changed from productPrices to formData.prices
        p.price_name_ar === currentPriceEntry.price_name_ar &&
        p.target_audience_id === currentPriceEntry.target_audience_id &&
        p.price_type === currentPriceEntry.price_type
      );
      if (isDuplicate) {
        alert('يوجد بالفعل سعر بنفس الاسم أو الجمهور المستهدف ونوع السعر. الرجاء اختيار اسم مختلف أو جمهور مختلف أو نوع سعر مختلف.');
        return;
      }
      updatedPrices = [...formData.prices, { ...currentPriceEntry, id: `new-${Date.now()}` }]; // Changed from productPrices to formData.prices
    }

    onPricesChange(updatedPrices);
    setCurrentPriceEntry({
      price: new Prisma.Decimal(0),
      price_name_ar: '',
      price_name_en: null,
      target_audience_id: null,
      is_on_sale: false,
      sale_price: null,
      price_type: 'selling',
      profit_margin: null,
      min_price: null,
      max_discount_percentage: new Prisma.Decimal(0),
      is_negotiable: false,
      effective_from: new Date(),
      effective_to: null,
    });
    setEditIndex(null);
  };

  const handleEditPrice = (index: number) => {
    const priceToEdit = formData.prices[index];
    setCurrentPriceEntry({
      ...priceToEdit,
      price: priceToEdit.price ? new Prisma.Decimal(priceToEdit.price) : new Prisma.Decimal(0),
      sale_price: priceToEdit.sale_price ? new Prisma.Decimal(priceToEdit.sale_price) : null,
      profit_margin: priceToEdit.profit_margin ? new Prisma.Decimal(priceToEdit.profit_margin) : null,
      min_price: priceToEdit.min_price ? new Prisma.Decimal(priceToEdit.min_price) : null,
      max_discount_percentage: priceToEdit.max_discount_percentage ? new Prisma.Decimal(priceToEdit.max_discount_percentage) : new Prisma.Decimal(0),
      effective_from: priceToEdit.effective_from ? new Date(priceToEdit.effective_from) : undefined, // Ensure Date object
      effective_to: priceToEdit.effective_to ? new Date(priceToEdit.effective_to) : undefined,       // Ensure Date object
    });
    setEditIndex(index);
  };

  const handleRemovePrice = (index: number) => {
    onPricesChange(formData.prices.filter((_, i) => i !== index)); // Changed from productPrices to formData.prices
    if (editIndex === index) {
      setCurrentPriceEntry({
        price: new Prisma.Decimal(0),
        price_name_ar: '',
        price_name_en: null,
        target_audience_id: null,
        is_on_sale: false,
        sale_price: null,
        price_type: 'selling',
        profit_margin: null,
        min_price: null,
        max_discount_percentage: new Prisma.Decimal(0),
        is_negotiable: false,
        effective_from: new Date(),
        effective_to: null,
      });
      setEditIndex(null);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price_name_ar" className="flex items-center gap-2">
              اسم السعر (عربي)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">اسم وصفي للسعر (مثال: سعر التجزئة، سعر الجملة).</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="price_name_ar"
              name="price_name_ar"
              value={currentPriceEntry.price_name_ar}
              onChange={handleTextChange}
              placeholder="مثال: سعر التجزئة"
              required
            />
          </div>
          <div>
            <Label htmlFor="price_name_en" className="flex items-center gap-2">
              اسم السعر (انجليزي)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">اسم السعر باللغة الإنجليزية (اختياري).</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="price_name_en"
              name="price_name_en"
              value={currentPriceEntry.price_name_en ?? ''}
              onChange={handleTextChange}
              placeholder="Example: Retail Price"
            />
          </div>

          <div>
            <Label htmlFor="price" className="flex items-center gap-2">
              السعر
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">السعر الأساسي للمنتج.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={currentPriceEntry.price?.toString() ?? ''}
              onChange={handleInputChange}
              placeholder="مثال: 120.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="target_audience_id" className="flex items-center gap-2">
              الجمهور المستهدف
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">الجمهور المستهدف الذي ينطبق عليه هذا السعر (اختياري).</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Select
              onValueChange={(value) => handleSelectChange('target_audience_id', value)}
              value={currentPriceEntry.target_audience_id ?? 'null-audience'}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر جمهورًا مستهدفًا" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null-audience">لا يوجد جمهور مستهدف</SelectItem>
                {targetAudiences.map((audience) => (
                  <SelectItem key={audience.id} value={audience.id}>
                    {audience.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_on_sale"
              name="is_on_sale"
              checked={currentPriceEntry.is_on_sale ?? false}
              onCheckedChange={(checkedState: boolean) =>
                handleInputChange({ target: { name: 'is_on_sale', value: checkedState.toString(), type: 'checkbox', checked: checkedState } } as React.ChangeEvent<HTMLInputElement>)}
            />
            <Label htmlFor="is_on_sale" className="flex items-center gap-2">
              معروض للبيع؟
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">تحديد ما إذا كان المنتج معروضًا للبيع بسعر مخفض.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
          </div>

          {currentPriceEntry.is_on_sale && (
            <div>
              <Label htmlFor="sale_price" className="flex items-center gap-2">
                سعر البيع
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">السعر الجديد للمنتج أثناء فترة التخفيض.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="sale_price"
                name="sale_price"
                type="number"
                step="0.01"
                value={currentPriceEntry.sale_price?.toString() ?? ''}
                onChange={handleInputChange}
                placeholder="مثال: 99.99"
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="price_type" className="flex items-center gap-2">
              نوع السعر
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">نوع السعر (مثال: سعر التكلفة، سعر البيع، سعر الجملة).</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Select
              onValueChange={(value) => handleSelectChange('price_type', value)}
              value={currentPriceEntry.price_type ?? 'selling'}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع السعر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cost">سعر التكلفة</SelectItem>
                <SelectItem value="selling">سعر البيع</SelectItem>
                <SelectItem value="wholesale">سعر الجملة</SelectItem>
                <SelectItem value="retail">سعر التجزئة</SelectItem>
                <SelectItem value="special">سعر خاص</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="profit_margin" className="flex items-center gap-2">
              هامش الربح (%)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">هامش الربح المتوقع لهذا السعر كنسبة مئوية.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="profit_margin"
              name="profit_margin"
              type="number"
              step="0.01"
              value={currentPriceEntry.profit_margin?.toString() ?? ''}
              onChange={handleInputChange}
              placeholder="مثال: 25.00"
            />
          </div>

          <div>
            <Label htmlFor="min_price" className="flex items-center gap-2">
              الحد الأدنى للسعر
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">الحد الأدنى الذي يمكن بيع المنتج به.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="min_price"
              name="min_price"
              type="number"
              step="0.01"
              value={currentPriceEntry.min_price?.toString() ?? ''}
              onChange={handleInputChange}
              placeholder="مثال: 50.00"
            />
          </div>

          <div>
            <Label htmlFor="max_discount_percentage" className="flex items-center gap-2">
              الحد الأقصى للخصم (%)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">الحد الأقصى للخصم المسموح به على هذا السعر كنسبة مئوية.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="max_discount_percentage"
              name="max_discount_percentage"
              type="number"
              step="0.01"
              value={currentPriceEntry.max_discount_percentage?.toString() ?? ''}
              onChange={handleInputChange}
              placeholder="مثال: 10.00"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_negotiable"
              name="is_negotiable"
              checked={currentPriceEntry.is_negotiable ?? false}
              onCheckedChange={(checkedState: boolean) =>
                handleInputChange({ target: { name: 'is_negotiable', value: checkedState.toString(), type: 'checkbox', checked: checkedState } } as React.ChangeEvent<HTMLInputElement>)}
            />
            <Label htmlFor="is_negotiable" className="flex items-center gap-2">
              قابل للتفاوض؟
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">تحديد ما إذا كان السعر قابلاً للتفاوض.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
          </div>

          <div>
            <Label htmlFor="effective_from" className="flex items-center gap-2">
              تاريخ البدء
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">تاريخ بدء سريان هذا السعر.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="effective_from"
              name="effective_from"
              type="date"
              value={currentPriceEntry.effective_from?.toISOString().split('T')[0] ?? ''}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label htmlFor="effective_to" className="flex items-center gap-2">
              تاريخ الانتهاء
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">تاريخ انتهاء سريان هذا السعر (اختياري).</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="effective_to"
              name="effective_to"
              type="date"
              value={currentPriceEntry.effective_to?.toISOString().split('T')[0] ?? ''}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
          <div>
            <Label htmlFor="default_selling_price" className="flex items-center gap-2">
              سعر البيع الافتراضي
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">السعر الافتراضي للمنتج عند البيع.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="default_selling_price"
              name="default_selling_price"
              type="number"
              step="0.01"
              value={formData.default_selling_price?.toString() ?? ''}
              onChange={handleNumberChange}
              placeholder="مثال: 120.00"
            />
          </div>

          <div>
            <Label htmlFor="default_profit_margin" className="flex items-center gap-2">
              هامش الربح الافتراضي (%)
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
              onChange={handleNumberChange}
              placeholder="مثال: 25.00"
            />
          </div>

          <div>
            <Label htmlFor="loyalty_points_earned" className="flex items-center gap-2">
              نقاط الولاء المكتسبة
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">عدد نقاط الولاء التي يحصل عليها العميل عند شراء هذا المنتج.</p>
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto_calculate_prices"
              name="auto_calculate_prices"
              checked={formData.auto_calculate_prices ?? true}
              onCheckedChange={(checkedState: boolean) => onFormChange('auto_calculate_prices', checkedState)}
            />
            <Label htmlFor="auto_calculate_prices" className="flex items-center gap-2">
              حساب الأسعار تلقائياً
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">تحديد ما إذا كان سيتم حساب الأسعار تلقائياً بناءً على سعر التكلفة وهامش الربح.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
          <div>
            <Label htmlFor="gift_description_ar" className="flex items-center gap-2">
              وصف الهدية (عربي)
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">وصف الهدية أو العرض الترويجي المرتبط بالمنتج.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="gift_description_ar"
              name="gift_description_ar"
              value={formData.gift_description_ar ?? ''}
              onChange={(e) => onFormChange('gift_description_ar', e.target.value === '' ? null : e.target.value)}
              placeholder="مثال: هدية مجانية مع كل طلب"
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
                  <p className="text-sm">وصف الهدية أو العرض الترويجي باللغة الإنجليزية.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="gift_description_en"
              name="gift_description_en"
              value={formData.gift_description_en ?? ''}
              onChange={(e) => onFormChange('gift_description_en', e.target.value === '' ? null : e.target.value)}
              placeholder="Example: Free gift with every order"
            />
          </div>
        </div>

        <Button onClick={handleAddOrUpdatePrice} className="w-full">
          {editIndex !== null ? 'تعديل السعر' : 'إضافة سعر'}
        </Button>

        {formData.prices.length > 0 && ( // Changed from productPrices to formData.prices
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">الأسعار الحالية</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">الاسم (عربي)</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">السعر</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">الجمهور المستهدف</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">للبيع</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">سعر البيع</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">نوع السعر</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">تاريخ البدء</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">تاريخ الانتهاء</th>
                    <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.prices.map((price, index) => ( // Changed from productPrices to formData.prices
                    <tr key={price.id || index}>
                      <td className="py-2 px-4 border-b">{price.price_name_ar}</td>
                      <td className="py-2 px-4 border-b">{price.price?.toString()}</td>
                      <td className="py-2 px-4 border-b">{targetAudiences.find(ta => ta.id === price.target_audience_id)?.name_ar || 'الكل'}</td>
                      <td className="py-2 px-4 border-b">{price.is_on_sale ? 'نعم' : 'لا'}</td>
                      <td className="py-2 px-4 border-b">{price.sale_price?.toString() ?? '-'}</td>
                      <td className="py-2 px-4 border-b">{price.price_type}</td>
                      <td className="py-2 px-4 border-b">{price.effective_from ? new Date(price.effective_from).toLocaleDateString() : '-'}</td>
                      <td className="py-2 px-4 border-b">{price.effective_to ? new Date(price.effective_to).toLocaleDateString() : '-'}</td>
                      <td className="py-2 px-4 border-b">
                        <Button variant="outline" size="sm" onClick={() => handleEditPrice(index)} className="mr-2">
                          تعديل
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleRemovePrice(index)}>
                          حذف
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default PricingForm;