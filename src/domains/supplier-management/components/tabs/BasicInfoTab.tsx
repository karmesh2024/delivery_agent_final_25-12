'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { MultiSelect } from '@/shared/components/ui/multi-select';
import { useAppSelector, useAppDispatch } from '@/store/index';
import { Supplier } from '../../types';
import { toast } from 'react-toastify';
import { fetchSuppliers } from '../../store/supplierSlice';
import { fetchCategories } from '../../store/referenceDataSlice';

// مكون الحقل الإلزامي
const RequiredIndicator = () => (
  <span className="text-red-500 mr-1">*</span>
);

interface BasicInfoTabProps {
  initialData: Partial<Supplier>;
  onChange: (data: Partial<Supplier>) => void;
  onValidityChange: (isValid: boolean) => void;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  initialData,
  onChange,
  onValidityChange,
}) => {
  const dispatch = useAppDispatch();
  const { regions, supplierTypes, categories, loading: referenceDataLoading } = useAppSelector((state) => state.referenceData);
  const { suppliers } = useAppSelector((state) => state.supplier);
  
  // Use useRef to keep a stable reference to the initialData for comparison
  const [formData, setFormData] = useState<Partial<Supplier>>(initialData || {});
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // للفئات المختارة
  
  // Only update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      
      // تحميل الفئات المختارة إذا كانت موجودة
      if (initialData.categories) {
        setSelectedCategories(initialData.categories.map(cat => cat.id.toString()));
      }
    }
  }, [initialData]);
  
  // Load suppliers if not already loaded
  useEffect(() => {
    if (suppliers.length === 0) {
      dispatch(fetchSuppliers());
    }
    
    // تحميل الفئات إذا لم تكن محملة بالفعل
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, suppliers.length, categories.length]);
  
  // دالة توليد كود المورد التلقائي
  const generateSupplierCode = useCallback(async () => {
    try {
      setIsGeneratingCode(true);
      
      // التحقق من آخر الأكواد المستخدمة التي تبدأ بـ SUP
      const supplierCodes = suppliers
        .map(s => s.supplier_code)
        .filter(code => code && code.startsWith('SUP'))
        .map(code => {
          // استخراج الرقم من الكود (مثلاً SUP001 سيكون 1)
          const match = code.match(/^SUP(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .sort((a, b) => b - a); // ترتيب تنازلي
      
      // الحصول على أعلى رقم وإضافة 1 له
      const nextNumber = supplierCodes.length > 0 ? supplierCodes[0] + 1 : 1;
      
      // تنسيق الرقم مع أصفار في البداية (مثلاً: 1 يصبح 001)
      const formattedNumber = nextNumber.toString().padStart(3, '0');
      const newCode = `SUP${formattedNumber}`;
      
      // تحديث البيانات
      const newData = { ...formData, supplier_code: newCode };
      setFormData(newData);
      onChange(newData);
      
      toast.success(`تم توليد كود المورد: ${newCode}`);
    } catch (error) {
      console.error('خطأ في توليد كود المورد:', error);
      toast.error('حدث خطأ أثناء توليد كود المورد');
    } finally {
      setIsGeneratingCode(false);
    }
  }, [formData, onChange, suppliers]);
  
  // Validate the form data - wrapped in useCallback to prevent infinite loops
  const validateForm = useCallback(() => {
    return !!formData.name && !!formData.supplier_code && !!formData.supplier_type_id;
  }, [formData.name, formData.supplier_code, formData.supplier_type_id]);
  
  // Update validity when validation result changes
  useEffect(() => {
    onValidityChange(validateForm());
  }, [validateForm, onValidityChange]);
  
  // Create memoized handlers to prevent recreating functions on each render
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const newData = { ...formData, [id]: value };
    setFormData(newData);
    onChange(newData);
  }, [formData, onChange]);
  
  const handleNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const parsedValue = value === '' ? undefined : Number(value);
    const newData = { ...formData, [id]: parsedValue };
    setFormData(newData);
    onChange(newData);
  }, [formData, onChange]);
  
  const handleCheckboxChange = useCallback((id: string, checked: boolean) => {
    const newData = { ...formData, [id]: checked };
    setFormData(newData);
    onChange(newData);
  }, [formData, onChange]);
  
  const handleSelectChange = useCallback((id: string, value: string) => {
    const parsedValue = value === '' ? undefined : Number(value);
    const newData = { ...formData, [id]: parsedValue };
    setFormData(newData);
    onChange(newData);
  }, [formData, onChange]);
  
  // معالجة تغيير الفئات المختارة
  const handleCategoriesChange = useCallback((selectedValues: string[]) => {
    setSelectedCategories(selectedValues);
    
    // تحديث formData.categories مع الفئات المختارة
    const selectedCategoryObjects = selectedValues.map(id => {
      const category = categories.find(cat => cat.id.toString() === id);
      return category ? {
        id: category.id,
        name: category.name,
        name_ar: category.name_ar
      } : {
        id,
        name: '',
        name_ar: ''
      };
    });
    
    const newData = { ...formData, categories: selectedCategoryObjects };
    setFormData(newData);
    onChange(newData);
  }, [formData, onChange, categories]);
  
  // Show loading state if reference data is loading
  if (referenceDataLoading) {
    return <div className="p-4 text-center">جاري تحميل البيانات...</div>;
  }
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">معلومات المورد الأساسية</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name_ar" className="block">
              <RequiredIndicator />
              اسم المورد (عربي)
            </Label>
            <Input
              id="name_ar"
              value={formData.name_ar || ''}
              onChange={handleTextChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="block">
              <RequiredIndicator />
              اسم المورد (انجليزي)
            </Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={handleTextChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_code" className="block">
              <RequiredIndicator />
              كود المورد
            </Label>
            <div className="flex gap-2">
              <Input
                id="supplier_code"
                value={formData.supplier_code || ''}
                onChange={handleTextChange}
                required
              />
              <button
                type="button"
                onClick={generateSupplierCode}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                title="توليد كود تلقائي"
                disabled={isGeneratingCode}
              >
                {isGeneratingCode ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري التوليد
                  </span>
                ) : "توليد كود"}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_type_id" className="block">
              <RequiredIndicator />
              نوع المورد
            </Label>
            <Select
              value={formData.supplier_type_id?.toString() || ''}
              onValueChange={(value) => handleSelectChange('supplier_type_id', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر نوع المورد" />
              </SelectTrigger>
              <SelectContent>
                {supplierTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.type_name_ar} ({type.type_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="contact_person_ar" className="block">
              شخص الاتصال الرئيسي (عربي)
            </Label>
            <Input
              id="contact_person_ar"
              value={formData.contact_person_ar || ''}
              onChange={handleTextChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_person" className="block">
              اسم المسؤول (انجليزي)
            </Label>
            <Input
              id="contact_person"
              value={formData.contact_person || ''}
              onChange={handleTextChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_job_title" className="block">
              وظيفة المسؤول
            </Label>
            <Input
              id="contact_job_title"
              value={formData.contact_job_title || ''}
              onChange={handleTextChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_phone" className="block">
              رقم الهاتف
            </Label>
            <Input
              id="contact_phone"
              value={formData.contact_phone || ''}
              onChange={handleTextChange}
              type="tel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_phone_secondary" className="block">
              رقم هاتف بديل
            </Label>
            <Input
              id="contact_phone_secondary"
              value={formData.contact_phone_secondary || ''}
              onChange={handleTextChange}
              type="tel"
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="block">
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              value={formData.email || ''}
              onChange={handleTextChange}
              type="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website" className="block">
              الموقع الإلكتروني
            </Label>
            <Input
              id="website"
              value={formData.website || ''}
              onChange={handleTextChange}
              type="url"
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="region_id" className="block">
              المنطقة
            </Label>
            <Select
              value={formData.region_id?.toString() || ''}
              onValueChange={(value) => handleSelectChange('region_id', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر المنطقة" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id.toString()}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="city" className="block">
              المدينة
            </Label>
            <Input
              id="city"
              value={formData.city || ''}
              onChange={handleTextChange}
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="address_ar" className="block">
              العنوان (عربي)
            </Label>
            <Input
              id="address_ar"
              value={formData.address_ar || ''}
              onChange={handleTextChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="block">
              العنوان (انجليزي)
            </Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={handleTextChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postal_code" className="block">
              الرمز البريدي
            </Label>
            <Input
              id="postal_code"
              value={formData.postal_code || ''}
              onChange={handleTextChange}
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="commercial_register" className="block">
              السجل التجاري
            </Label>
            <Input
              id="commercial_register"
              value={formData.commercial_register || ''}
              onChange={handleTextChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_number" className="block">
              الرقم الضريبي
            </Label>
            <Input
              id="tax_number"
              value={formData.tax_number || ''}
              onChange={handleTextChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vat_number" className="block">
              رقم ضريبة القيمة المضافة
            </Label>
            <Input
              id="vat_number"
              value={formData.vat_number || ''}
              onChange={handleTextChange}
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="categories" className="block">
              الفئات التي يتعامل معها المورد
            </Label>
            <MultiSelect
              id="categories"
              options={categories.map(category => ({
                label: category.name_ar || category.name,
                value: category.id.toString()
              }))}
              selected={selectedCategories}
              onChange={handleCategoriesChange}
              placeholder="اختر الفئات التي يتعامل معها المورد"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rating" className="block">
              التقييم (0-5)
            </Label>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rating" className="text-right">التقييم</Label>
              <Input id="rating" value={formData.rating?.toString() || ''} onChange={handleNumberChange} className="col-span-3" type="number" min="0" max="5" />
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="product_description" className="block">
              توصيف المنتجات
            </Label>
            <Input
              id="product_description"
              value={formData.product_description || ''}
              onChange={handleTextChange}
            />
          </div>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Switch
                id="is_active"
                checked={formData.is_active !== undefined ? formData.is_active : true}
                onCheckedChange={(checked) => handleCheckboxChange('is_active', checked as boolean)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                نشط
              </Label>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Switch
                id="is_approved"
                checked={formData.is_approved || false}
                onCheckedChange={(checked) => handleCheckboxChange('is_approved', checked as boolean)}
              />
              <Label htmlFor="is_approved" className="cursor-pointer">
                معتمد
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoTab; 