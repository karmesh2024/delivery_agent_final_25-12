-- إضافة الصلاحيات المفقودة لنظام المحافظات والصلاحيات المؤقتة
-- تأكد من وجود الموارد المطلوبة أولاً

-- 1) إضافة الموارد المفقودة
INSERT INTO public.resources (name, code, description, is_active) 
SELECT v.name, v.code, v.description, true 
FROM (VALUES 
  ('provinces','provinces','Resource for provinces management'),
  ('regions','regions','Resource for regions management'),
  ('cities','cities','Resource for cities management'),
  ('permissions','permissions','Resource for permissions management'),
  ('workflows','workflows','Resource for workflows management'),
  ('notifications','notifications','Resource for notifications management')
) AS v(name, code, description) 
WHERE NOT EXISTS (SELECT 1 FROM public.resources r WHERE r.code = v.code);

-- 2) إضافة الإجراءات المفقودة
INSERT INTO public.actions (name, description, code) 
SELECT v.name, v.description, v.code 
FROM (VALUES 
  ('provinces', 'المحافظات', 'provinces'),
  ('regions', 'المناطق', 'regions'),
  ('cities', 'المدن', 'cities'),
  ('permissions', 'الصلاحيات', 'permissions'),
  ('workflows', 'سير العمل', 'workflows'),
  ('notifications', 'الإشعارات', 'notifications'),
  ('manage', 'إدارة', 'manage'),
  ('request', 'طلب', 'request'),
  ('approve', 'موافقة', 'approve'),
  ('reject', 'رفض', 'reject'),
  ('view', 'عرض', 'view'),
  ('create', 'إنشاء', 'create'),
  ('update', 'تحديث', 'update'),
  ('delete', 'حذف', 'delete')
) AS v(name, description, code) 
WHERE NOT EXISTS (SELECT 1 FROM public.actions a WHERE a.code = v.code);

-- 3) إضافة الصلاحيات الجديدة
INSERT INTO public.permissions (resource_id, action_id, name, description, code) 
-- صلاحيات المحافظات
SELECT r.id, a.id, 'إدارة المحافظات', 'إدارة المحافظات والمناطق', 'provinces:manage'
FROM public.resources r 
JOIN public.actions a ON a.code = 'manage' 
WHERE r.code = 'provinces'
UNION ALL
SELECT r.id, a.id, 'عرض المحافظات', 'عرض قائمة المحافظات', 'provinces:view'
FROM public.resources r 
JOIN public.actions a ON a.code = 'view' 
WHERE r.code = 'provinces'
UNION ALL
SELECT r.id, a.id, 'إنشاء محافظة', 'إضافة محافظة جديدة', 'provinces:create'
FROM public.resources r 
JOIN public.actions a ON a.code = 'create' 
WHERE r.code = 'provinces'
UNION ALL
SELECT r.id, a.id, 'تحديث محافظة', 'تعديل بيانات المحافظة', 'provinces:update'
FROM public.resources r 
JOIN public.actions a ON a.code = 'update' 
WHERE r.code = 'provinces'
UNION ALL
SELECT r.id, a.id, 'حذف محافظة', 'حذف محافظة من النظام', 'provinces:delete'
FROM public.resources r 
JOIN public.actions a ON a.code = 'delete' 
WHERE r.code = 'provinces'

UNION ALL

-- صلاحيات المناطق
SELECT r.id, a.id, 'إدارة المناطق', 'إدارة المناطق داخل المحافظات', 'regions:manage'
FROM public.resources r 
JOIN public.actions a ON a.code = 'manage' 
WHERE r.code = 'regions'
UNION ALL
SELECT r.id, a.id, 'عرض المناطق', 'عرض قائمة المناطق', 'regions:view'
FROM public.resources r 
JOIN public.actions a ON a.code = 'view' 
WHERE r.code = 'regions'
UNION ALL
SELECT r.id, a.id, 'إنشاء منطقة', 'إضافة منطقة جديدة', 'regions:create'
FROM public.resources r 
JOIN public.actions a ON a.code = 'create' 
WHERE r.code = 'regions'
UNION ALL
SELECT r.id, a.id, 'تحديث منطقة', 'تعديل بيانات المنطقة', 'regions:update'
FROM public.resources r 
JOIN public.actions a ON a.code = 'update' 
WHERE r.code = 'regions'
UNION ALL
SELECT r.id, a.id, 'حذف منطقة', 'حذف منطقة من النظام', 'regions:delete'
FROM public.resources r 
JOIN public.actions a ON a.code = 'delete' 
WHERE r.code = 'regions'

UNION ALL

-- صلاحيات المدن
SELECT r.id, a.id, 'إدارة المدن', 'إدارة المدن داخل المناطق', 'cities:manage'
FROM public.resources r 
JOIN public.actions a ON a.code = 'manage' 
WHERE r.code = 'cities'
UNION ALL
SELECT r.id, a.id, 'عرض المدن', 'عرض قائمة المدن', 'cities:view'
FROM public.resources r 
JOIN public.actions a ON a.code = 'view' 
WHERE r.code = 'cities'
UNION ALL
SELECT r.id, a.id, 'إنشاء مدينة', 'إضافة مدينة جديدة', 'cities:create'
FROM public.resources r 
JOIN public.actions a ON a.code = 'create' 
WHERE r.code = 'cities'
UNION ALL
SELECT r.id, a.id, 'تحديث مدينة', 'تعديل بيانات المدينة', 'cities:update'
FROM public.resources r 
JOIN public.actions a ON a.code = 'update' 
WHERE r.code = 'cities'
UNION ALL
SELECT r.id, a.id, 'حذف مدينة', 'حذف مدينة من النظام', 'cities:delete'
FROM public.resources r 
JOIN public.actions a ON a.code = 'delete' 
WHERE r.code = 'cities'

UNION ALL

-- صلاحيات الصلاحيات المؤقتة
SELECT r.id, a.id, 'طلب صلاحيات', 'طلب صلاحيات مؤقتة', 'permissions:request'
FROM public.resources r 
JOIN public.actions a ON a.code = 'request' 
WHERE r.code = 'permissions'
UNION ALL
SELECT r.id, a.id, 'الموافقة على الصلاحيات', 'الموافقة على طلبات الصلاحيات', 'permissions:approve'
FROM public.resources r 
JOIN public.actions a ON a.code = 'approve' 
WHERE r.code = 'permissions'
UNION ALL
SELECT r.id, a.id, 'رفض الصلاحيات', 'رفض طلبات الصلاحيات', 'permissions:reject'
FROM public.resources r 
JOIN public.actions a ON a.code = 'reject' 
WHERE r.code = 'permissions'
UNION ALL
SELECT r.id, a.id, 'عرض الصلاحيات المؤقتة', 'عرض قائمة الصلاحيات المؤقتة', 'permissions:view'
FROM public.resources r 
JOIN public.actions a ON a.code = 'view' 
WHERE r.code = 'permissions'
UNION ALL
SELECT r.id, a.id, 'إدارة الصلاحيات المؤقتة', 'إدارة الصلاحيات المؤقتة', 'permissions:manage'
FROM public.resources r 
JOIN public.actions a ON a.code = 'manage' 
WHERE r.code = 'permissions'

UNION ALL

-- صلاحيات سير العمل
SELECT r.id, a.id, 'إدارة سير العمل', 'إدارة سير العمل للموافقات', 'workflows:manage'
FROM public.resources r 
JOIN public.actions a ON a.code = 'manage' 
WHERE r.code = 'workflows'
UNION ALL
SELECT r.id, a.id, 'عرض سير العمل', 'عرض قائمة سير العمل', 'workflows:view'
FROM public.resources r 
JOIN public.actions a ON a.code = 'view' 
WHERE r.code = 'workflows'
UNION ALL
SELECT r.id, a.id, 'إنشاء سير عمل', 'إضافة سير عمل جديد', 'workflows:create'
FROM public.resources r 
JOIN public.actions a ON a.code = 'create' 
WHERE r.code = 'workflows'
UNION ALL
SELECT r.id, a.id, 'تحديث سير العمل', 'تعديل سير العمل', 'workflows:update'
FROM public.resources r 
JOIN public.actions a ON a.code = 'update' 
WHERE r.code = 'workflows'
UNION ALL
SELECT r.id, a.id, 'حذف سير العمل', 'حذف سير العمل', 'workflows:delete'
FROM public.resources r 
JOIN public.actions a ON a.code = 'delete' 
WHERE r.code = 'workflows'

UNION ALL

-- صلاحيات الإشعارات
SELECT r.id, a.id, 'عرض الإشعارات', 'عرض قائمة الإشعارات', 'notifications:view'
FROM public.resources r 
JOIN public.actions a ON a.code = 'view' 
WHERE r.code = 'notifications'
UNION ALL
SELECT r.id, a.id, 'إدارة الإشعارات', 'إدارة الإشعارات المتقدمة', 'notifications:manage'
FROM public.resources r 
JOIN public.actions a ON a.code = 'manage' 
WHERE r.code = 'notifications'
UNION ALL
SELECT r.id, a.id, 'إنشاء إشعار', 'إرسال إشعار جديد', 'notifications:create'
FROM public.resources r 
JOIN public.actions a ON a.code = 'create' 
WHERE r.code = 'notifications'
UNION ALL
SELECT r.id, a.id, 'تحديث إشعار', 'تعديل الإشعار', 'notifications:update'
FROM public.resources r 
JOIN public.actions a ON a.code = 'update' 
WHERE r.code = 'notifications'
UNION ALL
SELECT r.id, a.id, 'حذف إشعار', 'حذف الإشعار', 'notifications:delete'
FROM public.resources r 
JOIN public.actions a ON a.code = 'delete' 
WHERE r.code = 'notifications'

ON CONFLICT (code) DO NOTHING;

-- عرض الصلاحيات المضافة
SELECT 
  p.code,
  p.name,
  p.description,
  r.name as resource_name,
  a.name as action_name
FROM public.permissions p
JOIN public.resources r ON r.id = p.resource_id
JOIN public.actions a ON a.id = p.action_id
WHERE p.code LIKE '%provinces%' 
   OR p.code LIKE '%regions%' 
   OR p.code LIKE '%cities%' 
   OR p.code LIKE '%permissions%' 
   OR p.code LIKE '%workflows%' 
   OR p.code LIKE '%notifications%'
ORDER BY p.code;













