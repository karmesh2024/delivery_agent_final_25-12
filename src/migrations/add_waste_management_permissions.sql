-- إضافة الصلاحيات الخاصة بإدارة المخلفات
-- تاريخ الإنشاء: 2025-01-01

-- 1. إضافة صلاحيات الكتالوج
INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:catalog:create',
  'Create Waste Catalog Item',
  'إضافة مخلفات جديدة للكتالوج',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:catalog' AND a.code = 'create'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:catalog:update',
  'Update Waste Catalog Item',
  'تعديل مخلفات في الكتالوج',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:catalog' AND a.code = 'update'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:catalog:delete',
  'Delete Waste Catalog Item',
  'حذف مخلفات من الكتالوج',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:catalog' AND a.code = 'delete'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:catalog:view',
  'View Waste Catalog',
  'عرض كتالوج المخلفات',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:catalog' AND a.code = 'view'
ON CONFLICT (code) DO NOTHING;

-- 2. إضافة صلاحيات التسعير
INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:pricing:set_base',
  'Set Base Price',
  'وضع السعر الأساسي للمخلفات',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:pricing' AND a.code = 'set'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:pricing:update_small',
  'Update Small Price Changes',
  'تحديث تغييرات صغيرة في الأسعار (< 10%)',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:pricing' AND a.code = 'update'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:pricing:update_large',
  'Request Large Price Changes',
  'طلب تغييرات كبيرة في الأسعار (>= 10%)',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:pricing' AND a.code = 'update'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:pricing:approve',
  'Approve Price Changes',
  'الموافقة على تغييرات الأسعار الكبيرة',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:pricing' AND a.code = 'approve'
ON CONFLICT (code) DO NOTHING;

-- 3. إضافة صلاحيات البورصة
INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:exchange:view',
  'View Waste Exchange',
  'عرض بورصة المخلفات',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:exchange' AND a.code = 'view'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:exchange:manage',
  'Manage Waste Exchange',
  'إدارة بورصة المخلفات',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:exchange' AND a.code = 'manage'
ON CONFLICT (code) DO NOTHING;

-- 4. إضافة صلاحيات الشركاء الصناعيين
INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:partners:view',
  'View Industrial Partners',
  'عرض الشركاء الصناعيين',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:partners' AND a.code = 'view'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:partners:manage',
  'Manage Industrial Partners',
  'إدارة الشركاء الصناعيين',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:partners' AND a.code = 'manage'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:partners:orders:approve',
  'Approve Partner Orders',
  'الموافقة على طلبات الشركاء الصناعيين',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:partners' AND a.code = 'approve'
ON CONFLICT (code) DO NOTHING;

-- 5. إضافة صلاحيات الاستلام والتحقق
INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:receiving:view',
  'View Receiving Requests',
  'عرض طلبات استلام المخلفات',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:receiving' AND a.code = 'view'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:receiving:verify',
  'Verify Receiving',
  'التحقق من جودة المخلفات المستلمة',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:receiving' AND a.code = 'verify'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:receiving:approve',
  'Approve Receiving',
  'الموافقة على استلام المخلفات',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:receiving' AND a.code = 'approve'
ON CONFLICT (code) DO NOTHING;

-- 6. إضافة صلاحيات مراقبة المخازن
INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:warehouse:monitor',
  'Monitor Waste Warehouses',
  'مراقبة مخازن المخلفات',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:warehouse' AND a.code = 'monitor'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.permissions (code, name, description, resource_id, action_id, created_at, updated_at)
SELECT 
  'waste:warehouse:manage',
  'Manage Waste Warehouses',
  'إدارة مخازن المخلفات',
  r.id,
  a.id,
  NOW(),
  NOW()
FROM public.resources r, public.actions a
WHERE r.code = 'waste:warehouse' AND a.code = 'manage'
ON CONFLICT (code) DO NOTHING;

-- 7. ربط الصلاحيات بالأدوار
-- ملاحظة: يجب أن تكون الموارد (resources) والإجراءات (actions) موجودة أولاً
-- إذا لم تكن موجودة، سيتم استخدام طريقة بديلة

DO $$
DECLARE
  admin_role_id UUID;
  super_admin_role_id UUID;
  waste_manager_role_id UUID;
  permission_ids UUID[];
  resource_waste_catalog UUID;
  resource_waste_pricing UUID;
  resource_waste_exchange UUID;
  resource_waste_partners UUID;
  resource_waste_receiving UUID;
  resource_waste_warehouse UUID;
  action_view UUID;
  action_create UUID;
  action_update UUID;
  action_delete UUID;
  action_set UUID;
  action_manage UUID;
  action_approve UUID;
  action_verify UUID;
  action_monitor UUID;
BEGIN
  -- البحث عن الأدوار
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin' OR code = 'admin' LIMIT 1;
  SELECT id INTO super_admin_role_id FROM public.roles WHERE name = 'super_admin' OR code = 'super_admin' LIMIT 1;
  SELECT id INTO waste_manager_role_id FROM public.roles WHERE name = 'waste_manager' OR code = 'waste_manager' LIMIT 1;
  
  -- إذا لم نجد دور waste_manager، نستخدم admin
  IF waste_manager_role_id IS NULL THEN
    waste_manager_role_id := admin_role_id;
  END IF;
  
  -- إذا لم نجد admin، نستخدم super_admin
  IF admin_role_id IS NULL THEN
    admin_role_id := super_admin_role_id;
  END IF;
  
  -- البحث عن الموارد (resources) - إنشاءها إذا لم تكن موجودة
  SELECT id INTO resource_waste_catalog FROM public.resources WHERE code = 'waste:catalog' LIMIT 1;
  IF resource_waste_catalog IS NULL THEN
    INSERT INTO public.resources (code, name, description) 
    VALUES ('waste:catalog', 'Waste Catalog', 'كتالوج المخلفات')
    RETURNING id INTO resource_waste_catalog;
  END IF;
  
  SELECT id INTO resource_waste_pricing FROM public.resources WHERE code = 'waste:pricing' LIMIT 1;
  IF resource_waste_pricing IS NULL THEN
    INSERT INTO public.resources (code, name, description) 
    VALUES ('waste:pricing', 'Waste Pricing', 'تسعير المخلفات')
    RETURNING id INTO resource_waste_pricing;
  END IF;
  
  SELECT id INTO resource_waste_exchange FROM public.resources WHERE code = 'waste:exchange' LIMIT 1;
  IF resource_waste_exchange IS NULL THEN
    INSERT INTO public.resources (code, name, description) 
    VALUES ('waste:exchange', 'Waste Exchange', 'بورصة المخلفات')
    RETURNING id INTO resource_waste_exchange;
  END IF;
  
  SELECT id INTO resource_waste_partners FROM public.resources WHERE code = 'waste:partners' LIMIT 1;
  IF resource_waste_partners IS NULL THEN
    INSERT INTO public.resources (code, name, description) 
    VALUES ('waste:partners', 'Industrial Partners', 'الشركاء الصناعيين')
    RETURNING id INTO resource_waste_partners;
  END IF;
  
  SELECT id INTO resource_waste_receiving FROM public.resources WHERE code = 'waste:receiving' LIMIT 1;
  IF resource_waste_receiving IS NULL THEN
    INSERT INTO public.resources (code, name, description) 
    VALUES ('waste:receiving', 'Waste Receiving', 'استلام المخلفات')
    RETURNING id INTO resource_waste_receiving;
  END IF;
  
  SELECT id INTO resource_waste_warehouse FROM public.resources WHERE code = 'waste:warehouse' LIMIT 1;
  IF resource_waste_warehouse IS NULL THEN
    INSERT INTO public.resources (code, name, description) 
    VALUES ('waste:warehouse', 'Waste Warehouse', 'مخازن المخلفات')
    RETURNING id INTO resource_waste_warehouse;
  END IF;
  
  -- البحث عن الإجراءات (actions) - إنشاءها إذا لم تكن موجودة
  SELECT id INTO action_view FROM public.actions WHERE code = 'view' LIMIT 1;
  IF action_view IS NULL THEN
    INSERT INTO public.actions (code, name, description) 
    VALUES ('view', 'View', 'عرض')
    RETURNING id INTO action_view;
  END IF;
  
  SELECT id INTO action_create FROM public.actions WHERE code = 'create' LIMIT 1;
  IF action_create IS NULL THEN
    INSERT INTO public.actions (code, name, description) 
    VALUES ('create', 'Create', 'إنشاء')
    RETURNING id INTO action_create;
  END IF;
  
  SELECT id INTO action_update FROM public.actions WHERE code = 'update' LIMIT 1;
  IF action_update IS NULL THEN
    INSERT INTO public.actions (code, name, description) 
    VALUES ('update', 'Update', 'تحديث')
    RETURNING id INTO action_update;
  END IF;
  
  SELECT id INTO action_delete FROM public.actions WHERE code = 'delete' LIMIT 1;
  IF action_delete IS NULL THEN
    INSERT INTO public.actions (code, name, description) 
    VALUES ('delete', 'Delete', 'حذف')
    RETURNING id INTO action_delete;
  END IF;
  
  SELECT id INTO action_set FROM public.actions WHERE code = 'set' LIMIT 1;
  IF action_set IS NULL THEN
    INSERT INTO public.actions (code, name, description) 
    VALUES ('set', 'Set', 'تعيين')
    RETURNING id INTO action_set;
  END IF;
  
  SELECT id INTO action_manage FROM public.actions WHERE code = 'manage' LIMIT 1;
  IF action_manage IS NULL THEN
    INSERT INTO public.actions (code, name, description) 
    VALUES ('manage', 'Manage', 'إدارة')
    RETURNING id INTO action_manage;
  END IF;
  
  SELECT id INTO action_approve FROM public.actions WHERE code = 'approve' LIMIT 1;
  IF action_approve IS NULL THEN
    INSERT INTO public.actions (code, name, description) 
    VALUES ('approve', 'Approve', 'الموافقة')
    RETURNING id INTO action_approve;
  END IF;
  
  SELECT id INTO action_verify FROM public.actions WHERE code = 'verify' LIMIT 1;
  IF action_verify IS NULL THEN
    INSERT INTO public.actions (code, name, description) 
    VALUES ('verify', 'Verify', 'التحقق')
    RETURNING id INTO action_verify;
  END IF;
  
  SELECT id INTO action_monitor FROM public.actions WHERE code = 'monitor' LIMIT 1;
  IF action_monitor IS NULL THEN
    INSERT INTO public.actions (code, name, description) 
    VALUES ('monitor', 'Monitor', 'مراقبة')
    RETURNING id INTO action_monitor;
  END IF;
  
  -- إنشاء الصلاحيات إذا لم تكن موجودة
  -- (سيتم تجاهلها إذا كانت موجودة بسبب ON CONFLICT)
  
  -- جلب جميع معرفات الصلاحيات التي أضفناها
  SELECT ARRAY_AGG(id) INTO permission_ids
  FROM public.permissions
  WHERE code IN (
    'waste:catalog:create',
    'waste:catalog:update',
    'waste:catalog:delete',
    'waste:catalog:view',
    'waste:pricing:set_base',
    'waste:pricing:update_small',
    'waste:pricing:update_large',
    'waste:pricing:approve',
    'waste:exchange:view',
    'waste:exchange:manage',
    'waste:partners:view',
    'waste:partners:manage',
    'waste:partners:orders:approve',
    'waste:receiving:view',
    'waste:receiving:verify',
    'waste:receiving:approve',
    'waste:warehouse:monitor',
    'waste:warehouse:manage'
  );
  
  -- ربط الصلاحيات بالأدوار
  IF admin_role_id IS NOT NULL AND permission_ids IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id, created_at)
    SELECT admin_role_id, unnest(permission_ids), NOW()
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    RAISE NOTICE 'تم ربط % صلاحية بالدور admin', array_length(permission_ids, 1);
  END IF;
  
  IF super_admin_role_id IS NOT NULL AND permission_ids IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id, created_at)
    SELECT super_admin_role_id, unnest(permission_ids), NOW()
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    RAISE NOTICE 'تم ربط % صلاحية بالدور super_admin', array_length(permission_ids, 1);
  END IF;
  
  IF waste_manager_role_id IS NOT NULL AND permission_ids IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id, created_at)
    SELECT waste_manager_role_id, unnest(permission_ids), NOW()
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    RAISE NOTICE 'تم ربط % صلاحية بالدور waste_manager', array_length(permission_ids, 1);
  END IF;
  
  IF permission_ids IS NULL THEN
    RAISE NOTICE 'تحذير: لم يتم العثور على أي صلاحيات. تأكد من أن الموارد والإجراءات موجودة.';
  END IF;
  
END $$;

-- 8. تعليقات توضيحية
COMMENT ON TABLE public.waste_price_approval_requests IS 'طلبات الموافقة على تغيير أسعار المخلفات - يتطلب صلاحية waste:pricing:approve';
COMMENT ON TABLE public.waste_receiving_approval_requests IS 'طلبات الموافقة على استلام المخلفات - يتطلب صلاحية waste:receiving:approve';

