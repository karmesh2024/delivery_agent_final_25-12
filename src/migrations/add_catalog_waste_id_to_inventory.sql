-- Migration: إضافة catalog_waste_id إلى inventory_movements و warehouse_inventory
-- هذا يسمح بربط مباشر مع catalog_waste_materials حتى لو لم يكن هناك waste_data_admin

-- 1. إضافة catalog_waste_id إلى inventory_movements
ALTER TABLE public.inventory_movements
ADD COLUMN IF NOT EXISTS catalog_waste_id BIGINT REFERENCES public.catalog_waste_materials(id) ON DELETE SET NULL;

-- 2. إضافة catalog_waste_id إلى warehouse_inventory
ALTER TABLE public.warehouse_inventory
ADD COLUMN IF NOT EXISTS catalog_waste_id BIGINT REFERENCES public.catalog_waste_materials(id) ON DELETE SET NULL;

-- 3. إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_inventory_movements_catalog_waste_id 
ON public.inventory_movements(catalog_waste_id);

CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_catalog_waste_id 
ON public.warehouse_inventory(catalog_waste_id);

-- 4. تحديث Trigger لدعم catalog_waste_id
CREATE OR REPLACE FUNCTION public.update_inventory_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.movement_type = 'in' THEN
    -- إضافة للمخزون
    -- محاولة استخدام product_id أولاً، ثم catalog_waste_id
    IF NEW.product_id IS NOT NULL THEN
      -- استخدام product_id (الطريقة القديمة)
      INSERT INTO warehouse_inventory 
        (warehouse_id, product_id, category_id, subcategory_id, quantity, unit, catalog_waste_id)
      VALUES 
        (NEW.warehouse_id, NEW.product_id, NEW.category_id, NEW.subcategory_id, NEW.quantity, NEW.unit, NEW.catalog_waste_id)
      ON CONFLICT (warehouse_id, product_id) 
      DO UPDATE SET
        quantity = warehouse_inventory.quantity + NEW.quantity,
        last_updated = NOW(),
        catalog_waste_id = COALESCE(warehouse_inventory.catalog_waste_id, NEW.catalog_waste_id);
    ELSIF NEW.catalog_waste_id IS NOT NULL THEN
      -- استخدام catalog_waste_id (الطريقة الجديدة)
      INSERT INTO warehouse_inventory 
        (warehouse_id, catalog_waste_id, category_id, subcategory_id, quantity, unit)
      VALUES 
        (NEW.warehouse_id, NEW.catalog_waste_id, NEW.category_id, NEW.subcategory_id, NEW.quantity, NEW.unit)
      ON CONFLICT (warehouse_id, catalog_waste_id) 
      DO UPDATE SET
        quantity = warehouse_inventory.quantity + NEW.quantity,
        last_updated = NOW();
    END IF;
  ELSIF NEW.movement_type = 'out' THEN
    -- خصم من المخزون
    IF NEW.product_id IS NOT NULL THEN
      UPDATE warehouse_inventory
      SET 
        quantity = GREATEST(0, quantity - NEW.quantity),
        last_updated = NOW()
      WHERE 
        warehouse_id = NEW.warehouse_id AND product_id = NEW.product_id;
    ELSIF NEW.catalog_waste_id IS NOT NULL THEN
      UPDATE warehouse_inventory
      SET 
        quantity = GREATEST(0, quantity - NEW.quantity),
        last_updated = NOW()
      WHERE 
        warehouse_id = NEW.warehouse_id AND catalog_waste_id = NEW.catalog_waste_id;
    END IF;
  END IF;
  
  -- تحديث إجمالي المخزون في المخزن
  UPDATE warehouses
  SET 
    current_stock = (SELECT COALESCE(SUM(quantity), 0) FROM warehouse_inventory WHERE warehouse_id = NEW.warehouse_id),
    updated_at = NOW()
  WHERE id = NEW.warehouse_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. تحديث unique constraint في warehouse_inventory لدعم catalog_waste_id
-- ملاحظة: قد نحتاج إلى إزالة constraint القديم أولاً إذا كان موجوداً
-- لكن سنتركه كما هو لتجنب كسر البيانات الموجودة

-- 6. إضافة unique constraint جديد لـ (warehouse_id, catalog_waste_id)
-- لكن فقط إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'warehouse_inventory_warehouse_catalog_waste_unique'
  ) THEN
    ALTER TABLE warehouse_inventory
    ADD CONSTRAINT warehouse_inventory_warehouse_catalog_waste_unique 
    UNIQUE (warehouse_id, catalog_waste_id);
  END IF;
END $$;

-- 7. تعليقات
COMMENT ON COLUMN public.inventory_movements.catalog_waste_id IS 'ربط مباشر مع catalog_waste_materials (بديل عن product_id)';
COMMENT ON COLUMN public.warehouse_inventory.catalog_waste_id IS 'ربط مباشر مع catalog_waste_materials (بديل عن product_id)';

