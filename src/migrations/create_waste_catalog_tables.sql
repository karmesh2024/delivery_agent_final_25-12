-- إنشاء جداول كتالوج المخلفات
-- تاريخ الإنشاء: 2025-01-18

-- 1. جدول الوحدات
CREATE TABLE IF NOT EXISTS public.units (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    type TEXT CHECK (type IN ('weight', 'volume', 'count', 'dimension')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة بيانات أولية للوحدات
INSERT INTO public.units (name, symbol, type) VALUES 
('كيلوجرام', 'كجم', 'weight'),
('جرام', 'جم', 'weight'),
('طن', 'طن', 'weight'),
('لتر', 'لتر', 'volume'),
('متر مكعب', 'م³', 'volume'),
('قطعة', 'قطعة', 'count'),
('متر', 'م', 'dimension'),
('سنتيمتر', 'سم', 'dimension')
ON CONFLICT (name) DO NOTHING;

-- 2. جدول مصادر المخلفات
CREATE TABLE IF NOT EXISTS public.waste_sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة بيانات أولية لمصادر المخلفات
INSERT INTO public.waste_sources (id, name, description) VALUES 
('damaged_product', 'منتج تالف', 'منتجات تالفة أو معيبة'),
('expired_product', 'منتج منتهي الصلاحية', 'منتجات انتهت صلاحيتها'),
('empty_containers', 'عبوات فارغة', 'عبوات فارغة من المنتجات'),
('returns', 'مرتجعات', 'منتجات مرتجعة من العملاء'),
('production_residues', 'بقايا إنتاج/تغليف', 'بقايا من عمليات الإنتاج والتغليف'),
('packaging_materials', 'مواد تغليف', 'مواد تغليف مستخدمة'),
('office_waste', 'مخلفات مكتبية', 'مخلفات من المكاتب والإدارة'),
('other', 'أخرى', 'مصادر أخرى للمخلفات')
ON CONFLICT (id) DO NOTHING;

-- 3. جدول الفئات الرئيسية للمخلفات
CREATE TABLE IF NOT EXISTS public.waste_main_categories (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة بيانات أولية للفئات الرئيسية
INSERT INTO public.waste_main_categories (code, name, description) VALUES 
('PLASTIC', 'بلاستيك', 'مخلفات بلاستيكية قابلة للتدوير'),
('METAL', 'معادن', 'مخلفات معدنية قابلة للتدوير'),
('PAPER', 'كرتون/ورق', 'مخلفات ورقية وكرتونية'),
('GLASS', 'زجاج', 'مخلفات زجاجية قابلة للتدوير'),
('FABRIC', 'أقمشة/نسيج', 'مخلفات نسيجية وأقمشة'),
('ORGANIC', 'مواد عضوية', 'مخلفات عضوية قابلة للتحلل'),
('ELECTRONIC', 'إلكترونيات', 'مخلفات إلكترونية'),
('OTHER', 'أخرى', 'مخلفات أخرى')
ON CONFLICT (code) DO NOTHING;

-- 4. جدول الفئات الفرعية للمخلفات
CREATE TABLE IF NOT EXISTS public.waste_sub_categories (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    main_category_id BIGINT REFERENCES public.waste_main_categories(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة بيانات أولية للفئات الفرعية
INSERT INTO public.waste_sub_categories (code, name, main_category_id, description) VALUES 
-- بلاستيك
('PLASTIC_BOTTLE', 'زجاجات بلاستيكية', 1, 'زجاجات مياه ومشروبات'),
('PLASTIC_BAG', 'أكياس بلاستيكية', 1, 'أكياس تسوق وحقائب'),
('PLASTIC_CONTAINER', 'حاويات بلاستيكية', 1, 'حاويات طعام ومستحضرات'),
('PLASTIC_WRAP', 'أغلفة بلاستيكية', 1, 'أغلفة وأفلام بلاستيكية'),
-- معادن
('METAL_CAN', 'علب معدنية', 2, 'علب مشروبات ومعلبات'),
('METAL_SCRAP', 'خردة معدنية', 2, 'قطع معدنية متنوعة'),
('METAL_WIRE', 'أسلاك معدنية', 2, 'أسلاك نحاسية وألمنيوم'),
-- ورق
('CARDBOARD', 'كرتون', 3, 'صناديق كرتونية'),
('PAPER_OFFICE', 'ورق مكتبي', 3, 'ورق طباعة ومستندات'),
('PAPER_NEWSPAPER', 'جرائد ومجلات', 3, 'مطبوعات ورقية'),
-- زجاج
('GLASS_BOTTLE', 'زجاجات زجاجية', 4, 'زجاجات مشروبات'),
('GLASS_CONTAINER', 'حاويات زجاجية', 4, 'جرار وأواني زجاجية'),
('GLASS_WINDOW', 'زجاج نوافذ', 4, 'زجاج نوافذ ومرايا'),
-- أقمشة
('FABRIC_CLOTHING', 'ملابس', 5, 'ملابس مستعملة'),
('FABRIC_BEDDING', 'أغطية وفرش', 5, 'أغطية ووسائد'),
-- عضوية
('ORGANIC_FOOD', 'مخلفات طعام', 6, 'بقايا طعام ومواد عضوية'),
('ORGANIC_GARDEN', 'مخلفات حدائق', 6, 'أوراق وأغصان'),
-- إلكترونيات
('ELECTRONIC_SMALL', 'إلكترونيات صغيرة', 7, 'هواتف وأجهزة صغيرة'),
('ELECTRONIC_LARGE', 'إلكترونيات كبيرة', 7, 'تلفزيونات وأجهزة كبيرة'),
-- أخرى
('OTHER_MIXED', 'مخلفات مختلطة', 8, 'مخلفات متنوعة')
ON CONFLICT (code) DO NOTHING;

-- 5. إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_waste_sub_categories_main_category_id 
ON public.waste_sub_categories(main_category_id);

CREATE INDEX IF NOT EXISTS idx_units_type 
ON public.units(type);

-- 6. إضافة RLS (Row Level Security) إذا لزم الأمر
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_main_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_sub_categories ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للقراءة العامة
CREATE POLICY "Allow public read access to units" ON public.units FOR SELECT USING (true);
CREATE POLICY "Allow public read access to waste_sources" ON public.waste_sources FOR SELECT USING (true);
CREATE POLICY "Allow public read access to waste_main_categories" ON public.waste_main_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access to waste_sub_categories" ON public.waste_sub_categories FOR SELECT USING (true);

-- سياسات RLS للإدراج والتحديث (للمستخدمين المصرح لهم)
CREATE POLICY "Allow authenticated users to insert units" ON public.units FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert waste_sources" ON public.waste_sources FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert waste_main_categories" ON public.waste_main_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert waste_sub_categories" ON public.waste_sub_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- رسالة نجاح
SELECT 'تم إنشاء جداول كتالوج المخلفات بنجاح!' as message;
