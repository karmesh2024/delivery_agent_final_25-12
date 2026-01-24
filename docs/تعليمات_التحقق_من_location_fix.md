# تعليمات التحقق من تطبيق إصلاح location

**تاريخ:** 2025-01-21

---

## 🎯 الهدف

التحقق من أن migration `20250121_check_and_apply_location_fix.sql` تم تطبيقه بنجاح وأن:
1. ✅ حقل `location` موجود في جدول `radio_listeners`
2. ✅ دالة `get_active_radio_listeners` محدثة وتستخدم `location JSONB`
3. ✅ الصلاحيات منحت بشكل صحيح

---

## 📋 طريقة التحقق

### الطريقة 1: استخدام ملف التحقق الشامل (موصى به)

1. **افتح Supabase Dashboard**
2. **اذهب إلى SQL Editor**
3. **افتح الملف:** `supabase/migrations/20250121_verify_location_fix.sql`
4. **انسخ المحتوى كاملاً**
5. **الصقه في SQL Editor**
6. **اضغط Run**

ستحصل على تقرير شامل بجميع النتائج.

---

### الطريقة 2: التحقق اليدوي خطوة بخطوة

#### 1. التحقق من حقل location

```sql
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'radio_listeners' 
  AND column_name = 'location';
```

**النتيجة المتوقعة:**
```
column_name | data_type | is_nullable
location    | jsonb     | YES
```

#### 2. التحقق من الدالة

```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name = 'get_active_radio_listeners';
```

**النتيجة المتوقعة:**
```
routine_name                | routine_type
get_active_radio_listeners   | FUNCTION
```

#### 3. التحقق من تعريف الدالة

```sql
SELECT 
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_active_radio_listeners';
```

**التحقق من:**
- يجب أن يحتوي على `location JSONB` في `RETURNS TABLE`
- يجب أن يحتوي على `location` في `SELECT` statement

#### 4. التحقق من الصلاحيات

```sql
SELECT 
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'get_active_radio_listeners';
```

**النتيجة المتوقعة:**
```
grantee        | privilege_type
authenticated  | EXECUTE
anon           | EXECUTE
```

---

## ✅ قائمة التحقق النهائية

بعد تشغيل ملف التحقق، تأكد من:

- [ ] ✅ حقل `location` موجود بنوع `JSONB`
- [ ] ✅ دالة `get_active_radio_listeners` موجودة
- [ ] ✅ الدالة تستخدم `location JSONB` في `RETURNS TABLE`
- [ ] ✅ الدالة تستخدم `location` في `SELECT` statement
- [ ] ✅ الصلاحيات منحت لـ `authenticated` و `anon`

---

## 🔧 إذا ظهرت مشاكل

### المشكلة: حقل location غير موجود

**الحل:**
```sql
ALTER TABLE radio_listeners
ADD COLUMN IF NOT EXISTS location JSONB;

COMMENT ON COLUMN radio_listeners.location IS 'الموقع الجغرافي للمستمع (GPS/District) - اختياري';
```

### المشكلة: الدالة غير موجودة أو لا تستخدم location

**الحل:** طبق migration مرة أخرى:
- استخدم: `supabase/migrations/20250121_check_and_apply_location_fix.sql`

### المشكلة: الصلاحيات غير موجودة

**الحل:**
```sql
GRANT EXECUTE ON FUNCTION get_active_radio_listeners(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_radio_listeners(UUID) TO anon;
```

---

## 📊 مثال على النتائج المتوقعة

عند تشغيل ملف التحقق، يجب أن ترى:

```
check_name                                    | status        | data_type | ...
----------------------------------------------|---------------|-----------|----
1. التحقق من حقل location                    | ✅ موجود     | jsonb     | ...
2. التحقق من دالة get_active_radio_listeners | ✅ موجودة    | FUNCTION  | ...
3. التحقق من استخدام location في الدالة     | ✅ تستخدم    | ...       | ...
4. تعريف الدالة                              | (تعريف كامل) | ...       | ...
5. التحقق من الصلاحيات                       | authenticated | EXECUTE   | ...
5. التحقق من الصلاحيات                       | anon          | EXECUTE   | ...
ملخص التحقق                                  | ✅ حقل موجود | ✅ دالة موجودة | 2 | ✅ الصلاحيات موجودة
```

---

**ملاحظة:** إذا كنت تستخدم MCP Supabase، يمكنك تشغيل ملف التحقق مباشرة من خلاله.

---

**آخر تحديث:** 2025-01-21
