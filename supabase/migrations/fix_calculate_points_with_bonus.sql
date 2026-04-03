-- إصلاح مشكلة calculate_points_with_bonus
-- المشكلة: trigger يحاول استدعاء دالة غير موجودة أو يوجد أكثر من دالة بنفس الاسم

-- 1. حذف أي دوال موجودة بنفس الاسم بمعاملات مختلفة (إذا كانت موجودة)
DROP FUNCTION IF EXISTS calculate_points_with_bonus(NUMERIC, BIGINT);
DROP FUNCTION IF EXISTS calculate_points_with_bonus(INTEGER, BIGINT);
DROP FUNCTION IF EXISTS calculate_points_with_bonus(DECIMAL, BIGINT);

-- 2. إنشاء الدالة بالمعاملات المطلوبة (NUMERIC, BIGINT)
CREATE OR REPLACE FUNCTION calculate_points_with_bonus(
    base_points NUMERIC,
    subcategory_id BIGINT
)
RETURNS INTEGER AS $$
DECLARE
    v_points INTEGER;
    v_multiplier NUMERIC := 1.0;
BEGIN
    -- حساب النقاط الأساسية
    v_points := base_points::INTEGER;
    
    -- يمكن إضافة منطق حساب النقاط مع المضاعف هنا إذا لزم الأمر
    -- حالياً نعيد النقاط الأساسية فقط
    
    RETURN v_points;
END;
$$ LANGUAGE plpgsql;

-- تعليق على الدالة مع تحديد المعاملات بشكل صريح
COMMENT ON FUNCTION calculate_points_with_bonus(NUMERIC, BIGINT) IS 'حساب النقاط مع المكافأة (إصدار مبسط - يعيد النقاط الأساسية فقط)';

-- ملاحظة: إذا كنت تريد تعطيل الـ trigger بدلاً من إنشاء الدالة
-- يمكنك البحث عن trigger يستخدم هذه الدالة وتعطيله:
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'waste_data_admin'::regclass;
-- DROP TRIGGER IF EXISTS trigger_name ON waste_data_admin;
