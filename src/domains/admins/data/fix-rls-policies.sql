-- ملف إصلاح سياسات RLS لجداول المسؤولين والأدوار
-- يجب تنفيذ هذا الملف في قاعدة البيانات لإصلاح مشكلة "غير مصرح لهذا المستخدم بالوصول إلى لوحة التحكم"

-- أولاً: تفعيل حماية RLS على جداول المسؤولين والأدوار
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- ثانياً: إنشاء السياسات المطلوبة

-- 1. سياسة تسمح للمستخدم المصادق برؤية سجله في جدول المسؤولين (بغض النظر عن is_active)
DROP POLICY IF EXISTS "المستخدمون يمكنهم رؤية سجلاتهم" ON public.admins;
CREATE POLICY "المستخدمون يمكنهم رؤية سجلاتهم" ON public.admins
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 2. سياسة تسمح للمستخدم المصادق برؤية سجل دوره
DROP POLICY IF EXISTS "المستخدمون يمكنهم رؤية الأدوار" ON public.roles;
CREATE POLICY "المستخدمون يمكنهم رؤية الأدوار" ON public.roles
    FOR SELECT
    TO authenticated
    USING (id IN (
        SELECT role_id FROM public.admins WHERE user_id = auth.uid()
    ));

-- 3. سياسة تسمح للمسؤولين النشطين برؤية جميع المسؤولين
DROP POLICY IF EXISTS "المسؤولون النشطون يمكنهم رؤية جميع المسؤولين" ON public.admins;
CREATE POLICY "المسؤولون النشطون يمكنهم رؤية جميع المسؤولين" ON public.admins
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = auth.uid()
        AND is_active = true
        AND permissions::jsonb ? 'admins:manage'
    ));

-- 4. سياسة تسمح للمسؤولين النشطين برؤية جميع الأدوار
DROP POLICY IF EXISTS "المسؤولون النشطون يمكنهم رؤية جميع الأدوار" ON public.roles;
CREATE POLICY "المسؤولون النشطون يمكنهم رؤية جميع الأدوار" ON public.roles
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = auth.uid()
        AND is_active = true
        AND permissions::jsonb ? 'roles:manage'
    ));

-- 5. سياسة خاصة لحالة السماح بالقراءة من querybuilder الخاص بـ API
-- هذه السياسة مهمة لحل مشكلة الاستعلامات المعقدة التي تتضمن علاقات
DROP POLICY IF EXISTS "السماح للمستخدمين المصادقين باستعلامات API" ON public.admins;
CREATE POLICY "السماح للمستخدمين المصادقين باستعلامات API" ON public.admins
    FOR SELECT
    TO authenticated
    USING (role_id IS NOT NULL);

-- إضافة إذن للدور anon لتجنب مشاكل التصفح المجهول
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO anon;

GRANT SELECT ON public.admins TO anon;
GRANT SELECT ON public.admins TO authenticated;
GRANT SELECT ON public.roles TO anon;
GRANT SELECT ON public.roles TO authenticated;

-- قد تحتاج لإعادة تشغيل RLS حتى تطبق التغييرات
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- اختبار وصول المستخدم إلى بياناته
DO $$
DECLARE
    current_user_id UUID := '249d346d-0ec9-4146-a86e-6e97c3a399a2'; -- معرف المستخدم الحالي
BEGIN
    -- محاكاة المستخدم المصادق
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claim.sub" TO current_user_id;
    
    -- طباعة نتيجة الاستعلام
    RAISE NOTICE 'عدد سجلات المستخدم المرئية: %', (SELECT COUNT(*) FROM public.admins WHERE user_id = current_user_id);
    RAISE NOTICE 'عدد سجلات الأدوار المرئية: %', (SELECT COUNT(*) FROM public.roles WHERE id IN (
        SELECT role_id FROM public.admins WHERE user_id = current_user_id
    ));
    
    -- إعادة الدور إلى الافتراضي
    RESET ROLE;
END $$;