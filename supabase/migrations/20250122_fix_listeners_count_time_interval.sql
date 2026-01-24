-- =================================================================
-- Migration: Fix listeners count time interval
-- Description: توحيد الفترة الزمنية لحساب المستمعين النشطين (10 دقائق)
-- Date: 2025-01-22
-- Version: V1.5.1
-- =================================================================

-- =================================================================
-- تحديث دالة update_radio_listeners_count
-- =================================================================
-- V1.5.1: توحيد الفترة الزمنية إلى 10 دقائق (مطابق لـ get_active_radio_listeners)
-- =================================================================

CREATE OR REPLACE FUNCTION update_radio_listeners_count(p_activity_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- ✅ V1.5.1: حساب المستمعين النشطين (آخر 10 دقائق - مطابق لـ RPC)
  SELECT COUNT(*) INTO v_count
  FROM radio_listeners
  WHERE activity_id = p_activity_id
    AND is_active = true
    AND last_active_at > NOW() - INTERVAL '10 minutes'; -- ✅ تغيير من 5 إلى 10 دقائق

  -- تحديث عدد المستمعين في club_activities
  UPDATE club_activities
  SET current_listeners = v_count
  WHERE id = p_activity_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_radio_listeners_count IS 'V1.5.1: تحديث عدد المستمعين الحاليين للبث (آخر 10 دقائق - مطابق لـ get_active_radio_listeners)';

-- =================================================================
-- ملاحظات V1.5.1:
-- =================================================================
-- 1. تم توحيد الفترة الزمنية إلى 10 دقائق في جميع الأماكن:
--    - getCurrentListeners() في Frontend
--    - getActiveListenersWithDetails() في Frontend
--    - get_active_radio_listeners() RPC function
--    - update_radio_listeners_count() function
-- 2. هذا يضمن أن عدد المستمعين المعروض يطابق قائمة المستمعين
-- =================================================================

-- =================================================================
-- End of Migration
-- =================================================================
