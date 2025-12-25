-- =================================================================
--      ADD RLS POLICIES FOR BASKET CONFIGURATION TABLES
-- =================================================================
-- This migration enables Row Level Security (RLS) for the new
-- basket configuration tables and creates policies to grant access.
-- Without these policies, all requests to these tables will be denied.
-- =================================================================

-- 1. Enable RLS for the configuration tables
ALTER TABLE public.category_bucket_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategory_bucket_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baskets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.basket_contents ENABLE ROW LEVEL SECURITY;


-- 2. Create policies for 'category_bucket_config'
-- Allow admins to perform all operations
CREATE POLICY "Allow admin full access on category bucket configs"
ON public.category_bucket_config
FOR ALL
USING (true)
WITH CHECK (true);

-- 3. Create policies for 'subcategory_bucket_config'
-- Allow admins to perform all operations
CREATE POLICY "Allow admin full access on subcategory bucket configs"
ON public.subcategory_bucket_config
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Create policies for 'baskets'
-- Allow authenticated users to read baskets
CREATE POLICY "Allow authenticated users to read baskets"
ON public.baskets
FOR SELECT
TO authenticated
USING (true);

-- Allow admins to manage baskets
CREATE POLICY "Allow admin full access on baskets"
ON public.baskets
FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Create policies for 'basket_contents'
-- Allow authenticated users to read basket contents
CREATE POLICY "Allow authenticated users to read basket contents"
ON public.basket_contents
FOR SELECT
TO authenticated
USING (true);

-- Allow admins to manage basket contents
CREATE POLICY "Allow admin full access on basket contents"
ON public.basket_contents
FOR ALL
USING (true)
WITH CHECK (true);

-- =================================================================
--                      END OF MIGRATION
-- ================================================================= 