-- =================================================================
-- Migration: Verify and Fix location column issue
-- Description: التحقق من وجود حقل location وإضافته إذا لم يكن موجوداً
-- Date: 2025-01-21
-- =================================================================
-- هذا الملف يحل مشكلة: column "location" does not exist
-- =================================================================

-- =================================================================
-- 1. التحقق من وجود الحقل وإضافته إذا لم يكن موجوداً
-- =================================================================

DO $$
BEGIN
  -- التحقق من وجود الحقل
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'radio_listeners' 
    AND column_name = 'location'
  ) THEN
    -- إضافة الحقل إذا لم يكن موجوداً
    ALTER TABLE radio_listeners
    ADD COLUMN location JSONB;
    
    RAISE NOTICE 'تم إضافة حقل location إلى radio_listeners';
  ELSE
    RAISE NOTICE 'حقل location موجود بالفعل';
  END IF;
END $$;

-- إضافة التعليق
COMMENT ON COLUMN radio_listeners.location IS 'الموقع الجغرافي للمستمع (GPS/District) - اختياري';

-- =================================================================
-- 2. تعديل RPC Function: get_active_radio_listeners
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

GRANT EXECUTE ON FUNCTION get_active_radio_listeners(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_radio_listeners(UUID) TO anon;

-- =================================================================
-- End of Migration
-- =================================================================
