-- =====================================================
-- الجزء الثاني: جداول الصلاحيات والهيكل الهرمي
-- =====================================================

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
