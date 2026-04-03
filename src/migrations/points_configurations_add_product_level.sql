-- =================================================================
-- إضافة دعم إعداد النقاط على مستوى المنتج
-- تاريخ: يناير 2026
-- =================================================================
-- الهدف: السماح بإعداد النقاط إما للفئة الفرعية ككل (product_id = NULL)
--        أو لمنتج محدد تحت الفئة (product_id = waste_data_admin.id)
-- =================================================================

-- 1. إضافة عمود product_id
ALTER TABLE public.points_configurations
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.waste_data_admin(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.points_configurations.product_id IS 
'عند NULL = إعداد للفئة الفرعية ككل؛ عند تحديده = إعداد خاص لهذا المنتج فقط';

-- 2. إزالة القيد الفريد الحالي على subcategory_id
ALTER TABLE public.points_configurations
DROP CONSTRAINT IF EXISTS points_configurations_subcategory_id_key;

-- 3. قيد فريد: إعداد واحد فقط للفئة ككل (عندما product_id فارغ)
CREATE UNIQUE INDEX IF NOT EXISTS idx_points_config_subcategory_default
ON public.points_configurations (subcategory_id)
WHERE product_id IS NULL;

-- 4. قيد فريد: إعداد واحد فقط لكل منتج
CREATE UNIQUE INDEX IF NOT EXISTS idx_points_config_product
ON public.points_configurations (product_id)
WHERE product_id IS NOT NULL;

-- 5. فهرس لتسريع البحث عند الحساب
CREATE INDEX IF NOT EXISTS idx_points_configurations_product_id
ON public.points_configurations (product_id)
WHERE product_id IS NOT NULL;
