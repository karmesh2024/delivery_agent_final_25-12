-- إنشاء bucket لصور الفئات والمنتجات (categories_pic) وسياسات الوصول
-- يُستخدم لرفع صور الفئات الرئيسية والفرعية والمنتجات في إدارة التنظيم والتسلسل

-- 1. إنشاء الـ bucket (إن لم يكن موجوداً)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'categories_pic',
  'categories_pic',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jfif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. سياسات الوصول (أسماء فريدة لتجنب التعارض مع سياسات أخرى)
-- السماح للجميع بقراءة الملفات (bucket عام)
DROP POLICY IF EXISTS "categories_pic_select" ON storage.objects;
CREATE POLICY "categories_pic_select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'categories_pic');

-- السماح للمستخدمين المسجلين برفع الملفات
DROP POLICY IF EXISTS "categories_pic_insert" ON storage.objects;
CREATE POLICY "categories_pic_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'categories_pic');

-- السماح للمستخدمين المسجلين بتحديث الملفات
DROP POLICY IF EXISTS "categories_pic_update" ON storage.objects;
CREATE POLICY "categories_pic_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'categories_pic')
WITH CHECK (bucket_id = 'categories_pic');

-- السماح للمستخدمين المسجلين بحذف الملفات
DROP POLICY IF EXISTS "categories_pic_delete" ON storage.objects;
CREATE POLICY "categories_pic_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'categories_pic');
