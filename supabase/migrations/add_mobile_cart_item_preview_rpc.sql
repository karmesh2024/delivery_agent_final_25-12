-- =================================================================
-- RPC: معاينة بند سلة للموبايل (سعر/وزن/نقاط) من الباك إند
-- =================================================================
-- الهدف:
--  - الموبايل يرسل product_id + (quantity أو weight_kg)
--  - الباك إند يرجع:
--      * الوزن الكلي المحسوب
--      * السعر الكلي المحسوب (من سعر الكيلو في البورصة)
--      * نقاط البند (حسب points_mode وإعداد النقاط الفعّال)
--  - لتقديم Preview دقيق داخل السلة بدون حساب محلي
-- ملاحظة مهمة:
-- عند تعديل نوع الـ RETURN TABLE لا يمكن استخدام CREATE OR REPLACE فقط،
-- لذلك نحذف الـ Function القديمة إن وجدت ثم ننشئها من جديد.
-- =================================================================

DROP FUNCTION IF EXISTS public.preview_mobile_cart_item(UUID, INTEGER, NUMERIC);

CREATE FUNCTION public.preview_mobile_cart_item(
  p_product_id UUID,
  p_quantity INTEGER DEFAULT NULL,
  p_weight_kg NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  product_id UUID,
  counting_method TEXT,
  points_mode TEXT,
  price_per_kg NUMERIC,
  unit_weight_kg NUMERIC,
  input_quantity INTEGER,
  input_weight_kg NUMERIC,
  total_weight_kg NUMERIC,
  unit_price_per_piece NUMERIC,
  total_price NUMERIC,
  customer_points_per_kg INTEGER,
  customer_points_per_piece INTEGER,
  estimated_points INTEGER,
  estimated_points_type TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_product RECORD;
  v_buy_price NUMERIC := 0;
  v_pc_product RECORD;
  v_pc_default RECORD;
  v_points_per_kg INTEGER := 0;
  v_points_per_piece INTEGER := 0;
  v_points_per_kg_applies_to TEXT := 'both';
  v_total_weight NUMERIC := 0;
  v_qty INTEGER := COALESCE(p_quantity, 0);
  v_input_weight NUMERIC := COALESCE(p_weight_kg, 0);
  v_unit_weight_kg NUMERIC := NULL;
BEGIN
  -- 1) المنتج
  SELECT
    wda.id,
    wda.subcategory_id,
    -- اشتقاق counting_method ديناميكياً من points_mode لتفادي الاعتماد على عمود غير موجود
    CASE
      WHEN COALESCE(wda.points_mode, 'per_kg') = 'per_piece' THEN 'pieces'
      ELSE 'weight'
    END AS counting_method,
    COALESCE(wda.points_mode, 'per_kg') AS points_mode,
    COALESCE(wda.weight, 0) AS unit_weight_grams
  INTO v_product
  FROM public.waste_data_admin wda
  WHERE wda.id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;

  -- 2) سعر الكيلو من البورصة (buy_price)
  SELECT COALESCE(se.buy_price, 0)
  INTO v_buy_price
  FROM public.stock_exchange se
  WHERE se.sub_category_id = v_product.subcategory_id
  ORDER BY se.last_update DESC
  LIMIT 1;

  -- 3) إعداد النقاط الفعّال: المنتج ثم الافتراضي للفئة
  SELECT
    pc.points_per_kg,
    pc.points_per_kg_applies_to,
    pc.points_per_piece
  INTO v_pc_product
  FROM public.points_configurations pc
  WHERE pc.product_id = p_product_id
    AND pc.is_active = true
  LIMIT 1;

  SELECT
    pc.points_per_kg,
    pc.points_per_kg_applies_to,
    pc.points_per_piece
  INTO v_pc_default
  FROM public.points_configurations pc
  JOIN public.waste_sub_categories wsc ON wsc.points_configuration_id = pc.id
  WHERE wsc.id = v_product.subcategory_id
    AND pc.is_active = true
  LIMIT 1;

  v_points_per_kg := COALESCE(v_pc_product.points_per_kg, v_pc_default.points_per_kg, 0);
  v_points_per_piece := COALESCE(v_pc_product.points_per_piece, v_pc_default.points_per_piece, 0);
  v_points_per_kg_applies_to := COALESCE(v_pc_product.points_per_kg_applies_to, v_pc_default.points_per_kg_applies_to, 'both');

  IF v_points_per_kg_applies_to = 'agents_only' THEN
    v_points_per_kg := 0;
  END IF;

  -- 4) حساب الوزن الكلي
  -- ملاحظة: نظامك الحالي يتعامل مع وزن القطعة مخزن بالجرام عندما counting_method = pieces
  IF v_product.counting_method = 'pieces' THEN
    v_unit_weight_kg := (COALESCE(v_product.unit_weight_grams, 0) / 1000.0);
    v_total_weight := v_unit_weight_kg * v_qty;
    v_input_weight := v_total_weight; -- وزن مُشتق
  ELSE
    v_total_weight := v_input_weight;
    v_unit_weight_kg := NULL;
  END IF;

  RETURN QUERY
  SELECT
    p_product_id AS product_id,
    v_product.counting_method AS counting_method,
    v_product.points_mode AS points_mode,
    COALESCE(v_buy_price, 0) AS price_per_kg,
    v_unit_weight_kg AS unit_weight_kg,
    v_qty AS input_quantity,
    v_input_weight AS input_weight_kg,
    v_total_weight AS total_weight_kg,
    CASE
      WHEN v_product.counting_method = 'pieces' THEN v_unit_weight_kg * COALESCE(v_buy_price, 0)
      ELSE NULL
    END AS unit_price_per_piece,
    (v_total_weight * COALESCE(v_buy_price, 0)) AS total_price,
    v_points_per_kg AS customer_points_per_kg,
    v_points_per_piece AS customer_points_per_piece,
    -- توحيد حقل النقاط المقدرة مع نوعها
    CASE
      WHEN v_product.points_mode = 'per_kg' THEN FLOOR(v_total_weight * v_points_per_kg)::INTEGER
      WHEN v_product.points_mode = 'per_piece' THEN (v_qty * v_points_per_piece)
      ELSE 0
    END AS estimated_points,
    CASE
      WHEN v_product.points_mode = 'per_kg' THEN 'weight'
      WHEN v_product.points_mode = 'per_piece' THEN 'piece'
      ELSE 'unknown'
    END AS estimated_points_type;
END;
$$;

COMMENT ON FUNCTION public.preview_mobile_cart_item(UUID, INTEGER, NUMERIC)
IS 'RPC للموبايل: معاينة بند سلة (وزن/سعر/نقاط) من الباك إند لتجنب الحساب المحلي.';

