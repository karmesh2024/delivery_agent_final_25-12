-- =================================================================
-- Migration: Fix get_active_radio_listeners to return user_name directly
-- Description: إصلاح RPC function لجلب user_name مباشرة باستخدام JOIN
-- Date: 2025-01-22
-- Version: V1.5.1
-- =================================================================

-- =================================================================
-- إصلاح RPC Function: get_active_radio_listeners
-- =================================================================
-- المشكلة: user_id يأتي undefined أحياناً، مما يمنع جلب user_name في Frontend
-- الحل: جلب user_name مباشرة من RPC function باستخدام LEFT JOIN
-- =================================================================

-- 1. حذف الدالة القديمة للبدء من جديد
DROP FUNCTION IF EXISTS get_active_radio_listeners(UUID);

-- 2. إنشاء الدالة مع معالجة احتمالية اختلاف اسم جدول المستخدمين (نستخدم LEFT JOIN لضمان عدم الاختفاء)
CREATE OR REPLACE FUNCTION get_active_radio_listeners(p_activity_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  activity_id UUID,
  user_name TEXT,  -- ✅ V1.5.1: إضافة user_name مباشرة
  started_listening_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  points_earned INTEGER,
  is_playing BOOLEAN,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  location JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER  -- لضمان تجاوز أي قيود RLS تمنع الأدمن من رؤية المستمعين
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.user_id,
    l.activity_id,
    COALESCE(p.full_name, 'مستخدم') as user_name,  -- ✅ V1.5.1: جلب user_name مباشرة
    l.started_listening_at,
    l.last_active_at,
    l.duration_minutes,
    l.points_earned,
    COALESCE(l.is_playing, true) as is_playing,  -- ✅ V1.5: حالة التشغيل (افتراضي: true)
    l.is_active,
    l.created_at,
    l.updated_at,
    l.location
  FROM radio_listeners l
  -- ✅ V1.5.1: استخدام LEFT JOIN لضمان بقاء السجل حتى لو لم يجد الاسم
  LEFT JOIN new_profiles p ON l.user_id = p.id 
  WHERE l.activity_id = p_activity_id
    AND l.is_active = true
    -- تعديل الشرط ليكون أكثر تسامحاً (آخر 10 دقائق) لضمان عدم الاختفاء
    AND l.last_active_at > NOW() - INTERVAL '10 minutes'
  ORDER BY l.last_active_at DESC;
END;
$$;

COMMENT ON FUNCTION get_active_radio_listeners IS 'V1.5.1: جلب المستمعين النشطين مع user_name مباشرة - duration_minutes (صافية), points_earned (مستحقة), is_playing (حالة التشغيل)';

GRANT EXECUTE ON FUNCTION get_active_radio_listeners(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_radio_listeners(UUID) TO anon;

-- 3. إصلاح مشكلة الـ 400 في الداش بورد بتبسيط الأذونات (اختياري - فقط إذا كانت هناك مشاكل RLS)
-- ملاحظة: إذا كان RLS يعمل بشكل صحيح، لا حاجة لهذا الجزء
-- ALTER TABLE radio_listeners ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow all for dashboard" ON radio_listeners;
-- CREATE POLICY "Allow all for dashboard" ON radio_listeners 
-- FOR ALL USING (true);

-- 4. التأكد من حالة الحقول في الجدول
ALTER TABLE radio_listeners ALTER COLUMN is_playing SET DEFAULT true;

-- =================================================================
-- ملاحظات V1.5.1:
-- =================================================================
-- 1. user_name: يتم جلبه مباشرة من new_profiles باستخدام LEFT JOIN
-- 2. إذا لم يوجد user_id أو full_name، يتم استخدام 'مستخدم' كقيمة افتراضية
-- 3. LEFT JOIN يضمن بقاء السجل حتى لو لم يجد المستخدم في new_profiles
-- 4. تم زيادة نافذة الوقت من 5 دقائق إلى 10 دقائق لضمان عدم الاختفاء
-- =================================================================

-- =================================================================
-- End of Migration
-- =================================================================
