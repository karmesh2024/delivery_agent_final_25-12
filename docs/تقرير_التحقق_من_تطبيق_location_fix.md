# تقرير التحقق من تطبيق إصلاح location

**تاريخ التحقق:** 2025-01-21  
**Migration المطبق:** `20250121_check_and_apply_location_fix.sql`

---

## ✅ خطوات التحقق

### 1. التحقق من حقل location

قم بتشغيل هذا الاستعلام في Supabase Dashboard > SQL Editor:

```sql
-- التحقق من وجود حقل location
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'radio_listeners' 
  AND column_name = 'location';
```

**النتيجة المتوقعة:**
```
column_name | data_type | is_nullable | column_default
location    | jsonb     | YES         | NULL
```

### 2. التحقق من دالة get_active_radio_listeners

```sql
-- التحقق من وجود الدالة
SELECT 
  routine_name,
  routine_type,
  data_type AS return_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name = 'get_active_radio_listeners';
```

**النتيجة المتوقعة:**
```
routine_name                | routine_type | return_type
get_active_radio_listeners   | FUNCTION    | TABLE
```

### 3. التحقق من أن الدالة تستخدم location JSONB

```sql
-- عرض تعريف الدالة
SELECT 
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_active_radio_listeners';
```

**التحقق:**
- يجب أن يحتوي التعريف على `location JSONB` في `RETURNS TABLE`
- يجب أن يحتوي على `location` في `SELECT` statement

### 4. التحقق من الصلاحيات

```sql
-- التحقق من الصلاحيات
SELECT 
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'get_active_radio_listeners'
ORDER BY grantee;
```

**النتيجة المتوقعة:**
```
grantee        | privilege_type
authenticated  | EXECUTE
anon           | EXECUTE
```

### 5. اختبار الدالة (اختياري)

```sql
-- اختبار الدالة (استبدل activity_id بقيمة حقيقية)
-- ملاحظة: قد لا تعمل إذا لم يكن هناك نشاطات نشطة
SELECT * FROM get_active_radio_listeners('activity-id-here'::UUID);
```

---

## 📋 ملف التحقق الشامل

تم إنشاء ملف SQL شامل للتحقق:

**الملف:** `supabase/migrations/20250121_verify_location_fix.sql`

يمكنك تشغيله في Supabase Dashboard > SQL Editor للحصول على تقرير شامل.

---

## ✅ قائمة التحقق

- [ ] حقل `location` موجود في `radio_listeners` بنوع `JSONB`
- [ ] دالة `get_active_radio_listeners` موجودة
- [ ] الدالة تستخدم `location JSONB` في `RETURNS TABLE`
- [ ] الدالة تستخدم `location` في `SELECT` statement
- [ ] الصلاحيات منحت لـ `authenticated` و `anon`
- [ ] الدالة تعمل بدون أخطاء (اختبار اختياري)

---

## 🔍 إذا ظهرت مشاكل

### المشكلة: حقل location غير موجود

**الحل:**
```sql
ALTER TABLE radio_listeners
ADD COLUMN IF NOT EXISTS location JSONB;
```

### المشكلة: الدالة غير موجودة أو لا تستخدم location

**الحل:** طبق migration مرة أخرى:
```sql
-- انسخ محتوى: supabase/migrations/20250121_check_and_apply_location_fix.sql
```

### المشكلة: الصلاحيات غير موجودة

**الحل:**
```sql
GRANT EXECUTE ON FUNCTION get_active_radio_listeners(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_radio_listeners(UUID) TO anon;
```

---

**آخر تحديث:** 2025-01-21
