-- تنظيف: حذف الجدول والمشهد القديم إذا وجد لضمان إنشاء هيكل سليم
DROP VIEW IF EXISTS view_market_trends;
DROP TABLE IF EXISTS exchange_price_history CASCADE;

-- 1. جدول تاريخ الأسعار (The Memory)
CREATE TABLE exchange_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_exchange_id BIGINT REFERENCES stock_exchange(id) ON DELETE CASCADE,
    product_id UUID, -- For simpler querying/trigger compatibility
    
    -- السعر القديم والجديد للمقارنة وحساب المؤشر
    old_buy_price DECIMAL(10, 2), -- سعر الشراء (للمناديب)
    new_buy_price DECIMAL(10, 2),
    
    old_sell_price DECIMAL(10, 2), -- سعر السوق (للمصانع)
    new_sell_price DECIMAL(10, 2),
    
    -- سبب التغيير (يدوي من اللوحة، أم تلقائي من المحرك)
    change_reason TEXT, -- 'manual_adjustment', 'market_fluctuation', 'auto_balancing'
    change_source TEXT DEFAULT 'dashboard', -- 'dashboard', 'system_cron'
    
    changed_by UUID REFERENCES auth.users(id), -- المستخدم الذي قام بالتغيير (null لو السيستم)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- فهرس لسرعة استرجاع البيانات للرسوم البيانية
CREATE INDEX idx_price_history_item_date ON exchange_price_history(stock_exchange_id, created_at DESC);


-- 2. دالة لحساب "مؤشر السوق" (Market Trend Index)
-- تعيد لك: هل السعر زاد أم نقص خلال آخر 24 ساعة و 7 أيام؟
CREATE OR REPLACE VIEW view_market_trends AS
SELECT 
    se.id as stock_exchange_id,
    p.name as product_name,
    se.buy_price as current_price,
    
    -- السعر قبل 24 ساعة
    (
        SELECT new_buy_price 
        FROM exchange_price_history h 
        WHERE h.stock_exchange_id = se.id 
        AND h.created_at <= NOW() - INTERVAL '24 hours'
        ORDER BY h.created_at DESC 
        LIMIT 1
    ) as price_24h_ago,
    
    -- السعر قبل 7 أيام (للمتوسط الأسبوعي)
    (
        SELECT new_buy_price 
        FROM exchange_price_history h 
        WHERE h.stock_exchange_id = se.id 
        AND h.created_at <= NOW() - INTERVAL '7 days'
        ORDER BY h.created_at DESC 
        LIMIT 1
    ) as price_7d_ago

FROM stock_exchange se
JOIN waste_data_admin p ON se.product_id = p.id;
