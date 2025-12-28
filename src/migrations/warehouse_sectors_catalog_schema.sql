-- إدارة القطاعات والكتالوج الأساسي
-- هذا المخطط يدعم النظام الجديد حيث الإدارة العليا تدير القطاعات والكتالوج

-- إنشاء جدول القطاعات
CREATE TABLE IF NOT EXISTS public.warehouse_sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    code VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6', -- لون القطاع
    warehouse_levels TEXT[] DEFAULT '{}', -- المستويات المسموحة ['admin', 'country', 'city', 'district']
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول فئات المنتجات
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sector_id UUID REFERENCES public.warehouse_sectors(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول فئات المخلفات
CREATE TABLE IF NOT EXISTS public.waste_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sector_id UUID REFERENCES public.warehouse_sectors(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول المنتجات الأساسي
CREATE TABLE IF NOT EXISTS public.base_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.product_categories(id) ON DELETE CASCADE,
    unit VARCHAR(50) DEFAULT 'قطعة', -- وحدة القياس
    base_price DECIMAL(10, 2), -- السعر الأساسي
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول المخلفات الأساسي
CREATE TABLE IF NOT EXISTS public.base_waste (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.waste_categories(id) ON DELETE CASCADE,
    unit VARCHAR(50) DEFAULT 'كيلو', -- وحدة القياس
    disposal_cost DECIMAL(10, 2), -- تكلفة التخلص
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول ربط المخازن بالقطاعات
CREATE TABLE IF NOT EXISTS public.warehouse_sector_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id INTEGER REFERENCES public.warehouses(id) ON DELETE CASCADE,
    sector_id UUID REFERENCES public.warehouse_sectors(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE, -- هل هو القطاع الأساسي للمخزن
    capacity_percentage INTEGER DEFAULT 100, -- نسبة السعة المخصصة لهذا القطاع
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by INTEGER, -- من قام بالتخصيص
    UNIQUE(warehouse_id, sector_id)
);

-- إنشاء جدول ربط المخازن بفئات المنتجات
CREATE TABLE IF NOT EXISTS public.warehouse_product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id INTEGER REFERENCES public.warehouses(id) ON DELETE CASCADE,
    product_category_id UUID REFERENCES public.product_categories(id) ON DELETE CASCADE,
    is_allowed BOOLEAN DEFAULT TRUE, -- هل مسموح بهذا النوع من المنتجات
    max_capacity INTEGER, -- الحد الأقصى للسعة
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(warehouse_id, product_category_id)
);

-- إنشاء جدول ربط المخازن بفئات المخلفات
CREATE TABLE IF NOT EXISTS public.warehouse_waste_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id INTEGER REFERENCES public.warehouses(id) ON DELETE CASCADE,
    waste_category_id UUID REFERENCES public.waste_categories(id) ON DELETE CASCADE,
    is_allowed BOOLEAN DEFAULT TRUE, -- هل مسموح بهذا النوع من المخلفات
    max_capacity INTEGER, -- الحد الأقصى للسعة
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(warehouse_id, waste_category_id)
);

-- إنشاء فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_warehouse_sectors_code ON public.warehouse_sectors(code);
CREATE INDEX IF NOT EXISTS idx_warehouse_sectors_active ON public.warehouse_sectors(is_active);
CREATE INDEX IF NOT EXISTS idx_product_categories_sector ON public.product_categories(sector_id);
CREATE INDEX IF NOT EXISTS idx_waste_categories_sector ON public.waste_categories(sector_id);
CREATE INDEX IF NOT EXISTS idx_base_products_category ON public.base_products(category_id);
CREATE INDEX IF NOT EXISTS idx_base_waste_category ON public.base_waste(category_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_sector_assignments_warehouse ON public.warehouse_sector_assignments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_sector_assignments_sector ON public.warehouse_sector_assignments(sector_id);

-- إنشاء RLS policies
ALTER TABLE public.warehouse_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_waste ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_sector_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_waste_categories ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "warehouse_sectors_policy" ON public.warehouse_sectors
    FOR ALL USING (true);

CREATE POLICY "product_categories_policy" ON public.product_categories
    FOR ALL USING (true);

CREATE POLICY "waste_categories_policy" ON public.waste_categories
    FOR ALL USING (true);

CREATE POLICY "base_products_policy" ON public.base_products
    FOR ALL USING (true);

CREATE POLICY "base_waste_policy" ON public.base_waste
    FOR ALL USING (true);

CREATE POLICY "warehouse_sector_assignments_policy" ON public.warehouse_sector_assignments
    FOR ALL USING (true);

CREATE POLICY "warehouse_product_categories_policy" ON public.warehouse_product_categories
    FOR ALL USING (true);

CREATE POLICY "warehouse_waste_categories_policy" ON public.warehouse_waste_categories
    FOR ALL USING (true);

-- إدراج قطاعات افتراضية
INSERT INTO public.warehouse_sectors (name, description, code, color, warehouse_levels) VALUES
('القطاع الصناعي', 'المخلفات والمنتجات الصناعية', 'IND', '#3B82F6', ARRAY['country', 'city', 'district']),
('القطاع التجاري', 'المخلفات والمنتجات التجارية', 'COM', '#10B981', ARRAY['city', 'district']),
('القطاع الزراعي', 'المخلفات والمنتجات الزراعية', 'AGR', '#F59E0B', ARRAY['country', 'city', 'district']),
('القطاع الطبي', 'المخلفات والمنتجات الطبية', 'MED', '#EF4444', ARRAY['city', 'district']),
('القطاع المنزلي', 'المخلفات المنزلية', 'RES', '#8B5CF6', ARRAY['district'])
ON CONFLICT (code) DO NOTHING;

-- إدراج فئات منتجات افتراضية
INSERT INTO public.product_categories (name, description, sector_id) VALUES
('الأجهزة الإلكترونية', 'أجهزة الكمبيوتر والهواتف والأجهزة الإلكترونية', (SELECT id FROM public.warehouse_sectors WHERE code = 'IND')),
('المواد الغذائية', 'المواد الغذائية المعلبة والطازجة', (SELECT id FROM public.warehouse_sectors WHERE code = 'COM')),
('المعدات الزراعية', 'الأدوات والمعدات الزراعية', (SELECT id FROM public.warehouse_sectors WHERE code = 'AGR')),
('الأدوية والمستلزمات الطبية', 'الأدوية والمستلزمات الطبية', (SELECT id FROM public.warehouse_sectors WHERE code = 'MED')),
('الأثاث المنزلي', 'الأثاث والأدوات المنزلية', (SELECT id FROM public.warehouse_sectors WHERE code = 'RES'))
ON CONFLICT DO NOTHING;

-- إدراج فئات مخلفات افتراضية
INSERT INTO public.waste_categories (name, description, sector_id) VALUES
('المخلفات الإلكترونية', 'المخلفات الإلكترونية والكهربائية', (SELECT id FROM public.warehouse_sectors WHERE code = 'IND')),
('المخلفات التجارية', 'المخلفات الناتجة عن الأنشطة التجارية', (SELECT id FROM public.warehouse_sectors WHERE code = 'COM')),
('المخلفات الزراعية', 'المخلفات الزراعية والنباتية', (SELECT id FROM public.warehouse_sectors WHERE code = 'AGR')),
('المخلفات الطبية', 'المخلفات الطبية الخطرة', (SELECT id FROM public.warehouse_sectors WHERE code = 'MED')),
('المخلفات المنزلية', 'المخلفات المنزلية العادية', (SELECT id FROM public.warehouse_sectors WHERE code = 'RES'))
ON CONFLICT DO NOTHING;

-- تعليق على الجداول
COMMENT ON TABLE public.warehouse_sectors IS 'القطاعات المتاحة للمخازن';
COMMENT ON TABLE public.product_categories IS 'فئات المنتجات الأساسية';
COMMENT ON TABLE public.waste_categories IS 'فئات المخلفات الأساسية';
COMMENT ON TABLE public.base_products IS 'المنتجات الأساسية في النظام';
COMMENT ON TABLE public.base_waste IS 'المخلفات الأساسية في النظام';
COMMENT ON TABLE public.warehouse_sector_assignments IS 'ربط المخازن بالقطاعات';
COMMENT ON TABLE public.warehouse_product_categories IS 'ربط المخازن بفئات المنتجات';
COMMENT ON TABLE public.warehouse_waste_categories IS 'ربط المخازن بفئات المخلفات';

COMMENT ON COLUMN public.warehouse_sectors.warehouse_levels IS 'المستويات المسموحة للقطاع';
COMMENT ON COLUMN public.warehouse_sector_assignments.is_primary IS 'هل هو القطاع الأساسي للمخزن';
COMMENT ON COLUMN public.warehouse_sector_assignments.capacity_percentage IS 'نسبة السعة المخصصة للقطاع';


