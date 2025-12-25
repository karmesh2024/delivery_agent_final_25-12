-- Migration: Add catalog_product_id to store_products for linking with catalog_products
-- This allows store products to reference products from warehouse catalog

-- Add catalog_product_id column
ALTER TABLE public.store_products
ADD COLUMN IF NOT EXISTS catalog_product_id BIGINT REFERENCES public.catalog_products(id) ON DELETE SET NULL ON UPDATE NO ACTION;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_store_products_catalog_product_id 
ON public.store_products(catalog_product_id);

-- Add comment
COMMENT ON COLUMN public.store_products.catalog_product_id IS 'Reference to catalog_products table - المنتج الأساسي من كتالوج المخازن';

