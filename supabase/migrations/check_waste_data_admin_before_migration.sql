-- ============================================
-- استعلامات فحص البيانات قبل Migration
-- ============================================
-- استخدم هذه الاستعلامات لفحص البيانات قبل تنفيذ Migration
-- لتغيير waste_data_admin.subcategory_id من UUID إلى BIGINT

-- ============================================
-- 1. فحص البيانات الحالية في waste_data_admin
-- ============================================

-- عدد المنتجات الكلي
SELECT COUNT(*) as total_products FROM waste_data_admin;

-- عدد المنتجات التي لديها subcategory_id
SELECT COUNT(*) as products_with_subcategory 
FROM waste_data_admin 
WHERE subcategory_id IS NOT NULL;

-- عدد المنتجات بدون subcategory_id
SELECT COUNT(*) as products_without_subcategory 
FROM waste_data_admin 
WHERE subcategory_id IS NULL;

-- عرض عينة من البيانات الحالية
SELECT 
    id,
    name,
    subcategory_id,
    category_id,
    created_at
FROM waste_data_admin 
WHERE subcategory_id IS NOT NULL
LIMIT 10;

-- ============================================
-- 2. فحص الجدول القديم subcategories
-- ============================================

-- عدد الفئات الفرعية في الجدول القديم
SELECT COUNT(*) as old_subcategories_count 
FROM subcategories;

-- عرض عينة من subcategories القديم
SELECT 
    id,
    name,
    category_id,
    created_at
FROM subcategories
LIMIT 10;

-- ============================================
-- 3. فحص الجدول الجديد waste_sub_categories
-- ============================================

-- عدد الفئات الفرعية في الجدول الجديد
SELECT COUNT(*) as new_subcategories_count 
FROM waste_sub_categories;

-- عرض جميع الفئات الفرعية الجديدة مع الفئات الرئيسية
SELECT 
    wsc.id,
    wsc.code,
    wsc.name as subcategory_name,
    wsc.main_id,
    wmc.name as main_category_name
FROM waste_sub_categories wsc
LEFT JOIN waste_main_categories wmc ON wsc.main_id = wmc.id
ORDER BY wsc.id;

-- ============================================
-- 4. فحص العلاقات الحالية
-- ============================================

-- المنتجات المرتبطة بالفئات الفرعية القديمة
SELECT 
    wda.id as product_id,
    wda.name as product_name,
    wda.subcategory_id as old_subcategory_uuid,
    sc.name as old_subcategory_name,
    sc.category_id as old_category_id
FROM waste_data_admin wda
LEFT JOIN subcategories sc ON wda.subcategory_id::uuid = sc.id
WHERE wda.subcategory_id IS NOT NULL
LIMIT 20;

-- ============================================
-- 5. البحث عن تطابق بين الجدولين القديم والجديد
-- ============================================

-- محاولة ربط subcategories القديم مع waste_sub_categories الجديد
-- (بناءً على الاسم - قد يحتاج تعديل حسب منطقك)
SELECT 
    sc.id as old_id,
    sc.name as old_name,
    wsc.id as new_id,
    wsc.name as new_name,
    wsc.code as new_code,
    CASE 
        WHEN wsc.id IS NOT NULL THEN 'موجود في الجدول الجديد'
        ELSE 'غير موجود في الجدول الجديد'
    END as status
FROM subcategories sc
LEFT JOIN waste_sub_categories wsc ON LOWER(TRIM(sc.name)) = LOWER(TRIM(wsc.name))
ORDER BY sc.name;

-- ============================================
-- 6. فحص المنتجات التي قد تفقد الربط
-- ============================================

-- المنتجات التي لديها subcategory_id لكن لا يوجد تطابق في الجدول الجديد
SELECT 
    wda.id,
    wda.name as product_name,
    wda.subcategory_id,
    sc.name as old_subcategory_name,
    'لا يوجد تطابق في waste_sub_categories' as issue
FROM waste_data_admin wda
INNER JOIN subcategories sc ON wda.subcategory_id::uuid = sc.id
LEFT JOIN waste_sub_categories wsc ON LOWER(TRIM(sc.name)) = LOWER(TRIM(wsc.name))
WHERE wsc.id IS NULL
AND wda.subcategory_id IS NOT NULL;

-- عدد المنتجات التي قد تفقد الربط
SELECT COUNT(*) as products_that_will_lose_link
FROM waste_data_admin wda
INNER JOIN subcategories sc ON wda.subcategory_id::uuid = sc.id
LEFT JOIN waste_sub_categories wsc ON LOWER(TRIM(sc.name)) = LOWER(TRIM(wsc.name))
WHERE wsc.id IS NULL
AND wda.subcategory_id IS NOT NULL;

-- ============================================
-- 7. إنشاء جدول مؤقت للربط (Mapping Table)
-- ============================================

-- إنشاء جدول مؤقت لحفظ الربط بين UUID القديم و BigInt الجديد
CREATE TABLE IF NOT EXISTS temp_subcategory_mapping (
    old_subcategory_uuid UUID PRIMARY KEY,
    old_subcategory_name TEXT,
    new_subcategory_id BIGINT,
    new_subcategory_name TEXT,
    match_method TEXT -- 'exact_name', 'manual', etc.
);

-- ملء الجدول المؤقت بالربط التلقائي (بناءً على الاسم)
-- ملاحظة: يجب إضافة PRIMARY KEY أو UNIQUE constraint على old_subcategory_uuid أولاً
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

-- عرض الجدول المؤقت
SELECT * FROM temp_subcategory_mapping ORDER BY old_subcategory_name;

-- ============================================
-- 8. فحص البيانات بعد إنشاء الجدول المؤقت
-- ============================================

-- عدد المنتجات التي يمكن ربطها تلقائياً
SELECT COUNT(*) as products_can_be_mapped
FROM waste_data_admin wda
INNER JOIN temp_subcategory_mapping tsm ON wda.subcategory_id::uuid = tsm.old_subcategory_uuid;

-- عدد المنتجات التي لا يمكن ربطها تلقائياً (تحتاج تدخل يدوي)
SELECT COUNT(*) as products_need_manual_mapping
FROM waste_data_admin wda
LEFT JOIN temp_subcategory_mapping tsm ON wda.subcategory_id::uuid = tsm.old_subcategory_uuid
WHERE wda.subcategory_id IS NOT NULL
AND tsm.old_subcategory_uuid IS NULL;

-- عرض المنتجات التي تحتاج تدخل يدوي
SELECT 
    wda.id,
    wda.name as product_name,
    wda.subcategory_id,
    sc.name as old_subcategory_name
FROM waste_data_admin wda
INNER JOIN subcategories sc ON wda.subcategory_id::uuid = sc.id
LEFT JOIN temp_subcategory_mapping tsm ON wda.subcategory_id::uuid = tsm.old_subcategory_uuid
WHERE tsm.old_subcategory_uuid IS NULL
AND wda.subcategory_id IS NOT NULL
ORDER BY wda.name;

-- ============================================
-- 9. ملخص شامل
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
