-- Migration: Add is_onboarding_featured column to waste_data_admin table
-- Date: 2026-01-24
-- Description: Adds a boolean field to mark products as featured in onboarding suggestions

-- Add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'waste_data_admin' 
    AND column_name = 'is_onboarding_featured'
  ) THEN
    ALTER TABLE "public"."waste_data_admin" 
    ADD COLUMN "is_onboarding_featured" BOOLEAN NOT NULL DEFAULT false;
    
    RAISE NOTICE 'Column is_onboarding_featured added successfully';
  ELSE
    RAISE NOTICE 'Column is_onboarding_featured already exists';
  END IF;
END $$;
