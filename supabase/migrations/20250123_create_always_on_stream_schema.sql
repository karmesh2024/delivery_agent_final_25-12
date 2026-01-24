-- =================================================================
-- Migration: Create Always-On Stream Schema
-- Description: إنشاء جداول نظام البث العام المستمر (Always-On Stream)
-- Date: 2025-01-23
-- =================================================================

-- =================================================================
-- 1. جدول radio_content (مكتبة المحتوى)
-- =================================================================

CREATE TABLE IF NOT EXISTS radio_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('clip', 'music', 'ad', 'announcement')),
  file_url TEXT NOT NULL,
  file_duration_seconds INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  -- Metadata مثال: {"tags": ["comedy"], "allow_music_overlay": true, "priority": "high"}
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES new_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radio_content_type ON radio_content(content_type);
CREATE INDEX IF NOT EXISTS idx_radio_content_active ON radio_content(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_radio_content_created_by ON radio_content(created_by);

COMMENT ON TABLE radio_content IS 'مكتبة المحتوى الصوتي (Clips, Music, Ads, Announcements)';
COMMENT ON COLUMN radio_content.content_type IS 'نوع المحتوى: clip, music, ad, announcement';
COMMENT ON COLUMN radio_content.file_url IS 'رابط الملف في Supabase Storage';
COMMENT ON COLUMN radio_content.file_duration_seconds IS 'مدة الملف بالثواني';
COMMENT ON COLUMN radio_content.metadata IS 'معلومات إضافية: tags, priority, allow_music_overlay';

-- =================================================================
-- 2. جدول playlist_timeline (جدولة البث)
-- =================================================================

CREATE TABLE IF NOT EXISTS playlist_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES radio_content(id) ON DELETE CASCADE,
  play_order INTEGER NOT NULL,
  scheduled_time TIME,  -- وقت محدد (مثل 10:00:00)
  play_rule VARCHAR(50), -- 'every_30_minutes', 'hourly', 'daily', 'once', 'continuous'
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playlist_timeline_content_id ON playlist_timeline(content_id);
CREATE INDEX IF NOT EXISTS idx_playlist_timeline_play_order ON playlist_timeline(play_order);
CREATE INDEX IF NOT EXISTS idx_playlist_timeline_active ON playlist_timeline(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_playlist_timeline_scheduled_time ON playlist_timeline(scheduled_time);

COMMENT ON TABLE playlist_timeline IS 'جدولة المحتوى للبث العام المستمر';
COMMENT ON COLUMN playlist_timeline.play_order IS 'ترتيب التشغيل';
COMMENT ON COLUMN playlist_timeline.scheduled_time IS 'وقت محدد للتشغيل (مثل 10:00:00)';
COMMENT ON COLUMN playlist_timeline.play_rule IS 'قاعدة التشغيل: every_30_minutes, hourly, daily, once, continuous';

-- =================================================================
-- 3. جدول playlist_logs (سجلات التشغيل)
-- =================================================================

CREATE TABLE IF NOT EXISTS playlist_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES radio_content(id) ON DELETE SET NULL,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INTEGER,
  listeners_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playlist_logs_content_id ON playlist_logs(content_id);
CREATE INDEX IF NOT EXISTS idx_playlist_logs_played_at ON playlist_logs(played_at DESC);

COMMENT ON TABLE playlist_logs IS 'سجلات تشغيل المحتوى في البث العام';
COMMENT ON COLUMN playlist_logs.played_at IS 'وقت تشغيل المحتوى';
COMMENT ON COLUMN playlist_logs.listeners_count IS 'عدد المستمعين عند التشغيل';

-- =================================================================
-- 4. Triggers لتحديث updated_at
-- =================================================================

-- Trigger لـ radio_content
DROP TRIGGER IF EXISTS update_radio_content_updated_at ON radio_content;
CREATE TRIGGER update_radio_content_updated_at
BEFORE UPDATE ON radio_content
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger لـ playlist_timeline
DROP TRIGGER IF EXISTS update_playlist_timeline_updated_at ON playlist_timeline;
CREATE TRIGGER update_playlist_timeline_updated_at
BEFORE UPDATE ON playlist_timeline
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- 5. RLS Policies
-- =================================================================

-- تفعيل RLS
ALTER TABLE radio_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies للـ radio_content
DROP POLICY IF EXISTS "Everyone can read active radio content" ON radio_content;
CREATE POLICY "Everyone can read active radio content"
ON radio_content FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage radio content" ON radio_content;
CREATE POLICY "Admins can manage radio content"
ON radio_content FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- RLS Policies للـ playlist_timeline
DROP POLICY IF EXISTS "Everyone can read active playlist timeline" ON playlist_timeline;
CREATE POLICY "Everyone can read active playlist timeline"
ON playlist_timeline FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage playlist timeline" ON playlist_timeline;
CREATE POLICY "Admins can manage playlist timeline"
ON playlist_timeline FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- RLS Policies للـ playlist_logs
DROP POLICY IF EXISTS "Admins can read playlist logs" ON playlist_logs;
CREATE POLICY "Admins can read playlist logs"
ON playlist_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

DROP POLICY IF EXISTS "Service role can insert playlist logs" ON playlist_logs;
CREATE POLICY "Service role can insert playlist logs"
ON playlist_logs FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- =================================================================
-- End of Migration
-- =================================================================
