-- Migration: تفعيل Realtime لجدول stock_exchange
-- هذا يسمح لتطبيق الموبايل بالاشتراك في التحديثات الفورية للأسعار

-- 1. تفعيل Realtime لجدول stock_exchange
ALTER PUBLICATION supabase_realtime ADD TABLE stock_exchange;

-- 2. التأكد من وجود RLS policy للقراءة العامة (إذا لزم الأمر)
-- ملاحظة: قد تحتاج إلى تعديل هذا حسب متطلبات الأمان الخاصة بك
-- CREATE POLICY IF NOT EXISTS "Allow public read access to stock_exchange"
-- ON stock_exchange
-- FOR SELECT
-- USING (true);

COMMENT ON TABLE stock_exchange IS 'جدول البورصة - مفعّل Realtime للتحديثات الفورية';

