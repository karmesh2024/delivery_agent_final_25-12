-- ========================================================================
-- إصلاحات لنظام إدارة المسؤولين والصلاحيات
-- ========================================================================

-- إصلاح دالة setup_permissions لحل مشكلة تعارض اسم العمود permission_id
CREATE OR REPLACE FUNCTION setup_permissions()
RETURNS void AS $$
DECLARE
    v_permission_id uuid;
    v_resource_id uuid;
    v_action_id uuid;
    v_role_id uuid;
    v_permission_rec record;
BEGIN
    -- التحقق من وجود المصادر والإجراءات والصلاحيات الأساسية
    INSERT INTO public.resources (code, name, description)
    VALUES 
        ('dashboard', 'لوحة التحكم', 'الصفحة الرئيسية ولوحة المعلومات'),
        ('admins', 'المسؤولون', 'إدارة المسؤولين والصلاحيات'),
        ('roles', 'الأدوار', 'إدارة أدوار المسؤولين'),
        ('settings', 'الإعدادات', 'إعدادات النظام'),
        ('agents', 'المندوبون', 'إدارة مندوبي التوصيل'),
        ('customers', 'العملاء', 'إدارة العملاء وبياناتهم'),
        ('orders', 'الطلبات', 'إدارة طلبات العملاء'),
        ('messages', 'الرسائل', 'إدارة المراسلات والإشعارات'),
        ('reports', 'التقارير', 'تقارير النظام وإحصائياته'),
        ('invoices', 'الفواتير', 'إدارة فواتير الطلبات')
    ON CONFLICT (code) DO NOTHING;

    INSERT INTO public.actions (code, name, description)
    VALUES 
        ('view', 'عرض', 'الوصول للعرض فقط'),
        ('create', 'إنشاء', 'إنشاء عنصر جديد'),
        ('update', 'تعديل', 'تعديل عنصر موجود'),
        ('delete', 'حذف', 'حذف عنصر'),
        ('approve', 'موافقة', 'الموافقة على إجراء'),
        ('reject', 'رفض', 'رفض إجراء'),
        ('assign', 'تعيين', 'تعيين مهمة لمستخدم'),
        ('export', 'تصدير', 'تصدير البيانات'),
        ('import', 'استيراد', 'استيراد البيانات'),
        ('manage', 'إدارة كاملة', 'صلاحيات كاملة للإدارة')
    ON CONFLICT (code) DO NOTHING;

    -- إنشاء الصلاحيات لكل مورد وإجراء
    FOR v_resource_id IN SELECT id FROM public.resources LOOP
        FOR v_action_id IN SELECT id FROM public.actions LOOP
            -- الحصول على رموز المورد والإجراء
            WITH resource_action AS (
                SELECT 
                    r.code AS resource_code, 
                    a.code AS action_code,
                    r.name AS resource_name,
                    a.name AS action_name
                FROM 
                    public.resources r, 
                    public.actions a
                WHERE 
                    r.id = v_resource_id AND 
                    a.id = v_action_id
            )
            INSERT INTO public.permissions (
                resource_id, action_id, code, name, description
            )
            SELECT 
                v_resource_id, 
                v_action_id, 
                resource_code || ':' || action_code, 
                resource_name || ' - ' || action_name,
                'صلاحية ' || action_name || ' ' || resource_name
            FROM resource_action
            ON CONFLICT (resource_id, action_id) DO NOTHING
            RETURNING id INTO v_permission_id;
            
            -- إذا تم إنشاء صلاحية جديدة، أضفها للدور super_admin
            IF v_permission_id IS NOT NULL THEN
                -- الحصول على معرف دور super_admin
                SELECT id INTO v_role_id FROM public.roles WHERE code = 'super_admin';
                
                -- إضافة الصلاحية لدور super_admin
                IF v_role_id IS NOT NULL THEN
                    INSERT INTO public.role_permissions (role_id, permission_id)
                    VALUES (v_role_id, v_permission_id)
                    ON CONFLICT (role_id, permission_id) DO NOTHING;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
    
    -- تعيين صلاحيات محددة لكل دور
    -- 1. أولاً، استرجاع الصلاحيات ودور super_admin
    SELECT id INTO v_role_id FROM public.roles WHERE code = 'super_admin';
    
    -- 2. منح جميع الصلاحيات لدور super_admin
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_role_id, id FROM public.permissions
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- 3. استرجاع دور admin ومنحه صلاحيات محددة
    SELECT id INTO v_role_id FROM public.roles WHERE code = 'admin';
    IF v_role_id IS NOT NULL THEN
        -- منح صلاحيات محددة لدور admin (كمثال)
        FOR v_permission_rec IN 
            SELECT id FROM public.permissions 
            WHERE code IN (
                'dashboard:view', 'orders:view', 'orders:update',
                'agents:view', 'customers:view', 'reports:view'
            )
        LOOP
            INSERT INTO public.role_permissions (role_id, permission_id)
            VALUES (v_role_id, v_permission_rec.id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
    END IF;
    
    -- 4. استرجاع دور manager ومنحه صلاحيات محددة
    SELECT id INTO v_role_id FROM public.roles WHERE code = 'manager';
    IF v_role_id IS NOT NULL THEN
        -- منح صلاحيات محددة لدور manager (كمثال)
        FOR v_permission_rec IN 
            SELECT id FROM public.permissions 
            WHERE code IN (
                'dashboard:view', 'orders:view', 'orders:create', 'orders:update',
                'agents:view', 'agents:update', 'customers:view', 'reports:view'
            )
        LOOP
            INSERT INTO public.role_permissions (role_id, permission_id)
            VALUES (v_role_id, v_permission_rec.id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
    END IF;

    -- 5. استرجاع دور viewer ومنحه صلاحيات العرض فقط
    SELECT id INTO v_role_id FROM public.roles WHERE code = 'viewer';
    IF v_role_id IS NOT NULL THEN
        -- منح صلاحيات العرض فقط لدور viewer
        FOR v_permission_rec IN 
            SELECT id FROM public.permissions WHERE code LIKE '%:view'
        LOOP
            INSERT INTO public.role_permissions (role_id, permission_id)
            VALUES (v_role_id, v_permission_rec.id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- إصلاح دالة apply_data_scopes للتعامل بشكل أفضل مع الأخطاء
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
    v_resource_id uuid;
BEGIN
    -- التحقق من وجود المورد أولاً
    SELECT id INTO v_resource_id FROM public.resources WHERE code = p_resource_code;
    IF v_resource_id IS NULL THEN
        RAISE WARNING 'المورد غير موجود: %', p_resource_code;
        RETURN p_base_query;
    END IF;
    
    -- التحقق من وجود المسؤول
    IF p_admin_id IS NULL THEN
        RAISE WARNING 'معرف المسؤول غير محدد';
        RETURN p_base_query;
    END IF;
    
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
        WHERE ds.resource_id = v_resource_id
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
        IF p_base_query ~* '\sWHERE\s' THEN
            RETURN p_base_query || ' AND (' || v_conditions || ')';
        ELSE
            RETURN p_base_query || ' WHERE ' || v_conditions;
        END IF;
    ELSE
        -- إعادة الاستعلام الأساسي كما هو إذا لم توجد شروط
        RETURN p_base_query;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'خطأ في تطبيق نطاقات البيانات: %', SQLERRM;
        RETURN p_base_query;
END;
$$ LANGUAGE plpgsql;

-- إضافة تعليقات توضيحية لحقول جدول المسؤولين
COMMENT ON COLUMN public.admins.id IS 'المعرف الفريد للمسؤول';
COMMENT ON COLUMN public.admins.user_id IS 'المعرف المرتبط بجدول المستخدمين في Supabase Auth';
COMMENT ON COLUMN public.admins.email IS 'البريد الإلكتروني للمسؤول';
COMMENT ON COLUMN public.admins.username IS 'اسم المستخدم للمسؤول';
COMMENT ON COLUMN public.admins.full_name IS 'الاسم الكامل للمسؤول';
COMMENT ON COLUMN public.admins.is_active IS 'حالة المسؤول (نشط/غير نشط)';
COMMENT ON COLUMN public.admins.role_id IS 'معرف دور المسؤول';
COMMENT ON COLUMN public.admins.department_id IS 'معرف القسم الذي ينتمي إليه المسؤول';
COMMENT ON COLUMN public.admins.manager_id IS 'معرف المدير المباشر للمسؤول';
COMMENT ON COLUMN public.admins.phone IS 'رقم هاتف المسؤول';
COMMENT ON COLUMN public.admins.profile_image_url IS 'رابط صورة الملف الشخصي';
COMMENT ON COLUMN public.admins.permissions IS 'صلاحيات إضافية خاصة بالمسؤول (تستخدم فقط للتجاوزات)';
COMMENT ON COLUMN public.admins.created_at IS 'تاريخ إنشاء حساب المسؤول';
COMMENT ON COLUMN public.admins.updated_at IS 'تاريخ آخر تحديث لبيانات المسؤول';

-- إضافة دالة تطبيق نطاقات البيانات مع التعامل مع الشروط المتقدمة
CREATE OR REPLACE FUNCTION apply_complex_data_scopes(
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
    v_condition_json jsonb;
    v_condition_type text;
    v_subconditions jsonb;
    v_subcondition jsonb;
    v_subcondition_sql text;
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
        -- التعامل مع الشروط المركبة
        v_condition_json := v_data_scope.condition;
        
        -- التحقق من نوع الشرط (بسيط أو مركب)
        IF v_condition_json ? 'type' AND v_condition_json ? 'conditions' THEN
            -- شرط مركب
            v_condition_type := v_condition_json->>'type';
            v_subconditions := v_condition_json->'conditions';
            
            v_subcondition_sql := '(';
            
            -- معالجة كل شرط فرعي
            FOR i IN 0..jsonb_array_length(v_subconditions)-1 LOOP
                v_subcondition := v_subconditions->i;
                
                IF i > 0 THEN
                    -- إضافة رابط منطقي حسب نوع الشرط
                    IF v_condition_type = 'AND' THEN
                        v_subcondition_sql := v_subcondition_sql || ' AND ';
                    ELSIF v_condition_type = 'OR' THEN
                        v_subcondition_sql := v_subcondition_sql || ' OR ';
                    END IF;
                END IF;
                
                -- تكوين الشرط الفرعي
                v_subcondition_sql := v_subcondition_sql || format(
                    '%I %s %L',
                    (v_subcondition->>'field'),
                    (v_subcondition->>'operator'),
                    (v_subcondition->>'value')
                );
            END LOOP;
            
            v_subcondition_sql := v_subcondition_sql || ')';
            
            -- إضافة الشرط المركب إلى قائمة الشروط
            IF v_conditions != '' THEN
                v_conditions := v_conditions || ' AND ';
            END IF;
            
            v_conditions := v_conditions || v_subcondition_sql;
        ELSE
            -- شرط بسيط
            IF v_conditions != '' THEN
                v_conditions := v_conditions || ' AND ';
            END IF;
            
            v_conditions := v_conditions || format(
                '%I %s %L',
                (v_condition_json->>'field'),
                (v_condition_json->>'operator'),
                (v_condition_json->>'value')
            );
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
    
    -- تسجيل الاستعلام المولّد للتدقيق (اختياري)
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
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'خطأ في تطبيق نطاقات البيانات المركبة: %', SQLERRM;
        RETURN p_base_query;
END;
$$ LANGUAGE plpgsql;

-- إضافة فهارس إضافية لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_permissions_code ON public.permissions(code);
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_username ON public.admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON public.admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action_type ON public.admin_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON public.admin_activity_log(created_at);