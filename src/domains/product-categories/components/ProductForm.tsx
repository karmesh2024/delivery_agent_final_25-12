"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { UniversalDialog } from '@/shared/ui/universal-dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { useToast } from '@/shared/ui/use-toast';
import { 
  createProduct,
  updateProduct,
  fetchProductById,
  fetchProductsBySubcategory
} from '@/domains/product-categories/store/productCategoriesSlice';
import { Product, productService } from '@/domains/product-categories/services/productService';
import { Loader2 } from 'lucide-react';
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
    initial_points: 0
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // جلب بيانات المنتج في حالة التعديل
  useEffect(() => {
    if (isEditing && productId) {
      dispatch(fetchProductById(productId));
    }
  }, [dispatch, isEditing, productId]);

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
        initial_points: selectedProduct.initial_points
      });

      if (selectedProduct.image_url) {
        setImagePreview(selectedProduct.image_url);
      }
    }
  }, [selectedProduct, isEditing, categoryId, subcategoryId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // تحويل القيم الرقمية
    if (['weight', 'price', 'quantity', 'points', 'initial_points'].includes(name)) {
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
      let finalImageUrl = formData.image_url;

      // رفع الصورة إذا تم اختيارها
      if (imageFile) {
        finalImageUrl = await productService.uploadProductImage(imageFile);
      }

      const productData = {
        ...formData,
        image_url: finalImageUrl
      };

      // إنشاء أو تحديث المنتج
      if (isEditing && productId) {
        await dispatch(updateProduct({ productId, product: productData })).unwrap();
        toast({
          title: "تم بنجاح",
          description: "تم تحديث المنتج بنجاح",
        });
      } else {
        await dispatch(createProduct(productData)).unwrap();
        toast({
          title: "تم بنجاح",
          description: "تم إضافة المنتج بنجاح",
        });
      }

      // تحديث قائمة المنتجات
      dispatch(fetchProductsBySubcategory(subcategoryId));
      
      // إغلاق النموذج
      onClose();
    } catch (error) {
      console.error("Error submitting product:", error);
      toast({
        title: "خطأ",
        description: isEditing ? "فشل تحديث المنتج" : "فشل إضافة المنتج",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UniversalDialog
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
              <Label htmlFor="weight">الوزن (كجم)</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                step="0.01"
                min="0"
                value={formData.weight}
                onChange={handleChange}
                required
                disabled={submitting}
              />
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
    </UniversalDialog>
  );
}; 