-- إضافة أعمدة الظهور للفئات والمنتجات (تطبيق العميل / تطبيق الوكيل / تحت الانتظار)
-- 2026-01-29

-- الفئات الأساسية
ALTER TABLE waste_main_categories
  ADD COLUMN IF NOT EXISTS visible_to_client_app BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visible_to_agent_app BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN waste_main_categories.visible_to_client_app IS 'يظهر في تطبيق العميل عند true';
COMMENT ON COLUMN waste_main_categories.visible_to_agent_app IS 'يظهر في تطبيق الوكيل عند true';

-- الفئات الفرعية
ALTER TABLE waste_sub_categories
  ADD COLUMN IF NOT EXISTS visible_to_client_app BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visible_to_agent_app BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN waste_sub_categories.visible_to_client_app IS 'يظهر في تطبيق العميل عند true';
COMMENT ON COLUMN waste_sub_categories.visible_to_agent_app IS 'يظهر في تطبيق الوكيل عند true';

-- المنتجات (waste_data_admin)
ALTER TABLE waste_data_admin
  ADD COLUMN IF NOT EXISTS visible_to_client_app BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visible_to_agent_app BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN waste_data_admin.visible_to_client_app IS 'يظهر في تطبيق العميل عند true';
COMMENT ON COLUMN waste_data_admin.visible_to_agent_app IS 'يظهر في تطبيق الوكيل عند true';

-- فهارس للاستعلامات حسب الظهور
CREATE INDEX IF NOT EXISTS idx_waste_main_categories_visible_client ON waste_main_categories(visible_to_client_app) WHERE visible_to_client_app = true;
CREATE INDEX IF NOT EXISTS idx_waste_main_categories_visible_agent ON waste_main_categories(visible_to_agent_app) WHERE visible_to_agent_app = true;
CREATE INDEX IF NOT EXISTS idx_waste_sub_categories_visible_client ON waste_sub_categories(visible_to_client_app) WHERE visible_to_client_app = true;
CREATE INDEX IF NOT EXISTS idx_waste_sub_categories_visible_agent ON waste_sub_categories(visible_to_agent_app) WHERE visible_to_agent_app = true;
CREATE INDEX IF NOT EXISTS idx_waste_data_admin_visible_client ON waste_data_admin(visible_to_client_app) WHERE visible_to_client_app = true;
CREATE INDEX IF NOT EXISTS idx_waste_data_admin_visible_agent ON waste_data_admin(visible_to_agent_app) WHERE visible_to_agent_app = true;
