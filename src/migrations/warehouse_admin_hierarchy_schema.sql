-- إضافة مستوى الإدارة العليا للمخازن
-- هذا المستوى هو الأعلى في الهيكل الهرمي

-- إضافة مستوى جديد للإدارة العليا
ALTER TABLE public.warehouses
ADD COLUMN IF NOT EXISTS warehouse_level VARCHAR(20) CHECK (warehouse_level IN ('admin', 'country', 'city', 'district'));

-- إضافة حقول خاصة بالإدارة العليا
ALTER TABLE public.warehouses
ADD COLUMN IF NOT EXISTS admin_settings JSONB, -- إعدادات الإدارة العليا
ADD COLUMN IF NOT EXISTS functional_structure JSONB, -- الهيكل الوظيفي
ADD COLUMN IF NOT EXISTS system_configuration JSONB, -- إعدادات النظام
ADD COLUMN IF NOT EXISTS is_admin_warehouse BOOLEAN DEFAULT FALSE; -- هل هو مخزن إداري

-- إنشاء جدول إعدادات الإدارة العليا
CREATE TABLE IF NOT EXISTS public.warehouse_admin_settings (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER REFERENCES public.warehouses(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB,
    setting_type VARCHAR(50) DEFAULT 'system', -- system, functional, operational
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول الهيكل الوظيفي
CREATE TABLE IF NOT EXISTS public.warehouse_functional_structure (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER REFERENCES public.warehouses(id) ON DELETE CASCADE,
    department_name VARCHAR(200) NOT NULL,
    department_code VARCHAR(50),
    parent_department_id INTEGER REFERENCES public.warehouse_functional_structure(id),
    department_level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول إعدادات النظام
CREATE TABLE IF NOT EXISTS public.warehouse_system_config (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER REFERENCES public.warehouses(id) ON DELETE CASCADE,
    config_category VARCHAR(100) NOT NULL, -- inventory, security, notifications, etc.
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB,
    is_global BOOLEAN DEFAULT FALSE, -- هل يطبق على جميع المخازن التابعة
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_warehouses_admin_level ON public.warehouses(warehouse_level) WHERE warehouse_level = 'admin';
CREATE INDEX IF NOT EXISTS idx_warehouses_admin_warehouse ON public.warehouses(is_admin_warehouse) WHERE is_admin_warehouse = TRUE;
CREATE INDEX IF NOT EXISTS idx_warehouse_admin_settings_warehouse ON public.warehouse_admin_settings(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_functional_structure_warehouse ON public.warehouse_functional_structure(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_system_config_warehouse ON public.warehouse_system_config(warehouse_id);

-- إنشاء دالة لتحديث مسار الهيكل الهرمي
CREATE OR REPLACE FUNCTION update_warehouse_hierarchy_path()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث مسار الهيكل الهرمي
    IF NEW.parent_warehouse_id IS NOT NULL THEN
        WITH RECURSIVE hierarchy AS (
            SELECT id, parent_warehouse_id, 1 as level
            FROM warehouses 
            WHERE id = NEW.parent_warehouse_id
            UNION ALL
            SELECT w.id, w.parent_warehouse_id, h.level + 1
            FROM warehouses w
            INNER JOIN hierarchy h ON w.parent_warehouse_id = h.id
        )
        SELECT string_agg(id::text, '/') INTO NEW.hierarchy_path
        FROM hierarchy
        ORDER BY level DESC;
    ELSE
        NEW.hierarchy_path = NEW.id::text;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث مسار الهيكل
DROP TRIGGER IF EXISTS trigger_update_warehouse_hierarchy_path ON public.warehouses;
CREATE TRIGGER trigger_update_warehouse_hierarchy_path
    BEFORE INSERT OR UPDATE ON public.warehouses
    FOR EACH ROW
    EXECUTE FUNCTION update_warehouse_hierarchy_path();

-- إنشاء RLS policies للإدارة العليا
ALTER TABLE public.warehouse_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_functional_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_system_config ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للإدارة العليا
CREATE POLICY "warehouse_admin_settings_policy" ON public.warehouse_admin_settings
    FOR ALL USING (true);

CREATE POLICY "warehouse_functional_structure_policy" ON public.warehouse_functional_structure
    FOR ALL USING (true);

CREATE POLICY "warehouse_system_config_policy" ON public.warehouse_system_config
    FOR ALL USING (true);

-- إدراج مخزن إداري افتراضي
INSERT INTO public.warehouses (
    name, 
    location, 
    warehouse_level, 
    is_admin_warehouse,
    admin_settings,
    functional_structure,
    system_configuration
) VALUES (
    'الإدارة العليا للمخازن',
    'المقر الرئيسي',
    'admin',
    TRUE,
    '{"global_management": true, "hierarchy_control": true, "system_oversight": true}',
    '{"departments": ["إدارة المخازن", "المراقبة", "التطوير", "الدعم الفني"]}',
    '{"inventory_management": true, "security_level": "high", "notification_system": true}'
) ON CONFLICT (name) DO NOTHING;

-- تعليق على الجداول
COMMENT ON TABLE public.warehouse_admin_settings IS 'إعدادات الإدارة العليا للمخازن';
COMMENT ON TABLE public.warehouse_functional_structure IS 'الهيكل الوظيفي للإدارة العليا';
COMMENT ON TABLE public.warehouse_system_config IS 'إعدادات النظام للإدارة العليا';

COMMENT ON COLUMN public.warehouses.warehouse_level IS 'مستوى المخزن: admin, country, city, district';
COMMENT ON COLUMN public.warehouses.is_admin_warehouse IS 'هل هو مخزن إداري عليا';
COMMENT ON COLUMN public.warehouses.admin_settings IS 'إعدادات الإدارة العليا';
COMMENT ON COLUMN public.warehouses.functional_structure IS 'الهيكل الوظيفي';
COMMENT ON COLUMN public.warehouses.system_configuration IS 'إعدادات النظام';
