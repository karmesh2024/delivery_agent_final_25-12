-- =====================================================
-- نظام الهيكل الهرمي للمخازن مع الصلاحيات المتدرجة
-- =====================================================

-- 1. جدول المستويات الهرمية للمخازن
CREATE TABLE IF NOT EXISTS warehouse_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    level_order INTEGER NOT NULL,
    description TEXT,
    can_create_sub_levels BOOLEAN DEFAULT false,
    max_sub_levels INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج المستويات الأساسية
INSERT INTO warehouse_levels (name, code, level_order, description, can_create_sub_levels, max_sub_levels) VALUES
('الإدارة العليا للمخازن', 'admin', 1, 'المستوى الأعلى في الهيكل الهرمي - يتحكم في جميع المستويات', true, 3),
('مخزن الدولة الرئيسي', 'country', 2, 'المخازن على مستوى الدولة - يمكنها إدارة المدن والمناطق', true, 2),
('مخزن المدينة', 'city', 3, 'المخازن على مستوى المدينة - يمكنها إدارة المناطق فقط', true, 1),
('مخزن المنطقة', 'district', 4, 'المخازن على مستوى المنطقة - المستوى الأدنى', false, 0)
ON CONFLICT (code) DO NOTHING;

-- 2. جدول الصلاحيات للمخازن
CREATE TABLE IF NOT EXISTS warehouse_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL,
    permission_type VARCHAR(50) NOT NULL,
    permission_value BOOLEAN DEFAULT false,
    delegated_from UUID,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_warehouse_permissions_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    CONSTRAINT fk_warehouse_permissions_delegated FOREIGN KEY (delegated_from) REFERENCES warehouses(id) ON DELETE SET NULL
);

-- 3. جدول الهيكل الهرمي للمخازن
CREATE TABLE IF NOT EXISTS warehouse_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL UNIQUE,
    parent_warehouse_id UUID,
    level_id UUID NOT NULL,
    hierarchy_path TEXT NOT NULL,
    depth INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_warehouse_hierarchy_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    CONSTRAINT fk_warehouse_hierarchy_parent FOREIGN KEY (parent_warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
    CONSTRAINT fk_warehouse_hierarchy_level FOREIGN KEY (level_id) REFERENCES warehouse_levels(id) ON DELETE RESTRICT
);

-- 4. جدول تفويض الصلاحيات
CREATE TABLE IF NOT EXISTS permission_delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delegator_warehouse_id UUID NOT NULL,
    delegatee_warehouse_id UUID NOT NULL,
    permission_types TEXT[] NOT NULL,
    delegation_level VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_permission_delegations_delegator FOREIGN KEY (delegator_warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    CONSTRAINT fk_permission_delegations_delegatee FOREIGN KEY (delegatee_warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    CONSTRAINT fk_permission_delegations_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT
);

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

-- 7. إنشاء الدوال المساعدة
CREATE OR REPLACE FUNCTION update_warehouse_hierarchy_path()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث مسار الهيكل الهرمي
    IF NEW.parent_warehouse_id IS NOT NULL THEN
        SELECT hierarchy_path || ',' || NEW.warehouse_id::text
        INTO NEW.hierarchy_path
        FROM warehouse_hierarchy
        WHERE warehouse_id = NEW.parent_warehouse_id;
        
        NEW.depth := (
            SELECT depth + 1
            FROM warehouse_hierarchy
            WHERE warehouse_id = NEW.parent_warehouse_id
        );
    ELSE
        NEW.hierarchy_path := NEW.warehouse_id::text;
        NEW.depth := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء التريغر لتحديث المسار تلقائياً
CREATE TRIGGER trigger_update_warehouse_hierarchy_path
    BEFORE INSERT OR UPDATE ON warehouse_hierarchy
    FOR EACH ROW
    EXECUTE FUNCTION update_warehouse_hierarchy_path();

-- 8. دالة للحصول على جميع المخازن التابعة
CREATE OR REPLACE FUNCTION get_sub_warehouses(warehouse_uuid UUID)
RETURNS TABLE (
    warehouse_id UUID,
    warehouse_name VARCHAR(255),
    level_name VARCHAR(100),
    depth INTEGER,
    hierarchy_path TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.name,
        wl.name as level_name,
        wh.depth,
        wh.hierarchy_path
    FROM warehouses w
    JOIN warehouse_hierarchy wh ON w.id = wh.warehouse_id
    JOIN warehouse_levels wl ON wh.level_id = wl.id
    WHERE wh.hierarchy_path LIKE '%' || warehouse_uuid::text || '%'
    AND w.id != warehouse_uuid
    ORDER BY wh.depth, w.name;
END;
$$ LANGUAGE plpgsql;

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
