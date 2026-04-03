-- إنشاء Bucket للوسائط في Supabase Storage
-- يرجى تنفيذ هذا الكود في Supabase Dashboard > Storage

-- 1. إنشاء Bucket جديد باسم 'zoon-media'
-- يمكنك القيام بذلك من واجهة Supabase:
-- Storage > Create a new bucket > Name: zoon-media > Public bucket: Yes

-- 2. إعداد سياسات الوصول (RLS Policies) للـ Bucket
-- يرجى تنفيذ هذه الاستعلامات في SQL Editor:

-- السماح برفع الملفات للمستخدمين المصادق عليهم
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'zoon-media');

-- السماح بقراءة الملفات للجميع (Public Read)
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'zoon-media');

-- السماح بحذف الملفات لأصحابها فقط
CREATE POLICY "Allow users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'zoon-media' AND auth.uid() = owner);

-- السماح بتحديث الملفات لأصحابها فقط
CREATE POLICY "Allow users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'zoon-media' AND auth.uid() = owner);
