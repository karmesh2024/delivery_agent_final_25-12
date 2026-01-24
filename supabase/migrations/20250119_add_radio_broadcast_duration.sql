-- Add planned broadcast duration to club_activities (radio streams)
-- Allows admin to set a duration (minutes) when starting a new stream.

ALTER TABLE public.club_activities
ADD COLUMN IF NOT EXISTS planned_duration_minutes INTEGER;

COMMENT ON COLUMN public.club_activities.planned_duration_minutes
IS 'المدة المخططة للبث بالدقائق (للراديو) - تستخدم للإيقاف التلقائي من لوحة التحكم';

