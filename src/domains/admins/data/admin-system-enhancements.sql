-- ========================================================================
-- تحسينات إضافية لنظام إدارة المسؤولين والصلاحيات الشامل
-- ========================================================================

-- ========================================================================
-- شرح التحسينات:
-- ========================================================================
-- يهدف هذا الملف إلى إضافة تحسينات متقدمة لنظام الصلاحيات الأساسي، بما في ذلك:
-- 1. صلاحيات مستوى البيانات (Row-Level Security)
-- 2. إدارة الصلاحيات الديناميكية
-- 3. دعم التسلسل الهرمي للصلاحيات
-- 4. تحسينات الأداء
-- 5. تتبع تاريخ تغييرات الصلاحيات

-- ========================================================================
-- 1. صلاحيات مستوى البيانات (Row-Level Security)
-- ========================================================================
-- تتيح للمسؤولين رؤية وإدارة البيانات حسب معايير محددة (مثل المنطقة الجغرافية)

-- جدول نطاقات البيانات
CREATE TABLE IF NOT EXISTS public.data_scopes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  description text,
  
  -- المرتبط به (مسؤول، دور، مجموعة)
  admin_id uuid REFERENCES public.admins(id) ON DELETE CASCADE,
  role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.admin_groups(id) ON DELETE CASCADE,
  
  -- المورد المرتبط (مثل: orders, agents, customers)
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  
  -- شروط التصفية كـ JSON
  condition jsonb NOT NULL, -- مثال: {"field": "region", "operator": "=", "value": "north"}
  
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid REFERENCES public.admins(id),
  is_active boolean NOT NULL DEFAULT true,
  
  CONSTRAINT data_scopes_pkey PRIMARY KEY (id)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.data_scopes IS 'جدول نطاقات البيانات يتيح تقييد وصول المسؤولين للبيانات بناءً على شروط محددة';

-- إضافة فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_data_scopes_admin ON public.data_scopes(admin_id) WHERE admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_data_scopes_role ON public.data_scopes(role_id) WHERE role_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_data_scopes_group ON public.data_scopes(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_data_scopes_resource ON public.data_scopes(resource_id);

-- ========================================================================
-- 2. إدارة الصلاحيات الديناميكية
-- ========================================================================
-- استبدال حقل permissions في جدول admins بجدول منفصل للتجاوزات

-- جدول تجاوزات صلاحيات المسؤولين (بديل لحقل permissions)
CREATE TABLE IF NOT EXISTS public.admin_permissions_overrides (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(), -- معرف فريد للتجاوز
  admin_id uuid NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE, -- المسؤول المستفيد من التجاوز
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE, -- الصلاحية المطبقة
  is_granted boolean NOT NULL DEFAULT true, -- منح أو منع الصلاحية (true = منح، false = منع)
  reason text, -- سبب التجاوز (لأغراض التوثيق)
  granted_by_admin_id uuid REFERENCES public.admins(id), -- المسؤول الذي قام بمنح التجاوز
  expires_at timestamptz, -- تاريخ انتهاء التجاوز (NULL = دائم)
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, -- تاريخ إنشاء التجاوز
  
  CONSTRAINT admin_permissions_overrides_pkey PRIMARY KEY (id),
  CONSTRAINT admin_permissions_overrides_unique UNIQUE (admin_id, permission_id)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.admin_permissions_overrides IS 'جدول تجاوزات صلاحيات المسؤولين يسمح بتخصيص صلاحيات إضافية أو منع صلاحيات للمسؤولين بشكل فردي';

-- إنشاء فهرس على تاريخ الانتهاء لحذف التجاوزات المنتهية بسهولة
CREATE INDEX IF NOT EXISTS idx_admin_overrides_expires ON public.admin_permissions_overrides(expires_at) WHERE expires_at IS NOT NULL;

-- ========================================================================
-- 3. التسلسل الهرمي للصلاحيات
-- ========================================================================
-- تحسين دالة التحقق من الصلاحيات لتدعم وراثة الصلاحيات من المستويات الأعلى

-- دالة التحقق من صلاحيات المسؤول (محسّنة)
CREATE OR REPLACE FUNCTION check_admin_permission_enhanced(admin_id uuid, permission_code text)
RETURNS boolean AS $$
DECLARE
    has_permission boolean := false; -- Initialize to false
    resource_code text;
    action_code text;
    current_manager_id uuid;
    depth integer := 0;
    max_hierarchy_depth integer := 5; -- الحد الأقصى لعمق التسلسل الهرمي
BEGIN
    -- Ensure admin exists and is active
    IF NOT EXISTS (SELECT 1 FROM public.admins WHERE id = admin_id AND is_active = true) THEN
        RETURN false;
    END IF;

    -- 1. التحقق من التجاوزات المخصصة للمسؤول (Overrides should have the highest priority)
    SELECT EXISTS (
        SELECT 1 
        FROM public.admin_permissions_overrides o
        JOIN public.permissions p ON o.permission_id = p.id
        WHERE o.admin_id = admin_id 
          AND p.code = permission_code
          -- Check if granted=true (explicit grant) OR granted=false (explicit deny)
          -- If an explicit deny exists, return false immediately.
    ) INTO has_permission;

    IF EXISTS (
        SELECT 1 
        FROM public.admin_permissions_overrides o
        JOIN public.permissions p ON o.permission_id = p.id
        WHERE o.admin_id = admin_id 
          AND p.code = permission_code
          AND o.is_granted = false
          AND (o.expires_at IS NULL OR o.expires_at > CURRENT_TIMESTAMP)
    ) THEN
        RETURN false; -- Explicitly denied
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM public.admin_permissions_overrides o
        JOIN public.permissions p ON o.permission_id = p.id
        WHERE o.admin_id = admin_id 
          AND p.code = permission_code
          AND o.is_granted = true
          AND (o.expires_at IS NULL OR o.expires_at > CURRENT_TIMESTAMP)
    ) THEN
        RETURN true; -- Explicitly granted via override
    END IF;

    -- 2. التحقق من وجود الصلاحية مباشرة من خلال الدور المعين للمسؤول
    SELECT EXISTS (
        SELECT 1 
        FROM public.admins a
        JOIN public.role_permissions rp ON a.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE a.id = admin_id AND p.code = permission_code
        -- No need to check a.is_active again, checked at the beginning
    ) INTO has_permission;

    IF has_permission THEN
        RETURN true;
    END IF;
    
    -- 3. إذا لم توجد صلاحية عبر الدور، تحقق من المجموعات التي ينتمي إليها المسؤول
    SELECT EXISTS (
        SELECT 1 
        FROM public.admin_group_members agm
        JOIN public.group_permissions gp ON agm.group_id = gp.group_id
        JOIN public.permissions p ON gp.permission_id = p.id
        JOIN public.admin_groups g ON gp.group_id = g.id -- Ensure the group itself is active (if applicable)
        WHERE agm.admin_id = admin_id AND p.code = permission_code
        -- Add check for group active status if needed: AND g.is_active = true 
    ) INTO has_permission;

    IF has_permission THEN
        RETURN true;
    END IF;

    -- 4. التحقق من التسلسل الهرمي - وراثة الصلاحيات من المدير المباشر
    -- (Note: Hierarchy check might grant permissions even if explicitly denied by role/group, consider if this is desired)
    -- استخراج رمز المورد والإجراء من رمز الصلاحية
    BEGIN
        resource_code := SPLIT_PART(permission_code, ':', 1);
        action_code := SPLIT_PART(permission_code, ':', 2);
    EXCEPTION WHEN OTHERS THEN
        -- Handle potential error if permission_code format is invalid
        resource_code := null;
        action_code := null;
    END;
    
    -- إذا كان الإجراء يتطلب موافقة أو إدارة، نتحقق من المديرين الأعلى
    IF action_code IN ('approve', 'manage') THEN -- Adjust actions requiring hierarchy check as needed
        -- الحصول على المدير المباشر
        SELECT manager_id INTO current_manager_id
        FROM public.admins
        WHERE id = admin_id;
        
        -- تتبع التسلسل الهرمي حتى نجد مديرًا لديه الصلاحية
        WHILE current_manager_id IS NOT NULL AND NOT has_permission AND depth < max_hierarchy_depth LOOP
            -- التحقق من صلاحيات المدير الحالي recursively using the same function
            -- Make sure the recursive call won't cause infinite loops (depth check helps)
            SELECT check_admin_permission_enhanced(current_manager_id, permission_code) INTO has_permission;
            
            -- إذا لم يكن لديه الصلاحية، ننتقل إلى المدير الأعلى
            IF NOT has_permission THEN
                SELECT manager_id INTO current_manager_id
                FROM public.admins
                WHERE id = current_manager_id;
                
                depth := depth + 1;
            END IF;
        END LOOP;
    END IF;

    IF has_permission THEN
        RETURN true;
    END IF;

    -- If no permission found through any mechanism, return false.
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE; -- Mark as STABLE as it doesn't modify data

-- ========================================================================
-- 4. تحسينات الأداء
-- ========================================================================
-- إضافة فهارس إضافية لتحسين سرعة استعلامات الصلاحيات

-- فهرس على رمز الصلاحية
CREATE INDEX IF NOT EXISTS idx_permissions_code ON public.permissions(code);

-- فهرس على الصلاحيات المرتبطة بالأدوار
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission_id);

-- فهرس على الصلاحيات المرتبطة بالمجموعات
CREATE INDEX IF NOT EXISTS idx_group_permissions_permission ON public.group_permissions(permission_id);

-- فهرس على المديرين المباشرين
CREATE INDEX IF NOT EXISTS idx_admins_manager ON public.admins(manager_id) WHERE manager_id IS NOT NULL;

-- ========================================================================
-- 5. تتبع تاريخ تغييرات الصلاحيات
-- ========================================================================
-- إضافة جدول سجل تغييرات الصلاحيات

-- جدول سجل تغييرات الصلاحيات
CREATE TABLE IF NOT EXISTS public.permission_audit_log (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  entity_type text NOT NULL, -- نوع الكيان (admin, role, group)
  entity_id uuid NOT NULL, -- معرف الكيان
  permission_id uuid NOT NULL REFERENCES public.permissions(id),
  action_type text NOT NULL, -- نوع الإجراء (grant, revoke, expire)
  old_value jsonb, -- القيمة القديمة
  new_value jsonb, -- القيمة الجديدة
  changed_by uuid REFERENCES public.admins(id),
  changed_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT permission_audit_log_pkey PRIMARY KEY (id)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.permission_audit_log IS 'جدول سجل تغييرات الصلاحيات لتتبع منح وسحب الصلاحيات';

-- إنشاء فهرس على الكيان ونوعه
CREATE INDEX IF NOT EXISTS idx_permission_audit_entity ON public.permission_audit_log(entity_type, entity_id);

-- ========================================================================
-- دوال مساعدة إضافية
-- ========================================================================

-- دالة إضافة تجاوز صلاحية لمسؤول
CREATE OR REPLACE FUNCTION add_admin_permission_override(
    p_admin_id uuid,
    p_permission_code text,
    p_is_granted boolean,
    p_reason text,
    p_granted_by uuid,
    p_expires_at timestamptz DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_permission_id uuid;
    v_override_id uuid;
    v_old_value jsonb;
BEGIN
    -- البحث عن معرف الصلاحية من الرمز
    SELECT id INTO v_permission_id
    FROM public.permissions
    WHERE code = p_permission_code;
    
    IF v_permission_id IS NULL THEN
        RAISE EXCEPTION 'الصلاحية المطلوبة غير موجودة: %', p_permission_code;
    END IF;
    
    -- استرجاع القيمة القديمة إن وجدت
    SELECT jsonb_build_object(
        'is_granted', is_granted,
        'expires_at', expires_at,
        'reason', reason
    ) INTO v_old_value
    FROM public.admin_permissions_overrides
    WHERE admin_id = p_admin_id AND permission_id = v_permission_id;
    
    -- إضافة أو تحديث التجاوز
    INSERT INTO public.admin_permissions_overrides (
        admin_id, permission_id, is_granted, reason, granted_by, expires_at
    ) VALUES (
        p_admin_id, v_permission_id, p_is_granted, p_reason, p_granted_by, p_expires_at
    )
    ON CONFLICT (admin_id, permission_id) DO UPDATE
    SET is_granted = p_is_granted,
        reason = p_reason,
        granted_by = p_granted_by,
        expires_at = p_expires_at
    RETURNING id INTO v_override_id;
    
    -- تسجيل الإجراء في سجل التدقيق
    INSERT INTO public.permission_audit_log (
        entity_type, entity_id, permission_id, action_type, 
        old_value, new_value, changed_by
    ) VALUES (
        'admin', p_admin_id, v_permission_id, 
        CASE WHEN v_old_value IS NULL THEN 'grant' ELSE 'update' END,
        v_old_value,
        jsonb_build_object(
            'is_granted', p_is_granted,
            'expires_at', p_expires_at,
            'reason', p_reason
        ),
        p_granted_by
    );
    
    RETURN v_override_id;
END;
$$ LANGUAGE plpgsql;

-- دالة إنشاء نطاق بيانات
CREATE OR REPLACE FUNCTION create_data_scope(
    p_name text,
    p_resource_code text,
    p_condition jsonb,
    p_admin_id uuid DEFAULT NULL,
    p_role_id uuid DEFAULT NULL,
    p_group_id uuid DEFAULT NULL,
    p_created_by uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_resource_id uuid;
    v_scope_id uuid;
BEGIN
    -- البحث عن معرف المورد من الرمز
    SELECT id INTO v_resource_id
    FROM public.resources
    WHERE code = p_resource_code;
    
    IF v_resource_id IS NULL THEN
        RAISE EXCEPTION 'المورد المطلوب غير موجود: %', p_resource_code;
    END IF;
    
    -- التأكد من تحديد نوع واحد على الأقل من الكيانات
    IF p_admin_id IS NULL AND p_role_id IS NULL AND p_group_id IS NULL THEN
        RAISE EXCEPTION 'يجب تحديد مسؤول أو دور أو مجموعة لإنشاء نطاق البيانات';
    END IF;
    
    -- إنشاء نطاق البيانات
    INSERT INTO public.data_scopes (
        name, description, admin_id, role_id, group_id, 
        resource_id, condition, created_by
    ) VALUES (
        p_name, NULL, p_admin_id, p_role_id, p_group_id, 
        v_resource_id, p_condition, p_created_by
    )
    RETURNING id INTO v_scope_id;
    
    RETURN v_scope_id;
END;
$$ LANGUAGE plpgsql;

-- دالة لتطبيق شروط التصفية على استعلام من مورد
CREATE OR REPLACE FUNCTION apply_data_scopes(
    p_admin_id uuid,
    p_resource_code text,
    p_base_query text
)
RETURNS text AS $$
DECLARE
    v_conditions text := '';
    v_data_scope record;
    v_role_id uuid;
    v_group_ids uuid[];
BEGIN
    -- الحصول على دور المسؤول
    SELECT role_id INTO v_role_id
    FROM public.admins
    WHERE id = p_admin_id;
    
    -- الحصول على مجموعات المسؤول
    SELECT ARRAY_AGG(group_id) INTO v_group_ids
    FROM public.admin_group_members
    WHERE admin_id = p_admin_id;
    
    -- جمع شروط التصفية من جميع نطاقات البيانات المنطبقة
    FOR v_data_scope IN (
        SELECT ds.condition
        FROM public.data_scopes ds
        JOIN public.resources r ON ds.resource_id = r.id
        WHERE r.code = p_resource_code
          AND (
            ds.admin_id = p_admin_id
            OR ds.role_id = v_role_id
            OR (v_group_ids IS NOT NULL AND ds.group_id = ANY(v_group_ids))
          )
          AND ds.is_active = true
    ) LOOP
        -- تحويل شرط JSON إلى نص SQL
        IF v_conditions != '' THEN
            v_conditions := v_conditions || ' AND ';
        END IF;
        
        v_conditions := v_conditions || format(
            '%I %s %L',
            (v_data_scope.condition->>'field'),
            (v_data_scope.condition->>'operator'),
            (v_data_scope.condition->>'value')
        );
    END LOOP;
    
    -- إضافة الشروط إلى الاستعلام الأساسي إذا وجدت
    IF v_conditions != '' THEN
        -- التحقق من وجود WHERE في الاستعلام الأساسي
        IF p_base_query ~* 'where' THEN
            RETURN p_base_query || ' AND (' || v_conditions || ')';
        ELSE
            RETURN p_base_query || ' WHERE ' || v_conditions;
        END IF;
    ELSE
        -- إعادة الاستعلام الأساسي كما هو إذا لم توجد شروط
        RETURN p_base_query;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- تنظيف التجاوزات منتهية الصلاحية
-- ========================================================================

-- دالة لتنظيف التجاوزات منتهية الصلاحية
CREATE OR REPLACE FUNCTION cleanup_expired_overrides()
RETURNS integer AS $$
DECLARE
    v_count integer;
BEGIN
    -- تسجيل التجاوزات المنتهية في سجل التدقيق
    INSERT INTO public.permission_audit_log (
        entity_type, entity_id, permission_id, action_type, 
        old_value, new_value, changed_by
    )
    SELECT 
        'admin', admin_id, permission_id, 'expire',
        jsonb_build_object(
            'is_granted', is_granted,
            'expires_at', expires_at,
            'reason', reason
        ),
        NULL,
        NULL
    FROM public.admin_permissions_overrides
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- حذف التجاوزات المنتهية
    WITH deleted AS (
        DELETE FROM public.admin_permissions_overrides
        WHERE expires_at < CURRENT_TIMESTAMP
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_count FROM deleted;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- دمج مع النظام الأساسي
-- ========================================================================

-- تعديل دالة log_admin_activity لتسجيل التغييرات في الصلاحيات أيضًا
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
    -- تسجيل النشاط في سجل الأنشطة العام
    INSERT INTO public.admin_activity_log (
        admin_id, action_type, target_type, target_id, details, ip_address, user_agent
    ) VALUES (
        admin_id, action_type, target_type, target_id, details, ip_address, user_agent
    )
    RETURNING id INTO log_id;
    
    -- إذا كان النشاط متعلقًا بالصلاحيات، سجله في سجل تغييرات الصلاحيات أيضًا
    IF target_type IN ('permission', 'role_permission', 'admin_permission') THEN
        -- سيتم تسجيل التفاصيل عبر دوال أخرى
        NULL;
    END IF;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- مهمة مجدولة لتنظيف التجاوزات المنتهية
-- يمكن تنفيذها بواسطة cron job خارجي أو باستخدام pg_cron إذا كان متاحًا
-- SELECT cron.schedule('0 */6 * * *', 'SELECT cleanup_expired_overrides()');

-- ملاحظة: يجب تثبيت امتداد pg_cron أولاً إذا لم يكن موجودًا:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ========================================================================
-- ملاحظات حول الاستخدام:
-- ========================================================================
-- 1. قم بتنفيذ هذا الملف بعد تنفيذ ملف admin-system-schema.sql
-- 2. يمكن الآن استخدام الدوال الجديدة مثل:
--    - check_admin_permission_enhanced بدلاً من check_admin_permission
--    - add_admin_permission_override لمنح صلاحيات خاصة
--    - create_data_scope لإنشاء نطاقات بيانات
--    - apply_data_scopes لتطبيق نطاقات البيانات على الاستعلامات
-- 3. ستستمر الصلاحيات القديمة في العمل، لكن يوصى بالتحول التدريجي للنظام الجديد
-- 4. يمكن إضافة المزيد من التحسينات مستقبلاً مثل:
--    - واجهة برمجية (API) متكاملة لإدارة الصلاحيات
--    - واجهة مستخدم رسومية لإدارة الصلاحيات
--    - تكامل مع أنظمة إدارة الهوية الخارجية