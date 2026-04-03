-- Add discount fields to store_catalog_products
ALTER TABLE public.store_catalog_products
ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2);

-- Update store_product_prices to ensure it has necessary columns (it seems they already exist based on schema check)
-- but just in case:
-- ALTER TABLE public.store_product_prices ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false;
-- ALTER TABLE public.store_product_prices ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2);
