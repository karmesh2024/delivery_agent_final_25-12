'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Checkbox } from '@/shared/ui/checkbox';
import { FiPlus, FiTrash2, FiEdit, FiCode, FiPrinter } from 'react-icons/fi';
import { toast } from 'sonner';
import Image from 'next/image';
import { qrCodeService } from '@/services/qrCodeService';
import { productCatalogService } from '@/services/productCatalogService';
import { Wizard } from '@/shared/components/Wizard';
import { supabase } from '@/lib/supabase';
import { getPublicImageUrl, uploadFile } from '@/lib/supabase';

// سيتم تحميل البيانات من قاعدة البيانات

const mockProductTypes = [
  { id: 1, name: 'ملابس' },
  { id: 2, name: 'إلكترونيات' },
  { id: 3, name: 'مواد غذائية' },
  { id: 4, name: 'أدوات منزلية' }
];

interface ProductFormData {
  warehouse_id: number | null;
  sku: string;
  product_code: string;
  name: string;
  brand: string;
  description: string;
  main_category_id: number | null;
  sub_category_id: number | null;
  product_type: string;
  unit_mode: 'weight' | 'volume' | 'count' | 'dimension';
  unit_id: number | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  color: string;
  size: string;
  gender: string;
  season: string;
  fabric_type: string;
  max_qty: number | null;
  min_qty: number | null;
  production_date: string;
  status: string;
  compliance_certificates: string;
  usage_warnings: string;
  child_safe: boolean;
  expiry_date: string;
  storage_location: string;
  storage_temperature: string;
  special_storage_conditions: string;
  stackable: boolean;
  max_stack_height: number | null;
  notes: string;
  images: File[];
  qr_code: string;
}

interface ProductCatalogFormWizardProps {
  productId?: number;
  initialData?: ProductCatalogItem;
}

export default function ProductCatalogForm({ productId, initialData }: ProductCatalogFormWizardProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!!productId);
  
  const [formData, setFormData] = useState<ProductFormData>({
    warehouse_id: null,
    sku: '',
    product_code: '',
    name: '',
    brand: '',
    description: '',
    main_category_id: null,
    sub_category_id: null,
    product_type: '',
    unit_mode: 'weight',
    unit_id: null,
    weight: null,
    length: null,
    width: null,
    height: null,
    color: '',
    size: '',
    gender: '',
    season: '',
    fabric_type: '',
    max_qty: null,
    min_qty: null,
    production_date: '',
    status: 'active',
    compliance_certificates: '',
    usage_warnings: '',
    child_safe: false,
    expiry_date: '',
    storage_location: '',
    storage_temperature: '',
    special_storage_conditions: '',
    stackable: false,
    max_stack_height: null,
    notes: '',
    images: [],
    qr_code: ''
  });

  const [showBrandDialog, setShowBrandDialog] = useState(false);
  const [showProductTypeDialog, setShowProductTypeDialog] = useState(false);
  const [showMainCategoryDialog, setShowMainCategoryDialog] = useState(false);
  const [showSubCategoryDialog, setShowSubCategoryDialog] = useState(false);
  const [newProductType, setNewProductType] = useState({ name: '' });
  const [newMainCategory, setNewMainCategory] = useState({ code: '', name: '' });
  const [newSubCategory, setNewSubCategory] = useState({ code: '', name: '', main_id: null as number | null });
  const [newBrand, setNewBrand] = useState({ name: '', description: '', logo: null as File | null });

  // البيانات المحملة من قاعدة البيانات
  const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([]);
  const [mainCategories, setMainCategories] = useState<{ id: number; code: string; name: string }[]>([]);
  const [subCategories, setSubCategories] = useState<{ id: number; code: string; name: string; main_id: number }[]>([]);
  const [units, setUnits] = useState<{ id: number; code: string; name: string }[]>([]);
  const [productTypes, setProductTypes] = useState<{ id: number; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string; logo_url?: string; logo_path?: string; description?: string }[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // تحميل البيانات الأولية عند التعديل
  useEffect(() => {
    const loadInitialData = async () => {
      if (initialData && isEditing) {
        // تحويل images من URLs إلى File objects (سيتم التعامل معها لاحقاً)
        const imagesArray: File[] = [];
        
        setFormData({
          warehouse_id: initialData.warehouse_id,
          sku: initialData.sku,
          product_code: initialData.product_code,
          name: initialData.name,
          brand: initialData.brand || '',
          description: initialData.description || '',
          main_category_id: initialData.main_category_id || null,
          sub_category_id: initialData.sub_category_id || null,
          product_type: '',
          unit_mode: initialData.unit_mode,
          unit_id: initialData.unit_id || null,
          weight: initialData.weight || null,
          length: initialData.length || null,
          width: initialData.width || null,
          height: initialData.height || null,
          color: initialData.color || '',
          size: initialData.size || '',
          gender: initialData.gender || '',
          season: initialData.season || '',
          fabric_type: initialData.fabric_type || '',
          max_qty: initialData.max_qty || null,
          min_qty: initialData.min_qty || null,
          production_date: initialData.production_date || '',
          status: initialData.status || 'active',
          compliance_certificates: initialData.compliance_certificates || '',
          usage_warnings: initialData.usage_warnings || '',
          child_safe: initialData.child_safe || false,
          expiry_date: initialData.expiry_date || '',
          storage_location: initialData.storage_location || '',
          storage_temperature: initialData.storage_temperature || '',
          special_storage_conditions: initialData.special_storage_conditions || '',
          stackable: initialData.stackable || false,
          max_stack_height: initialData.max_stack_height || null,
          notes: initialData.notes || '',
          images: imagesArray, // سيتم التعامل مع الصور الموجودة بشكل منفصل
          qr_code: initialData.qr_code || ''
        });

        // تحميل الفئات الفرعية بناءً على الفئة الرئيسية
        if (initialData.main_category_id) {
          try {
            const subCategoriesData = await productCatalogService.getSubCategories(initialData.main_category_id);
            setSubCategories(subCategoriesData);
          } catch (error) {
            console.error('خطأ في تحميل الفئات الفرعية:', error);
          }
        }
      }
    };

    loadInitialData();
  }, [initialData, isEditing]);

  // تحميل البيانات من قاعدة البيانات
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsDataLoading(true);
        
        // تحميل المخازن
        const warehousesData = await productCatalogService.getWarehouses();
        setWarehouses(warehousesData);
        
        // تحميل الفئات الرئيسية
        const mainCategoriesData = await productCatalogService.getMainCategories();
        setMainCategories(mainCategoriesData);
        
        // تحميل الوحدات
        const unitsData = await productCatalogService.getUnits();
        setUnits(unitsData);
        
        // تحميل أنواع المنتجات
        const productTypesData = await productCatalogService.getProductTypes();
        setProductTypes(productTypesData);
        
        // تحميل البراندز
        const brandsData = await productCatalogService.getBrands();
        setBrands(brandsData);
        
      } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        toast.error('حدث خطأ في تحميل البيانات');
      } finally {
        setIsDataLoading(false);
      }
    };

    loadData();
  }, []);

  // تحميل الفئات الفرعية عند تغيير الفئة الرئيسية
  useEffect(() => {
    const loadSubCategories = async () => {
      if (formData.main_category_id) {
        try {
          const subCategoriesData = await productCatalogService.getSubCategories(formData.main_category_id);
          setSubCategories(subCategoriesData);
        } catch (error) {
          console.error('خطأ في تحميل الفئات الفرعية:', error);
        }
      } else {
        setSubCategories([]);
      }
    };

    loadSubCategories();
  }, [formData.main_category_id]);

  const handleFormChange = useCallback((field: keyof ProductFormData, value: string | number | boolean | File[] | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // دالة خاصة لمعالجة النصوص
  const handleTextChange = useCallback((field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const generateCode = (prefix: string) => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  const generateSKU = useCallback(async () => {
    try {
      const sku = await productCatalogService.generateUniqueSKU();
      handleFormChange('sku', sku);
    } catch (error) {
      toast.error('فشل في توليد SKU جديد');
    }
  }, [handleFormChange]);

  const generateProductCode = useCallback(async () => {
    try {
      const code = await productCatalogService.generateUniqueProductCode();
      handleFormChange('product_code', code);
    } catch (error) {
      toast.error('فشل في توليد رقم المنتج');
    }
  }, [handleFormChange]);

  const generateMainCategoryCode = () => {
    const code = generateCode('CAT');
    setNewMainCategory(prev => ({ ...prev, code }));
    toast.success(`تم توليد كود الفئة: ${code}`);
    return code;
  };

  const generateSubCategoryCode = () => {
    const code = generateCode('SUB');
    setNewSubCategory(prev => ({ ...prev, code }));
    toast.success(`تم توليد كود الفئة الفرعية: ${code}`);
    return code;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const generateQR = async () => {
    try {
      if (!formData.sku || !formData.name) {
        toast.error('يرجى ملء SKU واسم المنتج أولاً');
        return;
      }

      console.log('بدء توليد QR Code...');
      console.log('بيانات النموذج:', {
        sku: formData.sku,
        name: formData.name,
        product_code: formData.product_code,
        warehouse_id: formData.warehouse_id,
        main_category_id: formData.main_category_id
      });

      const qrData = qrCodeService.createProductQRData({
        id: formData.product_code || formData.sku,
        name: formData.name,
        sku: formData.sku,
        warehouse: warehouses.find(w => w.id === formData.warehouse_id)?.name,
        category: mainCategories.find(c => c.id === formData.main_category_id)?.name,
        weight: formData.weight,
        volume: formData.unit_mode === 'volume' ? formData.weight : undefined,
        count: formData.unit_mode === 'count' ? formData.weight : undefined,
        status: formData.status
      });

      console.log('بيانات QR Code:', qrData);

      const qrCodeImage = await qrCodeService.generateQRCodeImage(qrData);
      
      console.log('تم توليد QR Code بنجاح:', qrCodeImage.substring(0, 50) + '...');
      
      // حفظ QR Code في النموذج
      handleFormChange('qr_code', qrCodeImage);
      
      // رسالة نجاح مختلفة حسب نوع QR Code
      const qrType = qrCodeImage.startsWith('data:image/svg') ? 'محلي' : 'محسن';
      toast.success(`تم توليد QR Code بنجاح (${qrType}) - جاهز للطباعة والمسح`);
    } catch (error) {
      console.error('خطأ في توليد QR Code:', error);
      toast.error(`فشل في توليد QR Code: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  };

  const printLabel = async () => {
    try {
      if (!formData.sku || !formData.name) {
        toast.error('يرجى ملء SKU واسم المنتج أولاً');
        return;
      }

      const qrData = qrCodeService.createProductQRData({
        id: formData.product_code || formData.sku,
        name: formData.name,
        sku: formData.sku,
        warehouse: mockWarehouses.find(w => w.id === formData.warehouse_id)?.name,
        category: mockMainCategories.find(c => c.id === formData.main_category_id)?.name,
        weight: formData.weight,
        volume: formData.unit_mode === 'volume' ? formData.weight : undefined,
        count: formData.unit_mode === 'count' ? formData.weight : undefined,
        status: formData.status
      });

      await qrCodeService.printLabel(qrData);
      toast.success('تم إرسال الملصق للطباعة');
    } catch (error) {
      toast.error('فشل في طباعة الملصق');
    }
  };


  const addProductType = async () => {
    if (newProductType.name.trim()) {
      try {
        // إضافة نوع المنتج إلى قاعدة البيانات
        const result = await productCatalogService.addProductType(newProductType.name);
        if (result) {
          // تحديث قائمة أنواع المنتجات
          setProductTypes(prev => [...prev, result]);
          toast.success(`تم إضافة نوع المنتج: ${newProductType.name}`);
          setNewProductType({ name: '' });
          setShowProductTypeDialog(false);
        }
      } catch (error) {
        toast.error('فشل في إضافة نوع المنتج');
      }
    }
  };

  const addBrand = async () => {
    if (newBrand.name.trim()) {
      try {
        // إضافة البراند إلى قاعدة البيانات مع رفع الصورة
        const result = await productCatalogService.addBrand(newBrand.name, newBrand.logo || undefined, newBrand.description);
        if (result) {
          // تحديث قائمة البراندز
          setBrands(prev => [...prev, result]);
          
          // رسالة نجاح مختلفة حسب وجود الصورة
          if (newBrand.logo && result.logo_url) {
            toast.success(`تم إضافة البراند "${newBrand.name}" مع الصورة بنجاح`);
          } else if (newBrand.logo && !result.logo_url) {
            toast.success(`تم إضافة البراند "${newBrand.name}" بنجاح (بدون صورة)`);
          } else {
            toast.success(`تم إضافة البراند "${newBrand.name}" بنجاح`);
          }
          
          setNewBrand({ name: '', description: '', logo: null });
          setShowBrandDialog(false);
        } else {
          toast.error('فشل في إضافة البراند');
        }
      } catch (error) {
        console.error('خطأ في إضافة البراند:', error);
        toast.error('فشل في إضافة البراند');
      }
    } else {
      toast.error('يرجى إدخال اسم البراند');
    }
  };

  const handleAddMainCategory = async () => {
    if (newMainCategory.name.trim() && newMainCategory.code.trim()) {
      try {
        const result = await productCatalogService.addMainCategory(newMainCategory.code, newMainCategory.name);
        if (result) {
          // تحديث قائمة الفئات الرئيسية
          setMainCategories(prev => [...prev, result]);
          toast.success(`تم إضافة الفئة الأساسية: ${newMainCategory.name}`);
          setNewMainCategory({ code: '', name: '' });
          setShowMainCategoryDialog(false);
        }
      } catch (error) {
        toast.error('فشل في إضافة الفئة الأساسية');
      }
    }
  };

  const handleAddSubCategory = async () => {
    if (newSubCategory.name.trim() && newSubCategory.code.trim() && newSubCategory.main_id) {
      try {
        const result = await productCatalogService.addSubCategory(newSubCategory.code, newSubCategory.name, newSubCategory.main_id);
        if (result) {
          // تحديث قائمة الفئات الفرعية
          setSubCategories(prev => [...prev, result]);
          toast.success(`تم إضافة الفئة الفرعية: ${newSubCategory.name}`);
          setNewSubCategory({ code: '', name: '', main_id: null });
          setShowSubCategoryDialog(false);
        }
      } catch (error) {
        toast.error('فشل في إضافة الفئة الفرعية');
      }
    }
  };

  const filteredSubCategories = subCategories;

  const canGoNext = () => {
    // تم نقل منطق التحقق إلى مكون Wizard
    return true;
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      // رفع الصور إلى Supabase Storage
      const uploadedImageUrls: string[] = [];
      
      if (formData.images && formData.images.length > 0) {
        toast.info('جاري رفع الصور...');
        
        for (const imageFile of formData.images) {
          try {
            const bucketName = 'product-images';
            const folderPath = `catalog-products/${formData.sku || 'temp'}`;
            const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const fileName = `${Date.now()}-${sanitizedFileName}`;

            const { path, error: uploadError } = await uploadFile(bucketName, imageFile, folderPath, fileName);

            if (uploadError) {
              console.error('خطأ في رفع الصورة:', uploadError);
              toast.error(`فشل رفع صورة: ${imageFile.name}`);
              continue;
            }

            if (path) {
              const publicUrl = getPublicImageUrl(bucketName, path);
              if (publicUrl) {
                uploadedImageUrls.push(publicUrl);
              }
            }
          } catch (error) {
            console.error('خطأ في رفع الصورة:', error);
            toast.error(`فشل رفع صورة: ${imageFile.name}`);
          }
        }
        
        if (uploadedImageUrls.length > 0) {
          toast.success(`تم رفع ${uploadedImageUrls.length} صورة بنجاح`);
        }
      }

      const productData: Omit<ProductCatalogItem, 'id' | 'created_at'> = {
        warehouse_id: formData.warehouse_id,
        sku: formData.sku,
        product_code: formData.product_code,
        name: formData.name,
        brand: formData.brand || undefined,
        description: formData.description || undefined,
        main_category_id: formData.main_category_id || undefined,
        sub_category_id: formData.sub_category_id || undefined,
        unit_mode: formData.unit_mode,
        unit_id: formData.unit_id || undefined,
        weight: formData.weight || undefined,
        length: formData.length || undefined,
        width: formData.width || undefined,
        height: formData.height || undefined,
        color: formData.color || undefined,
        size: formData.size || undefined,
        gender: formData.gender || undefined,
        season: formData.season || undefined,
        fabric_type: formData.fabric_type || undefined,
        max_qty: formData.max_qty || undefined,
        min_qty: formData.min_qty || undefined,
        production_date: formData.production_date || undefined,
        status: formData.status || 'active',
        compliance_certificates: formData.compliance_certificates || undefined,
        usage_warnings: formData.usage_warnings || undefined,
        child_safe: formData.child_safe || false,
        expiry_date: formData.expiry_date || undefined,
        storage_location: formData.storage_location || undefined,
        storage_temperature: formData.storage_temperature || undefined,
        special_storage_conditions: formData.special_storage_conditions || undefined,
        stackable: formData.stackable || false,
        max_stack_height: formData.max_stack_height || undefined,
        notes: formData.notes || undefined,
        images: uploadedImageUrls // حفظ URLs الصور المرفوعة
      };

      let result: ProductCatalogItem | null = null;
      
      if (isEditing && productId) {
        // تحديث المنتج
        result = await productCatalogService.updateProduct(productId, productData);
      if (result) {
          toast.success('تم تحديث المنتج بنجاح');
        }
      } else {
        // إضافة منتج جديد
        result = await productCatalogService.addProduct(productData);
        if (result) {
          toast.success('تم إضافة المنتج بنجاح');
        }
      }
      
      if (result && !isEditing) {
        // إعادة تعيين النموذج فقط عند الإضافة
        setFormData({
          warehouse_id: null,
          sku: '',
          product_code: '',
          name: '',
          brand: '',
          description: '',
          main_category_id: null,
          sub_category_id: null,
          product_type: '',
          unit_mode: 'weight',
          unit_id: null,
          weight: null,
          length: null,
          width: null,
          height: null,
          color: '',
          size: '',
          gender: '',
          season: '',
          fabric_type: '',
          max_qty: null,
          min_qty: null,
          production_date: '',
          status: 'active',
          compliance_certificates: '',
          usage_warnings: '',
          child_safe: false,
          expiry_date: '',
          storage_location: '',
          storage_temperature: '',
          special_storage_conditions: '',
          stackable: false,
          max_stack_height: null,
          notes: '',
          images: []
        });
        // تم إعادة تعيين النموذج
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ المنتج');
    } finally {
      setIsLoading(false);
    }
  };

  // مكونات الخطوات مع useMemo لمنع إعادة الإنشاء
  const BasicInfoStep = useMemo(() => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="warehouse">اسم المخزن</Label>
          <Select
            value={formData.warehouse_id?.toString() || ''}
            onValueChange={(value) => handleFormChange('warehouse_id', Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر المخزن" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map(warehouse => (
                <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sku">SKU</Label>
          <div className="flex gap-2">
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => handleTextChange('sku', e.target.value)}
              placeholder="رقم المنتج الفريد"
            />
            <Button onClick={generateSKU} variant="outline">
              توليد
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="product_code">رقم المنتج</Label>
          <div className="flex gap-2">
            <Input
              id="product_code"
              value={formData.product_code}
              onChange={(e) => handleTextChange('product_code', e.target.value)}
              placeholder="رقم المنتج"
            />
            <Button onClick={generateProductCode} variant="outline">
              توليد
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="name">اسم المنتج</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleTextChange('name', e.target.value)}
            placeholder="اسم المنتج"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">وصف المنتج</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleTextChange('description', e.target.value)}
          placeholder="وصف تفصيلي للمنتج"
          rows={3}
        />
      </div>
    </div>
  ), [formData, warehouses, handleFormChange, handleTextChange, generateSKU, generateProductCode]);

  const CategoryStep = useMemo(() => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="main_category">الفئة الأساسية</Label>
          <div className="flex gap-2">
            <Select
              value={formData.main_category_id?.toString() || ''}
              onValueChange={(value) => handleFormChange('main_category_id', Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة الأساسية" />
              </SelectTrigger>
            <SelectContent>
              {mainCategories.map(category => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
            </Select>
            <Button onClick={generateMainCategoryCode} variant="outline">
              توليد كود
            </Button>
            <Button onClick={() => setShowMainCategoryDialog(true)} variant="outline">
              <FiPlus />
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="sub_category">الفئة الفرعية</Label>
          <div className="flex gap-2">
            <Select
              value={formData.sub_category_id?.toString() || ''}
              onValueChange={(value) => handleFormChange('sub_category_id', Number(value))}
              disabled={!formData.main_category_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة الفرعية" />
              </SelectTrigger>
              <SelectContent>
                {filteredSubCategories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={generateSubCategoryCode} variant="outline">
              توليد كود
            </Button>
            <Button onClick={() => setShowSubCategoryDialog(true)} variant="outline">
              <FiPlus />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="product_type">نوع المنتج</Label>
          <div className="flex gap-2">
            <Select
              value={formData.product_type}
              onValueChange={(value) => handleFormChange('product_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع المنتج" />
              </SelectTrigger>
              <SelectContent>
                {productTypes.map(type => (
                  <SelectItem key={type.id} value={type.name}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowProductTypeDialog(true)} variant="outline">
              <FiPlus />
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="brand">البراند</Label>
          <div className="flex gap-2">
            <Select
              value={formData.brand}
              onValueChange={(value) => handleFormChange('brand', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر البراند" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.name}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowBrandDialog(true)} variant="outline">
              <FiPlus />
            </Button>
          </div>
        </div>
      </div>
    </div>
  ), [formData, mainCategories, filteredSubCategories, handleFormChange, generateMainCategoryCode, generateSubCategoryCode, setShowMainCategoryDialog, setShowSubCategoryDialog]);

  const UnitStep = useMemo(() => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="unit_mode">نظام الوحدة</Label>
        <Select
          value={formData.unit_mode}
          onValueChange={(value: 'weight' | 'volume' | 'count' | 'dimension') => handleFormChange('unit_mode', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر نظام الوحدة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weight">بالوزن (كيلو/لتر)</SelectItem>
            <SelectItem value="volume">بالحجم (م³/لتر)</SelectItem>
            <SelectItem value="count">بالعدد (قطعة)</SelectItem>
            <SelectItem value="dimension">بالقياس (طول × عرض × ارتفاع)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.unit_mode === 'weight' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weight">الوزن</Label>
            <Input
              id="weight"
              type="number"
              value={formData.weight || ''}
              onChange={(e) => handleFormChange('weight', Number(e.target.value))}
              placeholder="الوزن"
            />
          </div>
          <div>
            <Label htmlFor="unit">الوحدة</Label>
            <Select
              value={formData.unit_id?.toString() || ''}
              onValueChange={(value) => handleFormChange('unit_id', Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الوحدة" />
              </SelectTrigger>
              <SelectContent>
                {units.map(unit => (
                  <SelectItem key={unit.id} value={unit.id.toString()}>
                    {unit.name} ({unit.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {formData.unit_mode === 'dimension' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="length">الطول (متر)</Label>
            <Input
              id="length"
              type="number"
              value={formData.length || ''}
              onChange={(e) => handleFormChange('length', Number(e.target.value))}
              placeholder="الطول"
            />
          </div>
          <div>
            <Label htmlFor="width">العرض (متر)</Label>
            <Input
              id="width"
              type="number"
              value={formData.width || ''}
              onChange={(e) => handleFormChange('width', Number(e.target.value))}
              placeholder="العرض"
            />
          </div>
          <div>
            <Label htmlFor="height">الارتفاع (متر)</Label>
            <Input
              id="height"
              type="number"
              value={formData.height || ''}
              onChange={(e) => handleFormChange('height', Number(e.target.value))}
              placeholder="الارتفاع"
            />
          </div>
        </div>
      )}

      {formData.product_type === 'ملابس' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="size">المقاس</Label>
            <Select
              value={formData.size}
              onValueChange={(value) => handleFormChange('size', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المقاس" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="XS">XS</SelectItem>
                <SelectItem value="S">S</SelectItem>
                <SelectItem value="M">M</SelectItem>
                <SelectItem value="L">L</SelectItem>
                <SelectItem value="XL">XL</SelectItem>
                <SelectItem value="XXL">XXL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="gender">الجنس</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleFormChange('gender', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الجنس" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="رجالي">رجالي</SelectItem>
                <SelectItem value="حريمي">حريمي</SelectItem>
                <SelectItem value="أطفال">أطفال</SelectItem>
                <SelectItem value="للجنسين">للجنسين</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="season">الموسم</Label>
            <Select
              value={formData.season}
              onValueChange={(value) => handleFormChange('season', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الموسم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="صيفي">صيفي</SelectItem>
                <SelectItem value="شتوي">شتوي</SelectItem>
                <SelectItem value="متعدد المواسم">متعدد المواسم</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="fabric_type">نوع القماش</Label>
            <Input
              id="fabric_type"
              value={formData.fabric_type}
              onChange={(e) => handleFormChange('fabric_type', e.target.value)}
              placeholder="نوع القماش"
            />
          </div>
        </div>
      )}
    </div>
  ), [formData, units, handleFormChange]);

  const QuantityStep = useMemo(() => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="max_qty">الحد الأقصى للكمية</Label>
          <Input
            id="max_qty"
            type="number"
            value={formData.max_qty || ''}
            onChange={(e) => handleFormChange('max_qty', Number(e.target.value))}
            placeholder="الحد الأقصى"
          />
        </div>
        <div>
          <Label htmlFor="min_qty">الحد الأدنى للكمية</Label>
          <Input
            id="min_qty"
            type="number"
            value={formData.min_qty || ''}
            onChange={(e) => handleFormChange('min_qty', Number(e.target.value))}
            placeholder="الحد الأدنى"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="storage_location">موقع التخزين داخل المخزن</Label>
          <Input
            id="storage_location"
            value={formData.storage_location}
            onChange={(e) => handleFormChange('storage_location', e.target.value)}
            placeholder="رف، صف، عمود"
          />
        </div>
        <div>
          <Label htmlFor="storage_temperature">درجة حرارة التخزين المطلوبة</Label>
          <Input
            id="storage_temperature"
            value={formData.storage_temperature}
            onChange={(e) => handleFormChange('storage_temperature', e.target.value)}
            placeholder="درجة الحرارة"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="special_storage_conditions">شروط التخزين الخاصة</Label>
        <Textarea
          id="special_storage_conditions"
          value={formData.special_storage_conditions}
          onChange={(e) => handleFormChange('special_storage_conditions', e.target.value)}
          placeholder="شروط التخزين الخاصة"
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="stackable"
            checked={formData.stackable}
            onCheckedChange={(checked) => handleFormChange('stackable', checked)}
          />
          <Label htmlFor="stackable">قابل للتكديس</Label>
        </div>
        {formData.stackable && (
          <div>
            <Label htmlFor="max_stack_height">الحد الأقصى لارتفاع التكديس (متر)</Label>
            <Input
              id="max_stack_height"
              type="number"
              value={formData.max_stack_height || ''}
              onChange={(e) => handleFormChange('max_stack_height', Number(e.target.value))}
              placeholder="الحد الأقصى للارتفاع"
            />
          </div>
        )}
      </div>
    </div>
  ), [formData, handleFormChange]);

  const StatusStep = useMemo(() => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="production_date">تاريخ الإنتاج</Label>
          <Input
            id="production_date"
            type="date"
            value={formData.production_date}
            onChange={(e) => handleFormChange('production_date', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="expiry_date">تاريخ انتهاء الصلاحية</Label>
          <Input
            id="expiry_date"
            type="date"
            value={formData.expiry_date}
            onChange={(e) => handleFormChange('expiry_date', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="status">حالة المنتج</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleFormChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="inactive">متوقف</SelectItem>
              <SelectItem value="coming_soon">قادم قريباً</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="child_safe"
          checked={formData.child_safe}
          onCheckedChange={(checked) => handleFormChange('child_safe', checked)}
        />
        <Label htmlFor="child_safe">مناسب للأطفال</Label>
      </div>

      <div>
        <Label htmlFor="compliance_certificates">شهادات المطابقة</Label>
        <Textarea
          id="compliance_certificates"
          value={formData.compliance_certificates}
          onChange={(e) => handleFormChange('compliance_certificates', e.target.value)}
          placeholder="شهادات المطابقة والمواصفات"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="usage_warnings">تحذيرات الاستخدام</Label>
        <Textarea
          id="usage_warnings"
          value={formData.usage_warnings}
          onChange={(e) => handleFormChange('usage_warnings', e.target.value)}
          placeholder="تحذيرات الاستخدام"
          rows={2}
        />
      </div>
    </div>
  ), [formData, handleFormChange]);

  const ImagesStep = useMemo(() => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="images">رفع الصور</Label>
        <Input
          id="images"
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="mt-2"
        />
      </div>

      {formData.images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {formData.images.map((file, index) => (
            <div key={index} className="relative border rounded-lg p-2">
              <div className="w-full h-32 relative">
                <Image
                  src={URL.createObjectURL(file)}
                  alt={`preview-${index}`}
                  fill
                  className="object-cover rounded"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0"
                onClick={() => removeImage(index)}
              >
                <FiTrash2 size={12} />
              </Button>
              <div className="text-xs mt-1 truncate">{file.name}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4">
        <Button onClick={generateQR} variant="outline">
          <FiCode className="mr-2" />
          توليد QR Code
        </Button>
        <Button onClick={printLabel} variant="outline">
          <FiPrinter className="mr-2" />
          طباعة الملصق
        </Button>
      </div>

      {formData.qr_code && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-3">QR Code</h4>
          <div className="flex justify-center">
            <div className="relative">
              <img 
                src={formData.qr_code} 
                alt="QR Code" 
                className="w-48 h-48 border rounded shadow-lg"
                style={{
                  imageRendering: 'pixelated',
                  imageRendering: '-moz-crisp-edges',
                  imageRendering: 'crisp-edges'
                }}
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                ✓
              </div>
            </div>
          </div>
          <div className="mt-3 text-center text-sm text-gray-600">
            QR Code جاهز للطباعة والمسح
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="notes">ملاحظات</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleFormChange('notes', e.target.value)}
          placeholder="ملاحظات إضافية"
          rows={3}
        />
      </div>
    </div>
  ), [formData, handleImageUpload, handleTextChange]);

  const steps = [
    {
      title: 'المعلومات الأساسية',
      content: BasicInfoStep,
      isValid: (data: ProductFormData) => {
        if (!data.warehouse_id || !data.sku || !data.product_code || !data.name) {
          toast.error('يرجى ملء جميع الحقول الأساسية.');
          return false;
        }
        return true;
      }
    },
    {
      title: 'التصنيف',
      content: CategoryStep,
      isValid: (data: ProductFormData) => {
        if (!data.main_category_id || !data.product_type) {
          toast.error('يرجى اختيار الفئة الرئيسية ونوع المنتج.');
          return false;
        }
        return true;
      }
    },
    {
      title: 'نظام الوحدة والقياسات',
      content: UnitStep,
      isValid: (data: ProductFormData) => {
        if (!data.unit_mode) {
          toast.error('يرجى اختيار نظام الوحدة.');
          return false;
        }
        return true;
      }
    },
    {
      title: 'الكمية والتخزين',
      content: QuantityStep,
      isValid: (data: ProductFormData) => {
        if (!data.max_qty || !data.min_qty) {
          toast.error('يرجى تحديد الحد الأقصى والأدنى للكمية.');
          return false;
        }
        return true;
      }
    },
    {
      title: 'التواريخ والحالة',
      content: StatusStep,
      isValid: (data: ProductFormData) => {
        return true;
      }
    },
    {
      title: 'الصور والملاحظات',
      content: ImagesStep,
      isValid: (data: ProductFormData) => {
        return true;
      }
    }
  ];

  return (
    <div className="space-y-6">
      <Wizard
        steps={steps}
        formData={formData}
        onFinish={handleFinish}
        isLoading={isLoading}
      />

      {/* Dialogs */}
      {/* Dialog إضافة براند */}
      {showBrandDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">إضافة براند جديد</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="brand_name">اسم البراند</Label>
                <Input
                  id="brand_name"
                  value={newBrand.name}
                  onChange={(e) => setNewBrand(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="اسم البراند"
                />
              </div>
              <div>
                <Label htmlFor="brand_description">وصف البراند</Label>
                <Textarea
                  id="brand_description"
                  value={newBrand.description}
                  onChange={(e) => setNewBrand(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف البراند (اختياري)"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="brand_logo">شعار البراند</Label>
                <Input
                  id="brand_logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setNewBrand(prev => ({ ...prev, logo: file }));
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowBrandDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={addBrand}>إضافة</Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog إضافة نوع منتج */}
      {showProductTypeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">إضافة نوع منتج جديد</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product_type_name">اسم نوع المنتج</Label>
                <Input
                  id="product_type_name"
                  value={newProductType.name}
                  onChange={(e) => setNewProductType(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="اسم نوع المنتج"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowProductTypeDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={addProductType}>إضافة</Button>
            </div>
          </div>
        </div>
      )}

      {/* حوار إضافة فئة أساسية جديدة */}
      {showMainCategoryDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">إضافة فئة أساسية جديدة</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="main_category_code">كود الفئة</Label>
                <div className="flex gap-2">
                  <Input
                    id="main_category_code"
                    value={newMainCategory.code}
                    onChange={(e) => setNewMainCategory(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="مثال: CAT-001"
                  />
                  <Button onClick={generateMainCategoryCode} variant="outline" type="button">
                    توليد
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="main_category_name">اسم الفئة</Label>
                <Input
                  id="main_category_name"
                  value={newMainCategory.name}
                  onChange={(e) => setNewMainCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: إلكترونيات"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowMainCategoryDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddMainCategory}>إضافة</Button>
            </div>
          </div>
        </div>
      )}

      {/* حوار إضافة فئة فرعية جديدة */}
      {showSubCategoryDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">إضافة فئة فرعية جديدة</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sub_category_main">الفئة الأساسية</Label>
                <Select value={newSubCategory.main_id?.toString() || ''} onValueChange={(value) => setNewSubCategory(prev => ({ ...prev, main_id: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة الأساسية" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainCategories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sub_category_code">كود الفئة الفرعية</Label>
                <div className="flex gap-2">
                  <Input
                    id="sub_category_code"
                    value={newSubCategory.code}
                    onChange={(e) => setNewSubCategory(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="مثال: SUB-001"
                  />
                  <Button onClick={generateSubCategoryCode} variant="outline" type="button">
                    توليد
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="sub_category_name">اسم الفئة الفرعية</Label>
                <Input
                  id="sub_category_name"
                  value={newSubCategory.name}
                  onChange={(e) => setNewSubCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: هواتف ذكية"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowSubCategoryDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddSubCategory}>إضافة</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
