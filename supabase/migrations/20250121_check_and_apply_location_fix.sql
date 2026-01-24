-- =================================================================
-- Migration: Check and Apply location fix (Safe Version)
-- Description: التحقق من وجود حقل location وإصلاح الدالة بأمان
-- Date: 2025-01-21
-- =================================================================
-- هذا الملف يحل مشكلة: column "location" does not exist
-- يمكن تطبيقه بأمان حتى لو كان الحقل موجوداً
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
    WHERE table_schema = 'public'
    AND table_name = 'radio_listeners' 
    AND column_name = 'location'
  ) THEN
    -- إضافة الحقل إذا لم يكن موجوداً
    ALTER TABLE radio_listeners
    ADD COLUMN location JSONB;
    
    RAISE NOTICE '✅ تم إضافة حقل location إلى radio_listeners';
  ELSE
    RAISE NOTICE 'ℹ️ حقل location موجود بالفعل';
  END IF;
END $$;

-- إضافة التعليق (حتى لو كان موجوداً، لا مشكلة)
COMMENT ON COLUMN radio_listeners.location IS 'الموقع الجغرافي للمستمع (GPS/District) - اختياري';

-- =================================================================
-- 2. تعديل RPC Function: get_active_radio_listeners
-- =================================================================
-- الآن الحقل موجود بالتأكيد، يمكننا تعديل الدالة بأمان
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
-- 3. التحقق من النجاح
-- =================================================================

DO $$
DECLARE
  v_column_exists BOOLEAN;
  v_function_exists BOOLEAN;
BEGIN
  -- التحقق من وجود الحقل
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'radio_listeners' 
    AND column_name = 'location'
  ) INTO v_column_exists;
  
  -- التحقق من وجود الدالة
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
    AND routine_name = 'get_active_radio_listeners'
  ) INTO v_function_exists;
  
  IF v_column_exists AND v_function_exists THEN
    RAISE NOTICE '✅ تم إصلاح المشكلة بنجاح!';
    RAISE NOTICE '✅ حقل location موجود';
    RAISE NOTICE '✅ دالة get_active_radio_listeners محدثة';
  ELSE
    RAISE WARNING '⚠️ يرجى التحقق من النتائج يدوياً';
  END IF;
END $$;

-- =================================================================
-- End of Migration
-- =================================================================
