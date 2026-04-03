-- إعدادات النقاط لمنتجات المتجر (فئات رئيسية/فرعية/منتجات) — منفصلة عن المخلفات
-- الهدف: تمييز واضح بين إعدادات النقاط للمخلفات (points_configurations) وإعدادات النقاط للمتجر (store_points_configurations)
-- بدون تداخل: كل جدول يخص نطاقه (المخلفات vs المتجر)

CREATE TABLE IF NOT EXISTS public.store_points_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_subcategory_id UUID NOT NULL REFERENCES public.store_subcategories(id) ON DELETE CASCADE,
  store_product_id UUID NULL REFERENCES public.store_products(id) ON DELETE CASCADE,
  points_strategy TEXT NOT NULL DEFAULT 'WEIGHT_BASED',
  points_per_kg INTEGER NOT NULL DEFAULT 0,
  points_per_kg_applies_to VARCHAR(20) DEFAULT 'both',
  price_per_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
  point_value DECIMAL(10, 4) NOT NULL DEFAULT 0,
  points_per_piece INTEGER DEFAULT 0,
  point_value_per_piece DECIMAL(10, 4) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  min_weight DECIMAL(5, 2) DEFAULT 0,
  max_weight DECIMAL(5, 2) DEFAULT 999.99,
  bonus_multiplier DECIMAL(3, 2) DEFAULT 1.00,
  description TEXT NULL,
  effective_from TIMESTAMPTZ NULL,
  effective_to TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT store_points_configurations_strategy_chk
    CHECK (points_strategy IN ('WEIGHT_BASED', 'PIECE_BASED', 'HYBRID', 'BONUS_ONLY', 'NO_POINTS'))
);

COMMENT ON TABLE public.store_points_configurations IS
  'إعدادات النقاط لفئات ومنتجات المتجر فقط — منفصلة عن points_configurations (المخلفات). يطبق على الفئات الرئيسية/الفرعية/المنتجات للمتجر دون تداخل مع إعدادات المخلفات.';

CREATE UNIQUE INDEX store_points_configurations_unique
ON public.store_points_configurations (
  store_subcategory_id,
  COALESCE(store_product_id::text, '00000000-0000-0000-0000-000000000000')
);

CREATE INDEX idx_store_points_configurations_store_subcategory_id
ON public.store_points_configurations (store_subcategory_id);

CREATE INDEX idx_store_points_configurations_store_product_id
ON public.store_points_configurations (store_product_id);

CREATE INDEX idx_store_points_configurations_is_active
ON public.store_points_configurations (is_active);

CREATE INDEX idx_store_points_configurations_effective_window
ON public.store_points_configurations (is_active, effective_from, effective_to);
