-- ========================================================================
-- تحسينات وتنقيحات إضافية لنظام إدارة المسؤولين والصلاحيات
-- بناءً على مراجعة الكود والملاحظات
-- ========================================================================

-- ========================================================================
-- 1. تحسين تسمية الأعمدة وتوثيقها
-- ========================================================================

-- إعادة تسمية وتوثيق أعمدة جدول تجاوزات صلاحيات المسؤولين
ALTER TABLE IF EXISTS public.admin_permissions_overrides 
  RENAME COLUMN granted_by TO granted_by_admin_id;

-- إضافة تعليقات توضيحية على أعمدة جدول تجاوزات صلاحيات المسؤولين
COMMENT ON COLUMN public.admin_permissions_overrides.id IS 'معرف فريد للتجاوز';
COMMENT ON COLUMN public.admin_permissions_overrides.admin_id IS 'معرف المسؤول المستفيد من التجاوز';
COMMENT ON COLUMN public.admin_permissions_overrides.permission_id IS 'معرف الصلاحية المستهدفة';
COMMENT ON COLUMN public.admin_permissions_overrides.is_granted IS 'يحدد ما إذا كان التجاوز لمنح أو منع الصلاحية (true = منح، false = منع)';
COMMENT ON COLUMN public.admin_permissions_overrides.reason IS 'سبب منح أو منع التجاوز (لأغراض التوثيق)';
COMMENT ON COLUMN public.admin_permissions_overrides.granted_by_admin_id IS 'معرف المسؤول الذي قام بمنح التجاوز';
COMMENT ON COLUMN public.admin_permissions_overrides.expires_at IS 'تاريخ انتهاء التجاوز (NULL = دائم)';
COMMENT ON COLUMN public.admin_permissions_overrides.created_at IS 'تاريخ إنشاء التجاوز';

-- إضافة تعليقات توضيحية على أعمدة جدول نطاقات البيانات
COMMENT ON COLUMN public.data_scopes.id IS 'معرف فريد لنطاق البيانات';
COMMENT ON COLUMN public.data_scopes.name IS 'اسم نطاق البيانات';
COMMENT ON COLUMN public.data_scopes.description IS 'وصف توضيحي لنطاق البيانات';
COMMENT ON COLUMN public.data_scopes.admin_id IS 'معرف المسؤول المرتبط بالنطاق (اختياري)';
COMMENT ON COLUMN public.data_scopes.role_id IS 'معرف الدور المرتبط بالنطاق (اختياري)';
COMMENT ON COLUMN public.data_scopes.group_id IS 'معرف المجموعة المرتبطة بالنطاق (اختياري)';
COMMENT ON COLUMN public.data_scopes.resource_id IS 'معرف المورد الذي يطبق عليه النطاق';
COMMENT ON COLUMN public.data_scopes.condition IS 'شروط التصفية كـ JSON تحدد طريقة تقييد البيانات';
COMMENT ON COLUMN public.data_scopes.created_at IS 'تاريخ إنشاء النطاق';
COMMENT ON COLUMN public.data_scopes.created_by IS 'معرف المسؤول الذي أنشأ النطاق';
COMMENT ON COLUMN public.data_scopes.is_active IS 'حالة نطاق البيانات (نشط/غير نشط)';

-- إضافة تعليقات توضيحية على أعمدة جدول سجل تغييرات الصلاحيات
COMMENT ON COLUMN public.permission_audit_log.id IS 'معرف فريد لسجل التغيير';
COMMENT ON COLUMN public.permission_audit_log.entity_type IS 'نوع الكيان المتأثر (admin, role, group)';
COMMENT ON COLUMN public.permission_audit_log.entity_id IS 'معرف الكيان المتأثر';
COMMENT ON COLUMN public.permission_audit_log.permission_id IS 'معرف الصلاحية التي تم تغييرها';
COMMENT ON COLUMN public.permission_audit_log.action_type IS 'نوع الإجراء (grant, revoke, expire)';
COMMENT ON COLUMN public.permission_audit_log.old_value IS 'القيمة القديمة قبل التغيير بتنسيق JSON';
COMMENT ON COLUMN public.permission_audit_log.new_value IS 'القيمة الجديدة بعد التغيير بتنسيق JSON';
COMMENT ON COLUMN public.permission_audit_log.changed_by IS 'معرف المسؤول الذي قام بالتغيير';
COMMENT ON COLUMN public.permission_audit_log.changed_at IS 'تاريخ ووقت التغيير';

-- ========================================================================
-- 2. جدول الإعدادات لتكوين النظام
-- ========================================================================

-- إنشاء جدول إعدادات نظام الصلاحيات
CREATE TABLE IF NOT EXISTS public.admin_system_settings (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  setting_key text NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by uuid REFERENCES public.admins(id),
  
  CONSTRAINT admin_system_settings_pkey PRIMARY KEY (id),
  CONSTRAINT admin_system_settings_key_unique UNIQUE (setting_key)
);

-- إضافة تعليق توضيحي للجدول
COMMENT ON TABLE public.admin_system_settings IS 'جدول إعدادات نظام الصلاحيات لتخزين قيم التكوين المختلفة';

-- إضافة الإعدادات الافتراضية
INSERT INTO public.admin_system_settings (setting_key, setting_value, description)
VALUES 
  ('max_hierarchy_depth', '5'::jsonb, 'العمق الأقصى للتسلسل الهرمي في وراثة الصلاحيات'),
  ('permission_cache_expiry', '3600'::jsonb, 'وقت انتهاء صلاحية ذاكرة التخزين المؤقت للصلاحيات بالثواني');

-- ========================================================================
-- 3. تحسين دالة التحقق من صلاحيات المسؤول مع دعم الإعدادات
-- ========================================================================

-- تحديث دالة التحقق من صلاحيات المسؤول لتستخدم الإعدادات
CREATE OR REPLACE FUNCTION check_admin_permission_enhanced(admin_id uuid, permission_code text)
RETURNS boolean AS $$
DECLARE
    has_permission boolean;
    resource_code text;
    action_code text;
    current_manager_id uuid;
    depth integer := 0;
    max_hierarchy_depth integer;
BEGIN
    -- استرجاع العمق الأقصى من جدول الإعدادات
    SELECT (setting_value->>'value')::integer INTO max_hierarchy_depth
    FROM public.admin_system_settings
    WHERE setting_key = 'max_hierarchy_depth';
    
    -- إذا لم يتم العثور على الإعداد، استخدم قيمة افتراضية
    IF max_hierarchy_depth IS NULL THEN
        max_hierarchy_depth := 5;
    END IF;
    
    -- 1. التحقق من وجود الصلاحية مباشرة من خلال الدور
    SELECT EXISTS (
        SELECT 1 
        FROM public.admins a
        JOIN public.role_permissions rp ON a.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE a.id = admin_id AND p.code = permission_code AND a.is_active = true
    ) INTO has_permission;
    
    -- 2. إذا لم توجد صلاحية عبر الدور، تحقق من المجموعات
    IF NOT has_permission THEN
        SELECT EXISTS (
            SELECT 1 
            FROM public.admin_group_members agm
            JOIN public.group_permissions gp ON agm.group_id = gp.group_id
            JOIN public.permissions p ON gp.permission_id = p.id
            WHERE agm.admin_id = admin_id AND p.code = permission_code
        ) INTO has_permission;
    END IF;
    
    -- 3. إذا لم توجد صلاحية، تحقق من التجاوزات المخصصة للمسؤول
    IF NOT has_permission THEN
        SELECT EXISTS (
            SELECT 1 
            FROM public.admin_permissions_overrides o
            JOIN public.permissions p ON o.permission_id = p.id
            WHERE o.admin_id = admin_id 
              AND p.code = permission_code
              AND o.is_granted = true
              AND (o.expires_at IS NULL OR o.expires_at > CURRENT_TIMESTAMP)
        ) INTO has_permission;
    END IF;
    
    -- 4. تحقق من حقل permissions (للتوافق مع النظام السابق)
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
    
    -- 5. التحقق من التسلسل الهرمي - وراثة الصلاحيات من المدير المباشر
    IF NOT has_permission THEN
        -- استخراج رمز المورد والإجراء من رمز الصلاحية
        resource_code := SPLIT_PART(permission_code, ':', 1);
        action_code := SPLIT_PART(permission_code, ':', 2);
        
        -- إذا كان الإجراء هو 'approve' أو 'manage'، نتحقق من المديرين الأعلى
        IF action_code IN ('approve', 'manage') THEN
            -- الحصول على المدير المباشر
            SELECT manager_id INTO current_manager_id
            FROM public.admins
            WHERE id = admin_id;
            
            -- تتبع التسلسل الهرمي حتى نجد مديرًا لديه الصلاحية
            WHILE current_manager_id IS NOT NULL AND NOT has_permission AND depth < max_hierarchy_depth LOOP
                -- التحقق من صلاحيات المدير الحالي
                SELECT check_admin_permission(current_manager_id, permission_code) INTO has_permission;
                
                -- إذا لم يكن لديه الصلاحية، ننتقل إلى المدير الأعلى
                IF NOT has_permission THEN
                    SELECT manager_id INTO current_manager_id
                    FROM public.admins
                    WHERE id = current_manager_id;
                    
                    depth := depth + 1;
                END IF;
            END LOOP;
        END IF;
    END IF;
    
    -- تسجيل محاولة الوصول لأغراض التدقيق (اختياري - يمكن تعطيله للأداء)
    INSERT INTO public.admin_activity_log (
        admin_id, action_type, target_type, target_id, details
    ) VALUES (
        admin_id, 
        'permission_check', 
        'permission', 
        permission_code,
        jsonb_build_object(
            'result', has_permission,
            'hierarchy_depth', depth
        )
    );
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- 4. تحسين دالة إضافة تجاوز صلاحية لمسؤول مع تسجيل أفضل
-- ========================================================================

-- تحديث دالة إضافة تجاوز صلاحية لمسؤول
CREATE OR REPLACE FUNCTION add_admin_permission_override(
    p_admin_id uuid,
    p_permission_code text,
    p_is_granted boolean,
    p_reason text,
    p_granted_by_admin_id uuid,
    p_expires_at timestamptz DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_permission_id uuid;
    v_override_id uuid;
    v_old_value jsonb;
    v_action_type text;
    v_admin_name text;
    v_permission_name text;
    v_granted_by_name text;
BEGIN
    -- البحث عن معرف الصلاحية من الرمز
    SELECT id, name INTO v_permission_id, v_permission_name
    FROM public.permissions
    WHERE code = p_permission_code;
    
    IF v_permission_id IS NULL THEN
        RAISE EXCEPTION 'الصلاحية المطلوبة غير موجودة: %', p_permission_code;
    END IF;
    
    -- الحصول على اسم المسؤول المستفيد
    SELECT full_name INTO v_admin_name
    FROM public.admins
    WHERE id = p_admin_id;
    
    -- الحصول على اسم المسؤول المانح
    SELECT full_name INTO v_granted_by_name
    FROM public.admins
    WHERE id = p_granted_by_admin_id;
    
    -- استرجاع القيمة القديمة إن وجدت
    SELECT jsonb_build_object(
        'is_granted', is_granted,
        'expires_at', expires_at,
        'reason', reason,
        'granted_by_admin_id', granted_by_admin_id
    ), 
    CASE 
        WHEN is_granted = p_is_granted THEN 'update'
        WHEN is_granted = true AND p_is_granted = false THEN 'revoke'
        WHEN is_granted = false AND p_is_granted = true THEN 'grant'
    END
    INTO v_old_value, v_action_type
    FROM public.admin_permissions_overrides
    WHERE admin_id = p_admin_id AND permission_id = v_permission_id;
    
    -- إذا لم يتم العثور على تجاوز سابق
    IF v_old_value IS NULL THEN
        v_action_type := CASE WHEN p_is_granted THEN 'grant' ELSE 'deny' END;
    END IF;
    
    -- إضافة أو تحديث التجاوز
    INSERT INTO public.admin_permissions_overrides (
        admin_id, permission_id, is_granted, reason, granted_by_admin_id, expires_at
    ) VALUES (
        p_admin_id, v_permission_id, p_is_granted, p_reason, p_granted_by_admin_id, p_expires_at
    )
    ON CONFLICT (admin_id, permission_id) DO UPDATE
    SET is_granted = p_is_granted,
        reason = p_reason,
        granted_by_admin_id = p_granted_by_admin_id,
        expires_at = p_expires_at
    RETURNING id INTO v_override_id;
    
    -- تسجيل الإجراء في سجل التدقيق بتفاصيل أكثر
    INSERT INTO public.permission_audit_log (
        entity_type, entity_id, permission_id, action_type, 
        old_value, new_value, changed_by
    ) VALUES (
        'admin', p_admin_id, v_permission_id, v_action_type,
        v_old_value,
        jsonb_build_object(
            'is_granted', p_is_granted,
            'expires_at', p_expires_at,
            'reason', p_reason,
            'granted_by_admin_id', p_granted_by_admin_id
        ),
        p_granted_by_admin_id
    );
    
    -- تسجيل في سجل النشاط العام أيضًا
    INSERT INTO public.admin_activity_log (
        admin_id, action_type, target_type, target_id, details
    ) VALUES (
        p_granted_by_admin_id, 
        v_action_type || '_permission', 
        'admin', 
        p_admin_id::text,
        jsonb_build_object(
            'admin_name', v_admin_name,
            'permission_code', p_permission_code,
            'permission_name', v_permission_name,
            'is_granted', p_is_granted,
            'reason', p_reason,
            'expires_at', p_expires_at
        )
    );
    
    RETURN v_override_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- 5. دالة جديدة لتحليل شروط نطاق البيانات وتوليد WHERE clause
-- ========================================================================

-- دالة لتحليل شرط نطاق البيانات وتوليد SQL شرطي
CREATE OR REPLACE FUNCTION parse_data_scope_condition(condition jsonb)
RETURNS text AS $$
DECLARE
    field_name text;
    operator text;
    value_node jsonb;
    value_text text;
    condition_sql text;
BEGIN
    -- استخراج عناصر الشرط
    field_name := condition->>'field';
    operator := condition->>'operator';
    value_node := condition->'value';
    
    -- التحقق من وجود العناصر الأساسية
    IF field_name IS NULL OR operator IS NULL OR value_node IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- تحديد نوع القيمة وتهيئتها
    IF jsonb_typeof(value_node) = 'string' THEN
        value_text := quote_literal(value_node#>>'{}');
    ELSIF jsonb_typeof(value_node) = 'number' THEN
        value_text := value_node#>>'{}';
    ELSIF jsonb_typeof(value_node) = 'boolean' THEN
        value_text := value_node#>>'{}';
    ELSIF jsonb_typeof(value_node) = 'null' THEN
        value_text := 'NULL';
    ELSIF jsonb_typeof(value_node) = 'array' THEN
        -- معالجة المصفوفات للعوامل مثل IN
        IF operator = 'IN' THEN
            WITH array_elements AS (
                SELECT jsonb_array_elements(value_node) AS element
            )
            SELECT string_agg(
                CASE 
                    WHEN jsonb_typeof(element) = 'string' THEN quote_literal(element#>>'{}')
                    ELSE element#>>'{}'
                END, 
                ', '
            ) INTO value_text
            FROM array_elements;
            
            value_text := '(' || value_text || ')';
        ELSE
            -- إذا كان العامل غير مناسب للمصفوفات
            RAISE EXCEPTION 'العامل % غير مدعوم للمصفوفات', operator;
        END IF;
    ELSE
        -- نوع غير مدعوم
        RAISE EXCEPTION 'نوع القيمة غير مدعوم: %', jsonb_typeof(value_node);
    END IF;
    
    -- تكوين الشرط SQL بناءً على العامل
    CASE 
        WHEN operator IN ('=', '<>', '>', '<', '>=', '<=') THEN
            condition_sql := quote_ident(field_name) || ' ' || operator || ' ' || value_text;
        WHEN operator = 'IN' THEN
            condition_sql := quote_ident(field_name) || ' IN ' || value_text;
        WHEN operator = 'NOT IN' THEN
            condition_sql := quote_ident(field_name) || ' NOT IN ' || value_text;
        WHEN operator = 'LIKE' THEN
            condition_sql := quote_ident(field_name) || ' LIKE ' || value_text;
        WHEN operator = 'ILIKE' THEN
            condition_sql := quote_ident(field_name) || ' ILIKE ' || value_text;
        WHEN operator = 'IS NULL' THEN
            condition_sql := quote_ident(field_name) || ' IS NULL';
        WHEN operator = 'IS NOT NULL' THEN
            condition_sql := quote_ident(field_name) || ' IS NOT NULL';
        WHEN operator = 'BETWEEN' AND jsonb_typeof(value_node) = 'array' AND jsonb_array_length(value_node) = 2 THEN
            condition_sql := quote_ident(field_name) || ' BETWEEN ' || 
                             CASE WHEN jsonb_typeof(value_node->0) = 'string' 
                                  THEN quote_literal(value_node->0#>>'{}') 
                                  ELSE value_node->0#>>'{}' 
                             END || 
                             ' AND ' || 
                             CASE WHEN jsonb_typeof(value_node->1) = 'string' 
                                  THEN quote_literal(value_node->1#>>'{}') 
                                  ELSE value_node->1#>>'{}' 
                             END;
        ELSE
            RAISE EXCEPTION 'العامل غير مدعوم: %', operator;
    END CASE;
    
    RETURN condition_sql;
END;
$$ LANGUAGE plpgsql;

-- دالة محسنة لتطبيق نطاقات البيانات باستخدام دالة تحليل الشروط
CREATE OR REPLACE FUNCTION apply_data_scopes_enhanced(
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
    v_condition_sql text;
    v_final_query text;
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
        -- تحليل الشرط وتحويله إلى SQL
        v_condition_sql := parse_data_scope_condition(v_data_scope.condition);
        
        IF v_condition_sql IS NOT NULL THEN
            IF v_conditions != '' THEN
                v_conditions := v_conditions || ' AND ';
            END IF;
            
            v_conditions := v_conditions || '(' || v_condition_sql || ')';
        END IF;
    END LOOP;
    
    -- إضافة الشروط إلى الاستعلام الأساسي إذا وجدت
    IF v_conditions != '' THEN
        -- التحقق من وجود WHERE في الاستعلام الأساسي
        IF p_base_query ~* '\sWHERE\s' THEN
            v_final_query := p_base_query || ' AND (' || v_conditions || ')';
        ELSE
            v_final_query := p_base_query || ' WHERE ' || v_conditions;
        END IF;
    ELSE
        -- إعادة الاستعلام الأساسي كما هو إذا لم توجد شروط
        v_final_query := p_base_query;
    END IF;
    
    -- تسجيل الاستعلام المولّد للتدقيق
    INSERT INTO public.admin_activity_log (
        admin_id, action_type, target_type, target_id, details
    ) VALUES (
        p_admin_id, 
        'apply_data_scope', 
        'resource', 
        p_resource_code,
        jsonb_build_object(
            'base_query', p_base_query,
            'conditions', v_conditions,
            'final_query', v_final_query
        )
    );
    
    RETURN v_final_query;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- 6. دالة مساعدة لإدارة نطاقات البيانات مع تنسيق أفضل للشروط
-- ========================================================================

-- دالة لإنشاء نطاق بيانات مع دعم أنواع شروط متعددة
CREATE OR REPLACE FUNCTION create_data_scope_enhanced(
    p_name text,
    p_resource_code text,
    p_conditions jsonb[], -- مصفوفة من الشروط
    p_admin_id uuid DEFAULT NULL,
    p_role_id uuid DEFAULT NULL,
    p_group_id uuid DEFAULT NULL,
    p_created_by uuid DEFAULT NULL,
    p_description text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_resource_id uuid;
    v_scope_id uuid;
    v_condition jsonb;
    v_combined_condition jsonb;
    v_condition_array jsonb := '[]'::jsonb;
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
    
    -- تحويل مصفوفة الشروط إلى مصفوفة jsonb
    IF p_conditions IS NOT NULL THEN
        FOREACH v_condition IN ARRAY p_conditions
        LOOP
            -- التحقق من الشرط
            IF jsonb_typeof(v_condition) != 'object' OR 
               v_condition->>'field' IS NULL OR 
               v_condition->>'operator' IS NULL OR 
               v_condition->'value' IS NULL THEN
                RAISE EXCEPTION 'شرط غير صالح: %', v_condition;
            END IF;
            
            -- إضافة الشرط إلى المصفوفة
            v_condition_array := v_condition_array || v_condition;
        END LOOP;
    END IF;
    
    -- إنشاء الشرط المركب
    v_combined_condition := jsonb_build_object(
        'type', 'AND', -- يمكن تغييره لدعم OR أيضًا
        'conditions', v_condition_array
    );
    
    -- إنشاء نطاق البيانات
    INSERT INTO public.data_scopes (
        name, description, admin_id, role_id, group_id, 
        resource_id, condition, created_by
    ) VALUES (
        p_name, p_description, p_admin_id, p_role_id, p_group_id, 
        v_resource_id, v_combined_condition, p_created_by
    )
    RETURNING id INTO v_scope_id;
    
    -- تسجيل إنشاء النطاق
    INSERT INTO public.admin_activity_log (
        admin_id, action_type, target_type, target_id, details
    ) VALUES (
        COALESCE(p_created_by, p_admin_id), 
        'create_data_scope', 
        'resource', 
        p_resource_code,
        jsonb_build_object(
            'scope_name', p_name,
            'resource', p_resource_code,
            'conditions', v_combined_condition,
            'scope_id', v_scope_id
        )
    );
    
    RETURN v_scope_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- 7. أمثلة استخدام بعد التحسينات
-- ========================================================================

/*
-- مثال لاستخدام وظائف النظام المحسنة

-- 1. إضافة إعدادات مخصصة
UPDATE public.admin_system_settings
SET setting_value = '7'::jsonb
WHERE setting_key = 'max_hierarchy_depth';

-- 2. إنشاء نطاق بيانات مع شروط متعددة
SELECT create_data_scope_enhanced(
    'طلبات المنطقة الشمالية',
    'orders',
    ARRAY[
        '{"field": "region", "operator": "=", "value": "north"}'::jsonb,
        '{"field": "status", "operator": "IN", "value": ["pending", "processing"]}'::jsonb
    ],
    NULL, -- admin_id
    (SELECT id FROM public.roles WHERE name = 'manager'), -- role_id
    NULL, -- group_id
    (SELECT id FROM public.admins WHERE username = 'admin'), -- created_by
    'يقيد الوصول للطلبات في المنطقة الشمالية فقط'
);

-- 3. إنشاء استعلام ديناميكي مع نطاقات البيانات
DO $$
DECLARE
    admin_id uuid := (SELECT id FROM public.admins WHERE username = 'region_manager');
    base_query text := 'SELECT * FROM orders';
    final_query text;
BEGIN
    final_query := apply_data_scopes_enhanced(admin_id, 'orders', base_query);
    RAISE NOTICE 'الاستعلام النهائي: %', final_query;
END;
$$;

-- 4. منح تجاوز صلاحية لمسؤول
SELECT add_admin_permission_override(
    (SELECT id FROM public.admins WHERE username = 'support_agent'), -- المسؤول المستفيد
    'customers:view', -- رمز الصلاحية
    true, -- منح الصلاحية
    'منح مؤقت لدعم العميل خلال فترة الحملة', -- سبب المنح
    (SELECT id FROM public.admins WHERE username = 'admin'), -- المسؤول المانح
    NOW() + INTERVAL '7 days' -- تاريخ انتهاء الصلاحية
);
*/

-- ========================================================================
-- ملاحظات ختامية
-- ========================================================================
-- 1. يجب تنفيذ هذا الملف بعد تنفيذ الملفين admin-system-schema.sql و admin-system-enhancements.sql
-- 2. التحسينات الجديدة تضيف:
--    - تحسين أسماء الأعمدة وتوثيقها
--    - نظام إعدادات قابل للتكوين
--    - دعم أفضل لشروط نطاق البيانات المركبة
--    - تسجيل أكثر تفصيلاً للتغييرات والإجراءات
-- 3. لا تزال الدوال السابقة تعمل للحفاظ على التوافق الخلفي
-- 4. توصيات للتطوير المستقبلي:
--    - إضافة نظام ذاكرة تخزين مؤقت للصلاحيات لتحسين الأداء
--    - تطوير واجهة برمجية RESTful لإدارة الصلاحيات والنطاقات
--    - إضافة نظام تنبيهات للصلاحيات المنتهية أو القريبة من الانتهاء
--    - تطوير نظام سحب تقارير تفصيلية عن استخدام الصلاحيات والتجاوزات