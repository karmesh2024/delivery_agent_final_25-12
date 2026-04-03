-- =====================================================
-- ربط كتالوج المنتجات (catalog_products) بالتنظيم الموحد
-- كما هو الحال مع المخلفات في كتالوج المخازن
-- =====================================================
-- يسمح بعرض منتجات الكتالوج ضمن هيكل: قطاع → تصنيف → فئة أساسية → فئة فرعية
-- ومزامنة المنتجات المعرّفة من إدارة التنظيم (store_catalog_products) مع كتالوج المخازن.
-- =====================================================

-- إضافة عمود الربط بالفئة الفرعية الموحدة (إن وُجد جدول unified_sub_categories)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'unified_sub_categories') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'catalog_products' AND column_name = 'unified_sub_category_id') THEN
      ALTER TABLE public.catalog_products
        ADD COLUMN unified_sub_category_id UUID REFERENCES public.unified_sub_categories(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_catalog_products_unified_sub_category
        ON public.catalog_products(unified_sub_category_id)
        WHERE unified_sub_category_id IS NOT NULL;
      COMMENT ON COLUMN public.catalog_products.unified_sub_category_id IS 'ربط المنتج بالتنظيم: قطاع → تصنيف → فئة أساسية → فئة فرعية (مثل المخلفات)';
    END IF;
  END IF;
END $$;
