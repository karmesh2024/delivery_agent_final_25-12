-- =================================================================
-- Migration: Add redeem_club_reward Function
-- Description: إضافة دالة لاستبدال الجوائز بخصم النقاط
-- Date: 2025-01-21
-- =================================================================

-- =================================================================
-- RPC Function: redeem_club_reward
-- =================================================================
-- هذه الدالة تقوم بـ:
-- 1) التحقق من توفر الجائزة
-- 2) التحقق من الرصيد المتاح
-- 3) إنشاء كود الاستبدال
-- 4) خصم النقاط من available_points
-- 5) تحديث quantity_redeemed
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

-- =================================================================
-- Grant Permissions
-- =================================================================

GRANT EXECUTE ON FUNCTION redeem_club_reward(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION redeem_club_reward(UUID, UUID) TO anon;

-- =================================================================
-- End of Migration
-- =================================================================
