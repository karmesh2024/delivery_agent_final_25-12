-- =================================================================
-- RPC: جلب منتجات فئة فرعية للموبايل مع بيانات التسعير والنقاط
-- =================================================================
-- الهدف:
--  - إرجاع قائمة المنتجات تحت waste_sub_categories.id (BIGINT)
--  - مع تعريف طريقة الإدخال (وزن/قطعة) + طريقة النقاط (كيلو/قطعة)
--  - ومع سعر الكيلو من البورصة (stock_exchange.buy_price)
--  - ومع إعداد النقاط الفعّال (points_configurations) للمنتج أو الافتراضي للفئة
-- ملاحظة مهمة:
-- عند تعديل نوع الـ RETURN TABLE لا يمكن استخدام CREATE OR REPLACE فقط،
-- لذلك نحذف الـ Function القديمة إن وجدت ثم ننشئها من جديد.
-- =================================================================

DROP FUNCTION IF EXISTS public.get_mobile_products_by_waste_subcategory(BIGINT);

CREATE FUNCTION public.get_mobile_products_by_waste_subcategory(
  p_waste_subcategory_id BIGINT
)
RETURNS TABLE (
  product_id UUID,
  name TEXT,
  image_url TEXT,
  waste_subcategory_id BIGINT,
  counting_method TEXT,
  points_mode TEXT,
  pricing_mode TEXT,
  unit_weight_grams NUMERIC,
  unit_weight_kg NUMERIC,
  price_per_kg NUMERIC,
  unit_price_per_piece NUMERIC,
  customer_points_per_kg INTEGER,
  customer_points_per_piece INTEGER,
  point_value_per_kg NUMERIC,
  point_value_per_piece NUMERIC,
  is_priced BOOLEAN,
  is_points_configured BOOLEAN,
  display_hint TEXT,
  is_available_for_collection BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
  WITH wsc AS (
    SELECT id, points_configuration_id
    FROM public.waste_sub_categories
    WHERE id = p_waste_subcategory_id
    LIMIT 1
  ),
  latest_price AS (
    SELECT se.sub_category_id, se.buy_price
    FROM public.stock_exchange se
    WHERE se.sub_category_id = p_waste_subcategory_id
    ORDER BY se.last_update DESC
    LIMIT 1
  )
  SELECT
    wda.id AS product_id,
    wda.name,
    wda.image_url,
    wda.subcategory_id AS waste_subcategory_id,
    -- اشتقاق counting_method ديناميكياً من points_mode لتفادي الاعتماد على عمود غير موجود
    CASE
      WHEN COALESCE(wda.points_mode, 'per_kg') = 'per_piece' THEN 'pieces'
      ELSE 'weight'
    END AS counting_method,
    COALESCE(wda.points_mode, 'per_kg') AS points_mode,
    COALESCE(wda.pricing_mode, COALESCE(wda.points_mode, 'per_kg')) AS pricing_mode,
    -- وزن القطعة المخزن تاريخياً: في كثير من المنطق موجود بالجرام عندما يكون المنتج يُعامل كقطع
    CASE
      WHEN COALESCE(wda.points_mode, 'per_kg') = 'per_piece' THEN COALESCE(wda.weight, 0)
      ELSE NULL
    END AS unit_weight_grams,
    CASE
      WHEN COALESCE(wda.points_mode, 'per_kg') = 'per_piece' THEN COALESCE(wda.weight, 0) / 1000.0
      ELSE NULL
    END AS unit_weight_kg,
    COALESCE(lp.buy_price, 0) AS price_per_kg,
    CASE
      WHEN COALESCE(wda.points_mode, 'per_kg') = 'per_piece' THEN (COALESCE(wda.weight, 0) / 1000.0) * COALESCE(lp.buy_price, 0)
      ELSE NULL
    END AS unit_price_per_piece,
    -- إعداد النقاط الفعّال: أولوية إعداد المنتج ثم إعداد الفئة (points_configuration_id)
    CASE
      WHEN COALESCE(pc_eff.points_per_kg_applies_to, 'both') = 'agents_only' THEN 0
      ELSE COALESCE(pc_eff.points_per_kg, 0)
    END AS customer_points_per_kg,
    COALESCE(pc_eff.points_per_piece, 0) AS customer_points_per_piece,
    COALESCE(pc_eff.point_value, 0) AS point_value_per_kg,
    COALESCE(pc_eff.point_value_per_piece, 0) AS point_value_per_piece,
    (COALESCE(lp.buy_price, 0) > 0) AS is_priced,
    (COALESCE(pc_eff.points_per_kg, 0) > 0 OR COALESCE(pc_eff.points_per_piece, 0) > 0) AS is_points_configured,
    -- تلميح عرض جاهز للـ UI في تطبيق الموبايل
    CASE
      WHEN COALESCE(wda.points_mode, 'per_kg') = 'per_piece' THEN 'بالقطعة'
      ELSE 'بالكيلو'
    END AS display_hint,
    -- جاهزية المنتج للاستلام: يجب أن يكون له سعر ونقاط مهيأة
    (
      (COALESCE(lp.buy_price, 0) > 0)
      AND
      (COALESCE(pc_eff.points_per_kg, 0) > 0 OR COALESCE(pc_eff.points_per_piece, 0) > 0)
    ) AS is_available_for_collection
  FROM public.waste_data_admin wda
  JOIN wsc ON wsc.id = wda.subcategory_id
  LEFT JOIN latest_price lp ON lp.sub_category_id = wda.subcategory_id
  LEFT JOIN public.points_configurations pc_product
    ON pc_product.product_id = wda.id
    AND pc_product.is_active = true
  LEFT JOIN public.points_configurations pc_default
    ON pc_default.id = wsc.points_configuration_id
    AND pc_default.is_active = true
  LEFT JOIN LATERAL (
    SELECT
      COALESCE(pc_product.points_per_kg, pc_default.points_per_kg) AS points_per_kg,
      COALESCE(pc_product.points_per_kg_applies_to, pc_default.points_per_kg_applies_to, 'both') AS points_per_kg_applies_to,
      COALESCE(pc_product.point_value, pc_default.point_value) AS point_value,
      COALESCE(pc_product.points_per_piece, pc_default.points_per_piece) AS points_per_piece,
      COALESCE(pc_product.point_value_per_piece, pc_default.point_value_per_piece) AS point_value_per_piece
  ) pc_eff ON TRUE
  ORDER BY wda.name ASC;
$$;

COMMENT ON FUNCTION public.get_mobile_products_by_waste_subcategory(BIGINT)
IS 'RPC للموبايل: قائمة منتجات فئة فرعية مع سعر الكيلو من البورصة + نظام الإدخال (وزن/قطعة) + نظام النقاط (كيلو/قطعة) + إعداد النقاط الفعّال.';

