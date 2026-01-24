-- =================================================================
-- Migration: Fix activate_monthly_points duplicate key error
-- Description: إصلاح خطأ duplicate key في activate_monthly_points
-- Date: 2025-01-22
-- Version: V1.5.1
-- =================================================================

-- =================================================================
-- إصلاح دالة activate_monthly_points
-- =================================================================
-- المشكلة: محاولة إدراج settlement_month مكرر يسبب خطأ duplicate key
-- الحل: التحقق من وجود settlement_month قبل الإدراج
-- =================================================================

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
  v_existing_settlement UUID;
BEGIN
  -- ✅ V1.5.1: التحقق من وجود settlement_month مسبقاً
  SELECT id INTO v_existing_settlement
  FROM monthly_points_settlement
  WHERE settlement_month = p_settlement_month
  LIMIT 1;

  -- إذا كان موجوداً، نستخدمه بدلاً من إنشاء جديد
  IF v_existing_settlement IS NOT NULL THEN
    -- إرجاع الخطأ مع رسالة واضحة
    RAISE EXCEPTION 'شهر % تم اعتماد نقاطه مسبقاً. لا يمكن اعتماد نفس الشهر مرتين.', p_settlement_month;
  END IF;

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

COMMENT ON FUNCTION activate_monthly_points IS 'V1.5.1: تفعيل جميع النقاط المعلقة وتحويلها إلى متاحة في نهاية الشهر - مع التحقق من عدم التكرار';

-- =================================================================
-- ملاحظات V1.5.1:
-- =================================================================
-- 1. التحقق من وجود settlement_month قبل الإدراج
-- 2. إذا كان موجوداً، يتم إرجاع رسالة خطأ واضحة بالعربية
-- 3. يمنع محاولة اعتماد نفس الشهر مرتين
-- =================================================================

-- =================================================================
-- End of Migration
-- =================================================================
