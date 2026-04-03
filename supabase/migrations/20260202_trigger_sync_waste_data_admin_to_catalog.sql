-- =============================================================================
-- Trigger: مزامنة waste_data_admin → catalog_waste_materials عند UPDATE
-- عند تحديث منتج في إدارة التنظيم، يُحدّث سجل الكتالوج المرتبط تلقائياً
-- تاريخ: 2026-02-02
-- =============================================================================

-- الدالة: تحديث catalog_waste_materials حيث id = NEW.catalog_waste_id
CREATE OR REPLACE FUNCTION public.sync_waste_data_admin_to_catalog()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_main_id BIGINT;
BEGIN
  IF NEW.catalog_waste_id IS NOT NULL THEN
    -- استنتاج الفئة الأساسية من الفئة الفرعية
    IF NEW.subcategory_id IS NOT NULL THEN
      SELECT main_id INTO v_main_id
      FROM public.waste_sub_categories
      WHERE id = NEW.subcategory_id
      LIMIT 1;
    ELSE
      v_main_id := NULL;
    END IF;

    UPDATE public.catalog_waste_materials
    SET
      sub_category_id = NEW.subcategory_id,
      main_category_id = v_main_id,
      expected_price = COALESCE(NEW.price_per_kg, NEW.price),
      weight = NEW.weight,
      notes = COALESCE(LEFT(NEW.name, 500), notes)
    WHERE id = NEW.catalog_waste_id;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_waste_data_admin_to_catalog() IS
  'يحدّث سجل الكتالوج عند تحديث waste_data_admin (subcategory_id, name, price_per_kg, weight)';

-- إنشاء الـ Trigger: بعد UPDATE على waste_data_admin
DROP TRIGGER IF EXISTS trg_sync_waste_data_admin_to_catalog ON public.waste_data_admin;

CREATE TRIGGER trg_sync_waste_data_admin_to_catalog
  AFTER UPDATE ON public.waste_data_admin
  FOR EACH ROW
  WHEN (
    OLD.catalog_waste_id IS DISTINCT FROM NEW.catalog_waste_id
    OR OLD.subcategory_id IS DISTINCT FROM NEW.subcategory_id
    OR OLD.name IS DISTINCT FROM NEW.name
    OR OLD.price_per_kg IS DISTINCT FROM NEW.price_per_kg
    OR (OLD.price IS DISTINCT FROM NEW.price AND NEW.price_per_kg IS NULL)
    OR OLD.weight IS DISTINCT FROM NEW.weight
  )
  EXECUTE FUNCTION sync_waste_data_admin_to_catalog();
