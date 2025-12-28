-- إصلاح تضارب تعريف جدول warehouse_sectors
-- هذا الملف يحل المشكلة بفصل جدول القطاعات عن جدول الربط

-- =========================================================
-- 1️⃣ إعادة تسمية الجدول الموجود (جدول الربط)
-- =========================================================

-- إعادة تسمية الجدول الموجود إلى warehouse_sector_assignments
ALTER TABLE IF EXISTS public.warehouse_sectors 
RENAME TO warehouse_sector_assignments_old;

-- =========================================================
-- 2️⃣ إنشاء جدول القطاعات الأساسي الجديد
-- =========================================================

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

-- =========================================================
-- 3️⃣ إنشاء جدول الربط الصحيح
-- =========================================================

CREATE TABLE IF NOT EXISTS public.warehouse_sector_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id INTEGER REFERENCES public.warehouses(id) ON DELETE CASCADE,
    sector_id UUID REFERENCES public.warehouse_sectors(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    capacity_percentage INTEGER DEFAULT 100,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by INTEGER,
    UNIQUE(warehouse_id, sector_id)
);

-- =========================================================
-- 4️⃣ إنشاء الفهارس
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_warehouse_sectors_code ON public.warehouse_sectors(code);
CREATE INDEX IF NOT EXISTS idx_warehouse_sectors_active ON public.warehouse_sectors(is_active);
CREATE INDEX IF NOT EXISTS idx_warehouse_sector_assignments_warehouse ON public.warehouse_sector_assignments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_sector_assignments_sector ON public.warehouse_sector_assignments(sector_id);

-- =========================================================
-- 5️⃣ تمكين RLS وإنشاء السياسات
-- =========================================================

ALTER TABLE public.warehouse_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_sector_assignments ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
DROP POLICY IF EXISTS warehouse_sectors_policy ON public.warehouse_sectors;
CREATE POLICY warehouse_sectors_policy ON public.warehouse_sectors
    FOR ALL USING (true);

DROP POLICY IF EXISTS warehouse_sector_assignments_policy ON public.warehouse_sector_assignments;
CREATE POLICY warehouse_sector_assignments_policy ON public.warehouse_sector_assignments
    FOR ALL USING (true);

-- =========================================================
-- 6️⃣ إدراج القطاعات الافتراضية
-- =========================================================

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

-- =========================================================
-- 7️⃣ نقل البيانات من الجدول القديم (إذا كان موجود)
-- =========================================================

-- إنشاء جدول waste_sectors إذا لم يكن موجود
CREATE TABLE IF NOT EXISTS public.waste_sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_name VARCHAR(200) NOT NULL,
    sector_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إدراج قطاعات المخلفات الافتراضية
INSERT INTO public.waste_sectors (sector_name, sector_code, description) VALUES
('القطاع الصناعي', 'IND', 'المخلفات والمنتجات الصناعية'),
('القطاع التجاري', 'COM', 'المخلفات والمنتجات التجارية'),
('القطاع الزراعي', 'AGR', 'المخلفات والمنتجات الزراعية'),
('القطاع الطبي', 'MED', 'المخلفات والمنتجات الطبية'),
('القطاع المنزلي', 'RES', 'المخلفات المنزلية')
ON CONFLICT (sector_code) DO NOTHING;

-- =========================================================
-- 8️⃣ تعليقات على الجداول
-- =========================================================

COMMENT ON TABLE public.warehouse_sectors IS 'القطاعات المتاحة للمخازن';
COMMENT ON TABLE public.warehouse_sector_assignments IS 'ربط المخازن بالقطاعات';
COMMENT ON TABLE public.waste_sectors IS 'قطاعات المخلفات (للتوافق مع النظام القديم)';

COMMENT ON COLUMN public.warehouse_sectors.warehouse_levels IS 'المستويات المسموحة للقطاع';
COMMENT ON COLUMN public.warehouse_sector_assignments.is_primary IS 'هل هو القطاع الأساسي للمخزن';
COMMENT ON COLUMN public.warehouse_sector_assignments.capacity_percentage IS 'نسبة السعة المخصصة للقطاع';

-- =========================================================
-- 9️⃣ تنظيف الجدول القديم (اختياري)
-- =========================================================

-- يمكن حذف الجدول القديم بعد التأكد من نقل البيانات
-- DROP TABLE IF EXISTS public.warehouse_sector_assignments_old;
