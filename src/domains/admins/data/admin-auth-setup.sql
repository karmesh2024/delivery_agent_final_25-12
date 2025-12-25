-- إعداد نظام المصادقة والصلاحيات للمسؤولين (متوافق مع الهيكل الحالي)

-- التأكد من وجود إضافة uuid_generate_v4
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- دالة تحديث تاريخ التعديل
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- محفز لإضافة المستخدمين الجدد إلى جدول المسؤولين تلقائياً
CREATE OR REPLACE FUNCTION public.process_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- محاولة الحصول على معرف الدور الافتراضي
  BEGIN
    SELECT id INTO default_role_id FROM public.roles WHERE code = 'viewer' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    default_role_id := NULL;
  END;
  
  -- إدراج المستخدم في جدول المسؤولين
  INSERT INTO public.admins (
    user_id,
    email,
    username,
    full_name,
    role_id,
    is_active,
    permissions
  ) VALUES (
    NEW.id,
    NEW.email,
    SPLIT_PART(NEW.email, '@', 1), -- استخدام جزء من البريد الإلكتروني كاسم مستخدم افتراضي
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'), -- استخدام الاسم من البيانات الوصفية إن وجد
    default_role_id,
    true,
    jsonb_build_object(
      'dashboard:view', true,
      'orders:view', true
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- في حالة حدوث أي خطأ، نعود بالمستخدم الجديد دون إثارة استثناء
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء المحفز لتشغيل الإجراء عند إنشاء مستخدم جديد
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.process_auth_user_created();

-- محفز لتحديث بيانات المسؤول عند تحديث بيانات المستخدم
CREATE OR REPLACE FUNCTION public.process_auth_user_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث بيانات المسؤول عند تغيير بيانات المستخدم
  UPDATE public.admins
  SET 
    email = NEW.email,
    updated_at = NOW()
  WHERE user_id = NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- في حالة حدوث أي خطأ، نعود بالمستخدم المحدث دون إثارة استثناء
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء المحفز لتشغيل الإجراء عند تحديث مستخدم
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.process_auth_user_updated();

-- إنشاء دالة للتحقق من صلاحية مستخدم مع نطاق محدد
CREATE OR REPLACE FUNCTION public.check_admin_permission_with_scope(
  p_admin_id uuid,
  p_permission_code text,
  p_scope_type text,
  p_scope_value text
)
RETURNS boolean AS $$
DECLARE
  v_permissions jsonb;
  v_scope_permissions jsonb;
  v_scope_values jsonb;
BEGIN
  -- جلب صلاحيات المسؤول
  SELECT permissions INTO v_permissions
  FROM public.admins
  WHERE id = p_admin_id AND is_active = true;
  
  -- التحقق من وجود الصلاحيات
  IF v_permissions IS NULL THEN
    RETURN false;
  END IF;
  
  -- التحقق مما إذا كان المسؤول لديه صلاحية عامة بهذا الرمز
  IF (v_permissions ->> p_permission_code)::boolean = true THEN
    RETURN true;
  END IF;
  
  -- التحقق من صلاحيات النطاق
  v_scope_permissions = v_permissions -> 'scoped_permissions';
  IF v_scope_permissions IS NULL THEN
    RETURN false;
  END IF;
  
  -- التحقق من نوع النطاق
  v_scope_values = v_scope_permissions -> p_scope_type -> p_permission_code;
  IF v_scope_values IS NULL THEN
    RETURN false;
  END IF;
  
  -- التحقق من وجود قيمة النطاق في المصفوفة
  RETURN jsonb_exists(v_scope_values, p_scope_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تعليقات توضيحية
COMMENT ON FUNCTION public.update_updated_at_column() IS 'دالة تحديث تاريخ التعديل للجداول';
COMMENT ON FUNCTION public.process_auth_user_created() IS 'إضافة المستخدمين الجدد إلى جدول المسؤولين تلقائياً';
COMMENT ON FUNCTION public.process_auth_user_updated() IS 'تحديث بيانات المسؤول عند تحديث بيانات المستخدم';
COMMENT ON FUNCTION public.check_admin_permission_with_scope(uuid, text, text, text) IS 'التحقق من صلاحية مسؤول مع نطاق محدد';