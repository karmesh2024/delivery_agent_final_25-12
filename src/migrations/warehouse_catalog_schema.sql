-- Warehouse Catalog Schema (products + waste)

-- 1) Units reference
CREATE TABLE IF NOT EXISTS public.units (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

-- 2) Product categories (main + sub)
CREATE TABLE IF NOT EXISTS public.product_main_categories (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.product_sub_categories (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  main_id BIGINT REFERENCES public.product_main_categories(id) ON DELETE CASCADE
);

-- 3) Product catalog
CREATE TABLE IF NOT EXISTS public.catalog_products (
  id BIGSERIAL PRIMARY KEY,
  warehouse_id INT NULL REFERENCES public.warehouses(id) ON DELETE SET NULL,
  sku TEXT UNIQUE NOT NULL,
  product_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  main_category_id BIGINT REFERENCES public.product_main_categories(id),
  sub_category_id BIGINT REFERENCES public.product_sub_categories(id),
  unit_mode TEXT CHECK (unit_mode IN ('weight','volume','count','dimension')),
  unit_id BIGINT REFERENCES public.units(id),
  weight NUMERIC(12,3),
  length NUMERIC(12,3),
  width NUMERIC(12,3),
  height NUMERIC(12,3),
  color TEXT,
  size TEXT,
  gender TEXT,
  season TEXT,
  fabric_type TEXT,
  max_qty NUMERIC(12,3),
  min_qty NUMERIC(12,3),
  qr_code TEXT,
  production_date DATE,
  status TEXT,
  compliance_certificates TEXT,
  usage_warnings TEXT,
  child_safe BOOLEAN,
  expiry_date DATE,
  storage_location TEXT,
  storage_temperature TEXT,
  special_storage_conditions TEXT,
  stackable BOOLEAN,
  max_stack_height NUMERIC(12,3),
  notes TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) Waste categories (main + sub)
CREATE TABLE IF NOT EXISTS public.waste_main_categories (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.waste_sub_categories (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  main_id BIGINT REFERENCES public.waste_main_categories(id) ON DELETE CASCADE
);

-- 5) Waste catalog (reference definitions)
CREATE TABLE IF NOT EXISTS public.catalog_waste_materials (
  id BIGSERIAL PRIMARY KEY,
  waste_no TEXT UNIQUE NOT NULL,
  warehouse_id INT NULL REFERENCES public.warehouses(id) ON DELETE SET NULL,
  main_category_id BIGINT REFERENCES public.waste_main_categories(id),
  sub_category_id BIGINT REFERENCES public.waste_sub_categories(id),
  source TEXT,
  related_product_id BIGINT NULL REFERENCES public.catalog_products(id) ON DELETE SET NULL,
  unit_mode TEXT CHECK (unit_mode IN ('weight','volume','count','dimension')),
  unit_id BIGINT REFERENCES public.units(id),
  weight NUMERIC(12,3),
  volume NUMERIC(12,3),
  count NUMERIC(12,3),
  length NUMERIC(12,3),
  width NUMERIC(12,3),
  height NUMERIC(12,3),
  recyclable BOOLEAN,
  quality_grade TEXT,
  impurities_percent NUMERIC(5,2),
  sorting_status TEXT,
  contamination_level TEXT,
  disposal_reason TEXT,
  disposal_method TEXT,
  expected_price NUMERIC(12,2),
  expected_total NUMERIC(12,2),
  temp_location TEXT,
  rack_row_col TEXT,
  storage_conditions TEXT,
  stackable BOOLEAN,
  max_stack_height NUMERIC(12,3),
  max_storage_days INT,
  alert_on_exceed BOOLEAN,
  status TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  env_carbon_saving NUMERIC(12,3),
  env_energy_saving NUMERIC(12,3),
  env_water_saving NUMERIC(12,3),
  env_trees_saved NUMERIC(12,3),
  qr_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_catalog_products_sku ON public.catalog_products(sku);
CREATE INDEX IF NOT EXISTS idx_catalog_waste_waste_no ON public.catalog_waste_materials(waste_no);

-- جدول أنواع المنتجات
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

-- جدول البراندز (العلامات التجارية)
CREATE TABLE IF NOT EXISTS public.warehouse_product_brands (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT, -- رابط الصورة في Supabase Storage
    logo_path TEXT, -- مسار الملف في Storage
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة بيانات أولية للبراندز
INSERT INTO public.warehouse_product_brands (name, description) VALUES 
('برسيل', 'منظفات ومنتجات العناية بالمنزل'),
('أريال', 'منظفات الغسيل والعناية بالملابس'),
('فيري', 'منظفات الأطباق والمنزل'),
('دوف', 'منتجات العناية الشخصية'),
('شامبو', 'منتجات العناية بالشعر'),
('كولجيت', 'منتجات العناية بالفم والأسنان'),
('نيفيا', 'منتجات العناية بالبشرة'),
('جونسون', 'منتجات العناية بالأطفال'),
('بيبسي', 'المشروبات الغازية'),
('كوكا كولا', 'المشروبات الغازية')
ON CONFLICT (name) DO NOTHING;


