-- إضافة الصلاحيات الخاصة بإدارة المشتريات والمخازن والتسعير

-- 1. إضافة صلاحيات إدارة المشتريات
INSERT INTO public.permissions (code, name, name_ar, description, description_ar, resource, action, created_at, updated_at)
VALUES 
  ('purchasing:invoices:create', 'Create Purchase Invoice', 'إنشاء فاتورة مشتريات', 'Create new purchase invoices', 'إنشاء فواتير مشتريات جديدة', 'purchasing:invoices', 'create', NOW(), NOW()),
  ('purchasing:invoices:view', 'View Purchase Invoices', 'عرض فواتير المشتريات', 'View purchase invoices', 'عرض فواتير المشتريات', 'purchasing:invoices', 'view', NOW(), NOW()),
  ('purchasing:invoices:edit', 'Edit Purchase Invoice', 'تعديل فاتورة مشتريات', 'Edit purchase invoices', 'تعديل فواتير المشتريات', 'purchasing:invoices', 'edit', NOW(), NOW()),
  ('purchasing:invoices:delete', 'Delete Purchase Invoice', 'حذف فاتورة مشتريات', 'Delete purchase invoices', 'حذف فواتير المشتريات', 'purchasing:invoices', 'delete', NOW(), NOW()),
  ('purchasing:invoices:approve', 'Approve Purchase Invoice', 'الموافقة على فاتورة مشتريات', 'Approve purchase invoices', 'الموافقة على فواتير المشتريات', 'purchasing:invoices', 'approve', NOW(), NOW()),
  ('purchasing:invoices:send_to_warehouse', 'Send Invoice to Warehouse', 'إرسال فاتورة للمخازن', 'Send invoice to warehouse', 'إرسال فاتورة للمخازن', 'purchasing:invoices', 'send_to_warehouse', NOW(), NOW()),
  ('purchasing:invoices:send_to_pricing', 'Send Invoice to Pricing', 'إرسال فاتورة للتسعير', 'Send invoice to pricing', 'إرسال فاتورة لإدارة التسعير', 'purchasing:invoices', 'send_to_pricing', NOW(), NOW()),
  ('purchasing:suppliers:manage', 'Manage Suppliers', 'إدارة الموردين', 'Manage suppliers', 'إدارة الموردين', 'purchasing:suppliers', 'manage', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- 2. إضافة صلاحيات إدارة المخازن
INSERT INTO public.permissions (code, name, name_ar, description, description_ar, resource, action, created_at, updated_at)
VALUES 
  ('warehouse:assignments:view', 'View Warehouse Assignments', 'عرض أوامر الإسناد', 'View warehouse assignment orders', 'عرض أوامر الإسناد للمخازن', 'warehouse:assignments', 'view', NOW(), NOW()),
  ('warehouse:assignments:receive', 'Receive Warehouse Assignment', 'استلام أمر إسناد', 'Receive warehouse assignment orders', 'استلام أوامر الإسناد', 'warehouse:assignments', 'receive', NOW(), NOW()),
  ('warehouse:assignments:update', 'Update Warehouse Assignment', 'تحديث أمر إسناد', 'Update warehouse assignment orders', 'تحديث أوامر الإسناد', 'warehouse:assignments', 'update', NOW(), NOW()),
  ('warehouse:inventory:view', 'View Warehouse Inventory', 'عرض مخزون المخازن', 'View warehouse inventory', 'عرض مخزون المخازن', 'warehouse:inventory', 'view', NOW(), NOW()),
  ('warehouse:inventory:manage', 'Manage Warehouse Inventory', 'إدارة مخزون المخازن', 'Manage warehouse inventory', 'إدارة مخزون المخازن', 'warehouse:inventory', 'manage', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- 3. إضافة صلاحيات إدارة التسعير
INSERT INTO public.permissions (code, name, name_ar, description, description_ar, resource, action, created_at, updated_at)
VALUES 
  ('pricing:view', 'View Pricing', 'عرض التسعير', 'View product pricing', 'عرض أسعار المنتجات', 'pricing', 'view', NOW(), NOW()),
  ('pricing:set', 'Set Pricing', 'تعيين التسعير', 'Set product pricing', 'تعيين أسعار المنتجات', 'pricing', 'set', NOW(), NOW()),
  ('pricing:approve', 'Approve Pricing', 'الموافقة على التسعير', 'Approve product pricing', 'الموافقة على أسعار المنتجات', 'pricing', 'approve', NOW(), NOW()),
  ('pricing:view_cost', 'View Cost Price', 'عرض سعر التكلفة', 'View product cost price', 'عرض سعر التكلفة للمنتجات', 'pricing', 'view_cost', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- 4. ربط جميع الصلاحيات بالدور "admin" أو "super_admin"
-- أولاً، نحتاج للعثور على role_id للدور admin
DO $$
DECLARE
  admin_role_id INTEGER;
  permission_ids INTEGER[];
BEGIN
  -- البحث عن دور admin أو super_admin
  SELECT id INTO admin_role_id
  FROM public.roles
  WHERE name IN ('admin', 'super_admin', 'administrator')
  ORDER BY CASE name WHEN 'super_admin' THEN 1 WHEN 'admin' THEN 2 WHEN 'administrator' THEN 3 END
  LIMIT 1;

  -- إذا لم نجد دور admin، نبحث عن أي دور
  IF admin_role_id IS NULL THEN
    SELECT id INTO admin_role_id
    FROM public.roles
    ORDER BY id
    LIMIT 1;
  END IF;

  -- إذا وجدنا دور، نربط جميع الصلاحيات به
  IF admin_role_id IS NOT NULL THEN
    -- جلب جميع معرفات الصلاحيات التي أضفناها
    SELECT ARRAY_AGG(id) INTO permission_ids
    FROM public.permissions
    WHERE code IN (
      'purchasing:invoices:create',
      'purchasing:invoices:view',
      'purchasing:invoices:edit',
      'purchasing:invoices:delete',
      'purchasing:invoices:approve',
      'purchasing:invoices:send_to_warehouse',
      'purchasing:invoices:send_to_pricing',
      'purchasing:suppliers:manage',
      'warehouse:assignments:view',
      'warehouse:assignments:receive',
      'warehouse:assignments:update',
      'warehouse:inventory:view',
      'warehouse:inventory:manage',
      'pricing:view',
      'pricing:set',
      'pricing:approve',
      'pricing:view_cost'
    );

    -- ربط الصلاحيات بالدور
    INSERT INTO public.role_permissions (role_id, permission_id, created_at, updated_at)
    SELECT admin_role_id, unnest(permission_ids), NOW(), NOW()
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    RAISE NOTICE 'تم ربط % صلاحية بالدور %', array_length(permission_ids, 1), admin_role_id;
  ELSE
    RAISE NOTICE 'لم يتم العثور على دور admin. يرجى ربط الصلاحيات يدوياً.';
  END IF;
END $$;

