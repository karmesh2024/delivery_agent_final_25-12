-- =================================================================
-- Migration: Add location field to radio_listeners
-- Description: إضافة حقل location لتتبع موقع المستمعين (اختياري)
-- Date: 2025-01-21
-- =================================================================

-- =================================================================
-- إضافة حقل location JSONB
-- =================================================================
-- يمكن استخدام JSONB لتخزين الموقع بشكل مرن:
-- {"latitude": 31.2000, "longitude": 29.9000, "city": "الإسكندرية", "district": "سيدي بشر"}
-- =================================================================

ALTER TABLE radio_listeners
ADD COLUMN IF NOT EXISTS location JSONB;

COMMENT ON COLUMN radio_listeners.location IS 'الموقع الجغرافي للمستمع (GPS/District) - اختياري';

-- =================================================================
-- ملاحظة: RPC function get_active_radio_listeners تستخدم حقول منفصلة
-- =================================================================
-- إذا كنت تريد استخدام الحقول المنفصلة بدلاً من JSONB،
-- يمكنك إضافة هذه الحقول:
-- 
-- ALTER TABLE radio_listeners
-- ADD COLUMN IF NOT EXISTS current_latitude DOUBLE PRECISION,
-- ADD COLUMN IF NOT EXISTS current_longitude DOUBLE PRECISION,
-- ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ,
-- ADD COLUMN IF NOT EXISTS location_source VARCHAR(50),
-- ADD COLUMN IF NOT EXISTS location_accuracy DOUBLE PRECISION;
-- 
-- ثم تعديل RPC function get_active_radio_listeners لاستخدام location JSONB
-- أو إضافة الحقول المذكورة أعلاه
-- =================================================================

-- =================================================================
-- End of Migration
-- =================================================================
