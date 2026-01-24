-- =================================================================
-- Migration: Add process_recycling_conversion_request Function
-- Description: إضافة دالة لمعالجة طلبات تحويل نقاط المخلفات (Admin Only)
-- Date: 2025-01-21
-- =================================================================

-- =================================================================
-- RPC Function: process_recycling_conversion_request
-- =================================================================
-- هذه الدالة تقوم بـ:
-- 1) التحقق من الطلب
-- 2) التحقق من السقف الشهري
-- 3) منح النقاط إلى pending_points
-- 4) تحديث حالة الطلب
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

-- =================================================================
-- Grant Permissions
-- =================================================================

-- هذه الدالة للـ Admin فقط، لكن نمنح الصلاحية للـ authenticated
-- يجب التحقق من صلاحيات Admin في التطبيق
GRANT EXECUTE ON FUNCTION process_recycling_conversion_request(UUID, VARCHAR, UUID, TEXT) TO authenticated;

-- =================================================================
-- End of Migration
-- =================================================================
