-- إضافة مفهوم Point Strategy + فترات صلاحية لإعدادات النقاط
-- الهدف:
-- 1) تعريف نوع الإستراتيجية المستخدمة للنقاط (وزن، قطعة، هجين، مكافآت فقط، بدون نقاط)
-- 2) إضافة effective_from / effective_to لدعم تغيّر القيم بمرور الوقت بدون كسر التاريخ السابق

-- 1. إضافة حقل points_strategy كنص مع قيد تحقق للقيم المسموحة
ALTER TABLE public.points_configurations
ADD COLUMN IF NOT EXISTS points_strategy TEXT NOT NULL DEFAULT 'WEIGHT_BASED';

-- ملاحظة: PostgreSQL لا يدعم ADD CONSTRAINT IF NOT EXISTS مباشرة
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'points_configurations_strategy_chk'
  ) THEN
    ALTER TABLE public.points_configurations
    ADD CONSTRAINT points_configurations_strategy_chk
    CHECK (points_strategy IN (
      'WEIGHT_BASED',
      'PIECE_BASED',
      'HYBRID',
      'BONUS_ONLY',
      'NO_POINTS'
    ));
  END IF;
END $$;

COMMENT ON COLUMN public.points_configurations.points_strategy IS
  'نوع إستراتيجية النقاط لهذا الإعداد: WEIGHT_BASED, PIECE_BASED, HYBRID, BONUS_ONLY, NO_POINTS';

-- 2. إضافة effective_from / effective_to
ALTER TABLE public.points_configurations
ADD COLUMN IF NOT EXISTS effective_from TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS effective_to   TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.points_configurations.effective_from IS
  'تاريخ ووقت بدء صلاحية هذا الإعداد. إن كانت NULL يُعد الإعداد صالحاً منذ البداية.';

COMMENT ON COLUMN public.points_configurations.effective_to IS
  'تاريخ ووقت انتهاء صلاحية هذا الإعداد. إن كانت NULL يُعد الإعداد مفتوح الصلاحية.';

-- 3. فهرس يساعد في اختيار الإعداد الفعّال حسب التاريخ والحالة
CREATE INDEX IF NOT EXISTS idx_points_configurations_effective_window
ON public.points_configurations (is_active, effective_from, effective_to);

