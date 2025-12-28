-- =====================================================
-- الجزء الثالث: تحديث جدول المخازن والفهارس
-- =====================================================

-- 5. تحديث جدول المخازن لإضافة الحقول المطلوبة
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES warehouse_levels(id);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS parent_warehouse_id UUID REFERENCES warehouses(id);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS hierarchy_path TEXT;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS depth INTEGER DEFAULT 0;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS is_hierarchy_active BOOLEAN DEFAULT true;

-- 6. إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_warehouse_hierarchy_parent ON warehouse_hierarchy(parent_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_hierarchy_level ON warehouse_hierarchy(level_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_hierarchy_path ON warehouse_hierarchy USING GIN(hierarchy_path);
CREATE INDEX IF NOT EXISTS idx_warehouse_permissions_warehouse ON warehouse_permissions(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_permission_delegations_delegator ON permission_delegations(delegator_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_permission_delegations_delegatee ON permission_delegations(delegatee_warehouse_id);
