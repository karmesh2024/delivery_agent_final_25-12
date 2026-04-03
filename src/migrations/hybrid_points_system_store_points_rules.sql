-- =================================================================
-- Hybrid Points System - Store Points Rules Module
-- تاريخ: يناير 2026
-- الهدف: نظام قواعد نقاط المتجر (store_points)
-- المرجع: تقرير المستشار المالي + الرد على التقرير
-- =================================================================

-- ================================================================
-- 1) إنشاء جدول store_points_rules
-- ================================================================

CREATE TABLE IF NOT EXISTS public.store_points_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN (
        'multiplier',      -- بونص من المضاعف
        'welcome',         -- ترحيب عملاء جدد
        'tier',            -- حسب فئة العميل
        'seasonal',        -- عروض موسمية
        'fixed'            -- قيمة ثابتة
    )),
    
    -- شروط التطبيق
    min_base_points INTEGER,           -- الحد الأدنى من base_points
    customer_tier VARCHAR(50),         -- فئة العميل (gold, platinum, etc.)
    is_new_customer BOOLEAN,           -- للعملاء الجدد فقط
    
    -- قيمة البونص
    bonus_percentage DECIMAL(5,2),     -- نسبة من base_points
    bonus_fixed INTEGER,                -- قيمة ثابتة
    
    -- الفترة
    start_date DATE,
    end_date DATE,
    
    -- الأولوية (إذا تطابقت عدة قواعد)
    priority INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_points_rules_active 
ON public.store_points_rules(is_active, start_date, end_date);

COMMENT ON TABLE public.store_points_rules IS 
'قواعد منح نقاط المتجر (البونص) للعملاء';

-- ================================================================
-- 2) قواعد افتراضية
-- ================================================================

INSERT INTO public.store_points_rules (name, rule_type, bonus_fixed, is_new_customer, is_active, priority) VALUES
('ترحيب عملاء جدد', 'welcome', 1000, true, true, 10)
ON CONFLICT DO NOTHING;

-- ================================================================
-- 3) Function: calculate_store_points_bonus()
-- حساب نقاط البونص بناءً على القواعد
-- ================================================================

CREATE OR REPLACE FUNCTION public.calculate_store_points_bonus(
    p_customer_id UUID,
    p_base_points INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_bonus_points INTEGER := 0;
    v_customer RECORD;
    v_rule RECORD;
    v_rule_bonus INTEGER;
    v_sessions_count INTEGER;
BEGIN
    -- جلب بيانات العميل
    SELECT 
        id,
        created_at
    INTO v_customer
    FROM new_profiles
    WHERE id = p_customer_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- حساب عدد الجلسات المكتملة
    SELECT COUNT(*) INTO v_sessions_count
    FROM waste_collection_sessions
    WHERE customer_id = p_customer_id 
      AND status = 'completed';
    
    -- تطبيق القواعد النشطة
    FOR v_rule IN 
        SELECT * FROM store_points_rules 
        WHERE is_active = true
          AND (start_date IS NULL OR start_date <= CURRENT_DATE)
          AND (end_date IS NULL OR end_date >= CURRENT_DATE)
          AND (min_base_points IS NULL OR p_base_points >= min_base_points)
        ORDER BY priority DESC, id ASC
    LOOP
        v_rule_bonus := 0;
        
        -- قاعدة: ترحيب عملاء جدد
        IF v_rule.rule_type = 'welcome' THEN
            IF v_rule.is_new_customer = true AND v_sessions_count <= 1 THEN
                v_rule_bonus := COALESCE(v_rule.bonus_fixed, 0);
            END IF;
        
        -- قاعدة: حسب فئة العميل
        ELSIF v_rule.rule_type = 'tier' THEN
            -- يمكن التحقق من customer_tier إذا كان موجوداً في new_profiles
            -- مؤقتاً: تطبيق على الجميع إذا لم يكن هناك شرط tier
            IF v_rule.customer_tier IS NULL THEN
                IF v_rule.bonus_percentage IS NOT NULL THEN
                    v_rule_bonus := FLOOR(p_base_points * v_rule.bonus_percentage / 100);
                ELSIF v_rule.bonus_fixed IS NOT NULL THEN
                    v_rule_bonus := v_rule.bonus_fixed;
                END IF;
            END IF;
        
        -- قاعدة: نسبة عامة (multiplier أو seasonal)
        ELSIF v_rule.rule_type IN ('multiplier', 'seasonal') THEN
            IF v_rule.bonus_percentage IS NOT NULL THEN
                v_rule_bonus := FLOOR(p_base_points * v_rule.bonus_percentage / 100);
            ELSIF v_rule.bonus_fixed IS NOT NULL THEN
                v_rule_bonus := v_rule.bonus_fixed;
            END IF;
        
        -- قاعدة: قيمة ثابتة
        ELSIF v_rule.rule_type = 'fixed' THEN
            v_rule_bonus := COALESCE(v_rule.bonus_fixed, 0);
        END IF;
        
        v_bonus_points := v_bonus_points + v_rule_bonus;
    END LOOP;
    
    RETURN v_bonus_points;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_store_points_bonus IS 
'حساب نقاط البونص للمتجر بناءً على القواعد المحددة';

-- ================================================================
-- 4) تحديث Function: calculate_session_points()
-- استخدام القواعد لحساب store_points
-- ================================================================

-- ملاحظة: calculate_session_points() موجودة بالفعل
-- سنستبدل السطر الذي يحتوي على v_bonus_points := 0

-- نحتاج تحديث الكود الموجود:
-- السطر 349-364 في hybrid_points_system_functions.sql

-- الكود الجديد:
/*
-- 4. حساب نقاط المتجر (البونص) - استخدام القواعد
v_bonus_points := public.calculate_store_points_bonus(
    NEW.customer_id,
    v_base_points
);
NEW.bonus_points := v_bonus_points;
NEW.total_points := v_base_points + v_bonus_points;
*/

-- سنقوم بتحديث Function كاملة في migration منفصل

-- ================================================================
-- 5) Function: update_store_points_rules()
-- تحديث قاعدة (للاستخدام من Dashboard)
-- ================================================================

CREATE OR REPLACE FUNCTION public.update_store_points_rule(
    p_rule_id INTEGER,
    p_name VARCHAR(100),
    p_rule_type VARCHAR(50),
    p_min_base_points INTEGER,
    p_customer_tier VARCHAR(50),
    p_is_new_customer BOOLEAN,
    p_bonus_percentage DECIMAL(5,2),
    p_bonus_fixed INTEGER,
    p_start_date DATE,
    p_end_date DATE,
    p_priority INTEGER,
    p_is_active BOOLEAN
)
RETURNS INTEGER AS $$
BEGIN
    UPDATE store_points_rules
    SET 
        name = p_name,
        rule_type = p_rule_type,
        min_base_points = p_min_base_points,
        customer_tier = p_customer_tier,
        is_new_customer = p_is_new_customer,
        bonus_percentage = p_bonus_percentage,
        bonus_fixed = p_bonus_fixed,
        start_date = p_start_date,
        end_date = p_end_date,
        priority = p_priority,
        is_active = p_is_active,
        updated_at = NOW()
    WHERE id = p_rule_id;
    
    RETURN p_rule_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_store_points_rule IS 
'تحديث قاعدة نقاط المتجر (للاستخدام من Dashboard)';

-- ================================================================
-- 6) RLS Policies
-- ================================================================

ALTER TABLE public.store_points_rules ENABLE ROW LEVEL SECURITY;

-- Policy: فقط المسؤولين يمكنهم إدارة القواعد
DROP POLICY IF EXISTS "Admins can manage rules" ON public.store_points_rules;
CREATE POLICY "Admins can manage rules" ON public.store_points_rules
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- Policy: الجميع يمكنهم قراءة القواعد النشطة
DROP POLICY IF EXISTS "Everyone can view active rules" ON public.store_points_rules;
CREATE POLICY "Everyone can view active rules" ON public.store_points_rules
FOR SELECT USING (is_active = true);

-- ================================================================
-- نهاية Migration
-- =================================================================
