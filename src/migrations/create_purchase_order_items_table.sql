-- Create purchase_order_items table for storing items in purchase orders
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  catalog_product_id BIGINT REFERENCES public.catalog_products(id) ON DELETE SET NULL,
  catalog_waste_id BIGINT REFERENCES public.catalog_waste_materials(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.store_products(id) ON DELETE SET NULL,
  sku TEXT,
  name TEXT NOT NULL,
  quantity DECIMAL(12, 3) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) DEFAULT 0,
  total_price DECIMAL(12, 2) DEFAULT 0,
  measurement_unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_catalog_product ON public.purchase_order_items(catalog_product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_catalog_waste ON public.purchase_order_items(catalog_waste_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product ON public.purchase_order_items(product_id);

-- Add comments
COMMENT ON TABLE public.purchase_order_items IS 'بنود أوامر الشراء - يمكن أن تكون منتجات أو مخلفات';
COMMENT ON COLUMN public.purchase_order_items.catalog_product_id IS 'مرجع لمنتج من كتالوج المنتجات';
COMMENT ON COLUMN public.purchase_order_items.catalog_waste_id IS 'مرجع لمخلفات من كتالوج المخلفات';
COMMENT ON COLUMN public.purchase_order_items.product_id IS 'مرجع لمنتج من store_products';
COMMENT ON COLUMN public.purchase_order_items.sku IS 'SKU للمنتج/المخلفات';
COMMENT ON COLUMN public.purchase_order_items.name IS 'اسم المنتج/المخلفات';
COMMENT ON COLUMN public.purchase_order_items.quantity IS 'الكمية المطلوبة';
COMMENT ON COLUMN public.purchase_order_items.unit_price IS 'سعر الوحدة المتوقع';
COMMENT ON COLUMN public.purchase_order_items.total_price IS 'السعر الإجمالي للبند';

