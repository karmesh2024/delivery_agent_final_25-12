-- ============================================================
-- نظام العقود والتكاليف التشغيلية — كرمش
-- تاريخ: 2026-02-18 | الإصدار: 2.0 (النسخة المعتمدة)
-- ============================================================
-- ملاحظات:
--   • الأسعار: NUMERIC(15,2)
--   • الكميات: NUMERIC(12,3) — دقة الكيلو
--   • التتبع: delivered_quantity (يزيد فقط) بدل remaining
--   • FK: admins.id (وليس profiles)
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- المرحلة صفر: إضافة حالة contracted لجدول market_bids
-- ════════════════════════════════════════════════════════════

ALTER TABLE market_bids
DROP CONSTRAINT IF EXISTS market_bids_status_check;

ALTER TABLE market_bids
ADD CONSTRAINT market_bids_status_check
CHECK (status IN ('active', 'accepted', 'contracted', 'rejected', 'expired'));


-- ════════════════════════════════════════════════════════════
-- المرحلة الأولى (أ): جدول التكاليف التشغيلية لكل فئة مادة
-- ════════════════════════════════════════════════════════════
-- المستوى الأول: تكلفة افتراضية لكل فئة
-- يمكن تخصيصها لكل عقد عبر operational_cost_override

CREATE TABLE IF NOT EXISTS category_operational_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id BIGINT REFERENCES waste_sub_categories(id) UNIQUE,
    transport_cost NUMERIC(15,2) DEFAULT 0,   -- تكلفة النقل/طن
    sorting_cost NUMERIC(15,2) DEFAULT 0,     -- تكلفة الفرز/طن
    storage_cost NUMERIC(15,2) DEFAULT 0,     -- تكلفة التخزين/طن
    total_cost NUMERIC(15,2) GENERATED ALWAYS AS
        (transport_cost + sorting_cost + storage_cost) STORED,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_category_ops_cost_subcategory
    ON category_operational_costs(subcategory_id);


-- ════════════════════════════════════════════════════════════
-- المرحلة الأولى (ب): جدول العقود الرسمية
-- ════════════════════════════════════════════════════════════
-- العقد ينتهي بـ: (1) التاريخ أو (2) استنفاد الكمية
-- الكمية المتبقية = quantity - delivered_quantity

CREATE TABLE IF NOT EXISTS partner_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- الأطراف
    partner_id UUID REFERENCES industrial_partners(id),
    bid_id UUID REFERENCES market_bids(id),
    subcategory_id BIGINT REFERENCES waste_sub_categories(id),

    -- نوع العقد
    contract_type TEXT CHECK (contract_type IN
        ('one_time', 'short_term', 'long_term')),

    -- التسعير
    agreed_price NUMERIC(15,2) NOT NULL,                  -- سعر البيع للطن
    operational_cost_override NUMERIC(15,2) DEFAULT NULL,  -- NULL = استخدم افتراضي الفئة

    -- الكميات
    quantity NUMERIC(12,3) NOT NULL,                       -- الكمية الإجمالية بالطن
    delivered_quantity NUMERIC(12,3) DEFAULT 0,             -- ما تم توريده فعلاً
    unit TEXT DEFAULT 'ton',

    -- المدة
    start_date DATE,
    end_date DATE,

    -- الحالة والموافقة
    status TEXT CHECK (status IN
        ('draft', 'active', 'completed', 'cancelled', 'expired'))
        DEFAULT 'draft',
    approved_by UUID REFERENCES admins(id),
    approved_at TIMESTAMP WITH TIME ZONE,

    -- ملاحظات
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_contracts_partner ON partner_contracts(partner_id);
CREATE INDEX IF NOT EXISTS idx_contracts_subcategory ON partner_contracts(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON partner_contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_bid ON partner_contracts(bid_id);

-- فهرس مركّب: العقود النشطة غير المستنفدة (الأكثر استخداماً في الحاسبة)
CREATE INDEX IF NOT EXISTS idx_contracts_active_available
    ON partner_contracts(subcategory_id, status)
    WHERE status = 'active';


-- ════════════════════════════════════════════════════════════
-- تفعيل RLS (Row Level Security)
-- ════════════════════════════════════════════════════════════

ALTER TABLE category_operational_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_contracts ENABLE ROW LEVEL SECURITY;

-- قراءة: للمصادقين
CREATE POLICY "Allow authenticated read on category_operational_costs"
    ON category_operational_costs FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on partner_contracts"
    ON partner_contracts FOR SELECT
    TO authenticated USING (true);

-- كتابة: للمصادقين (يمكن تحسينها لاحقاً بربطها بالأدوار)
CREATE POLICY "Allow authenticated insert on category_operational_costs"
    ON category_operational_costs FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on category_operational_costs"
    ON category_operational_costs FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated insert on partner_contracts"
    ON partner_contracts FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on partner_contracts"
    ON partner_contracts FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════════════════
-- ملاحظة: ملف SQL جاهز للتنفيذ في Supabase SQL Editor
-- المستخدم ينفذه يدوياً ثم يبلغ المطور بالنتيجة
-- ════════════════════════════════════════════════════════════
