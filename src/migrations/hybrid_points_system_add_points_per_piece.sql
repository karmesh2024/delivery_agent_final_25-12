-- =================================================================
-- دمج نقاط القطعة (points_per_piece) في حساب الجلسة
-- Hybrid Points System - Integrate points_per_piece as piece_points
-- تاريخ: يناير 2026
-- =================================================================
-- الهدف: إضافة "نقاط لكل قطعة" من إعدادات النقاط (points_configurations)
--        كـ piece_points تُضاف إلى bonus_points عند إتمام الجلسة.
--        هذا النظام للمستخدمين فقط (waste_collection_sessions)
--        الوكلاء لهم نظام منفصل في agent_collections
-- التسعير: من صفحة إدارة النقاط /financial-management/points/settings
-- =================================================================

CREATE OR REPLACE FUNCTION public.calculate_session_points()
RETURNS TRIGGER AS $$
DECLARE
    v_total_value DECIMAL(12,2);
    v_points_per_egp INTEGER;
    v_base_points INTEGER;
    v_bonus_points INTEGER;
    v_gift_points INTEGER := 0;
    v_piece_points INTEGER := 0;
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
        
        -- 4. حساب نقاط الهدية (من points_per_kg لكل عنصر)
        -- أولوية: إعداد المنتج (product_id = waste_data_id) ثم الفئة الفرعية ككل (product_id IS NULL)
        -- مصدر points_per_kg: points_configurations من product_id أو subcategory_id أو waste_sub_categories
        -- ملاحظة: هذه الجلسة للمستخدمين (waste_collection_sessions)، لذا نتحقق من points_per_kg_applies_to:
        --         - 'agents_only' → لا نعطي نقاط الكيلو جرام
        --         - 'customers_only' أو 'both' → نعطي نقاط الكيلو جرام
        IF EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'points_configurations') THEN
            SELECT COALESCE(SUM(
                (wci.actual_weight * CASE
                    WHEN COALESCE(pc_product.points_per_kg_applies_to, pc_direct.points_per_kg_applies_to, pc_via_wsc.points_per_kg_applies_to, 'both') IN ('agents_only') THEN 0
                    ELSE COALESCE(
                        pc_product.points_per_kg,
                        pc_direct.points_per_kg,
                        pc_via_wsc.points_per_kg,
                        0
                    )
                END)::NUMERIC
            ), 0)::INTEGER INTO v_gift_points
            FROM waste_collection_items wci
            LEFT JOIN points_configurations pc_product
                ON pc_product.product_id = wci.waste_data_id
                AND pc_product.is_active = true
            LEFT JOIN points_configurations pc_direct
                ON pc_direct.subcategory_id = wci.subcategory_id
                AND pc_direct.product_id IS NULL
                AND pc_direct.is_active = true
            LEFT JOIN waste_data_admin wda ON wda.id = wci.waste_data_id
            LEFT JOIN waste_sub_categories wsc ON wsc.id = wda.subcategory_id
            LEFT JOIN points_configurations pc_via_wsc
                ON pc_via_wsc.id = wsc.points_configuration_id
                AND pc_via_wsc.is_active = true
            WHERE wci.session_id = NEW.id;
        END IF;
        v_gift_points := COALESCE(v_gift_points, 0);
        
        -- 5. حساب نقاط القطعة (من points_per_piece لكل عنصر)
        -- أولوية: إعداد المنتج ثم الفئة الفرعية ككل (للمستخدمين فقط)
        IF EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'points_configurations') THEN
            SELECT COALESCE(SUM(
                (COALESCE(wci.quantity, 1) * COALESCE(
                    pc_product.points_per_piece,
                    pc_direct.points_per_piece,
                    pc_via_wsc.points_per_piece,
                    0
                ))::NUMERIC
            ), 0)::INTEGER INTO v_piece_points
            FROM waste_collection_items wci
            LEFT JOIN points_configurations pc_product
                ON pc_product.product_id = wci.waste_data_id
                AND pc_product.is_active = true
            LEFT JOIN points_configurations pc_direct
                ON pc_direct.subcategory_id = wci.subcategory_id
                AND pc_direct.product_id IS NULL
                AND pc_direct.is_active = true
            LEFT JOIN waste_data_admin wda ON wda.id = wci.waste_data_id
            LEFT JOIN waste_sub_categories wsc ON wsc.id = wda.subcategory_id
            LEFT JOIN points_configurations pc_via_wsc
                ON pc_via_wsc.id = wsc.points_configuration_id
                AND pc_via_wsc.is_active = true
            WHERE wci.session_id = NEW.id
            AND COALESCE(wci.quantity, 1) > 0;
        END IF;
        v_piece_points := COALESCE(v_piece_points, 0);
        
        -- 6. حساب نقاط المتجر (البونص) من القواعد، ثم إضافة نقاط الهدية ونقاط القطعة
        BEGIN
            v_bonus_points := public.calculate_store_points_bonus(
                NEW.customer_id,
                v_base_points
            );
        EXCEPTION
            WHEN OTHERS THEN
                v_bonus_points := 0;
        END;
        v_bonus_points := v_bonus_points + v_gift_points + v_piece_points;
        
        NEW.bonus_points := v_bonus_points;
        NEW.total_points := v_base_points + v_bonus_points;
        
        -- 7. جلب الرصيد الحالي
        v_customer_wallet := public.get_customer_wallet_balance(NEW.customer_id);
        
        -- 8. منح نقاط المتجر فوراً (بما فيها نقاط الهدية ونقاط القطعة)
        IF v_bonus_points > 0 THEN
            PERFORM public.update_store_points(
                NEW.customer_id,
                v_bonus_points,
                'add'
            );
        END IF;
        
        -- 9. تسجيل في Audit Log (للمحفظة - معلق)
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
            (v_customer_wallet * 100)::INTEGER,
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

-- إعادة ربط الـ Trigger إن وُجد
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'waste_collection_sessions') THEN
    DROP TRIGGER IF EXISTS trigger_calculate_session_points ON public.waste_collection_sessions;
    CREATE TRIGGER trigger_calculate_session_points
    BEFORE UPDATE ON public.waste_collection_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_session_points();
  END IF;
END $$;

COMMENT ON FUNCTION public.calculate_session_points IS 
'حساب النقاط الأساسية، نقاط الهدية (من points_per_kg)، نقاط القطعة (من points_per_piece للمستخدمين فقط)، والبونص عند إتمام جلسة التجميع';
