-- Migration to add owner_id column to delivery_boys table
ALTER TABLE public.delivery_boys
ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Update existing records to have owner_id = id (their own user_id)
UPDATE public.delivery_boys
SET owner_id = id
WHERE owner_id IS NULL;

-- Add an index on owner_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_delivery_boys_owner_id ON public.delivery_boys(owner_id);

-- Ensure new_profiles_delivery has primary key constraint
ALTER TABLE public.new_profiles_delivery 
ADD CONSTRAINT IF NOT EXISTS new_profiles_delivery_pkey 
PRIMARY KEY (id); 