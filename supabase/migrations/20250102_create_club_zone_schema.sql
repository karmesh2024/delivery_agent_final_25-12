-- =================================================================
-- Migration: Create Club Zone Schema
-- Description: إنشاء جميع جداول وإعدادات نادي Scope Zone
-- Date: 2025-01-02
-- =================================================================

-- =================================================================
-- 1. CLUB MEMBERSHIPS (عضوية النادي)
-- =================================================================

CREATE TABLE IF NOT EXISTS club_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES new_profiles(id) ON DELETE CASCADE,
  membership_level VARCHAR(20) DEFAULT 'community' CHECK (membership_level IN ('community', 'active', 'ambassador', 'partner')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_club_memberships_user_id ON club_memberships(user_id);
CREATE INDEX idx_club_memberships_level ON club_memberships(membership_level);
CREATE INDEX idx_club_memberships_active ON club_memberships(is_active);

COMMENT ON TABLE club_memberships IS 'عضوية النادي - كل مستخدم عضو تلقائياً';
COMMENT ON COLUMN club_memberships.membership_level IS 'مستوى العضوية: community (افتراضي), active, ambassador, partner';

-- =================================================================
-- 2. CLUB POINTS WALLET (محفظة نقاط النادي)
-- =================================================================

CREATE TABLE IF NOT EXISTS club_points_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES new_profiles(id) ON DELETE CASCADE,
  points_balance INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_club_points_wallet_user_id ON club_points_wallet(user_id);

COMMENT ON TABLE club_points_wallet IS 'محفظة نقاط النادي - منفصلة عن نقاط المخلفات';
COMMENT ON COLUMN club_points_wallet.points_balance IS 'رصيد النقاط الحالي';
COMMENT ON COLUMN club_points_wallet.lifetime_points IS 'إجمالي النقاط المكتسبة على مدار العمر';

-- =================================================================
-- 3. CLUB POINTS TRANSACTIONS (معاملات نقاط النادي)
-- =================================================================

CREATE TABLE IF NOT EXISTS club_points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES new_profiles(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('EARNED', 'USED', 'EXPIRED', 'ADJUSTED', 'BONUS', 'CONVERTED')),
  points INTEGER NOT NULL,
  points_before INTEGER NOT NULL,
  points_after INTEGER NOT NULL,
  reason VARCHAR(100),
  source VARCHAR(50), -- 'waste_collection', 'ad_view', 'event_attendance', 'admin_bonus', 'reward_redeem'
  related_order_id UUID,
  related_offer_id UUID,
  description TEXT,
  created_by UUID REFERENCES new_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_club_points_transactions_user_id ON club_points_transactions(user_id);
CREATE INDEX idx_club_points_transactions_type ON club_points_transactions(transaction_type);
CREATE INDEX idx_club_points_transactions_source ON club_points_transactions(source);
CREATE INDEX idx_club_points_transactions_created_at ON club_points_transactions(created_at DESC);

COMMENT ON TABLE club_points_transactions IS 'سجل جميع معاملات نقاط النادي';
COMMENT ON COLUMN club_points_transactions.source IS 'مصدر النقاط: waste_collection, ad_view, event_attendance, admin_bonus, reward_redeem';

-- =================================================================
-- 4. CLUB PARTNERS (الرعاة/الشركاء)
-- =================================================================

CREATE TABLE IF NOT EXISTS club_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES new_profiles(id), -- الشريك قد يكون user
  company_name VARCHAR(255) NOT NULL,
  partner_type VARCHAR(50) NOT NULL CHECK (partner_type IN ('merchant', 'sponsor', 'recycler', 'media')),
  logo_url TEXT,
  description TEXT,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  website TEXT,
  partnership_start_date DATE,
  partnership_end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_club_partners_user_id ON club_partners(user_id);
CREATE INDEX idx_club_partners_type ON club_partners(partner_type);
CREATE INDEX idx_club_partners_active ON club_partners(is_active);

COMMENT ON TABLE club_partners IS 'الرعاة والشركاء التجاريين';
COMMENT ON COLUMN club_partners.partner_type IS 'نوع الشريك: merchant, sponsor, recycler, media';

-- =================================================================
-- 5. CLUB REWARDS (الهدايا والجوائز)
-- =================================================================

CREATE TABLE IF NOT EXISTS club_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES club_partners(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('wallet_credit', 'discount_code', 'product', 'service')),
  points_required INTEGER NOT NULL CHECK (points_required > 0),
  quantity_available INTEGER, -- NULL = unlimited
  quantity_redeemed INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  redemption_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_club_rewards_partner_id ON club_rewards(partner_id);
CREATE INDEX idx_club_rewards_type ON club_rewards(reward_type);
CREATE INDEX idx_club_rewards_active ON club_rewards(is_active);
CREATE INDEX idx_club_rewards_featured ON club_rewards(is_featured);
CREATE INDEX idx_club_rewards_validity ON club_rewards(valid_from, valid_until);

COMMENT ON TABLE club_rewards IS 'الهدايا والجوائز المتاحة للاستبدال';
COMMENT ON COLUMN club_rewards.reward_type IS 'نوع الجائزة: wallet_credit, discount_code, product, service';
COMMENT ON COLUMN club_rewards.quantity_available IS 'الكمية المتاحة - NULL يعني غير محدودة';

-- =================================================================
-- 6. CLUB REWARD REDEMPTIONS (سجلات الاستبدال)
-- =================================================================

CREATE TABLE IF NOT EXISTS club_reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES new_profiles(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES club_rewards(id) ON DELETE RESTRICT,
  points_spent INTEGER NOT NULL CHECK (points_spent > 0),
  redemption_code VARCHAR(100) UNIQUE, -- QR أو كود للاستخدام
  redemption_type VARCHAR(50), -- 'wallet_credit', 'discount_code', etc.
  redemption_data JSONB, -- بيانات إضافية (مبلغ المحفظة، كود الخصم، إلخ)
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'expired')),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_club_reward_redemptions_user_id ON club_reward_redemptions(user_id);
CREATE INDEX idx_club_reward_redemptions_reward_id ON club_reward_redemptions(reward_id);
CREATE INDEX idx_club_reward_redemptions_status ON club_reward_redemptions(status);
CREATE INDEX idx_club_reward_redemptions_code ON club_reward_redemptions(redemption_code) WHERE redemption_code IS NOT NULL;
CREATE INDEX idx_club_reward_redemptions_created_at ON club_reward_redemptions(created_at DESC);

COMMENT ON TABLE club_reward_redemptions IS 'سجلات استبدال الجوائز';
COMMENT ON COLUMN club_reward_redemptions.redemption_data IS 'بيانات JSONB: { "amount": 50, "currency": "EGP" } للـ wallet_credit';

-- =================================================================
-- 7. CLUB SETTINGS (إعدادات النادي)
-- =================================================================

CREATE TABLE IF NOT EXISTS club_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES new_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إعدادات افتراضية
INSERT INTO club_settings (key, value, description) VALUES
('waste_to_club_conversion', '{"rate": 0.3, "enabled": true}', 'نسبة تحويل نقاط المخلفات إلى نقاط النادي (30%)'),
('daily_ad_points_limit', '{"points": 50, "enabled": true}', 'الحد الأقصى للنقاط اليومية من الإعلانات'),
('membership_upgrade_thresholds', '{"active": 1000, "ambassador": 5000}', 'حدود الترقية للمستويات'),
('reward_expiry_days', '{"default": 30, "wallet_credit": null}', 'مدة صلاحية الجوائز باليوم'),
('points_expiry_enabled', '{"enabled": false, "days": null}', 'تفعيل انتهاء صلاحية النقاط')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE club_settings IS 'إعدادات النادي القابلة للتعديل بدون Deploy';

-- =================================================================
-- 8. CLUB ACTIVITIES (Placeholder - لاحقاً)
-- =================================================================

CREATE TABLE IF NOT EXISTS club_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type VARCHAR(50),
  title VARCHAR(255),
  scheduled_at TIMESTAMPTZ,
  partner_id UUID REFERENCES club_partners(id),
  points_reward INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_club_activities_type ON club_activities(activity_type);
CREATE INDEX idx_club_activities_scheduled ON club_activities(scheduled_at);
CREATE INDEX idx_club_activities_partner ON club_activities(partner_id);

COMMENT ON TABLE club_activities IS 'الفعاليات والأنشطة (Placeholder للطور القادم)';

-- =================================================================
-- 9. TRIGGERS & FUNCTIONS
-- =================================================================

-- Function: تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: تحديث updated_at للـ club_memberships
CREATE TRIGGER update_club_memberships_updated_at
BEFORE UPDATE ON club_memberships
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger: تحديث updated_at للـ club_partners
CREATE TRIGGER update_club_partners_updated_at
BEFORE UPDATE ON club_partners
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger: تحديث updated_at للـ club_rewards
CREATE TRIGGER update_club_rewards_updated_at
BEFORE UPDATE ON club_rewards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function: إنشاء عضوية تلقائياً عند إنشاء profile
CREATE OR REPLACE FUNCTION auto_create_club_membership()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO club_memberships (user_id, membership_level)
  VALUES (NEW.id, 'community')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: بعد إنشاء profile جديد
CREATE TRIGGER after_profile_insert
AFTER INSERT ON new_profiles
FOR EACH ROW
EXECUTE FUNCTION auto_create_club_membership();

-- Function: إنشاء محفظة نقاط تلقائياً عند إنشاء عضوية
CREATE OR REPLACE FUNCTION auto_create_club_points_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO club_points_wallet (user_id, points_balance, lifetime_points)
  VALUES (NEW.user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: بعد إنشاء عضوية جديدة
CREATE TRIGGER after_club_membership_insert
AFTER INSERT ON club_memberships
FOR EACH ROW
EXECUTE FUNCTION auto_create_club_points_wallet();

-- Function: تحديث رصيد نقاط النادي
CREATE OR REPLACE FUNCTION update_club_points_wallet(
  p_user_id UUID,
  p_points INTEGER,
  p_transaction_type VARCHAR,
  p_reason VARCHAR DEFAULT NULL,
  p_source VARCHAR DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get or create wallet
  INSERT INTO club_points_wallet (user_id, points_balance, lifetime_points)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current balance
  SELECT COALESCE(points_balance, 0) INTO v_balance_before
  FROM club_points_wallet
  WHERE user_id = p_user_id;
  
  -- Update balance based on transaction type
  IF p_transaction_type IN ('EARNED', 'BONUS', 'CONVERTED') THEN
    -- Add points
    UPDATE club_points_wallet
    SET points_balance = points_balance + p_points,
        lifetime_points = lifetime_points + GREATEST(p_points, 0),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    v_balance_after := v_balance_before + p_points;
  ELSIF p_transaction_type IN ('USED', 'EXPIRED', 'ADJUSTED') THEN
    -- Subtract points
    UPDATE club_points_wallet
    SET points_balance = GREATEST(0, points_balance - ABS(p_points)),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    v_balance_after := GREATEST(0, v_balance_before - ABS(p_points));
  ELSE
    RAISE EXCEPTION 'Invalid transaction_type: %', p_transaction_type;
  END IF;
  
  -- Insert transaction record
  INSERT INTO club_points_transactions (
    user_id, transaction_type, points, points_before, points_after, 
    reason, source, description, created_by
  ) VALUES (
    p_user_id, p_transaction_type, p_points, v_balance_before, v_balance_after,
    p_reason, p_source, p_description, p_created_by
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_club_points_wallet IS 'تحديث رصيد نقاط النادي وإنشاء سجل معاملة';

-- =================================================================
-- 10. VIEWS (للفصل بين صلاحيات الشركاء)
-- =================================================================

-- View: جوائز الشريك فقط
CREATE OR REPLACE VIEW partner_rewards_view AS
SELECT 
  r.*,
  p.company_name as partner_name,
  COUNT(DISTINCT rr.id) as total_redemptions
FROM club_rewards r
JOIN club_partners p ON r.partner_id = p.id
LEFT JOIN club_reward_redemptions rr ON r.id = rr.reward_id
WHERE p.user_id = auth.uid()
GROUP BY r.id, p.company_name;

COMMENT ON VIEW partner_rewards_view IS 'جوائز الشريك فقط - للاستخدام في Partner Dashboard';

-- View: إحصائيات الشريك
CREATE OR REPLACE VIEW partner_stats_view AS
SELECT 
  p.id as partner_id,
  p.company_name,
  COUNT(DISTINCT r.id) as total_rewards,
  COUNT(rr.id) as total_redemptions,
  SUM(rr.points_spent) as total_points_redeemed,
  COUNT(DISTINCT rr.user_id) as unique_customers
FROM club_partners p
LEFT JOIN club_rewards r ON p.id = r.partner_id
LEFT JOIN club_reward_redemptions rr ON r.id = rr.reward_id
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.company_name;

COMMENT ON VIEW partner_stats_view IS 'إحصائيات الشريك - عدد الجوائز والاستبدالات';

-- =================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_points_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies للـ club_memberships
CREATE POLICY "User can read own membership"
ON club_memberships FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admin can manage all memberships"
ON club_memberships FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- RLS Policies للـ club_points_wallet
CREATE POLICY "User can read own club wallet"
ON club_points_wallet FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admin can read all club wallets"
ON club_points_wallet FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- Service role can manage wallets (for triggers and functions)
CREATE POLICY "Service role can manage club wallets"
ON club_points_wallet FOR ALL
USING (auth.role() = 'service_role');

-- RLS Policies للـ club_points_transactions
CREATE POLICY "User can read own club transactions"
ON club_points_transactions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admin can read all club transactions"
ON club_points_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- Service role can insert transactions (for functions)
CREATE POLICY "Service role can insert club transactions"
ON club_points_transactions FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- RLS Policies للـ club_partners
CREATE POLICY "Everyone can read active partners"
ON club_partners FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin can manage all partners"
ON club_partners FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Partner can read own partner record"
ON club_partners FOR SELECT
USING (user_id = auth.uid());

-- RLS Policies للـ club_rewards
CREATE POLICY "Everyone can read active rewards"
ON club_rewards FOR SELECT
USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

CREATE POLICY "Admin can manage all rewards"
ON club_rewards FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Partner can manage own rewards"
ON club_rewards FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM club_partners p
    JOIN admins a ON p.user_id::text = a.user_id::text
    WHERE p.id = club_rewards.partner_id
    AND a.user_id = auth.uid()
    AND a.is_active = true
  )
);

-- RLS Policies للـ club_reward_redemptions
CREATE POLICY "User can read own redemptions"
ON club_reward_redemptions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admin can read all redemptions"
ON club_reward_redemptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Partner can read own reward redemptions"
ON club_reward_redemptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM club_rewards r
    JOIN club_partners p ON r.partner_id = p.id
    JOIN admins a ON p.user_id::text = a.user_id::text
    WHERE r.id = club_reward_redemptions.reward_id
    AND a.user_id = auth.uid()
    AND a.is_active = true
  )
);

-- Users can insert their own redemptions
CREATE POLICY "Users can insert own redemptions"
ON club_reward_redemptions FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Service role can update redemptions (for reward application)
CREATE POLICY "Service role can update redemptions"
ON club_reward_redemptions FOR UPDATE
USING (auth.role() = 'service_role');

-- RLS Policies للـ club_settings (Admin only)
CREATE POLICY "Admin can manage club settings"
ON club_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- Everyone can read settings (for public configs)
CREATE POLICY "Everyone can read club settings"
ON club_settings FOR SELECT
USING (true);

-- RLS Policies للـ club_activities (Everyone can read active)
CREATE POLICY "Everyone can read active activities"
ON club_activities FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin can manage all activities"
ON club_activities FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- =================================================================
-- End of Migration
-- =================================================================
