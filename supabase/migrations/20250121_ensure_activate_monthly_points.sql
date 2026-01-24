-- Migration: Ensure activate_monthly_points function exists
-- هذا الملف يضمن وجود دالة activate_monthly_points والجدول المطلوب في قاعدة البيانات

-- ================================================================
-- 1) إنشاء جدول monthly_points_settlement إذا لم يكن موجوداً
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

-- إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_monthly_points_settlement_month 
ON monthly_points_settlement(settlement_month);

CREATE INDEX IF NOT EXISTS idx_monthly_points_settlement_processed_by 
ON monthly_points_settlement(processed_by);

-- ================================================================
-- 2) إنشاء الدالة إذا لم تكن موجودة
-- ================================================================
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
  -- إنشاء سجل الاعتماد الشهري
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

  -- حساب إجمالي النقاط المعلقة والمستخدمين المتأثرين
  SELECT 
    COALESCE(SUM(pending_points), 0),
    COUNT(DISTINCT user_id)
  INTO v_total_pending, v_users_count
  FROM club_points_wallet
  WHERE pending_points > 0;

  v_total_activated := 0;

  -- تحويل جميع النقاط المعلقة إلى متاحة
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

  -- تحديث سجل الاعتماد بالنتائج النهائية
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

-- إضافة تعليق على الدالة
COMMENT ON FUNCTION activate_monthly_points(VARCHAR, UUID, TEXT) IS 'تفعيل جميع النقاط المعلقة وتحويلها إلى متاحة في نهاية الشهر (V1.3)';

-- ================================================================
-- 3) إنشاء دالة check_monthly_settlement_due إذا لم تكن موجودة
-- ================================================================

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
-- 4) إنشاء دالة get_user_points_summary إذا لم تكن موجودة
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
    COALESCE(COALESCE(available_points, points_balance), 0) as total_balance,
    COALESCE(lifetime_points, 0)
  FROM club_points_wallet
  WHERE user_id = p_user_id;
$$;

COMMENT ON FUNCTION get_user_points_summary IS 'إرجاع ملخص رصيد نقاط النادي (Pending / Available / Used / Balance / Lifetime)';

-- ================================================================
-- 5) منح الصلاحيات المطلوبة
-- ================================================================

GRANT EXECUTE ON FUNCTION activate_monthly_points(VARCHAR, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION activate_monthly_points(VARCHAR, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION check_monthly_settlement_due() TO authenticated;
GRANT EXECUTE ON FUNCTION check_monthly_settlement_due() TO service_role;
GRANT EXECUTE ON FUNCTION get_user_points_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_points_summary(UUID) TO service_role;