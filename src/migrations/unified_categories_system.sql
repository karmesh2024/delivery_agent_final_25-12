-- =====================================================
-- نظام موحد للفئات والتصنيفات
-- Unified Categories and Classifications System
-- =====================================================
-- هذا الملف ينشئ نظاماً موحداً لإدارة الفئات والتصنيفات
-- يجمع بين نظام التصنيفات الهرمية ونظام فئات الكتالوج
-- =====================================================

-- =====================================================
-- 1. إنشاء Enum Types
-- =====================================================

-- نوع العنصر (منتج، مخلف، أو كليهما)
DO $$ BEGIN
    CREATE TYPE item_type_enum AS ENUM ('product', 'waste', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. إنشاء جدول القطاعات الموحد
-- =====================================================
-- ملاحظة: يمكن استخدام warehouse_sectors الموجود أو إنشاء unified_sectors
-- هنا سنستخدم warehouse_sectors الموجود ونضيف حقول إضافية إذا لزم الأمر

-- =====================================================
-- 3. إنشاء جدول التصنيفات الموحد
-- =====================================================
CREATE TABLE IF NOT EXISTS public.unified_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_id UUID NOT NULL REFERENCES public.warehouse_sectors(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200), -- الاسم بالعربية
    description TEXT,
    item_type item_type_enum NOT NULL DEFAULT 'both', -- نوع العنصر: منتج، مخلف، أو كليهما
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unified_classifications_sector_name_unique UNIQUE (sector_id, name)
);

COMMENT ON TABLE public.unified_classifications IS 'التصنيفات الموحدة - تربط القطاعات بالفئات';
COMMENT ON COLUMN public.unified_classifications.item_type IS 'نوع العنصر: product (منتج), waste (مخلف), both (كليهما)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_unified_classifications_sector ON public.unified_classifications(sector_id);
CREATE INDEX IF NOT EXISTS idx_unified_classifications_item_type ON public.unified_classifications(item_type);
CREATE INDEX IF NOT EXISTS idx_unified_classifications_active ON public.unified_classifications(is_active);

-- =====================================================
-- 4. إنشاء جدول الفئات الأساسية الموحد
-- =====================================================
CREATE TABLE IF NOT EXISTS public.unified_main_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classification_id UUID NOT NULL REFERENCES public.unified_classifications(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200), -- الاسم بالعربية
    description TEXT,
    item_type item_type_enum NOT NULL DEFAULT 'both',
    parent_id UUID REFERENCES public.unified_main_categories(id) ON DELETE SET NULL, -- للهيكل الهرمي
    level INTEGER NOT NULL DEFAULT 0, -- مستوى الهيكل الهرمي
    path TEXT NOT NULL DEFAULT '', -- المسار الهرمي (مثل: /1/2/3)
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unified_main_categories_code_unique UNIQUE (code),
    CONSTRAINT unified_main_categories_classification_name_unique UNIQUE (classification_id, name)
);

COMMENT ON TABLE public.unified_main_categories IS 'الفئات الأساسية الموحدة - تربط التصنيفات بالفئات الفرعية';
COMMENT ON COLUMN public.unified_main_categories.parent_id IS 'الفئة الأساسية الأب (للهيكل الهرمي)';
COMMENT ON COLUMN public.unified_main_categories.level IS 'مستوى الفئة في الهيكل الهرمي (0 = الجذر)';
COMMENT ON COLUMN public.unified_main_categories.path IS 'المسار الهرمي للفئة (مثل: /1/2/3)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_unified_main_categories_classification ON public.unified_main_categories(classification_id);
CREATE INDEX IF NOT EXISTS idx_unified_main_categories_parent ON public.unified_main_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_unified_main_categories_item_type ON public.unified_main_categories(item_type);
CREATE INDEX IF NOT EXISTS idx_unified_main_categories_active ON public.unified_main_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_unified_main_categories_code ON public.unified_main_categories(code);

-- =====================================================
-- 5. إنشاء جدول الفئات الفرعية الموحد
-- =====================================================
CREATE TABLE IF NOT EXISTS public.unified_sub_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    main_category_id UUID NOT NULL REFERENCES public.unified_main_categories(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200), -- الاسم بالعربية
    description TEXT,
    item_type item_type_enum NOT NULL DEFAULT 'both',
    parent_id UUID REFERENCES public.unified_sub_categories(id) ON DELETE SET NULL, -- للهيكل الهرمي
    level INTEGER NOT NULL DEFAULT 0,
    path TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unified_sub_categories_code_unique UNIQUE (code),
    CONSTRAINT unified_sub_categories_main_name_unique UNIQUE (main_category_id, name)
);

COMMENT ON TABLE public.unified_sub_categories IS 'الفئات الفرعية الموحدة - المستوى الأخير في الهيكل الهرمي';
COMMENT ON COLUMN public.unified_sub_categories.parent_id IS 'الفئة الفرعية الأب (للهيكل الهرمي)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_unified_sub_categories_main ON public.unified_sub_categories(main_category_id);
CREATE INDEX IF NOT EXISTS idx_unified_sub_categories_parent ON public.unified_sub_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_unified_sub_categories_item_type ON public.unified_sub_categories(item_type);
CREATE INDEX IF NOT EXISTS idx_unified_sub_categories_active ON public.unified_sub_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_unified_sub_categories_code ON public.unified_sub_categories(code);

-- =====================================================
-- 6. إنشاء جدول البراندز الموحد
-- =====================================================
CREATE TABLE IF NOT EXISTS public.unified_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    logo_url TEXT,
    logo_path TEXT, -- مسار الصورة في Supabase Storage
    description_ar TEXT,
    description_en TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unified_brands_name_ar_unique UNIQUE (name_ar)
);

COMMENT ON TABLE public.unified_brands IS 'البراندز الموحدة - يمكن ربطها بالتصنيفات';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_unified_brands_active ON public.unified_brands(is_active);

-- =====================================================
-- 7. إنشاء جدول ربط الوحدات بالتصنيفات
-- =====================================================
CREATE TABLE IF NOT EXISTS public.classification_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classification_id UUID NOT NULL REFERENCES public.unified_classifications(id) ON DELETE CASCADE,
    unit_id BIGINT NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT classification_units_classification_unit_unique UNIQUE (classification_id, unit_id)
);

COMMENT ON TABLE public.classification_units IS 'ربط الوحدات بالتصنيفات - تحديد الوحدات المتاحة لكل تصنيف';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_classification_units_classification ON public.classification_units(classification_id);
CREATE INDEX IF NOT EXISTS idx_classification_units_unit ON public.classification_units(unit_id);
CREATE INDEX IF NOT EXISTS idx_classification_units_default ON public.classification_units(is_default);

-- =====================================================
-- 8. إنشاء جدول ربط البراندز بالتصنيفات
-- =====================================================
CREATE TABLE IF NOT EXISTS public.classification_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classification_id UUID NOT NULL REFERENCES public.unified_classifications(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES public.unified_brands(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT classification_brands_classification_brand_unique UNIQUE (classification_id, brand_id)
);

COMMENT ON TABLE public.classification_brands IS 'ربط البراندز بالتصنيفات - تحديد البراندز المتاحة لكل تصنيف';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_classification_brands_classification ON public.classification_brands(classification_id);
CREATE INDEX IF NOT EXISTS idx_classification_brands_brand ON public.classification_brands(brand_id);
CREATE INDEX IF NOT EXISTS idx_classification_brands_default ON public.classification_brands(is_default);

-- =====================================================
-- 9. إنشاء Functions لتحديث timestamps
-- =====================================================

-- Function لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers لتحديث updated_at
CREATE TRIGGER update_unified_classifications_updated_at
    BEFORE UPDATE ON public.unified_classifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unified_main_categories_updated_at
    BEFORE UPDATE ON public.unified_main_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unified_sub_categories_updated_at
    BEFORE UPDATE ON public.unified_sub_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unified_brands_updated_at
    BEFORE UPDATE ON public.unified_brands
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classification_units_updated_at
    BEFORE UPDATE ON public.classification_units
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classification_brands_updated_at
    BEFORE UPDATE ON public.classification_brands
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 10. إنشاء Views للاستعلامات السهلة
-- =====================================================

-- View لعرض الهيكل الكامل: قطاع -> تصنيف -> فئة أساسية -> فئة فرعية
CREATE OR REPLACE VIEW public.v_unified_category_hierarchy AS
SELECT 
    ws.id as sector_id,
    ws.name as sector_name,
    ws.code as sector_code,
    uc.id as classification_id,
    uc.name as classification_name,
    uc.item_type as classification_item_type,
    umc.id as main_category_id,
    umc.code as main_category_code,
    umc.name as main_category_name,
    umc.item_type as main_category_item_type,
    umc.level as main_category_level,
    usc.id as sub_category_id,
    usc.code as sub_category_code,
    usc.name as sub_category_name,
    usc.item_type as sub_category_item_type,
    usc.level as sub_category_level
FROM public.warehouse_sectors ws
LEFT JOIN public.unified_classifications uc ON uc.sector_id = ws.id
LEFT JOIN public.unified_main_categories umc ON umc.classification_id = uc.id
LEFT JOIN public.unified_sub_categories usc ON usc.main_category_id = umc.id
WHERE ws.is_active = true 
  AND uc.is_active = true 
  AND umc.is_active = true 
  AND usc.is_active = true;

COMMENT ON VIEW public.v_unified_category_hierarchy IS 'عرض الهيكل الكامل للفئات: قطاع -> تصنيف -> فئة أساسية -> فئة فرعية';

-- View لعرض التصنيفات مع الوحدات والبراندز المتاحة
CREATE OR REPLACE VIEW public.v_classifications_with_units_brands AS
SELECT 
    uc.id as classification_id,
    uc.name as classification_name,
    uc.item_type,
    ws.name as sector_name,
    -- الوحدات المتاحة
    COALESCE(
        json_agg(DISTINCT jsonb_build_object(
            'unit_id', u.id,
            'unit_code', u.code,
            'unit_name', u.name,
            'is_default', cu.is_default
        )) FILTER (WHERE u.id IS NOT NULL),
        '[]'::json
    ) as available_units,
    -- البراندز المتاحة
    COALESCE(
        json_agg(DISTINCT jsonb_build_object(
            'brand_id', ub.id,
            'brand_name_ar', ub.name_ar,
            'brand_name_en', ub.name_en,
            'is_default', cb.is_default
        )) FILTER (WHERE ub.id IS NOT NULL),
        '[]'::json
    ) as available_brands
FROM public.unified_classifications uc
JOIN public.warehouse_sectors ws ON ws.id = uc.sector_id
LEFT JOIN public.classification_units cu ON cu.classification_id = uc.id
LEFT JOIN public.units u ON u.id = cu.unit_id
LEFT JOIN public.classification_brands cb ON cb.classification_id = uc.id
LEFT JOIN public.unified_brands ub ON ub.id = cb.brand_id
WHERE uc.is_active = true
GROUP BY uc.id, uc.name, uc.item_type, ws.name;

COMMENT ON VIEW public.v_classifications_with_units_brands IS 'عرض التصنيفات مع الوحدات والبراندز المتاحة لكل تصنيف';

-- =====================================================
-- 11. Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.unified_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_main_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classification_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classification_brands ENABLE ROW LEVEL SECURITY;

-- Policies (يمكن تخصيصها حسب احتياجاتك)
-- سياسة للقراءة: جميع المستخدمين يمكنهم القراءة
CREATE POLICY "Allow read access to unified_classifications" ON public.unified_classifications
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to unified_main_categories" ON public.unified_main_categories
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to unified_sub_categories" ON public.unified_sub_categories
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to unified_brands" ON public.unified_brands
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to classification_units" ON public.classification_units
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to classification_brands" ON public.classification_brands
    FOR SELECT USING (true);

-- سياسة للكتابة: فقط المستخدمون المصرح لهم (يمكن تخصيصها)
CREATE POLICY "Allow insert access to unified_classifications" ON public.unified_classifications
    FOR INSERT WITH CHECK (true); -- يمكن استبدالها بفحص الصلاحيات

CREATE POLICY "Allow update access to unified_classifications" ON public.unified_classifications
    FOR UPDATE USING (true);

CREATE POLICY "Allow delete access to unified_classifications" ON public.unified_classifications
    FOR DELETE USING (true);

-- نفس السياسات للجداول الأخرى...
-- (يمكن إضافة سياسات أكثر تفصيلاً حسب احتياجاتك)

-- =====================================================
-- 12. ملاحظات مهمة
-- =====================================================

/*
ملاحظات:
1. هذا الملف ينشئ الجداول الموحدة فقط
2. يحتاج إلى ملف migration منفصل لنقل البيانات من الجداول القديمة
3. يحتاج إلى ملف migration منفصل لتحديث الجداول المرتبطة (catalog_products, catalog_waste_materials, etc.)
4. يمكن استخدام warehouse_sectors الموجود بدلاً من إنشاء unified_sectors
5. الوحدات (units) موجودة بالفعل ويمكن استخدامها مباشرة
*/


