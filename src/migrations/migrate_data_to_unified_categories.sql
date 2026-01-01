-- =====================================================
-- نقل البيانات من الجداول القديمة إلى الجداول الموحدة
-- Migrate Data from Old Tables to Unified Tables
-- =====================================================
-- هذا الملف ينقل البيانات من الجداول القديمة إلى الجداول الموحدة
-- يجب تنفيذه بعد إنشاء الجداول الموحدة
-- =====================================================

-- =====================================================
-- 1. نقل البيانات من product_classifications إلى unified_classifications
-- =====================================================

INSERT INTO public.unified_classifications (id, sector_id, name, description, item_type, is_active, created_at, updated_at)
SELECT 
    id,
    sector_id,
    name,
    description,
    'product'::item_type_enum, -- افتراضياً منتجات
    COALESCE(is_active, true),
    created_at,
    updated_at
FROM public.product_classifications
WHERE NOT EXISTS (
    SELECT 1 FROM public.unified_classifications uc 
    WHERE uc.id = product_classifications.id
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. نقل البيانات من waste_categories إلى unified_classifications
-- =====================================================
-- ملاحظة: waste_categories مرتبطة بـ warehouse_sectors مباشرة

INSERT INTO public.unified_classifications (id, sector_id, name, description, item_type, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(), -- إنشاء ID جديد لأن waste_categories قد يكون لها IDs مختلفة
    sector_id,
    name,
    description,
    'waste'::item_type_enum, -- مخلفات
    COALESCE(is_active, true),
    created_at,
    updated_at
FROM public.waste_categories
WHERE sector_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.unified_classifications uc 
    WHERE uc.sector_id = waste_categories.sector_id 
      AND uc.name = waste_categories.name
      AND uc.item_type = 'waste'::item_type_enum
  );

-- =====================================================
-- 3. نقل البيانات من main_categories إلى unified_main_categories
-- =====================================================

INSERT INTO public.unified_main_categories (
    id, 
    classification_id, 
    code, 
    name, 
    description, 
    item_type, 
    parent_id, 
    level, 
    path, 
    is_active, 
    created_at, 
    updated_at
)
SELECT 
    id,
    classification_id,
    COALESCE(
        -- محاولة إنشاء code من name إذا لم يكن موجوداً
        LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g')),
        'CAT-' || id::text
    ) as code,
    name,
    description,
    'product'::item_type_enum, -- افتراضياً منتجات
    parent_id,
    level,
    path,
    COALESCE(is_active, true),
    created_at,
    updated_at
FROM public.main_categories
WHERE classification_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.unified_main_categories umc 
    WHERE umc.id = main_categories.id
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. نقل البيانات من product_main_categories إلى unified_main_categories
-- =====================================================
-- ملاحظة: product_main_categories لا ترتبط بـ classification_id
-- نحتاج إلى ربطها بتصنيف افتراضي أو إنشاء تصنيفات جديدة

-- أولاً: إنشاء تصنيف افتراضي للمنتجات إذا لم يكن موجوداً
DO $$
DECLARE
    default_classification_id UUID;
    sector_id_var UUID;
BEGIN
    -- الحصول على أول قطاع نشط
    SELECT id INTO sector_id_var 
    FROM public.warehouse_sectors 
    WHERE is_active = true 
    LIMIT 1;
    
    IF sector_id_var IS NOT NULL THEN
        -- إنشاء تصنيف افتراضي "منتجات عامة"
        INSERT INTO public.unified_classifications (sector_id, name, name_ar, description, item_type, is_active)
        VALUES (sector_id_var, 'General Products', 'منتجات عامة', 'تصنيف افتراضي للمنتجات', 'product'::item_type_enum, true)
        ON CONFLICT DO NOTHING
        RETURNING id INTO default_classification_id;
        
        -- إذا لم يتم إنشاء تصنيف جديد، جلب الموجود
        IF default_classification_id IS NULL THEN
            SELECT id INTO default_classification_id 
            FROM public.unified_classifications 
            WHERE name = 'General Products' 
            LIMIT 1;
        END IF;
        
        -- نقل البيانات من product_main_categories
        INSERT INTO public.unified_main_categories (
            classification_id,
            code,
            name,
            item_type,
            is_active,
            created_at
        )
        SELECT 
            default_classification_id,
            code,
            name,
            'product'::item_type_enum,
            true,
            now()
        FROM public.product_main_categories
        WHERE NOT EXISTS (
            SELECT 1 FROM public.unified_main_categories umc 
            WHERE umc.code = product_main_categories.code
        )
        ON CONFLICT (code) DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- 5. نقل البيانات من waste_main_categories إلى unified_main_categories
-- =====================================================

DO $$
DECLARE
    default_waste_classification_id UUID;
    sector_id_var UUID;
BEGIN
    -- الحصول على أول قطاع نشط
    SELECT id INTO sector_id_var 
    FROM public.warehouse_sectors 
    WHERE is_active = true 
    LIMIT 1;
    
    IF sector_id_var IS NOT NULL THEN
        -- إنشاء تصنيف افتراضي "مخلفات عامة"
        INSERT INTO public.unified_classifications (sector_id, name, name_ar, description, item_type, is_active)
        VALUES (sector_id_var, 'General Waste', 'مخلفات عامة', 'تصنيف افتراضي للمخلفات', 'waste'::item_type_enum, true)
        ON CONFLICT DO NOTHING
        RETURNING id INTO default_waste_classification_id;
        
        -- إذا لم يتم إنشاء تصنيف جديد، جلب الموجود
        IF default_waste_classification_id IS NULL THEN
            SELECT id INTO default_waste_classification_id 
            FROM public.unified_classifications 
            WHERE name = 'General Waste' 
            LIMIT 1;
        END IF;
        
        -- نقل البيانات من waste_main_categories
        INSERT INTO public.unified_main_categories (
            classification_id,
            code,
            name,
            item_type,
            is_active,
            created_at
        )
        SELECT 
            default_waste_classification_id,
            code,
            name,
            'waste'::item_type_enum,
            true,
            now()
        FROM public.waste_main_categories
        WHERE NOT EXISTS (
            SELECT 1 FROM public.unified_main_categories umc 
            WHERE umc.code = waste_main_categories.code
        )
        ON CONFLICT (code) DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- 6. نقل البيانات من sub_categories إلى unified_sub_categories
-- =====================================================

INSERT INTO public.unified_sub_categories (
    id,
    main_category_id,
    code,
    name,
    description,
    item_type,
    parent_id,
    level,
    path,
    is_active,
    created_at,
    updated_at
)
SELECT 
    id,
    main_category_id,
    COALESCE(
        LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g')),
        'SUB-' || id::text
    ) as code,
    name,
    description,
    'product'::item_type_enum, -- افتراضياً منتجات
    parent_id,
    level,
    path,
    COALESCE(is_active, true),
    created_at,
    updated_at
FROM public.sub_categories
WHERE main_category_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.unified_main_categories umc 
    WHERE umc.id = sub_categories.main_category_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.unified_sub_categories usc 
    WHERE usc.id = sub_categories.id
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 7. نقل البيانات من product_sub_categories إلى unified_sub_categories
-- =====================================================

INSERT INTO public.unified_sub_categories (
    main_category_id,
    code,
    name,
    item_type,
    is_active,
    created_at
)
SELECT 
    umc.id, -- استخدام unified_main_categories.id بدلاً من main_id
    psc.code,
    psc.name,
    'product'::item_type_enum,
    true,
    now()
FROM public.product_sub_categories psc
JOIN public.unified_main_categories umc ON umc.code = (
    SELECT code FROM public.product_main_categories pmc 
    WHERE pmc.id = psc.main_id
)
WHERE NOT EXISTS (
    SELECT 1 FROM public.unified_sub_categories usc 
    WHERE usc.code = psc.code
)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 8. نقل البيانات من waste_sub_categories إلى unified_sub_categories
-- =====================================================

INSERT INTO public.unified_sub_categories (
    main_category_id,
    code,
    name,
    item_type,
    is_active,
    created_at
)
SELECT 
    umc.id, -- استخدام unified_main_categories.id بدلاً من main_id
    wsc.code,
    wsc.name,
    'waste'::item_type_enum,
    true,
    now()
FROM public.waste_sub_categories wsc
JOIN public.unified_main_categories umc ON umc.code = (
    SELECT code FROM public.waste_main_categories wmc 
    WHERE wmc.id = wsc.main_id
)
WHERE NOT EXISTS (
    SELECT 1 FROM public.unified_sub_categories usc 
    WHERE usc.code = wsc.code
)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 9. نقل البيانات من store_brands إلى unified_brands
-- =====================================================

INSERT INTO public.unified_brands (
    name_ar,
    name_en,
    logo_url,
    description_ar,
    description_en,
    website,
    is_active,
    created_at,
    updated_at
)
SELECT 
    name_ar,
    name_en,
    logo_url,
    description_ar,
    description_en,
    website,
    COALESCE(is_active, true),
    created_at,
    updated_at
FROM public.store_brands
WHERE NOT EXISTS (
    SELECT 1 FROM public.unified_brands ub 
    WHERE ub.name_ar = store_brands.name_ar
)
ON CONFLICT (name_ar) DO NOTHING;

-- =====================================================
-- 10. نقل البيانات من warehouse_product_brands إلى unified_brands
-- =====================================================

INSERT INTO public.unified_brands (
    name_ar,
    name_en,
    logo_url,
    description_ar,
    is_active,
    created_at
)
SELECT 
    name,
    name, -- استخدام name كـ name_en أيضاً
    logo_url,
    description,
    true,
    created_at
FROM public.warehouse_product_brands
WHERE NOT EXISTS (
    SELECT 1 FROM public.unified_brands ub 
    WHERE ub.name_ar = warehouse_product_brands.name
)
ON CONFLICT (name_ar) DO NOTHING;

-- =====================================================
-- 11. ربط الوحدات بالتصنيفات (مثال)
-- =====================================================
-- يمكن ربط جميع الوحدات بجميع التصنيفات أو تحديد وحدات معينة لكل تصنيف

-- مثال: ربط جميع الوحدات بتصنيف "منتجات عامة"
INSERT INTO public.classification_units (classification_id, unit_id, is_default, sort_order)
SELECT 
    uc.id,
    u.id,
    false,
    ROW_NUMBER() OVER (ORDER BY u.id)
FROM public.unified_classifications uc
CROSS JOIN public.units u
WHERE uc.name = 'General Products'
  AND NOT EXISTS (
    SELECT 1 FROM public.classification_units cu 
    WHERE cu.classification_id = uc.id 
      AND cu.unit_id = u.id
  )
ON CONFLICT (classification_id, unit_id) DO NOTHING;

-- =====================================================
-- 12. ربط البراندز بالتصنيفات (مثال)
-- =====================================================
-- يمكن ربط البراندز بتصنيفات معينة حسب الحاجة

-- مثال: ربط جميع البراندز بتصنيف "منتجات عامة"
INSERT INTO public.classification_brands (classification_id, brand_id, is_default, sort_order)
SELECT 
    uc.id,
    ub.id,
    false,
    ROW_NUMBER() OVER (ORDER BY ub.id)
FROM public.unified_classifications uc
CROSS JOIN public.unified_brands ub
WHERE uc.name = 'General Products'
  AND ub.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.classification_brands cb 
    WHERE cb.classification_id = uc.id 
      AND cb.brand_id = ub.id
  )
ON CONFLICT (classification_id, brand_id) DO NOTHING;

-- =====================================================
-- 13. ملاحظات مهمة
-- =====================================================

/*
ملاحظات:
1. هذا الملف ينقل البيانات الأساسية فقط
2. قد تحتاج إلى تعديل بعض الاستعلامات حسب بياناتك الفعلية
3. يجب التحقق من البيانات المنقولة بعد التنفيذ
4. يمكن إضافة المزيد من المنطق لنقل البيانات بشكل أكثر ذكاءً
5. قد تحتاج إلى إنشاء تصنيفات جديدة لربط الفئات التي لا ترتبط بتصنيفات موجودة
*/


