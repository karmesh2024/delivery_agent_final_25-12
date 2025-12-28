-- نظام المحافظات والمناطق والصلاحيات المؤقتة والموافقات
-- هذا الملف يحتوي على النظام الكامل للمحافظات والصلاحيات المؤقتة
-- يتكامل مع النظام الإداري الموجود

-- 1. إنشاء جدول المحافظات (يتكامل مع جدول regions الموجود)
CREATE TABLE IF NOT EXISTS public.provinces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  code TEXT UNIQUE NOT NULL,
  country_code TEXT DEFAULT 'SA',
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

-- 3. إنشاء جدول المدن
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID REFERENCES public.regions(id) ON DELETE CASCADE,
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES public.permission_requests(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES public.admins(id),
  level INTEGER NOT NULL, -- مستوى الموافقة (1, 2, 3, etc.)
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  comments TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. إنشاء جدول سير العمل للموافقات
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permission_code TEXT NOT NULL,
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX IF NOT EXISTS idx_approval_workflows_permission ON public.approval_workflows(permission_code, scope_type);
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

-- سياسات الأمان للمحافظات
CREATE POLICY "Provinces are viewable by everyone" ON public.provinces FOR SELECT USING (true);
CREATE POLICY "Only admins can manage provinces" ON public.provinces FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);

-- سياسات الأمان للمناطق
CREATE POLICY "Regions are viewable by everyone" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Only admins can manage regions" ON public.regions FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);

-- سياسات الأمان للمدن
CREATE POLICY "Cities are viewable by everyone" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Only admins can manage cities" ON public.cities FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);

-- سياسات الأمان للصلاحيات المؤقتة
CREATE POLICY "Admins can view their own temporary permissions" ON public.temporary_permissions FOR SELECT USING (
  auth.uid() = admin_id OR 
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "Admins can manage temporary permissions" ON public.temporary_permissions FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);

-- سياسات الأمان لطلبات الصلاحيات
CREATE POLICY "Admins can view permission requests" ON public.permission_requests FOR SELECT USING (
  auth.uid() = requester_id OR 
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "Admins can manage permission requests" ON public.permission_requests FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);

-- سياسات الأمان للموافقات
CREATE POLICY "Admins can view approvals" ON public.approvals FOR SELECT USING (
  auth.uid() = approver_id OR 
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "Admins can manage approvals" ON public.approvals FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);

-- سياسات الأمان لسير العمل
CREATE POLICY "Admins can view approval workflows" ON public.approval_workflows FOR SELECT USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "Only super admins can manage workflows" ON public.approval_workflows FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true AND role_id IN (
    SELECT id FROM public.roles WHERE level >= 5
  ))
);

-- سياسات الأمان لسجل الأنشطة
CREATE POLICY "Admins can view activity logs" ON public.activity_logs FOR SELECT USING (
  auth.uid() IN (SELECT id FROM public.admins WHERE is_active = true)
);
CREATE POLICY "System can insert activity logs" ON public.activity_logs FOR INSERT USING (true);

-- سياسات الأمان للإشعارات
CREATE POLICY "Admins can view their notifications" ON public.advanced_notifications FOR SELECT USING (
  auth.uid() = recipient_id
);
CREATE POLICY "Admins can update their notifications" ON public.advanced_notifications FOR UPDATE USING (
  auth.uid() = recipient_id
);
CREATE POLICY "System can insert notifications" ON public.advanced_notifications FOR INSERT USING (true);

-- إنشاء الدوال المساعدة
CREATE OR REPLACE FUNCTION public.get_admin_permissions(admin_id UUID)
RETURNS TABLE (
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
    p.code as permission_code,
    'global' as scope_type,
    NULL::UUID as scope_id,
    false as is_temporary,
    NULL::TIMESTAMPTZ as expires_at
  FROM public.role_permissions rp
  JOIN public.permissions p ON rp.permission_id = p.id
  JOIN public.admins a ON a.role_id = rp.role_id
  WHERE a.id = admin_id AND a.is_active = true
  
  UNION ALL
  
  -- الصلاحيات المؤقتة
  SELECT 
    tp.permission_code,
    tp.scope_type,
    tp.scope_id,
    true as is_temporary,
    tp.expires_at
  FROM public.temporary_permissions tp
  WHERE tp.admin_id = admin_id 
    AND tp.is_active = true 
    AND tp.expires_at > now();
END;
$$ LANGUAGE plpgsql;

-- دالة للتحقق من الصلاحية
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
    SELECT 1 FROM public.role_permissions rp
    JOIN public.permissions p ON rp.permission_id = p.id
    JOIN public.admins a ON a.role_id = rp.role_id
    WHERE a.id = admin_id 
      AND a.is_active = true
      AND p.code = permission_code
  ) INTO has_permission;
  
  IF has_permission THEN
    RETURN true;
  END IF;
  
  -- التحقق من الصلاحيات المؤقتة
  SELECT EXISTS(
    SELECT 1 FROM public.temporary_permissions tp
    WHERE tp.admin_id = admin_id 
      AND tp.permission_code = permission_code
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
  permission_code TEXT,
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
BEGIN
  -- إنشاء الطلب
  INSERT INTO public.permission_requests (
    requester_id, permission_code, scope_type, scope_id, reason, priority
  ) VALUES (
    requester_id, permission_code, scope_type, scope_id, reason, priority
  ) RETURNING id INTO request_id;
  
  -- الحصول على مستويات الموافقة المطلوبة
  SELECT ARRAY_AGG(level ORDER BY level) INTO workflow_levels
  FROM public.approval_workflows
  WHERE permission_code = create_permission_request.permission_code
    AND scope_type = create_permission_request.scope_type;
  
  -- إنشاء سجلات الموافقة لكل مستوى
  FOREACH level IN ARRAY workflow_levels
  LOOP
    -- البحث عن الموافق المناسب
    SELECT aw.approver_admin_id INTO approver_id
    FROM public.approval_workflows aw
    WHERE aw.permission_code = create_permission_request.permission_code
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
  permission_code TEXT;
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
    SELECT pr.requester_id, pr.permission_code, pr.scope_type, pr.scope_id, pr.expires_at
    INTO requester_id, permission_code, scope_type, scope_id, expires_at
    FROM public.permission_requests pr
    WHERE pr.id = approve_request.request_id;
    
    -- إنشاء الصلاحية المؤقتة
    INSERT INTO public.temporary_permissions (
      admin_id, permission_code, scope_type, scope_id, granted_by, expires_at
    ) VALUES (
      requester_id, permission_code, scope_type, scope_id, approver_id, expires_at
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

-- إدراج بيانات المحافظات السعودية
INSERT INTO public.provinces (name_ar, name_en, code) VALUES
('الرياض', 'Riyadh', 'RY'),
('مكة المكرمة', 'Makkah', 'MK'),
('المدينة المنورة', 'Madinah', 'MD'),
('القصيم', 'Qassim', 'QS'),
('الشرقية', 'Eastern Province', 'EP'),
('عسير', 'Asir', 'AS'),
('تبوك', 'Tabuk', 'TB'),
('حائل', 'Hail', 'HL'),
('الحدود الشمالية', 'Northern Borders', 'NB'),
('جازان', 'Jazan', 'JZ'),
('نجران', 'Najran', 'NR'),
('الباحة', 'Al Baha', 'BH'),
('الجوف', 'Al Jouf', 'JF');

-- إنشاء جدول للصلاحيات الجديدة
INSERT INTO public.permissions (code, name, description, group_name) VALUES
('provinces:manage', 'إدارة المحافظات', 'إدارة المحافظات والمناطق', 'locations'),
('regions:manage', 'إدارة المناطق', 'إدارة المناطق داخل المحافظات', 'locations'),
('cities:manage', 'إدارة المدن', 'إدارة المدن داخل المناطق', 'locations'),
('permissions:request', 'طلب صلاحيات', 'طلب صلاحيات مؤقتة', 'permissions'),
('permissions:approve', 'الموافقة على الصلاحيات', 'الموافقة على طلبات الصلاحيات', 'permissions'),
('permissions:grant_temporary', 'منح صلاحيات مؤقتة', 'منح صلاحيات مؤقتة للمديرين', 'permissions'),
('workflows:manage', 'إدارة سير العمل', 'إدارة سير عمل الموافقات', 'workflows'),
('notifications:manage', 'إدارة الإشعارات', 'إدارة الإشعارات والتنبيهات', 'notifications');

COMMENT ON TABLE public.provinces IS 'جدول المحافظات السعودية';
COMMENT ON TABLE public.regions IS 'جدول المناطق داخل المحافظات';
COMMENT ON TABLE public.cities IS 'جدول المدن داخل المناطق';
COMMENT ON TABLE public.temporary_permissions IS 'جدول الصلاحيات المؤقتة';
COMMENT ON TABLE public.permission_requests IS 'جدول طلبات الصلاحيات';
COMMENT ON TABLE public.approvals IS 'جدول الموافقات على الطلبات';
COMMENT ON TABLE public.approval_workflows IS 'جدول سير عمل الموافقات';
COMMENT ON TABLE public.activity_logs IS 'جدول سجل الأنشطة';
COMMENT ON TABLE public.advanced_notifications IS 'جدول الإشعارات المتقدمة';
