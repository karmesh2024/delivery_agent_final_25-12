-- تعديل جدول مستندات المندوبين لإضافة تاريخ انتهاء الصلاحية
-- تاريخ الإنشاء: 2025-05-06

-- إضافة حقل تاريخ انتهاء الصلاحية
ALTER TABLE IF EXISTS delivery_documents 
ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- إضافة حقل ملاحظات
ALTER TABLE IF EXISTS delivery_documents 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- إضافة حقل المراجع (الآدمن الذي قام بالمراجعة)
ALTER TABLE IF EXISTS delivery_documents 
ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES auth.users(id);

-- إضافة حقل ملاحظات المراجعة
ALTER TABLE IF EXISTS delivery_documents 
ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- إضافة حقل سبب الرفض
ALTER TABLE IF EXISTS delivery_documents 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- إضافة حقل آخر تحديث
ALTER TABLE IF EXISTS delivery_documents 
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW();

-- إنشاء وظيفة تحديث آخر تحديث تلقائياً
CREATE OR REPLACE FUNCTION update_delivery_documents_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء محفز (trigger) لتحديث آخر تحديث تلقائياً عند التعديل
DROP TRIGGER IF EXISTS set_delivery_documents_last_updated ON delivery_documents;
CREATE TRIGGER set_delivery_documents_last_updated
BEFORE UPDATE ON delivery_documents
FOR EACH ROW
EXECUTE FUNCTION update_delivery_documents_last_updated();

-- إنشاء فهرس على تاريخ انتهاء الصلاحية للبحث السريع
CREATE INDEX IF NOT EXISTS idx_delivery_documents_expiry_date 
ON delivery_documents(expiry_date);

-- تعديل الصلاحيات
GRANT SELECT, INSERT, UPDATE ON delivery_documents TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE delivery_documents_id_seq TO authenticated;

-- الإحصائيات
ANALYZE delivery_documents; 