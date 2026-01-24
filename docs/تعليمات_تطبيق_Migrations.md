# تعليمات تطبيق Migrations على قاعدة البيانات

**تاريخ الإنشاء:** 2025-01-21  
**الهدف:** تطبيق جميع التعديلات المفقودة على قاعدة البيانات

---

## 📋 نظرة عامة

تم إنشاء migrations لتطبيق جميع التعديلات المفقودة:

1. ✅ إضافة حقل `location` في `radio_listeners`
2. ✅ إضافة السقف الشهري في `club_settings`
3. ✅ إصلاح RPC function `get_active_radio_listeners`
4. ✅ إضافة دالة `stop_user_listening_session_and_award`
5. ✅ إضافة دالة `redeem_club_reward`
6. ✅ إضافة دالة `process_recycling_conversion_request`

---

## 🚀 الطريقة الموصى بها: استخدام الملف الموحد

### الخطوة 1: فتح Supabase Dashboard

1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اختر المشروع الخاص بك
3. اذهب إلى **SQL Editor** من القائمة الجانبية

### الخطوة 2: تطبيق الملف الموحد

1. افتح الملف: `supabase/migrations/20250121_apply_all_missing_changes.sql`
2. انسخ **جميع** محتوى الملف
3. الصقه في SQL Editor في Supabase Dashboard
4. اضغط **Run** أو **Execute**

### الخطوة 3: التحقق من النجاح

يجب أن ترى رسالة نجاح. إذا ظهرت أخطاء، راجعها بعناية.

---

## 📝 الطريقة البديلة: تطبيق Migrations منفصلة

إذا كنت تفضل تطبيق migrations منفصلة، يمكنك تطبيقها بالترتيب التالي:

### 1. إضافة حقل location
```sql
-- ملف: 20250121_add_location_to_radio_listeners.sql
ALTER TABLE radio_listeners
ADD COLUMN IF NOT EXISTS location JSONB;
```

### 2. إضافة الإعدادات
```sql
-- ملف: 20250121_add_monthly_cap_to_settings.sql
INSERT INTO club_settings (key, value, description) VALUES
('monthly_waste_conversion_cap', '{"points": 2000, "enabled": true}', 'السقف الشهري لتحويل نقاط المخلفات إلى نقاط النادي (2000 نقطة لكل مستخدم)')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = NOW();

INSERT INTO club_settings (key, value, description) VALUES
('waste_to_club_conversion', '{"rate": 0.3, "enabled": true}', 'نسبة تحويل نقاط المخلفات إلى نقاط النادي (30%)')
ON CONFLICT (key) DO NOTHING;
```

### 3. إصلاح RPC function
```sql
-- ملف: 20250121_fix_get_active_radio_listeners_to_use_location_jsonb.sql
-- (انظر محتوى الملف الكامل)
```

### 4. إضافة الدوال RPC
```sql
-- ملف: 20250121_add_stop_listening_session_function.sql
-- ملف: 20250121_add_redeem_reward_function.sql
-- ملف: 20250121_add_process_conversion_request_function.sql
```

---

## ✅ التحقق من التطبيق

بعد تطبيق migrations، تحقق من:

### 1. التحقق من الحقول

```sql
-- التحقق من وجود حقل location
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'radio_listeners' 
AND column_name = 'location';
```

### 2. التحقق من الإعدادات

```sql
-- التحقق من الإعدادات
SELECT key, value, description 
FROM club_settings 
WHERE key IN ('monthly_waste_conversion_cap', 'waste_to_club_conversion');
```

### 3. التحقق من الدوال

```sql
-- التحقق من وجود الدوال
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'stop_user_listening_session_and_award',
  'redeem_club_reward',
  'process_recycling_conversion_request',
  'get_active_radio_listeners'
);
```

### 4. اختبار الدوال

```sql
-- اختبار get_active_radio_listeners (يجب أن تعمل بدون أخطاء)
SELECT * FROM get_active_radio_listeners('activity-id-here'::UUID);
```

---

## ⚠️ ملاحظات مهمة

1. **النسخ الاحتياطي:** قبل تطبيق migrations، تأكد من عمل نسخة احتياطية من قاعدة البيانات
2. **الترتيب:** إذا كنت تستخدم migrations منفصلة، طبقها بالترتيب الزمني
3. **الأخطاء:** إذا ظهرت أخطاء، راجعها بعناية. قد تكون بعض migrations مطبقة مسبقاً
4. **الاختبار:** بعد التطبيق، اختبر جميع الدوال للتأكد من عملها بشكل صحيح

---

## 📚 المراجع

- **الملف الموحد:** `supabase/migrations/20250121_apply_all_missing_changes.sql`
- **المستند الرئيسي:** `docs/دليل_النادي_والراديو_والنقاط_لتطبيق_الموبايل.md`
- **تقرير التحقق:** `docs/تقرير_التحقق_من_قاعدة_البيانات.md`

---

**آخر تحديث:** 2025-01-21
