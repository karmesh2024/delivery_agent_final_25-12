-- إضافة عمود name (نص)
ALTER TABLE public.permissions
ADD COLUMN IF NOT EXISTS name text;

-- إضافة عمود group_id (uuid) مع ربطه بجدول admin_groups
ALTER TABLE public.permissions
ADD COLUMN IF NOT EXISTS group_id uuid;

-- إضافة قيد المفتاح الخارجي إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'permissions_group_id_fkey'
      AND table_name = 'permissions'
  ) THEN
    ALTER TABLE public.permissions
    ADD CONSTRAINT permissions_group_id_fkey
    FOREIGN KEY (group_id) REFERENCES admin_groups(id)
    ON DELETE SET NULL;
  END IF;
END$$;
