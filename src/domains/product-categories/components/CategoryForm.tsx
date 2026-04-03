"use client";

import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { 
  addCategory, 
  updateCategory, 
  fetchCategoryById,
  fetchCategories
} from '@/domains/product-categories/store/productCategoriesSlice';
import { useToast } from '@/shared/ui/use-toast';
import { Category } from '@/types';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { categoryService } from '../api/categoryService';

interface CategoryFormProps {
  categoryId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ categoryId, isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    description: '',
    image_url: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    // مهم: لا نعيد تهيئة النموذج في كل re-render حتى لا يمنع الكتابة في textarea
    if (!isOpen) return;

    if (!categoryId) {
      // إضافة فئة جديدة
      setFormData({ name: '', description: '', image_url: '' });
      setSelectedFile(null);
      setPreviewImage(null);
      return;
    }

    // تعديل فئة موجودة
    dispatch(fetchCategoryById(categoryId))
      .unwrap()
      .then((category) => {
        if (!category) return;
        setFormData({
          name: category.name || '',
          description: category.description || '',
          image_url: category.image_url || '',
        });
        setPreviewImage(category.image_url || null);
        setSelectedFile(null);
      })
      .catch((error) => {
        console.error('Error fetching category:', error);
        toast({
          title: "خطأ",
          description: "فشل في جلب بيانات الفئة",
          variant: "destructive",
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, isOpen, dispatch]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // إنشاء معاينة للصورة
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          setPreviewImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // رفع الصورة إذا كان هناك ملف جديد محدد
      let imageUrl = formData.image_url;
      if (selectedFile) {
        const { url, error } = await categoryService.uploadImage(selectedFile, 'categories');
        if (error) {
          throw new Error(`فشل رفع الصورة: ${error}`);
        }
        imageUrl = url || '';
      }

      const dataToSubmit = {
        ...formData,
        image_url: imageUrl,
      };

      console.log('Enviando datos para guardar:', dataToSubmit);

      if (categoryId) {
        // تحديث فئة موجودة
        console.log('Actualizando categoría con ID:', categoryId);
        const result = await dispatch(updateCategory({ id: categoryId, category: dataToSubmit })).unwrap();
        console.log('Resultado de la actualización:', result);
        
        // Refrescar la lista de categorías después de actualizar
        await dispatch(fetchCategories());
        
        toast({
          title: "تم بنجاح",
          description: "تم تحديث الفئة بنجاح",
        });
      } else {
        // إضافة فئة جديدة
        const result = await dispatch(addCategory(dataToSubmit)).unwrap();
        console.log('Resultado de la adición:', result);
        
        // Refrescar la lista de categorías después de añadir
        await dispatch(fetchCategories());
        
        toast({
          title: "تم بنجاح",
          description: "تمت إضافة الفئة بنجاح",
        });
      }
      onClose();
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4">
      <form onSubmit={handleSubmit} dir="rtl" className="space-y-4">
        <div className="grid gap-4">
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="name" className="text-right">
              اسم الفئة <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="أدخل اسم الفئة"
              required
            />
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="description" className="text-right">
              وصف الفئة
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="أدخل وصف الفئة"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="image" className="text-right">
              صورة الفئة
            </Label>
            <Input
              id="image"
              name="image"
              type="file"
              onChange={handleFileChange}
              accept="image/*"
            />
            {previewImage && (
              <div className="flex justify-center mt-2">
                <img
                  src={previewImage}
                  alt="معاينة"
                  className="w-24 h-24 object-cover rounded-md border border-gray-300"
                />
              </div>
            )}
            {formData.image_url && !previewImage && (
              <div className="flex justify-center mt-2">
                <img
                  src={formData.image_url}
                  alt="الصورة الحالية"
                  className="w-24 h-24 object-cover rounded-md border border-gray-300"
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.name}
          >
            {isSubmitting ? 'جاري الحفظ...' : (categoryId ? 'تحديث' : 'إضافة')}
          </Button>
        </div>
      </form>
    </div>
  );
}; 