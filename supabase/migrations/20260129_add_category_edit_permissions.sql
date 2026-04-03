-- إضافة صلاحيات تعديل الفئات والمنتجات (توحيد المصدر بالصلاحيات)
-- راجع: docs/توحيد_المصدر_وإدراج_النقاط_والباسكت_في_إدارة_التنظيم.md
-- الصلاحيات: waste_categories:edit, product_categories:edit, organization_structure:manage

DO $$
DECLARE
  rid uuid;
  aid_edit uuid;
  aid_manage uuid;
BEGIN
  -- إضافة أو تحديث إجراء "تعديل"
  INSERT INTO public.actions (id, name, code, created_at)
  VALUES (gen_random_uuid(), 'تعديل', 'edit', NOW())
  ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO aid_edit;
  IF aid_edit IS NULL THEN
    SELECT id INTO aid_edit FROM public.actions WHERE code = 'edit' LIMIT 1;
  END IF;

  -- إضافة أو تحديث إجراء "إدارة"
  INSERT INTO public.actions (id, name, code, created_at)
  VALUES (gen_random_uuid(), 'إدارة', 'manage', NOW())
  ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO aid_manage;
  IF aid_manage IS NULL THEN
    SELECT id INTO aid_manage FROM public.actions WHERE code = 'manage' LIMIT 1;
  END IF;

  -- صلاحية waste_categories:edit (تعديل من إدارة المخلفات)
  INSERT INTO public.resources (id, name, code, is_active, created_at, updated_at)
  VALUES (gen_random_uuid(), 'فئات المخلفات', 'waste_categories', true, NOW(), NOW())
  ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
  RETURNING id INTO rid;
  IF rid IS NULL THEN
    SELECT id INTO rid FROM public.resources WHERE code = 'waste_categories' LIMIT 1;
  END IF;
  INSERT INTO public.permissions (id, code, resource_id, action_id, description, created_at, updated_at)
  VALUES (gen_random_uuid(), 'waste_categories:edit', rid, aid_edit, 'تعديل الفئات والمنتجات من إدارة المخلفات', NOW(), NOW())
  ON CONFLICT (code) DO NOTHING;

  -- صلاحية product_categories:edit (تعديل من إدارة الفئات والمنتجات)
  INSERT INTO public.resources (id, name, code, is_active, created_at, updated_at)
  VALUES (gen_random_uuid(), 'فئات المنتجات', 'product_categories', true, NOW(), NOW())
  ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
  RETURNING id INTO rid;
  IF rid IS NULL THEN
    SELECT id INTO rid FROM public.resources WHERE code = 'product_categories' LIMIT 1;
  END IF;
  INSERT INTO public.permissions (id, code, resource_id, action_id, description, created_at, updated_at)
  VALUES (gen_random_uuid(), 'product_categories:edit', rid, aid_edit, 'تعديل الفئات والمنتجات من إدارة الفئات والمنتجات', NOW(), NOW())
  ON CONFLICT (code) DO NOTHING;

  -- صلاحية organization_structure:manage (إدارة التنظيم والتسلسل)
  INSERT INTO public.resources (id, name, code, is_active, created_at, updated_at)
  VALUES (gen_random_uuid(), 'هيكل التنظيم والتسلسل', 'organization_structure', true, NOW(), NOW())
  ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
  RETURNING id INTO rid;
  IF rid IS NULL THEN
    SELECT id INTO rid FROM public.resources WHERE code = 'organization_structure' LIMIT 1;
  END IF;
  INSERT INTO public.permissions (id, code, resource_id, action_id, description, created_at, updated_at)
  VALUES (gen_random_uuid(), 'organization_structure:manage', rid, aid_manage, 'إدارة التنظيم والتسلسل (الفئات والمنتجات)', NOW(), NOW())
  ON CONFLICT (code) DO NOTHING;
END $$;
