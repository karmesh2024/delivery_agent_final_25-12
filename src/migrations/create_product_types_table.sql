-- إنشاء جدول أنواع المنتجات
CREATE TABLE IF NOT EXISTS public.warehouse_product_types (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة بيانات أولية لأنواع المنتجات
INSERT INTO public.warehouse_product_types (name) VALUES 
('إلكترونيات'),
('ملابس'),
('أدوات منزلية'),
('مستحضرات تجميل'),
('منظفات'),
('كوزمتكس')
ON CONFLICT (name) DO NOTHING;
