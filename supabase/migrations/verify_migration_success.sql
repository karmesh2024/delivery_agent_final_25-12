-- ============================================
-- استعلامات التحقق من نجاح Migration
-- ============================================
-- شغّل هذه الاستعلامات بعد Migration للتأكد من أن كل شيء يعمل بشكل صحيح

-- ============================================
-- 1. التحقق من نوع العمود الجديد
-- ============================================

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'waste_data_admin'
AND column_name = 'subcategory_id';

-- يجب أن تكون النتيجة: data_type = 'bigint'

-- ============================================
-- 2. التحقق من القيد الخارجي الجديد
-- ============================================

SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'waste_data_admin'
AND kcu.column_name = 'subcategory_id';

-- يجب أن تكون foreign_table_name = 'waste_sub_categories'

-- ============================================
-- 3. التحقق من البيانات المحولة
-- ============================================

SELECT 
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE subcategory_id IS NOT NULL) as products_with_subcategory,
    COUNT(*) FILTER (WHERE subcategory_id IS NULL) as products_without_subcategory
FROM waste_data_admin;

-- ============================================
-- 4. التحقق من صحة جميع الروابط
-- ============================================

SELECT 
    COUNT(*) as total_products_with_subcategory,
    COUNT(*) FILTER (
        WHERE EXISTS (
            SELECT 1 
            FROM waste_sub_categories wsc 
            WHERE wsc.id = waste_data_admin.subcategory_id
        )
    ) as correctly_linked_products,
    COUNT(*) FILTER (
        WHERE NOT EXISTS (
            SELECT 1 
            FROM waste_sub_categories wsc 
            WHERE wsc.id = waste_data_admin.subcategory_id
        )
    ) as incorrectly_linked_products
FROM waste_data_admin
WHERE subcategory_id IS NOT NULL;

-- يجب أن تكون incorrectly_linked_products = 0

-- ============================================
-- 5. عرض عينة من البيانات المحولة
-- ============================================

SELECT 
    wda.id,
    wda.name as product_name,
    wda.subcategory_id as new_bigint_id,
    wsc.name as subcategory_name,
    wsc.code as subcategory_code,
    wmc.name as main_category_name
FROM waste_data_admin wda
LEFT JOIN waste_sub_categories wsc ON wda.subcategory_id = wsc.id
LEFT JOIN waste_main_categories wmc ON wsc.main_id = wmc.id
WHERE wda.subcategory_id IS NOT NULL
ORDER BY wda.name
LIMIT 20;

-- ============================================
-- 6. التحقق من الفهارس
-- ============================================

SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'waste_data_admin'
AND indexname LIKE '%subcategory%';

-- ============================================
-- 7. ملخص شامل
-- ============================================

SELECT 
    'Migration Status' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'waste_data_admin'
            AND column_name = 'subcategory_id'
            AND data_type = 'bigint'
        ) THEN '✓ نوع العمود صحيح (BIGINT)'
        ELSE '✗ نوع العمود غير صحيح'
    END as status
UNION ALL
SELECT 
    'Foreign Key' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
            WHERE tc.table_name = 'waste_data_admin'
            AND kcu.column_name = 'subcategory_id'
            AND ccu.table_name = 'waste_sub_categories'
        ) THEN '✓ القيد الخارجي موجود وصحيح'
        ELSE '✗ القيد الخارجي غير موجود'
    END as status
UNION ALL
SELECT 
    'Data Integrity' as check_type,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM waste_data_admin wda
            WHERE wda.subcategory_id IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM waste_sub_categories wsc 
                WHERE wsc.id = wda.subcategory_id
            )
        ) THEN '✓ جميع الروابط صحيحة'
        ELSE '✗ يوجد روابط غير صحيحة'
    END as status;
