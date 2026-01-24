-- =================================================================
-- Migration: Enable Realtime for radio_listeners
-- Description: تفعيل Realtime updates لجدول radio_listeners
-- Date: 2025-01-22
-- Version: V1.4
-- =================================================================

-- =================================================================
-- تفعيل Realtime لجدول radio_listeners
-- =================================================================
-- V1.4: تفعيل Realtime لتحديث duration_minutes و points_earned تلقائياً
-- =================================================================

-- تفعيل Realtime للجدول
ALTER PUBLICATION supabase_realtime ADD TABLE radio_listeners;

-- التأكد من أن REPLICA IDENTITY كامل (لإرسال البيانات الكاملة في التحديثات)
ALTER TABLE radio_listeners REPLICA IDENTITY FULL;

-- ملاحظة: إذا كان Realtime غير مفعل في Supabase Dashboard:
-- 1. اذهب إلى Database > Replication
-- 2. فعّل Realtime لجدول radio_listeners
-- 3. أو استخدم: ALTER TABLE radio_listeners REPLICA IDENTITY FULL;

-- =================================================================
-- End of Migration
-- =================================================================
