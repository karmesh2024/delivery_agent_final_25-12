-- =====================================================
-- الجزء السادس: سياسات الأمان والبيانات التجريبية
-- =====================================================

-- 11. إنشاء سياسات الأمان (RLS)
ALTER TABLE warehouse_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_delegations ENABLE ROW LEVEL SECURITY;

-- سياسة للهيكل الهرمي
CREATE POLICY "warehouse_hierarchy_policy" ON warehouse_hierarchy
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM warehouse_users 
            WHERE warehouse_id = warehouse_hierarchy.warehouse_id
        )
    );

-- سياسة للصلاحيات
CREATE POLICY "warehouse_permissions_policy" ON warehouse_permissions
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM warehouse_users 
            WHERE warehouse_id = warehouse_permissions.warehouse_id
        )
    );

-- سياسة للتفويض
CREATE POLICY "permission_delegations_policy" ON permission_delegations
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM warehouse_users 
            WHERE warehouse_id = permission_delegations.delegator_warehouse_id
        )
    );

-- 12. إدراج البيانات التجريبية
INSERT INTO warehouses (name, level_id, parent_warehouse_id, created_by) VALUES
('الإدارة العليا للمخازن', (SELECT id FROM warehouse_levels WHERE code = 'admin'), NULL, NULL),
('مخزن شمال الدلتا الرئيسي', (SELECT id FROM warehouse_levels WHERE code = 'country'), 
 (SELECT id FROM warehouses WHERE name = 'الإدارة العليا للمخازن'), NULL),
('مخزن القاهرة', (SELECT id FROM warehouse_levels WHERE code = 'city'), 
 (SELECT id FROM warehouses WHERE name = 'مخزن شمال الدلتا الرئيسي'), NULL),
('مخزن المعادي', (SELECT id FROM warehouse_levels WHERE code = 'district'), 
 (SELECT id FROM warehouses WHERE name = 'مخزن القاهرة'), NULL);

-- تحديث الهيكل الهرمي للمخازن الموجودة
INSERT INTO warehouse_hierarchy (warehouse_id, parent_warehouse_id, level_id)
SELECT 
    w.id,
    w.parent_warehouse_id,
    w.level_id
FROM warehouses w
WHERE w.level_id IS NOT NULL;

-- إضافة الصلاحيات الافتراضية للمخازن الموجودة
INSERT INTO warehouse_permissions (warehouse_id, permission_type, permission_value)
SELECT 
    w.id,
    'view_reports',
    true
FROM warehouses w
WHERE w.level_id IS NOT NULL;

COMMIT;
