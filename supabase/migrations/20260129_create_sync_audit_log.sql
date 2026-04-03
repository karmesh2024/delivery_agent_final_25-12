-- =============================================================================
-- Migration: إنشاء جدول سجل المزامنة والعمليات (Sync Audit Log)
-- التاريخ: 2026-01-29
-- الوصف: جدول لتسجيل جميع عمليات المزامنة والتعديلات في النظام
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.sync_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- معلومات الكيان المتأثر (entity_id قد يكون UUID أو رقم من waste_sub_categories)
  entity_type VARCHAR(50) NOT NULL, -- 'subcategory', 'product', 'main_category', 'brand', 'unit', 'classification', 'sector'
  entity_id TEXT NOT NULL,
  entity_name VARCHAR(255), -- لسهولة القراءة
  
  -- نوع العملية
  operation VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete', 'sync'
  
  -- الجداول المتأثرة
  source_table VARCHAR(100) NOT NULL, -- مثال: 'unified_sub_categories'
  target_tables TEXT[], -- مثال: ['waste_sub_categories', 'catalog_waste_materials']
  
  -- حالة المزامنة
  sync_status VARCHAR(20) NOT NULL DEFAULT 'pending', 
  -- 'pending', 'in_progress', 'success', 'failed', 'partial'
  
  -- تفاصيل الأداء والأخطاء
  execution_time_ms INTEGER, -- وقت التنفيذ بالميلي ثانية
  error_message TEXT,
  error_stack TEXT,
  
  -- البيانات التفصيلية
  payload JSONB, -- البيانات المرسلة
  response JSONB, -- النتيجة
  
  -- معلومات المستخدم
  user_id UUID,
  user_email VARCHAR(255),
  
  -- التوقيت
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes للأداء
CREATE INDEX IF NOT EXISTS idx_sync_audit_entity ON public.sync_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_audit_status ON public.sync_audit_log(sync_status);
CREATE INDEX IF NOT EXISTS idx_sync_audit_created ON public.sync_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_audit_user ON public.sync_audit_log(user_id);

-- Index للبحث السريع في الأخطاء
CREATE INDEX IF NOT EXISTS idx_sync_audit_failed ON public.sync_audit_log(sync_status) 
WHERE sync_status = 'failed';

-- Comments
COMMENT ON TABLE public.sync_audit_log IS 'سجل تتبع جميع عمليات المزامنة والتعديلات في النظام';
COMMENT ON COLUMN public.sync_audit_log.entity_type IS 'نوع الكيان: subcategory, product, main_category, brand, unit, classification, sector';
COMMENT ON COLUMN public.sync_audit_log.operation IS 'نوع العملية: create, update, delete, sync';
COMMENT ON COLUMN public.sync_audit_log.sync_status IS 'حالة المزامنة: pending, in_progress, success, failed, partial';
COMMENT ON COLUMN public.sync_audit_log.source_table IS 'الجدول المصدر للعملية';
COMMENT ON COLUMN public.sync_audit_log.target_tables IS 'الجداول المستهدفة في المزامنة';
COMMENT ON COLUMN public.sync_audit_log.execution_time_ms IS 'وقت التنفيذ بالميلي ثانية';
COMMENT ON COLUMN public.sync_audit_log.payload IS 'البيانات المرسلة في العملية';
COMMENT ON COLUMN public.sync_audit_log.response IS 'نتيجة العملية';

-- =============================================================================
-- Rollback Script (للتراجع عند الحاجة)
-- =============================================================================
-- DROP INDEX IF EXISTS public.idx_sync_audit_failed;
-- DROP INDEX IF EXISTS public.idx_sync_audit_user;
-- DROP INDEX IF EXISTS public.idx_sync_audit_created;
-- DROP INDEX IF EXISTS public.idx_sync_audit_status;
-- DROP INDEX IF EXISTS public.idx_sync_audit_entity;
-- DROP TABLE IF EXISTS public.sync_audit_log;
