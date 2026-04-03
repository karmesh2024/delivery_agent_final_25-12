-- =====================================================
-- كتالوج منتجات المتجر من إدارة التنظيم والتسلسل
-- Store Catalog Products (قطاع → تصنيف → فئة أساسية → فئة فرعية → منتج)
-- =====================================================
-- يُدار من نفس الهيكل: warehouse_sectors → unified_classifications
-- → unified_main_categories → unified_sub_categories → store_catalog_products
-- مع إمكانية ربط النقاط والبراندز.
-- =====================================================

-- إنشاء الجدول فقط إذا كانت الجداول الموحدة موجودة (من migration unified_categories_system)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'unified_sub_categories') THEN
    CREATE TABLE IF NOT EXISTS public.store_catalog_products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      unified_sub_category_id UUID NOT NULL REFERENCES public.unified_sub_categories(id) ON DELETE CASCADE,
      name VARCHAR(200) NOT NULL,
      name_ar VARCHAR(200),
      description TEXT,
      description_en TEXT,
      image_url TEXT,
      sku VARCHAR(100) NOT NULL,
      barcode VARCHAR(100),
      default_selling_price DECIMAL(10,2),
      cost_price DECIMAL(10,2),
      profit_margin DECIMAL(5,2),
      loyalty_points_earned INT DEFAULT 0,
      brand_id UUID REFERENCES public.unified_brands(id) ON DELETE SET NULL,
      weight DECIMAL(10,2),
      measurement_unit VARCHAR(20) DEFAULT 'piece',
      is_active BOOLEAN DEFAULT true,
      visible_to_client_app BOOLEAN DEFAULT true,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT store_catalog_products_sku_unique UNIQUE (sku)
    );

    COMMENT ON TABLE public.store_catalog_products IS 'منتجات كتالوج المتجر المعرّفة من إدارة التنظيم: قطاع → تصنيف → فئة أساسية → فئة فرعية → منتج. أسعار افتراضية ونقاط وبراندز.';
    CREATE INDEX IF NOT EXISTS idx_store_catalog_products_sub_category ON public.store_catalog_products(unified_sub_category_id);
    CREATE INDEX IF NOT EXISTS idx_store_catalog_products_brand ON public.store_catalog_products(brand_id);
    CREATE INDEX IF NOT EXISTS idx_store_catalog_products_sku ON public.store_catalog_products(sku);
    CREATE INDEX IF NOT EXISTS idx_store_catalog_products_active ON public.store_catalog_products(is_active);
  END IF;
END $$;

-- إضافة عمود ربط منتج المتجر بكتالوج التنظيم
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'store_catalog_products') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_products' AND column_name = 'store_catalog_product_id') THEN
      ALTER TABLE public.store_products
        ADD COLUMN store_catalog_product_id UUID REFERENCES public.store_catalog_products(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_store_products_store_catalog_product_id
        ON public.store_products(store_catalog_product_id) WHERE store_catalog_product_id IS NOT NULL;
      COMMENT ON COLUMN public.store_products.store_catalog_product_id IS 'ربط بمنتج كتالوج المتجر من إدارة التنظيم.';
    END IF;
  END IF;
END $$;
