-- Migration: Add catalog_product_id to warehouse_invoice_items for linking with catalog_products
-- This allows warehouse invoice items to track products from the warehouse catalog

-- Make product_id nullable to allow using catalog_product_id instead
ALTER TABLE public.warehouse_invoice_items
ALTER COLUMN product_id DROP NOT NULL;

-- Add catalog_product_id column
ALTER TABLE public.warehouse_invoice_items
ADD COLUMN IF NOT EXISTS catalog_product_id BIGINT REFERENCES public.catalog_products(id) ON DELETE SET NULL ON UPDATE NO ACTION;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_warehouse_invoice_items_catalog_product_id
ON public.warehouse_invoice_items(catalog_product_id);

-- Add comment
COMMENT ON COLUMN public.warehouse_invoice_items.catalog_product_id IS 'Reference to catalog_products table for warehouse catalog products';

-- Update the foreign key constraint for store_products to allow NULL
-- (The constraint already allows NULL since we made product_id nullable)

