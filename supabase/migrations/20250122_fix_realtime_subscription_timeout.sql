-- =================================================================
-- Migration: Fix Real-time Subscription Timeout
-- Description: إصلاح مشكلة TIMED_OUT في Real-time subscriptions
-- Date: 2025-01-22
-- Version: V1.5.1
-- =================================================================

-- =================================================================
-- التحقق من تفعيل Real-time للجداول
-- =================================================================

-- 1. التحقق من أن radio_listeners في supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'radio_listeners'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE radio_listeners;
    RAISE NOTICE 'Added radio_listeners to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'radio_listeners already in supabase_realtime publication';
  END IF;
END $$;

-- 2. التحقق من أن club_activities في supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'club_activities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE club_activities;
    RAISE NOTICE 'Added club_activities to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'club_activities already in supabase_realtime publication';
  END IF;
END $$;

-- =================================================================
-- التأكد من REPLICA IDENTITY FULL
-- =================================================================

-- 3. التأكد من REPLICA IDENTITY FULL لـ radio_listeners
DO $$
BEGIN
  IF (SELECT relreplident FROM pg_class WHERE relname = 'radio_listeners') != 'f' THEN
    ALTER TABLE radio_listeners REPLICA IDENTITY FULL;
    RAISE NOTICE 'Set REPLICA IDENTITY FULL for radio_listeners';
  ELSE
    RAISE NOTICE 'radio_listeners already has REPLICA IDENTITY FULL';
  END IF;
END $$;

-- 4. التأكد من REPLICA IDENTITY FULL لـ club_activities
DO $$
BEGIN
  IF (SELECT relreplident FROM pg_class WHERE relname = 'club_activities') != 'f' THEN
    ALTER TABLE club_activities REPLICA IDENTITY FULL;
    RAISE NOTICE 'Set REPLICA IDENTITY FULL for club_activities';
  ELSE
    RAISE NOTICE 'club_activities already has REPLICA IDENTITY FULL';
  END IF;
END $$;

-- =================================================================
-- التحقق من حالة Real-time
-- =================================================================

-- 5. عرض حالة Real-time للجداول
SELECT 
  schemaname,
  tablename,
  CASE relreplident
    WHEN 'd' THEN 'DEFAULT'
    WHEN 'n' THEN 'NOTHING'
    WHEN 'f' THEN 'FULL'
    WHEN 'i' THEN 'INDEX'
  END as replica_identity,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = t.tablename
    ) THEN 'ENABLED'
    ELSE 'DISABLED'
  END as realtime_status
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN ('radio_listeners', 'club_activities')
ORDER BY t.tablename;

-- =================================================================
-- ملاحظات V1.5.1:
-- =================================================================
-- 1. TIMED_OUT يحدث عادة بسبب:
--    - Real-time غير مفعل في Supabase Dashboard
--    - REPLICA IDENTITY غير FULL
--    - مشاكل في الاتصال بالإنترنت
--    - Supabase Realtime service غير متاح مؤقتاً
-- 2. الحل:
--    - تطبيق هذا Migration
--    - التحقق من Supabase Dashboard > Database > Replication
--    - التأكد من تفعيل Real-time للجداول
-- 3. Fallback:
--    - Frontend يستخدم polling كل 5 ثواني كـ backup
--    - إعادة محاولة subscription عند TIMED_OUT
-- =================================================================

-- =================================================================
-- End of Migration
-- =================================================================
