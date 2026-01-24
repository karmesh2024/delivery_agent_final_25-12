-- =============================================================================
-- تنفيذ مباشر: Radio Always-On — Storage + Schema
-- =============================================================================
--
-- الاستخدام:
-- 1. افتح Supabase Dashboard > SQL Editor > New query
-- 2. الصق هذا الملف كاملاً
-- 3. Run
--
-- يتضمن:
-- - Storage: buckets (radio-content, radio-playlists) + سياسات RLS
-- - Database: radio_content, playlist_timeline, playlist_logs
-- - إضافة broadcast_mode لـ club_activities
--
-- متطلبات مسبقة: جداول new_profiles و admins و club_activities (من مخطط نادي/الراديو).
-- آمن للتكرار: يمكن تشغيله أكثر من مرة.
--
-- =============================================================================

-- =============================================================================
-- القسم 1: Storage Buckets (radio-content, radio-playlists)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('radio-content', 'radio-content', true),
  ('radio-playlists', 'radio-playlists', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- القسم 2: سياسات Storage لـ radio-content (مكتبة المحتوى الصوتي)
-- =============================================================================

-- قراءة عامة (للتشغيل والوصول للملفات)
DROP POLICY IF EXISTS "radio-content: Public read" ON storage.objects;
CREATE POLICY "radio-content: Public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'radio-content');

-- رفع (مستخدمون مصادقون)
DROP POLICY IF EXISTS "radio-content: Authenticated upload" ON storage.objects;
CREATE POLICY "radio-content: Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'radio-content'
  AND auth.role() = 'authenticated'
);

-- تحديث (مستخدمون مصادقون)
DROP POLICY IF EXISTS "radio-content: Authenticated update" ON storage.objects;
CREATE POLICY "radio-content: Authenticated update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'radio-content' AND auth.role() = 'authenticated');

-- حذف (مستخدمون مصادقون)
DROP POLICY IF EXISTS "radio-content: Authenticated delete" ON storage.objects;
CREATE POLICY "radio-content: Authenticated delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'radio-content' AND auth.role() = 'authenticated');

-- =============================================================================
-- القسم 3: سياسات Storage لـ radio-playlists (ملفات M3U)
-- =============================================================================

-- قراءة عامة (Liquidsoap والوصول لـ playlist.m3u و scheduled_ads.m3u)
DROP POLICY IF EXISTS "radio-playlists: Public read" ON storage.objects;
CREATE POLICY "radio-playlists: Public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'radio-playlists');

-- رفع/تحديث من الخدمة (Cron و API بمفتاح service_role)
DROP POLICY IF EXISTS "radio-playlists: Service upload" ON storage.objects;
CREATE POLICY "radio-playlists: Service upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'radio-playlists' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "radio-playlists: Service update" ON storage.objects;
CREATE POLICY "radio-playlists: Service update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'radio-playlists' AND auth.role() = 'service_role');

-- =============================================================================
-- القسم 4: الدالة update_updated_at_column (إن لم تكن موجودة)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- القسم 5: جداول البث العام (Always-On)
-- =============================================================================

CREATE TABLE IF NOT EXISTS radio_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('clip', 'music', 'ad', 'announcement')),
  file_url TEXT NOT NULL,
  file_duration_seconds INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES new_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radio_content_type ON radio_content(content_type);
CREATE INDEX IF NOT EXISTS idx_radio_content_active ON radio_content(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_radio_content_created_by ON radio_content(created_by);

COMMENT ON TABLE radio_content IS 'مكتبة المحتوى الصوتي (Clips, Music, Ads, Announcements)';

-- playlist_timeline
CREATE TABLE IF NOT EXISTS playlist_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES radio_content(id) ON DELETE CASCADE,
  play_order INTEGER NOT NULL,
  scheduled_time TIME,
  play_rule VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playlist_timeline_content_id ON playlist_timeline(content_id);
CREATE INDEX IF NOT EXISTS idx_playlist_timeline_play_order ON playlist_timeline(play_order);
CREATE INDEX IF NOT EXISTS idx_playlist_timeline_active ON playlist_timeline(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_playlist_timeline_scheduled_time ON playlist_timeline(scheduled_time);

-- playlist_logs
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

-- =============================================================================
-- القسم 6: Triggers لتحديث updated_at
-- =============================================================================

DROP TRIGGER IF EXISTS update_radio_content_updated_at ON radio_content;
CREATE TRIGGER update_radio_content_updated_at
BEFORE UPDATE ON radio_content
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_playlist_timeline_updated_at ON playlist_timeline;
CREATE TRIGGER update_playlist_timeline_updated_at
BEFORE UPDATE ON playlist_timeline
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- القسم 7: RLS على الجداول
-- =============================================================================

ALTER TABLE radio_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_logs ENABLE ROW LEVEL SECURITY;

-- radio_content
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

-- playlist_timeline
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

-- playlist_logs
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

-- =============================================================================
-- القسم 8: إضافة broadcast_mode إلى club_activities (إن وُجد الجدول)
-- =============================================================================

ALTER TABLE club_activities 
ADD COLUMN IF NOT EXISTS broadcast_mode VARCHAR(20) DEFAULT 'live_event' 
  CHECK (broadcast_mode IN ('live_event', 'always_on'));

ALTER TABLE club_activities 
ADD COLUMN IF NOT EXISTS playlist_engine_url TEXT;

ALTER TABLE club_activities 
ADD COLUMN IF NOT EXISTS auto_switch_enabled BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_club_activities_broadcast_mode ON club_activities(broadcast_mode);

-- =============================================================================
-- نهاية التنفيذ
-- =============================================================================
