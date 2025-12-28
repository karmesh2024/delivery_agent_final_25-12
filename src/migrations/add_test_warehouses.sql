-- إضافة مخازن تجريبية بسيطة للنظام الهرمي
-- تشغيل هذا الملف لإضافة مخازن للاختبار

-- إضافة الأعمدة الهرمية إذا لم تكن موجودة
ALTER TABLE public.warehouses 
ADD COLUMN IF NOT EXISTS warehouse_level VARCHAR(20),
ADD COLUMN IF NOT EXISTS parent_warehouse_id INTEGER REFERENCES public.warehouses(id),
ADD COLUMN IF NOT EXISTS hierarchy_path TEXT,
ADD COLUMN IF NOT EXISTS is_main_warehouse BOOLEAN DEFAULT FALSE;

-- إضافة مخزن رئيسي للاختبار
INSERT INTO public.warehouses (name, location, warehouse_level, is_main_warehouse, capacity, manager_name, contact_phone, warehouse_type, is_active) 
VALUES ('مخزن القاهرة الرئيسي', 'القاهرة - مصر', 'country', TRUE, 1000, 'أحمد محمد', '01234567890', 'products', TRUE)
ON CONFLICT (name) DO NOTHING;

-- إضافة مخزن مدينة للاختبار
INSERT INTO public.warehouses (name, location, warehouse_level, parent_warehouse_id, capacity, manager_name, contact_phone, warehouse_type, is_active) 
VALUES ('مخزن الجيزة', 'الجيزة - مصر', 'city', 
        (SELECT id FROM public.warehouses WHERE name = 'مخزن القاهرة الرئيسي'), 
        500, 'محمد أحمد', '01234567891', 'products', TRUE)
ON CONFLICT (name) DO NOTHING;

-- إضافة مخزن منطقة للاختبار
INSERT INTO public.warehouses (name, location, warehouse_level, parent_warehouse_id, capacity, manager_name, contact_phone, warehouse_type, is_active) 
VALUES ('مخزن الدقي', 'الدقي - الجيزة', 'district',
        (SELECT id FROM public.warehouses WHERE name = 'مخزن الجيزة'), 
        200, 'سارة أحمد', '01234567892', 'products', TRUE)
ON CONFLICT (name) DO NOTHING;

-- تحديث المخازن الموجودة لتشمل مستوى افتراضي
UPDATE public.warehouses 
SET warehouse_level = 'district', 
    is_main_warehouse = FALSE
WHERE warehouse_level IS NULL;

-- عرض النتائج
SELECT 'تم إضافة المخازن التجريبية بنجاح!' as message;
SELECT id, name, warehouse_level, parent_warehouse_id FROM public.warehouses WHERE is_active = TRUE ORDER BY warehouse_level, name;
