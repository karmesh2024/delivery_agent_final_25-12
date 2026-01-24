-- =================================================================
-- Migration: Add Broadcast Mode to club_activities
-- Description: إضافة حقول broadcast_mode لدعم Always-On Stream
-- Date: 2025-01-23
-- =================================================================

-- =================================================================
-- 1. إضافة حقول جديدة لـ club_activities
-- =================================================================

ALTER TABLE club_activities 
ADD COLUMN IF NOT EXISTS broadcast_mode VARCHAR(20) DEFAULT 'live_event' 
  CHECK (broadcast_mode IN ('live_event', 'always_on')),
ADD COLUMN IF NOT EXISTS playlist_engine_url TEXT,
ADD COLUMN IF NOT EXISTS auto_switch_enabled BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN club_activities.broadcast_mode IS 'نوع البث: live_event (البث الأسبوعي المباشر) أو always_on (البث العام المستمر)';
COMMENT ON COLUMN club_activities.playlist_engine_url IS 'رابط Playlist Engine للبث العام المستمر';
COMMENT ON COLUMN club_activities.auto_switch_enabled IS 'تفعيل التبديل التلقائي بين Always-On و Live Event';

-- =================================================================
-- 2. إنشاء Index
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_club_activities_broadcast_mode ON club_activities(broadcast_mode);
CREATE INDEX IF NOT EXISTS idx_club_activities_broadcast_mode_live ON club_activities(broadcast_mode, is_live) 
  WHERE is_live = true;

-- =================================================================
-- 3. Function للتحقق من حالة البث الحالي
-- =================================================================

CREATE OR REPLACE FUNCTION get_current_broadcast_mode()
RETURNS VARCHAR(20) AS $$
DECLARE
  v_mode VARCHAR(20);
BEGIN
  SELECT broadcast_mode INTO v_mode
  FROM club_activities
  WHERE activity_type = 'radio_stream'
    AND is_active = true
    AND is_live = true
  ORDER BY updated_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_mode, 'always_on');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_current_broadcast_mode IS 'الحصول على نوع البث الحالي (live_event أو always_on)';

-- =================================================================
-- 4. Function للتبديل التلقائي
-- =================================================================

CREATE OR REPLACE FUNCTION check_and_switch_broadcast()
RETURNS TRIGGER AS $$
DECLARE
  v_live_event_exists BOOLEAN;
  v_always_on_exists BOOLEAN;
BEGIN
  -- التحقق من وجود Live Event نشط
  SELECT EXISTS(
    SELECT 1 FROM club_activities
    WHERE activity_type = 'radio_stream'
      AND broadcast_mode = 'live_event'
      AND is_active = true
      AND is_live = true
  ) INTO v_live_event_exists;
  
  -- التحقق من وجود Always-On نشط
  SELECT EXISTS(
    SELECT 1 FROM club_activities
    WHERE activity_type = 'radio_stream'
      AND broadcast_mode = 'always_on'
      AND is_active = true
      AND is_live = true
  ) INTO v_always_on_exists;
  
  -- إذا كان Live Event نشط، إيقاف Always-On تلقائياً
  IF v_live_event_exists AND v_always_on_exists THEN
    UPDATE club_activities
    SET is_live = false
    WHERE activity_type = 'radio_stream'
      AND broadcast_mode = 'always_on'
      AND is_active = true
      AND is_live = true
      AND auto_switch_enabled = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_and_switch_broadcast IS 'التحقق والتبديل التلقائي بين Always-On و Live Event';

-- =================================================================
-- 5. Trigger للتبديل التلقائي
-- =================================================================

DROP TRIGGER IF EXISTS trigger_check_broadcast_switch ON club_activities;
CREATE TRIGGER trigger_check_broadcast_switch
AFTER UPDATE OF is_live, broadcast_mode ON club_activities
FOR EACH ROW
WHEN (NEW.activity_type = 'radio_stream' AND NEW.is_active = true)
EXECUTE FUNCTION check_and_switch_broadcast();

-- =================================================================
-- End of Migration
-- =================================================================
