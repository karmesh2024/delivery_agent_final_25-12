-- Migration: إضافة حقل last_actual_purchase_price في stock_exchange
-- هذا الحقل يتتبع آخر سعر تم الشراء به فعلياً من العملاء
-- يتم تحديثه تلقائياً عند كل عملية شراء من order_details

-- 1. إضافة الحقل الجديد
ALTER TABLE stock_exchange
ADD COLUMN IF NOT EXISTS last_actual_purchase_price DECIMAL(12, 2) DEFAULT NULL;

COMMENT ON COLUMN stock_exchange.last_actual_purchase_price IS 'آخر سعر تم الشراء به فعلياً من العملاء (من order_details)';

-- 2. إنشاء function لتحديث last_actual_purchase_price
CREATE OR REPLACE FUNCTION update_last_actual_purchase_price()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID;
  v_stock_exchange_id INTEGER;
  v_price DECIMAL(12, 2);
BEGIN
  -- التحقق من أن الطلب تم إتمامه (status = 'completed')
  -- نحتاج إلى ربط order_details مع stock_exchange
  
  -- البحث عن stock_exchange_id بناءً على product_name أو category_name/subcategory_name
  -- أولاً: محاولة الربط عبر waste_data_admin.name = order_details.product_name
  SELECT se.id, se.product_id
  INTO v_stock_exchange_id, v_product_id
  FROM stock_exchange se
  INNER JOIN waste_data_admin wda ON wda.id = se.product_id
  WHERE wda.name = NEW.product_name
  LIMIT 1;
  
  -- إذا لم نجد، نحاول الربط عبر category_name و subcategory_name
  IF v_stock_exchange_id IS NULL AND NEW.category_name IS NOT NULL THEN
    SELECT se.id, se.product_id
    INTO v_stock_exchange_id, v_product_id
    FROM stock_exchange se
    INNER JOIN categories c ON c.id = se.category_id
    WHERE c.name = NEW.category_name
      AND (NEW.subcategory_name IS NULL OR EXISTS (
        SELECT 1 FROM subcategories sc 
        WHERE sc.id = se.subcategory_id 
        AND sc.name = NEW.subcategory_name
      ))
    LIMIT 1;
  END IF;
  
  -- إذا وجدنا stock_exchange_id، نحدث last_actual_purchase_price
  IF v_stock_exchange_id IS NOT NULL THEN
    v_price := NEW.price;
    
    -- تحديث last_actual_purchase_price في stock_exchange
    UPDATE stock_exchange
    SET last_actual_purchase_price = v_price,
        last_update = NOW()
    WHERE id = v_stock_exchange_id;
    
    RAISE NOTICE 'تم تحديث last_actual_purchase_price للمنتج % إلى %', v_product_id, v_price;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. إنشاء trigger لتحديث last_actual_purchase_price عند إضافة order_details
-- يتم التحديث فقط عند إتمام الطلب (status = 'completed')
CREATE OR REPLACE FUNCTION update_last_actual_purchase_price_on_order_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_order_status TEXT;
  v_product_id UUID;
  v_stock_exchange_id INTEGER;
  v_price DECIMAL(12, 2);
BEGIN
  -- جلب حالة الطلب
  SELECT status INTO v_order_status
  FROM delivery_orders
  WHERE id = NEW.delivery_order_id;
  
  -- تحديث last_actual_purchase_price فقط إذا كان الطلب مكتملاً
  IF v_order_status = 'completed' THEN
    -- البحث عن stock_exchange_id بناءً على product_name
    SELECT se.id, se.product_id
    INTO v_stock_exchange_id, v_product_id
    FROM stock_exchange se
    INNER JOIN waste_data_admin wda ON wda.id = se.product_id
    WHERE wda.name = NEW.product_name
    LIMIT 1;
    
    -- إذا لم نجد، نحاول الربط عبر category_name و subcategory_name
    IF v_stock_exchange_id IS NULL AND NEW.category_name IS NOT NULL THEN
      SELECT se.id, se.product_id
      INTO v_stock_exchange_id, v_product_id
      FROM stock_exchange se
      INNER JOIN categories c ON c.id = se.category_id
      WHERE c.name = NEW.category_name
        AND (NEW.subcategory_name IS NULL OR EXISTS (
          SELECT 1 FROM subcategories sc 
          WHERE sc.id = se.subcategory_id 
          AND sc.name = NEW.subcategory_name
        ))
      LIMIT 1;
    END IF;
    
    -- إذا وجدنا stock_exchange_id، نحدث last_actual_purchase_price
    IF v_stock_exchange_id IS NOT NULL THEN
      v_price := NEW.price;
      
      -- تحديث last_actual_purchase_price في stock_exchange
      UPDATE stock_exchange
      SET last_actual_purchase_price = v_price,
          last_update = NOW()
      WHERE id = v_stock_exchange_id;
      
      RAISE NOTICE 'تم تحديث last_actual_purchase_price للمنتج % إلى %', v_product_id, v_price;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger على order_details
DROP TRIGGER IF EXISTS trigger_update_last_actual_purchase_price ON order_details;
CREATE TRIGGER trigger_update_last_actual_purchase_price
AFTER INSERT OR UPDATE ON order_details
FOR EACH ROW
WHEN (NEW.delivery_order_id IS NOT NULL)
EXECUTE FUNCTION update_last_actual_purchase_price_on_order_complete();

-- 4. إنشاء trigger على delivery_orders لتحديث last_actual_purchase_price عند تغيير حالة الطلب
CREATE OR REPLACE FUNCTION update_last_actual_purchase_price_on_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_order_detail RECORD;
  v_product_id UUID;
  v_stock_exchange_id INTEGER;
  v_price DECIMAL(12, 2);
BEGIN
  -- تحديث last_actual_purchase_price فقط إذا تم إتمام الطلب
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- جلب جميع order_details لهذا الطلب
    FOR v_order_detail IN 
      SELECT * FROM order_details WHERE delivery_order_id = NEW.id
    LOOP
      -- البحث عن stock_exchange_id بناءً على product_name
      SELECT se.id, se.product_id
      INTO v_stock_exchange_id, v_product_id
      FROM stock_exchange se
      INNER JOIN waste_data_admin wda ON wda.id = se.product_id
      WHERE wda.name = v_order_detail.product_name
      LIMIT 1;
      
      -- إذا لم نجد، نحاول الربط عبر category_name و subcategory_name
      IF v_stock_exchange_id IS NULL AND v_order_detail.category_name IS NOT NULL THEN
        SELECT se.id, se.product_id
        INTO v_stock_exchange_id, v_product_id
        FROM stock_exchange se
        INNER JOIN categories c ON c.id = se.category_id
        WHERE c.name = v_order_detail.category_name
          AND (v_order_detail.subcategory_name IS NULL OR EXISTS (
            SELECT 1 FROM subcategories sc 
            WHERE sc.id = se.subcategory_id 
            AND sc.name = v_order_detail.subcategory_name
          ))
        LIMIT 1;
      END IF;
      
      -- إذا وجدنا stock_exchange_id، نحدث last_actual_purchase_price
      IF v_stock_exchange_id IS NOT NULL THEN
        v_price := v_order_detail.price;
        
        -- تحديث last_actual_purchase_price في stock_exchange
        UPDATE stock_exchange
        SET last_actual_purchase_price = v_price,
            last_update = NOW()
        WHERE id = v_stock_exchange_id;
        
        RAISE NOTICE 'تم تحديث last_actual_purchase_price للمنتج % إلى %', v_product_id, v_price;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger على delivery_orders
DROP TRIGGER IF EXISTS trigger_update_last_actual_purchase_price_on_status_change ON delivery_orders;
CREATE TRIGGER trigger_update_last_actual_purchase_price_on_status_change
AFTER UPDATE ON delivery_orders
FOR EACH ROW
WHEN (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed'))
EXECUTE FUNCTION update_last_actual_purchase_price_on_order_status_change();

