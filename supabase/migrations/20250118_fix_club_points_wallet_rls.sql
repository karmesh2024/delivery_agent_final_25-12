-- Fix RLS issue for update_club_points_wallet function
-- The function needs SECURITY DEFINER to bypass RLS when updating club_points_wallet

-- Drop the existing function
DROP FUNCTION IF EXISTS update_club_points_wallet(
  UUID, INTEGER, VARCHAR, VARCHAR, VARCHAR, TEXT, UUID
);

-- Recreate with SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_club_points_wallet(
  p_user_id UUID,
  p_points INTEGER,
  p_transaction_type VARCHAR,
  p_reason VARCHAR DEFAULT NULL,
  p_source VARCHAR DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID 
SECURITY DEFINER -- This allows the function to bypass RLS
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
  -- Check if new_profiles record exists, if not create it
  SELECT EXISTS(SELECT 1 FROM new_profiles WHERE id = p_user_id) INTO v_profile_exists;
  
  IF NOT v_profile_exists THEN
    -- Get user details from auth.users
    SELECT 
      COALESCE(email, ''),
      COALESCE(phone, ''),
      COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email, 'مستخدم')
    INTO v_user_email, v_user_phone, v_user_full_name
    FROM auth.users
    WHERE id = p_user_id;
    
    -- Ensure we always have some phone value (to satisfy NOT NULL / unique constraints)
    IF v_user_phone IS NULL OR v_user_phone = '' THEN
      -- Use a deterministic short fallback based on user id (last 11 digits)
      v_user_phone := RIGHT(REPLACE(p_user_id::TEXT, '-', ''), 11);
    END IF;
    
    -- Create customers record first (new_profiles.id must reference customers.id)
    -- NOTE: we only insert the essential columns and let the table defaults
    -- handle fields like customer_type / customer_status / preferred_language
    INSERT INTO customers (
      id,
      user_id,
      full_name,
      phone_number,
      email
    )
    VALUES (
      p_user_id,
      p_user_id,
      COALESCE(v_user_full_name, 'مستخدم'),
      v_user_phone,
      NULLIF(COALESCE(v_user_email, ''), '')
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create new_profiles record (must have same id as customers.id)
    INSERT INTO new_profiles (
      id,
      full_name,
      phone_number,
      email,
      preferred_language,
      status,
      profile_status
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
  
  -- Get or create wallet
  INSERT INTO club_points_wallet (user_id, points_balance, lifetime_points)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current balance
  SELECT COALESCE(points_balance, 0) INTO v_balance_before
  FROM club_points_wallet
  WHERE user_id = p_user_id;
  
  -- Update balance based on transaction type
  IF p_transaction_type IN ('EARNED', 'BONUS', 'CONVERTED') THEN
    -- Add points
    UPDATE club_points_wallet
    SET points_balance = points_balance + p_points,
        lifetime_points = lifetime_points + GREATEST(p_points, 0),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    v_balance_after := v_balance_before + p_points;
  ELSIF p_transaction_type IN ('USED', 'EXPIRED', 'ADJUSTED') THEN
    -- Subtract points
    UPDATE club_points_wallet
    SET points_balance = GREATEST(0, points_balance - ABS(p_points)),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    v_balance_after := GREATEST(0, v_balance_before - ABS(p_points));
  ELSE
    RAISE EXCEPTION 'Invalid transaction_type: %', p_transaction_type;
  END IF;
  
  -- Insert transaction record
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

COMMENT ON FUNCTION update_club_points_wallet IS 'تحديث رصيد نقاط النادي وإنشاء سجل معاملة - يعمل بصلاحيات SECURITY DEFINER لتجاوز RLS';
