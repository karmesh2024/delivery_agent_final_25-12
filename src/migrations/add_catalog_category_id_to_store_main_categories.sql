-- Migration: Add catalog_category_id to store_main_categories for optional linking with catalog categories
-- This allows store categories to optionally reference warehouse catalog categories

-- Add catalog_category_id column
ALTER TABLE public.store_main_categories
ADD COLUMN IF NOT EXISTS catalog_category_id BIGINT REFERENCES public.product_main_categories(id) ON DELETE SET NULL ON UPDATE NO ACTION;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_store_main_categories_catalog_category_id 
ON public.store_main_categories(catalog_category_id);

-- Add comment
COMMENT ON COLUMN public.store_main_categories.catalog_category_id IS 'Optional reference to product_main_categories - للربط الاختياري بفئات كتالوج المخازن';

