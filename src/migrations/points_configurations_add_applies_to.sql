-- =================================================================
-- إضافة حقل لتحديد من يحصل على نقاط الكيلو جرام
-- تاريخ: يناير 2026
-- =================================================================
-- الهدف: السماح بتحديد من يحصل على points_per_kg:
--        - 'agents_only' (الوكلاء فقط)
--        - 'customers_only' (المستخدمين فقط)
--        - 'both' (الوكلاء والمستخدمين) - القيمة الافتراضية
-- ملاحظة: نقاط القطعة (points_per_piece) للمستخدمين فقط دائماً
-- =================================================================

-- 1. إضافة عمود points_per_kg_applies_to
ALTER TABLE public.points_configurations
ADD COLUMN IF NOT EXISTS points_per_kg_applies_to VARCHAR(20) DEFAULT 'both';

-- 2. إضافة قيد للتحقق من القيم المسموحة
ALTER TABLE public.points_configurations
ADD CONSTRAINT check_points_per_kg_applies_to
CHECK (points_per_kg_applies_to IN ('agents_only', 'customers_only', 'both'));

-- 3. تحديث القيم الموجودة إلى 'both' (الافتراضي)
UPDATE public.points_configurations
SET points_per_kg_applies_to = 'both'
WHERE points_per_kg_applies_to IS NULL;

-- 4. تعيين NOT NULL بعد التحديث
ALTER TABLE public.points_configurations
ALTER COLUMN points_per_kg_applies_to SET NOT NULL;

COMMENT ON COLUMN public.points_configurations.points_per_kg_applies_to IS 
'تحديد من يحصل على نقاط الكيلو جرام: agents_only (الوكلاء فقط)، customers_only (المستخدمين فقط)، both (الوكلاء والمستخدمين)';
