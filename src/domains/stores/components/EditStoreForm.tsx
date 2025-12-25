'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStoreById, updateStore, Store } from '@/domains/stores/store/storeSlice';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { uploadFile as supabaseUploadFile } from '@/lib/supabase';
import { cleanImagePath } from './FileUploadFix';

interface EditStoreFormProps {
  storeId: string;
  onFinished: () => void;
}

export default function EditStoreForm({ storeId, onFinished }: EditStoreFormProps) {
  const dispatch = useAppDispatch();
  const { currentStore, loading, error } = useAppSelector((state) => state.stores);
  const [formData, setFormData] = useState<Partial<Store>>({ 
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    slug: '',
    is_active: false,
    sort_order: 0,
    settings: {}
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (storeId) {
      console.log('Fetching store with ID:', storeId);
      dispatch(fetchStoreById(storeId));
    }
  }, [storeId, dispatch]);

  useEffect(() => {
    if (currentStore && currentStore.id === storeId) {
      console.log('Current store data:', currentStore);
      
      // تنظيف مسارات الصور قبل تعيينها في النموذج
      const cleanedLogoPath = currentStore.logo_path ? cleanImagePath(currentStore.logo_path) : '';
      const cleanedCoverPath = currentStore.cover_path ? cleanImagePath(currentStore.cover_path) : '';
      
      setFormData({
        name_ar: currentStore.name_ar || '',
        name_en: currentStore.name_en || '',
        description_ar: currentStore.description_ar || '',
        description_en: currentStore.description_en || '',
        slug: currentStore.slug || '',
        is_active: currentStore.is_active,
        sort_order: currentStore.sort_order || 0,
        logo_path: cleanedLogoPath,
        cover_path: cleanedCoverPath,
        settings: currentStore.settings || {}
      });
    }
  }, [currentStore, storeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'sort_order') {
      // تحويل القيمة إلى رقم إذا كان الحقل هو sort_order
      setFormData((prev) => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleStatusChange = (is_active: boolean) => {
    setFormData((prev) => ({ ...prev, is_active }));
  };

  // تحديث معالج تغيير الملف لإضافة معاينة
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'logo' | 'cover') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // التحقق من حجم الملف (5 ميجابايت كحد أقصى)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الملف كبير جدًا. يجب ألا يتجاوز 5 ميجابايت.');
        return;
      }
      
      // إنشاء عنوان URL للمعاينة
      const reader = new FileReader();
      reader.onloadend = () => {
        if (fileType === 'logo') {
          setLogoFile(file);
          setLogoPreview(reader.result as string);
        } else {
          setCoverFile(file);
          setCoverPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const updateData = { ...formData };
      
      // تحميل الشعار إذا تم اختياره
      if (logoFile) {
        // استخدام وظيفة uploadFile المحسنة مع مسار مجلد عشوائي
        const randomFolderName = Math.random().toString(36).substring(2, 12);
        const uploadResult = await supabaseUploadFile('stores', logoFile, randomFolderName);
        
        if (uploadResult.error) {
          throw new Error(`فشل في رفع صورة الشعار: ${uploadResult.error.message}`);
        }
        
        updateData.logo_path = uploadResult.path;
      }
      
      // تحميل صورة الغلاف إذا تم اختيارها
      if (coverFile) {
        // استخدام وظيفة uploadFile المحسنة مع مسار مجلد عشوائي
        const randomFolderName = Math.random().toString(36).substring(2, 12);
        const uploadResult = await supabaseUploadFile('stores', coverFile, randomFolderName);
        
        if (uploadResult.error) {
          throw new Error(`فشل في رفع صورة الغلاف: ${uploadResult.error.message}`);
        }
        
        updateData.cover_path = uploadResult.path;
      }
      
      console.log('Submitting form with data:', updateData);
      
      await dispatch(updateStore({ id: storeId, ...updateData }))
        .unwrap();
        
      toast.success('تم تحديث المتجر بنجاح');
      onFinished();
    } catch (err) {
      console.error('Error updating store:', err);
      toast.error(`فشل تحديث المتجر: ${err instanceof Error ? err.message : err}`);
    } finally {
      setUploading(false);
    }
  };

  // وظيفة للحصول على URL العام للصورة
  const getPublicUrl = (path: string | null | undefined): string => {
    if (!path || !supabase) return '';
    
    // تنظيف المسار أولًا
    const cleanPath = cleanImagePath(path);
    if (!cleanPath) return '';
    
    try {
      return supabase.storage.from('stores').getPublicUrl(cleanPath).data.publicUrl;
    } catch (error) {
      console.error('Error getting public URL:', error);
      return '';
    }
  };

  // تحويل القيم إلى سلاسل نصية آمنة للـ value attribute
  const safeStringValue = (value: string | null | undefined): string => {
    return value || '';
  };

  if (loading === 'pending') return <div className="flex justify-center items-center py-8">جارٍ التحميل...</div>;
  
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-md">حدث خطأ: {error}</div>;
  
  if (!currentStore) return <div className="bg-yellow-50 text-yellow-600 p-4 rounded-md">لم يتم العثور على بيانات المتجر</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name_ar">الاسم (عربي) *</Label>
          <Input id="name_ar" name="name_ar" value={safeStringValue(formData.name_ar)} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name_en">الاسم (إنجليزي)</Label>
          <Input id="name_en" name="name_en" value={safeStringValue(formData.name_en)} onChange={handleChange} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">الاسم التعريفي (Slug) *</Label>
        <Input id="slug" name="slug" value={safeStringValue(formData.slug)} onChange={handleChange} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description_ar">الوصف (عربي)</Label>
        <Textarea id="description_ar" name="description_ar" value={safeStringValue(formData.description_ar)} onChange={handleChange} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description_en">الوصف (إنجليزي)</Label>
        <Textarea id="description_en" name="description_en" value={safeStringValue(formData.description_en)} onChange={handleChange} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sort_order">ترتيب العرض</Label>
        <Input 
          id="sort_order" 
          name="sort_order" 
          type="number" 
          value={(formData.sort_order ?? 0).toString()} 
          onChange={handleChange} 
        />
        <p className="text-sm text-muted-foreground">الرقم الأصغر يظهر أولاً</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="logo_file">شعار المتجر</Label>
          <div className="space-y-2">
            {formData.logo_path && !logoPreview && (
              <div className="w-32 h-32 rounded-md overflow-hidden border">
                <img 
                  src={getPublicUrl(formData.logo_path)} 
                  alt="شعار المتجر"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {logoPreview && (
              <div className="w-32 h-32 rounded-md overflow-hidden border">
                <img 
                  src={logoPreview} 
                  alt="معاينة الشعار الجديد"
                  className="w-full h-full object-cover"
                />
                <p className="text-xs text-green-600 mt-1">صورة جديدة (سيتم حفظها عند النقر على حفظ)</p>
              </div>
            )}
            <Input
              id="logo_file"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'logo')}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cover_file">صورة الغلاف</Label>
          <div className="space-y-2">
            {formData.cover_path && !coverPreview && (
              <div className="w-32 h-32 rounded-md overflow-hidden border">
                <img 
                  src={getPublicUrl(formData.cover_path)} 
                  alt="صورة الغلاف"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {coverPreview && (
              <div className="w-32 h-32 rounded-md overflow-hidden border">
                <img 
                  src={coverPreview} 
                  alt="معاينة الغلاف الجديد"
                  className="w-full h-full object-cover"
                />
                <p className="text-xs text-green-600 mt-1">صورة جديدة (سيتم حفظها عند النقر على حفظ)</p>
              </div>
            )}
            <Input
              id="cover_file"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'cover')}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <Switch id="is_active" checked={formData.is_active} onCheckedChange={handleStatusChange} />
        <Label htmlFor="is_active">المتجر نشط</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onFinished} disabled={uploading}>إلغاء</Button>
        <Button type="submit" disabled={uploading}>
          {uploading ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>
    </form>
  );
} 