-- =====================================================
-- إضافة حقل item_type إلى unified_brands
-- Add item_type field to unified_brands table
-- =====================================================
-- هذا الملف يضيف حقل item_type لتقسيم البراندز إلى:
-- - منتجات (product)
-- - مخلفات وروبابيكيا ومستعمل (waste)
-- - كليهما (both)
-- =====================================================

-- إضافة حقل item_type إلى unified_brands
ALTER TABLE public.unified_brands
ADD COLUMN IF NOT EXISTS item_type item_type_enum NOT NULL DEFAULT 'both';

-- إضافة index لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_unified_brands_item_type ON public.unified_brands(item_type);

-- تحديث التعليقات
COMMENT ON COLUMN public.unified_brands.item_type IS 'نوع البراند: product (منتج), waste (مخلف/روبابيكيا/مستعمل), both (كليهما)';

-- تحديث البراندز الموجودة (اختياري - يمكن تخصيصها حسب البيانات الموجودة)
-- UPDATE public.unified_brands SET item_type = 'product' WHERE ...;
-- UPDATE public.unified_brands SET item_type = 'waste' WHERE ...;

