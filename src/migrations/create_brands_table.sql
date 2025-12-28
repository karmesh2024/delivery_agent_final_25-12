-- إنشاء جدول البراندز (العلامات التجارية)
CREATE TABLE IF NOT EXISTS public.warehouse_product_brands (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT, -- رابط الصورة في Supabase Storage
    logo_path TEXT, -- مسار الملف في Storage
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة بيانات أولية للبراندز
INSERT INTO public.warehouse_product_brands (name, description) VALUES 
('برسيل', 'منظفات ومنتجات العناية بالمنزل'),
('أريال', 'منظفات الغسيل والعناية بالملابس'),
('فيري', 'منظفات الأطباق والمنزل'),
('دوف', 'منتجات العناية الشخصية'),
('شامبو', 'منتجات العناية بالشعر'),
('كولجيت', 'منتجات العناية بالفم والأسنان'),
('نيفيا', 'منتجات العناية بالبشرة'),
('جونسون', 'منتجات العناية بالأطفال'),
('بيبسي', 'المشروبات الغازية'),
('كوكا كولا', 'المشروبات الغازية')
ON CONFLICT (name) DO NOTHING;
