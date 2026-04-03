-- =================================================================
-- إصلاح العلاقات بعد إزالة @unique من subcategory_id
-- تاريخ: يناير 2026
-- =================================================================
-- الهدف: التأكد من أن points_configuration_id في subcategories هو unique
--        لدعم العلاقة one-to-one مع points_configurations
-- =================================================================

-- إضافة قيد فريد على points_configuration_id في subcategories إن لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subcategories_points_configuration_id_key'
    AND conrelid = 'public.subcategories'::regclass
  ) THEN
    ALTER TABLE public.subcategories
    ADD CONSTRAINT subcategories_points_configuration_id_key UNIQUE (points_configuration_id);
  END IF;
END $$;

COMMENT ON CONSTRAINT subcategories_points_configuration_id_key ON public.subcategories IS 
'قيد فريد لدعم العلاقة one-to-one مع points_configurations';
