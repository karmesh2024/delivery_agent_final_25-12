-- =================================================================
-- Hybrid Points System - Financial Reserves Module
-- تاريخ: يناير 2026
-- الهدف: نظام إدارة الاحتياطيات المالية
-- المرجع: تقرير المستشار المالي + الرد على التقرير
-- =================================================================

-- ================================================================
-- 1) إنشاء جدول financial_reserves
-- ================================================================

CREATE TABLE IF NOT EXISTS public.financial_reserves (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
    
    -- الالتزامات (Liabilities)
    total_wallet_balance DECIMAL(15,2) DEFAULT 0,
    pending_withdrawals DECIMAL(15,2) DEFAULT 0,
    pending_sessions DECIMAL(15,2) DEFAULT 0,
    total_liabilities DECIMAL(15,2) DEFAULT 0,
    
    -- الأصول (Assets) - يتم تحديثها يدوياً من الإدارة
    cash_on_hand DECIMAL(15,2) DEFAULT 0,
    waste_inventory_value DECIMAL(15,2) DEFAULT 0,
    accounts_receivable DECIMAL(15,2) DEFAULT 0,
    total_assets DECIMAL(15,2) DEFAULT 0,
    
    -- النسب المالية
    coverage_ratio DECIMAL(5,2) DEFAULT 0,      -- Assets / Liabilities × 100
    liquidity_ratio DECIMAL(5,2) DEFAULT 0,    -- Cash / Liabilities × 100
    
    -- الربحية اليومية
    daily_revenue DECIMAL(15,2) DEFAULT 0,
    daily_profit DECIMAL(15,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_reserves_date 
ON public.financial_reserves(date);

COMMENT ON TABLE public.financial_reserves IS 
'سجل يومي للاحتياطيات المالية والالتزامات والأصول';

-- ================================================================
-- 2) Function: calculate_daily_reserves()
-- حساب الاحتياطيات المالية اليومية
-- ================================================================

CREATE OR REPLACE FUNCTION public.calculate_daily_reserves()
RETURNS void AS $$
DECLARE
    v_liabilities RECORD;
    v_assets RECORD;
    v_total_liabilities DECIMAL(15,2);
    v_total_assets DECIMAL(15,2);
    v_coverage_ratio DECIMAL(5,2);
    v_liquidity_ratio DECIMAL(5,2);
    v_daily_revenue DECIMAL(15,2);
    v_daily_profit DECIMAL(15,2);
BEGIN
    -- حساب الالتزامات
    SELECT 
        COALESCE(SUM(wallet_balance), 0) as wallet,
        (SELECT COALESCE(SUM(amount_egp), 0) 
         FROM points_redemptions 
         WHERE status = 'pending' 
           AND redemption_type = 'cash'
           AND DATE(created_at) = CURRENT_DATE) as withdrawals,
        (SELECT COALESCE(SUM(COALESCE(buy_total, total_value)), 0)
         FROM waste_collection_sessions
         WHERE status = 'completed' 
           AND is_settled = false) as pending
    INTO v_liabilities
    FROM new_profiles;
    
    v_total_liabilities := 
        COALESCE(v_liabilities.wallet, 0) + 
        COALESCE(v_liabilities.withdrawals, 0) + 
        COALESCE(v_liabilities.pending, 0);
    
    -- جلب الأصول من آخر سجل (أو القيم الافتراضية)
    SELECT 
        cash_on_hand,
        waste_inventory_value,
        accounts_receivable
    INTO v_assets
    FROM financial_reserves
    WHERE date < CURRENT_DATE
    ORDER BY date DESC
    LIMIT 1;
    
    -- إذا لم يوجد سجل سابق، استخدم القيم الافتراضية
    v_assets.cash_on_hand := COALESCE(v_assets.cash_on_hand, 0);
    v_assets.waste_inventory_value := COALESCE(v_assets.waste_inventory_value, 0);
    v_assets.accounts_receivable := COALESCE(v_assets.accounts_receivable, 0);
    
    v_total_assets := 
        v_assets.cash_on_hand + 
        v_assets.waste_inventory_value + 
        v_assets.accounts_receivable;
    
    -- حساب النسب المالية
    v_coverage_ratio := CASE 
        WHEN v_total_liabilities > 0 
        THEN (v_total_assets / v_total_liabilities * 100)
        ELSE 0 
    END;
    
    v_liquidity_ratio := CASE 
        WHEN v_total_liabilities > 0 
        THEN (v_assets.cash_on_hand / v_total_liabilities * 100)
        ELSE 0 
    END;
    
    -- حساب الربحية اليومية
    SELECT 
        COALESCE(SUM(COALESCE(sell_total, 0)), 0),
        COALESCE(SUM(COALESCE(platform_profit, 0)), 0)
    INTO v_daily_revenue, v_daily_profit
    FROM waste_collection_sessions
    WHERE DATE(created_at) = CURRENT_DATE
      AND status = 'completed';
    
    -- إدراج/تحديث السجل اليومي
    INSERT INTO public.financial_reserves (
        date,
        total_wallet_balance,
        pending_withdrawals,
        pending_sessions,
        total_liabilities,
        cash_on_hand,
        waste_inventory_value,
        accounts_receivable,
        total_assets,
        coverage_ratio,
        liquidity_ratio,
        daily_revenue,
        daily_profit
    ) VALUES (
        CURRENT_DATE,
        COALESCE(v_liabilities.wallet, 0),
        COALESCE(v_liabilities.withdrawals, 0),
        COALESCE(v_liabilities.pending, 0),
        v_total_liabilities,
        v_assets.cash_on_hand,
        v_assets.waste_inventory_value,
        v_assets.accounts_receivable,
        v_total_assets,
        v_coverage_ratio,
        v_liquidity_ratio,
        v_daily_revenue,
        v_daily_profit
    )
    ON CONFLICT (date) DO UPDATE SET
        total_wallet_balance = EXCLUDED.total_wallet_balance,
        pending_withdrawals = EXCLUDED.pending_withdrawals,
        pending_sessions = EXCLUDED.pending_sessions,
        total_liabilities = EXCLUDED.total_liabilities,
        coverage_ratio = EXCLUDED.coverage_ratio,
        liquidity_ratio = EXCLUDED.liquidity_ratio,
        daily_revenue = EXCLUDED.daily_revenue,
        daily_profit = EXCLUDED.daily_profit,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_daily_reserves IS 
'حساب الاحتياطيات المالية اليومية - يجب تشغيله يومياً (يفضل عبر Cron Job)';

-- ================================================================
-- 3) Function: get_financial_reserves_summary()
-- ملخص الاحتياطيات المالية
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_financial_reserves_summary()
RETURNS TABLE (
    date DATE,
    total_liabilities DECIMAL(15,2),
    total_assets DECIMAL(15,2),
    coverage_ratio DECIMAL(5,2),
    liquidity_ratio DECIMAL(5,2),
    daily_revenue DECIMAL(15,2),
    daily_profit DECIMAL(15,2),
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fr.date,
        fr.total_liabilities,
        fr.total_assets,
        fr.coverage_ratio,
        fr.liquidity_ratio,
        fr.daily_revenue,
        fr.daily_profit,
        CASE 
            WHEN fr.coverage_ratio >= 100 THEN 'آمن'
            WHEN fr.coverage_ratio >= 80 THEN 'تحذير'
            ELSE 'خطر'
        END as status
    FROM financial_reserves fr
    WHERE fr.date >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY fr.date DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_financial_reserves_summary IS 
'ملخص الاحتياطيات المالية لآخر 30 يوم';

-- ================================================================
-- 4) RLS Policies
-- ================================================================

ALTER TABLE public.financial_reserves ENABLE ROW LEVEL SECURITY;

-- Policy: فقط المسؤولين يمكنهم رؤية الاحتياطيات
DROP POLICY IF EXISTS "Admins can view reserves" ON public.financial_reserves;
CREATE POLICY "Admins can view reserves" ON public.financial_reserves
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- Policy: فقط المسؤولين يمكنهم تحديث الأصول
DROP POLICY IF EXISTS "Admins can update reserves" ON public.financial_reserves;
CREATE POLICY "Admins can update reserves" ON public.financial_reserves
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- ================================================================
-- نهاية Migration
-- =================================================================
