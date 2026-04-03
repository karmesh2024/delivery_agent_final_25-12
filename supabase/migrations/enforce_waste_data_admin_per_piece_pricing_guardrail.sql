-- =================================================================
-- Guardrail: منع منتج بنظام نقاط per_piece مع وزن > 0 بدون تسعير بالكيلو
-- =================================================================
-- القاعدة:
--  - ممنوع أن يكون المنتج:
--      points_mode = 'per_piece'
--      AND weight > 0
--      AND price_per_kg IS NULL
--  الهدف: إذا كان هناك وزن معرف للقطعة، يجب أن يكون هناك تسعير بالكيلو
--         أو يكون المنتج بلا وزن (weight = 0) إذا كان النقاط فقط بالقطعة.
-- =================================================================

ALTER TABLE public.waste_data_admin
ADD CONSTRAINT waste_data_admin_per_piece_pricing_guardrail_chk
CHECK (
  NOT (
    points_mode = 'per_piece'
    AND weight > 0
    AND price_per_kg IS NULL
  )
);

COMMENT ON CONSTRAINT waste_data_admin_per_piece_pricing_guardrail_chk ON public.waste_data_admin IS
'Guardrail: يمنع منتج بنظام نقاط per_piece أن يملك وزناً أكبر من صفر بدون تحديد تسعير بالكيلو في price_per_kg.';

