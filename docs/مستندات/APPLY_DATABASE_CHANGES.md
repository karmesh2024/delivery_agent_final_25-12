# تعليمات تطبيق تغييرات قاعدة البيانات

## الخطوات المطلوبة لتطبيق نظام المحافظات والصلاحيات المؤقتة

### 1. تطبيق ملف SQL الرئيسي

```bash
# تشغيل ملف SQL لإنشاء الجداول والدوال
psql -d your_database_name -f create_provinces_system.sql
```

### 2. التحقق من تطبيق الجداول

```sql
-- التحقق من إنشاء الجداول الجديدة
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'provinces', 'regions', 'cities', 
  'temporary_permissions', 'permission_requests', 
  'approvals', 'approval_workflows', 
  'activity_logs', 'advanced_notifications'
);
```

### 3. التحقق من تطبيق الدوال

```sql
-- التحقق من إنشاء الدوال المساعدة
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'get_admin_permissions',
  'check_permission', 
  'create_permission_request',
  'approve_request',
  'reject_request',
  'cleanup_expired_permissions'
);
```

### 4. التحقق من البيانات الأولية

```sql
-- التحقق من وجود المحافظات السعودية
SELECT COUNT(*) as provinces_count FROM provinces;
-- يجب أن يكون الناتج: 13

-- التحقق من وجود الصلاحيات الجديدة
SELECT COUNT(*) as permissions_count 
FROM permissions 
WHERE group_name IN ('locations', 'permissions', 'workflows', 'notifications');
-- يجب أن يكون الناتج: 8
```

### 5. إعداد سير العمل للموافقات (اختياري)

```sql
-- إعداد سير عمل أساسي للموافقات
-- استبدل role_ids بالأدوار الفعلية في نظامك

-- للموافقة على صلاحيات المحافظات (مستوى 1)
INSERT INTO public.approval_workflows (permission_code, scope_type, level, approver_role_id, is_required) 
SELECT 
  'permissions:grant_temporary',
  'province',
  1,
  r.id,
  true
FROM roles r 
WHERE r.level >= 3 
LIMIT 1;

-- للموافقة على الصلاحيات العامة (مستوى 1)
INSERT INTO public.approval_workflows (permission_code, scope_type, level, approver_role_id, is_required) 
SELECT 
  'permissions:grant_temporary',
  'global',
  1,
  r.id,
  true
FROM roles r 
WHERE r.level >= 5 
LIMIT 1;
```

### 6. اختبار النظام

```sql
-- اختبار دالة التحقق من الصلاحيات
SELECT check_permission(
  'your-admin-uuid',
  'provinces:manage',
  'global',
  NULL
);

-- اختبار دالة إنشاء طلب صلاحية
SELECT create_permission_request(
  'your-admin-uuid',
  'permissions:grant_temporary',
  'province',
  'your-province-uuid',
  'اختبار النظام',
  'medium'
);
```

### 7. إعداد المهام المجدولة (اختياري)

```sql
-- إعداد مهمة تنظيف الصلاحيات المنتهية (كل يوم في الساعة 2 صباحاً)
-- يتطلب تثبيت pg_cron extension

-- تفعيل pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- إعداد المهمة
SELECT cron.schedule(
  'cleanup-expired-permissions',
  '0 2 * * *',
  'SELECT cleanup_expired_permissions();'
);
```

### 8. النسخ الاحتياطي

```bash
# إنشاء نسخة احتياطية من الجداول الجديدة
pg_dump -d your_database_name \
  -t provinces \
  -t regions \
  -t cities \
  -t temporary_permissions \
  -t permission_requests \
  -t approvals \
  -t approval_workflows \
  -t activity_logs \
  -t advanced_notifications \
  > provinces_system_backup.sql
```

## استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ في الصلاحيات**: تأكد من أن المستخدم لديه صلاحية إنشاء الجداول
2. **خطأ في RLS**: تحقق من تطبيق سياسات الأمان بشكل صحيح
3. **خطأ في الدوال**: تأكد من تطبيق جميع الدوال بدون أخطاء

### سجلات الأخطاء:

```sql
-- عرض الأخطاء الأخيرة من PostgreSQL logs
SELECT * FROM pg_stat_activity 
WHERE state = 'active' 
AND query LIKE '%error%';

-- التحقق من حالة RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN (
  'provinces', 'regions', 'cities', 
  'temporary_permissions', 'permission_requests'
);
```

## التحقق النهائي

بعد تطبيق جميع التغييرات، تأكد من:

1. ✅ جميع الجداول تم إنشاؤها بنجاح
2. ✅ جميع الدوال تعمل بشكل صحيح
3. ✅ البيانات الأولية موجودة
4. ✅ RLS policies مطبقة
5. ✅ النظام يعمل بدون أخطاء

## الدعم

في حالة وجود مشاكل:

1. راجع سجلات PostgreSQL
2. تحقق من صلاحيات المستخدم
3. تأكد من تطبيق جميع الخطوات بالترتيب
4. راجع ملف README الشامل للمزيد من التفاصيل

---

**تم إعداد هذا الدليل لضمان تطبيق النظام بنجاح**  
**آخر تحديث: يناير 2024**

