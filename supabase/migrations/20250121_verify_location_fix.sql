-- =================================================================
-- Verification Script: Check location column and function
-- Description: التحقق من تطبيق إصلاح حقل location
-- Date: 2025-01-21
-- =================================================================
-- استخدم هذا الملف في Supabase Dashboard > SQL Editor للتحقق
-- =================================================================

-- =================================================================
-- 1. التحقق من وجود حقل location في radio_listeners
-- =================================================================

SELECT 
  '1. التحقق من حقل location' AS check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
        AND table_name = 'radio_listeners' 
        AND column_name = 'location'
    ) THEN '✅ موجود'
    ELSE '❌ غير موجود'
  END AS status,
  COALESCE(
    (SELECT data_type 
     FROM information_schema.columns 
     WHERE table_schema = 'public'
       AND table_name = 'radio_listeners' 
       AND column_name = 'location'),
    'N/A'
  ) AS data_type,
  COALESCE(
    (SELECT is_nullable 
     FROM information_schema.columns 
     WHERE table_schema = 'public'
       AND table_name = 'radio_listeners' 
       AND column_name = 'location'),
    'N/A'
  ) AS is_nullable;

-- =================================================================
-- 2. التحقق من وجود دالة get_active_radio_listeners
-- =================================================================

SELECT 
  '2. التحقق من دالة get_active_radio_listeners' AS check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
        AND routine_name = 'get_active_radio_listeners'
    ) THEN '✅ موجودة'
    ELSE '❌ غير موجودة'
  END AS status,
  COALESCE(
    (SELECT routine_type 
     FROM information_schema.routines 
     WHERE routine_schema = 'public'
       AND routine_name = 'get_active_radio_listeners'),
    'N/A'
  ) AS routine_type;

-- =================================================================
-- 3. التحقق من أن الدالة تستخدم location JSONB
-- =================================================================

SELECT 
  '3. التحقق من استخدام location في الدالة' AS check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = 'get_active_radio_listeners'
        AND pg_get_functiondef(p.oid)::text LIKE '%location%'
    ) THEN '✅ تستخدم location'
    ELSE '❌ لا تستخدم location'
  END AS status;

-- =================================================================
-- 4. عرض تعريف الدالة (للتحقق)
-- =================================================================

SELECT 
  '4. تعريف الدالة' AS check_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_active_radio_listeners'
LIMIT 1;

-- =================================================================
-- 5. التحقق من الصلاحيات
-- =================================================================

SELECT 
  '5. التحقق من الصلاحيات' AS check_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'get_active_radio_listeners'
ORDER BY grantee;

-- =================================================================
-- 6. ملخص شامل
-- =================================================================

SELECT 
  'ملخص التحقق' AS summary,
  CASE 
    WHEN (SELECT COUNT(*) 
          FROM information_schema.columns 
          WHERE table_schema = 'public'
            AND table_name = 'radio_listeners' 
            AND column_name = 'location') > 0 
    THEN '✅ حقل location موجود'
    ELSE '❌ حقل location غير موجود'
  END AS location_status,
  CASE 
    WHEN (SELECT COUNT(*) 
          FROM information_schema.routines 
          WHERE routine_schema = 'public'
            AND routine_name = 'get_active_radio_listeners') > 0 
    THEN '✅ الدالة موجودة'
    ELSE '❌ الدالة غير موجودة'
  END AS function_status,
  (SELECT COUNT(*) 
   FROM information_schema.routine_privileges
   WHERE routine_schema = 'public'
     AND routine_name = 'get_active_radio_listeners'
     AND grantee IN ('authenticated', 'anon')) AS permissions_count,
  CASE 
    WHEN (SELECT COUNT(*) 
          FROM information_schema.routine_privileges
          WHERE routine_schema = 'public'
            AND routine_name = 'get_active_radio_listeners'
            AND grantee IN ('authenticated', 'anon')) >= 2 
    THEN '✅ الصلاحيات موجودة'
    ELSE '⚠️ الصلاحيات غير كاملة'
  END AS permissions_status;

-- =================================================================
-- 7. التحقق من أن الدالة تستخدم location في SELECT
-- =================================================================

SELECT 
  '7. التحقق من استخدام location في SELECT' AS check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = 'get_active_radio_listeners'
        AND pg_get_functiondef(p.oid)::text LIKE '%SELECT%location%'
    ) THEN '✅ تستخدم location في SELECT'
    ELSE '❌ لا تستخدم location في SELECT'
  END AS status;

-- =================================================================
-- 8. التحقق من أن الدالة تستخدم location في RETURNS TABLE
-- =================================================================

SELECT 
  '8. التحقق من استخدام location في RETURNS' AS check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = 'get_active_radio_listeners'
        AND pg_get_functiondef(p.oid)::text LIKE '%location JSONB%'
    ) THEN '✅ تستخدم location JSONB في RETURNS'
    ELSE '❌ لا تستخدم location JSONB في RETURNS'
  END AS status;
