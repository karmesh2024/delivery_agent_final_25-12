-- =================================================================
-- Migration: Visual Ads Schema
-- Description: إضافة دعم الإعلانات المرئية (صور وفيديوهات)
-- Date: 2025-01-26
-- =================================================================

-- =================================================================
-- 1. تعديل جدول radio_content لدعم المحتوى المرئي
-- =================================================================

-- إضافة عمود media_type لتحديد نوع الوسيطة
ALTER TABLE radio_content
ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'audio'
  CHECK (media_type IN ('audio', 'video', 'image'));

-- تحديث التعليقات
COMMENT ON COLUMN radio_content.media_type IS 'نوع الوسيطة: audio, video, image';
COMMENT ON COLUMN radio_content.file_duration_seconds IS 'مدة الملف بالثواني (للصوت والفيديو)';

-- =================================================================
-- 2. جدول visual_ads (إعلانات مرئية منفصلة)
-- =================================================================

CREATE TABLE IF NOT EXISTS visual_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
  file_url TEXT NOT NULL,
  file_duration_seconds INTEGER, -- للفيديو
  display_duration_seconds INTEGER DEFAULT 10, -- للصور (مدة العرض)
  thumbnail_url TEXT, -- للفيديو
  metadata JSONB DEFAULT '{}',
  -- Metadata مثال: {"tags": ["product"], "target_audience": ["premium"], "call_to_action": "Buy Now"}

  -- جدولة الإعلانات
  play_rule VARCHAR(50), -- 'every_30_minutes', 'hourly', 'daily', 'once', 'continuous'
  scheduled_time TIME, -- وقت محدد للعرض
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),

  -- إدارة
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES new_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_visual_ads_media_type ON visual_ads(media_type);
CREATE INDEX IF NOT EXISTS idx_visual_ads_active ON visual_ads(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_visual_ads_play_rule ON visual_ads(play_rule);
CREATE INDEX IF NOT EXISTS idx_visual_ads_scheduled_time ON visual_ads(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_visual_ads_created_by ON visual_ads(created_by);

-- تعليقات الجدول والأعمدة
COMMENT ON TABLE visual_ads IS 'إعلانات مرئية (صور وفيديوهات) منفصلة عن المحتوى الصوتي';
COMMENT ON COLUMN visual_ads.media_type IS 'نوع الإعلان: image أو video';
COMMENT ON COLUMN visual_ads.file_duration_seconds IS 'مدة الفيديو بالثواني (null للصور)';
COMMENT ON COLUMN visual_ads.display_duration_seconds IS 'مدة عرض الصورة بالثواني (10 ثانية افتراضياً)';
COMMENT ON COLUMN visual_ads.thumbnail_url IS 'رابط الصورة المصغرة للفيديو';
COMMENT ON COLUMN visual_ads.play_rule IS 'قاعدة العرض: every_30_minutes, hourly, daily, once, continuous';
COMMENT ON COLUMN visual_ads.scheduled_time IS 'وقت محدد للعرض (مثل 10:00:00)';

-- =================================================================
-- 3. جدول visual_ad_logs (سجلات عرض الإعلانات المرئية)
-- =================================================================

CREATE TABLE IF NOT EXISTS visual_ad_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visual_ad_id UUID REFERENCES visual_ads(id) ON DELETE SET NULL,
  displayed_at TIMESTAMPTZ DEFAULT NOW(),
  display_duration_seconds INTEGER,
  user_agent TEXT,
  device_info JSONB,
  location_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_visual_ad_logs_visual_ad_id ON visual_ad_logs(visual_ad_id);
CREATE INDEX IF NOT EXISTS idx_visual_ad_logs_displayed_at ON visual_ad_logs(displayed_at DESC);

COMMENT ON TABLE visual_ad_logs IS 'سجلات عرض الإعلانات المرئية';
COMMENT ON COLUMN visual_ad_logs.display_duration_seconds IS 'مدة العرض الفعلية';
COMMENT ON COLUMN visual_ad_logs.device_info IS 'معلومات الجهاز (مثل: OS, browser)';
COMMENT ON COLUMN visual_ad_logs.location_data IS 'بيانات الموقع الجغرافي';

-- =================================================================
-- 4. جدول user_visual_ad_interactions (تفاعلات المستخدمين)
-- =================================================================

CREATE TABLE IF NOT EXISTS user_visual_ad_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visual_ad_id UUID REFERENCES visual_ads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES new_profiles(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('view', 'click', 'skip', 'like', 'share')),
  interaction_data JSONB DEFAULT '{}',
  -- interaction_data مثال: {"click_position": {"x": 100, "y": 200}, "time_spent": 5}

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_user_visual_ad_interactions_visual_ad_id ON user_visual_ad_interactions(visual_ad_id);
CREATE INDEX IF NOT EXISTS idx_user_visual_ad_interactions_user_id ON user_visual_ad_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_visual_ad_interactions_type ON user_visual_ad_interactions(interaction_type);

COMMENT ON TABLE user_visual_ad_interactions IS 'تفاعلات المستخدمين مع الإعلانات المرئية';
COMMENT ON COLUMN user_visual_ad_interactions.interaction_type IS 'نوع التفاعل: view, click, skip, like, share';

-- =================================================================
-- 5. Triggers لتحديث updated_at
-- =================================================================

-- Trigger لـ visual_ads
DROP TRIGGER IF EXISTS update_visual_ads_updated_at ON visual_ads;
CREATE TRIGGER update_visual_ads_updated_at
BEFORE UPDATE ON visual_ads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- 6. RLS Policies
-- =================================================================

-- تفعيل RLS
ALTER TABLE visual_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_ad_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_visual_ad_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies للـ visual_ads
DROP POLICY IF EXISTS "Everyone can read active visual ads" ON visual_ads;
CREATE POLICY "Everyone can read active visual ads"
ON visual_ads FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage visual ads" ON visual_ads;
CREATE POLICY "Admins can manage visual ads"
ON visual_ads FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- RLS Policies للـ visual_ad_logs
DROP POLICY IF EXISTS "Admins can read visual ad logs" ON visual_ad_logs;
CREATE POLICY "Admins can read visual ad logs"
ON visual_ad_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

DROP POLICY IF EXISTS "Service role can insert visual ad logs" ON visual_ad_logs;
CREATE POLICY "Service role can insert visual ad logs"
ON visual_ad_logs FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- RLS Policies للـ user_visual_ad_interactions
DROP POLICY IF EXISTS "Users can read their own interactions" ON user_visual_ad_interactions;
CREATE POLICY "Users can read their own interactions"
ON user_visual_ad_interactions FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own interactions" ON user_visual_ad_interactions;
CREATE POLICY "Users can insert their own interactions"
ON user_visual_ad_interactions FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all interactions" ON user_visual_ad_interactions;
CREATE POLICY "Admins can read all interactions"
ON user_visual_ad_interactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- =================================================================
-- 7. Storage Bucket للإعلانات المرئية
-- =================================================================

-- إنشاء bucket منفصل للإعلانات المرئية
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visual-ads',
  'visual-ads',
  true,
  100000000, -- 100MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/quicktime',
    'video/webm'
  ]
) ON CONFLICT (id) DO NOTHING;

-- RLS Policies للـ Storage
DROP POLICY IF EXISTS "Everyone can read visual ads" ON storage.objects;
CREATE POLICY "Everyone can read visual ads"
ON storage.objects FOR SELECT
USING (bucket_id = 'visual-ads');

DROP POLICY IF EXISTS "Admins can manage visual ads" ON storage.objects;
CREATE POLICY "Admins can manage visual ads"
ON storage.objects FOR ALL
USING (
  bucket_id = 'visual-ads' AND
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- =================================================================
-- 8. Functions مفيدة
-- =================================================================

-- Function للحصول على الإعلانات المرئية المجدولة لوقت محدد
CREATE OR REPLACE FUNCTION get_scheduled_visual_ads(target_time TIME DEFAULT CURRENT_TIME)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  media_type VARCHAR(10),
  file_url TEXT,
  display_duration_seconds INTEGER,
  play_rule VARCHAR(50),
  priority VARCHAR(20)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    va.id,
    va.title,
    va.media_type,
    va.file_url,
    CASE
      WHEN va.media_type = 'video' THEN va.file_duration_seconds
      ELSE va.display_duration_seconds
    END as display_duration_seconds,
    va.play_rule,
    va.priority
  FROM visual_ads va
  WHERE va.is_active = true
  AND (
    -- إعلانات مستمرة
    va.play_rule = 'continuous'
    OR
    -- إعلانات مجدولة حسب القاعدة
    CASE
      WHEN va.play_rule = 'every_30_minutes' THEN
        EXTRACT(MINUTE FROM target_time::TIME) IN (0, 30)
      WHEN va.play_rule = 'hourly' THEN
        EXTRACT(MINUTE FROM target_time::TIME) = 0
      WHEN va.play_rule = 'daily' THEN
        va.scheduled_time = target_time
      WHEN va.play_rule = 'once' THEN
        va.scheduled_time = target_time
      ELSE false
    END
  )
  ORDER BY
    CASE va.priority
      WHEN 'high' THEN 3
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 1
    END DESC,
    va.created_at ASC;
END;
$$;

-- Function لحساب إحصائيات الإعلانات المرئية
CREATE OR REPLACE FUNCTION get_visual_ads_stats(
  start_date TIMESTAMPTZ DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT CURRENT_DATE + INTERVAL '1 day'
)
RETURNS TABLE (
  visual_ad_id UUID,
  title VARCHAR(255),
  total_views BIGINT,
  total_clicks BIGINT,
  avg_display_duration NUMERIC,
  unique_users BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    va.id as visual_ad_id,
    va.title,
    COUNT(DISTINCT CASE WHEN ual.id IS NOT NULL THEN ual.id END) as total_views,
    COUNT(DISTINCT CASE WHEN uai.interaction_type = 'click' THEN uai.id END) as total_clicks,
    ROUND(AVG(ual.display_duration_seconds), 2) as avg_display_duration,
    COUNT(DISTINCT CASE WHEN ual.id IS NOT NULL THEN ual.user_id END) as unique_users
  FROM visual_ads va
  LEFT JOIN visual_ad_logs ual ON va.id = ual.visual_ad_id
    AND ual.displayed_at BETWEEN start_date AND end_date
  LEFT JOIN user_visual_ad_interactions uai ON va.id = uai.visual_ad_id
    AND uai.created_at BETWEEN start_date AND end_date
  WHERE va.is_active = true
  GROUP BY va.id, va.title
  ORDER BY total_views DESC;
END;
$$;

-- =================================================================
-- End of Migration
-- =================================================================