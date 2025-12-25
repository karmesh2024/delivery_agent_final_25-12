-- Migration: Add store_product_id to warehouse_inventory for linking with store_products
-- This allows warehouse inventory to track products from e-commerce stores

-- Add store_product_id column
ALTER TABLE public.warehouse_inventory
ADD COLUMN IF NOT EXISTS store_product_id UUID REFERENCES public.store_products(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_store_product_id 
ON public.warehouse_inventory(store_product_id);

-- Create unique constraint for warehouse_id + store_product_id combination
-- This ensures one inventory record per warehouse per store product
CREATE UNIQUE INDEX IF NOT EXISTS warehouse_inventory_warehouse_id_store_product_id_key 
ON public.warehouse_inventory(warehouse_id, store_product_id) 
WHERE store_product_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.warehouse_inventory.store_product_id IS 'Reference to store_products table for e-commerce store products';

