-- Migration: إعادة تصنيف الفئات الأساسية بتصنيفات أكثر تحديداً
-- هذا السكريبت يعيد ربط الفئات الأساسية من "General Waste" إلى تصنيفات أكثر تحديداً

-- 1. ربط المخلفات الإلكترونية بتصنيف "المخلفات الإلكترونية"
UPDATE unified_main_categories
SET classification_id = (
  SELECT id FROM unified_classifications 
  WHERE name = 'المخلفات الإلكترونية' 
    AND item_type IN ('waste', 'both')
    AND is_active = true
  LIMIT 1
)
WHERE code IN ('ELECTRONIC', 'WC-007', 'elc')
  AND classification_id = (
    SELECT id FROM unified_classifications 
    WHERE name = 'General Waste' 
    LIMIT 1
  );

-- 2. ربط المعادن بتصنيف "المخلفات الصناعية" (إن وجد) أو "General Waste"
UPDATE unified_main_categories
SET classification_id = (
  SELECT id FROM unified_classifications 
  WHERE name = 'المخلفات الصناعية' 
    AND item_type IN ('waste', 'both')
    AND is_active = true
  LIMIT 1
)
WHERE code IN ('METAL', 'WC-002')
  AND classification_id = (
    SELECT id FROM unified_classifications 
    WHERE name = 'General Waste' 
    LIMIT 1
  )
  AND EXISTS (
    SELECT 1 FROM unified_classifications 
    WHERE name = 'المخلفات الصناعية' 
      AND item_type IN ('waste', 'both')
      AND is_active = true
  );

-- 3. ربط البلاستيك بتصنيف "المخلفات الصناعية" (إن وجد) أو "General Waste"
UPDATE unified_main_categories
SET classification_id = (
  SELECT id FROM unified_classifications 
  WHERE name = 'المخلفات الصناعية' 
    AND item_type IN ('waste', 'both')
    AND is_active = true
  LIMIT 1
)
WHERE code IN ('PLASTIC', 'WC-001', 'WC-795')
  AND classification_id = (
    SELECT id FROM unified_classifications 
    WHERE name = 'General Waste' 
    LIMIT 1
  )
  AND EXISTS (
    SELECT 1 FROM unified_classifications 
    WHERE name = 'المخلفات الصناعية' 
      AND item_type IN ('waste', 'both')
      AND is_active = true
  );

-- 4. ربط الورق والكرتون بتصنيف "المخلفات الصناعية" (إن وجد) أو "General Waste"
UPDATE unified_main_categories
SET classification_id = (
  SELECT id FROM unified_classifications 
  WHERE name = 'المخلفات الصناعية' 
    AND item_type IN ('waste', 'both')
    AND is_active = true
  LIMIT 1
)
WHERE code IN ('PAPER', 'WC-003')
  AND classification_id = (
    SELECT id FROM unified_classifications 
    WHERE name = 'General Waste' 
    LIMIT 1
  )
  AND EXISTS (
    SELECT 1 FROM unified_classifications 
    WHERE name = 'المخلفات الصناعية' 
      AND item_type IN ('waste', 'both')
      AND is_active = true
  );

-- 5. ربط الزجاج بتصنيف "المخلفات الصناعية" (إن وجد) أو "General Waste"
UPDATE unified_main_categories
SET classification_id = (
  SELECT id FROM unified_classifications 
  WHERE name = 'المخلفات الصناعية' 
    AND item_type IN ('waste', 'both')
    AND is_active = true
  LIMIT 1
)
WHERE code IN ('GLASS', 'WC-004')
  AND classification_id = (
    SELECT id FROM unified_classifications 
    WHERE name = 'General Waste' 
    LIMIT 1
  )
  AND EXISTS (
    SELECT 1 FROM unified_classifications 
    WHERE name = 'المخلفات الصناعية' 
      AND item_type IN ('waste', 'both')
      AND is_active = true
  );

-- 6. ربط المواد العضوية بتصنيف "المخلفات الزراعية" (إن وجد) أو "General Waste"
UPDATE unified_main_categories
SET classification_id = (
  SELECT id FROM unified_classifications 
  WHERE name = 'المخلفات الزراعية' 
    AND item_type IN ('waste', 'both')
    AND is_active = true
  LIMIT 1
)
WHERE code IN ('ORGANIC', 'WC-006')
  AND classification_id = (
    SELECT id FROM unified_classifications 
    WHERE name = 'General Waste' 
    LIMIT 1
  )
  AND EXISTS (
    SELECT 1 FROM unified_classifications 
    WHERE name = 'المخلفات الزراعية' 
      AND item_type IN ('waste', 'both')
      AND is_active = true
  );

-- 7. ربط المواد الخطرة بتصنيف "المخلفات الطبية" (إن وجد) أو "General Waste"
UPDATE unified_main_categories
SET classification_id = (
  SELECT id FROM unified_classifications 
  WHERE name = 'المخلفات الطبية' 
    AND item_type IN ('waste', 'both')
    AND is_active = true
  LIMIT 1
)
WHERE code IN ('HAZARDOUS', 'WC-008')
  AND classification_id = (
    SELECT id FROM unified_classifications 
    WHERE name = 'General Waste' 
    LIMIT 1
  )
  AND EXISTS (
    SELECT 1 FROM unified_classifications 
    WHERE name = 'المخلفات الطبية' 
      AND item_type IN ('waste', 'both')
      AND is_active = true
  );

-- 8. ربط الأقمشة بتصنيف "المخلفات الصناعية" (إن وجد) أو "General Waste"
UPDATE unified_main_categories
SET classification_id = (
  SELECT id FROM unified_classifications 
  WHERE name = 'المخلفات الصناعية' 
    AND item_type IN ('waste', 'both')
    AND is_active = true
  LIMIT 1
)
WHERE code IN ('FABRIC', 'WC-005')
  AND classification_id = (
    SELECT id FROM unified_classifications 
    WHERE name = 'General Waste' 
    LIMIT 1
  )
  AND EXISTS (
    SELECT 1 FROM unified_classifications 
    WHERE name = 'المخلفات الصناعية' 
      AND item_type IN ('waste', 'both')
      AND is_active = true
  );

-- ملاحظة: الفئات التي لا تناسب أي تصنيف محدد ستبقى مرتبطة بـ "General Waste"
-- يمكن تعديلها يدوياً من صفحة "إدارة التنظيم والتسلسل"

