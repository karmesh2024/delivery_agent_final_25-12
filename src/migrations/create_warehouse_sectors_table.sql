-- إنشاء جدول القطاعات إذا لم يكن موجوداً
-- هذا الملف يضمن وجود جدول القطاعات مع البيانات الأساسية

-- إنشاء جدول warehouse_sectors إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.warehouse_sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    code VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    warehouse_levels TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_warehouse_sectors_code ON public.warehouse_sectors(code);
CREATE INDEX IF NOT EXISTS idx_warehouse_sectors_active ON public.warehouse_sectors(is_active);

-- تمكين RLS
ALTER TABLE public.warehouse_sectors ENABLE ROW LEVEL SECURITY;

-- سياسة الأمان
DROP POLICY IF EXISTS warehouse_sectors_policy ON public.warehouse_sectors;
CREATE POLICY warehouse_sectors_policy ON public.warehouse_sectors
    FOR ALL USING (true);

-- إدراج القطاعات الافتراضية إذا لم تكن موجودة
INSERT INTO public.warehouse_sectors (name, description, code, color, warehouse_levels) VALUES
('القطاع الصناعي', 'المخلفات والمنتجات الصناعية', 'IND', '#3B82F6', ARRAY['country', 'city', 'district']),
('القطاع التجاري', 'المخلفات والمنتجات التجارية', 'COM', '#10B981', ARRAY['city', 'district']),
('القطاع الزراعي', 'المخلفات والمنتجات الزراعية', 'AGR', '#F59E0B', ARRAY['country', 'city', 'district']),
('القطاع الطبي', 'المخلفات والمنتجات الطبية', 'MED', '#EF4444', ARRAY['city', 'district']),
('القطاع المنزلي', 'المخلفات المنزلية', 'RES', '#8B5CF6', ARRAY['district']),
('القطاع الحكومي', 'الوزارات والهيئات الحكومية', 'GOV', '#6366F1', ARRAY['country', 'city', 'district']),
('القطاع التعليمي', 'المدارس والجامعات', 'EDU', '#8B5CF6', ARRAY['city', 'district']),
('القطاع السياحي', 'الفنادق والمنتجعات', 'TOU', '#F59E0B', ARRAY['city', 'district'])
ON CONFLICT (code) DO NOTHING;

-- تعليق على الجدول
COMMENT ON TABLE public.warehouse_sectors IS 'جدول القطاعات الأساسية للمخازن';
COMMENT ON COLUMN public.warehouse_sectors.warehouse_levels IS 'المستويات المسموحة للقطاع';
COMMENT ON COLUMN public.warehouse_sectors.color IS 'لون القطاع للتمييز البصري';
COMMENT ON COLUMN public.warehouse_sectors.code IS 'كود فريد للقطاع';


