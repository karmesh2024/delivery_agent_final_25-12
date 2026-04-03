-- ============================================
-- Migration: إضافة description و image_url إلى waste_main_categories
-- ============================================
-- تاريخ: 2026-01-24
-- الوصف: إضافة أعمدة description و image_url إلى جدول waste_main_categories

BEGIN;

-- إضافة عمود description إذا لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'waste_main_categories' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE "public"."waste_main_categories" 
    ADD COLUMN "description" TEXT;
    
    RAISE NOTICE 'Column description added successfully';
  ELSE
    RAISE NOTICE 'Column description already exists';
  END IF;
END $$;

-- إضافة عمود image_url إذا لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'waste_main_categories' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE "public"."waste_main_categories" 
    ADD COLUMN "image_url" TEXT;
    
    RAISE NOTICE 'Column image_url added successfully';
  ELSE
    RAISE NOTICE 'Column image_url already exists';
  END IF;
END $$;

-- إضافة أعمدة created_at و updated_at إذا لم تكن موجودة
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'waste_main_categories' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE "public"."waste_main_categories" 
    ADD COLUMN "created_at" TIMESTAMPTZ DEFAULT NOW();
    
    RAISE NOTICE 'Column created_at added successfully';
  ELSE
    RAISE NOTICE 'Column created_at already exists';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'waste_main_categories' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE "public"."waste_main_categories" 
    ADD COLUMN "updated_at" TIMESTAMPTZ DEFAULT NOW();
    
    RAISE NOTICE 'Column updated_at added successfully';
  ELSE
    RAISE NOTICE 'Column updated_at already exists';
  END IF;
END $$;

COMMIT;

-- التحقق من الأعمدة المضافة
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'waste_main_categories'
ORDER BY ordinal_position;
