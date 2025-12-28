-- =========================================================
-- 🏗️ تطبيق النظام الهرمي للمخازن
-- =========================================================
-- تاريخ الإنشاء: 2025-01-18
-- الهدف: تطبيق النظام الهرمي للمخازن في قاعدة البيانات

-- =========================================================
-- 1️⃣ التحقق من وجود الأعمدة الهرمية
-- =========================================================

-- إضافة الأعمدة المطلوبة للهيكل الهرمي إذا لم تكن موجودة
DO $$ 
BEGIN
    -- إضافة عمود المستوى الهرمي
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'warehouses' AND column_name = 'warehouse_level') THEN
        ALTER TABLE public.warehouses 
        ADD COLUMN warehouse_level VARCHAR(20) CHECK (warehouse_level IN ('country', 'city', 'district'));
    END IF;

    -- إضافة عمود المخزن الأب
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'warehouses' AND column_name = 'parent_warehouse_id') THEN
        ALTER TABLE public.warehouses 
        ADD COLUMN parent_warehouse_id INTEGER REFERENCES public.warehouses(id);
    END IF;

    -- إضافة عمود مسار الهرم
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'warehouses' AND column_name = 'hierarchy_path') THEN
        ALTER TABLE public.warehouses 
        ADD COLUMN hierarchy_path TEXT;
    END IF;

    -- إضافة عمود المخزن الرئيسي
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'warehouses' AND column_name = 'is_main_warehouse') THEN
        ALTER TABLE public.warehouses 
        ADD COLUMN is_main_warehouse BOOLEAN DEFAULT FALSE;
    END IF;

    -- إضافة أكواد المناطق
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'warehouses' AND column_name = 'country_code') THEN
        ALTER TABLE public.warehouses 
        ADD COLUMN country_code VARCHAR(3);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'warehouses' AND column_name = 'city_code') THEN
        ALTER TABLE public.warehouses 
        ADD COLUMN city_code VARCHAR(10);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'warehouses' AND column_name = 'district_code') THEN
        ALTER TABLE public.warehouses 
        ADD COLUMN district_code VARCHAR(10);
    END IF;
END $$;

-- =========================================================
-- 2️⃣ إنشاء الفهارس لتحسين الأداء
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_warehouses_parent_id ON public.warehouses(parent_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_level ON public.warehouses(warehouse_level);
CREATE INDEX IF NOT EXISTS idx_warehouses_hierarchy_path ON public.warehouses(hierarchy_path);
CREATE INDEX IF NOT EXISTS idx_warehouses_is_main ON public.warehouses(is_main_warehouse);

-- =========================================================
-- 3️⃣ إنشاء جدول ربط المخازن بالقطاعات
-- =========================================================

CREATE TABLE IF NOT EXISTS public.warehouse_sectors (
    id BIGSERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    sector_code TEXT NOT NULL REFERENCES public.waste_sectors(code),
    is_primary BOOLEAN DEFAULT FALSE,
    capacity_percentage DECIMAL(5,2) DEFAULT 100.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(warehouse_id, sector_code)
);

-- فهارس لجدول ربط المخازن بالقطاعات
CREATE INDEX IF NOT EXISTS idx_warehouse_sectors_warehouse_id ON public.warehouse_sectors(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_sectors_sector_code ON public.warehouse_sectors(sector_code);

-- =========================================================
-- 4️⃣ إنشاء دوال مساعدة للهيكل الهرمي
-- =========================================================

-- دالة لتحديث مسار الهرم تلقائياً
CREATE OR REPLACE FUNCTION update_warehouse_hierarchy_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_path TEXT;
BEGIN
    -- إذا كان هناك مخزن أب، احصل على مساره
    IF NEW.parent_warehouse_id IS NOT NULL THEN
        SELECT hierarchy_path INTO parent_path 
        FROM public.warehouses 
        WHERE id = NEW.parent_warehouse_id;
        
        -- أضف المعرف الحالي للمسار
        NEW.hierarchy_path = COALESCE(parent_path, '') || '/' || NEW.id;
    ELSE
        -- إذا لم يكن هناك مخزن أب، فهو الجذر
        NEW.hierarchy_path = NEW.id::TEXT;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث مسار الهرم
DROP TRIGGER IF EXISTS trigger_update_warehouse_hierarchy ON public.warehouses;
CREATE TRIGGER trigger_update_warehouse_hierarchy
    BEFORE INSERT OR UPDATE ON public.warehouses
    FOR EACH ROW
    EXECUTE FUNCTION update_warehouse_hierarchy_path();

-- =========================================================
-- 5️⃣ دوال للاستعلامات الهرمية
-- =========================================================

-- دالة للحصول على جميع المخازن الفرعية
CREATE OR REPLACE FUNCTION get_child_warehouses(parent_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    name TEXT,
    warehouse_level VARCHAR(20),
    hierarchy_path TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT w.id, w.name, w.warehouse_level, w.hierarchy_path
    FROM public.warehouses w
    WHERE w.parent_warehouse_id = parent_id
    AND w.is_active = TRUE
    ORDER BY w.name;
END;
$$ LANGUAGE plpgsql;

-- دالة للحصول على شجرة المخازن الكاملة
CREATE OR REPLACE FUNCTION get_warehouse_tree(root_id INTEGER DEFAULT NULL)
RETURNS TABLE (
    id INTEGER,
    name TEXT,
    warehouse_level VARCHAR(20),
    hierarchy_path TEXT,
    depth INTEGER
) AS $$
BEGIN
    IF root_id IS NULL THEN
        -- إرجاع جميع المخازن الجذرية
        RETURN QUERY
        SELECT w.id, w.name, w.warehouse_level, w.hierarchy_path, 0 as depth
        FROM public.warehouses w
        WHERE w.parent_warehouse_id IS NULL
        AND w.is_active = TRUE
        ORDER BY w.name;
    ELSE
        -- إرجاع شجرة من مخزن معين
        RETURN QUERY
        WITH RECURSIVE warehouse_tree AS (
            SELECT w.id, w.name, w.warehouse_level, w.hierarchy_path, 0 as depth
            FROM public.warehouses w
            WHERE w.id = root_id
            AND w.is_active = TRUE
            
            UNION ALL
            
            SELECT w.id, w.name, w.warehouse_level, w.hierarchy_path, wt.depth + 1
            FROM public.warehouses w
            JOIN warehouse_tree wt ON w.parent_warehouse_id = wt.id
            WHERE w.is_active = TRUE
        )
        SELECT * FROM warehouse_tree ORDER BY hierarchy_path;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 6️⃣ سياسات الأمان (RLS)
-- =========================================================

-- تفعيل RLS للجداول الجديدة
ALTER TABLE public.warehouse_sectors ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة العامة
CREATE POLICY IF NOT EXISTS "Allow public read access to warehouse_sectors" 
ON public.warehouse_sectors FOR SELECT USING (true);

-- سياسات الإدراج والتحديث للمستخدمين المصرح لهم
CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage warehouse_sectors" 
ON public.warehouse_sectors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- 7️⃣ بيانات تجريبية للاختبار
-- =========================================================

-- إدراج مخزن رئيسي (مستوى الدولة) إذا لم يكن موجود
INSERT INTO public.warehouses (name, location, warehouse_level, is_main_warehouse, country_code) 
VALUES ('مخزن شمال الدلتا الرئيسي', 'مصر - شمال الدلتا', 'country', TRUE, 'EGN')
ON CONFLICT (name) DO NOTHING;

-- إدراج مخزن مدينة (مستوى المدينة) إذا لم يكن موجود
INSERT INTO public.warehouses (name, location, warehouse_level, parent_warehouse_id, city_code) 
VALUES ('مخزن الإسكندرية الرئيسي', 'الإسكندرية - مصر', 'city', 
        (SELECT id FROM public.warehouses WHERE name = 'مخزن شمال الدلتا الرئيسي'), 'ALX')
ON CONFLICT (name) DO NOTHING;

-- إدراج مخزن منطقة (مستوى المنطقة) إذا لم يكن موجود
INSERT INTO public.warehouses (name, location, warehouse_level, parent_warehouse_id, district_code) 
VALUES ('مخزن محرم بك شرق', 'محرم بك - الإسكندرية', 'district',
        (SELECT id FROM public.warehouses WHERE name = 'مخزن الإسكندرية الرئيسي'), 'MBE')
ON CONFLICT (name) DO NOTHING;

-- =========================================================
-- 8️⃣ تحديث المخازن الموجودة لتشمل المستوى الافتراضي
-- =========================================================

-- تحديث المخازن الموجودة التي لا تحتوي على مستوى هرمي
UPDATE public.warehouses 
SET warehouse_level = 'district', 
    is_main_warehouse = FALSE
WHERE warehouse_level IS NULL;

-- رسالة نجاح
SELECT 'تم تطبيق النظام الهرمي للمخازن بنجاح!' as message;
