-- Migration: Add catalog_product_id to warehouse_inventory for linking with catalog_products
-- This allows warehouse inventory to track products from the warehouse catalog

-- Add catalog_product_id column
ALTER TABLE public.warehouse_inventory
ADD COLUMN IF NOT EXISTS catalog_product_id BIGINT REFERENCES public.catalog_products(id) ON DELETE SET NULL ON UPDATE NO ACTION;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_catalog_product_id
ON public.warehouse_inventory(catalog_product_id);

-- Create unique constraint for warehouse_id + catalog_product_id combination
-- This ensures one inventory record per warehouse per catalog product
CREATE UNIQUE INDEX IF NOT EXISTS warehouse_inventory_warehouse_id_catalog_product_id_key
ON public.warehouse_inventory(warehouse_id, catalog_product_id)
WHERE catalog_product_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.warehouse_inventory.catalog_product_id IS 'Reference to catalog_products table for warehouse catalog products';

