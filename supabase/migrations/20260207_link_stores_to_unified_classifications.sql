-- =====================================================
-- ربط المتاجر بالتصنيفات الموحدة
-- Link stores to unified classifications (إدارة التسلسل والتنظيم)
-- =====================================================
-- عند ربط متجر بتصنيف: الفئات المضافة من إدارة التسلسل تظهر في المتجر
-- عند إضافة تصنيف جديد مع خيار "إنشاء متجر": يُنشأ متجر ويربط بهذا التصنيف
-- =====================================================

-- إضافة عمود ربط المتجر بالتصنيف الموحد
ALTER TABLE public.store_shops
ADD COLUMN IF NOT EXISTS unified_classification_id UUID NULL
REFERENCES public.unified_classifications(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.store_shops.unified_classification_id IS 'ربط المتجر بتصنيف من إدارة التسلسل والتنظيم - عند الربط تُزامن الفئات الأساسية والفرعية';

CREATE INDEX IF NOT EXISTS idx_store_shops_unified_classification
ON public.store_shops(unified_classification_id);
