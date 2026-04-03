-- =============================================================================
-- Fix: entity_id في sync_audit_log قد يكون رقم (waste_sub_categories) أو UUID
-- تغيير نوع العمود إلى TEXT ليقبل أي معرف
-- التاريخ: 2026-01-29
-- =============================================================================

-- إسقاط الـ index المعتمد على entity_id قبل التعديل
DROP INDEX IF EXISTS public.idx_sync_audit_entity;

-- تغيير نوع العمود ليقبل UUID أو أرقام كـ نص
ALTER TABLE public.sync_audit_log
  ALTER COLUMN entity_id TYPE TEXT USING entity_id::TEXT;

-- إعادة إنشاء الـ index
CREATE INDEX IF NOT EXISTS idx_sync_audit_entity ON public.sync_audit_log(entity_type, entity_id);

COMMENT ON COLUMN public.sync_audit_log.entity_id IS 'معرف الكيان (UUID أو رقم كـ نص حسب الجدول المصدر)';
