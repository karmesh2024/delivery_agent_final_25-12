import React from 'react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { FiInfo } from 'react-icons/fi';
import { Product, ProductPriceFormData, ImageUploadData, MainCategory, SubCategory, TargetAudience, ProductType, CommonProductFormData } from '@/domains/products/types/types';
import { Prisma } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

interface BasicInfoFormProps {
  formData: CommonProductFormData;
  onFormChange: <K extends keyof CommonProductFormData>(field: K, value: CommonProductFormData[K]) => void;
  mainCategories: MainCategory[];
  subCategories: SubCategory[];
  targetAudiences: TargetAudience[];
  productTypes: ProductType[];
  storeBrands: { id: string; name_ar: string; name_en?: string | null }[];
  isEditing: boolean;
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
  formData,
  onFormChange,
  mainCategories,
  subCategories,
  targetAudiences,
  productTypes,
  storeBrands,
  isEditing,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Convert empty string to null for nullable fields
    const typedValue = (name === 'name_en' || name === 'subcategory_id' || name === 'brand_id' || name === 'barcode' || name === 'weight' || name === 'loyalty_points_earned') && value === '' ? null : value;
    onFormChange(name as keyof CommonProductFormData, typedValue);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value === '' ? null : parseFloat(value);
    onFormChange(name as keyof CommonProductFormData, numericValue);
  };

  const handleCheckboxChange = (name: keyof CommonProductFormData, checked: boolean) => {
    onFormChange(name, checked);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            placeholder="Example: Cotton T-shirt, Smartphone"
          />
        </div>

        <div>
          <Label htmlFor="sku" className="flex items-center gap-2">
            SKU
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">رمز المنتج الفريد (Stock Keeping Unit) لتحديد المنتج في المخزون.</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            required
            placeholder="مثال: TSHIRT001, IPHN128GB"
          />
        </div>

        <div>
          <Label htmlFor="main_category_id" className="flex items-center gap-2">
            الفئة الرئيسية
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">الفئة الرئيسية التي ينتمي إليها المنتج.</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Select
            onValueChange={(value) => {
              onFormChange('main_category_id', value === "null-category-placeholder" ? null : value);
              onFormChange('subcategory_id', null); // Reset subcategory when main category changes
            }}
            value={formData.main_category_id ?? ''}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر فئة رئيسية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null-category-placeholder">بدون فئة رئيسية</SelectItem>
              {mainCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name_ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="subcategory_id" className="flex items-center gap-2">
            الفئة الفرعية
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">الفئة الفرعية التي ينتمي إليها المنتج (اختياري).</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Select
            onValueChange={(value) => onFormChange('subcategory_id', value === "null-category-placeholder" ? null : value)}
            value={formData.subcategory_id ?? ''}
            disabled={!formData.main_category_id || subCategories.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر فئة فرعية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null-category-placeholder">بدون فئة فرعية</SelectItem>
              {subCategories.map((subcategory) => (
                <SelectItem key={subcategory.id} value={subcategory.id}>
                  {subcategory.name_ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="brand_id" className="flex items-center gap-2">
            العلامة التجارية
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">اختر العلامة التجارية المرتبطة بهذا المنتج.</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Select
            onValueChange={(value) => onFormChange('brand_id', value === 'null-brand-placeholder' ? null : value)}
            value={formData.brand_id ?? ''}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر علامة تجارية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null-brand-placeholder">بدون علامة تجارية</SelectItem>
              {storeBrands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name_ar || brand.name_en || brand.id}
                </SelectItem>
              ))}
              {formData.brand_id &&
                !storeBrands.some((brand) => brand.id === formData.brand_id) && (
                  <SelectItem value={formData.brand_id}>
                    علامة غير معروفة ({formData.brand_id})
                  </SelectItem>
                )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="barcode" className="flex items-center gap-2">
            الباركود
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">رمز الباركود للمنتج (اختياري).</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="barcode"
            name="barcode"
            value={formData.barcode ?? ''}
            onChange={handleChange}
            placeholder="مثال: 1234567890123"
          />
        </div>

        <div>
          <Label htmlFor="weight" className="flex items-center gap-2">
            الوزن (كجم)
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">وزن المنتج بالكيلوجرام (اختياري).</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            step="0.01"
            value={formData.weight?.toString() ?? ''}
            onChange={handleNumberChange}
            placeholder="مثال: 0.5"
          />
        </div>


        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            name="is_active"
            checked={formData.is_active ?? false}
            onCheckedChange={(checkedState: boolean) => handleCheckboxChange('is_active', checkedState)}
          />
          <Label htmlFor="is_active" className="flex items-center gap-2">
            المنتج نشط؟
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">تحديد ما إذا كان المنتج مرئيًا ومتاحًا للشراء في المتجر.</p>
              </TooltipContent>
            </Tooltip>
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_featured"
            name="is_featured"
            checked={formData.is_featured ?? false}
            onCheckedChange={(checkedState: boolean) => handleCheckboxChange('is_featured', checkedState)}
          />
          <Label htmlFor="is_featured" className="flex items-center gap-2">
            منتج مميز؟
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">تحديد ما إذا كان المنتج سيظهر كمنتج مميز أو موصى به.</p>
              </TooltipContent>
            </Tooltip>
          </Label>
        </div>

      </div>
    </TooltipProvider>
  );
};

export default BasicInfoForm; 