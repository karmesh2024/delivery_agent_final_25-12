-- =====================================================
-- إضافة جداول ربط البراندز بالفئات الأساسية والفرعية
-- Add tables to link brands to main categories and sub categories
-- =====================================================

-- =====================================================
-- 1. جدول ربط البراندز بالفئات الأساسية
-- =====================================================
CREATE TABLE IF NOT EXISTS public.main_category_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    main_category_id UUID NOT NULL REFERENCES public.unified_main_categories(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES public.unified_brands(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT main_category_brands_main_category_brand_unique UNIQUE (main_category_id, brand_id)
);

COMMENT ON TABLE public.main_category_brands IS 'ربط البراندز بالفئات الأساسية - تحديد البراندز المتاحة لكل فئة أساسية';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_main_category_brands_main_category ON public.main_category_brands(main_category_id);
CREATE INDEX IF NOT EXISTS idx_main_category_brands_brand ON public.main_category_brands(brand_id);
CREATE INDEX IF NOT EXISTS idx_main_category_brands_default ON public.main_category_brands(is_default);

-- =====================================================
-- 2. جدول ربط البراندز بالفئات الفرعية
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sub_category_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_category_id UUID NOT NULL REFERENCES public.unified_sub_categories(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES public.unified_brands(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT sub_category_brands_sub_category_brand_unique UNIQUE (sub_category_id, brand_id)
);

COMMENT ON TABLE public.sub_category_brands IS 'ربط البراندز بالفئات الفرعية - تحديد البراندز المتاحة لكل فئة فرعية';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sub_category_brands_sub_category ON public.sub_category_brands(sub_category_id);
CREATE INDEX IF NOT EXISTS idx_sub_category_brands_brand ON public.sub_category_brands(brand_id);
CREATE INDEX IF NOT EXISTS idx_sub_category_brands_default ON public.sub_category_brands(is_default);

-- =====================================================
-- 3. Triggers لتحديث updated_at
-- =====================================================
CREATE TRIGGER update_main_category_brands_updated_at
    BEFORE UPDATE ON public.main_category_brands
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sub_category_brands_updated_at
    BEFORE UPDATE ON public.sub_category_brands
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 4. Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE public.main_category_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_category_brands ENABLE ROW LEVEL SECURITY;

-- Policies للقراءة
CREATE POLICY "Allow read access to main_category_brands" ON public.main_category_brands
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to sub_category_brands" ON public.sub_category_brands
    FOR SELECT USING (true);

-- Policies للكتابة
CREATE POLICY "Allow insert access to main_category_brands" ON public.main_category_brands
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to main_category_brands" ON public.main_category_brands
    FOR UPDATE USING (true);

CREATE POLICY "Allow delete access to main_category_brands" ON public.main_category_brands
    FOR DELETE USING (true);

CREATE POLICY "Allow insert access to sub_category_brands" ON public.sub_category_brands
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to sub_category_brands" ON public.sub_category_brands
    FOR UPDATE USING (true);

CREATE POLICY "Allow delete access to sub_category_brands" ON public.sub_category_brands
    FOR DELETE USING (true);

