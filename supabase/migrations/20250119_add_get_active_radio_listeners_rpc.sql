-- =================================================================
-- Migration: Add RPC Function for Getting Active Radio Listeners
-- Description: إضافة RPC function لجلب المستمعين النشطين (لحل مشكلة RLS)
-- Date: 2025-01-19
-- =================================================================

-- =================================================================
-- RPC Function: get_active_radio_listeners
-- =================================================================
-- هذه الـ function تستخدم SECURITY DEFINER لتجاوز RLS
-- وتستخدم STABLE لأنها لا تعدل البيانات
-- =================================================================

-- حذف الـ function القديمة أولاً (لأن نوع الإرجاع تغير)
DROP FUNCTION IF EXISTS get_active_radio_listeners(UUID);

-- إنشاء الـ function الجديدة مع حقول الموقع
CREATE FUNCTION get_active_radio_listeners(p_activity_id UUID)
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
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  location_updated_at TIMESTAMPTZ,
  location_source VARCHAR,
  location_accuracy DOUBLE PRECISION
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    id,
    user_id,
    activity_id,
    started_listening_at,
    last_active_at,
    duration_minutes,
    points_earned,
    is_active,
    created_at,
    updated_at,
    current_latitude,
    current_longitude,
    location_updated_at,
    location_source,
    location_accuracy
  FROM radio_listeners
  WHERE activity_id = p_activity_id
    AND is_active = true
    AND last_active_at > NOW() - INTERVAL '5 minutes'
  ORDER BY started_listening_at DESC;
$$;

COMMENT ON FUNCTION get_active_radio_listeners IS 'جلب المستمعين النشطين للبث (RPC لتجاوز RLS)';

-- =================================================================
-- Grant Permissions
-- =================================================================

GRANT EXECUTE ON FUNCTION get_active_radio_listeners(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_radio_listeners(UUID) TO anon;

-- =================================================================
-- End of Migration
-- =================================================================
