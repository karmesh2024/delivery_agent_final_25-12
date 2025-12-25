-- ملف إصلاح مشكلة صلاحيات المسؤول
-- يجب تنفيذ هذا الملف في قاعدة البيانات لإصلاح مشكلة "غير مصرح لهذا المستخدم بالوصول إلى لوحة التحكم"

-- أولاً: التحقق من وجود جدول roles وإنشائه إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  permissions jsonb,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);

-- ثانياً: إنشاء دور المدير إن لم يكن موجوداً
INSERT INTO public.roles (id, name, code, description, permissions)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'مدير النظام', 'super_admin', 'صلاحيات كاملة على جميع أجزاء النظام',
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
ON CONFLICT (id) DO UPDATE 
SET
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
  name = 'مدير النظام',
  code = 'super_admin',
  description = 'صلاحيات كاملة على جميع أجزاء النظام';

-- ثالثاً: تحديث المستخدم الحالي بالصلاحيات المناسبة
UPDATE public.admins
SET 
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
  
-- التحقق من وجود سجل الدور بالمعرف الصحيح
DO $$
DECLARE
  role_exists INTEGER;
BEGIN
  SELECT COUNT(*) INTO role_exists FROM public.roles WHERE id = '00000000-0000-0000-0000-000000000001';
  
  RAISE NOTICE 'عدد سجلات الدور بالمعرف المحدد: %', role_exists;
  
  IF role_exists = 0 THEN
    RAISE EXCEPTION 'لم يتم العثور على دور بالمعرف 00000000-0000-0000-0000-000000000001';
  END IF;
END $$;

-- عرض معلومات المستخدم بعد التحديث للتحقق
SELECT 
  a.id, 
  a.email, a.is_active, 
  r.id as role_id, r.name as role_name, r.code as role_code,
  a.permissions
FROM public.admins a
LEFT JOIN public.roles r ON a.role_id = r.id
WHERE a.email = 'despitalia1@gmail.com';