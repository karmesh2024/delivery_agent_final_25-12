-- سكريبت SQL لتحديث جدول المشرفين (admins) الحالي
-- هذا السكريبت يضيف أعمدة جديدة إلى جدول المشرفين لتحسين وظائف النظام

-- الهيكل الحالي للجدول:
-- create table public.admins (
--   id uuid not null default extensions.uuid_generate_v4 (),
--   user_id uuid null,
--   is_active boolean null default true,
--   email text null,
--   constraint admins_pkey primary key (id),
--   constraint admins_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
-- ) TABLESPACE pg_default;

-- إضافة عمود اسم المستخدم
ALTER TABLE public.admins
ADD COLUMN username text NULL;

-- إضافة عمود الاسم الكامل
ALTER TABLE public.admins
ADD COLUMN full_name text NULL;

-- إضافة عمود الدور (مسؤول، مشرف، دعم فني، إلخ)
ALTER TABLE public.admins
ADD COLUMN role text NULL DEFAULT 'admin';

-- إضافة عمود وقت الإنشاء
ALTER TABLE public.admins
ADD COLUMN created_at timestamptz NULL DEFAULT CURRENT_TIMESTAMP;

-- إضافة عمود آخر تحديث
ALTER TABLE public.admins
ADD COLUMN updated_at timestamptz NULL DEFAULT CURRENT_TIMESTAMP;

-- إضافة عمود رقم الهاتف
ALTER TABLE public.admins
ADD COLUMN phone text NULL;

-- إضافة عمود الصورة الشخصية
ALTER TABLE public.admins
ADD COLUMN profile_image_url text NULL;

-- إضافة عمود الأذونات
ALTER TABLE public.admins
ADD COLUMN permissions jsonb NULL DEFAULT '{}';

-- إنشاء مؤشر على عمود اسم المستخدم لتحسين الأداء عند البحث
CREATE INDEX IF NOT EXISTS idx_admins_username ON public.admins (username);

-- إنشاء مؤشر على عمود البريد الإلكتروني
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins (email);

-- إنشاء دالة trigger لتحديث عمود آخر تحديث تلقائياً
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء trigger لتحديث عمود آخر تحديث
DROP TRIGGER IF EXISTS set_updated_at ON public.admins;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.admins
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- إضافة تعليق على الجدول
COMMENT ON TABLE public.admins IS 'جدول المشرفين الذي يحتوي على معلومات المشرفين في النظام';

-- إضافة تعليقات على الأعمدة
COMMENT ON COLUMN public.admins.id IS 'المعرف الفريد للمشرف';
COMMENT ON COLUMN public.admins.user_id IS 'المعرف الفريد للمستخدم المرتبط بالمشرف من جدول المستخدمين';
COMMENT ON COLUMN public.admins.is_active IS 'حالة المشرف (نشط/غير نشط)';
COMMENT ON COLUMN public.admins.email IS 'البريد الإلكتروني للمشرف';
COMMENT ON COLUMN public.admins.username IS 'اسم المستخدم للمشرف';
COMMENT ON COLUMN public.admins.full_name IS 'الاسم الكامل للمشرف';
COMMENT ON COLUMN public.admins.role IS 'دور المشرف في النظام (مسؤول، مشرف، دعم فني)';
COMMENT ON COLUMN public.admins.created_at IS 'وقت إنشاء سجل المشرف';
COMMENT ON COLUMN public.admins.updated_at IS 'وقت آخر تحديث لسجل المشرف';
COMMENT ON COLUMN public.admins.phone IS 'رقم هاتف المشرف';
COMMENT ON COLUMN public.admins.profile_image_url IS 'رابط الصورة الشخصية للمشرف';
COMMENT ON COLUMN public.admins.permissions IS 'أذونات المشرف كمصفوفة JSON';

-- بيانات اختبار - إضافة مشرف نظام (تأكد من تعديل القيم حسب الحاجة)
-- ملاحظة: هذا مثال فقط، قم بتعديله أو إزالته حسب الحاجة
INSERT INTO public.admins (
    id, 
    email, 
    is_active, 
    username, 
    full_name, 
    role, 
    phone, 
    profile_image_url
) VALUES (
    'a1b2c3d4-e5f6-11ec-8ea0-0242ac130001', 
    'admin@example.com', 
    true, 
    'admin', 
    'مشرف النظام', 
    'super_admin', 
    '+966500000000', 
    'https://example.com/profiles/admin.jpg'
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    profile_image_url = EXCLUDED.profile_image_url,
    updated_at = CURRENT_TIMESTAMP;

-- تحديث بيانات المشرفين الحاليين (إذا كان هناك مشرفون بالفعل)
-- قم بتعديل الشرط WHERE حسب الحاجة
UPDATE public.admins
SET
    username = COALESCE(username, 'admin' || id::text),
    full_name = COALESCE(full_name, 'مشرف النظام'),
    role = COALESCE(role, 'admin'),
    updated_at = CURRENT_TIMESTAMP
WHERE
    username IS NULL OR full_name IS NULL OR role IS NULL;

-- ملاحظات استخدام:
-- 1. قم بعمل نسخة احتياطية من قاعدة البيانات قبل تنفيذ هذا السكريبت
-- 2. تأكد من أن هذا التعديل لا يتعارض مع عمليات أخرى في التطبيق
-- 3. قد تحتاج لتحديث تطبيقك للتعامل مع الأعمدة الجديدة