-- ============================================
-- Migration: إضافة description و image_url إلى waste_sub_categories
-- ============================================
-- تاريخ: 2026-01-24
-- الوصف: إضافة أعمدة description و image_url إلى جدول waste_sub_categories

BEGIN;

-- إضافة عمود description إذا لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'waste_sub_categories' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE "public"."waste_sub_categories" 
    ADD COLUMN "description" TEXT;
    
    RAISE NOTICE 'Column description added to waste_sub_categories successfully';
  ELSE
    RAISE NOTICE 'Column description already exists in waste_sub_categories';
  END IF;
END $$;

-- إضافة عمود image_url إذا لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'waste_sub_categories' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE "public"."waste_sub_categories" 
    ADD COLUMN "image_url" TEXT;
    
    RAISE NOTICE 'Column image_url added to waste_sub_categories successfully';
  ELSE
    RAISE NOTICE 'Column image_url already exists in waste_sub_categories';
  END IF;
END $$;

COMMIT;

-- التحقق من الأعمدة
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'waste_sub_categories'
ORDER BY ordinal_position;
