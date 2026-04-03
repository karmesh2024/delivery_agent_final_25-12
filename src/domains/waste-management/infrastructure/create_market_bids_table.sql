-- إنشاء جدول عروض السوق (المناقصات اليدوية)
-- يسمح هذا الجدول بتسجيل العروض القادمة من المصانع، التجار، أو الكسارات يدوياً

CREATE TABLE IF NOT EXISTS market_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- ربط العرض بطلب أصلي إذا وجد (الاسم الفعلي للجدول في المشروع هو industrial_partner_orders)
    industrial_order_id UUID REFERENCES industrial_partner_orders(id) ON DELETE SET NULL,
    subcategory_id BIGINT REFERENCES waste_sub_categories(id),
    product_id UUID REFERENCES waste_data_admin(id),
    bidder_name TEXT NOT NULL, -- اسم المصنع أو التاجر
    partner_id UUID REFERENCES industrial_partners(id), -- اختياري إذا كان شريكاً مسجلاً
    bid_price NUMERIC NOT NULL, -- السعر المعروض
    currency TEXT DEFAULT 'EGP', -- العملة (لتغطية التقلبات مستقبلاً)
    quantity NUMERIC, -- الكمية المطلوبة
    unit TEXT DEFAULT 'ton', -- الوحدة (طن، كيلو، الخ)
    delivery_date DATE, -- تاريخ التسليم المطلوب
    expiry_date TIMESTAMP WITH TIME ZONE, -- تاريخ انتهاء صلاحية العرض
    source TEXT CHECK (source IN ('phone', 'whatsapp', 'person', 'app')), -- مصدر العرض
    status TEXT CHECK (status IN ('active', 'accepted', 'rejected', 'expired')) DEFAULT 'active',
    entered_by UUID REFERENCES profiles(id), -- من قام بإدخال العرض (Admin Profile)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء كشافات للبحث السريع
CREATE INDEX IF NOT EXISTS idx_market_bids_subcategory ON market_bids(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_market_bids_product ON market_bids(product_id);
CREATE INDEX IF NOT EXISTS idx_market_bids_status ON market_bids(status);
CREATE INDEX IF NOT EXISTS idx_market_bids_order ON market_bids(industrial_order_id);

-- تفعيل RLS
ALTER TABLE market_bids ENABLE ROW LEVEL SECURITY;

-- سياسة الوصول: فقط المسؤولين (Admins) يمكنهم التحكم في العروض
CREATE POLICY "Admins only access market_bids" ON market_bids
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- التأكد من تحديث حقل updated_at تلقائياً (باستخدام الدالة الموجودة مسبقاً في النظام)
CREATE TRIGGER update_market_bids_updated_at
    BEFORE UPDATE ON market_bids
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
