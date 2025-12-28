-- نظام المحافظات والمناطق والصلاحيات المؤقتة والموافقات - مصر
-- هذا الملف يحتوي على النظام الكامل للمحافظات والصلاحيات المؤقتة
-- يتكامل مع النظام الإداري الموجود

-- 1. إنشاء جدول المحافظات (يتكامل مع جدول regions الموجود)
CREATE TABLE IF NOT EXISTS public.provinces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  code TEXT UNIQUE NOT NULL,
  country_code TEXT DEFAULT 'EG',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ربط المحافظات مع جدول regions الموجود
ALTER TABLE public.regions ADD COLUMN IF NOT EXISTS province_id UUID REFERENCES public.provinces(id);

-- 2. تحديث جدول المناطق الموجود ليتكامل مع المحافظات
-- (جدول regions موجود بالفعل، سنضيف الحقول المطلوبة فقط)
ALTER TABLE public.regions ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE public.regions ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.regions ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.regions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.regions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- إنشاء فهرس فريد للمناطق داخل كل محافظة
CREATE UNIQUE INDEX IF NOT EXISTS idx_regions_province_code ON public.regions(province_id, code) WHERE province_id IS NOT NULL;

-- 3. إنشاء جدول المدن (محدث ليتوافق مع نوع بيانات regions)
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id INTEGER REFERENCES public.regions(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(region_id, code)
);

-- 4. إنشاء جدول الصلاحيات المؤقتة (يتكامل مع نظام الصلاحيات الموجود)
CREATE TABLE IF NOT EXISTS public.temporary_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  scope_type TEXT CHECK (scope_type IN ('province', 'region', 'city', 'warehouse', 'global')) NOT NULL,
  scope_id UUID, -- ID of province, region, city, or warehouse
  granted_by UUID REFERENCES public.admins(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. إنشاء جدول طلبات الصلاحيات المؤقتة
CREATE TABLE IF NOT EXISTS public.permission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  scope_type TEXT CHECK (scope_type IN ('province', 'region', 'city', 'warehouse', 'global')) NOT NULL,
  scope_id UUID,
  reason TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'expired')) DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. إنشاء جدول الموافقات
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.permission_requests(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES public.admins(id),
  level INTEGER NOT NULL, -- مستوى الموافقة (1, 2, 3, etc.)
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  comments TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. إنشاء جدول سير العمل للموافقات (محدث ليتوافق مع هيكل permissions)
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  scope_type TEXT CHECK (scope_type IN ('province', 'region', 'city', 'global')) NOT NULL,
  level INTEGER NOT NULL,
  approver_role_id UUID REFERENCES public.roles(id),
  approver_admin_id UUID REFERENCES public.admins(id),
  is_required BOOLEAN DEFAULT true,
  auto_approve_after_hours INTEGER, -- موافقة تلقائية بعد ساعات
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. إنشاء جدول سجل الأنشطة
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admins(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'permission', 'approval', 'request'
  entity_id UUID NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. إنشاء جدول الإشعارات المتقدمة
CREATE TABLE IF NOT EXISTS public.advanced_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('permission_request', 'approval_needed', 'permission_granted', 'permission_expired', 'approval_approved', 'approval_rejected')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_provinces_code ON public.provinces(code);
CREATE INDEX IF NOT EXISTS idx_provinces_active ON public.provinces(is_active);
CREATE INDEX IF NOT EXISTS idx_regions_province ON public.regions(province_id);
CREATE INDEX IF NOT EXISTS idx_regions_code ON public.regions(province_id, code);
CREATE INDEX IF NOT EXISTS idx_cities_region ON public.cities(region_id);
CREATE INDEX IF NOT EXISTS idx_cities_code ON public.cities(region_id, code);
CREATE INDEX IF NOT EXISTS idx_temporary_permissions_admin ON public.temporary_permissions(admin_id);
CREATE INDEX IF NOT EXISTS idx_temporary_permissions_expires ON public.temporary_permissions(expires_at);
CREATE INDEX IF NOT EXISTS idx_permission_requests_requester ON public.permission_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_permission_requests_status ON public.permission_requests(status);
CREATE INDEX IF NOT EXISTS idx_approvals_request ON public.approvals(request_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON public.approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_permission ON public.approval_workflows(permission_id, scope_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin ON public.activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_advanced_notifications_recipient ON public.advanced_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_advanced_notifications_type ON public.advanced_notifications(type);
CREATE INDEX IF NOT EXISTS idx_advanced_notifications_read ON public.advanced_notifications(is_read);

-- إنشاء RLS Policies
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advanced_notifications ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمحافظات (محدثة)
CREATE POLICY "provinces_select" ON public.provinces FOR SELECT USING (true);
CREATE POLICY "provinces_insert" ON public.provinces FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "provinces_update" ON public.provinces FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "provinces_delete" ON public.provinces FOR DELETE USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);

-- سياسات الأمان للمناطق (محدثة)
CREATE POLICY "regions_select" ON public.regions FOR SELECT USING (true);
CREATE POLICY "regions_insert" ON public.regions FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "regions_update" ON public.regions FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "regions_delete" ON public.regions FOR DELETE USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);

-- سياسات الأمان للمدن (محدثة)
CREATE POLICY "cities_select" ON public.cities FOR SELECT USING (true);
CREATE POLICY "cities_insert" ON public.cities FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "cities_update" ON public.cities FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "cities_delete" ON public.cities FOR DELETE USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);

-- سياسات الأمان للصلاحيات المؤقتة (محدثة)
CREATE POLICY "temporary_permissions_select" ON public.temporary_permissions FOR SELECT USING (
  auth.uid() = admin_id OR 
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "temporary_permissions_insert" ON public.temporary_permissions FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "temporary_permissions_update" ON public.temporary_permissions FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "temporary_permissions_delete" ON public.temporary_permissions FOR DELETE USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);

-- سياسات الأمان لطلبات الصلاحيات (محدثة)
CREATE POLICY "permission_requests_select" ON public.permission_requests FOR SELECT USING (
  auth.uid() = requester_id OR 
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "permission_requests_insert" ON public.permission_requests FOR INSERT WITH CHECK (
  auth.uid() = requester_id OR 
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "permission_requests_update" ON public.permission_requests FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "permission_requests_delete" ON public.permission_requests FOR DELETE USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);

-- سياسات الأمان للموافقات (محدثة)
CREATE POLICY "approvals_select" ON public.approvals FOR SELECT USING (
  auth.uid() = approver_id OR 
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "approvals_insert" ON public.approvals FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "approvals_update" ON public.approvals FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "approvals_delete" ON public.approvals FOR DELETE USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);

-- سياسات الأمان لسير العمل (محدثة)
CREATE POLICY "approval_workflows_select" ON public.approval_workflows FOR SELECT USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "approval_workflows_insert" ON public.approval_workflows FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true AND role_id IN (
    SELECT id FROM public.roles WHERE level >= 5
  ))
);
CREATE POLICY "approval_workflows_update" ON public.approval_workflows FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true AND role_id IN (
    SELECT id FROM public.roles WHERE level >= 5
  ))
);
CREATE POLICY "approval_workflows_delete" ON public.approval_workflows FOR DELETE USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true AND role_id IN (
    SELECT id FROM public.roles WHERE level >= 5
  ))
);

-- سياسات الأمان لسجل الأنشطة (محدثة)
CREATE POLICY "activity_logs_select" ON public.activity_logs FOR SELECT USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "activity_logs_insert" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- سياسات الأمان للإشعارات (محدثة)
CREATE POLICY "advanced_notifications_select" ON public.advanced_notifications FOR SELECT USING (
  auth.uid() = recipient_id
);
CREATE POLICY "advanced_notifications_insert" ON public.advanced_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "advanced_notifications_update" ON public.advanced_notifications FOR UPDATE USING (
  auth.uid() = recipient_id
);

-- إنشاء الدوال المساعدة
CREATE OR REPLACE FUNCTION public.get_admin_permissions(admin_id UUID)
RETURNS TABLE (
  permission_id UUID,
  permission_code TEXT,
  scope_type TEXT,
  scope_id UUID,
  is_temporary BOOLEAN,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  -- الصلاحيات الدائمة من الأدوار
  SELECT 
    p.id as permission_id,
    p.code as permission_code,
    'global' as scope_type,
    NULL::UUID as scope_id,
    false as is_temporary,
    NULL::TIMESTAMPTZ as expires_at
  FROM public.permissions p
  JOIN public.admins a ON a.id = admin_id
  WHERE a.is_active = true
    AND EXISTS (
      SELECT 1 FROM public.group_permissions gp
      WHERE gp.permission_id = p.id
      AND gp.group_id IN (
        SELECT ag.group_id FROM public.admin_group_members ag
        WHERE ag.admin_id = admin_id
      )
    )
  
  UNION ALL
  
  -- الصلاحيات المؤقتة
  SELECT 
    p.id as permission_id,
    p.code as permission_code,
    tp.scope_type,
    tp.scope_id,
    true as is_temporary,
    tp.expires_at
  FROM public.temporary_permissions tp
  JOIN public.permissions p ON tp.permission_id = p.id
  WHERE tp.admin_id = admin_id 
    AND tp.is_active = true 
    AND tp.expires_at > now();
END;
$$ LANGUAGE plpgsql;

-- دالة للتحقق من الصلاحية (محدثة ليتوافق مع هيكل النظام)
CREATE OR REPLACE FUNCTION public.check_permission(
  admin_id UUID,
  permission_code TEXT,
  scope_type TEXT DEFAULT 'global',
  scope_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN := false;
BEGIN
  -- التحقق من الصلاحيات الدائمة
  SELECT EXISTS(
    SELECT 1 FROM public.permissions p
    JOIN public.admins a ON a.id = admin_id
    WHERE a.is_active = true
      AND p.code = permission_code
      AND EXISTS (
        SELECT 1 FROM public.group_permissions gp
        WHERE gp.permission_id = p.id
        AND gp.group_id IN (
          SELECT ag.group_id FROM public.admin_group_members ag
          WHERE ag.admin_id = admin_id
        )
      )
  ) INTO has_permission;
  
  IF has_permission THEN
    RETURN true;
  END IF;
  
  -- التحقق من الصلاحيات المؤقتة
  SELECT EXISTS(
    SELECT 1 FROM public.temporary_permissions tp
    JOIN public.permissions p ON tp.permission_id = p.id
    WHERE tp.admin_id = admin_id 
      AND p.code = permission_code
      AND tp.scope_type = scope_type
      AND (tp.scope_id = scope_id OR tp.scope_id IS NULL)
      AND tp.is_active = true 
      AND tp.expires_at > now()
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- دالة لإنشاء طلب صلاحية
CREATE OR REPLACE FUNCTION public.create_permission_request(
  requester_id UUID,
  permission_id UUID,
  scope_type TEXT,
  scope_id UUID,
  reason TEXT,
  priority TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
  request_id UUID;
  workflow_levels INTEGER[];
  level INTEGER;
  approver_id UUID;
  permission_code TEXT;
BEGIN
  -- الحصول على كود الصلاحية
  SELECT code INTO permission_code FROM public.permissions WHERE id = permission_id;
  
  -- إنشاء الطلب
  INSERT INTO public.permission_requests (
    requester_id, permission_id, scope_type, scope_id, reason, priority
  ) VALUES (
    requester_id, permission_id, scope_type, scope_id, reason, priority
  ) RETURNING id INTO request_id;
  
  -- الحصول على مستويات الموافقة المطلوبة
  SELECT ARRAY_AGG(aw.level ORDER BY aw.level) INTO workflow_levels
  FROM public.approval_workflows aw
  WHERE aw.permission_id = create_permission_request.permission_id
    AND aw.scope_type = create_permission_request.scope_type;
  
  -- إنشاء سجلات الموافقة لكل مستوى
  FOREACH level IN ARRAY workflow_levels
  LOOP
    -- البحث عن الموافق المناسب
    SELECT aw.approver_admin_id INTO approver_id
    FROM public.approval_workflows aw
    WHERE aw.permission_id = create_permission_request.permission_id
      AND aw.scope_type = create_permission_request.scope_type
      AND aw.level = level
      AND aw.is_required = true
    LIMIT 1;
    
    -- إنشاء سجل الموافقة
    INSERT INTO public.approvals (request_id, approver_id, level)
    VALUES (request_id, approver_id, level);
    
    -- إرسال إشعار للموافق
    INSERT INTO public.advanced_notifications (
      recipient_id, type, title, message, priority
    ) VALUES (
      approver_id,
      'approval_needed',
      'طلب موافقة جديد',
      'لديك طلب موافقة جديد يتطلب مراجعتك',
      priority
    );
  END LOOP;
  
  RETURN request_id;
END;
$$ LANGUAGE plpgsql;

-- دالة للموافقة على الطلب
CREATE OR REPLACE FUNCTION public.approve_request(
  request_id UUID,
  approver_id UUID,
  comments TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  approval_id UUID;
  all_approved BOOLEAN := false;
  requester_id UUID;
  permission_id UUID;
  scope_type TEXT;
  scope_id UUID;
  expires_at TIMESTAMPTZ;
BEGIN
  -- تحديث الموافقة
  UPDATE public.approvals
  SET status = 'approved', comments = comments, approved_at = now()
  WHERE request_id = approve_request.request_id 
    AND approver_id = approve_request.approver_id
    AND status = 'pending'
  RETURNING id INTO approval_id;
  
  IF approval_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- التحقق من أن جميع الموافقات مكتملة
  SELECT NOT EXISTS(
    SELECT 1 FROM public.approvals
    WHERE request_id = approve_request.request_id
      AND status = 'pending'
  ) INTO all_approved;
  
  IF all_approved THEN
    -- الحصول على تفاصيل الطلب
    SELECT pr.requester_id, pr.permission_id, pr.scope_type, pr.scope_id, pr.expires_at
    INTO requester_id, permission_id, scope_type, scope_id, expires_at
    FROM public.permission_requests pr
    WHERE pr.id = approve_request.request_id;
    
    -- إنشاء الصلاحية المؤقتة
    INSERT INTO public.temporary_permissions (
      admin_id, permission_id, scope_type, scope_id, granted_by, expires_at
    ) VALUES (
      requester_id, permission_id, scope_type, scope_id, approver_id, expires_at
    );
    
    -- تحديث حالة الطلب
    UPDATE public.permission_requests
    SET status = 'approved'
    WHERE id = approve_request.request_id;
    
    -- إرسال إشعار للمطلب
    INSERT INTO public.advanced_notifications (
      recipient_id, type, title, message
    ) VALUES (
      requester_id,
      'permission_granted',
      'تم منح الصلاحية',
      'تم منحك الصلاحية المطلوبة بنجاح'
    );
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- دالة لرفض الطلب
CREATE OR REPLACE FUNCTION public.reject_request(
  request_id UUID,
  approver_id UUID,
  comments TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  requester_id UUID;
BEGIN
  -- تحديث الموافقة
  UPDATE public.approvals
  SET status = 'rejected', comments = comments, approved_at = now()
  WHERE request_id = reject_request.request_id 
    AND approver_id = reject_request.approver_id
    AND status = 'pending';
  
  -- تحديث حالة الطلب
  UPDATE public.permission_requests
  SET status = 'rejected'
  WHERE id = reject_request.request_id;
  
  -- الحصول على معرف المطلب
  SELECT requester_id INTO requester_id
  FROM public.permission_requests
  WHERE id = reject_request.request_id;
  
  -- إرسال إشعار للمطلب
  INSERT INTO public.advanced_notifications (
    recipient_id, type, title, message
  ) VALUES (
    requester_id,
    'approval_rejected',
    'تم رفض الطلب',
    'تم رفض طلب الصلاحية: ' || comments
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- دالة لتنظيف الصلاحيات المنتهية الصلاحية
CREATE OR REPLACE FUNCTION public.cleanup_expired_permissions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- تحديث الصلاحيات المنتهية الصلاحية
  UPDATE public.temporary_permissions
  SET is_active = false
  WHERE expires_at <= now() AND is_active = true;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- تحديث طلبات الصلاحيات المنتهية الصلاحية
  UPDATE public.permission_requests
  SET status = 'expired'
  WHERE expires_at <= now() AND status = 'pending';
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق triggers
CREATE TRIGGER set_provinces_updated_at
  BEFORE UPDATE ON public.provinces
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_regions_updated_at
  BEFORE UPDATE ON public.regions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_cities_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_temporary_permissions_updated_at
  BEFORE UPDATE ON public.temporary_permissions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_permission_requests_updated_at
  BEFORE UPDATE ON public.permission_requests
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_approvals_updated_at
  BEFORE UPDATE ON public.approvals
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_approval_workflows_updated_at
  BEFORE UPDATE ON public.approval_workflows
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- إدراج بيانات المحافظات المصرية
INSERT INTO public.provinces (name_ar, name_en, code) VALUES
('القاهرة', 'Cairo', 'CA'),
('الجيزة', 'Giza', 'GZ'),
('الإسكندرية', 'Alexandria', 'AL'),
('الشرقية', 'Sharqia', 'SH'),
('الدقهلية', 'Dakahlia', 'DK'),
('البحيرة', 'Beheira', 'BH'),
('الغربية', 'Gharbia', 'GH'),
('القليوبية', 'Qalyubia', 'QL'),
('كفر الشيخ', 'Kafr El Sheikh', 'KF'),
('المنوفية', 'Monufia', 'MN'),
('الفيوم', 'Fayoum', 'FY'),
('بني سويف', 'Beni Suef', 'BS'),
('المنيا', 'Minya', 'MY'),
('أسيوط', 'Asyut', 'AS'),
('سوهاج', 'Sohag', 'SO'),
('قنا', 'Qena', 'QN'),
('الأقصر', 'Luxor', 'LX'),
('أسوان', 'Aswan', 'AW'),
('البحر الأحمر', 'Red Sea', 'RS'),
('الوادي الجديد', 'New Valley', 'NV'),
('مطروح', 'Matrouh', 'MT'),
('شمال سيناء', 'North Sinai', 'NS'),
('جنوب سيناء', 'South Sinai', 'SS'),
('دمياط', 'Damietta', 'DT'),
('بورسعيد', 'Port Said', 'PS'),
('الإسماعيلية', 'Ismailia', 'IS'),
('السويس', 'Suez', 'SZ');

-- إدراج الصلاحيات الجديدة (محدث ليتوافق مع هيكل النظام)
-- 1) Insert actions
INSERT INTO public.actions (name, description, code) VALUES
('provinces', 'المحافظات', 'provinces'),
('regions', 'المناطق', 'regions'),
('cities', 'المدن', 'cities'),
('permissions', 'الصلاحيات', 'permissions'),
('workflows', 'سير العمل', 'workflows'),
('notifications', 'الإشعارات', 'notifications')
ON CONFLICT (code) DO NOTHING;

-- 2) Ensure resources exist for these codes; insert missing ones
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

-- 3) Insert permissions by joining resources and actions (use actions codes for action types)
INSERT INTO public.permissions (resource_id, action_id, name, description, code)
-- provinces:manage (requires action code 'manage')
SELECT r.id, a.id, 'إدارة المحافظات', 'إدارة المحافظات والمناطق', 'provinces:manage'
FROM public.resources r
JOIN public.actions a ON a.code = 'manage'
WHERE r.code = 'provinces'

UNION ALL

-- regions:manage
SELECT r.id, a.id, 'إدارة المناطق', 'إدارة المناطق داخل المحافظات', 'regions:manage'
FROM public.resources r
JOIN public.actions a ON a.code = 'manage'
WHERE r.code = 'regions'

UNION ALL

-- cities:manage
SELECT r.id, a.id, 'إدارة المدن', 'إدارة المدن داخل المناطق', 'cities:manage'
FROM public.resources r
JOIN public.actions a ON a.code = 'manage'
WHERE r.code = 'cities'

UNION ALL

-- permissions:request (action code 'request')
SELECT r.id, a.id, 'طلب صلاحيات', 'طلب صلاحيات مؤقتة', 'permissions:request'
FROM public.resources r
JOIN public.actions a ON a.code = 'request'
WHERE r.code = 'permissions'

UNION ALL

-- permissions:approve (action code 'approve')
SELECT r.id, a.id, 'الموافقة على الصلاحيات', 'الموافقة على طلبات الصلاحيات', 'permissions:approve'
FROM public.resources r
JOIN public.actions a ON a.code = 'approve'
WHERE r.code = 'permissions';

COMMENT ON TABLE public.provinces IS 'جدول المحافظات المصرية';
COMMENT ON TABLE public.regions IS 'جدول المناطق داخل المحافظات';
COMMENT ON TABLE public.cities IS 'جدول المدن داخل المناطق';
COMMENT ON TABLE public.temporary_permissions IS 'جدول الصلاحيات المؤقتة';
COMMENT ON TABLE public.permission_requests IS 'جدول طلبات الصلاحيات';
COMMENT ON TABLE public.approvals IS 'جدول الموافقات على الطلبات';
COMMENT ON TABLE public.approval_workflows IS 'جدول سير عمل الموافقات';
COMMENT ON TABLE public.activity_logs IS 'جدول سجل الأنشطة';
COMMENT ON TABLE public.advanced_notifications IS 'جدول الإشعارات المتقدمة';

-- ========================================
-- النسخة المحدثة - تم تطبيقها بنجاح
-- ========================================
-- هذا الملف يحتوي على النسخة المحدثة من نظام المحافظات والصلاحيات المؤقتة
-- تم تحديثه ليتوافق مع هيكل النظام الموجود في Supabase
-- 
-- التحديثات المطبقة:
-- 1. تحديث نوع البيانات في جدول cities ليتوافق مع regions (INTEGER)
-- 2. تحديث جدول approval_workflows لاستخدام permission_id بدلاً من permission_code
-- 3. تحديث الدوال المساعدة ليتوافق مع هيكل النظام الموجود
-- 4. تحديث سياسات الأمان (RLS) لتكون متوافقة مع PostgreSQL
-- 5. تحديث إدراج الصلاحيات ليتوافق مع هيكل resources/actions
-- 6. إزالة التكرار في بيانات المحافظات
-- 
-- تم تطبيق النظام بنجاح في المشروع: yytjguijpbahrltqjdks
-- التاريخ: 2025-10-27

