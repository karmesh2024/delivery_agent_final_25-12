/**
 * FileUploadFix.tsx
 * 
 * وظائف مساعدة لإصلاح مشاكل تحميل الصور في Supabase
 */

// استيراد نوع SupabaseClient
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * تنظيف مسار الصورة لمنع تكرار عناوين URL
 * 
 * المشكلة: Supabase يخزن المسار الكامل بدلاً من المسار النسبي في بعض الأحيان
 * هذه الوظيفة تتأكد من أن المسار المخزن هو المسار النسبي فقط
 */
export function cleanImagePath(path: string | null): string | null {
  if (!path) return null;
  
  // تحقق مما إذا كان المسار يحتوي على عنوان URL لـ Supabase
  if (path.includes('supabase.co/storage/v1/object/public/')) {
    // استخراج الجزء الأخير من المسار بعد "public/bucket-name/"
    const matches = path.match(/public\/([^\/]+)\/(.+)$/);
    if (matches && matches.length >= 3) {
      const bucket = matches[1]; // اسم الـ bucket
      const fileName = matches[2]; // اسم الملف الفعلي
      return fileName; // إرجاع اسم الملف فقط
    }
  }
  
  return path; // إرجاع المسار الأصلي إذا لم يتم العثور على نمط Supabase
}

/**
 * الحصول على عنوان URL العام لملف في Supabase
 */
export function getPublicImageUrl(
  supabase: SupabaseClient, 
  bucket: string, 
  path: string | null
): string | null {
  if (!path || !supabase) return null;
  
  // قم بتنظيف المسار أولاً
  const cleanPath = cleanImagePath(path);
  
  // الحصول على URL العام
  return cleanPath ? supabase.storage.from(bucket).getPublicUrl(cleanPath).data.publicUrl : null;
} 