# تعليمات تطبيق نظام المحافظات والصلاحيات المؤقتة

## الخطوات المطلوبة لتطبيق النظام

### 1. تطبيق قاعدة البيانات

```bash
# 1. تشغيل ملف SQL الرئيسي
psql -d your_database_name -f create_provinces_system.sql

# 2. التحقق من تطبيق الجداول
psql -d your_database_name -c "\dt" | grep -E "(provinces|regions|cities|temporary_permissions|permission_requests|approvals|approval_workflows|activity_logs|advanced_notifications)"
```

### 2. إعداد البيانات الأولية

```sql
-- التحقق من وجود المحافظات
SELECT COUNT(*) FROM provinces;

-- إذا لم تكن موجودة، قم بتشغيل:
-- (المحافظات موجودة بالفعل في ملف create_provinces_system.sql)
```

### 3. إعداد الصلاحيات

```sql
-- التحقق من وجود الصلاحيات الجديدة
SELECT * FROM permissions WHERE code IN (
  'provinces:manage',
  'regions:manage', 
  'cities:manage',
  'permissions:request',
  'permissions:approve',
  'permissions:grant_temporary',
  'workflows:manage',
  'notifications:manage'
);

-- إذا لم تكن موجودة، قم بتشغيل:
INSERT INTO public.permissions (code, name, description, group_name) VALUES
('provinces:manage', 'إدارة المحافظات', 'إدارة المحافظات والمناطق', 'locations'),
('regions:manage', 'إدارة المناطق', 'إدارة المناطق داخل المحافظات', 'locations'),
('cities:manage', 'إدارة المدن', 'إدارة المدن داخل المناطق', 'locations'),
('permissions:request', 'طلب صلاحيات', 'طلب صلاحيات مؤقتة', 'permissions'),
('permissions:approve', 'الموافقة على الصلاحيات', 'الموافقة على طلبات الصلاحيات', 'permissions'),
('permissions:grant_temporary', 'منح صلاحيات مؤقتة', 'منح صلاحيات مؤقتة للمديرين', 'permissions'),
('workflows:manage', 'إدارة سير العمل', 'إدارة سير عمل الموافقات', 'workflows'),
('notifications:manage', 'إدارة الإشعارات', 'إدارة الإشعارات والتنبيهات', 'notifications');
```

### 4. إعداد سير العمل للموافقات

```sql
-- إعداد سير عمل أساسي للموافقات
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

### 5. إعداد الملفات في المشروع

```bash
# 1. إنشاء مجلد المكونات
mkdir -p src/components/provinces

# 2. إنشاء مجلد API
mkdir -p src/lib/api

# 3. إنشاء صفحة النظام
mkdir -p src/app/admin/provinces
```

### 6. إضافة الصفحة إلى القائمة الجانبية

```typescript
// في ملف القائمة الجانبية، أضف:
{
  title: "المحافظات والصلاحيات",
  href: "/admin/provinces",
  icon: MapPin,
  children: [
    {
      title: "المحافظات والمناطق",
      href: "/admin/provinces?tab=provinces",
    },
    {
      title: "الصلاحيات المؤقتة", 
      href: "/admin/provinces?tab=permissions",
    },
    {
      title: "طلبات الصلاحيات",
      href: "/admin/provinces?tab=requests",
    },
    {
      title: "الإشعارات",
      href: "/admin/provinces?tab=notifications",
    }
  ]
}
```

### 7. إعداد متغيرات البيئة

```bash
# تأكد من وجود متغيرات Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 8. اختبار النظام

```bash
# 1. تشغيل المشروع
npm run dev

# 2. الانتقال إلى الصفحة
http://localhost:3000/admin/provinces

# 3. اختبار الوظائف:
# - إضافة محافظة جديدة
# - إضافة منطقة جديدة
# - إضافة مدينة جديدة
# - طلب صلاحية مؤقتة
# - منح صلاحية مؤقتة
# - مراجعة طلبات الصلاحيات
```

### 9. إعداد المهام المجدولة (اختياري)

```sql
-- إعداد مهمة تنظيف الصلاحيات المنتهية (كل يوم في الساعة 2 صباحاً)
-- يمكن استخدام pg_cron أو cron job خارجي

-- مثال باستخدام pg_cron:
SELECT cron.schedule('cleanup-expired-permissions', '0 2 * * *', 'SELECT cleanup_expired_permissions();');
```

### 10. إعداد النسخ الاحتياطي

```bash
# إضافة الجداول الجديدة إلى النسخ الاحتياطي
pg_dump -d your_database_name -t provinces -t regions -t cities -t temporary_permissions -t permission_requests -t approvals -t approval_workflows -t activity_logs -t advanced_notifications > provinces_system_backup.sql
```

## التحقق من التطبيق

### 1. فحص الجداول

```sql
-- التحقق من إنشاء جميع الجداول
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

### 2. فحص الدوال

```sql
-- التحقق من إنشاء الدوال
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

### 3. فحص البيانات

```sql
-- التحقق من وجود المحافظات
SELECT COUNT(*) as provinces_count FROM provinces;

-- التحقق من وجود الصلاحيات
SELECT COUNT(*) as permissions_count FROM permissions WHERE group_name IN ('locations', 'permissions', 'workflows', 'notifications');
```

## استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ في الصلاحيات**: تأكد من أن المستخدم لديه صلاحية الوصول للجداول
2. **خطأ في RLS**: تحقق من سياسات الأمان
3. **خطأ في الدوال**: تأكد من تطبيق جميع الدوال بشكل صحيح

### سجلات الأخطاء:

```sql
-- عرض الأخطاء الأخيرة
SELECT * FROM activity_logs 
WHERE action LIKE '%error%' 
ORDER BY created_at DESC 
LIMIT 10;
```

## الدعم

في حالة وجود مشاكل، يرجى:

1. التحقق من سجلات الأخطاء
2. التأكد من تطبيق جميع الخطوات
3. فحص صلاحيات المستخدم
4. مراجعة ملف README الشامل

---

**تم إعداد هذا الدليل لضمان تطبيق النظام بنجاح**  
**آخر تحديث: يناير 2024**

