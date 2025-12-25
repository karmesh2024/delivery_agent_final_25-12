-- Add is_primary column to delivery_zones table
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Add index to improve query performance on this column
CREATE INDEX IF NOT EXISTS idx_delivery_zones_is_primary ON public.delivery_zones (is_primary);

-- Create a unique partial index to ensure only one primary zone per delivery agent
DROP INDEX IF EXISTS idx_unique_primary_zone;
CREATE UNIQUE INDEX idx_unique_primary_zone ON public.delivery_zones (delivery_id) WHERE (is_primary = true);

-- Enable RLS
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Apply RLS policy for admins
DROP POLICY IF EXISTS "Admins can manage delivery zones" ON public.delivery_zones;
CREATE POLICY "Admins can manage delivery zones" 
  ON public.delivery_zones FOR ALL 
  TO authenticated 
  USING (auth.uid() IN (SELECT id FROM public.admins));

COMMENT ON COLUMN public.delivery_zones.is_primary IS 'Indicates whether this is the primary zone for the agent'; 