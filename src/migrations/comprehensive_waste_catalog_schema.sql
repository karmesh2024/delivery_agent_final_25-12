-- تحديث بيانات تصنيفات المخلفات بناءً على الجداول الموجودة
-- تاريخ التحديث: 2025-12-28

-- 1. التأكد من وجود وتحديث الفئات الأساسية (Main Categories)
INSERT INTO public.waste_main_categories (code, name) VALUES 
('PLASTIC', 'البلاستيك (Plastics)'),
('METAL', 'المعادن (Metals)'),
('PAPER', 'الورق والكرتون (Paper & Cardboard)'),
('GLASS', 'الزجاج (Glass)'),
('ELECTRONIC', 'المخلفات الإلكترونية (E-Waste)')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- 2. إضافة جداول الأنواع التفصيلية (المستوى الثالث)
-- هذه الجداول ستوفر التنوع الكبير الذي ذكرته (مثل أنواع الحديد، النحاس، إلخ)
CREATE TABLE IF NOT EXISTS public.plastic_types (
    id serial PRIMARY KEY,
    sub_id bigint REFERENCES public.waste_sub_categories(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.metal_types (
    id serial PRIMARY KEY,
    sub_id bigint REFERENCES public.waste_sub_categories(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.paper_types (
    id serial PRIMARY KEY,
    sub_id bigint REFERENCES public.waste_sub_categories(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 3. تعبئة التصنيفات الفرعية (Sub Categories) والأنواع الدقيقة
DO $$ 
DECLARE 
    m_plastic_id bigint;
    m_metal_id bigint;
    m_paper_id bigint;
    m_glass_id bigint;
    m_electronic_id bigint;
    
    s_id bigint;
BEGIN
    -- جلب IDs الفئات الأساسية
    SELECT id INTO m_plastic_id FROM public.waste_main_categories WHERE code = 'PLASTIC';
    SELECT id INTO m_metal_id FROM public.waste_main_categories WHERE code = 'METAL';
    SELECT id INTO m_paper_id FROM public.waste_main_categories WHERE code = 'PAPER';
    SELECT id INTO m_glass_id FROM public.waste_main_categories WHERE code = 'GLASS';
    SELECT id INTO m_electronic_id FROM public.waste_main_categories WHERE code = 'ELECTRONIC';

    -- أ) البلاستيك
    INSERT INTO public.waste_sub_categories (code, name, main_id) VALUES 
    ('PET', 'PET', m_plastic_id),
    ('HDPE', 'HDPE', m_plastic_id),
    ('LDPE', 'LDPE', m_plastic_id),
    ('PP', 'PP', m_plastic_id),
    ('PS', 'PS', m_plastic_id),
    ('PVC', 'PVC', m_plastic_id)
    ON CONFLICT (code) DO NOTHING;

    -- ب) المعادن
    INSERT INTO public.waste_sub_categories (code, name, main_id) VALUES 
    ('SCRAP_IRON', 'الحديد والصلب', m_metal_id),
    ('SCRAP_ALUM', 'الألومنيوم', m_metal_id),
    ('SCRAP_COPPER', 'النحاس', m_metal_id),
    ('SCRAP_OTHER', 'معادن أخرى', m_metal_id)
    ON CONFLICT (code) DO NOTHING;

    -- ج) الورق
    INSERT INTO public.waste_sub_categories (code, name, main_id) VALUES 
    ('PAPER_STOCK', 'أنواع الورق والكرتون', m_paper_id)
    ON CONFLICT (code) DO NOTHING;

    -- د) تعبئة الأنواع الدقيقة للمعادن (مثال)
    SELECT id INTO s_id FROM public.waste_sub_categories WHERE code = 'SCRAP_IRON';
    INSERT INTO public.metal_types (sub_id, name) VALUES 
    (s_id, 'خردة حديد ثقيل'),
    (s_id, 'خردة حديد خفيف'),
    (s_id, 'برادة حديد') ON CONFLICT DO NOTHING;

    SELECT id INTO s_id FROM public.waste_sub_categories WHERE code = 'SCRAP_COPPER';
    INSERT INTO public.metal_types (sub_id, name) VALUES 
    (s_id, 'نحاس أحمر'),
    (s_id, 'نحاس أصفر'),
    (s_id, 'أسلاك نحاس') ON CONFLICT DO NOTHING;

END $$;
