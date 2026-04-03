-- ============================================
-- Migration: تغيير waste_data_admin.subcategory_id من UUID إلى BIGINT
-- ============================================
-- تاريخ: 2026-01-24
-- الوصف: يغير نوع subcategory_id من UUID إلى BIGINT ويربطه بـ waste_sub_categories

-- ============================================
-- ⚠️ تحذير: قم بتشغيل استعلامات الفحص أولاً!
-- ============================================
-- تأكد من تشغيل: check_waste_data_admin_before_migration.sql
-- قبل تنفيذ هذا الملف

BEGIN;

-- ============================================
-- الخطوة 1: إنشاء عمود مؤقت للبيانات الجديدة
-- ============================================

-- إضافة عمود مؤقت من نوع BIGINT
ALTER TABLE waste_data_admin 
ADD COLUMN IF NOT EXISTS subcategory_id_new BIGINT;

-- ============================================
-- الخطوة 2: ملء العمود المؤقت بالبيانات المحولة
-- ============================================

-- تحديث العمود المؤقت باستخدام الجدول المؤقت للربط
-- (يجب أن يكون temp_subcategory_mapping موجوداً ومملوءاً)
UPDATE waste_data_admin wda
SET subcategory_id_new = tsm.new_subcategory_id
FROM temp_subcategory_mapping tsm
WHERE wda.subcategory_id::uuid = tsm.old_subcategory_uuid
AND tsm.new_subcategory_id IS NOT NULL;

-- ============================================
-- الخطوة 3: التحقق من البيانات المحولة
-- ============================================

-- عدد المنتجات التي تم تحويلها بنجاح
DO $$
DECLARE
    converted_count INTEGER;
    total_with_subcategory INTEGER;
BEGIN
    SELECT COUNT(*) INTO converted_count
    FROM waste_data_admin
    WHERE subcategory_id_new IS NOT NULL;
    
    SELECT COUNT(*) INTO total_with_subcategory
    FROM waste_data_admin
    WHERE subcategory_id IS NOT NULL;
    
    RAISE NOTICE 'تم تحويل % من أصل % منتج', converted_count, total_with_subcategory;
    
    IF converted_count < total_with_subcategory THEN
        RAISE WARNING 'تحذير: بعض المنتجات لم يتم تحويلها! يرجى المراجعة اليدوية.';
    END IF;
END $$;

-- ============================================
-- الخطوة 4: إزالة القيد الخارجي القديم
-- ============================================

ALTER TABLE waste_data_admin 
DROP CONSTRAINT IF EXISTS waste_data_admin_subcategory_id_fkey;

-- ============================================
-- الخطوة 5: حذف العمود القديم وإعادة تسمية الجديد
-- ============================================

-- حذف العمود القديم
ALTER TABLE waste_data_admin 
DROP COLUMN IF EXISTS subcategory_id;

-- إعادة تسمية العمود الجديد
ALTER TABLE waste_data_admin 
RENAME COLUMN subcategory_id_new TO subcategory_id;

-- ============================================
-- الخطوة 6: إضافة القيد الخارجي الجديد
-- ============================================

ALTER TABLE waste_data_admin 
ADD CONSTRAINT waste_data_admin_subcategory_id_fkey 
FOREIGN KEY (subcategory_id) 
REFERENCES waste_sub_categories(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- ============================================
-- الخطوة 7: إضافة فهرس لتحسين الأداء
-- ============================================

CREATE INDEX IF NOT EXISTS idx_waste_data_admin_subcategory_id 
ON waste_data_admin(subcategory_id);

-- ============================================
-- الخطوة 8: التحقق النهائي
-- ============================================

-- التحقق من أن جميع المنتجات التي لديها subcategory_id مرتبطة بشكل صحيح
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM waste_data_admin wda
    WHERE wda.subcategory_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 
        FROM waste_sub_categories wsc 
        WHERE wsc.id = wda.subcategory_id
    );
    
    IF invalid_count > 0 THEN
        RAISE WARNING 'تحذير: يوجد % منتج برابط غير صحيح!', invalid_count;
    ELSE
        RAISE NOTICE '✓ تم التحقق: جميع الروابط صحيحة';
    END IF;
END $$;

-- ============================================
-- الخطوة 9: عرض ملخص التغييرات
-- ============================================

SELECT 
    'Migration Completed' as status,
    COUNT(*) FILTER (WHERE subcategory_id IS NOT NULL) as products_with_subcategory,
    COUNT(*) FILTER (WHERE subcategory_id IS NULL) as products_without_subcategory,
    COUNT(*) as total_products
FROM waste_data_admin;

COMMIT;

-- ============================================
-- ملاحظات مهمة:
-- ============================================
-- 1. بعد تنفيذ هذا Migration، يجب تحديث Prisma Schema
-- 2. قم بتشغيل: npx prisma generate
-- 3. اختبر النظام للتأكد من عمل كل شيء بشكل صحيح
-- 4. يمكنك حذف الجدول المؤقت بعد التأكد: DROP TABLE IF EXISTS temp_subcategory_mapping;
