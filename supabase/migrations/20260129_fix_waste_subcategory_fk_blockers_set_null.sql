-- =============================================================================
-- Fix: منع حذف waste_sub_categories بسبب قيود FK (NoAction) في جداول أخرى
-- الهدف: السماح بحذف الفئة الفرعية حتى لو كانت مرتبطة بكتالوج/طلبات، عبر ON DELETE SET NULL
-- التاريخ: 2026-01-29
-- =============================================================================

-- 1) catalog_waste_materials.sub_category_id -> waste_sub_categories.id
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.catalog_waste_materials'::regclass
    AND contype = 'f'
    AND array_length(conkey, 1) = 1
    AND (SELECT attname FROM pg_attribute WHERE attrelid = conrelid AND attnum = conkey[1]) = 'sub_category_id';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.catalog_waste_materials DROP CONSTRAINT %I', cname);
  END IF;

  -- إعادة إنشاء القيد بـ ON DELETE SET NULL
  ALTER TABLE public.catalog_waste_materials
    ADD CONSTRAINT catalog_waste_materials_sub_category_id_fkey
    FOREIGN KEY (sub_category_id)
    REFERENCES public.waste_sub_categories(id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION;
END $$;

-- 2) product_addition_requests.sub_category_id -> waste_sub_categories.id
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.product_addition_requests'::regclass
    AND contype = 'f'
    AND array_length(conkey, 1) = 1
    AND (SELECT attname FROM pg_attribute WHERE attrelid = conrelid AND attnum = conkey[1]) = 'sub_category_id';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.product_addition_requests DROP CONSTRAINT %I', cname);
  END IF;

  ALTER TABLE public.product_addition_requests
    ADD CONSTRAINT product_addition_requests_sub_category_id_fkey
    FOREIGN KEY (sub_category_id)
    REFERENCES public.waste_sub_categories(id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION;
END $$;

-- =============================================================================
-- ملاحظة:
-- هذا لا يحذف بيانات الكتالوج/الطلبات، فقط يفك الربط عند حذف الفئة الفرعية.
-- =============================================================================

