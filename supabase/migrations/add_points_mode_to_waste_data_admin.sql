-- إضافة حقل points_mode لتحديد طريقة حساب نقاط المستخدم لكل منتج
-- القيم المتوقعة: 'per_kg' أو 'per_piece'

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'waste_data_admin'
      AND column_name = 'points_mode'
  ) THEN
    ALTER TABLE public.waste_data_admin
      ADD COLUMN points_mode VARCHAR(20) DEFAULT 'per_kg';

    -- اختيار القيمة الافتراضية per_kg للمنتجات الحالية
    UPDATE public.waste_data_admin
    SET points_mode = 'per_kg'
    WHERE points_mode IS NULL;
  END IF;
END $$;

