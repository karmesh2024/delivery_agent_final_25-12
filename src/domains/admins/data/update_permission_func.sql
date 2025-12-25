-- دالة لتحديث صلاحية موجودة مع التحقق من صلاحيات المستخدم
CREATE OR REPLACE FUNCTION update_permission(
    p_requesting_user_id UUID,       -- معرف المستخدم الذي يطلب التحديث
    p_permission_id UUID,            -- معرف الصلاحية المراد تحديثها
    p_code TEXT DEFAULT NULL,        -- رمز الصلاحية الجديد (اختياري)
    p_description TEXT DEFAULT NULL, -- وصف الصلاحية الجديد (اختياري)
    p_resource_id UUID DEFAULT NULL, -- معرف المورد الجديد (اختياري)
    p_action_id UUID DEFAULT NULL    -- معرف الإجراء الجديد (اختياري)
)
RETURNS SETOF permissions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_id UUID;
    has_permission BOOLEAN;
    updated_permission permissions;
BEGIN
    -- الحصول على admin_id من user_id
    SELECT id INTO admin_id
    FROM admins
    WHERE user_id = p_requesting_user_id;
    
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'لا يمكن العثور على حساب مسؤول للمستخدم المحدد';
    END IF;
    
    -- التحقق من وجود صلاحية 'roles:manage' لدى المستخدم
    SELECT check_admin_permission_enhanced(admin_id, 'roles:manage') INTO has_permission;
    
    IF NOT has_permission THEN
        RAISE EXCEPTION 'ليس لديك صلاحية لتعديل الصلاحيات';
    END IF;
    
    -- التحقق من وجود الصلاحية المراد تحديثها
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE id = p_permission_id) THEN
        RAISE EXCEPTION 'الصلاحية المحددة غير موجودة';
    END IF;
    
    -- تحديث الصلاحية
    UPDATE permissions
    SET 
        code = COALESCE(p_code, code),
        description = COALESCE(p_description, description),
        resource_id = COALESCE(p_resource_id, resource_id),
        action_id = COALESCE(p_action_id, action_id),
        updated_at = NOW()
    WHERE id = p_permission_id
    RETURNING * INTO updated_permission;
    
    RETURN NEXT updated_permission;
END;
$$;

-- إضافة تعليق للدالة
COMMENT ON FUNCTION update_permission(UUID, UUID, TEXT, TEXT, UUID, UUID) IS 'تحديث صلاحية موجودة مع التحقق من صلاحيات المستخدم'; 