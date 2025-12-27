-- 1. Drop existing objects to reset schema
DROP VIEW IF EXISTS view_market_trends;
DROP TABLE IF EXISTS exchange_price_history;
DROP TRIGGER IF EXISTS trg_record_price_history ON stock_exchange;
DROP FUNCTION IF EXISTS record_price_history;

-- 2. Recreate Table with product_id column
CREATE TABLE exchange_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_exchange_id BIGINT REFERENCES stock_exchange(id) ON DELETE CASCADE,
    product_id UUID, -- Useful for direct queries
    region_id INT,   -- Useful for direct queries
    
    -- Old/New prices (Buying Price - for representatives)
    old_buy_price DECIMAL(10, 2),
    new_buy_price DECIMAL(10, 2),
    
    -- Old/New prices (Selling Price - for factories)
    old_sell_price DECIMAL(10, 2),
    new_sell_price DECIMAL(10, 2),
    
    change_reason TEXT, -- 'manual_adjustment', 'market_fluctuation', 'auto_balancing'
    change_source TEXT DEFAULT 'dashboard', -- 'dashboard', 'system_cron'
    
    changed_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for performance
CREATE INDEX idx_price_history_item_date ON exchange_price_history(stock_exchange_id, created_at DESC);


-- 3. Recreate View with correct table name (waste_data_admin)
CREATE OR REPLACE VIEW view_market_trends AS
SELECT 
    se.id as stock_exchange_id,
    p.name as product_name,
    se.buy_price as current_price,
    
    -- Price 24h ago
    (
        SELECT new_buy_price 
        FROM exchange_price_history h 
        WHERE h.stock_exchange_id = se.id 
        AND h.created_at <= NOW() - INTERVAL '24 hours'
        ORDER BY h.created_at DESC 
        LIMIT 1
    ) as price_24h_ago,
    
    -- Price 7d ago
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
