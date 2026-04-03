-- =================================================================
-- Hybrid Points System - Withdrawal Limits Module
-- تاريخ: يناير 2026
-- الهدف: حدود السحب والحماية المالية
-- المرجع: تقرير المستشار المالي + الرد على التقرير
-- =================================================================

-- ================================================================
-- 1) إنشاء جدول withdrawal_limits
-- ================================================================

CREATE TABLE IF NOT EXISTS public.withdrawal_limits (
    id SERIAL PRIMARY KEY,
    limit_type VARCHAR(50) NOT NULL CHECK (limit_type IN ('daily', 'weekly', 'monthly')),
    max_amount_egp DECIMAL(10,2) NOT NULL,
    max_transactions INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_limits_type 
ON public.withdrawal_limits(limit_type, is_active);

COMMENT ON TABLE public.withdrawal_limits IS 
'حدود السحب النقدي (يومي، أسبوعي، شهري)';

-- القيم الافتراضية
INSERT INTO public.withdrawal_limits (limit_type, max_amount_egp, max_transactions, is_active) VALUES
('daily', 500.00, 3, true),
('weekly', 2000.00, 10, true),
('monthly', 5000.00, 30, true)
ON CONFLICT DO NOTHING;

-- ================================================================
-- 2) Function: check_withdrawal_limits()
-- التحقق من حدود السحب
-- ================================================================

CREATE OR REPLACE FUNCTION public.check_withdrawal_limits(
    p_customer_id UUID,
    p_amount_egp DECIMAL(10,2)
)
RETURNS TABLE (
    allowed BOOLEAN,
    reason TEXT,
    daily_total DECIMAL(10,2),
    daily_limit DECIMAL(10,2),
    daily_count INTEGER,
    daily_limit_count INTEGER
) AS $$
DECLARE
    v_daily_total DECIMAL(10,2);
    v_daily_count INTEGER;
    v_daily_limit DECIMAL(10,2);
    v_daily_limit_count INTEGER;
    v_weekly_total DECIMAL(10,2);
    v_weekly_count INTEGER;
    v_weekly_limit DECIMAL(10,2);
    v_weekly_limit_count INTEGER;
    v_monthly_total DECIMAL(10,2);
    v_monthly_count INTEGER;
    v_monthly_limit DECIMAL(10,2);
    v_monthly_limit_count INTEGER;
BEGIN
    -- جلب الحدود
    SELECT max_amount_egp, max_transactions
    INTO v_daily_limit, v_daily_limit_count
    FROM withdrawal_limits
    WHERE limit_type = 'daily' AND is_active = true
    LIMIT 1;
    
    SELECT max_amount_egp, max_transactions
    INTO v_weekly_limit, v_weekly_limit_count
    FROM withdrawal_limits
    WHERE limit_type = 'weekly' AND is_active = true
    LIMIT 1;
    
    SELECT max_amount_egp, max_transactions
    INTO v_monthly_limit, v_monthly_limit_count
    FROM withdrawal_limits
    WHERE limit_type = 'monthly' AND is_active = true
    LIMIT 1;
    
    -- حساب إجمالي سحوبات اليوم
    SELECT 
        COALESCE(SUM(amount_egp), 0),
        COUNT(*)
    INTO v_daily_total, v_daily_count
    FROM points_redemptions
    WHERE customer_id = p_customer_id
      AND redemption_type = 'cash'
      AND status IN ('pending', 'completed')
      AND DATE(created_at) = CURRENT_DATE;
    
    -- حساب إجمالي سحوبات الأسبوع
    SELECT 
        COALESCE(SUM(amount_egp), 0),
        COUNT(*)
    INTO v_weekly_total, v_weekly_count
    FROM points_redemptions
    WHERE customer_id = p_customer_id
      AND redemption_type = 'cash'
      AND status IN ('pending', 'completed')
      AND DATE(created_at) >= DATE_TRUNC('week', CURRENT_DATE);
    
    -- حساب إجمالي سحوبات الشهر
    SELECT 
        COALESCE(SUM(amount_egp), 0),
        COUNT(*)
    INTO v_monthly_total, v_monthly_count
    FROM points_redemptions
    WHERE customer_id = p_customer_id
      AND redemption_type = 'cash'
      AND status IN ('pending', 'completed')
      AND DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- التحقق من الحدود اليومية
    IF v_daily_total + p_amount_egp > v_daily_limit THEN
        RETURN QUERY SELECT 
            false, 
            'تجاوز الحد اليومي للسحب. المتاح: ' || (v_daily_limit - v_daily_total) || ' ج.م',
            v_daily_total,
            v_daily_limit,
            v_daily_count,
            v_daily_limit_count;
        RETURN;
    END IF;
    
    IF v_daily_count >= v_daily_limit_count THEN
        RETURN QUERY SELECT 
            false, 
            'تجاوز عدد عمليات السحب اليومية المسموحة',
            v_daily_total,
            v_daily_limit,
            v_daily_count,
            v_daily_limit_count;
        RETURN;
    END IF;
    
    -- التحقق من الحدود الأسبوعية
    IF v_weekly_total + p_amount_egp > v_weekly_limit THEN
        RETURN QUERY SELECT 
            false, 
            'تجاوز الحد الأسبوعي للسحب. المتاح: ' || (v_weekly_limit - v_weekly_total) || ' ج.م',
            v_daily_total,
            v_daily_limit,
            v_daily_count,
            v_daily_limit_count;
        RETURN;
    END IF;
    
    IF v_weekly_count >= v_weekly_limit_count THEN
        RETURN QUERY SELECT 
            false, 
            'تجاوز عدد عمليات السحب الأسبوعية المسموحة',
            v_daily_total,
            v_daily_limit,
            v_daily_count,
            v_daily_limit_count;
        RETURN;
    END IF;
    
    -- التحقق من الحدود الشهرية
    IF v_monthly_total + p_amount_egp > v_monthly_limit THEN
        RETURN QUERY SELECT 
            false, 
            'تجاوز الحد الشهري للسحب. المتاح: ' || (v_monthly_limit - v_monthly_total) || ' ج.م',
            v_daily_total,
            v_daily_limit,
            v_daily_count,
            v_daily_limit_count;
        RETURN;
    END IF;
    
    IF v_monthly_count >= v_monthly_limit_count THEN
        RETURN QUERY SELECT 
            false, 
            'تجاوز عدد عمليات السحب الشهرية المسموحة',
            v_daily_total,
            v_daily_limit,
            v_daily_count,
            v_daily_limit_count;
        RETURN;
    END IF;
    
    -- السحب مسموح
    RETURN QUERY SELECT 
        true, 
        'السحب مسموح',
        v_daily_total,
        v_daily_limit,
        v_daily_count,
        v_daily_limit_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.check_withdrawal_limits IS 
'التحقق من حدود السحب (يومي، أسبوعي، شهري)';

-- ================================================================
-- 3) تحديث Function: withdraw_from_wallet()
-- إضافة التحقق من الحدود
-- ================================================================

-- ملاحظة: withdraw_from_wallet() موجودة بالفعل
-- سنضيف التحقق من الحدود في بداية Function

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
    v_limit_check RECORD;
BEGIN
    -- 0. ⭐ التحقق من حدود السحب (جديد)
    SELECT * INTO v_limit_check
    FROM public.check_withdrawal_limits(p_customer_id, p_amount_egp);
    
    IF NOT v_limit_check.allowed THEN
        RAISE EXCEPTION '%', v_limit_check.reason;
    END IF;
    
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

-- ================================================================
-- 4) RLS Policies
-- ================================================================

ALTER TABLE public.withdrawal_limits ENABLE ROW LEVEL SECURITY;

-- Policy: فقط المسؤولين يمكنهم إدارة الحدود
DROP POLICY IF EXISTS "Admins can manage limits" ON public.withdrawal_limits;
CREATE POLICY "Admins can manage limits" ON public.withdrawal_limits
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- Policy: الجميع يمكنهم قراءة الحدود النشطة
DROP POLICY IF EXISTS "Everyone can view active limits" ON public.withdrawal_limits;
CREATE POLICY "Everyone can view active limits" ON public.withdrawal_limits
FOR SELECT USING (is_active = true);

-- ================================================================
-- نهاية Migration
-- =================================================================
