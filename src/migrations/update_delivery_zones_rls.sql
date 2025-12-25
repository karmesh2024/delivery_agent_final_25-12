-- Disable RLS temporarily for development
ALTER TABLE public.delivery_zones DISABLE ROW LEVEL SECURITY;

-- Or create a more permissive policy
-- DROP POLICY IF EXISTS "Admins can manage delivery zones" ON public.delivery_zones;
-- CREATE POLICY "Anyone can manage delivery zones during development" 
--   ON public.delivery_zones FOR ALL 
--   TO authenticated 
--   USING (true);

-- Later, when ready for production, you can re-enable the stricter policy:
-- ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Anyone can manage delivery zones during development" ON public.delivery_zones;
-- CREATE POLICY "Admins can manage delivery zones" 
--   ON public.delivery_zones FOR ALL 
--   TO authenticated 
--   USING (auth.uid() IN (SELECT id FROM public.admins)); 