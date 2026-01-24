-- =================================================================
-- V1.3 Fix Migration
-- Date: 2025-01-20
-- Purpose:
-- 1) Fix update_club_points_wallet: EARNED must go to pending only (no double-counting)
-- 2) Ensure we have a dedicated table for user listening sessions without breaking existing broadcast radio_sessions
-- =================================================================

-- ================================================================
-- 1) Fix update_club_points_wallet: EARNED -> pending only
-- ================================================================

DROP FUNCTION IF EXISTS update_club_points_wallet(
  UUID, INTEGER, VARCHAR, VARCHAR, VARCHAR, TEXT, UUID
);

CREATE OR REPLACE FUNCTION update_club_points_wallet(
  p_user_id UUID,
  p_points INTEGER,
  p_transaction_type VARCHAR,
  p_reason VARCHAR DEFAULT NULL,
  p_source VARCHAR DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_transaction_id UUID;
  v_profile_exists BOOLEAN;
  v_user_email TEXT;
  v_user_phone TEXT;
  v_user_full_name TEXT;
BEGIN
  -- Ensure new_profiles / customers exist (same behavior as before)
  SELECT EXISTS(SELECT 1 FROM new_profiles WHERE id = p_user_id) INTO v_profile_exists;

  IF NOT v_profile_exists THEN
    SELECT 
      COALESCE(email, ''),
      COALESCE(phone, ''),
      COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email, 'مستخدم')
    INTO v_user_email, v_user_phone, v_user_full_name
    FROM auth.users
    WHERE id = p_user_id;

    IF v_user_phone IS NULL OR v_user_phone = '' THEN
      v_user_phone := RIGHT(REPLACE(p_user_id::TEXT, '-', ''), 11);
    END IF;

    INSERT INTO customers (id, user_id, full_name, phone_number, email)
    VALUES (
      p_user_id,
      p_user_id,
      COALESCE(v_user_full_name, 'مستخدم'),
      v_user_phone,
      NULLIF(COALESCE(v_user_email, ''), '')
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO new_profiles (
      id, full_name, phone_number, email, preferred_language, status, profile_status
    )
    VALUES (
      p_user_id,
      COALESCE(v_user_full_name, 'مستخدم'),
      v_user_phone,
      NULLIF(COALESCE(v_user_email, ''), ''),
      'ar',
      'active',
      'active'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Ensure wallet exists
  INSERT INTO club_points_wallet (
    user_id, points_balance, lifetime_points, pending_points, available_points, used_points
  ) VALUES (p_user_id, 0, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Balance before is the AVAILABLE balance (points_balance mirrors available_points in V1.3)
  SELECT COALESCE(points_balance, 0) INTO v_balance_before
  FROM club_points_wallet
  WHERE user_id = p_user_id;

  IF p_transaction_type = 'EARNED' THEN
    -- V1.3: Earned points are pending until monthly activation
    UPDATE club_points_wallet
    SET
      pending_points  = pending_points + p_points,
      lifetime_points = lifetime_points + GREATEST(p_points, 0),
      updated_at      = NOW()
    WHERE user_id = p_user_id;

    v_balance_after := v_balance_before;

  ELSIF p_transaction_type = 'ACTIVATED' THEN
    -- Move from pending -> available and update points_balance
    UPDATE club_points_wallet
    SET
      pending_points   = GREATEST(0, pending_points - p_points),
      available_points = available_points + p_points,
      points_balance   = available_points + p_points,
      updated_at       = NOW()
    WHERE user_id = p_user_id;

    v_balance_after := v_balance_before + p_points;

  ELSIF p_transaction_type = 'USED' THEN
    -- Deduct from available and record used_points
    UPDATE club_points_wallet
    SET
      available_points = GREATEST(0, available_points - ABS(p_points)),
      used_points      = used_points + ABS(p_points),
      points_balance   = GREATEST(0, points_balance - ABS(p_points)),
      updated_at       = NOW()
    WHERE user_id = p_user_id;

    v_balance_after := GREATEST(0, v_balance_before - ABS(p_points));

  ELSE
    RAISE EXCEPTION 'Invalid transaction_type for V1.3: %', p_transaction_type;
  END IF;

  INSERT INTO club_points_transactions (
    user_id, transaction_type, points, points_before, points_after,
    reason, source, description, created_by
  ) VALUES (
    p_user_id, p_transaction_type, p_points, v_balance_before, v_balance_after,
    p_reason, p_source, p_description, p_created_by
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_club_points_wallet IS 'V1.3: EARNED -> pending only; ACTIVATE monthly; USED from available';

-- Safety: ensure points_balance mirrors available_points for existing rows
UPDATE club_points_wallet
SET
  available_points = COALESCE(available_points, points_balance, 0),
  points_balance = COALESCE(available_points, points_balance, 0)
WHERE TRUE;

-- ================================================================
-- 2) radio_user_sessions table (user listening sessions) without breaking existing radio_sessions
-- ================================================================

CREATE TABLE IF NOT EXISTS radio_user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES new_profiles(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES club_activities(id),
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stop_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  points_earned INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radio_user_sessions_user ON radio_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_radio_user_sessions_activity ON radio_user_sessions(activity_id);
CREATE INDEX IF NOT EXISTS idx_radio_user_sessions_status ON radio_user_sessions(status);

COMMENT ON TABLE radio_user_sessions IS 'V1.3: user listening sessions for radio points (session-based)';

-- Close abandoned user sessions after 4 hours
CREATE OR REPLACE FUNCTION close_abandoned_radio_user_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_closed_count INTEGER;
BEGIN
  UPDATE radio_user_sessions
  SET
    stop_time = start_time + INTERVAL '4 hours',
    duration_minutes = FLOOR(EXTRACT(EPOCH FROM (INTERVAL '4 hours')) / 60),
    status = 'closed',
    updated_at = NOW()
  WHERE status = 'active'
    AND stop_time IS NULL
    AND start_time < NOW() - INTERVAL '4 hours';

  GET DIAGNOSTICS v_closed_count = ROW_COUNT;
  RETURN v_closed_count;
END;
$$;

COMMENT ON FUNCTION close_abandoned_radio_user_sessions IS 'V1.3: close abandoned user listening sessions after 4 hours';

