-- =====================================================
-- الجزء الأول: إنشاء الجداول الأساسية
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
