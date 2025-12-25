-- ملف إصلاح سياسة إضافة المسؤولين الجدد
-- يجب تنفيذ هذا الملف في قاعدة البيانات لإصلاح مشكلة "ليس لديك صلاحية لإضافة مسؤول جديد"

-- التأكد من تفعيل حماية RLS على جدول المسؤولين
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- حذف السياسة القديمة إن وجدت
DROP POLICY IF EXISTS "المسؤولون يمكنهم إضافة مسؤولين جدد" ON public.admins;

-- إنشاء سياسة جديدة للإضافة
CREATE POLICY "المسؤولون يمكنهم إضافة مسؤولين جدد" ON public.admins
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = auth.uid()
        AND is_active = true
        AND (
          -- التحقق من وجود صلاحية إضافة مسؤول في حقل permissions
          permissions::jsonb ? 'admins:create'
          AND
          (permissions::jsonb->>'admins:create')::boolean = true
          OR
          -- أو التحقق من وجود صلاحية إدارة المسؤولين
          permissions::jsonb ? 'admins:manage'
          AND
          (permissions::jsonb->>'admins:manage')::boolean = true
          OR
          -- أو التحقق من خلال دالة الصلاحيات المحسنة
          check_admin_permission_enhanced(id, 'admins:create')
        )
      )
    );

-- منح الإذن بالإضافة للمستخدمين المصادق عليهم
GRANT INSERT ON public.admins TO authenticated;

-- إعادة تفعيل RLS للتأكد من تطبيق التغييرات
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- طباعة رسالة نجاح
DO $$
BEGIN
    RAISE NOTICE 'تم إضافة سياسة "المسؤولون يمكنهم إضافة مسؤولين جدد" بنجاح.';
END $$; 