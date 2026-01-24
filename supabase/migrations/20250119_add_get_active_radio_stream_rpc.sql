-- =================================================================
-- Migration: Add RPC Function for Getting Active Radio Stream
-- Description: إضافة RPC function كـ backup لجلب البث النشط (لحل مشكلة 406 PGRST116)
-- Date: 2025-01-19
-- =================================================================

-- =================================================================
-- RPC Function: get_active_radio_stream
-- =================================================================
-- هذه الـ function تستخدم SECURITY DEFINER لتجاوز RLS
-- وتستخدم STABLE لأنها لا تعدل البيانات
-- =================================================================

CREATE OR REPLACE FUNCTION get_active_radio_stream()
RETURNS TABLE (
  id UUID,
  activity_type VARCHAR,
  title VARCHAR,
  scheduled_at TIMESTAMPTZ,
  partner_id UUID,
  points_reward INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  stream_url TEXT,
  station_id INTEGER,
  listen_url TEXT,
  current_listeners INTEGER,
  max_listeners INTEGER,
  is_live BOOLEAN,
  stream_type VARCHAR,
  description TEXT,
  updated_at TIMESTAMPTZ,
  planned_duration_minutes INTEGER
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    id, 
    activity_type, 
    title, 
    scheduled_at, 
    partner_id,
    points_reward, 
    is_active, 
    created_at, 
    stream_url,
    station_id, 
    listen_url, 
    current_listeners, 
    max_listeners,
    is_live, 
    stream_type, 
    description, 
    updated_at,
    planned_duration_minutes
  FROM club_activities
  WHERE activity_type = 'radio_stream'
    AND is_active = true
    AND is_live = true
  LIMIT 1;
$$;

COMMENT ON FUNCTION get_active_radio_stream IS 'جلب البث النشط الحالي (RPC backup لحل مشكلة 406 PGRST116)';

-- =================================================================
-- Grant Permissions
-- =================================================================

GRANT EXECUTE ON FUNCTION get_active_radio_stream() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_radio_stream() TO anon;

-- =================================================================
-- End of Migration
-- =================================================================
