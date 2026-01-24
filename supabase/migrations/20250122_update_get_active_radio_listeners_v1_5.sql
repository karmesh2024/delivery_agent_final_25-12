-- =================================================================
-- Migration: Update get_active_radio_listeners for V1.5
-- Description: تحديث RPC function لإضافة is_playing (حالة التشغيل اللحظية)
-- Date: 2025-01-22
-- Version: V1.5
-- =================================================================

-- =================================================================
-- تحديث RPC Function: get_active_radio_listeners
-- =================================================================
-- V1.5: إضافة is_playing لتتبع حالة التشغيل اللحظية
-- duration_minutes الآن دقائق صافية (بعد خصم أوقات التوقف)
-- points_earned نقاط مستحقة حتى هذه اللحظة
-- =================================================================

DROP FUNCTION IF EXISTS get_active_radio_listeners(UUID);

CREATE OR REPLACE FUNCTION get_active_radio_listeners(p_activity_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  activity_id UUID,
  started_listening_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  points_earned INTEGER,
  is_playing BOOLEAN,  -- ✅ V1.5: حالة التشغيل اللحظية
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  location JSONB
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    l.id,
    l.user_id,
    l.activity_id,
    l.started_listening_at,
    l.last_active_at,
    l.duration_minutes,  -- V1.5: دقائق صافية (بعد خصم أوقات التوقف)
    l.points_earned,     -- V1.5: نقاط مستحقة حتى هذه اللحظة
    COALESCE(l.is_playing, true) as is_playing,  -- ✅ V1.5: حالة التشغيل (افتراضي: true)
    l.is_active,
    l.created_at,
    l.updated_at,
    l.location
  FROM radio_listeners l
  WHERE l.activity_id = p_activity_id
    AND l.is_active = true
    AND l.last_active_at > NOW() - INTERVAL '5 minutes'
  ORDER BY l.last_active_at DESC;
$$;

COMMENT ON FUNCTION get_active_radio_listeners IS 'V1.5: جلب المستمعين النشطين - duration_minutes (صافية), points_earned (مستحقة), is_playing (حالة التشغيل اللحظية)';

GRANT EXECUTE ON FUNCTION get_active_radio_listeners(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_radio_listeners(UUID) TO anon;

-- =================================================================
-- ملاحظات V1.5:
-- =================================================================
-- 1. is_playing: true = يستمع الآن، false = توقف مؤقت
-- 2. duration_minutes: دقائق صافية (بعد خصم أوقات التوقف)
-- 3. points_earned: نقاط مستحقة حتى هذه اللحظة (محدثة كل 60 ثانية)
-- 4. الموبايل يرسل تحديثات is_playing مع كل heartbeat
-- =================================================================

-- =================================================================
-- End of Migration
-- =================================================================
