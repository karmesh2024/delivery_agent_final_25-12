-- ============================================
-- استعلامات سريعة للتحقق بعد التصحيحات
-- ============================================
-- شغّل هذه الاستعلامات للتأكد من أن كل شيء يعمل بشكل صحيح

-- ============================================
-- 1. التحقق من إنشاء الجدول المؤقت
-- ============================================

-- إنشاء الجدول المؤقت إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS temp_subcategory_mapping (
    old_subcategory_uuid UUID PRIMARY KEY,
    old_subcategory_name TEXT,
    new_subcategory_id BIGINT,
    new_subcategory_name TEXT,
    match_method TEXT
);

-- ============================================
-- 2. ملء الجدول المؤقت بالربط التلقائي
-- ============================================

-- حذف البيانات القديمة أولاً (اختياري)
-- DELETE FROM temp_subcategory_mapping;

-- ملء الجدول بالربط التلقائي
INSERT INTO temp_subcategory_mapping (old_subcategory_uuid, old_subcategory_name, new_subcategory_id, new_subcategory_name, match_method)
SELECT DISTINCT ON (sc.id)
    sc.id as old_subcategory_uuid,
    sc.name as old_subcategory_name,
    wsc.id as new_subcategory_id,
    wsc.name as new_subcategory_name,
    'exact_name' as match_method
FROM subcategories sc
INNER JOIN waste_sub_categories wsc ON LOWER(TRIM(sc.name)) = LOWER(TRIM(wsc.name))
WHERE NOT EXISTS (
    SELECT 1 FROM temp_subcategory_mapping tsm 
    WHERE tsm.old_subcategory_uuid = sc.id
);

-- ============================================
-- 3. عرض الجدول المؤقت
-- ============================================

SELECT 
    old_subcategory_uuid,
    old_subcategory_name,
    new_subcategory_id,
    new_subcategory_name,
    match_method
FROM temp_subcategory_mapping
ORDER BY old_subcategory_name;

-- ============================================
-- 4. التحقق من الربط
-- ============================================

-- عدد المنتجات التي يمكن ربطها تلقائياً
SELECT 
    COUNT(*) as products_can_be_mapped,
    COUNT(DISTINCT wda.subcategory_id) as unique_subcategories_linked
FROM waste_data_admin wda
INNER JOIN temp_subcategory_mapping tsm ON wda.subcategory_id::uuid = tsm.old_subcategory_uuid
WHERE wda.subcategory_id IS NOT NULL;

-- ============================================
-- 5. عرض المنتجات المرتبطة
-- ============================================

SELECT 
    wda.id,
    wda.name as product_name,
    wda.subcategory_id as old_uuid,
    tsm.old_subcategory_name,
    tsm.new_subcategory_id,
    tsm.new_subcategory_name,
    wsc.code as new_subcategory_code
FROM waste_data_admin wda
INNER JOIN temp_subcategory_mapping tsm ON wda.subcategory_id::uuid = tsm.old_subcategory_uuid
LEFT JOIN waste_sub_categories wsc ON tsm.new_subcategory_id = wsc.id
WHERE wda.subcategory_id IS NOT NULL
ORDER BY wda.name
LIMIT 20;

-- ============================================
-- 6. ملخص شامل
-- ============================================

SELECT 
    'إجمالي المنتجات' as metric,
    COUNT(*)::text as value
FROM waste_data_admin
UNION ALL
SELECT 
    'منتجات مع subcategory_id' as metric,
    COUNT(*)::text
FROM waste_data_admin 
WHERE subcategory_id IS NOT NULL
UNION ALL
SELECT 
    'منتجات بدون subcategory_id' as metric,
    COUNT(*)::text
FROM waste_data_admin 
WHERE subcategory_id IS NULL
UNION ALL
SELECT 
    'فئات فرعية قديمة (subcategories)' as metric,
    COUNT(*)::text
FROM subcategories
UNION ALL
SELECT 
    'فئات فرعية جديدة (waste_sub_categories)' as metric,
    COUNT(*)::text
FROM waste_sub_categories
UNION ALL
SELECT 
    'روابط في الجدول المؤقت' as metric,
    COUNT(*)::text
FROM temp_subcategory_mapping
UNION ALL
SELECT 
    'منتجات يمكن ربطها تلقائياً' as metric,
    COUNT(DISTINCT wda.id)::text
FROM waste_data_admin wda
INNER JOIN temp_subcategory_mapping tsm ON wda.subcategory_id::uuid = tsm.old_subcategory_uuid
UNION ALL
SELECT 
    'منتجات تحتاج تدخل يدوي' as metric,
    COUNT(DISTINCT wda.id)::text
FROM waste_data_admin wda
LEFT JOIN temp_subcategory_mapping tsm ON wda.subcategory_id::uuid = tsm.old_subcategory_uuid
WHERE wda.subcategory_id IS NOT NULL
AND tsm.old_subcategory_uuid IS NULL;
