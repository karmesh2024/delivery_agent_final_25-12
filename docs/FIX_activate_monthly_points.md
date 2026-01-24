# إصلاح مشكلة activate_monthly_points

## المشاكل المحتملة

### المشكلة 1: الدالة غير موجودة
```
❌ فشل اعتماد النقاط الشهرية: Could not find the function public.activate_monthly_points(...) in the schema cache
```

### المشكلة 2: الجدول غير موجود
```
❌ فشل اعتماد النقاط الشهرية: relation "monthly_points_settlement" does not exist
```

### المشكلة 3: دالة get_user_points_summary غير موجودة
```
❌ User may not have a points wallet: Could not find the function public.get_user_points_summary(p_user_id) in the schema cache
```

## السبب
- الدالة `activate_monthly_points` غير موجودة في قاعدة البيانات
- الجدول `monthly_points_settlement` غير موجود في قاعدة البيانات
- الدالة `get_user_points_summary` غير موجودة في قاعدة البيانات
- الدالة `check_monthly_settlement_due` غير موجودة في قاعدة البيانات
- Schema cache لم يتم تحديثه

## الحل

### الخطوة 1: تطبيق Migration

قم بتطبيق Migration التالي على قاعدة البيانات. هذا الملف يضمن:
- ✅ إنشاء جدول `monthly_points_settlement`
- ✅ إنشاء دالة `activate_monthly_points` (للاعتماد الشهري)
- ✅ إنشاء دالة `check_monthly_settlement_due` (للتحقق من الاعتماد)
- ✅ إنشاء دالة `get_user_points_summary` (لعرض ملخص النقاط)
- ✅ منح الصلاحيات المطلوبة

**في Supabase Dashboard:**
1. اذهب إلى `SQL Editor`
2. افتح الملف: `supabase/migrations/20250121_ensure_activate_monthly_points.sql`
3. انسخ **جميع** المحتوى والصقه في SQL Editor
4. اضغط `Run`

**أو من خلال CLI:**
```bash
supabase db push
```

### الخطوة 2: التحقق من الجداول والدوال

قم بتشغيل هذا SQL للتحقق:
```sql
-- التحقق من الجدول
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'monthly_points_settlement';

-- التحقق من جميع الدوال المطلوبة
SELECT 
  proname as function_name,
  pronargs as num_args,
  proargnames as arg_names
FROM pg_proc
WHERE proname IN ('activate_monthly_points', 'check_monthly_settlement_due', 'get_user_points_summary');
```

### الخطوة 3: Refresh Schema Cache (إذا لزم الأمر)

في Supabase Dashboard:
1. اذهب إلى `Settings` > `API`
2. اضغط على `Refresh Schema Cache` أو `Reload Schema`

### الخطوة 4: التحقق من الصلاحيات

تأكد من أن المستخدم لديه صلاحيات تنفيذ الدالة:
```sql
-- التحقق من الصلاحيات
SELECT 
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'activate_monthly_points';
```

إذا لم تكن موجودة، شغّل:
```sql
GRANT EXECUTE ON FUNCTION activate_monthly_points(VARCHAR, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION activate_monthly_points(VARCHAR, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION check_monthly_settlement_due() TO authenticated;
GRANT EXECUTE ON FUNCTION check_monthly_settlement_due() TO service_role;
GRANT EXECUTE ON FUNCTION get_user_points_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_points_summary(UUID) TO service_role;
```

## اختبار الدالة

بعد تطبيق Migration، اختبر الدالة:
```sql
-- احصل على user_id أولاً
SELECT id FROM new_profiles LIMIT 1;

-- استدعي الدالة (استبدل UUID و 'YYYY-MM' بقيم حقيقية)
SELECT activate_monthly_points(
  '2025-01',  -- settlement_month
  'YOUR_USER_ID_HERE'::UUID,  -- processed_by
  'اختبار الاعتماد الشهري'  -- notes
);
```

## ملاحظات

- تأكد من أن جدول `monthly_points_settlement` موجود
- تأكد من أن جدول `club_points_wallet` موجود
- تأكد من أن دالة `update_club_points_wallet` موجودة وتعمل

## إذا استمرت المشكلة

1. تحقق من أن Migration `20250120_v13_club_points_core.sql` تم تطبيقه
2. تحقق من وجود جميع الجداول والدوال المطلوبة
3. راجع console في المتصفح للرسائل التفصيلية
