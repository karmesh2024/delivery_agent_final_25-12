-- ============================================
-- استعلامات للمساعدة في الربط اليدوي
-- ============================================
-- استخدم هذه الاستعلامات لربط المنتجات التي لا يمكن ربطها تلقائياً

-- ============================================
-- 1. عرض جميع الفئات الفرعية الجديدة المتاحة
-- ============================================

SELECT 
    wsc.id,
    wsc.code,
    wsc.name,
    wmc.name as main_category,
    COUNT(DISTINCT wda.id) as current_products_count
FROM waste_sub_categories wsc
LEFT JOIN waste_main_categories wmc ON wsc.main_id = wmc.id
LEFT JOIN temp_subcategory_mapping tsm ON wsc.id = tsm.new_subcategory_id
LEFT JOIN waste_data_admin wda ON wda.subcategory_id::uuid = tsm.old_subcategory_uuid
GROUP BY wsc.id, wsc.code, wsc.name, wmc.name
ORDER BY wsc.name;

-- ============================================
-- 2. عرض الفئات الفرعية القديمة التي لم يتم ربطها
-- ============================================

SELECT 
    sc.id as old_id,
    sc.name as old_name,
    sc.category_id as old_category_id,
    c.name as old_category_name,
    COUNT(wda.id) as products_count
FROM subcategories sc
LEFT JOIN categories c ON sc.category_id = c.id
LEFT JOIN temp_subcategory_mapping tsm ON sc.id = tsm.old_subcategory_uuid
LEFT JOIN waste_data_admin wda ON wda.subcategory_id::uuid = sc.id
WHERE tsm.old_subcategory_uuid IS NULL
GROUP BY sc.id, sc.name, sc.category_id, c.name
ORDER BY products_count DESC, sc.name;

-- ============================================
-- 3. إضافة ربط يدوي في الجدول المؤقت
-- ============================================

-- مثال: ربط فئة فرعية قديمة بفئة فرعية جديدة يدوياً
-- استبدل القيم بين الأقواس بالقيم الصحيحة

/*
INSERT INTO temp_subcategory_mapping (
    old_subcategory_uuid, 
    old_subcategory_name, 
    new_subcategory_id, 
    new_subcategory_name, 
    match_method
)
VALUES (
    'UUID_HERE'::uuid,                    -- UUID الفئة الفرعية القديمة
    'اسم الفئة القديمة',                  -- اسم الفئة القديمة
    123,                                  -- ID الفئة الفرعية الجديدة (BigInt)
    'اسم الفئة الجديدة',                  -- اسم الفئة الجديدة
    'manual'                              -- طريقة الربط: manual
);
*/

-- ============================================
-- 4. البحث عن فئة فرعية جديدة مشابهة
-- ============================================

-- استبدل 'اسم_الفئة_القديمة' بالاسم الفعلي
/*
SELECT 
    wsc.id,
    wsc.code,
    wsc.name,
    wmc.name as main_category,
    similarity(LOWER('اسم_الفئة_القديمة'), LOWER(wsc.name)) as similarity_score
FROM waste_sub_categories wsc
LEFT JOIN waste_main_categories wmc ON wsc.main_id = wmc.id
WHERE similarity(LOWER('اسم_الفئة_القديمة'), LOWER(wsc.name)) > 0.3
ORDER BY similarity_score DESC;
*/

-- ============================================
-- 5. عرض المنتجات المرتبطة بفئة فرعية قديمة محددة
-- ============================================

-- استبدل 'UUID_HERE' بـ UUID الفئة الفرعية القديمة
/*
SELECT 
    wda.id,
    wda.name as product_name,
    wda.subcategory_id as old_subcategory_uuid,
    sc.name as old_subcategory_name
FROM waste_data_admin wda
INNER JOIN subcategories sc ON wda.subcategory_id::uuid = sc.id
WHERE wda.subcategory_id::uuid = 'UUID_HERE'::uuid
ORDER BY wda.name;
*/

-- ============================================
-- 6. تحديث ربط موجود في الجدول المؤقت
-- ============================================

-- مثال: تحديث ربط موجود
/*
UPDATE temp_subcategory_mapping
SET 
    new_subcategory_id = 456,              -- ID الفئة الجديدة
    new_subcategory_name = 'اسم الفئة الجديدة',
    match_method = 'manual_updated'
WHERE old_subcategory_uuid = 'UUID_HERE'::uuid;
*/

-- ============================================
-- 7. حذف ربط من الجدول المؤقت
-- ============================================

-- مثال: حذف ربط غير صحيح
/*
DELETE FROM temp_subcategory_mapping
WHERE old_subcategory_uuid = 'UUID_HERE'::uuid;
*/

-- ============================================
-- 8. عرض ملخص الربط اليدوي
-- ============================================

SELECT 
    match_method,
    COUNT(*) as mapping_count,
    COUNT(DISTINCT old_subcategory_uuid) as unique_old_categories,
    COUNT(DISTINCT new_subcategory_id) as unique_new_categories
FROM temp_subcategory_mapping
GROUP BY match_method
ORDER BY mapping_count DESC;

-- ============================================
-- 9. التحقق من صحة الربط اليدوي
-- ============================================

-- التحقق من أن جميع الروابط اليدوية صحيحة
SELECT 
    tsm.old_subcategory_uuid,
    tsm.old_subcategory_name,
    tsm.new_subcategory_id,
    tsm.new_subcategory_name,
    CASE 
        WHEN wsc.id IS NOT NULL THEN '✓ صحيح'
        ELSE '✗ غير صحيح - الفئة الجديدة غير موجودة'
    END as validation_status
FROM temp_subcategory_mapping tsm
LEFT JOIN waste_sub_categories wsc ON tsm.new_subcategory_id = wsc.id
WHERE tsm.match_method = 'manual'
ORDER BY validation_status, tsm.old_subcategory_name;
