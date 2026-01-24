-- =================================================================
-- Migration: Backfill Club Memberships for Existing Users
-- Description: إنشاء عضوية النادي للمستخدمين الحاليين
-- Date: 2025-01-02
-- =================================================================

-- إنشاء عضوية النادي لجميع المستخدمين الحاليين الذين ليس لديهم عضوية
INSERT INTO club_memberships (user_id, membership_level)
SELECT id, 'community' 
FROM new_profiles
WHERE id NOT IN (SELECT user_id FROM club_memberships WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- تعليق: هذه العملية ستنشئ club_membership تلقائياً لكل user
-- وستنشئ trigger آخر club_points_wallet تلقائياً

COMMENT ON TABLE club_memberships IS 'تم إنشاء عضوية لجميع المستخدمين الحاليين';
