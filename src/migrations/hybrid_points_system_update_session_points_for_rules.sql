-- =================================================================
-- Hybrid Points System - Update calculate_session_points for Rules
-- تاريخ: يناير 2026
-- الهدف: تحديث calculate_session_points() لاستخدام قواعد store_points
-- المرجع: تقرير المستشار المالي
-- =================================================================

-- ================================================================
-- تحديث Function: calculate_session_points()
-- استخدام calculate_store_points_bonus() بدلاً من v_bonus_points := 0
-- ================================================================

CREATE OR REPLACE FUNCTION public.calculate_session_points()
RETURNS TRIGGER AS $$
DECLARE
    v_total_value DECIMAL(12,2);
    v_points_per_egp INTEGER;
    v_base_points INTEGER;
    v_bonus_points INTEGER;
    v_customer_wallet DECIMAL(12,2);
BEGIN
    -- فقط عند تغيير الحالة إلى completed
    IF NEW.status = 'completed' AND 
       (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- 1. حساب القيمة المالية الإجمالية
        SELECT COALESCE(SUM(total_price), 0) INTO v_total_value
        FROM waste_collection_items
        WHERE session_id = NEW.id;
        
        NEW.total_value := v_total_value;
        
        -- 2. جلب معامل التحويل
        SELECT points_per_egp INTO v_points_per_egp
        FROM points_configuration
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT 1;
        
        v_points_per_egp := COALESCE(v_points_per_egp, 100);
        
        -- 3. حساب النقاط الأساسية
        v_base_points := FLOOR(v_total_value * v_points_per_egp);
        NEW.base_points := v_base_points;
        
        -- 4. حساب نقاط المتجر (البونص) - استخدام القواعد
        -- محاولة استخدام calculate_store_points_bonus إذا كان موجوداً
        BEGIN
            v_bonus_points := public.calculate_store_points_bonus(
                NEW.customer_id,
                v_base_points
            );
        EXCEPTION
            WHEN OTHERS THEN
                -- إذا لم تكن Function موجودة بعد، استخدم 0
                v_bonus_points := 0;
        END;
        
        NEW.bonus_points := v_bonus_points;
        NEW.total_points := v_base_points + v_bonus_points;
        
        -- 5. جلب الرصيد الحالي
        v_customer_wallet := public.get_customer_wallet_balance(NEW.customer_id);
        
        -- 6. منح نقاط المتجر فوراً (إذا كان هناك بونص)
        IF v_bonus_points > 0 THEN
            PERFORM public.update_store_points(
                NEW.customer_id,
                v_bonus_points,
                'add'
            );
        END IF;
        
        -- 7. تسجيل في Audit Log (للمحفظة - معلق)
        INSERT INTO points_transactions (
            profile_id,
            type,
            amount,
            before_balance,
            after_balance,
            source,
            reference_id,
            description
        ) VALUES (
            NEW.customer_id,
            'wallet',
            v_base_points,
            (v_customer_wallet * 100)::INTEGER,
            (v_customer_wallet * 100)::INTEGER, -- لا يزال معلق
            'waste_collection_session',
            NEW.id,
            'نقاط محفظة من جلسة تجميع (معلق حتى التسوية)'
        );
        
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'خطأ في calculate_session_points: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_session_points IS 
'حساب النقاط الأساسية والبونص عند إتمام جلسة التجميع - يستخدم قواعد store_points';

-- ================================================================
-- نهاية Migration
-- =================================================================
