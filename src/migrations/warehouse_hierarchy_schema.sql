-- =========================================================
-- 🏗️ هيكل المخازن الهرمي مع القطاعات
-- =========================================================
-- تاريخ الإنشاء: 2025-01-18
-- الهدف: إنشاء هيكل هرمي للمخازن مع ربط القطاعات

-- =========================================================
-- 🧩 1️⃣ القطاعات (Sectors) - موجود بالفعل
-- =========================================================
-- جدول القطاعات موجود في create_waste_catalog_tables.sql
-- سنستخدمه كما هو

-- =========================================================
-- 🏢 2️⃣ تحديث جدول المخازن للهيكل الهرمي
-- =========================================================

-- إضافة الأعمدة المطلوبة للهيكل الهرمي
ALTER TABLE public.warehouses 
ADD COLUMN IF NOT EXISTS parent_warehouse_id INTEGER REFERENCES public.warehouses(id),
ADD COLUMN IF NOT EXISTS warehouse_level VARCHAR(20) CHECK (warehouse_level IN ('country', 'city', 'district')),
ADD COLUMN IF NOT EXISTS hierarchy_path TEXT, -- مسار الهرم مثل: "1/2/3"
ADD COLUMN IF NOT EXISTS is_main_warehouse BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS country_code VARCHAR(3), -- كود الدولة
ADD COLUMN IF NOT EXISTS city_code VARCHAR(10), -- كود المدينة
ADD COLUMN IF NOT EXISTS district_code VARCHAR(10); -- كود المنطقة

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_warehouses_parent_id ON public.warehouses(parent_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_level ON public.warehouses(warehouse_level);
CREATE INDEX IF NOT EXISTS idx_warehouses_hierarchy_path ON public.warehouses(hierarchy_path);

-- =========================================================
-- 🔗 3️⃣ جدول ربط المخازن بالقطاعات
-- =========================================================

CREATE TABLE IF NOT EXISTS public.warehouse_sectors (
    id BIGSERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    sector_code TEXT NOT NULL REFERENCES public.waste_sectors(code),
    is_primary BOOLEAN DEFAULT FALSE, -- القطاع الأساسي للمخزن
    capacity_percentage DECIMAL(5,2) DEFAULT 100.00, -- نسبة السعة المخصصة لهذا القطاع
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(warehouse_id, sector_code)
);

-- فهارس لجدول ربط المخازن بالقطاعات
CREATE INDEX IF NOT EXISTS idx_warehouse_sectors_warehouse_id ON public.warehouse_sectors(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_sectors_sector_code ON public.warehouse_sectors(sector_code);

-- =========================================================
-- 🏛️ 4️⃣ جدول المخازن الرئيسية (Country Level)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.main_warehouses (
    id BIGSERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    country_name TEXT NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    coverage_area TEXT, -- المناطق التي يغطيها
    regional_manager TEXT, -- المدير الإقليمي
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(warehouse_id)
);

-- =========================================================
-- 🏙️ 5️⃣ جدول مخازن المدن (City Level)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.city_warehouses (
    id BIGSERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    main_warehouse_id INTEGER NOT NULL REFERENCES public.warehouses(id),
    city_name TEXT NOT NULL,
    city_code VARCHAR(10) NOT NULL,
    population_served INTEGER, -- عدد السكان المخدومين
    city_manager TEXT, -- مدير المدينة
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(warehouse_id)
);

-- =========================================================
-- 🏘️ 6️⃣ جدول مخازن المناطق (District Level)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.district_warehouses (
    id BIGSERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    city_warehouse_id INTEGER NOT NULL REFERENCES public.warehouses(id),
    district_name TEXT NOT NULL,
    district_code VARCHAR(10) NOT NULL,
    area_coverage TEXT, -- المساحة المغطاة
    district_manager TEXT, -- مدير المنطقة
    contact_email TEXT,
    special_equipment TEXT[], -- معدات خاصة
    environmental_permits TEXT[], -- التصاريح البيئية
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(warehouse_id)
);

-- =========================================================
-- 🔄 7️⃣ دوال مساعدة للهيكل الهرمي
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
-- 📊 8️⃣ دوال للاستعلامات الهرمية
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
-- 🔒 9️⃣ سياسات الأمان (RLS)
-- =========================================================

-- تفعيل RLS للجداول الجديدة
ALTER TABLE public.warehouse_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.main_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.district_warehouses ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة العامة
CREATE POLICY "Allow public read access to warehouse_sectors" 
ON public.warehouse_sectors FOR SELECT USING (true);

CREATE POLICY "Allow public read access to main_warehouses" 
ON public.main_warehouses FOR SELECT USING (true);

CREATE POLICY "Allow public read access to city_warehouses" 
ON public.city_warehouses FOR SELECT USING (true);

CREATE POLICY "Allow public read access to district_warehouses" 
ON public.district_warehouses FOR SELECT USING (true);

-- سياسات الإدراج والتحديث للمستخدمين المصرح لهم
CREATE POLICY "Allow authenticated users to manage warehouse_sectors" 
ON public.warehouse_sectors FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage main_warehouses" 
ON public.main_warehouses FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage city_warehouses" 
ON public.city_warehouses FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage district_warehouses" 
ON public.district_warehouses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- 📝 10️⃣ بيانات تجريبية للاختبار
-- =========================================================

-- إدراج مخزن رئيسي (مستوى الدولة)
INSERT INTO public.warehouses (name, location, warehouse_level, is_main_warehouse, country_code) 
VALUES ('مخزن شمال الدلتا الرئيسي', 'مصر - شمال الدلتا', 'country', TRUE, 'EGN')
ON CONFLICT (name) DO NOTHING;

-- إدراج مخزن مدينة (مستوى المدينة)
INSERT INTO public.warehouses (name, location, warehouse_level, parent_warehouse_id, city_code) 
VALUES ('مخزن الإسكندرية الرئيسي', 'الإسكندرية - مصر', 'city', 
        (SELECT id FROM public.warehouses WHERE name = 'مخزن شمال الدلتا الرئيسي'), 'ALX')
ON CONFLICT (name) DO NOTHING;

-- إدراج مخزن منطقة (مستوى المنطقة)
INSERT INTO public.warehouses (name, location, warehouse_level, parent_warehouse_id, district_code) 
VALUES ('مخزن محرم بك شرق', 'محرم بك - الإسكندرية', 'district',
        (SELECT id FROM public.warehouses WHERE name = 'مخزن الإسكندرية الرئيسي'), 'MBE')
ON CONFLICT (name) DO NOTHING;

-- ربط المخازن بالقطاعات
INSERT INTO public.warehouse_sectors (warehouse_id, sector_code, is_primary) VALUES
-- مخزن شمال الدلتا - جميع القطاعات
((SELECT id FROM public.warehouses WHERE name = 'مخزن شمال الدلتا الرئيسي'), 'INDUSTRIAL', TRUE),
((SELECT id FROM public.warehouses WHERE name = 'مخزن شمال الدلتا الرئيسي'), 'COMMERCIAL', FALSE),
((SELECT id FROM public.warehouses WHERE name = 'مخزن شمال الدلتا الرئيسي'), 'TOURISM', FALSE),
((SELECT id FROM public.warehouses WHERE name = 'مخزن شمال الدلتا الرئيسي'), 'MEDICAL', FALSE),
((SELECT id FROM public.warehouses WHERE name = 'مخزن شمال الدلتا الرئيسي'), 'AGRICULTURAL', FALSE),
((SELECT id FROM public.warehouses WHERE name = 'مخزن شمال الدلتا الرئيسي'), 'ADMINISTRATIVE', FALSE),
((SELECT id FROM public.warehouses WHERE name = 'مخزن شمال الدلتا الرئيسي'), 'HOUSEHOLD', FALSE),

-- مخزن الإسكندرية - قطاعات السياحة والتجارة
((SELECT id FROM public.warehouses WHERE name = 'مخزن الإسكندرية الرئيسي'), 'TOURISM', TRUE),
((SELECT id FROM public.warehouses WHERE name = 'مخزن الإسكندرية الرئيسي'), 'COMMERCIAL', TRUE),
((SELECT id FROM public.warehouses WHERE name = 'مخزن الإسكندرية الرئيسي'), 'INDUSTRIAL', FALSE),

-- مخزن محرم بك - قطاع السياحة أساسي
((SELECT id FROM public.warehouses WHERE name = 'مخزن محرم بك شرق'), 'TOURISM', TRUE),
((SELECT id FROM public.warehouses WHERE name = 'مخزن محرم بك شرق'), 'COMMERCIAL', FALSE)
ON CONFLICT (warehouse_id, sector_code) DO NOTHING;

-- رسالة نجاح
SELECT 'تم إنشاء الهيكل الهرمي للمخازن بنجاح!' as message;
