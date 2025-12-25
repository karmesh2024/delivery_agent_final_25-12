-- دالة للتحقق من صلاحيات المسؤول مع نطاق محدد (منفذة مباشرة في Supabase)
-- هذا الملف للتوثيق فقط، حيث تم تنفيذ الدالة مباشرة في قاعدة البيانات

CREATE OR REPLACE FUNCTION check_permission_with_scope(
  p_admin_id uuid,
  p_permission_code text,
  p_scope_type text,
  p_scope_value jsonb
)
RETURNS boolean AS $$
DECLARE
  has_permission boolean;
  has_scope_permission boolean;
  permissions jsonb;
  role_permissions jsonb;
  role_id uuid;
BEGIN
  -- 1. جلب معلومات المسؤول
  SELECT a.permissions, a.role_id INTO permissions, role_id
  FROM admins a WHERE a.id = p_admin_id;

  IF permissions IS NULL AND role_id IS NULL THEN
    RETURN false;
  END IF;

  -- 2. التحقق من الصلاحية العامة
  SELECT check_admin_permission_enhanced(p_admin_id, p_permission_code) INTO has_permission;
  
  IF NOT has_permission THEN
    RETURN false;
  END IF;

  -- 3. التحقق من الصلاحية بالنطاق
  -- في البداية، تحقق من الصلاحيات الخاصة بالمسؤول
  IF permissions IS NOT NULL AND 
     permissions ? 'scoped_permissions' AND
     permissions->'scoped_permissions' ? p_scope_type AND
     (permissions->'scoped_permissions'->p_scope_type)::jsonb ? p_permission_code THEN
    
    -- تحقق من قيمة النطاق
    DECLARE
      scope_values jsonb;
    BEGIN
      scope_values := (permissions->'scoped_permissions'->p_scope_type->p_permission_code);
      
      -- إذا كانت قيمة النطاق تحتوي على '*' فهذا يعني أن لديه صلاحية على جميع النطاقات
      IF scope_values ? '*' OR scope_values @> p_scope_value THEN
        RETURN true;
      END IF;
    END;
  END IF;

  -- تحقق من صلاحيات الدور إذا لم تكن الصلاحية موجودة في صلاحيات المسؤول المخصصة
  IF role_id IS NOT NULL THEN
    SELECT permissions INTO role_permissions
    FROM roles r WHERE r.id = role_id;
    
    IF role_permissions IS NOT NULL AND 
       role_permissions ? 'scoped_permissions' AND
       role_permissions->'scoped_permissions' ? p_scope_type AND
       (role_permissions->'scoped_permissions'->p_scope_type)::jsonb ? p_permission_code THEN
      
      DECLARE
        scope_values jsonb;
      BEGIN
        scope_values := (role_permissions->'scoped_permissions'->p_scope_type->p_permission_code);
        
        IF scope_values ? '*' OR scope_values @> p_scope_value THEN
          RETURN true;
        END IF;
      END;
    END IF;
  END IF;

  -- إذا وصلنا إلى هنا، فلا توجد صلاحية بالنطاق المطلوب
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- مثال على استخدام الدالة
/*
-- التحقق من صلاحية مسؤول لعرض طلب محدد
SELECT check_permission_with_scope(
  '00000000-0000-0000-0000-000000000001', -- معرف المسؤول
  'orders:view',                           -- رمز الصلاحية
  'order',                                 -- نوع النطاق
  '{"id": "12345"}'::jsonb                -- قيمة النطاق (معرف الطلب)
);
*/

-- شرح لكيفية تعريف صلاحيات النطاق في جدول المسؤولين
/*
إضافة صلاحيات نطاق لمسؤول:

UPDATE admins
SET permissions = jsonb_set(
  permissions, 
  '{scoped_permissions}', 
  jsonb_build_object(
    'order', jsonb_build_object(
      'orders:view', jsonb_build_array('12345', '67890'),
      'orders:edit', jsonb_build_array('12345')
    )
  )
)
WHERE id = '00000000-0000-0000-0000-000000000001';
*/