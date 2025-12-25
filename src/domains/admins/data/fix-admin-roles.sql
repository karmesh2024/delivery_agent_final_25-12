-- ملف إصلاح مشكلة صلاحيات المسؤول
-- يجب تنفيذ هذا الملف في قاعدة البيانات لإصلاح مشكلة "غير مصرح لهذا المستخدم بالوصول إلى لوحة التحكم"

-- أولاً: إضافة العمود code إلى جدول الأدوار إذا لم يكن موجودًا (مطلوب للتوافق مع التطبيق)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'roles'
        AND column_name = 'code'
    ) THEN
        ALTER TABLE public.roles ADD COLUMN code text;
        -- إضافة قيود التفرد لعمود الكود
        ALTER TABLE public.roles ADD CONSTRAINT roles_code_unique UNIQUE (code);
    END IF;
    
    -- إضافة عمود permissions إذا لم يكن موجودًا
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'roles'
        AND column_name = 'permissions'
    ) THEN
        ALTER TABLE public.roles ADD COLUMN permissions jsonb;
    END IF;
END $$;

-- ثانياً: إنشاء دور المدير إن لم يكن موجوداً أو تحديثه
INSERT INTO public.roles (name, description, level, is_system, is_active, code, permissions)
VALUES 
  ('مدير النظام', 'صلاحيات كاملة على جميع أجزاء النظام', 100, true, true, 'super_admin',
   '{
      "dashboard:view": true,
      "admins:manage": true,
      "admins:create": true,
      "admins:update": true,
      "admins:delete": true,
      "roles:manage": true,
      "users:manage": true,
      "orders:manage": true,
      "messages:manage": true,
      "reports:view": true,
      "reports:export": true,
      "settings:manage": true
    }'::jsonb)
ON CONFLICT (name) DO UPDATE 
SET
  code = 'super_admin',
  permissions = '{
    "dashboard:view": true,
    "admins:manage": true,
    "admins:create": true,
    "admins:update": true,
    "admins:delete": true,
    "roles:manage": true,
    "users:manage": true,
    "orders:manage": true,
    "messages:manage": true,
    "reports:view": true,
    "reports:export": true,
    "settings:manage": true
  }'::jsonb,
  level = 100,
  is_system = true,
  is_active = true,
  description = 'صلاحيات كاملة على جميع أجزاء النظام';

-- ثالثاً: إضافة عمود permissions إلى جدول المسؤولين إذا لم يكن موجودًا
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'admins'
        AND column_name = 'permissions'
    ) THEN
        ALTER TABLE public.admins ADD COLUMN permissions jsonb;
    END IF;
END $$;

-- رابعاً: ربط المستخدم بدور المدير وإضافة صلاحيات
UPDATE public.admins
SET 
  role_id = (SELECT id FROM public.roles WHERE name = 'مدير النظام' OR code = 'super_admin' LIMIT 1),
  permissions = '{
    "dashboard:view": true,
    "admins:manage": true,
    "admins:create": true,
    "admins:update": true,
    "admins:delete": true,
    "roles:manage": true,
    "users:manage": true,
    "orders:manage": true,
    "messages:manage": true,
    "reports:view": true,
    "reports:export": true,
    "settings:manage": true
  }'::jsonb,
  is_active = true
WHERE 
  email = 'despitalia1@gmail.com';

-- خامساً: التحقق من وجود مستخدم في جدول المسؤولين وربطه بالدور
DO $$
DECLARE
    role_id_value uuid;
    admin_count integer;
BEGIN
    -- جلب معرف الدور
    SELECT id INTO role_id_value FROM public.roles WHERE name = 'مدير النظام' OR code = 'super_admin' LIMIT 1;
    
    -- التحقق من وجود المستخدم وربطه بالدور
    SELECT COUNT(*) INTO admin_count FROM public.admins WHERE email = 'despitalia1@gmail.com' AND role_id = role_id_value;
    
    IF admin_count = 0 THEN
        RAISE NOTICE 'تحذير: لم يتم العثور على مستخدم بالبريد الإلكتروني المحدد أو لم يتم ربطه بالدور بنجاح';
    ELSE
        RAISE NOTICE 'تم ربط المستخدم بدور مدير النظام بنجاح';
    END IF;
END $$;

-- سادساً: تعديل كود authApi.ts (لا يتم تنفيذه هنا، ولكن يجب تنفيذه في التطبيق)
/*
يجب تعديل ملف src/domains/admins/api/authApi.ts لتتوافق الاستعلامات مع هيكل قاعدة البيانات.
خاصة استعلام جلب معلومات المسؤول والمتضمن العلاقة مع جدول roles.

يجب تعديل دالة login و checkAuth لتكونا أكثر مرونة في حالة عدم وجود بعض الأعمدة أو القيم
*/

-- عرض معلومات المستخدم بعد التحديث للتحقق
SELECT 
  a.id, 
  a.email, 
  a.is_active, 
  r.id as role_id, 
  r.name as role_name, 
  r.code as role_code,
  a.permissions
FROM public.admins a
LEFT JOIN public.roles r ON a.role_id = r.id
WHERE a.email = 'despitalia1@gmail.com';