'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Trash2, PlusCircle, Edit } from 'lucide-react';
import { useAppSelector } from '@/store/index';
import { Product } from '@/domains/product-categories/services/productService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { useAppDispatch } from '@/store/hooks';
import { fetchCategories, fetchSubCategories } from '@/domains/product-categories/store/productCategoriesSlice';

// مكون الحقل الإلزامي
const RequiredIndicator = () => (
  <span className="text-red-500 mr-1">*</span>
);

// واجهة بيانات المنتج المعروض
export interface ProductOffering {
  id?: number;
  supplier_id?: string;
  product_id: string;
  purchase_price: number;
  minimum_quantity?: number;
  maximum_quantity?: number;
  preferred_quantity?: number;
  price_unit: string;
  payment_type_id?: number;
  payment_terms_days?: number;
  requires_deposit?: boolean;
  deposit_percentage?: number;
  quality_specifications?: string;
  purity_percentage?: number;
  moisture_content_max?: number;
  contamination_tolerance?: number;
  pickup_available?: boolean;
  delivery_available?: boolean;
  transportation_cost?: number;
  packaging_requirements?: string;
  contract_duration_months?: number;
  price_validity_days?: number;
  price_escalation_clause?: string;
  seasonal_price_variation?: boolean;
  priority_level?: number;
  is_exclusive_material?: boolean;
  is_active?: boolean;
  last_purchase_date?: string;
  last_price_update?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  notes?: string;
}

interface ProductOfferingsTabProps {
  initialData: ProductOffering[];
  supplierId?: string;
  onChange: (data: ProductOffering[]) => void;
  onValidityChange: (isValid: boolean) => void;
}

const ProductOfferingsTab: React.FC<ProductOfferingsTabProps> = ({
  initialData,
  supplierId,
  onChange,
  onValidityChange,
}) => {
  const { products, paymentTypes } = useAppSelector((state) => ({
    products: state.productCategories.products.data || [],
    paymentTypes: state.referenceData?.paymentTypes || []
  }));
  
  const dispatch = useAppDispatch();
  const { categories, subcategories } = useAppSelector(state => state.productCategories);

  const [offerings, setOfferings] = useState<ProductOffering[]>(initialData || []);
  const [editingOffering, setEditingOffering] = useState<ProductOffering | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // وحدات قياس الأسعار
  const priceUnits = ['طن', 'كيلوجرام', 'قطعة', 'متر مكعب', 'متر مربع', 'لتر'];
  
  // مستويات الأولوية
  const priorityLevels = [
    { id: 1, name: 'عادي' },
    { id: 2, name: 'مهم' },
    { id: 3, name: 'عاجل' }
  ];
  
  // التحقق من صحة البيانات
  useEffect(() => {
    // تعتبر البيانات صحيحة طالما أن كل عرض منتج له سعر شراء ووحدة سعر
    const isValid = offerings.every((offering) => 
      offering.product_id && 
      offering.purchase_price > 0 && 
      offering.price_unit
    );
    onValidityChange(isValid);
  }, [offerings, onValidityChange]);
  
  // تحديث البيانات الأولية عند تغييرها
  useEffect(() => {
    if (initialData) {
      setOfferings(initialData);
    }
  }, [initialData]);
  
  // إضافة عرض جديد
  const handleAddOffering = () => {
    const newOffering: ProductOffering = {
      product_id: '',
      purchase_price: 0,
      price_unit: 'طن',
      is_active: true,
      supplier_id: supplierId
    };
    
    setEditingOffering(newOffering);
    setIsAdding(true);
  };
  
  // تعديل عرض موجود
  const handleEditOffering = (offering: ProductOffering) => {
    setEditingOffering({...offering});
    setIsAdding(false);
  };
  
  // حذف عرض
  const handleDeleteOffering = (index: number) => {
    const updatedOfferings = [...offerings];
    updatedOfferings.splice(index, 1);
    setOfferings(updatedOfferings);
    onChange(updatedOfferings);
  };
  
  // حفظ العرض (إضافة أو تعديل)
  const handleSaveOffering = () => {
    if (!editingOffering) return;
    
    let updatedOfferings: ProductOffering[];
    
    if (isAdding) {
      // إضافة عرض جديد
      updatedOfferings = [...offerings, editingOffering];
    } else {
      // تعديل عرض موجود
      updatedOfferings = offerings.map(o => 
        o.id === editingOffering.id ? editingOffering : o
      );
    }
    
    setOfferings(updatedOfferings);
    onChange(updatedOfferings);
    setEditingOffering(null);
  };
  
  // إلغاء الإضافة أو التعديل
  const handleCancelEdit = () => {
    setEditingOffering(null);
  };
  
  // تغيير حقل في العرض قيد التعديل
  const handleFieldChange = (field: keyof ProductOffering, value: unknown) => {
    if (!editingOffering) return;
    
    setEditingOffering({
      ...editingOffering,
      [field]: value
    });
  };
  
  // الحصول على اسم المنتج من المعرف
  const getProductName = (productId: string) => {
    const product = products.find((p: Product) => p.id === productId);
    return product ? product.name : 'غير محدد';
  };

  // الحصول على اسم الفئة من معرف المنتج
  const getCategoryName = (productId: string) => {
    const product = products.find((p: Product) => p.id === productId);
    const category = categories.data?.find(cat => cat.id === product?.category_id);
    return category ? category.name : 'غير محدد';
  };

  // الحصول على اسم الفئة الفرعية من معرف المنتج
  const getSubcategoryName = (productId: string) => {
    const product = products.find((p: Product) => p.id === productId);
    const subcategory = subcategories.data?.find(sub => sub.id === product?.subcategory_id);
    return subcategory ? subcategory.name : 'غير محدد';
  };
  
  // الحصول على اسم نوع الدفع من المعرف
  const getPaymentTypeName = (paymentTypeId?: number) => {
    if (!paymentTypeId) return 'غير محدد';
    const paymentType = paymentTypes.find(t => t.id === paymentTypeId);
    return paymentType ? paymentType.type_name_ar : 'غير محدد';
  };
  
  return (
    <div className="space-y-6">
      {/* عرض قائمة المنتجات المعروضة */}
      {!editingOffering && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">المنتجات المعروضة</h3>
            <Button 
              variant="outline" 
              onClick={handleAddOffering}
              className="flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة منتج</span>
            </Button>
          </div>
          
          {offerings.length > 0 ? (
            <Table>
              <TableCaption>قائمة المنتجات المعروضة من المورد</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>المنتج</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الوحدة</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offerings.map((offering, index) => (
                  <TableRow key={offering.id || index}>
                    <TableCell>{getProductName(offering.product_id)}</TableCell>
                    <TableCell>{offering.purchase_price}</TableCell>
                    <TableCell>{offering.price_unit}</TableCell>
                    <TableCell>{getPaymentTypeName(offering.payment_type_id)}</TableCell>
                    <TableCell>{offering.is_active ? 'نشط' : 'غير نشط'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditOffering(offering)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteOffering(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="bg-gray-50 p-8 text-center rounded-md">
              <p className="text-gray-500">لا توجد منتجات معروضة بعد</p>
              <Button 
                variant="outline" 
                onClick={handleAddOffering}
                className="mt-4"
              >
                إضافة منتج الآن
              </Button>
            </div>
          )}
        </>
      )}
      
      {/* نموذج إضافة أو تعديل منتج معروض */}
      {editingOffering && (
        <div className="bg-gray-50 p-6 rounded-md">
          <h3 className="text-lg font-medium mb-4">
            {isAdding ? 'إضافة منتج جديد' : 'تعديل بيانات المنتج'}
          </h3>
          
          <form onSubmit={(e) => { e.preventDefault(); handleSaveOffering(); }} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* حقل المنتج */}
            <div className="space-y-2 col-span-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="product_id">المنتج <RequiredIndicator /></Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>اختر المنتج الذي ستقدم له عرض سعر.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Select
                value={editingOffering.product_id || ''}
                onValueChange={(value) => handleFieldChange('product_id', value)}
              >
                <SelectTrigger id="product_id">
                  <SelectValue placeholder="اختر منتجاً" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: Product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({getCategoryName(product.id)} - {getSubcategoryName(product.id)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* حقول الفئة والفئة الفرعية (للعرض فقط) */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="category">الفئة</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>الفئة يتم تحديدها تلقائيًا بناءً على المنتج المختار.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="category"
                value={getCategoryName(editingOffering.product_id)}
                readOnly
                disabled
              />
            </div>
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="subcategory">الفئة الفرعية</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>الفئة الفرعية يتم تحديدها تلقائيًا بناءً على المنتج المختار.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="subcategory"
                value={getSubcategoryName(editingOffering.product_id)}
                readOnly
                disabled
              />
            </div>

            {/* حقل السعر المقترح */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="purchase_price">السعر المقترح <RequiredIndicator /></Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>السعر المقترح للشراء بالوحدة المحددة.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="purchase_price"
                type="number"
                value={editingOffering.purchase_price || ''}
                onChange={(e) => handleFieldChange('purchase_price', parseFloat(e.target.value))}
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* حقل الكمية الدنيا */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="minimum_quantity">الحد الأدنى للكمية</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>الحد الأدنى للكمية المطلوبة في العرض.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="minimum_quantity"
                type="number"
                value={editingOffering.minimum_quantity || ''}
                onChange={(e) => handleFieldChange('minimum_quantity', parseInt(e.target.value))}
                min="0"
              />
            </div>

            {/* حقل الكمية القصوى */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="maximum_quantity">الحد الأقصى للكمية</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>الحد الأقصى للكمية المتاحة في العرض.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="maximum_quantity"
                type="number"
                value={editingOffering.maximum_quantity || ''}
                onChange={(e) => handleFieldChange('maximum_quantity', parseInt(e.target.value))}
                min="0"
              />
            </div>

            {/* حقل الكمية المفضلة */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="preferred_quantity">الكمية المفضلة</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>الكمية المفضلة للعرض.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="preferred_quantity"
                type="number"
                value={editingOffering.preferred_quantity || ''}
                onChange={(e) => handleFieldChange('preferred_quantity', parseInt(e.target.value))}
                min="0"
              />
            </div>

            {/* حقل الوحدة */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="price_unit">الوحدة <RequiredIndicator /></Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>وحدة قياس السعر (مثال: طن، كيلوجرام، قطعة).</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Select
                value={editingOffering.price_unit || ''}
                onValueChange={(value) => handleFieldChange('price_unit', value)}
              >
                <SelectTrigger id="price_unit">
                  <SelectValue placeholder="اختر وحدة" />
                </SelectTrigger>
                <SelectContent>
                  {priceUnits.map((unit) => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* حقل نوع الدفع */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="payment_type_id">نوع الدفع</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>اختر نوع الدفع المتاح لهذا العرض (مثال: نقداً، بالتقسيط).</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Select
                value={editingOffering.payment_type_id?.toString() || ''}
                onValueChange={(value) => handleFieldChange('payment_type_id', parseInt(value))}
              >
                <SelectTrigger id="payment_type_id">
                  <SelectValue placeholder="اختر نوع دفع" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>{type.type_name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* حقل أيام شروط الدفع */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="payment_terms_days">أيام شروط الدفع</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>عدد الأيام المسموح بها لدفع الفاتورة بعد الشراء.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="payment_terms_days"
                type="number"
                value={editingOffering.payment_terms_days || ''}
                onChange={(e) => handleFieldChange('payment_terms_days', parseInt(e.target.value))}
                min="0"
              />
            </div>

            {/* حقل يتطلب وديعة */}
            <div className="flex items-center space-x-2 col-span-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Checkbox
                      id="requires_deposit"
                      checked={editingOffering.requires_deposit || false}
                      onCheckedChange={(checked) => handleFieldChange('requires_deposit', checked)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>حدد إذا كان هذا العرض يتطلب وديعة مسبقة.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Label htmlFor="requires_deposit" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                يتطلب وديعة؟
              </Label>
            </div>

            {/* حقل نسبة الوديعة */}
            {editingOffering.requires_deposit && (
              <div className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="deposit_percentage">نسبة الوديعة (%)</Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>نسبة الوديعة المطلوبة من إجمالي قيمة العرض.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Input
                  id="deposit_percentage"
                  type="number"
                  value={editingOffering.deposit_percentage || ''}
                  onChange={(e) => handleFieldChange('deposit_percentage', parseFloat(e.target.value))}
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            )}

            {/* حقل مواصفات الجودة */}
            <div className="space-y-2 col-span-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="quality_specifications">مواصفات الجودة</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>أي مواصفات جودة خاصة للمنتج (مثال: درجة نقاء معينة).</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="quality_specifications"
                value={editingOffering.quality_specifications || ''}
                onChange={(e) => handleFieldChange('quality_specifications', e.target.value)}
              />
            </div>

            {/* حقل نسبة النقاء */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="purity_percentage">نسبة النقاء (%)</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>نسبة النقاء المئوية للمنتج.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="purity_percentage"
                type="number"
                value={editingOffering.purity_percentage || ''}
                onChange={(e) => handleFieldChange('purity_percentage', parseFloat(e.target.value))}
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            {/* حقل أقصى محتوى رطوبة */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="moisture_content_max">أقصى محتوى رطوبة (%)</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>الحد الأقصى لمحتوى الرطوبة المسموح به في المنتج.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="moisture_content_max"
                type="number"
                value={editingOffering.moisture_content_max || ''}
                onChange={(e) => handleFieldChange('moisture_content_max', parseFloat(e.target.value))}
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            {/* حقل تحمل التلوث */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="contamination_tolerance">تحمل التلوث (%)</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>النسبة المئوية القصوى للتلوث المسموح بها في المنتج.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="contamination_tolerance"
                type="number"
                value={editingOffering.contamination_tolerance || ''}
                onChange={(e) => handleFieldChange('contamination_tolerance', parseFloat(e.target.value))}
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            {/* حقول التوصيل والاستلام */}
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Checkbox
                      id="pickup_available"
                      checked={editingOffering.pickup_available || false}
                      onCheckedChange={(checked) => handleFieldChange('pickup_available', checked)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>حدد إذا كان يمكن للعميل استلام المنتج من المورد.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Label htmlFor="pickup_available" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                الاستلام متاح؟
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Checkbox
                      id="delivery_available"
                      checked={editingOffering.delivery_available || false}
                      onCheckedChange={(checked) => handleFieldChange('delivery_available', checked)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>حدد إذا كان المورد يوفر خدمة توصيل للمنتج.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Label htmlFor="delivery_available" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                التوصيل متاح؟
              </Label>
            </div>

            {/* حقل تكلفة النقل */}
            <div className="space-y-2 col-span-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="transportation_cost">تكلفة النقل</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>التكلفة التقديرية لنقل المنتج.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="transportation_cost"
                type="number"
                value={editingOffering.transportation_cost || ''}
                onChange={(e) => handleFieldChange('transportation_cost', parseFloat(e.target.value))}
                min="0"
                step="0.01"
              />
            </div>

            {/* حقل متطلبات التعبئة والتغليف */}
            <div className="space-y-2 col-span-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="packaging_requirements">متطلبات التعبئة والتغليف</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>أي متطلبات خاصة للتعبئة والتغليف (مثال: أكياس، حاويات).</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="packaging_requirements"
                value={editingOffering.packaging_requirements || ''}
                onChange={(e) => handleFieldChange('packaging_requirements', e.target.value)}
              />
            </div>

            {/* حقل مدة العقد بالشهور */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="contract_duration_months">مدة العقد (بالشهور)</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>مدة صلاحية العقد لهذا العرض بالشهور.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="contract_duration_months"
                type="number"
                value={editingOffering.contract_duration_months || ''}
                onChange={(e) => handleFieldChange('contract_duration_months', parseInt(e.target.value))}
                min="0"
              />
            </div>

            {/* حقل صلاحية السعر بالأيام */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="price_validity_days">صلاحية السعر (بالأيام)</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>عدد الأيام التي يظل فيها السعر المعروض صالحًا.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="price_validity_days"
                type="number"
                value={editingOffering.price_validity_days || ''}
                onChange={(e) => handleFieldChange('price_validity_days', parseInt(e.target.value))}
                min="0"
              />
            </div>

            {/* حقل بند تصعيد السعر */}
            <div className="space-y-2 col-span-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="price_escalation_clause">بند تصعيد السعر</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>أي شروط أو بنود خاصة بتصعيد السعر.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="price_escalation_clause"
                value={editingOffering.price_escalation_clause || ''}
                onChange={(e) => handleFieldChange('price_escalation_clause', e.target.value)}
              />
            </div>

            {/* حقل اختلاف السعر الموسمي */}
            <div className="flex items-center space-x-2 col-span-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Checkbox
                      id="seasonal_price_variation"
                      checked={editingOffering.seasonal_price_variation || false}
                      onCheckedChange={(checked) => handleFieldChange('seasonal_price_variation', checked)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>حدد إذا كان السعر يختلف بناءً على المواسم.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Label htmlFor="seasonal_price_variation" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                اختلاف السعر الموسمي؟
              </Label>
            </div>

            {/* حقل مستوى الأولوية */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="priority_level">مستوى الأولوية</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>مستوى أولوية هذا العرض.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Select
                value={editingOffering.priority_level?.toString() || ''}
                onValueChange={(value) => handleFieldChange('priority_level', parseInt(value))}
              >
                <SelectTrigger id="priority_level">
                  <SelectValue placeholder="اختر مستوى أولوية" />
                </SelectTrigger>
                <SelectContent>
                  {priorityLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id.toString()}>{level.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* حقل مادة حصرية */}
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Checkbox
                      id="is_exclusive_material"
                      checked={editingOffering.is_exclusive_material || false}
                      onCheckedChange={(checked) => handleFieldChange('is_exclusive_material', checked)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>حدد إذا كان هذا المنتج مادة حصرية لهذا المورد.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Label htmlFor="is_exclusive_material" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                مادة حصرية؟
              </Label>
            </div>

            {/* حقل نشط */}
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Checkbox
                      id="is_active"
                      checked={editingOffering.is_active || false}
                      onCheckedChange={(checked) => handleFieldChange('is_active', checked)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>حدد ما إذا كان هذا العرض نشطًا حاليًا ومتاحًا.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Label htmlFor="is_active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                نشط؟
              </Label>
            </div>

            {/* حقل تاريخ آخر شراء */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="last_purchase_date">تاريخ آخر شراء</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>تاريخ آخر مرة تم فيها شراء هذا المنتج من المورد.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="last_purchase_date"
                type="date"
                value={editingOffering.last_purchase_date?.split('T')[0] || ''}
                onChange={(e) => handleFieldChange('last_purchase_date', e.target.value)}
              />
            </div>

            {/* حقل آخر تحديث للسعر */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="last_price_update">آخر تحديث للسعر</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>تاريخ آخر تحديث لسعر هذا المنتج.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="last_price_update"
                type="date"
                value={editingOffering.last_price_update?.split('T')[0] || ''}
                onChange={(e) => handleFieldChange('last_price_update', e.target.value)}
              />
            </div>

            {/* حقل تاريخ بدء العقد */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="contract_start_date">تاريخ بدء العقد</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>تاريخ بدء سريان العقد لهذا العرض.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="contract_start_date"
                type="date"
                value={editingOffering.contract_start_date?.split('T')[0] || ''}
                onChange={(e) => handleFieldChange('contract_start_date', e.target.value)}
              />
            </div>

            {/* حقل تاريخ انتهاء العقد */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="contract_end_date">تاريخ انتهاء العقد</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>تاريخ انتهاء سريان العقد لهذا العرض.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="contract_end_date"
                type="date"
                value={editingOffering.contract_end_date?.split('T')[0] || ''}
                onChange={(e) => handleFieldChange('contract_end_date', e.target.value)}
              />
            </div>

            {/* حقل الملاحظات */}
            <div className="space-y-2 col-span-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="notes">ملاحظات</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>أي ملاحظات إضافية حول عرض السعر.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="notes"
                value={editingOffering.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
              />
            </div>
          </form>
          
          {/* أزرار الإجراءات */}
          <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-6">
            <Button variant="outline" onClick={handleCancelEdit}>
              إلغاء
            </Button>
            <Button onClick={handleSaveOffering}>
              حفظ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductOfferingsTab; 