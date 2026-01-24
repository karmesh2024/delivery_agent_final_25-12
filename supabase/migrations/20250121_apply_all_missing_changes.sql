-- =================================================================
-- Migration: Apply All Missing Changes (Unified)
-- Description: تطبيق جميع التعديلات المفقودة في ملف واحد
-- Date: 2025-01-21
-- =================================================================
-- هذا الملف يجمع جميع التعديلات المطلوبة في مكان واحد
-- يمكن تطبيقه مباشرة على قاعدة البيانات
-- =================================================================

-- =================================================================
-- 1. إضافة حقل location في radio_listeners
-- =================================================================

ALTER TABLE radio_listeners
ADD COLUMN IF NOT EXISTS location JSONB;

COMMENT ON COLUMN radio_listeners.location IS 'الموقع الجغرافي للمستمع (GPS/District) - اختياري';

-- =================================================================
-- 2. إضافة السقف الشهري في club_settings
-- =================================================================

INSERT INTO club_settings (key, value, description) VALUES
('monthly_waste_conversion_cap', '{"points": 2000, "enabled": true}', 'السقف الشهري لتحويل نقاط المخلفات إلى نقاط النادي (2000 نقطة لكل مستخدم)')
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- التحقق من وجود نسبة التحويل
INSERT INTO club_settings (key, value, description) VALUES
('waste_to_club_conversion', '{"rate": 0.3, "enabled": true}', 'نسبة تحويل نقاط المخلفات إلى نقاط النادي (30%)')
ON CONFLICT (key) DO NOTHING;

-- =================================================================
-- 3. إصلاح RPC Function: get_active_radio_listeners
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
-- 4. إضافة دالة stop_user_listening_session_and_award
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

GRANT EXECUTE ON FUNCTION stop_user_listening_session_and_award(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION stop_user_listening_session_and_award(UUID, UUID, UUID) TO anon;

-- =================================================================
-- 5. إضافة دالة redeem_club_reward
-- =================================================================

CREATE OR REPLACE FUNCTION redeem_club_reward(
  p_user_id UUID,
  p_reward_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward RECORD;
  v_points_required INTEGER;
  v_available_points INTEGER;
  v_redemption_code VARCHAR(100);
  v_redemption_id UUID;
BEGIN
  -- 1) جلب معلومات الجائزة
  SELECT * INTO v_reward
  FROM club_rewards
  WHERE id = p_reward_id
    AND is_active = true
    AND (quantity_available IS NULL OR quantity_redeemed < quantity_available);
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'الجائزة غير متاحة';
  END IF;
  
  v_points_required := v_reward.points_required;
  
  -- 2) التحقق من الرصيد المتاح
  SELECT available_points INTO v_available_points
  FROM club_points_wallet
  WHERE user_id = p_user_id;
  
  IF v_available_points < v_points_required THEN
    RAISE EXCEPTION 'رصيد النقاط غير كافي';
  END IF;
  
  -- 3) إنشاء كود الاستبدال
  v_redemption_code := 'REDEEM-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 12));
  
  -- 4) إنشاء سجل الاستبدال
  INSERT INTO club_reward_redemptions (
    user_id, reward_id, points_spent, redemption_code,
    redemption_type, redemption_data, status, expires_at
  ) VALUES (
    p_user_id,
    p_reward_id,
    v_points_required,
    v_redemption_code,
    v_reward.reward_type,
    CASE 
      WHEN v_reward.reward_type = 'wallet_credit' THEN
        jsonb_build_object('amount', v_reward.points_required, 'currency', 'EGP')
      ELSE NULL
    END,
    'pending',
    CASE 
      WHEN v_reward.reward_type = 'wallet_credit' THEN NULL
      ELSE NOW() + INTERVAL '30 days'
    END
  ) RETURNING id INTO v_redemption_id;
  
  -- 5) خصم النقاط من available_points
  PERFORM update_club_points_wallet(
    p_user_id,
    -v_points_required,
    'USED',
    'استبدال جائزة',
    'reward_redeem',
    'استبدال: ' || v_reward.title,
    NULL
  );
  
  -- 6) تحديث quantity_redeemed في club_rewards
  UPDATE club_rewards
  SET quantity_redeemed = COALESCE(quantity_redeemed, 0) + 1,
      updated_at = NOW()
  WHERE id = p_reward_id;
  
  -- 7) تحديث حالة الاستبدال إلى completed
  UPDATE club_reward_redemptions
  SET status = 'completed',
      redeemed_at = NOW()
  WHERE id = v_redemption_id;
  
  RETURN jsonb_build_object(
    'redemption_id', v_redemption_id,
    'redemption_code', v_redemption_code,
    'points_spent', v_points_required
  );
END;
$$;

COMMENT ON FUNCTION redeem_club_reward IS 'استبدال جائزة بخصم النقاط من الرصيد المتاح';

GRANT EXECUTE ON FUNCTION redeem_club_reward(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION redeem_club_reward(UUID, UUID) TO anon;

-- =================================================================
-- 6. إضافة دالة process_recycling_conversion_request
-- =================================================================

CREATE OR REPLACE FUNCTION process_recycling_conversion_request(
  p_request_id UUID,
  p_action VARCHAR, -- 'APPROVE' or 'REJECT'
  p_processed_by UUID,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_rate DECIMAL(10,2);
  v_monthly_cap INTEGER;
  v_monthly_converted INTEGER;
  v_current_month VARCHAR(7);
BEGIN
  -- 1) جلب الطلب
  SELECT * INTO v_request
  FROM recycling_conversion_requests
  WHERE id = p_request_id
    AND status = 'PENDING';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'الطلب غير موجود أو تم معالجته مسبقاً';
  END IF;
  
  -- 2) إذا كان الرفض
  IF p_action = 'REJECT' THEN
    UPDATE recycling_conversion_requests
    SET 
      status = 'REJECTED',
      processed_by = p_processed_by,
      processed_at = NOW(),
      rejection_reason = p_rejection_reason
    WHERE id = p_request_id;
    
    RETURN jsonb_build_object('status', 'rejected', 'message', 'تم رفض الطلب');
  END IF;
  
  -- 3) إذا كان القبول - التحقق من السقف الشهري
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- جلب نسبة التحويل (إذا لم تكن موجودة، استخدم 0.3 كافتراضي)
  SELECT (value->>'rate')::DECIMAL INTO v_rate
  FROM club_settings
  WHERE key = 'waste_to_club_conversion';
  
  IF v_rate IS NULL THEN
    v_rate := 0.3; -- افتراضي 30%
  END IF;
  
  -- جلب السقف الشهري (إذا لم يكن موجوداً، استخدم 2000 كافتراضي)
  SELECT (value->>'points')::INTEGER INTO v_monthly_cap
  FROM club_settings
  WHERE key = 'monthly_waste_conversion_cap';
  
  IF v_monthly_cap IS NULL THEN
    v_monthly_cap := 2000; -- افتراضي 2000 نقطة
  END IF;
  
  -- حساب ما تم تحويله هذا الشهر
  SELECT COALESCE(SUM(points), 0) INTO v_monthly_converted
  FROM club_points_transactions
  WHERE user_id = v_request.user_id
    AND source = 'waste_collection'
    AND TO_CHAR(created_at, 'YYYY-MM') = v_current_month;
  
  IF v_monthly_converted + v_request.club_points_expected > v_monthly_cap THEN
    RAISE EXCEPTION 'تم الوصول للسقف الشهري (%)', v_monthly_cap;
  END IF;
  
  -- 4) منح النقاط (تذهب إلى pending_points)
  PERFORM update_club_points_wallet(
    v_request.user_id,
    v_request.club_points_expected,
    'EARNED',
    'تحويل نقاط المخلفات',
    'waste_collection',
    'تحويل ' || v_request.recycling_points || ' نقطة مخلفات إلى ' || 
    v_request.club_points_expected || ' نقطة نادي',
    p_processed_by
  );
  
  -- 5) تحديث حالة الطلب
  UPDATE recycling_conversion_requests
  SET 
    status = 'APPROVED',
    processed_by = p_processed_by,
    processed_at = NOW()
  WHERE id = p_request_id;
  
  -- ملاحظة: خصم النقاط من نظام المخلفات يتم في منظومة منفصلة
  
  RETURN jsonb_build_object(
    'status', 'approved',
    'club_points_awarded', v_request.club_points_expected,
    'message', 'تم منح النقاط بنجاح'
  );
END;
$$;

COMMENT ON FUNCTION process_recycling_conversion_request IS 'معالجة طلب تحويل نقاط المخلفات إلى نقاط النادي (Admin Only)';

GRANT EXECUTE ON FUNCTION process_recycling_conversion_request(UUID, VARCHAR, UUID, TEXT) TO authenticated;

-- =================================================================
-- End of Migration
-- =================================================================
