"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { CustomDialog } from '@/shared/ui/custom-dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { useToast } from '@/shared/ui/use-toast';
import { 
  createProduct,
  updateProduct,
  fetchProductById,
  fetchProductsBySubcategory
} from '@/domains/product-categories/store/productCategoriesSlice';
import { Product, productService } from '@/domains/product-categories/services/productService';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

interface ProductFormProps {
  subcategoryId?: string;
  categoryId?: string;
  productId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  subcategoryId: propSubcategoryId,
  categoryId: propCategoryId,
  productId,
  isOpen,
  onClose
}) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { loading } = useAppSelector(state => state.productCategories.products);
  const { selectedProduct } = useAppSelector(state => state.productCategories);
  const params = useParams();
  const router = useRouter();
  
  // استخدام المعلمات من الخصائص أو من useParams
  const categoryId = propCategoryId || (params?.categoryId as string);
  const subcategoryId = propSubcategoryId || (params?.subcategoryId as string);
  const isEditing = !!productId;

  const [formData, setFormData] = useState<Omit<Product, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    description: '',
    category_id: categoryId,
    subcategory_id: subcategoryId,
    image_url: null,
    weight: 0,
    price: 0,
    quantity: 0,
    points: 0,
    initial_points: 0,
    // الوضع الافتراضي: النقاط والتسعير بالكيلو
    points_mode: 'per_kg',
    pricing_mode: 'per_kg',
    is_onboarding_featured: false
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // القيمة المدخلة للوزن (قد تكون جرام إذا < 1 أو كجم إذا >= 1)
  const [weightInput, setWeightInput] = useState<number>(0);

  // إعادة تعيين البيانات عند إغلاق النموذج
  useEffect(() => {
    if (!isOpen) {
      setWeightInput(0);
      setFormData({
        name: '',
        description: '',
        category_id: categoryId,
        subcategory_id: subcategoryId,
        image_url: null,
        weight: 0,
        price: 0,
        quantity: 0,
        points: 0,
        initial_points: 0,
        points_mode: 'per_kg',
        pricing_mode: 'per_kg',
        is_onboarding_featured: false
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [isOpen, categoryId, subcategoryId]);

  // جلب بيانات المنتج في حالة التعديل
  useEffect(() => {
    if (isEditing && productId && isOpen) {
      dispatch(fetchProductById(productId));
    }
  }, [dispatch, isEditing, productId, isOpen]);

  // تحديث البيانات عند جلب المنتج
  useEffect(() => {
    if (isEditing && selectedProduct) {
      setFormData({
        name: selectedProduct.name,
        description: selectedProduct.description || '',
        category_id: selectedProduct.category_id || categoryId,
        subcategory_id: selectedProduct.subcategory_id || subcategoryId,
        image_url: selectedProduct.image_url,
        weight: selectedProduct.weight,
        price: selectedProduct.price,
        quantity: selectedProduct.quantity,
        points: selectedProduct.points,
        initial_points: selectedProduct.initial_points,
        points_mode: (selectedProduct as any).points_mode || 'per_kg',
        pricing_mode:
          (selectedProduct as any).pricing_mode ||
          (selectedProduct as any).points_mode ||
          'per_kg',
        is_onboarding_featured: selectedProduct.is_onboarding_featured || false
      });

      // عرض الوزن: إذا كان < 1 كجم، عرضه بالجرام، وإلا عرضه بالكجم
      if (selectedProduct.weight && selectedProduct.weight < 1) {
        setWeightInput(selectedProduct.weight * 1000); // تحويل إلى جرام للعرض
      } else {
        setWeightInput(selectedProduct.weight || 0); // عرض بالكجم
      }

      if (selectedProduct.image_url) {
        setImagePreview(selectedProduct.image_url);
      }
    } else {
      // إعادة تعيين الوزن عند فتح النموذج للإضافة
      setWeightInput(0);
    }
  }, [selectedProduct, isEditing, categoryId, subcategoryId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // التعامل مع الوزن بشكل خاص
    if (name === 'weight') {
      const inputValue = parseFloat(value) || 0;
      setWeightInput(inputValue);
      
      // إذا كانت القيمة < 1، تعتبر جرام → تحويل إلى كجم
      // إذا كانت القيمة >= 1، تعتبر كجم → حفظ كما هي
      if (inputValue < 1 && inputValue > 0) {
        // جرام: تحويل إلى كجم
        setFormData({
          ...formData,
          weight: inputValue / 1000
        });
      } else {
        // كجم: حفظ كما هي
        setFormData({
          ...formData,
          weight: inputValue
        });
      }
    } else if (['price', 'quantity', 'points', 'initial_points'].includes(name)) {
      // تحويل القيم الرقمية الأخرى
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // إنشاء معاينة للصورة
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // التحقق من وجود subcategory_id و category_id
      const finalSubcategoryId = subcategoryId || formData.subcategory_id;
      const finalCategoryId = categoryId || formData.category_id;

      if (!finalSubcategoryId) {
        toast({
          title: "خطأ",
          description: "معرف الفئة الفرعية مطلوب",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      let finalImageUrl = formData.image_url;

      // رفع الصورة إذا تم اختيارها
      if (imageFile) {
        finalImageUrl = await productService.uploadProductImage(imageFile);
      }

      const productData = {
        ...formData,
        image_url: finalImageUrl,
        subcategory_id: finalSubcategoryId,
        // category_id في waste_data_admin يشير إلى جدول categories (UUID) وليس waste_main_categories
        // لذلك نجعله null لأن المنتج مرتبط بالفئة الفرعية فقط
        category_id: null,
      };

      console.log('Product data being sent:', productData);

      // إنشاء أو تحديث المنتج
      if (isEditing && productId) {
        await dispatch(updateProduct({ productId, product: productData })).unwrap();
        toast({
          title: "تم بنجاح",
          description: "تم تحديث المنتج بنجاح",
        });
      } else {
        const created = await dispatch(createProduct(productData)).unwrap();
        toast({
          title: "تم بنجاح",
          description: "تم إضافة المنتج بنجاح",
        });

        // بعد إنشاء منتج جديد: الانتقال مباشرة إلى شاشة إدارة التسعير مع تمرير معرف المنتج
        if (created && (created as any).id) {
          // فتح إدارة التسعير مع تحديد المخلف الجديد لتسعيره
          router.push(`/waste-management/pricing?productId=${(created as any).id}`);
        }
      }

      // تحديث قائمة المنتجات
      dispatch(fetchProductsBySubcategory(subcategoryId));
      
      // إغلاق النموذج
      onClose();
    } catch (error) {
      console.error("Error submitting product:", error);
      const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'حدث خطأ غير متوقع');
      toast({
        title: "خطأ",
        description: errorMessage || (isEditing ? "فشل تحديث المنتج" : "فشل إضافة المنتج"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المنتج</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={submitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">الوزن</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                step="0.001"
                min="0"
                value={weightInput}
                onChange={handleChange}
                required
                disabled={submitting}
                placeholder="أدخل الوزن (مثال: 0.014 جرام أو 1 كجم)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                القيم أقل من 1 تعتبر جرام (مثل 0.014 = 14 جرام)، والقيم 1 أو أكثر تعتبر كيلوجرام (مثل 1 = 1 كجم)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">السعر (جنيه مصري)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">الكمية</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={handleChange}
                required
                disabled={submitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="points">النقاط</Label>
              <Input
                id="points"
                name="points"
                type="number"
                min="0"
                value={formData.points}
                onChange={handleChange}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-2 border rounded-lg p-4">
            <Label className="block">طريقة حساب نقاط المستخدم لهذا المنتج</Label>
            <p className="text-xs text-muted-foreground">
              هذا الإعداد يحدد ما إذا كانت نقاط المستخدم لهذا المنتج ستحسب بالوزن (لكل كيلوجرام) أو بالعدد (لكل قطعة) عند ربطه بإعدادات النقاط.
            </p>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="points_mode"
                  checked={formData.points_mode === 'per_kg'}
                  onChange={() => setFormData({ ...formData, points_mode: 'per_kg' })}
                  disabled={submitting}
                />
                <span>نظام نقاط بالكيلوجرام للمستخدم</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="points_mode"
                  checked={formData.points_mode === 'per_piece'}
                  onChange={() => setFormData({ ...formData, points_mode: 'per_piece' })}
                  disabled={submitting}
                />
                <span>نظام نقاط بالقطعة للمستخدم</span>
              </label>
            </div>
          </div>

          <div className="space-y-2 border rounded-lg p-4 bg-blue-50/50">
            <Label className="block text-blue-800">طريقة العرض والتسعير في سلة التطبيق (مهم جداً)</Label>
            <p className="text-xs text-blue-600">
              هذا الإعداد يحدد كيف سيظهر المنتج للمستخدم؛ فإذا اخترت "بالقطعة"، سيسمح للمستخدم باختيار (1، 2، 3 قطع) وسيقوم التطبيق بضرب العدد في وزن القطعة المسجل أعلاه لتحديد الوزن الإجمالي والسعر بناءً على سعر الكيلو في البورصة.
            </p>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pricing_mode"
                  checked={formData.pricing_mode === 'per_kg'}
                  onChange={() => setFormData({ ...formData, pricing_mode: 'per_kg' })}
                  disabled={submitting}
                />
                <span className="text-sm font-medium">عرض للمستخدم بالوزن (كجم)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pricing_mode"
                  checked={formData.pricing_mode === 'per_piece'}
                  onChange={() => setFormData({ ...formData, pricing_mode: 'per_piece' })}
                  disabled={submitting}
                />
                <span className="text-sm font-medium text-blue-700">عرض للمستخدم بالقطعة (يتطلب إدخال وزن القطعة)</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initial_points">النقاط الأولية</Label>
            <Input
              id="initial_points"
              name="initial_points"
              type="number"
              min="0"
              value={formData.initial_points}
              onChange={handleChange}
              required
              disabled={submitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image">صورة المنتج</Label>
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={submitting}
            />
            {imagePreview && (
              <div className="mt-2">
                <img 
                  src={imagePreview} 
                  alt="صورة المنتج" 
                  className="w-32 h-32 object-cover rounded border"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="is_onboarding_featured" className="text-base">
                إظهار في الاقتراحات الذكية
              </Label>
              <p className="text-sm text-muted-foreground">
                تمييز هذا المنتج ليظهر في المساعد الذكي للمستخدمين الجدد
              </p>
            </div>
            <Switch
              id="is_onboarding_featured"
              checked={formData.is_onboarding_featured || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, is_onboarding_featured: checked })
              }
              disabled={submitting}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button 
            type="submit" 
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              isEditing ? 'تحديث' : 'إضافة'
            )}
          </Button>
        </div>
      </form>
    </CustomDialog>
  );
}; 