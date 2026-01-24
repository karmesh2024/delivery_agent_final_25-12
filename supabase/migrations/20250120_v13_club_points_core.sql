-- =================================================================
-- V1.3 Club Points Core Migration
-- تاريخ: 2025-01-20
-- الهدف: دعم pending/available/used + التسوية الشهرية + طلبات تحويل المخلفات
--        + جلسات الراديو Session-Based بدون كسر الواجهات الحالية
-- =================================================================

-- ================================================================
-- 1) ترقية جدول محفظة النقاط club_points_wallet
-- ================================================================

ALTER TABLE club_points_wallet
  ADD COLUMN IF NOT EXISTS pending_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS used_points INTEGER DEFAULT 0;

-- تهيئة البيانات الحالية:
-- نفترض أن points_balance الحالي يمثل الرصيد المتاح (AVAILABLE)
UPDATE club_points_wallet
SET
  available_points = CASE
    WHEN available_points = 0 AND points_balance IS NOT NULL THEN points_balance
    ELSE available_points
  END,
  pending_points = COALESCE(pending_points, 0),
  used_points = COALESCE(used_points, 0)
WHERE points_balance IS NOT NULL;

COMMENT ON COLUMN club_points_wallet.pending_points IS 'نقاط مكتسبة لم تُعتمد بعد (رصيد هذا الشهر)';
COMMENT ON COLUMN club_points_wallet.available_points IS 'نقاط معتمدة جاهزة للاستخدام (رصيد متاح)';
COMMENT ON COLUMN club_points_wallet.used_points IS 'نقاط تم استخدامها في الجوائز أو غيرها';

-- ================================================================
-- 2) تقييد أنواع معاملات النادي على V1.3 (EARNED / ACTIVATED / USED)
--    مع الحفاظ على السجلات القديمة كما هي
-- ================================================================

ALTER TABLE club_points_transactions
  DROP CONSTRAINT IF EXISTS club_points_transactions_transaction_type_check;

ALTER TABLE club_points_transactions
  ADD CONSTRAINT club_points_transactions_transaction_type_check
  CHECK (transaction_type IN (
    'EARNED',      -- كسب نقاط (تذهب مبدئياً إلى pending_points)
    'ACTIVATED',   -- تسوية شهرية: نقل من pending إلى available
    'USED'         -- خصم من available عند استبدال/استخدام
  ));

-- ================================================================
-- 3) دوال أساسية V1.3: حساب النقاط للخدمات
-- ================================================================

CREATE TABLE IF NOT EXISTS club_service_points_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL UNIQUE,
  service_title VARCHAR(255) NOT NULL,
  service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('radio','manual','other')),
  points_rate_type VARCHAR(20) NOT NULL CHECK (points_rate_type IN ('per_minute','fixed')),
  base_points_rate DECIMAL(10,2) NOT NULL DEFAULT 1.0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE club_service_points_config IS 'إعدادات بسيطة لمعدلات النقاط لكل خدمة في V1.3';

INSERT INTO club_service_points_config (
  service_name, service_title, service_type, points_rate_type, base_points_rate
) VALUES
('radio_stream', 'راديو كارمش - نقاط الاستماع', 'radio', 'per_minute', 1.0)
ON CONFLICT (service_name) DO NOTHING;

-- دالة مبسطة لحساب النقاط
CREATE OR REPLACE FUNCTION calculate_service_points(
  p_service_name VARCHAR,
  p_minutes DECIMAL
) RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_rate DECIMAL(10,2);
  v_points INTEGER;
BEGIN
  SELECT base_points_rate
  INTO v_rate
  FROM club_service_points_config
  WHERE service_name = p_service_name
    AND is_active = TRUE;

  IF v_rate IS NULL THEN
    v_rate := 1.0; -- افتراضي: 1 نقطة/دقيقة
  END IF;

  v_points := FLOOR(p_minutes * v_rate);
  RETURN GREATEST(v_points, 0);
END;
$$;

COMMENT ON FUNCTION calculate_service_points IS 'حساب النقاط المستحقة لخدمة معينة (حاليًا للراديو فقط) في V1.3';

-- ================================================================
-- 4) إعادة تعريف update_club_points_wallet لدعم pending/available/used
--    مع الحفاظ على التوافق مع الكود الحالي
-- ================================================================

-- إسقاط النسخة القديمة (بنفس التوقيع) ثم إعادة إنشائها
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
  -- ضمان وجود new_profiles / customers (كما في النسخة السابقة)
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
  
  -- إنشاء محفظة إن لم تكن موجودة
  INSERT INTO club_points_wallet (user_id, points_balance, lifetime_points, pending_points, available_points, used_points)
  VALUES (p_user_id, 0, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- جلب الرصيد الحالي (المتاح) من points_balance
  SELECT COALESCE(points_balance, 0) INTO v_balance_before
  FROM club_points_wallet
  WHERE user_id = p_user_id;
  
  -- تحديث المحفظة حسب نوع المعاملة في V1.3
  IF p_transaction_type = 'EARNED' THEN
    -- في V1.3: نضيف إلى pending_points، لكن للحفاظ على التوافق نزيد أيضاً الرصيد المتاح
    UPDATE club_points_wallet
    SET 
      pending_points   = pending_points + p_points,
      available_points = available_points + p_points,
      points_balance   = available_points + p_points,
      lifetime_points  = lifetime_points + GREATEST(p_points, 0),
      updated_at       = NOW()
    WHERE user_id = p_user_id;
    
    v_balance_after := v_balance_before + p_points;

  ELSIF p_transaction_type = 'ACTIVATED' THEN
    -- نقل من pending إلى available (والرصيد المتاح هو الذي يُصرف فعلياً)
    UPDATE club_points_wallet
    SET
      pending_points   = GREATEST(0, pending_points - p_points),
      available_points = available_points + p_points,
      points_balance   = available_points + p_points,
      updated_at       = NOW()
    WHERE user_id = p_user_id;
    
    v_balance_after := v_balance_before + p_points;

  ELSIF p_transaction_type = 'USED' THEN
    -- خصم من available / points_balance وتسجيل في used_points
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
  
  -- تسجيل المعاملة كما في السابق
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

COMMENT ON FUNCTION update_club_points_wallet IS 'تحديث رصيد نقاط النادي مع دعم pending/available/used في V1.3';

-- ================================================================
-- 5) جدول التسوية الشهرية + دالة التفعيل الشهري
-- ================================================================

CREATE TABLE IF NOT EXISTS monthly_points_settlement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_month VARCHAR(7) NOT NULL, -- 'YYYY-MM'
  total_pending_points INTEGER NOT NULL DEFAULT 0,
  total_activated_points INTEGER NOT NULL DEFAULT 0,
  total_users_affected INTEGER NOT NULL DEFAULT 0,
  processed_by UUID REFERENCES new_profiles(id),
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed')),
  notes TEXT,
  UNIQUE(settlement_month)
);

COMMENT ON TABLE monthly_points_settlement IS 'سجل التسويات الشهرية لنقاط النادي في V1.3';

CREATE OR REPLACE FUNCTION activate_monthly_points(
  p_settlement_month VARCHAR(7),
  p_processed_by UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settlement_id UUID;
  v_total_pending INTEGER;
  v_total_activated INTEGER;
  v_users_count INTEGER;
  v_user_record RECORD;
BEGIN
  INSERT INTO monthly_points_settlement (
    settlement_month,
    processed_by,
    notes,
    status
  ) VALUES (
    p_settlement_month,
    p_processed_by,
    p_notes,
    'completed'
  ) RETURNING id INTO v_settlement_id;

  SELECT 
    COALESCE(SUM(pending_points), 0),
    COUNT(DISTINCT user_id)
  INTO v_total_pending, v_users_count
  FROM club_points_wallet
  WHERE pending_points > 0;

  v_total_activated := 0;

  FOR v_user_record IN
    SELECT user_id, pending_points
    FROM club_points_wallet
    WHERE pending_points > 0
  LOOP
    PERFORM update_club_points_wallet(
      v_user_record.user_id,
      v_user_record.pending_points,
      'ACTIVATED',
      'اعتماد شهري',
      'monthly_settlement',
      'اعتماد نقاط شهر ' || p_settlement_month,
      p_processed_by
    );

    v_total_activated := v_total_activated + v_user_record.pending_points;
  END LOOP;

  UPDATE monthly_points_settlement
  SET
    total_pending_points = v_total_pending,
    total_activated_points = v_total_activated,
    total_users_affected = v_users_count,
    processed_at = NOW(),
    status = 'completed'
  WHERE id = v_settlement_id;

  RETURN v_settlement_id;
END;
$$;

COMMENT ON FUNCTION activate_monthly_points IS 'تفعيل جميع النقاط المعلقة وتحويلها إلى متاحة في نهاية الشهر (V1.3)';

-- دالة مساعدة: هل هناك شهر لم تتم تسويته بعد؟
CREATE OR REPLACE FUNCTION check_monthly_settlement_due()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_current_month VARCHAR(7);
  v_last_settlement VARCHAR(7);
BEGIN
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');

  SELECT settlement_month INTO v_last_settlement
  FROM monthly_points_settlement
  ORDER BY settlement_month DESC
  LIMIT 1;

  IF v_last_settlement IS NULL OR v_last_settlement < v_current_month THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION check_monthly_settlement_due IS 'إرجاع TRUE إذا كان شهر حالي لم يتم اعتماد نقاطه بعد';

-- ================================================================
-- 6) جدول طلبات تحويل المخلفات (Request Only)
-- ================================================================

CREATE TABLE IF NOT EXISTS recycling_conversion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES new_profiles(id) ON DELETE CASCADE,
  recycling_points INTEGER NOT NULL,
  club_points_expected INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  processed_by UUID REFERENCES new_profiles(id),
  processed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recycling_requests_user ON recycling_conversion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_recycling_requests_status ON recycling_conversion_requests(status);

COMMENT ON TABLE recycling_conversion_requests IS 'طلبات تحويل نقاط المخلفات إلى نقاط النادي (Request Only) في V1.3';

-- RLS Policies for recycling_conversion_requests
ALTER TABLE recycling_conversion_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests
CREATE POLICY IF NOT EXISTS "Users can view own conversion requests"
  ON recycling_conversion_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own requests
CREATE POLICY IF NOT EXISTS "Users can create own conversion requests"
  ON recycling_conversion_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all requests (using service role or bypass RLS in functions)
-- Note: Admin is identified by existence in admins table
CREATE POLICY IF NOT EXISTS "Admins can view all conversion requests"
  ON recycling_conversion_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Policy: Admins can update requests (approve/reject)
CREATE POLICY IF NOT EXISTS "Admins can update conversion requests"
  ON recycling_conversion_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- ================================================================
-- 7) جدول جلسات الراديو + إغلاق الجلسات المتروكة
-- ================================================================

CREATE TABLE IF NOT EXISTS radio_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES new_profiles(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES club_activities(id),
  start_time TIMESTAMPTZ NOT NULL,
  stop_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  points_earned INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radio_sessions_user ON radio_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_radio_sessions_activity ON radio_sessions(activity_id);
CREATE INDEX IF NOT EXISTS idx_radio_sessions_status ON radio_sessions(status);

COMMENT ON TABLE radio_sessions IS 'جلسات استماع الراديو لكل مستخدم في V1.3 (Session-Based Points)';

-- إغلاق الجلسات المتروكة بعد مدة معينة (مثلاً 4 ساعات)
CREATE OR REPLACE FUNCTION close_abandoned_radio_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_closed_count INTEGER;
BEGIN
  UPDATE radio_sessions
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

COMMENT ON FUNCTION close_abandoned_radio_sessions IS 'إغلاق جلسات الراديو المتروكة بعد 4 ساعات في V1.3';

-- ================================================================
-- 8) دالة تلخيص رصيد المستخدم (للـ UI)
-- ================================================================

CREATE OR REPLACE FUNCTION get_user_points_summary(p_user_id UUID)
RETURNS TABLE (
  pending_points INTEGER,
  available_points INTEGER,
  used_points INTEGER,
  total_balance INTEGER,
  lifetime_points INTEGER
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(pending_points, 0),
    COALESCE(available_points, 0),
    COALESCE(used_points, 0),
    COALESCE(points_balance, 0),
    COALESCE(lifetime_points, 0)
  FROM club_points_wallet
  WHERE user_id = p_user_id;
$$;

COMMENT ON FUNCTION get_user_points_summary IS 'إرجاع ملخص رصيد نقاط النادي (Pending / Available / Used / Balance / Lifetime)';

