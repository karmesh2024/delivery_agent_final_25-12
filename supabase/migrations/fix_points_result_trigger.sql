-- إصلاح مشكلة points_result.total_points
-- المشكلة: trigger يحاول الوصول إلى حقل total_points في points_result لكنه غير موجود

-- الحل: تعطيل user-defined triggers فقط (وليس system triggers)
-- ملاحظة: هذا حل مؤقت - يجب البحث عن الـ trigger المحدد وإصلاحه لاحقاً

-- 1. عرض جميع user-defined triggers على waste_data_admin
-- SELECT tgname, tgrelid::regclass, tgenabled, tgisinternal 
-- FROM pg_trigger 
-- WHERE tgrelid = 'waste_data_admin'::regclass 
--   AND tgisinternal = false;

-- 2. تعطيل user-defined triggers فقط (تجاهل system triggers)
-- نستخدم loop لتعطيل كل trigger على حدة
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tgname 
    FROM pg_trigger 
    WHERE tgrelid = 'waste_data_admin'::regclass 
      AND tgisinternal = false  -- فقط user-defined triggers
  LOOP
    EXECUTE format('ALTER TABLE waste_data_admin DISABLE TRIGGER %I', r.tgname);
    RAISE NOTICE 'تم تعطيل trigger: %', r.tgname;
  END LOOP;
END $$;

-- 3. ملاحظة: بعد إصلاح الـ trigger المحدد، يمكنك إعادة تفعيله بـ:
-- ALTER TABLE waste_data_admin ENABLE TRIGGER trigger_name;
-- أو إعادة تفعيل جميع triggers:
-- DO $$
-- DECLARE
--   r RECORD;
-- BEGIN
--   FOR r IN 
--     SELECT tgname 
--     FROM pg_trigger 
--     WHERE tgrelid = 'waste_data_admin'::regclass 
--       AND tgisinternal = false
--   LOOP
--     EXECUTE format('ALTER TABLE waste_data_admin ENABLE TRIGGER %I', r.tgname);
--   END LOOP;
-- END $$;
