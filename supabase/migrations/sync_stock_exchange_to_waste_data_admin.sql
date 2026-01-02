-- Migration: مزامنة stock_exchange مع waste_data_admin
-- عند تحديث buy_price في stock_exchange، يتم تحديث price و price_per_kg في waste_data_admin تلقائياً

-- 1. إنشاء function لتحديث waste_data_admin عند تحديث stock_exchange
CREATE OR REPLACE FUNCTION sync_waste_data_admin_price_from_stock_exchange()
RETURNS TRIGGER AS $$
DECLARE
  v_weight DOUBLE PRECISION;
  v_price_unit_price DOUBLE PRECISION;
BEGIN
  -- تحديث waste_data_admin عند تحديث buy_price في stock_exchange
  IF NEW.buy_price IS NOT NULL AND NEW.buy_price != OLD.buy_price THEN
    -- جلب وزن الوحدة من waste_data_admin
    SELECT weight INTO v_weight
    FROM waste_data_admin
    WHERE id = NEW.product_id;
    
    -- إذا كان الوزن موجوداً، نحسب سعر الوحدة
    -- العلاقة: price_per_kg = (price / weight) * 1000
    -- إذن: price = (price_per_kg * weight) / 1000
    IF v_weight IS NOT NULL AND v_weight > 0 THEN
      v_price_unit_price := (NEW.buy_price * v_weight) / 1000;
      
      UPDATE waste_data_admin
      SET 
        price = v_price_unit_price,
        price_per_kg = NEW.buy_price,
        updated_at = NOW()
      WHERE id = NEW.product_id;
      
      RAISE NOTICE 'تم تحديث waste_data_admin للمنتج %: سعر الكيلو = %, سعر الوحدة = % (الوزن = %)', 
        NEW.product_id, NEW.buy_price, v_price_unit_price, v_weight;
    ELSE
      -- إذا لم يكن الوزن موجوداً، نحدث price_per_kg فقط
      UPDATE waste_data_admin
      SET 
        price_per_kg = NEW.buy_price,
        updated_at = NOW()
      WHERE id = NEW.product_id;
      
      RAISE NOTICE 'تم تحديث price_per_kg فقط للمنتج %: سعر الكيلو = % (الوزن غير موجود)', 
        NEW.product_id, NEW.buy_price;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. إنشاء trigger على stock_exchange لتحديث waste_data_admin
DROP TRIGGER IF EXISTS trigger_sync_waste_data_admin_price ON stock_exchange;
CREATE TRIGGER trigger_sync_waste_data_admin_price
AFTER UPDATE ON stock_exchange
FOR EACH ROW
WHEN (NEW.buy_price IS NOT NULL AND (OLD.buy_price IS NULL OR NEW.buy_price != OLD.buy_price))
EXECUTE FUNCTION sync_waste_data_admin_price_from_stock_exchange();

-- 3. تحديث waste_data_admin للمنتجات الموجودة حالياً
-- تحديث price_per_kg فقط (سعر الكيلو)
-- price (سعر الوحدة) سيتم تحديثه تلقائياً من trigger calculate_price_per_kg عند تحديث price_per_kg
UPDATE waste_data_admin wda
SET 
  price_per_kg = se.buy_price,
  updated_at = NOW()
FROM stock_exchange se
WHERE wda.id = se.product_id
  AND se.buy_price IS NOT NULL
  AND wda.weight IS NOT NULL
  AND wda.weight > 0
  AND (wda.price_per_kg IS NULL OR wda.price_per_kg != se.buy_price);

-- بعد تحديث price_per_kg، trigger calculate_price_per_kg سيحدث price تلقائياً
-- لكن نحتاج لتحديث price يدوياً هنا لأن trigger calculate_price_per_kg يعمل فقط عند INSERT/UPDATE على waste_data_admin
UPDATE waste_data_admin wda
SET 
  price = (wda.price_per_kg * wda.weight) / 1000,
  updated_at = NOW()
FROM stock_exchange se
WHERE wda.id = se.product_id
  AND se.buy_price IS NOT NULL
  AND wda.weight IS NOT NULL
  AND wda.weight > 0
  AND wda.price_per_kg = se.buy_price;

COMMENT ON FUNCTION sync_waste_data_admin_price_from_stock_exchange() IS 'مزامنة تلقائية لأسعار waste_data_admin مع stock_exchange عند تحديث buy_price';

