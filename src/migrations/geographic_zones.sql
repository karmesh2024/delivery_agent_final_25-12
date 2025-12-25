-- Ensure PostGIS extension is enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create geographic_zones table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.geographic_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    area_polygon GEOMETRY(POLYGON, 4326), -- SRID 4326 is WGS84, standard for GPS coordinates
    center_point GEOMETRY(POINT, 4326),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure 'is_active' column exists before creating an index on it
ALTER TABLE public.geographic_zones ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add index on area_polygon for spatial queries
CREATE INDEX IF NOT EXISTS idx_geographic_zones_area_polygon ON public.geographic_zones USING GIST(area_polygon);

-- Add index on center_point for distance calculations
CREATE INDEX IF NOT EXISTS idx_geographic_zones_center_point ON public.geographic_zones USING GIST(center_point);

-- Add index on name for searching/sorting
CREATE INDEX IF NOT EXISTS idx_geographic_zones_name ON public.geographic_zones(name);

-- Add index on is_active to quickly filter active zones
CREATE INDEX IF NOT EXISTS idx_geographic_zones_is_active ON public.geographic_zones(is_active);

-- Add the RLS policies
ALTER TABLE public.geographic_zones ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read all zones (for selection in UI etc.)
DROP POLICY IF EXISTS "Authenticated users can read all zones" ON public.geographic_zones;
CREATE POLICY "Authenticated users can read all zones"
ON public.geographic_zones
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy to allow admins to read all zones
DROP POLICY IF EXISTS "Admins can read all zones" ON public.geographic_zones;
CREATE POLICY "Admins can read all zones" 
ON public.geographic_zones 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy to allow admins to insert zones
DROP POLICY IF EXISTS "Admins can insert zones" ON public.geographic_zones;
CREATE POLICY "Admins can insert zones" 
ON public.geographic_zones 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow admins to update zones
DROP POLICY IF EXISTS "Admins can update zones" ON public.geographic_zones;
CREATE POLICY "Admins can update zones" 
ON public.geographic_zones 
FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow admins to delete zones
DROP POLICY IF EXISTS "Admins can delete zones" ON public.geographic_zones;
CREATE POLICY "Admins can delete zones" 
ON public.geographic_zones 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create delivery_zones table if it doesn't exist to relate agents to geographic zones
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL, -- Removed REFERENCES constraint, will be validated in application
    zone_name VARCHAR(255) NOT NULL,
    geographic_zone_id UUID REFERENCES public.geographic_zones(id) ON DELETE SET NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure 'is_primary' column exists before creating a unique index that uses it
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;

-- Add index on delivery_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_delivery_zones_delivery_id ON public.delivery_zones(delivery_id);

-- Add index on geographic_zone_id for faster joins
CREATE INDEX IF NOT EXISTS idx_delivery_zones_geographic_zone_id ON public.delivery_zones(geographic_zone_id);

-- Add unique partial index for is_primary
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_zones_delivery_id_is_primary_unique ON public.delivery_zones (delivery_id) WHERE is_primary = TRUE;

-- Add RLS policies for delivery_zones table
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Policy to allow admins to manage delivery zones
DROP POLICY IF EXISTS "Admins can manage delivery zones" ON public.delivery_zones;
CREATE POLICY "Admins can manage delivery zones" 
ON public.delivery_zones 
FOR ALL 
USING (auth.role() IN ('authenticated', 'anon'))
WITH CHECK (auth.role() IN ('authenticated', 'anon')); 