-- Extend warehouses with extra business fields and add child tables for full warehouse profile

-- 1) Enums
DO $$ BEGIN
  CREATE TYPE operation_status AS ENUM ('active', 'maintenance', 'temporarily_closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE storage_type AS ENUM ('dry', 'chilled', 'wet', 'mixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inventory_system AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Extend warehouses table
ALTER TABLE IF EXISTS public.warehouses
  ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS operation_status operation_status DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS storage_type storage_type,
  ADD COLUMN IF NOT EXISTS inventory_system inventory_system;

-- 3) Images bucket and policy
INSERT INTO storage.buckets (id, name)
VALUES ('warehouse-images', 'warehouse-images')
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users full access to warehouse-images bucket
DO $$ BEGIN
  CREATE POLICY "Allow auth access to warehouse-images" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'warehouse-images')
  WITH CHECK (bucket_id = 'warehouse-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT ALL ON storage.objects TO authenticated;

-- 4) Child tables
CREATE TABLE IF NOT EXISTS public.warehouse_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id INT NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.warehouse_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id INT NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  department_type TEXT NOT NULL CHECK (department_type IN ('products', 'waste', 'mixed')),
  category TEXT,
  operating_capacity DECIMAL(10,2),
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.warehouse_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id INT NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  department TEXT,
  operational_card TEXT,
  phone TEXT,
  role TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.warehouse_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id INT NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INT DEFAULT 1,
  status TEXT,
  usage_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.warehouse_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id INT NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL,
  count INT DEFAULT 1,
  capacity TEXT,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.warehouse_hours_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id INT NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  daily_hours TEXT,
  working_days TEXT,
  shifts TEXT,
  operation_mode TEXT,
  policy TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.warehouse_safety (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id INT NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  safety_level TEXT,
  fire_systems TEXT,
  monitoring_systems TEXT,
  emergency_preparedness TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.warehouse_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id INT NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_warehouse_images_wh ON public.warehouse_images(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_departments_wh ON public.warehouse_departments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_staff_wh ON public.warehouse_staff(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_equipment_wh ON public.warehouse_equipment(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_vehicles_wh ON public.warehouse_vehicles(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_hours_policies_wh ON public.warehouse_hours_policies(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_safety_wh ON public.warehouse_safety(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_notes_wh ON public.warehouse_notes(warehouse_id);


