-- =================================================================
-- Migration: Add monthly_waste_conversion_cap to club_settings
-- Description: إضافة السقف الشهري لتحويل نقاط المخلفات في الإعدادات
-- Date: 2025-01-21
-- =================================================================

-- =================================================================
-- إضافة السقف الشهري في club_settings
-- =================================================================

INSERT INTO club_settings (key, value, description) VALUES
('monthly_waste_conversion_cap', '{"points": 2000, "enabled": true}', 'السقف الشهري لتحويل نقاط المخلفات إلى نقاط النادي (2000 نقطة لكل مستخدم)')
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =================================================================
-- التحقق من وجود نسبة التحويل
-- =================================================================

INSERT INTO club_settings (key, value, description) VALUES
('waste_to_club_conversion', '{"rate": 0.3, "enabled": true}', 'نسبة تحويل نقاط المخلفات إلى نقاط النادي (30%)')
ON CONFLICT (key) DO NOTHING;

-- =================================================================
-- End of Migration
-- =================================================================
