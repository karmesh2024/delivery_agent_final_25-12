'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useAppDispatch } from '@/store/hooks';
import { addStore } from '@/domains/stores/store/storeSlice';
import { CustomDialog, DialogFooter } from '@/shared/ui/custom-dialog';
import { uploadFile } from '@/lib/supabase';
import { cleanImagePath } from '@/domains/stores/components/FileUploadFix';
import { toast } from 'sonner';

export function AddStoreDialog({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [slug, setSlug] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();

  // Function to generate a URL-friendly slug
  const generateSlug = (name: string) => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-') // Replace spaces and underscores with -
      .replace(/[^\w-]+/g, ''); // Remove all non-word chars
  };

  // Update slug automatically when Arabic name changes
  useEffect(() => {
    if (nameAr) {
    setSlug(generateSlug(nameAr));
    }
  }, [nameAr]);

  // Preview logo when file is selected
  useEffect(() => {
    if (logoFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(logoFile);
    } else {
      setLogoPreview(null);
    }
  }, [logoFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // التحقق من حجم الملف (5 ميجابايت كحد أقصى)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الملف كبير جدًا. يجب ألا يتجاوز 5 ميجابايت.');
        return;
      }
      setLogoFile(file);
    }
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setNameAr('');
    setNameEn('');
    setDescriptionAr('');
    setSlug('');
    setLogoFile(null);
    setLogoPreview(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr || !slug) {
      setError('اسم المتجر والاسم التعريفي (slug) مطلوبان.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      let logoPath = null;

      // Step 1: Upload logo if a file is selected
      if (logoFile) {
        // استخدم المسار الآمن مع المجلد العشوائي
        const randomFolderName = Math.random().toString(36).substring(2, 12);
        
        // استخدام وظيفة uploadFile المحدثة
        const uploadResult = await uploadFile(
          'stores',
          logoFile,
          randomFolderName // استخدام مجلد عشوائي
        );

        if (uploadResult.error || !uploadResult.path) {
          throw new Error(`فشل في رفع صورة الشعار: ${uploadResult.error?.message}`);
        }
        
        logoPath = uploadResult.path;
      }

      // Step 2: Dispatch action to add the store with the logo path
      const result = await dispatch(addStore({ 
        owner_id: "system", // يمكن تغييره لاحقًا
        name_ar: nameAr, 
        name_en: nameEn || null,
        description_ar: descriptionAr || null,
        description_en: null,
        slug: slug,
        logo_path: logoPath,
        is_active: true,
        sort_order: 0,
       })).unwrap();

      toast.success('تمت إضافة المتجر بنجاح');
      resetForm();
      onClose();
      onSuccess();
    } catch (err) {
      console.error('Error adding store:', err);
      const errorMsg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      toast.error(`فشل إضافة المتجر: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name_ar" className="text-right">
            اسم المتجر (عربي) *
          </Label>
          <Input
            id="name_ar"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            className="col-span-3"
            disabled={isSubmitting}
            required
            placeholder="اسم المتجر باللغة العربية"
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name_en" className="text-right">
            اسم المتجر (إنجليزي)
          </Label>
          <Input
            id="name_en"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            className="col-span-3"
            disabled={isSubmitting}
            placeholder="Store name in English"
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description_ar" className="text-right">
            وصف المتجر
          </Label>
          <Input
            id="description_ar"
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            className="col-span-3"
            disabled={isSubmitting}
            placeholder="وصف قصير للمتجر"
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="slug" className="text-right">
            الاسم التعريفي (Slug) *
          </Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="col-span-3"
            disabled={isSubmitting}
            required
            placeholder="store-name"
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="logo_file" className="text-right">
            شعار المتجر
          </Label>
          <div className="col-span-3">
          <Input
            id="logo_file"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
              className="mb-2"
            disabled={isSubmitting}
          />
            
            {logoPreview && (
              <div className="mt-2">
                <p className="text-sm mb-1">معاينة الشعار:</p>
                <img 
                  src={logoPreview} 
                  alt="معاينة الشعار"
                  className="w-20 h-20 object-cover rounded border"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      
      <DialogFooter>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            resetForm();
            onClose();
          }} 
          disabled={isSubmitting}
        >
          إلغاء
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'جاري الإضافة...' : 'إضافة متجر جديد'}
        </Button>
      </DialogFooter>
    </form>
  );
} 