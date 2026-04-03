-- =================================================================
-- Hybrid Points System Functions
-- تاريخ: يناير 2026
-- الهدف: Functions و Triggers لنظام النقاط الهجين
-- المرجع: docs/دليل_التنفيذ_للداش_بورد.md
-- =================================================================

-- ================================================================
-- 0) Helper Function: update_wallet_balance
-- دالة مساعدة لتحديث المحفظة في أي جدول موجود
-- ================================================================

CREATE OR REPLACE FUNCTION public.update_wallet_balance(
    p_customer_id UUID,
    p_amount DECIMAL(12,2),
    p_operation TEXT DEFAULT 'add' -- 'add' or 'subtract'
)
RETURNS VOID AS $$
BEGIN
    -- تحديث new_profiles أولاً (الجدول الأساسي للعملاء)
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'new_profiles') THEN
        UPDATE public.new_profiles
        SET 
            wallet_balance = CASE 
                WHEN p_operation = 'add' THEN COALESCE(wallet_balance, 0) + p_amount
                ELSE GREATEST(0, COALESCE(wallet_balance, 0) - ABS(p_amount))
            END,
            updated_at = NOW()
        WHERE id = p_customer_id;
    END IF;
    
    -- تحديث profiles إن وجد (للتوافق مع الأنظمة القديمة)
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        UPDATE public.profiles
        SET 
            wallet_balance = CASE 
                WHEN p_operation = 'add' THEN COALESCE(wallet_balance, 0) + p_amount
                ELSE GREATEST(0, COALESCE(wallet_balance, 0) - ABS(p_amount))
            END,
            updated_at = NOW()
        WHERE id = p_customer_id;
    END IF;
    
    -- تحديث customers إن وجد (للتوافق)
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'customers') THEN
        UPDATE public.customers
        SET 
            wallet_balance = CASE 
                WHEN p_operation = 'add' THEN COALESCE(wallet_balance, 0) + p_amount
                ELSE GREATEST(0, COALESCE(wallet_balance, 0) - ABS(p_amount))
            END,
            updated_at = NOW()
        WHERE id = p_customer_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- Helper Function: update_store_points
-- دالة مساعدة لتحديث نقاط المتجر في أي جدول موجود
-- ================================================================

CREATE OR REPLACE FUNCTION public.update_store_points(
    p_customer_id UUID,
    p_points INTEGER,
    p_operation TEXT DEFAULT 'add' -- 'add' or 'subtract'
)
RETURNS VOID AS $$
BEGIN
    -- تحديث new_profiles أولاً (الجدول الأساسي للعملاء)
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'new_profiles') THEN
        UPDATE public.new_profiles
        SET 
            store_points = CASE 
                WHEN p_operation = 'add' THEN COALESCE(store_points, 0) + p_points
                ELSE GREATEST(0, COALESCE(store_points, 0) - ABS(p_points))
            END,
            updated_at = NOW()
        WHERE id = p_customer_id;
    END IF;
    
    -- تحديث profiles إن وجد (للتوافق مع الأنظمة القديمة)
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        UPDATE public.profiles
        SET 
            store_points = CASE 
                WHEN p_operation = 'add' THEN COALESCE(store_points, 0) + p_points
                ELSE GREATEST(0, COALESCE(store_points, 0) - ABS(p_points))
            END,
            updated_at = NOW()
        WHERE id = p_customer_id;
    END IF;
    
    -- تحديث customers إن وجد (للتوافق)
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'customers') THEN
        UPDATE public.customers
        SET 
            store_points = CASE 
                WHEN p_operation = 'add' THEN COALESCE(store_points, 0) + p_points
                ELSE GREATEST(0, COALESCE(store_points, 0) - ABS(p_points))
            END,
            updated_at = NOW()
        WHERE id = p_customer_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- Helper Function: get_customer_wallet_balance
-- دالة مساعدة لجلب رصيد المحفظة من أي جدول موجود
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_customer_wallet_balance(p_customer_id UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    v_balance DECIMAL(12,2) := 0;
BEGIN
    -- محاولة من new_profiles أولاً (الجدول الأساسي للعملاء)
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'new_profiles') THEN
        SELECT COALESCE(wallet_balance, 0) INTO v_balance
        FROM public.new_profiles
        WHERE id = p_customer_id;
        
        IF v_balance IS NOT NULL THEN
            RETURN v_balance;
        END IF;
    END IF;
    
    -- محاولة من profiles (للتوافق مع الأنظمة القديمة)
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        SELECT COALESCE(wallet_balance, 0) INTO v_balance
        FROM public.profiles
        WHERE id = p_customer_id;
        
        IF v_balance IS NOT NULL THEN
            RETURN v_balance;
        END IF;
    END IF;
    
    -- محاولة من customers (للتوافق)
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'customers') THEN
        SELECT COALESCE(wallet_balance, 0) INTO v_balance
        FROM public.customers
        WHERE id = p_customer_id;
    END IF;
    
    RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- Helper Function: get_customer_store_points
-- دالة مساعدة لجلب نقاط المتجر من أي جدول موجود
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_customer_store_points(p_customer_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_points INTEGER := 0;
BEGIN
    -- محاولة من new_profiles أولاً (الجدول الأساسي للعملاء)
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'new_profiles') THEN
        SELECT COALESCE(store_points, 0) INTO v_points
        FROM public.new_profiles
        WHERE id = p_customer_id;
        
        IF v_points IS NOT NULL THEN
            RETURN v_points;
        END IF;
    END IF;
    
    -- محاولة من profiles (للتوافق مع الأنظمة القديمة)
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        SELECT COALESCE(store_points, 0) INTO v_points
        FROM public.profiles
        WHERE id = p_customer_id;
        
        IF v_points IS NOT NULL THEN
            RETURN v_points;
        END IF;
    END IF;
    
    -- محاولة من customers (للتوافق)
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'customers') THEN
        SELECT COALESCE(store_points, 0) INTO v_points
        FROM public.customers
        WHERE id = p_customer_id;
    END IF;
    
    RETURN COALESCE(v_points, 0);
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 1) Function: check_unsettled_sessions
-- التحقق من الجلسات غير المقفلة
-- ================================================================

CREATE OR REPLACE FUNCTION public.check_unsettled_sessions(p_customer_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM waste_collection_sessions
    WHERE customer_id = p_customer_id
      AND status = 'completed'
      AND is_settled = false;
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.check_unsettled_sessions IS 
'التحقق من عدد الجلسات غير المقفلة لعميل معين';

-- ================================================================
-- 2) Function: calculate_collection_item
-- حساب القيمة المالية وتجميد السعر
-- ================================================================

CREATE OR REPLACE FUNCTION public.calculate_collection_item()
RETURNS TRIGGER AS $$
DECLARE
    v_product RECORD;
    v_buy_price DECIMAL(10,2);
    v_total_weight DECIMAL(10,3);
    v_item_value DECIMAL(10,2);
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
        -- إذا لم يتم إيجاد المنتج، استخدم القيم الافتراضية
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
    
    -- 3. ⭐ تجميد السعر (فقط عند INSERT)
    IF TG_OP = 'INSERT' THEN
        SELECT buy_price INTO v_buy_price
        FROM stock_exchange
        WHERE sub_category_id = v_product.subcategory_id
        ORDER BY last_update DESC
        LIMIT 1;
        
        v_buy_price := COALESCE(v_buy_price, 0);
        NEW.unit_price := v_buy_price; -- ⭐ تجميد السعر
    ELSE
        -- في UPDATE: استخدام السعر المجمد الموجود
        v_buy_price := COALESCE(NEW.unit_price, OLD.unit_price, 0);
    END IF;
    
    -- 4. حساب القيمة المالية
    v_item_value := v_total_weight * v_buy_price;
    NEW.total_price := v_item_value;
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'خطأ في calculate_collection_item: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء Trigger إذا كان الجدول موجوداً
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'waste_collection_items') THEN
    DROP TRIGGER IF EXISTS trigger_calculate_collection_item ON public.waste_collection_items;
    CREATE TRIGGER trigger_calculate_collection_item
    BEFORE INSERT OR UPDATE ON public.waste_collection_items
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_collection_item();
  END IF;
END $$;

COMMENT ON FUNCTION public.calculate_collection_item IS 
'حساب القيمة المالية لعنصر التجميع وتجميد سعر البورصة';

-- ================================================================
-- 3) Function: calculate_session_points
-- حساب النقاط الأساسية والبونص عند إتمام الجلسة
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

-- إنشاء Trigger إذا كان الجدول موجوداً
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
'حساب النقاط الأساسية والبونص عند إتمام جلسة التجميع';

-- ================================================================
-- 4) Function: settle_collection_session
-- تسوية الجلسة - جعل نقاط المحفظة متاحة
-- ================================================================

CREATE OR REPLACE FUNCTION public.settle_collection_session(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_session RECORD;
    v_base_points INTEGER;
    v_wallet_amount DECIMAL(12,2);
BEGIN
    -- 1. جلب بيانات الجلسة
    SELECT 
        id,
        customer_id,
        base_points,
        is_settled,
        status
    INTO v_session
    FROM waste_collection_sessions
    WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'الجلسة غير موجودة: %', p_session_id;
    END IF;
    
    IF v_session.is_settled = true THEN
        RAISE EXCEPTION 'الجلسة مقفلة بالفعل';
    END IF;
    
    IF v_session.status != 'completed' THEN
        RAISE EXCEPTION 'الجلسة لم تكتمل بعد. الحالة الحالية: %', v_session.status;
    END IF;
    
    v_base_points := COALESCE(v_session.base_points, 0);
    v_wallet_amount := v_base_points::DECIMAL / 100;
    
    -- 2. تحديث المحفظة المالية (متاح للسحب الآن) - استخدام الدالة المساعدة
    PERFORM public.update_wallet_balance(
        v_session.customer_id,
        v_wallet_amount,
        'add'
    );
    
    -- 3. تحديث حالة الجلسة
    UPDATE waste_collection_sessions
    SET 
        is_settled = true,
        updated_at = NOW()
    WHERE id = p_session_id;
    
    -- 4. تحديث Audit Log
    UPDATE points_transactions
    SET 
        after_balance = (public.get_customer_wallet_balance(v_session.customer_id) * 100)::INTEGER,
        description = description || ' - تم التسوية'
    WHERE reference_id = p_session_id
      AND type = 'wallet'
      AND source = 'waste_collection_session';
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.settle_collection_session IS 
'تسوية جلسة التجميع - جعل نقاط المحفظة متاحة للسحب';

-- ================================================================
-- 5) Function: withdraw_from_wallet
-- سحب من المحفظة (مع التحقق)
-- ================================================================

CREATE OR REPLACE FUNCTION public.withdraw_from_wallet(
    p_customer_id UUID,
    p_amount_egp DECIMAL(10,2)
)
RETURNS UUID AS $$
DECLARE
    v_unsettled_count INTEGER;
    v_current_wallet DECIMAL(12,2);
    v_points_per_egp INTEGER;
    v_points_required INTEGER;
    v_redemption_id UUID;
BEGIN
    -- 1. التحقق من الجلسات غير المقفلة
    v_unsettled_count := public.check_unsettled_sessions(p_customer_id);
    
    IF v_unsettled_count > 0 THEN
        RAISE EXCEPTION 'يوجد % جلسة غير مقفلة. لا يمكن السحب إلا بعد تسوية الجلسات', 
            v_unsettled_count;
    END IF;
    
    -- 2. التحقق من الرصيد
    v_current_wallet := public.get_customer_wallet_balance(p_customer_id);
    
    IF v_current_wallet < p_amount_egp THEN
        RAISE EXCEPTION 'رصيد المحفظة غير كافٍ. المتاح: % ج.م، المطلوب: % ج.م', 
            v_current_wallet, p_amount_egp;
    END IF;
    
    -- 3. جلب معامل التحويل
    SELECT points_per_egp INTO v_points_per_egp
    FROM points_configuration
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    v_points_per_egp := COALESCE(v_points_per_egp, 100);
    v_points_required := (p_amount_egp * v_points_per_egp)::INTEGER;
    
    -- 4. إنشاء سجل الاستبدال
    v_redemption_id := gen_random_uuid();
    
    INSERT INTO points_redemptions (
        id,
        customer_id,
        points_redeemed,
        amount_egp,
        redemption_type,
        status
    ) VALUES (
        v_redemption_id,
        p_customer_id,
        v_points_required,
        p_amount_egp,
        'cash',
        'pending'
    );
    
    -- 5. خصم من المحفظة
    PERFORM public.update_wallet_balance(
        p_customer_id,
        p_amount_egp,
        'subtract'
    );
    
    -- 6. تسجيل في Audit Log
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
        p_customer_id,
        'wallet',
        -v_points_required,
        (v_current_wallet * v_points_per_egp)::INTEGER,
        ((v_current_wallet - p_amount_egp) * v_points_per_egp)::INTEGER,
        'points_redemption',
        v_redemption_id,
        'سحب نقدي من المحفظة: ' || p_amount_egp || ' ج.م'
    );
    
    RETURN v_redemption_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.withdraw_from_wallet IS 
'سحب مبلغ من المحفظة المالية مع التحقق من الجلسات المقفلة';

-- ================================================================
-- 6) Function: use_store_points
-- استخدام نقاط المتجر
-- ================================================================

CREATE OR REPLACE FUNCTION public.use_store_points(
    p_customer_id UUID,
    p_points INTEGER,
    p_redemption_type VARCHAR DEFAULT 'product'
)
RETURNS UUID AS $$
DECLARE
    v_current_store_points INTEGER;
    v_redemption_id UUID;
BEGIN
    -- 1. التحقق من رصيد نقاط المتجر
    v_current_store_points := public.get_customer_store_points(p_customer_id);
    
    IF v_current_store_points < p_points THEN
        RAISE EXCEPTION 'رصيد نقاط المتجر غير كافٍ. المتاح: %, المطلوب: %', 
            v_current_store_points, p_points;
    END IF;
    
    -- 2. إنشاء سجل الاستبدال
    v_redemption_id := gen_random_uuid();
    
    INSERT INTO points_redemptions (
        id,
        customer_id,
        points_redeemed,
        amount_egp,
        redemption_type,
        status
    ) VALUES (
        v_redemption_id,
        p_customer_id,
        p_points,
        0, -- نقاط المتجر لا قيمة نقدية
        p_redemption_type,
        'pending'
    );
    
    -- 3. خصم من نقاط المتجر
    PERFORM public.update_store_points(
        p_customer_id,
        p_points,
        'subtract'
    );
    
    -- 4. تسجيل في Audit Log
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
        p_customer_id,
        'store',
        -p_points,
        v_current_store_points,
        v_current_store_points - p_points,
        'points_redemption',
        v_redemption_id,
        'استخدام نقاط المتجر: ' || p_redemption_type
    );
    
    RETURN v_redemption_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.use_store_points IS 
'استخدام نقاط المتجر للاستبدال بمنتجات أو هدايا';

-- ================================================================
-- 7) Trigger: log_wallet_transaction
-- تسجيل تلقائي عند تحديث wallet_balance
-- ================================================================

CREATE OR REPLACE FUNCTION public.log_wallet_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- تسجيل فقط إذا تغير wallet_balance
    IF OLD.wallet_balance IS DISTINCT FROM NEW.wallet_balance THEN
        INSERT INTO points_transactions (
            profile_id,
            type,
            amount,
            before_balance,
            after_balance,
            source,
            description
        ) VALUES (
            NEW.id,
            'wallet',
            ((COALESCE(NEW.wallet_balance, 0) - COALESCE(OLD.wallet_balance, 0)) * 100)::INTEGER,
            (COALESCE(OLD.wallet_balance, 0) * 100)::INTEGER,
            (COALESCE(NEW.wallet_balance, 0) * 100)::INTEGER,
            'system',
            'تحديث تلقائي للمحفظة'
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'خطأ في log_wallet_transaction: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء Trigger على profiles إن وجد
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DROP TRIGGER IF EXISTS trigger_log_wallet_transaction ON public.profiles;
    CREATE TRIGGER trigger_log_wallet_transaction
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (OLD.wallet_balance IS DISTINCT FROM NEW.wallet_balance)
    EXECUTE FUNCTION public.log_wallet_transaction();
  END IF;
END $$;

-- إنشاء Trigger على new_profiles إن وجدت
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'new_profiles') THEN
    DROP TRIGGER IF EXISTS trigger_log_wallet_transaction ON public.new_profiles;
    CREATE TRIGGER trigger_log_wallet_transaction
    AFTER UPDATE ON public.new_profiles
    FOR EACH ROW
    WHEN (OLD.wallet_balance IS DISTINCT FROM NEW.wallet_balance)
    EXECUTE FUNCTION public.log_wallet_transaction();
  END IF;
END $$;

-- إنشاء Trigger على customers إن وجد
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'customers') THEN
    DROP TRIGGER IF EXISTS trigger_log_wallet_transaction ON public.customers;
    CREATE TRIGGER trigger_log_wallet_transaction
    AFTER UPDATE ON public.customers
    FOR EACH ROW
    WHEN (OLD.wallet_balance IS DISTINCT FROM NEW.wallet_balance)
    EXECUTE FUNCTION public.log_wallet_transaction();
  END IF;
END $$;

COMMENT ON FUNCTION public.log_wallet_transaction IS 
'تسجيل تلقائي لتغييرات المحفظة المالية';

-- ================================================================
-- 8) Trigger: log_store_points_transaction
-- تسجيل تلقائي عند تحديث store_points
-- ================================================================

CREATE OR REPLACE FUNCTION public.log_store_points_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- تسجيل فقط إذا تغير store_points
    IF OLD.store_points IS DISTINCT FROM NEW.store_points THEN
        INSERT INTO points_transactions (
            profile_id,
            type,
            amount,
            before_balance,
            after_balance,
            source,
            description
        ) VALUES (
            NEW.id,
            'store',
            COALESCE(NEW.store_points, 0) - COALESCE(OLD.store_points, 0),
            COALESCE(OLD.store_points, 0),
            COALESCE(NEW.store_points, 0),
            'system',
            'تحديث تلقائي لنقاط المتجر'
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'خطأ في log_store_points_transaction: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء Trigger على profiles إن وجد
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DROP TRIGGER IF EXISTS trigger_log_store_points_transaction ON public.profiles;
    CREATE TRIGGER trigger_log_store_points_transaction
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (OLD.store_points IS DISTINCT FROM NEW.store_points)
    EXECUTE FUNCTION public.log_store_points_transaction();
  END IF;
END $$;

-- إنشاء Trigger على new_profiles إن وجدت
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'new_profiles') THEN
    DROP TRIGGER IF EXISTS trigger_log_store_points_transaction ON public.new_profiles;
    CREATE TRIGGER trigger_log_store_points_transaction
    AFTER UPDATE ON public.new_profiles
    FOR EACH ROW
    WHEN (OLD.store_points IS DISTINCT FROM NEW.store_points)
    EXECUTE FUNCTION public.log_store_points_transaction();
  END IF;
END $$;

-- إنشاء Trigger على customers إن وجد
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'customers') THEN
    DROP TRIGGER IF EXISTS trigger_log_store_points_transaction ON public.customers;
    CREATE TRIGGER trigger_log_store_points_transaction
    AFTER UPDATE ON public.customers
    FOR EACH ROW
    WHEN (OLD.store_points IS DISTINCT FROM NEW.store_points)
    EXECUTE FUNCTION public.log_store_points_transaction();
  END IF;
END $$;

COMMENT ON FUNCTION public.log_store_points_transaction IS 
'تسجيل تلقائي لتغييرات نقاط المتجر';

-- ================================================================
-- 9) Function: refund_redemption
-- إرجاع النقاط عند رفض طلب الاستبدال
-- ================================================================

CREATE OR REPLACE FUNCTION public.refund_redemption(p_redemption_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_redemption RECORD;
    v_points_per_egp INTEGER;
BEGIN
    -- جلب بيانات الاستبدال
    SELECT * INTO v_redemption
    FROM points_redemptions
    WHERE id = p_redemption_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'طلب الاستبدال غير موجود: %', p_redemption_id;
    END IF;
    
    IF v_redemption.status NOT IN ('pending', 'approved') THEN
        RAISE EXCEPTION 'لا يمكن إلغاء طلب في حالة: %', v_redemption.status;
    END IF;
    
    -- جلب معامل التحويل
    SELECT points_per_egp INTO v_points_per_egp
    FROM points_configuration
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    v_points_per_egp := COALESCE(v_points_per_egp, 100);
    
    -- إرجاع المبلغ حسب النوع
    IF v_redemption.redemption_type = 'cash' THEN
        -- إرجاع إلى المحفظة
        PERFORM public.update_wallet_balance(
            v_redemption.customer_id,
            v_redemption.amount_egp,
            'add'
        );
    ELSE
        -- إرجاع نقاط المتجر
        PERFORM public.update_store_points(
            v_redemption.customer_id,
            v_redemption.points_redeemed,
            'add'
        );
    END IF;
    
    -- تحديث حالة الاستبدال
    UPDATE points_redemptions
    SET 
        status = 'rejected',
        updated_at = NOW()
    WHERE id = p_redemption_id;
    
    -- تسجيل في Audit Log
    INSERT INTO points_transactions (
        profile_id,
        type,
        amount,
        before_balance,
        after_balance,
        source,
        reference_id,
        description
    )
    SELECT 
        v_redemption.customer_id,
        CASE WHEN v_redemption.redemption_type = 'cash' THEN 'wallet' ELSE 'store' END,
        CASE WHEN v_redemption.redemption_type = 'cash' 
            THEN (v_redemption.amount_egp * v_points_per_egp)::INTEGER 
            ELSE v_redemption.points_redeemed 
        END,
        0, -- before_balance (يتم حسابه من Trigger)
        0, -- after_balance (يتم حسابه من Trigger)
        'refund',
        p_redemption_id,
        'إرجاع بسبب رفض طلب الاستبدال';
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.refund_redemption IS 
'إرجاع النقاط للعميل عند رفض أو إلغاء طلب الاستبدال';

-- ================================================================
-- 10) Function: get_customer_balance_summary
-- ملخص رصيد العميل
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_customer_balance_summary(p_customer_id UUID)
RETURNS TABLE (
    wallet_balance DECIMAL(12,2),
    store_points INTEGER,
    pending_sessions INTEGER,
    pending_wallet_value DECIMAL(12,2),
    total_available DECIMAL(12,2)
) AS $$
DECLARE
    v_wallet DECIMAL(12,2);
    v_store INTEGER;
    v_pending_count INTEGER;
    v_pending_value DECIMAL(12,2);
BEGIN
    -- جلب الرصيد
    v_wallet := public.get_customer_wallet_balance(p_customer_id);
    v_store := public.get_customer_store_points(p_customer_id);
    
    -- جلب الجلسات المعلقة
    SELECT 
        COUNT(*),
        COALESCE(SUM(base_points::DECIMAL / 100), 0)
    INTO v_pending_count, v_pending_value
    FROM waste_collection_sessions
    WHERE customer_id = p_customer_id
      AND status = 'completed'
      AND is_settled = false;
    
    RETURN QUERY SELECT 
        v_wallet,
        v_store,
        v_pending_count,
        v_pending_value,
        v_wallet + v_pending_value;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_customer_balance_summary IS 
'إرجاع ملخص رصيد العميل (المحفظة، نقاط المتجر، الجلسات المعلقة)';

-- ================================================================
-- نهاية Functions
-- ================================================================
