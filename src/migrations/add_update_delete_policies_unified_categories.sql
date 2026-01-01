-- =====================================================
-- إضافة RLS Policies للتحديث والحذف على الجداول الموحدة
-- Add RLS Policies for UPDATE and DELETE on unified tables
-- =====================================================

-- =====================================================
-- unified_classifications
-- =====================================================
DROP POLICY IF EXISTS "Allow insert access to unified_classifications" ON public.unified_classifications;
DROP POLICY IF EXISTS "Allow update access to unified_classifications" ON public.unified_classifications;
DROP POLICY IF EXISTS "Allow delete access to unified_classifications" ON public.unified_classifications;

CREATE POLICY "Allow insert access to unified_classifications" ON public.unified_classifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to unified_classifications" ON public.unified_classifications
    FOR UPDATE USING (true);

CREATE POLICY "Allow delete access to unified_classifications" ON public.unified_classifications
    FOR DELETE USING (true);

-- =====================================================
-- unified_main_categories
-- =====================================================
DROP POLICY IF EXISTS "Allow insert access to unified_main_categories" ON public.unified_main_categories;
DROP POLICY IF EXISTS "Allow update access to unified_main_categories" ON public.unified_main_categories;
DROP POLICY IF EXISTS "Allow delete access to unified_main_categories" ON public.unified_main_categories;

CREATE POLICY "Allow insert access to unified_main_categories" ON public.unified_main_categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to unified_main_categories" ON public.unified_main_categories
    FOR UPDATE USING (true);

CREATE POLICY "Allow delete access to unified_main_categories" ON public.unified_main_categories
    FOR DELETE USING (true);

-- =====================================================
-- unified_sub_categories
-- =====================================================
DROP POLICY IF EXISTS "Allow insert access to unified_sub_categories" ON public.unified_sub_categories;
DROP POLICY IF EXISTS "Allow update access to unified_sub_categories" ON public.unified_sub_categories;
DROP POLICY IF EXISTS "Allow delete access to unified_sub_categories" ON public.unified_sub_categories;

CREATE POLICY "Allow insert access to unified_sub_categories" ON public.unified_sub_categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to unified_sub_categories" ON public.unified_sub_categories
    FOR UPDATE USING (true);

CREATE POLICY "Allow delete access to unified_sub_categories" ON public.unified_sub_categories
    FOR DELETE USING (true);

-- =====================================================
-- classification_units
-- =====================================================
DROP POLICY IF EXISTS "Allow insert access to classification_units" ON public.classification_units;
DROP POLICY IF EXISTS "Allow update access to classification_units" ON public.classification_units;
DROP POLICY IF EXISTS "Allow delete access to classification_units" ON public.classification_units;

CREATE POLICY "Allow insert access to classification_units" ON public.classification_units
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to classification_units" ON public.classification_units
    FOR UPDATE USING (true);

CREATE POLICY "Allow delete access to classification_units" ON public.classification_units
    FOR DELETE USING (true);

-- =====================================================
-- classification_brands
-- =====================================================
DROP POLICY IF EXISTS "Allow insert access to classification_brands" ON public.classification_brands;
DROP POLICY IF EXISTS "Allow update access to classification_brands" ON public.classification_brands;
DROP POLICY IF EXISTS "Allow delete access to classification_brands" ON public.classification_brands;

CREATE POLICY "Allow insert access to classification_brands" ON public.classification_brands
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to classification_brands" ON public.classification_brands
    FOR UPDATE USING (true);

CREATE POLICY "Allow delete access to classification_brands" ON public.classification_brands
    FOR DELETE USING (true);

