-- إنشاء bucket للصور في Supabase Storage
-- ملاحظة: هذا يحتاج إلى تشغيله في Supabase Dashboard > Storage

-- إنشاء bucket للصور
INSERT INTO storage.buckets (id, name, public) 
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

-- إعداد السياسات للوصول العام للقراءة
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'brand-logos');

-- إعداد السياسات للرفع (يحتاج مصادقة)
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'brand-logos' 
  AND auth.role() = 'authenticated'
);

-- إعداد السياسات للتحديث
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'brand-logos' 
  AND auth.role() = 'authenticated'
);

-- إعداد السياسات للحذف
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'brand-logos' 
  AND auth.role() = 'authenticated'
);
