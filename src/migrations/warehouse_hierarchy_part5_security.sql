-- =====================================================
-- الجزء الخامس: دوال الصلاحيات والأمان
-- =====================================================

-- 9. دالة للتحقق من الصلاحيات
CREATE OR REPLACE FUNCTION check_warehouse_permission(
    warehouse_uuid UUID,
    permission_type VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := false;
BEGIN
    -- التحقق من الصلاحيات المباشرة
    SELECT permission_value INTO has_permission
    FROM warehouse_permissions
    WHERE warehouse_id = warehouse_uuid
    AND permission_type = check_warehouse_permission.permission_type
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- إذا لم توجد صلاحية مباشرة، التحقق من الصلاحيات المفوضة
    IF NOT has_permission THEN
        SELECT EXISTS(
            SELECT 1
            FROM permission_delegations pd
            JOIN warehouse_permissions wp ON pd.delegator_warehouse_id = wp.warehouse_id
            WHERE pd.delegatee_warehouse_id = warehouse_uuid
            AND permission_type = ANY(pd.permission_types)
            AND pd.is_active = true
            AND (pd.expires_at IS NULL OR pd.expires_at > NOW())
            AND wp.permission_value = true
        ) INTO has_permission;
    END IF;
    
    RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql;

-- 10. دالة لإنشاء مخزن جديد مع الصلاحيات الافتراضية
CREATE OR REPLACE FUNCTION create_warehouse_with_hierarchy(
    warehouse_name VARCHAR(255),
    warehouse_level VARCHAR(20),
    parent_warehouse_uuid UUID DEFAULT NULL,
    created_by_uuid UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_warehouse_id UUID;
    level_record RECORD;
    permission_types TEXT[] := ARRAY[
        'create_warehouse',
        'edit_warehouse',
        'delete_warehouse',
        'view_reports',
        'manage_permissions',
        'delegate_permissions'
    ];
    permission_type TEXT;
BEGIN
    -- الحصول على معلومات المستوى
    SELECT * INTO level_record
    FROM warehouse_levels
    WHERE code = warehouse_level;
    
    -- إنشاء المخزن
    INSERT INTO warehouses (name, level_id, parent_warehouse_id, created_by)
    VALUES (warehouse_name, level_record.id, parent_warehouse_uuid, created_by_uuid)
    RETURNING id INTO new_warehouse_id;
    
    -- إضافة المخزن إلى الهيكل الهرمي
    INSERT INTO warehouse_hierarchy (warehouse_id, parent_warehouse_id, level_id)
    VALUES (new_warehouse_id, parent_warehouse_uuid, level_record.id);
    
    -- إضافة الصلاحيات الافتراضية حسب المستوى
    FOREACH permission_type IN ARRAY permission_types
    LOOP
        INSERT INTO warehouse_permissions (warehouse_id, permission_type, permission_value)
        VALUES (
            new_warehouse_id,
            permission_type,
            CASE 
                WHEN warehouse_level = 'admin' THEN true
                WHEN warehouse_level = 'country' AND permission_type IN ('create_warehouse', 'edit_warehouse', 'view_reports') THEN true
                WHEN warehouse_level = 'city' AND permission_type IN ('create_warehouse', 'view_reports') THEN true
                WHEN warehouse_level = 'district' AND permission_type = 'view_reports' THEN true
                ELSE false
            END
        );
    END LOOP;
    
    RETURN new_warehouse_id;
END;
$$ LANGUAGE plpgsql;
