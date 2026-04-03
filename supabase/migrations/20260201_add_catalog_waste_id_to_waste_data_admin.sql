-- =============================================================================
-- إضافة catalog_waste_id إلى waste_data_admin لربط المنتج بكتالوج المخلفات
-- تاريخ: 2026-02-01
-- التشغيل: نفّذ في Supabase SQL Editor أو عبر supabase db push
-- =============================================================================

-- 1. إضافة العمود إن لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'waste_data_admin'
      AND column_name = 'catalog_waste_id'
  ) THEN
    ALTER TABLE public.waste_data_admin
      ADD COLUMN catalog_waste_id BIGINT NULL
      REFERENCES public.catalog_waste_materials(id) ON DELETE SET NULL ON UPDATE CASCADE;
    COMMENT ON COLUMN public.waste_data_admin.catalog_waste_id IS 'ربط المنتج بكتالوج المخلفات للمخازن والبورصة';
  END IF;
END $$;

-- 2. فهرس للأداء
CREATE INDEX IF NOT EXISTS idx_waste_data_admin_catalog_waste_id
  ON public.waste_data_admin(catalog_waste_id)
  WHERE catalog_waste_id IS NOT NULL;

-- 3. (اختياري) تعبئة القيم للمنتجات التي لها سجل في الكتالوج يطابق waste_no
-- يمكن تشغيل المزامنة الأولية من التطبيق بدلاً من ذلك
-- لا ننفذ UPDATE تلقائي هنا لأن الربط يتم عبر التطبيق (waste_no pattern أو مزامنة يدوية)
