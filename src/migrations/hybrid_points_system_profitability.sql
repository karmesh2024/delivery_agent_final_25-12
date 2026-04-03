-- =================================================================
-- Hybrid Points System - Profitability Module
-- تاريخ: يناير 2026
-- الهدف: إضافة حسابات الربحية (sell_price + profit)
-- المرجع: تقرير المستشار المالي + الرد على التقرير
-- =================================================================

-- ================================================================
-- 0) إضافة sell_price إلى stock_exchange إن لم يكن موجوداً
-- ================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'stock_exchange') THEN
    
    -- إضافة sell_price إن لم يكن موجوداً
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'stock_exchange' 
      AND column_name = 'sell_price'
    ) THEN
      ALTER TABLE public.stock_exchange
      ADD COLUMN sell_price DECIMAL(10,2);
      
      COMMENT ON COLUMN public.stock_exchange.sell_price IS 
      'سعر البيع لشركات التدوير';
      
      -- استخدام buy_price × 1.2 كقيمة افتراضية
      UPDATE public.stock_exchange
      SET sell_price = buy_price * 1.2
      WHERE sell_price IS NULL;
    END IF;
  END IF;
END $$;

-- ================================================================
-- 1) تحديث waste_collection_items
-- ================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'waste_collection_items') THEN
    
    -- إضافة sell_price
    ALTER TABLE public.waste_collection_items
    ADD COLUMN IF NOT EXISTS sell_price DECIMAL(10,2);
    
    COMMENT ON COLUMN public.waste_collection_items.sell_price IS 
    'سعر البيع لشركات التدوير (مجمد عند الجلسة)';
    
    -- إضافة item_profit
    ALTER TABLE public.waste_collection_items
    ADD COLUMN IF NOT EXISTS item_profit DECIMAL(10,2);
    
    COMMENT ON COLUMN public.waste_collection_items.item_profit IS 
    'ربح هذا العنصر = (sell_price - buy_price) × weight';
  END IF;
END $$;

-- ================================================================
-- 2) تحديث waste_collection_sessions
-- ================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'waste_collection_sessions') THEN
    
    -- إضافة buy_total
    ALTER TABLE public.waste_collection_sessions
    ADD COLUMN IF NOT EXISTS buy_total DECIMAL(12,2);
    
    COMMENT ON COLUMN public.waste_collection_sessions.buy_total IS 
    'إجمالي الشراء من العميل (ما ندفعه)';
    
    -- إضافة sell_total
    ALTER TABLE public.waste_collection_sessions
    ADD COLUMN IF NOT EXISTS sell_total DECIMAL(12,2);
    
    COMMENT ON COLUMN public.waste_collection_sessions.sell_total IS 
    'إجمالي البيع لشركات التدوير (ما نحصل عليه)';
    
    -- إضافة platform_profit
    ALTER TABLE public.waste_collection_sessions
    ADD COLUMN IF NOT EXISTS platform_profit DECIMAL(12,2);
    
    COMMENT ON COLUMN public.waste_collection_sessions.platform_profit IS 
    'ربح المنصة = sell_total - buy_total';
    
    -- إضافة profit_margin
    ALTER TABLE public.waste_collection_sessions
    ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2);
    
    COMMENT ON COLUMN public.waste_collection_sessions.profit_margin IS 
    'هامش الربح (%) = (profit / buy_total) × 100';
  END IF;
END $$;

-- ================================================================
-- 3) تحديث Function: calculate_collection_item()
-- إضافة تجميد sell_price وحساب الربح
-- ================================================================

CREATE OR REPLACE FUNCTION public.calculate_collection_item()
RETURNS TRIGGER AS $$
DECLARE
    v_product RECORD;
    v_buy_price DECIMAL(10,2);
    v_sell_price DECIMAL(10,2);  -- ⭐ جديد
    v_total_weight DECIMAL(10,3);
    v_item_value DECIMAL(10,2);
    v_item_profit DECIMAL(10,2);  -- ⭐ جديد
BEGIN
    -- 1. جلب بيانات المنتج
    SELECT 
        wda.weight,
        wda.subcategory_id,
        wda.counting_method
    INTO v_product
    FROM waste_data_admin wda
    WHERE wda.id = NEW.waste_data_id;
    
    IF NOT FOUND THEN
        RAISE WARNING 'المنتج غير موجود: %', NEW.waste_data_id;
        RETURN NEW;
    END IF;
    
    -- 2. حساب الوزن
    IF v_product.counting_method = 'pieces' THEN
        v_total_weight := COALESCE((v_product.weight / 1000.0) * NEW.quantity, 0);
    ELSIF v_product.counting_method = 'weight' THEN
        v_total_weight := COALESCE(NEW.actual_weight, NEW.weight, 0);
    ELSE
        v_total_weight := COALESCE(NEW.weight, 0);
    END IF;
    
    NEW.total_weight := v_total_weight;
    
    -- 3. ⭐ جلب وتجميد كلا السعرين (فقط عند INSERT)
    IF TG_OP = 'INSERT' THEN
        -- محاولة جلب sell_price من stock_exchange
        SELECT buy_price, COALESCE(sell_price, buy_price * 1.2)  -- افتراضي: 20% ربح
        INTO v_buy_price, v_sell_price
        FROM stock_exchange
        WHERE sub_category_id = v_product.subcategory_id
        ORDER BY last_update DESC
        LIMIT 1;
        
        -- إذا لم يوجد sell_price في stock_exchange، استخدم buy_price × 1.2
        v_buy_price := COALESCE(v_buy_price, 0);
        v_sell_price := COALESCE(v_sell_price, v_buy_price * 1.2);
        
        NEW.unit_price := v_buy_price;      -- ⭐ تجميد سعر الشراء
        NEW.sell_price := v_sell_price;     -- ⭐ تجميد سعر البيع
    ELSE
        -- في UPDATE: استخدام الأسعار المجمدة الموجود
        v_buy_price := COALESCE(NEW.unit_price, OLD.unit_price, 0);
        v_sell_price := COALESCE(NEW.sell_price, OLD.sell_price, v_buy_price * 1.2);
    END IF;
    
    -- 4. حساب القيمة المالية (الشراء من العميل)
    v_item_value := v_total_weight * v_buy_price;
    NEW.total_price := v_item_value;
    
    -- 5. ⭐ حساب ربح هذا العنصر
    v_item_profit := v_total_weight * (v_sell_price - v_buy_price);
    NEW.item_profit := v_item_profit;
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'خطأ في calculate_collection_item: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_collection_item IS 
'حساب القيمة المالية وتجميد الأسعار (buy + sell) وحساب الربح';

-- ================================================================
-- 4) Function: update_session_totals()
-- تحديث إجماليات الجلسة (buy_total, sell_total, profit)
-- ================================================================

CREATE OR REPLACE FUNCTION public.update_session_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_session_id UUID;
    v_buy_total DECIMAL(12,2);
    v_sell_total DECIMAL(12,2);
    v_profit DECIMAL(12,2);
    v_profit_margin DECIMAL(5,2);
BEGIN
    v_session_id := COALESCE(NEW.session_id, OLD.session_id);
    
    IF v_session_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- حساب الإجماليات من العناصر
    SELECT 
        COALESCE(SUM(total_price), 0),                    -- buy_total
        COALESCE(SUM(total_weight * COALESCE(sell_price, unit_price * 1.2)), 0),  -- sell_total
        COALESCE(SUM(item_profit), 0)                     -- platform_profit
    INTO v_buy_total, v_sell_total, v_profit
    FROM waste_collection_items
    WHERE session_id = v_session_id;
    
    -- حساب هامش الربح
    v_profit_margin := CASE 
        WHEN v_buy_total > 0 THEN (v_profit / v_buy_total * 100)
        ELSE 0 
    END;
    
    -- تحديث الجلسة
    UPDATE waste_collection_sessions
    SET 
        total_value = v_buy_total,        -- إجمالي الشراء من العميل
        buy_total = v_buy_total,           -- ⭐ جديد
        sell_total = v_sell_total,         -- ⭐ جديد
        platform_profit = v_profit,        -- ⭐ جديد
        profit_margin = v_profit_margin,   -- ⭐ جديد
        updated_at = NOW()
    WHERE id = v_session_id;
    
    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'خطأ في update_session_totals: %', SQLERRM;
        RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- إنشاء Trigger إذا كان الجدول موجوداً
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'waste_collection_items') THEN
    DROP TRIGGER IF EXISTS trigger_update_session_totals ON public.waste_collection_items;
    CREATE TRIGGER trigger_update_session_totals
    AFTER INSERT OR UPDATE OR DELETE ON public.waste_collection_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_session_totals();
  END IF;
END $$;

COMMENT ON FUNCTION public.update_session_totals IS 
'تحديث إجماليات الجلسة (buy_total, sell_total, profit) تلقائياً';

-- ================================================================
-- 5) تحديث calculate_session_points() لاستخدام buy_total
-- ================================================================

-- ملاحظة: calculate_session_points() موجودة بالفعل
-- سنستخدم total_value (الذي يساوي buy_total) في الحساب

-- ================================================================
-- نهاية Migration
-- =================================================================
