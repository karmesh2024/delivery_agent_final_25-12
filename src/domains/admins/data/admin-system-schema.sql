-- ========================================================================
-- نظام إدارة المسؤولين والصلاحيات الشامل
-- لإدارة شركة كبيرة لإدارة وبيع المخلفات
-- ========================================================================

-- ========================================================================
-- شرح النظام:
-- ========================================================================
-- يهدف هذا النظام إلى بناء هيكل إداري متكامل للمسؤولين مع صلاحيات ومسؤوليات مختلفة.
-- يسمح النظام بتعريف:
-- 1. هيكل تنظيمي (مجلس إدارة، إدارات، أقسام)
-- 2. أدوار وظيفية مختلفة (رئيس مجلس إدارة، مديرين، مشرفين، إلخ)
-- 3. صلاحيات وأذونات مفصلة لكل دور
-- 4. تسلسل هرمي للإدارة وتفويض الصلاحيات
-- 5. نطاقات للصلاحيات (جغرافية، وظيفية، إلخ)
-- 6. آليات تفويض الصلاحيات وسير عمل الموافقات

-- ========================================================================
-- هيكل الجداول:
-- ========================================================================

-- جدول الإدارات/الأقسام
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES public.departments(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT departments_pkey PRIMARY KEY (id)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.departments IS 'جدول الإدارات والأقسام يمثل الهيكل التنظيمي للشركة';

-- إنشاء فهرس على اسم الإدارة
CREATE INDEX IF NOT EXISTS idx_departments_name ON public.departments(name);

-- جدول الأدوار
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  description text,
  level integer NOT NULL DEFAULT 0, -- مستوى الدور في التسلسل الهرمي (أعلى = أكثر صلاحيات)
  is_system boolean NOT NULL DEFAULT false, -- هل هذا دور نظام لا يمكن تعديله
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT roles_pkey PRIMARY KEY (id),
  CONSTRAINT roles_name_unique UNIQUE (name)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.roles IS 'جدول الأدوار يعرّف أنواع المسؤولين في النظام وصلاحياتهم';

-- إنشاء فهرس على اسم الدور
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);

-- جدول موارد النظام (الموارد التي يمكن الوصول إليها وإدارتها)
CREATE TABLE IF NOT EXISTS public.resources (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  description text,
  code text NOT NULL, -- رمز فريد للمورد (مثل: orders, customers, agents)
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT resources_pkey PRIMARY KEY (id),
  CONSTRAINT resources_code_unique UNIQUE (code)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.resources IS 'جدول الموارد يعرّف الكيانات التي يمكن التحكم بها في النظام';

-- جدول الإجراءات الممكنة على الموارد
CREATE TABLE IF NOT EXISTS public.actions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  description text,
  code text NOT NULL, -- رمز فريد للإجراء (مثل: view, create, update, delete)
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT actions_pkey PRIMARY KEY (id),
  CONSTRAINT actions_code_unique UNIQUE (code)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.actions IS 'جدول الإجراءات يعرّف أنواع العمليات التي يمكن إجراؤها على الموارد';

-- جدول الصلاحيات (تركيبة من المورد والإجراء)
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  action_id uuid NOT NULL REFERENCES public.actions(id) ON DELETE CASCADE,
  description text,
  code text NOT NULL, -- رمز مركب يجمع بين رمز المورد ورمز الإجراء (مثل: orders:create)
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT permissions_pkey PRIMARY KEY (id),
  CONSTRAINT permissions_resource_action_unique UNIQUE (resource_id, action_id),
  CONSTRAINT permissions_code_unique UNIQUE (code)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.permissions IS 'جدول الصلاحيات يعرّف العمليات المسموحة على موارد محددة';

-- جدول ربط الأدوار بالصلاحيات
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid, -- من أضاف هذه الصلاحية للدور
  
  CONSTRAINT role_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT role_permissions_role_permission_unique UNIQUE (role_id, permission_id)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.role_permissions IS 'جدول ربط الأدوار بالصلاحيات يحدد أي صلاحيات مرتبطة بكل دور';

-- توسيع جدول المسؤولين
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id), -- الإدارة/القسم التابع له
  role_id uuid REFERENCES public.roles(id), -- الدور الوظيفي
  manager_id uuid REFERENCES public.admins(id), -- المدير المباشر
  
  email text NOT NULL,
  username text,
  full_name text,
  phone text,
  job_title text, -- المسمى الوظيفي الدقيق
  
  profile_image_url text,
  permissions jsonb, -- صلاحيات إضافية أو استثناءات خاصة بهذا المسؤول
  
  is_active boolean NOT NULL DEFAULT true,
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT admins_pkey PRIMARY KEY (id),
  CONSTRAINT admins_email_unique UNIQUE (email),
  CONSTRAINT admins_username_unique UNIQUE (username)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.admins IS 'جدول المسؤولين يخزن بيانات المستخدمين الإداريين في النظام';

-- إنشاء فهرس على البريد الإلكتروني
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);

-- إنشاء فهرس على اسم المستخدم
CREATE INDEX IF NOT EXISTS idx_admins_username ON public.admins(username);

-- إنشاء فهرس على user_id
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);

-- إنشاء فهرس على role_id
CREATE INDEX IF NOT EXISTS idx_admins_role_id ON public.admins(role_id);

-- جدول مجموعات المسؤولين
CREATE TABLE IF NOT EXISTS public.admin_groups (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  description text,
  department_id uuid REFERENCES public.departments(id),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT admin_groups_pkey PRIMARY KEY (id)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.admin_groups IS 'جدول مجموعات المسؤولين لتجميع المسؤولين في فرق عمل';

-- جدول ربط المسؤولين بالمجموعات
CREATE TABLE IF NOT EXISTS public.admin_group_members (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  group_id uuid NOT NULL REFERENCES public.admin_groups(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT admin_group_members_pkey PRIMARY KEY (id),
  CONSTRAINT admin_group_members_group_admin_unique UNIQUE (group_id, admin_id)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.admin_group_members IS 'جدول أعضاء المجموعات لربط المسؤولين بمجموعاتهم';

-- جدول ربط المجموعات بالصلاحيات
CREATE TABLE IF NOT EXISTS public.group_permissions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  group_id uuid NOT NULL REFERENCES public.admin_groups(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid, -- من أضاف هذه الصلاحية للمجموعة
  
  CONSTRAINT group_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT group_permissions_group_permission_unique UNIQUE (group_id, permission_id)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.group_permissions IS 'جدول ربط المجموعات بالصلاحيات يحدد أي صلاحيات مرتبطة بكل مجموعة';

-- جدول نطاقات الصلاحيات (مثل مناطق جغرافية، أقسام، إلخ)
CREATE TABLE IF NOT EXISTS public.permission_scopes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  scope_type text NOT NULL, -- geographical, departmental, etc.
  scope_value jsonb, -- بيانات النطاق مثل الإحداثيات أو القسم
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT permission_scopes_pkey PRIMARY KEY (id)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.permission_scopes IS 'جدول نطاقات الصلاحيات لتحديد النطاق الجغرافي أو الوظيفي للصلاحيات';

-- ربط الصلاحيات بالنطاقات
CREATE TABLE IF NOT EXISTS public.scoped_permissions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  scope_id uuid NOT NULL REFERENCES public.permission_scopes(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES public.admins(id) ON DELETE CASCADE,
  role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.admin_groups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT scoped_permissions_pkey PRIMARY KEY (id)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.scoped_permissions IS 'جدول ربط الصلاحيات بالنطاقات لتحديد صلاحيات المسؤولين في نطاقات محددة';

-- جدول تفويض الصلاحيات
CREATE TABLE IF NOT EXISTS public.delegated_permissions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  from_admin_id uuid NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  to_admin_id uuid NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  reason text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT delegated_permissions_pkey PRIMARY KEY (id)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.delegated_permissions IS 'جدول تفويض الصلاحيات لتمكين المسؤولين من تفويض صلاحياتهم لمسؤولين آخرين مؤقتًا';

-- جدول سير عمل الموافقات
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  description text,
  resource_type text NOT NULL, -- نوع المورد (طلبات، عمليات مالية، إلخ)
  steps jsonb NOT NULL, -- خطوات الموافقة ومستويات الصلاحية المطلوبة
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT approval_workflows_pkey PRIMARY KEY (id)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.approval_workflows IS 'جدول سير عمل الموافقات لتعريف خطوات الموافقة المطلوبة لإجراءات معينة';

-- جدول سجل الأنشطة الإدارية
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  admin_id uuid NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  action_type text NOT NULL, -- نوع الإجراء (تسجيل دخول، إنشاء، تعديل، حذف، إلخ)
  target_type text, -- نوع الهدف (مسؤول، عميل، مندوب، طلب، إلخ)
  target_id text, -- معرف الهدف
  details jsonb, -- تفاصيل الإجراء
  ip_address text, -- عنوان IP
  user_agent text, -- معلومات المتصفح
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT admin_activity_log_pkey PRIMARY KEY (id)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.admin_activity_log IS 'جدول سجل الأنشطة لتتبع إجراءات المسؤولين في النظام';

-- ========================================================================
-- إدخال البيانات الأساسية (Seed Data)
-- ========================================================================

-- إنشاء الإدارات الأساسية
INSERT INTO public.departments (id, name, description, parent_id) VALUES
('00000000-0000-0000-0000-000000000001', 'مجلس الإدارة', 'المستوى القيادي الأعلى للشركة', NULL),
('00000000-0000-0000-0000-000000000002', 'إدارة التشغيل', 'الإدارة المسؤولة عن العمليات اليومية', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000003', 'إدارة التسويق', 'الإدارة المسؤولة عن التسويق والمبيعات', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000004', 'خدمة العملاء', 'إدارة خدمة العملاء ودعم المستخدمين', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000005', 'الإدارة المالية', 'إدارة الشؤون المالية والمحاسبية', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000006', 'إدارة الموارد البشرية', 'إدارة شؤون الموظفين والتوظيف', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000007', 'تكنولوجيا المعلومات', 'إدارة أنظمة وتقنية المعلومات', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000008', 'قسم المندوبين', 'إدارة وتنظيم شؤون المندوبين', '00000000-0000-0000-0000-000000000002'),
('00000000-0000-0000-0000-000000000009', 'قسم الطلبات', 'إدارة وتنظيم الطلبات والتوصيل', '00000000-0000-0000-0000-000000000002'),
('00000000-0000-0000-0000-000000000010', 'قسم جمع المخلفات', 'إدارة وتنظيم عمليات جمع وفرز المخلفات', '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, parent_id = EXCLUDED.parent_id;

-- إنشاء الأدوار الأساسية
INSERT INTO public.roles (id, name, description, level, is_system) VALUES
('00000000-0000-0000-0000-000000000001', 'super_admin', 'مدير النظام العام - رئيس مجلس الإدارة', 100, true),
('00000000-0000-0000-0000-000000000002', 'admin', 'مسؤول النظام - مدير إدارة', 80, true),
('00000000-0000-0000-0000-000000000003', 'manager', 'مدير قسم', 60, true),
('00000000-0000-0000-0000-000000000004', 'supervisor', 'مشرف', 40, true),
('00000000-0000-0000-0000-000000000005', 'support', 'دعم فني وخدمة عملاء', 30, true),
('00000000-0000-0000-0000-000000000006', 'viewer', 'مراقب - صلاحيات عرض فقط', 10, true)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, level = EXCLUDED.level, is_system = EXCLUDED.is_system;

-- إنشاء الموارد الأساسية
INSERT INTO public.resources (id, name, description, code) VALUES
('00000000-0000-0000-0000-000000000001', 'لوحة التحكم', 'الوصول إلى لوحة التحكم', 'dashboard'),
('00000000-0000-0000-0000-000000000002', 'المسؤولين', 'إدارة المسؤولين والمستخدمين الإداريين', 'admins'),
('00000000-0000-0000-0000-000000000003', 'الأدوار والصلاحيات', 'إدارة الأدوار والصلاحيات', 'roles'),
('00000000-0000-0000-0000-000000000004', 'المندوبين', 'إدارة المندوبين', 'agents'),
('00000000-0000-0000-0000-000000000005', 'العملاء', 'إدارة العملاء', 'customers'),
('00000000-0000-0000-0000-000000000006', 'الطلبات', 'إدارة الطلبات والتوصيل', 'orders'),
('00000000-0000-0000-0000-000000000007', 'جمع المخلفات', 'إدارة عمليات جمع المخلفات', 'waste'),
('00000000-0000-0000-0000-000000000008', 'التقارير', 'عرض وإدارة التقارير', 'reports'),
('00000000-0000-0000-0000-000000000009', 'المالية', 'إدارة الشؤون المالية', 'finance'),
('00000000-0000-0000-0000-000000000010', 'الإعدادات', 'إدارة إعدادات النظام', 'settings'),
('00000000-0000-0000-0000-000000000011', 'الرسائل', 'نظام المراسلات والدعم', 'messages'),
('00000000-0000-0000-0000-000000000012', 'الخرائط', 'إدارة ومراقبة الخرائط', 'maps')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, code = EXCLUDED.code;

-- إنشاء الإجراءات الأساسية
INSERT INTO public.actions (id, name, description, code) VALUES
('00000000-0000-0000-0000-000000000001', 'عرض', 'عرض البيانات والصفحات', 'view'),
('00000000-0000-0000-0000-000000000002', 'إنشاء', 'إنشاء سجلات وعناصر جديدة', 'create'),
('00000000-0000-0000-0000-000000000003', 'تعديل', 'تعديل البيانات والسجلات', 'update'),
('00000000-0000-0000-0000-000000000004', 'حذف', 'حذف البيانات والسجلات', 'delete'),
('00000000-0000-0000-0000-000000000005', 'تفعيل/تعطيل', 'تغيير حالة العناصر', 'toggle'),
('00000000-0000-0000-0000-000000000006', 'تصدير', 'تصدير البيانات للتقارير', 'export'),
('00000000-0000-0000-0000-000000000007', 'إدارة', 'إدارة كاملة (جميع الصلاحيات)', 'manage'),
('00000000-0000-0000-0000-000000000008', 'تخصيص', 'تخصيص الطلبات للمندوبين', 'assign'),
('00000000-0000-0000-0000-000000000009', 'اعتماد', 'اعتماد الإجراءات والطلبات', 'approve')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, code = EXCLUDED.code;

-- ========================================================================
-- دوال مساعدة (Helper Functions)
-- ========================================================================

-- دالة لإنشاء أو تحديث الصلاحيات وربطها بالأدوار
CREATE OR REPLACE FUNCTION setup_permissions()
RETURNS void AS $$
DECLARE
    resource_rec RECORD;
    action_rec RECORD;
    permission_id uuid;
    role_rec RECORD;
BEGIN
    -- إنشاء الصلاحيات من تركيبة الموارد والإجراءات
    FOR resource_rec IN SELECT * FROM public.resources WHERE is_active = true LOOP
        FOR action_rec IN SELECT * FROM public.actions LOOP
            -- إنشاء رمز مركب
            INSERT INTO public.permissions (resource_id, action_id, description, code)
            VALUES (
                resource_rec.id,
                action_rec.id,
                action_rec.name || ' ' || resource_rec.name,
                resource_rec.code || ':' || action_rec.code
            )
            ON CONFLICT (resource_id, action_id) DO UPDATE
            SET description = EXCLUDED.description, code = EXCLUDED.code
            RETURNING id INTO permission_id;
            
            -- منح الصلاحية لدور super_admin
            IF EXISTS (SELECT 1 FROM public.roles WHERE id = '00000000-0000-0000-0000-000000000001') THEN
                INSERT INTO public.role_permissions (role_id, permission_id)
                VALUES ('00000000-0000-0000-0000-000000000001', permission_id)
                ON CONFLICT (role_id, permission_id) DO NOTHING;
            END IF;
            
            -- منح صلاحيات عرض لدور viewer
            IF action_rec.code = 'view' AND EXISTS (SELECT 1 FROM public.roles WHERE id = '00000000-0000-0000-0000-000000000006') THEN
                INSERT INTO public.role_permissions (role_id, permission_id)
                VALUES ('00000000-0000-0000-0000-000000000006', permission_id)
                ON CONFLICT (role_id, permission_id) DO NOTHING;
            END IF;
            
            -- منح صلاحيات إدارة للمدراء
            IF action_rec.code IN ('view', 'create', 'update', 'toggle', 'export', 'assign', 'approve') 
               AND resource_rec.code != 'admins' 
               AND resource_rec.code != 'roles' 
               AND resource_rec.code != 'settings'
               AND EXISTS (SELECT 1 FROM public.roles WHERE id = '00000000-0000-0000-0000-000000000002') THEN
                INSERT INTO public.role_permissions (role_id, permission_id)
                VALUES ('00000000-0000-0000-0000-000000000002', permission_id)
                ON CONFLICT (role_id, permission_id) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
    
    -- تحديث جدول admins لتحويل الصلاحيات من jsonb إلى علاقات
    FOR role_rec IN SELECT * FROM public.roles LOOP
        UPDATE public.admins
        SET role_id = role_rec.id
        WHERE (permissions->>'role') = role_rec.name AND role_id IS NULL;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- دالة للتحقق من صلاحيات المسؤول
CREATE OR REPLACE FUNCTION check_admin_permission(admin_id uuid, permission_code text)
RETURNS boolean AS $$
DECLARE
    has_permission boolean;
BEGIN
    -- التحقق من وجود الصلاحية مباشرة من خلال الدور
    SELECT EXISTS (
        SELECT 1 
        FROM public.admins a
        JOIN public.role_permissions rp ON a.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE a.id = admin_id AND p.code = permission_code AND a.is_active = true
    ) INTO has_permission;
    
    -- إذا لم توجد صلاحية عبر الدور، تحقق من المجموعات
    IF NOT has_permission THEN
        SELECT EXISTS (
            SELECT 1 
            FROM public.admin_group_members agm
            JOIN public.group_permissions gp ON agm.group_id = gp.group_id
            JOIN public.permissions p ON gp.permission_id = p.id
            WHERE agm.admin_id = admin_id AND p.code = permission_code
        ) INTO has_permission;
    END IF;
    
    -- إذا كان المسؤول له صلاحيات إضافية في الحقل permissions
    IF NOT has_permission THEN
        SELECT EXISTS (
            SELECT 1 
            FROM public.admins
            WHERE id = admin_id 
              AND is_active = true
              AND permissions ? permission_code
              AND (permissions->>permission_code)::boolean = true
        ) INTO has_permission;
    END IF;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- دالة لتسجيل نشاط المسؤول
CREATE OR REPLACE FUNCTION log_admin_activity(
    admin_id uuid,
    action_type text,
    target_type text,
    target_id text,
    details jsonb,
    ip_address text DEFAULT NULL,
    user_agent text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    log_id uuid;
BEGIN
    INSERT INTO public.admin_activity_log (
        admin_id, action_type, target_type, target_id, details, ip_address, user_agent
    ) VALUES (
        admin_id, action_type, target_type, target_id, details, ip_address, user_agent
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- تحديث التاريخ تلقائيًا عند تحديث السجلات
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء triggers لتحديث حقل updated_at تلقائيًا
DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['departments', 'roles', 'admins', 'admin_groups'] LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$;

-- تنفيذ دالة إعداد الصلاحيات
SELECT setup_permissions();

-- ========================================================================
-- إدخال بيانات إضافية للصلاحيات (يمكن استخدامها كبديل أو مكمل لدالة setup_permissions)
-- ========================================================================

-- هذا نموذج محسن لإدخال الصلاحيات مباشرة باستخدام معرفات (UUIDs) الموارد والإجراءات
-- يستخدم هذا النموذج معرفات الموارد والإجراءات المحددة مسبقاً في النظام

/*
INSERT INTO public.permissions (resource_id, action_id, description, code, name)
VALUES
-- صلاحيات لوحة التحكم (dashboard)
(
  '00000000-0000-0000-0000-000000000001', -- معرف مورد لوحة التحكم
  '00000000-0000-0000-0000-000000000001', -- معرف إجراء العرض
  'عرض لوحة التحكم والإحصائيات',
  'dashboard:view',
  'عرض لوحة القيادة'
),

-- صلاحيات الطلبات (orders)
(
  '00000000-0000-0000-0000-000000000006', -- معرف مورد الطلبات
  '00000000-0000-0000-0000-000000000001', -- معرف إجراء العرض
  'عرض قائمة الطلبات وتفاصيلها',
  'orders:view',
  'عرض الطلبات'
),
(
  '00000000-0000-0000-0000-000000000006', -- معرف مورد الطلبات
  '00000000-0000-0000-0000-000000000002', -- معرف إجراء الإنشاء
  'إنشاء طلب جديد',
  'orders:create',
  'إنشاء طلب'
),
(
  '00000000-0000-0000-0000-000000000006', -- معرف مورد الطلبات
  '00000000-0000-0000-0000-000000000007', -- معرف إجراء الإدارة
  'تحديث حالة الطلبات وتعيينها للمندوبين',
  'orders:manage',
  'إدارة الطلبات'
),
(
  '00000000-0000-0000-0000-000000000006', -- معرف مورد الطلبات
  '00000000-0000-0000-0000-000000000004', -- معرف إجراء الحذف
  'حذف الطلبات من النظام',
  'orders:delete',
  'حذف الطلبات'
),
(
  '00000000-0000-0000-0000-000000000006', -- معرف مورد الطلبات
  '00000000-0000-0000-0000-000000000008', -- معرف إجراء التخصيص
  'تخصيص الطلبات للمندوبين',
  'orders:assign',
  'تخصيص الطلبات'
),

-- صلاحيات الرسائل (messages)
(
  '00000000-0000-0000-0000-000000000011', -- معرف مورد الرسائل
  '00000000-0000-0000-0000-000000000001', -- معرف إجراء العرض
  'عرض المحادثات والرسائل',
  'messages:view',
  'عرض الرسائل'
),
(
  '00000000-0000-0000-0000-000000000011', -- معرف مورد الرسائل
  '00000000-0000-0000-0000-000000000002', -- معرف إجراء الإنشاء
  'إنشاء محادثة أو رسالة جديدة',
  'messages:create',
  'إنشاء رسالة'
),
(
  '00000000-0000-0000-0000-000000000011', -- معرف مورد الرسائل
  '00000000-0000-0000-0000-000000000003', -- معرف إجراء التعديل
  'الرد على الرسائل الواردة',
  'messages:reply',
  'الرد على الرسائل'
),
(
  '00000000-0000-0000-0000-000000000011', -- معرف مورد الرسائل
  '00000000-0000-0000-0000-000000000007', -- معرف إجراء الإدارة
  'إدارة جميع المحادثات والرسائل',
  'messages:manage',
  'إدارة الرسائل'
),
(
  '00000000-0000-0000-0000-000000000011', -- معرف مورد الرسائل
  '00000000-0000-0000-0000-000000000004', -- معرف إجراء الحذف
  'حذف الرسائل والمحادثات',
  'messages:delete',
  'حذف الرسائل'
),

-- صلاحيات التقارير (reports)
(
  '00000000-0000-0000-0000-000000000008', -- معرف مورد التقارير
  '00000000-0000-0000-0000-000000000001', -- معرف إجراء العرض
  'عرض تقارير النظام',
  'reports:view',
  'عرض التقارير'
),
(
  '00000000-0000-0000-0000-000000000008', -- معرف مورد التقارير
  '00000000-0000-0000-0000-000000000006', -- معرف إجراء التصدير
  'تصدير التقارير بصيغ مختلفة',
  'reports:export',
  'تصدير التقارير'
),
(
  '00000000-0000-0000-0000-000000000008', -- معرف مورد التقارير
  '00000000-0000-0000-0000-000000000004', -- معرف إجراء الحذف
  'حذف التقارير من النظام',
  'reports:delete',
  'حذف التقارير'
),

-- صلاحيات المسؤولين (admins)
(
  '00000000-0000-0000-0000-000000000002', -- معرف مورد المسؤولين
  '00000000-0000-0000-0000-000000000001', -- معرف إجراء العرض
  'عرض قائمة المسؤولين وتفاصيلهم',
  'admins:view',
  'عرض المسؤولين'
),
(
  '00000000-0000-0000-0000-000000000002', -- معرف مورد المسؤولين
  '00000000-0000-0000-0000-000000000002', -- معرف إجراء الإنشاء
  'إنشاء حساب مسؤول جديد',
  'admins:create',
  'إنشاء مسؤول'
),
(
  '00000000-0000-0000-0000-000000000002', -- معرف مورد المسؤولين
  '00000000-0000-0000-0000-000000000003', -- معرف إجراء التعديل
  'تعديل معلومات المسؤولين',
  'admins:update',
  'تحديث بيانات المسؤولين'
),
(
  '00000000-0000-0000-0000-000000000002', -- معرف مورد المسؤولين
  '00000000-0000-0000-0000-000000000007', -- معرف إجراء الإدارة
  'إدارة حسابات المسؤولين وصلاحياتهم',
  'admins:manage',
  'إدارة المسؤولين'
),
(
  '00000000-0000-0000-0000-000000000002', -- معرف مورد المسؤولين
  '00000000-0000-0000-0000-000000000004', -- معرف إجراء الحذف
  'حذف حسابات المسؤولين',
  'admins:delete',
  'حذف المسؤولين'
),

-- صلاحيات الأدوار (roles)
(
  '00000000-0000-0000-0000-000000000003', -- معرف مورد الأدوار
  '00000000-0000-0000-0000-000000000001', -- معرف إجراء العرض
  'عرض قائمة أدوار النظام وتفاصيلها',
  'roles:view',
  'عرض الأدوار'
),
(
  '00000000-0000-0000-0000-000000000003', -- معرف مورد الأدوار
  '00000000-0000-0000-0000-000000000007', -- معرف إجراء الإدارة
  'إنشاء وتعديل وحذف أدوار النظام',
  'roles:manage',
  'إدارة الأدوار'
),

-- صلاحيات الإعدادات (settings)
(
  '00000000-0000-0000-0000-000000000010', -- معرف مورد الإعدادات
  '00000000-0000-0000-0000-000000000001', -- معرف إجراء العرض
  'عرض إعدادات النظام',
  'settings:view',
  'عرض الإعدادات'
),
(
  '00000000-0000-0000-0000-000000000010', -- معرف مورد الإعدادات
  '00000000-0000-0000-0000-000000000007', -- معرف إجراء الإدارة
  'تعديل إعدادات النظام',
  'settings:manage',
  'إدارة الإعدادات'
),

-- صلاحيات المندوبين (agents)
(
  '00000000-0000-0000-0000-000000000004', -- معرف مورد المندوبين
  '00000000-0000-0000-0000-000000000001', -- معرف إجراء العرض
  'عرض قائمة مندوبي التوصيل وتفاصيلهم',
  'agents:view',
  'عرض المندوبين'
),
(
  '00000000-0000-0000-0000-000000000004', -- معرف مورد المندوبين
  '00000000-0000-0000-0000-000000000007', -- معرف إجراء الإدارة
  'إدارة حسابات مندوبي التوصيل',
  'agents:manage',
  'إدارة المندوبين'
)
ON CONFLICT (resource_id, action_id) DO UPDATE
SET 
  description = EXCLUDED.description, 
  code = EXCLUDED.code,
  name = EXCLUDED.name;
*/

-- ========================================================================
-- استخدام النظام الجديد
-- ========================================================================

-- الجدول الحالي المبسط:
-- create table public.admins (
--   id uuid not null default extensions.uuid_generate_v4 (),
--   user_id uuid null,
--   is_active boolean null default true,
--   email text null,
--   constraint admins_pkey primary key (id),
--   constraint admins_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
-- ) TABLESPACE pg_default;

-- يمكن ترحيل البيانات من الجدول القديم إلى الجدول الجديد باستخدام SQL التالي:
-- (يجب تعديله حسب هيكل البيانات الحالي)

/*
DO $$
BEGIN
    -- تحديث السجلات الحالية في حال تم إنشاء الجدول الجديد فوق الجدول القديم
    -- إذا كان الجدول الجديد منفصلاً، يمكن استخدام INSERT بدلاً من UPDATE
    
    UPDATE public.admins
    SET 
        role_id = '00000000-0000-0000-0000-000000000001',  -- super_admin كقيمة افتراضية
        department_id = '00000000-0000-0000-0000-000000000001',  -- مجلس الإدارة كقيمة افتراضية
        username = COALESCE(username, 'admin_' || SUBSTRING(id::text, 1, 8)),
        full_name = COALESCE(full_name, 'مسؤول النظام')
    WHERE email IS NOT NULL;
    
    -- يجب التأكد من ملء الحقول الإضافية حسب احتياجات النظام والبيانات المتاحة
END;
$$;
*/

-- ملاحظات حول استخدام النظام الجديد:
-- 1. يوفر النظام الجديد مرونة كبيرة في إدارة الأدوار والصلاحيات
-- 2. يمكن إنشاء أدوار جديدة وتعيين صلاحيات محددة لها
-- 3. يمكن تجميع المسؤولين في مجموعات لتسهيل إدارة الصلاحيات
-- 4. يتم تسجيل جميع أنشطة المسؤولين لأغراض المراقبة والتدقيق
-- 5. يدعم النظام التسلسل الهرمي للإدارات والمديرين
-- 6. يمكن تخصيص صلاحيات استثنائية لمسؤولين محددين إضافة إلى صلاحيات أدوارهم