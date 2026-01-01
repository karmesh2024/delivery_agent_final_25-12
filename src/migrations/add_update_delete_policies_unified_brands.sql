-- =====================================================
-- إضافة RLS Policies للتحديث والحذف على unified_brands
-- Add RLS Policies for UPDATE and DELETE on unified_brands
-- =====================================================

-- حذف السياسات القديمة إن وجدت (لتجنب الأخطاء عند إعادة التشغيل)
DROP POLICY IF EXISTS "Allow update access to unified_brands" ON public.unified_brands;
DROP POLICY IF EXISTS "Allow delete access to unified_brands" ON public.unified_brands;
DROP POLICY IF EXISTS "Allow insert access to unified_brands" ON public.unified_brands;

-- سياسة للتحديث: جميع المستخدمين المصرح لهم يمكنهم التحديث
CREATE POLICY "Allow update access to unified_brands" ON public.unified_brands
    FOR UPDATE USING (true);

-- سياسة للحذف: جميع المستخدمين المصرح لهم يمكنهم الحذف
CREATE POLICY "Allow delete access to unified_brands" ON public.unified_brands
    FOR DELETE USING (true);

-- سياسة للإضافة: جميع المستخدمين المصرح لهم يمكنهم الإضافة
CREATE POLICY "Allow insert access to unified_brands" ON public.unified_brands
    FOR INSERT WITH CHECK (true);

