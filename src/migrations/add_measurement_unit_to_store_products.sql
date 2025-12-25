-- Add measurement_unit enum and field to store_products table

-- Create the measurement_unit enum
CREATE TYPE measurement_unit AS ENUM('piece', 'dozen', 'kg', 'liter', 'pack', 'box', 'set', 'other');

-- Add the measurement_unit column to store_products table
ALTER TABLE store_products 
ADD COLUMN measurement_unit measurement_unit NOT NULL DEFAULT 'piece';

-- Add comment to the column
COMMENT ON COLUMN store_products.measurement_unit IS 'Unit of measurement for the product (piece, dozen, kg, liter, pack, box, set, other)';

-- Update existing records to have 'piece' as default (already set by DEFAULT clause)
-- This ensures all existing products have a valid measurement unit
