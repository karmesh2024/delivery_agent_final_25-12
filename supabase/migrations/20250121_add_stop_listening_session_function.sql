-- =================================================================
-- Migration: Add stop_user_listening_session_and_award Function
-- Description: إضافة دالة لإيقاف جلسة الاستماع ومنح النقاط
-- Date: 2025-01-21
-- =================================================================

-- =================================================================
-- RPC Function: stop_user_listening_session_and_award
-- =================================================================
-- هذه الدالة تقوم بـ:
-- 1) حساب مدة الاستماع
-- 2) حساب النقاط المستحقة
-- 3) تحديث الجلسة
-- 4) منح النقاط إلى pending_points
-- =================================================================

CREATE OR REPLACE FUNCTION stop_user_listening_session_and_award(
  p_session_id UUID,
  p_user_id UUID,
  p_activity_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_stop_time TIMESTAMPTZ;
  v_duration_minutes INTEGER;
  v_points_earned INTEGER;
BEGIN
  -- 1) جلب وقت البدء
  SELECT start_time INTO v_start_time
  FROM radio_user_sessions
  WHERE id = p_session_id AND user_id = p_user_id;
  
  IF v_start_time IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;
  
  -- 2) حساب المدة
  v_stop_time := NOW();
  v_duration_minutes := FLOOR(EXTRACT(EPOCH FROM (v_stop_time - v_start_time)) / 60);
  
  -- 3) حساب النقاط
  v_points_earned := calculate_service_points('radio_stream', v_duration_minutes);
  
  -- 4) تحديث الجلسة
  UPDATE radio_user_sessions
  SET 
    stop_time = v_stop_time,
    duration_minutes = v_duration_minutes,
    points_earned = v_points_earned,
    status = 'closed',
    updated_at = NOW()
  WHERE id = p_session_id;
  
  -- 5) منح النقاط (تذهب إلى pending_points)
  PERFORM update_club_points_wallet(
    p_user_id,
    v_points_earned,
    'EARNED',
    'استماع راديو كارمش',
    'radio_stream',
    'نقاط من الاستماع للراديو: ' || v_duration_minutes || ' دقيقة',
    NULL
  );
  
  RETURN jsonb_build_object(
    'minutes_listened', v_duration_minutes,
    'points_earned', v_points_earned
  );
END;
$$;

COMMENT ON FUNCTION stop_user_listening_session_and_award IS 'إيقاف جلسة الاستماع ومنح النقاط (V1.3 Session-Based)';

-- =================================================================
-- Grant Permissions
-- =================================================================

GRANT EXECUTE ON FUNCTION stop_user_listening_session_and_award(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION stop_user_listening_session_and_award(UUID, UUID, UUID) TO anon;

-- =================================================================
-- End of Migration
-- =================================================================
