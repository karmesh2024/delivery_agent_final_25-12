-- إضافة حقل pricing_mode لتحديد طريقة تسعير المنتج (مالياً)
-- القيم المتوقعة حالياً: 'per_kg' أو 'per_piece'
-- ملاحظة: حالياً يمكن إبقاؤه مطابقاً لـ points_mode، لكن وجوده يسهّل توسعات مستقبلية بدون refactor.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'waste_data_admin'
      AND column_name = 'pricing_mode'
  ) THEN
    ALTER TABLE public.waste_data_admin
      ADD COLUMN pricing_mode VARCHAR(20) DEFAULT 'per_kg';

    -- افتراضي للبيانات الحالية: per_kg
    UPDATE public.waste_data_admin
    SET pricing_mode = COALESCE(points_mode, 'per_kg')
    WHERE pricing_mode IS NULL;
  END IF;
END $$;

