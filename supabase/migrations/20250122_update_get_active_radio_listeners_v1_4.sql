-- =================================================================
-- Migration: Update get_active_radio_listeners for V1.4
-- Description: تحديث RPC function لتعكس التغييرات في V1.4 (الموبايل يرسل duration_minutes و points_earned)
-- Date: 2025-01-22
-- Version: V1.4
-- =================================================================

-- =================================================================
-- تحديث RPC Function: get_active_radio_listeners
-- =================================================================
-- V1.4: الموبايل الآن يرسل duration_minutes و points_earned كل 60 ثانية
-- يجب أن تعيد الدالة هذه القيم مباشرة من radio_listeners
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
    l.duration_minutes,  -- V1.4: يتم تحديثه من الموبايل كل 60 ثانية
    l.points_earned,     -- V1.4: يتم تحديثه من الموبايل كل 60 ثانية
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

COMMENT ON FUNCTION get_active_radio_listeners IS 'V1.4: جلب المستمعين النشطين - duration_minutes و points_earned يتم تحديثهما من الموبايل كل 60 ثانية';

GRANT EXECUTE ON FUNCTION get_active_radio_listeners(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_radio_listeners(UUID) TO anon;

-- =================================================================
-- End of Migration
-- =================================================================
