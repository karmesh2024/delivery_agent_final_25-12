-- =================================================================
-- إضافة نظام نقاط لكل قطعة (Points Per Piece)
-- تاريخ: يناير 2026
-- =================================================================
-- الهدف: إضافة حقول نقاط القطعة في points_configurations
--        وإضافة حقل quantity في waste_collection_items
--        هذا النظام للمستخدمين فقط (ليس للوكلاء)
-- =================================================================

-- 1. إضافة حقول نقاط القطعة إلى points_configurations
ALTER TABLE public.points_configurations
ADD COLUMN IF NOT EXISTS points_per_piece INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS point_value_per_piece DECIMAL(10, 4) DEFAULT 0;

COMMENT ON COLUMN public.points_configurations.points_per_piece IS 
'عدد النقاط لكل قطعة (للمستخدمين فقط - مثل علبة 14 جرام = 3 نقاط)';

COMMENT ON COLUMN public.points_configurations.point_value_per_piece IS 
'قيمة النقطة لكل قطعة (يحددها المستخدم)';

-- 2. إضافة حقل quantity إلى waste_collection_items
ALTER TABLE public.waste_collection_items
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

COMMENT ON COLUMN public.waste_collection_items.quantity IS 
'عدد القطع (للمنتجات المعدودة بالقطعة)';

-- 3. إنشاء Index لتحسين الأداء (اختياري)
CREATE INDEX IF NOT EXISTS idx_waste_collection_items_quantity 
ON public.waste_collection_items(quantity) 
WHERE quantity IS NOT NULL AND quantity > 1;
