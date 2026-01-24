-- =================================================================
-- Migration: Fix get_active_radio_listeners to use location JSONB
-- Description: تعديل RPC function لاستخدام location JSONB بدلاً من الحقول المنفصلة
-- Date: 2025-01-21
-- =================================================================

-- =================================================================
-- 1. إضافة حقل location أولاً (إذا لم يكن موجوداً)
-- =================================================================

ALTER TABLE radio_listeners
ADD COLUMN IF NOT EXISTS location JSONB;

COMMENT ON COLUMN radio_listeners.location IS 'الموقع الجغرافي للمستمع (GPS/District) - اختياري';

-- =================================================================
-- 2. تعديل RPC Function: get_active_radio_listeners
-- =================================================================
-- المشكلة: الدالة تستخدم حقول منفصلة غير موجودة في الجدول
-- الحل: تعديل الدالة لاستخدام location JSONB
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
    location
  FROM radio_listeners
  WHERE activity_id = p_activity_id
    AND is_active = true
    AND last_active_at > NOW() - INTERVAL '5 minutes'
  ORDER BY started_listening_at DESC;
$$;

COMMENT ON FUNCTION get_active_radio_listeners IS 'جلب المستمعين النشطين للبث (RPC لتجاوز RLS) - محدث لاستخدام location JSONB';

-- =================================================================
-- Grant Permissions
-- =================================================================

GRANT EXECUTE ON FUNCTION get_active_radio_listeners(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_radio_listeners(UUID) TO anon;

-- =================================================================
-- End of Migration
-- =================================================================
