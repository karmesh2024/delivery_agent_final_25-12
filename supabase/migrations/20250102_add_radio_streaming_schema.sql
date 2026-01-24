-- =================================================================
-- Migration: Add Radio Streaming Support to Club Zone
-- Description: إضافة جداول ودعم البث الصوتي للراديو
-- Date: 2025-01-02
-- =================================================================

-- =================================================================
-- 1. تحديث club_activities لدعم البث
-- =================================================================

ALTER TABLE club_activities 
ADD COLUMN IF NOT EXISTS stream_url TEXT,
ADD COLUMN IF NOT EXISTS station_id INTEGER,
ADD COLUMN IF NOT EXISTS listen_url TEXT,
ADD COLUMN IF NOT EXISTS current_listeners INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_listeners INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stream_type VARCHAR(20) DEFAULT 'mp3' CHECK (stream_type IN ('mp3', 'aac', 'ogg')),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN club_activities.stream_url IS 'رابط البث من AzuraCast (مثل: http://radio.karmesh.eg:8000/radio.mp3)';
COMMENT ON COLUMN club_activities.station_id IS 'معرف المحطة في AzuraCast';
COMMENT ON COLUMN club_activities.listen_url IS 'رابط الاستماع (URL للاستخدام في Player)';
COMMENT ON COLUMN club_activities.current_listeners IS 'عدد المستمعين الحاليين';
COMMENT ON COLUMN club_activities.max_listeners IS 'الحد الأقصى للمستمعين';
COMMENT ON COLUMN club_activities.is_live IS 'هل البث مباشر الآن؟';
COMMENT ON COLUMN club_activities.stream_type IS 'نوع البث: mp3, aac, ogg';

-- تحديث Index
CREATE INDEX IF NOT EXISTS idx_club_activities_live ON club_activities(is_live) WHERE is_live = true;
CREATE INDEX IF NOT EXISTS idx_club_activities_stream_type ON club_activities(stream_type);

-- =================================================================
-- 2. جدول لتتبع المستمعين (للنقاط)
-- =================================================================

CREATE TABLE IF NOT EXISTS radio_listeners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES new_profiles(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES club_activities(id) ON DELETE CASCADE,
  started_listening_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_radio_listeners_user_id ON radio_listeners(user_id);
CREATE INDEX IF NOT EXISTS idx_radio_listeners_activity_id ON radio_listeners(activity_id);
CREATE INDEX IF NOT EXISTS idx_radio_listeners_last_active_at ON radio_listeners(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_radio_listeners_is_active ON radio_listeners(is_active) WHERE is_active = true;

COMMENT ON TABLE radio_listeners IS 'تتبع المستمعين الحاليين للبث (لنظام النقاط)';
COMMENT ON COLUMN radio_listeners.duration_minutes IS 'مدة الاستماع بالدقائق';
COMMENT ON COLUMN radio_listeners.points_earned IS 'النقاط المكتسبة من الاستماع';

-- =================================================================
-- 3. جدول سجلات البث
-- =================================================================

CREATE TABLE IF NOT EXISTS radio_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES club_activities(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_listeners INTEGER DEFAULT 0,
  peak_listeners INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  partner_id UUID REFERENCES club_partners(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radio_sessions_activity_id ON radio_sessions(activity_id);
CREATE INDEX IF NOT EXISTS idx_radio_sessions_status ON radio_sessions(status);
CREATE INDEX IF NOT EXISTS idx_radio_sessions_started_at ON radio_sessions(started_at DESC);

COMMENT ON TABLE radio_sessions IS 'سجلات جلسات البث المباشر';
COMMENT ON COLUMN radio_sessions.peak_listeners IS 'أعلى عدد مستمعين في الجلسة';
COMMENT ON COLUMN radio_sessions.total_duration_minutes IS 'مدة الجلسة بالدقائق';

-- =================================================================
-- 4. Trigger لتحديث updated_at
-- =================================================================

-- Trigger لـ club_activities
DROP TRIGGER IF EXISTS update_club_activities_updated_at ON club_activities;
CREATE TRIGGER update_club_activities_updated_at
BEFORE UPDATE ON club_activities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger لـ radio_listeners
DROP TRIGGER IF EXISTS update_radio_listeners_updated_at ON radio_listeners;
CREATE TRIGGER update_radio_listeners_updated_at
BEFORE UPDATE ON radio_listeners
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger لـ radio_sessions
DROP TRIGGER IF EXISTS update_radio_sessions_updated_at ON radio_sessions;
CREATE TRIGGER update_radio_sessions_updated_at
BEFORE UPDATE ON radio_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- 5. Function لتحديث عدد المستمعين
-- =================================================================

CREATE OR REPLACE FUNCTION update_radio_listeners_count(p_activity_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- حساب المستمعين النشطين (آخر 5 دقائق)
  SELECT COUNT(*) INTO v_count
  FROM radio_listeners
  WHERE activity_id = p_activity_id
    AND is_active = true
    AND last_active_at > NOW() - INTERVAL '5 minutes';

  -- تحديث عدد المستمعين في club_activities
  UPDATE club_activities
  SET current_listeners = v_count
  WHERE id = p_activity_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_radio_listeners_count IS 'تحديث عدد المستمعين الحاليين للبث';

-- =================================================================
-- 6. RLS Policies
-- =================================================================

-- تفعيل RLS
ALTER TABLE radio_listeners ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies للـ radio_listeners
DROP POLICY IF EXISTS "Users can read own listening records" ON radio_listeners;
CREATE POLICY "Users can read own listening records"
ON radio_listeners FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all listening records" ON radio_listeners;
CREATE POLICY "Admins can read all listening records"
ON radio_listeners FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

DROP POLICY IF EXISTS "Users can insert own listening records" ON radio_listeners;
CREATE POLICY "Users can insert own listening records"
ON radio_listeners FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own listening records" ON radio_listeners;
CREATE POLICY "Users can update own listening records"
ON radio_listeners FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can update listening records" ON radio_listeners;
CREATE POLICY "Service role can update listening records"
ON radio_listeners FOR UPDATE
USING (auth.role() = 'service_role');

-- RLS Policies للـ radio_sessions
DROP POLICY IF EXISTS "Everyone can read active radio sessions" ON radio_sessions;
CREATE POLICY "Everyone can read active radio sessions"
ON radio_sessions FOR SELECT
USING (status = 'active' OR status = 'completed');

DROP POLICY IF EXISTS "Admins can manage all radio sessions" ON radio_sessions;
CREATE POLICY "Admins can manage all radio sessions"
ON radio_sessions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- =================================================================
-- End of Migration
-- =================================================================
