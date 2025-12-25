-- إجراء مخصص للتحقق من البريد الإلكتروني والإدخال التلقائي للمسؤولين
CREATE OR REPLACE FUNCTION public.process_new_admin_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id uuid;
  role_exists boolean;
  admins_table_exists boolean;
BEGIN
  -- التحقق من وجود جدول roles
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'roles'
  ) INTO role_exists;
  
  -- التحقق من وجود جدول admins
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admins'
  ) INTO admins_table_exists;
  
  -- التعامل مع حالة عدم وجود أحد الجداول المطلوبة
  IF NOT admins_table_exists THEN
    RETURN NEW; -- المستخدم تم إنشاؤه في auth.users لكن لا يوجد جدول admins
  END IF;
  
  -- الحصول على المعرف الافتراضي للدور (إذا كان موجوداً)
  IF role_exists THEN
    BEGIN
      SELECT id INTO default_role_id FROM public.roles WHERE code = 'viewer' LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      default_role_id := NULL; -- في حالة حدوث أي خطأ
    END;
  END IF;
  
  -- إنشاء قاموس من القيم للإدراج، تجنباً للخطأ في هيكل الجدول
  BEGIN
    -- إدراج المستخدم في جدول المسؤولين باستخدام القيم المتاحة فقط
    INSERT INTO public.admins (
      user_id,
      email,
      username,
      full_name,
      is_active,
      role_id
    ) VALUES (
      NEW.id,
      NEW.email,
      SPLIT_PART(NEW.email, '@', 1), -- استخدام جزء من البريد الإلكتروني كاسم مستخدم افتراضي
      NEW.raw_user_meta_data->>'full_name', -- استخدام الاسم من البيانات الوصفية إن وجد
      true, -- نشط افتراضيًا
      default_role_id
    );
  EXCEPTION
    WHEN undefined_column THEN
      -- في حالة وجود اختلاف في أعمدة جدول المسؤولين، نستخدم نموذجًا أبسط
      BEGIN
        INSERT INTO public.admins (
          user_id,
          email,
          is_active
        ) VALUES (
          NEW.id,
          NEW.email,
          true
        );
      EXCEPTION WHEN OTHERS THEN
        -- في حالة استمرار الخطأ، نعود فقط بالمستخدم الجديد
        NULL;
      END;
  END;
  
  -- تحديث الدعوة إن وجدت (اختياري) - تم تعليقه لتبسيط المحفز
  -- UPDATE public.admin_invitations 
  -- SET is_used = true, used_at = now()
  -- WHERE email = NEW.email AND is_used = false;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- في حالة حدوث أي خطأ، نعود بالمستخدم الجديد دون إجراء أي تعديلات
    -- هذا يسمح باستمرار عملية إنشاء المستخدم في Supabase حتى لو فشلت عملية الإضافة إلى جدول admins
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء المحفز لتشغيل الإجراء عند إنشاء مستخدم جديد
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.process_new_admin_user();

-- إجراء إضافي لتحديث بيانات المسؤول عند تحديث المستخدم (اختياري)
CREATE OR REPLACE FUNCTION public.update_admin_on_user_change()
RETURNS TRIGGER AS $$
DECLARE
  admins_table_exists boolean;
BEGIN
  -- التحقق من وجود جدول admins
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admins'
  ) INTO admins_table_exists;
  
  -- التعامل مع حالة عدم وجود جدول admins
  IF NOT admins_table_exists THEN
    RETURN NEW;
  END IF;

  -- تحديث بيانات المسؤول عند تغيير بيانات المستخدم
  BEGIN
    UPDATE public.admins
    SET 
      email = NEW.email,
      updated_at = now()
    WHERE user_id = NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      -- في حالة حدوث أي خطأ، نتجاهله ونعود بالمستخدم المحدث
      NULL;
  END;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- في حالة حدوث أي خطأ، نعود بالمستخدم المحدث دون إجراء أي تعديلات
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء المحفز لتشغيل الإجراء عند تحديث مستخدم
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.update_admin_on_user_change();

-- جدول دعوات المسؤولين (اختياري)
CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  email text NOT NULL,
  role_id uuid REFERENCES public.roles(id),
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  invited_by uuid REFERENCES public.admins(id),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT admin_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT admin_invitations_email_key UNIQUE (email),
  CONSTRAINT admin_invitations_token_key UNIQUE (token)
);

-- فهرس على حالة الاستخدام وتاريخ الانتهاء
CREATE INDEX IF NOT EXISTS idx_admin_invitations_status ON public.admin_invitations(is_used, expires_at);