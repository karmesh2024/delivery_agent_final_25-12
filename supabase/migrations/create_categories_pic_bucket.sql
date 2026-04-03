-- إعداد سياسات الوصول لـ bucket categories_pic
-- هذا الـ bucket يستخدم لرفع صور الفئات والمنتجات
--
-- ملاحظة مهمة: يجب إنشاء الـ bucket يدوياً من Supabase Dashboard أولاً:
-- 1. اذهب إلى Storage في Supabase Dashboard
-- 2. اضغط "New bucket"
-- 3. الاسم: categories_pic
-- 4. Public: ✅ (مفعل)
-- 5. File size limit: 5MB (اختياري)
-- 6. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp, image/jfif (اختياري)
--
-- بعد إنشاء الـ bucket، قم بتشغيل هذا الملف لإنشاء السياسات

-- 1. إنشاء سياسات الوصول (RLS Policies)
-- حذف السياسات القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- السماح للجميع بقراءة الملفات (لأن الـ bucket public)
CREATE POLICY "Public Access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'categories_pic');

-- السماح للمستخدمين المسجلين بتحميل الملفات
CREATE POLICY "Authenticated users can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'categories_pic');

-- السماح للمستخدمين المسجلين بتحديث الملفات الخاصة بهم
CREATE POLICY "Authenticated users can update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'categories_pic')
WITH CHECK (bucket_id = 'categories_pic');

-- السماح للمستخدمين المسجلين بحذف الملفات
CREATE POLICY "Authenticated users can delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'categories_pic');
