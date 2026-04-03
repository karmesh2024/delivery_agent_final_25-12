-- إضافة حقول الخصم إلى جدول store_products
ALTER TABLE public.store_products
ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2);

COMMENT ON COLUMN public.store_products.is_on_sale IS 'هل المنتج عليه خصم حالياً';
COMMENT ON COLUMN public.store_products.sale_price IS 'سعر المنتج بعد الخصم';
