-- =================================================================
-- Script للتحقق من تطبيق Migrations
-- تاريخ: يناير 2026
-- الاستخدام: psql -d YOUR_DATABASE -f check_migrations.sql
-- =================================================================

\echo '========================================'
\echo 'التحقق من تطبيق Migrations'
\echo '========================================'
\echo ''

-- ================================================================
-- 1) التحقق من الربحية
-- ================================================================

\echo '1. التحقق من الربحية...'

-- التحقق من waste_collection_items
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'waste_collection_items' 
            AND column_name = 'sell_price'
        ) THEN '✅ sell_price موجود'
        ELSE '❌ sell_price غير موجود'
    END as sell_price_check;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'waste_collection_items' 
            AND column_name = 'item_profit'
        ) THEN '✅ item_profit موجود'
        ELSE '❌ item_profit غير موجود'
    END as item_profit_check;

-- التحقق من waste_collection_sessions
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'waste_collection_sessions' 
            AND column_name = 'buy_total'
        ) THEN '✅ buy_total موجود'
        ELSE '❌ buy_total غير موجود'
    END as buy_total_check;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'waste_collection_sessions' 
            AND column_name = 'sell_total'
        ) THEN '✅ sell_total موجود'
        ELSE '❌ sell_total غير موجود'
    END as sell_total_check;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'waste_collection_sessions' 
            AND column_name = 'platform_profit'
        ) THEN '✅ platform_profit موجود'
        ELSE '❌ platform_profit غير موجود'
    END as platform_profit_check;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'waste_collection_sessions' 
            AND column_name = 'profit_margin'
        ) THEN '✅ profit_margin موجود'
        ELSE '❌ profit_margin غير موجود'
    END as profit_margin_check;

-- ================================================================
-- 2) التحقق من الاحتياطيات المالية
-- ================================================================

\echo ''
\echo '2. التحقق من الاحتياطيات المالية...'

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'financial_reserves'
        ) THEN '✅ جدول financial_reserves موجود'
        ELSE '❌ جدول financial_reserves غير موجود'
    END as financial_reserves_check;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'calculate_daily_reserves'
        ) THEN '✅ Function calculate_daily_reserves موجود'
        ELSE '❌ Function calculate_daily_reserves غير موجود'
    END as calculate_daily_reserves_check;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'get_financial_reserves_summary'
        ) THEN '✅ Function get_financial_reserves_summary موجود'
        ELSE '❌ Function get_financial_reserves_summary غير موجود'
    END as get_financial_reserves_summary_check;

-- ================================================================
-- 3) التحقق من حدود السحب
-- ================================================================

\echo ''
\echo '3. التحقق من حدود السحب...'

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'withdrawal_limits'
        ) THEN '✅ جدول withdrawal_limits موجود'
        ELSE '❌ جدول withdrawal_limits غير موجود'
    END as withdrawal_limits_check;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'check_withdrawal_limits'
        ) THEN '✅ Function check_withdrawal_limits موجود'
        ELSE '❌ Function check_withdrawal_limits غير موجود'
    END as check_withdrawal_limits_check;

-- التحقق من القيم الافتراضية
SELECT 
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ القيم الافتراضية موجودة (' || COUNT(*) || ' سجل)'
        ELSE '⚠️ القيم الافتراضية غير كاملة (' || COUNT(*) || ' سجل)'
    END as default_limits_check
FROM withdrawal_limits
WHERE is_active = true;

-- ================================================================
-- 4) التحقق من قواعد store_points
-- ================================================================

\echo ''
\echo '4. التحقق من قواعد store_points...'

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'store_points_rules'
        ) THEN '✅ جدول store_points_rules موجود'
        ELSE '❌ جدول store_points_rules غير موجود'
    END as store_points_rules_check;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'calculate_store_points_bonus'
        ) THEN '✅ Function calculate_store_points_bonus موجود'
        ELSE '❌ Function calculate_store_points_bonus غير موجود'
    END as calculate_store_points_bonus_check;

-- التحقق من القاعدة الافتراضية
SELECT 
    CASE 
        WHEN COUNT(*) >= 1 THEN '✅ القاعدة الافتراضية موجودة'
        ELSE '⚠️ القاعدة الافتراضية غير موجودة'
    END as default_rule_check
FROM store_points_rules
WHERE rule_type = 'welcome' AND is_active = true;

-- ================================================================
-- 5) التحقق من Triggers
-- ================================================================

\echo ''
\echo '5. التحقق من Triggers...'

SELECT 
    trigger_name,
    event_object_table,
    CASE 
        WHEN trigger_name IS NOT NULL THEN '✅ موجود'
        ELSE '❌ غير موجود'
    END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trigger_calculate_collection_item',
    'trigger_update_session_totals',
    'trigger_calculate_session_points'
  );

-- ================================================================
-- 6) التحقق من stock_exchange
-- ================================================================

\echo ''
\echo '6. التحقق من stock_exchange...'

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'stock_exchange' 
            AND column_name = 'sell_price'
        ) THEN '✅ sell_price موجود في stock_exchange'
        ELSE '⚠️ sell_price غير موجود في stock_exchange (سيستخدم buy_price × 1.2)'
    END as stock_exchange_sell_price_check;

-- ================================================================
-- 7) ملخص عام
-- ================================================================

\echo ''
\echo '========================================'
\echo 'ملخص التحقق'
\echo '========================================'

SELECT 
    'الربحية' as module,
    COUNT(*) FILTER (WHERE column_name IN ('sell_price', 'item_profit', 'buy_total', 'sell_total', 'platform_profit', 'profit_margin')) as columns_found,
    6 as columns_total
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('waste_collection_items', 'waste_collection_sessions')
  AND column_name IN ('sell_price', 'item_profit', 'buy_total', 'sell_total', 'platform_profit', 'profit_margin')

UNION ALL

SELECT 
    'الاحتياطيات' as module,
    COUNT(*) as tables_found,
    1 as tables_total
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'financial_reserves'

UNION ALL

SELECT 
    'حدود السحب' as module,
    COUNT(*) as tables_found,
    1 as tables_total
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'withdrawal_limits'

UNION ALL

SELECT 
    'قواعد store_points' as module,
    COUNT(*) as tables_found,
    1 as tables_total
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'store_points_rules';

\echo ''
\echo '✅ انتهى التحقق'
\echo '========================================'
