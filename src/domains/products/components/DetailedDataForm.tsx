import React from 'react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { FiInfo } from 'react-icons/fi';
import { Product, ProductType, ProductPriceFormData, ImageUploadData, CommonProductFormData } from '@/domains/products/types/types';
import { Prisma } from '@prisma/client';
import { ColorInput } from '@/shared/ui/color-input';

interface Field {
  name: string;
  label_ar: string;
  label_en?: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'color';
  options?: string[];
  required?: boolean;
  is_decimal?: boolean;
}

interface DetailedDataFormProps {
  formData: CommonProductFormData;
  onFormChange: <K extends keyof CommonProductFormData>(
    field: K,
    value: CommonProductFormData[K]
  ) => void;
  onDynamicAttributesChange: (attributes: Prisma.JsonObject) => void;
  productTypes: ProductType[];
  isEditing: boolean;
}

const DetailedDataForm: React.FC<DetailedDataFormProps> = ({
  formData,
  onFormChange,
  onDynamicAttributesChange,
  productTypes,
  isEditing,
}) => {
  const [selectedProductTypeSchema, setSelectedProductTypeSchema] = React.useState<Field[] | null>(null);

  React.useEffect(() => {
    if (formData.product_type_id) {
      const selectedType = productTypes.find(pt => pt.id === formData.product_type_id);
      if (selectedType && selectedType.schema_template) {
        setSelectedProductTypeSchema(selectedType.schema_template as unknown as Field[]); // Changed from schema to schema_template
      } else {
        setSelectedProductTypeSchema(null);
      }
    } else {
      setSelectedProductTypeSchema(null);
    }
  }, [formData.product_type_id, productTypes]);

  const handleProductTypeSelectChange = (value: string) => {
    const typeId = value === 'null-product-type' ? null : value;
    onFormChange('product_type_id', typeId);
    onDynamicAttributesChange({}); // Clear dynamic attributes when product type changes

    const selectedType = productTypes.find(pt => pt.id === typeId);
    if (selectedType && selectedType.schema_template) {
      setSelectedProductTypeSchema(selectedType.schema_template as unknown as Field[]); // Changed from schema to schema_template
    } else {
      setSelectedProductTypeSchema(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onFormChange(name as keyof CommonProductFormData, value === '' ? null : value);
  };


  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    onFormChange('tags', tagsArray.length > 0 ? tagsArray : null);
  };

  const handleDynamicInputNumberChange = (name: string, value: string) => {
    onDynamicAttributesChange({
      ...formData.dynamic_attributes,
      [name]: value === '' ? null : Number(value),
    });
  };

  const handleDynamicInputChange = (name: string, value: string) => {
    onDynamicAttributesChange({
      ...formData.dynamic_attributes,
      [name]: value === '' ? null : value,
    });
  };

  const handleDynamicSelectChange = (name: string, value: string) => {
    onDynamicAttributesChange({
      ...formData.dynamic_attributes,
      [name]: value,
    });
  };

  const handleDynamicCheckboxChange = (name: string, checked: boolean) => {
    onDynamicAttributesChange({
      ...formData.dynamic_attributes,
      [name]: checked,
    });
  };

  const handleDynamicColorChange = (name: string, e: React.ChangeEvent<HTMLInputElement>) => {
    onDynamicAttributesChange({
      ...formData.dynamic_attributes,
      [name]: e.target.value,
    });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="description_ar" className="flex items-center gap-2">
            الوصف الكامل (عربي)
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">وصف مفصل للمنتج باللغة العربية، يتضمن جميع الميزات والتفاصيل.</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Textarea
            id="description_ar"
            name="description_ar"
            value={formData.description_ar || ''}
            onChange={handleChange}
            rows={6}
            placeholder="مثال: هذا المنتج مصنوع من أجود أنواع القطن المصري، يتميز بمتانته ونعومته الفائقة، ومناسب للاستخدام اليومي."
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="description_en" className="flex items-center gap-2">
            الوصف الكامل (انجليزي)
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">وصف مفصل للمنتج باللغة الإنجليزية (اختياري).</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Textarea
            id="description_en"
            name="description_en"
            value={formData.description_en || ''}
            onChange={handleChange}
            rows={6}
            placeholder="Example: This product is made from the finest Egyptian cotton, known for its durability and supreme softness, suitable for daily use."
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="short_description_ar" className="flex items-center gap-2">
            وصف قصير (عربي)
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">وصف موجز للمنتج باللغة العربية، يظهر في قوائم المنتجات.</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Textarea
            id="short_description_ar"
            name="short_description_ar"
            value={formData.short_description_ar || ''}
            onChange={handleChange}
            rows={3}
            placeholder="مثال: قميص مريح وعصري من القطن الطبيعي 100%."
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="short_description_en" className="flex items-center gap-2">
            وصف قصير (انجليزي)
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">وصف موجز للمنتج باللغة الإنجليزية (اختياري).</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Textarea
            id="short_description_en"
            name="short_description_en"
            value={formData.short_description_en || ''}
            onChange={handleChange}
            rows={3}
            placeholder="Example: Comfortable and stylish 100% natural cotton shirt."
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="meta_title_ar" className="flex items-center gap-2">
            عنوان الميتا (عربي)
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">عنوان الميتا باللغة العربية لتحسين محركات البحث (SEO).</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="meta_title_ar"
            name="meta_title_ar"
            value={formData.meta_title_ar || ''}
            onChange={handleChange}
            placeholder="مثال: أفضل تي شيرت قطني مريح للرجال في دبي"
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="meta_title_en" className="flex items-center gap-2">
            عنوان الميتا (انجليزي)
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">عنوان الميتا باللغة الإنجليزية (اختياري) لتحسين محركات البحث (SEO).</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="meta_title_en"
            name="meta_title_en"
            value={formData.meta_title_en || ''}
            onChange={handleChange}
            placeholder="Example: Best Comfortable Cotton T-shirt for Men in Dubai"
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="meta_description_ar" className="flex items-center gap-2">
            وصف الميتا (عربي)
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">وصف الميتا باللغة العربية لتحسين محركات البحث (SEO).</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Textarea
            id="meta_description_ar"
            name="meta_description_ar"
            value={formData.meta_description_ar || ''}
            onChange={handleChange}
            rows={3}
            placeholder="مثال: تسوق الآن أفضل تشكيلة من التي شيرتات القطنية الرجالية في دبي بجودة عالية وأسعار مميزة."
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="meta_description_en" className="flex items-center gap-2">
            وصف الميتا (انجليزي)
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">وصف الميتا باللغة الإنجليزية (اختياري) لتحسين محركات البحث (SEO).</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Textarea
            id="meta_description_en"
            name="meta_description_en"
            value={formData.meta_description_en || ''}
            onChange={handleChange}
            rows={3}
            placeholder="Example: Shop now the best collection of men's cotton t-shirts in Dubai with high quality and special prices."
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="tags" className="flex items-center gap-2">
            الوسوم (مفصولة بفاصلة)
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">الكلمات المفتاحية المتعلقة بالمنتج، تستخدم للبحث.</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="tags"
            name="tags"
            value={(formData.tags || []).join(', ')}
            onChange={handleTagsChange}
            placeholder="مثال: قطن، رجالي، صيفي"
          />
        </div>



        <div className="col-span-2">
          <Label htmlFor="dimensions" className="flex items-center gap-2">
            الأبعاد (JSON)
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">أبعاد المنتج بصيغة JSON (مثال: {"{"}"length": 10, "width": 5, "height": 3{"}"})</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Textarea
            id="dimensions"
            name="dimensions"
            value={formData.dimensions ? JSON.stringify(formData.dimensions, null, 2) : ''}
            onChange={(e) => {
              try {
                const value = e.target.value;
                if (value === '') {
                  onFormChange('dimensions', null);
                } else {
                  const parsed = JSON.parse(value);
                  onFormChange('dimensions', parsed);
                }
              } catch (error) {
                // Invalid JSON, keep the text for user to fix
                onFormChange('dimensions', e.target.value as any);
              }
            }}
            rows={4}
            placeholder='{"length": 10, "width": 5, "height": 3}'
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="product_type_id" className="flex items-center gap-2">
            نوع المنتج
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">يحدد نوع المنتج الذي سيتم إضافته، ويتحكم في الحقول الديناميكية.</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Select
            value={formData.product_type_id || 'null-product-type'}
            onValueChange={handleProductTypeSelectChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر نوع المنتج" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null-product-type">بدون نوع (منتج عام)</SelectItem>
              {productTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name_ar} ({type.name_en})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProductTypeSchema && selectedProductTypeSchema.length > 0 && (
          <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-2 col-span-2">السمات الديناميكية</h3>
            {selectedProductTypeSchema.map((field) => (
              <div key={field.name}>
                <Label htmlFor={field.name} className="flex items-center gap-2">
                  {field.label_ar}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">{field.label_en || field.label_ar}</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                {field.type === 'text' && (
                  <Input
                    id={field.name}
                    name={field.name}
                    value={(formData.dynamic_attributes?.[field.name] as string) || ''}
                    onChange={(e) => handleDynamicInputChange(field.name, e.target.value)}
                    required={field.required}
                  />
                )}
                {field.type === 'number' && (
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    step={field.is_decimal ? "0.01" : "1"}
                    value={(formData.dynamic_attributes?.[field.name] as number) || ''}
                    onChange={(e) => handleDynamicInputNumberChange(field.name, e.target.value)}
                    required={field.required}
                  />
                )}
                {field.type === 'textarea' && (
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={(formData.dynamic_attributes?.[field.name] as string) || ''}
                    onChange={(e) => handleDynamicInputChange(field.name, e.target.value)}
                    rows={3}
                    required={field.required}
                  />
                )}
                {field.type === 'checkbox' && (
                  <Checkbox
                    id={field.name}
                    name={field.name}
                    checked={(formData.dynamic_attributes?.[field.name] as boolean) || false}
                    onCheckedChange={(checkedState: boolean) => handleDynamicCheckboxChange(field.name, checkedState)}
                  />
                )}
                {field.type === 'select' && field.options && (
                  <Select
                    value={(formData.dynamic_attributes?.[field.name] as string) || ''}
                    onValueChange={(value) => handleDynamicSelectChange(field.name, value)}
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
                )}
                {field.type === 'color' && (
                  <ColorInput
                    id={field.name}
                    name={field.name}
                    value={(formData.dynamic_attributes?.[field.name] as string) || ''}
                    onChange={(e) => handleDynamicColorChange(field.name, e)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default DetailedDataForm;