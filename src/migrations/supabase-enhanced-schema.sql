-- مخطط معزز لقاعدة بيانات تطبيق توصيل النفايات ولوحة تحكم الإدارة
-- هذا المخطط يتضمن الجداول الموجودة مع إضافات مقترحة لتحسين أداء لوحة التحكم

-- تفعيل امتداد UUID إذا لم يكن مفعلاً
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- إضافات مقترحة لجدول delivery_boys
ALTER TABLE public.delivery_boys ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE public.delivery_boys ADD COLUMN IF NOT EXISTS device_info JSONB;
ALTER TABLE public.delivery_boys ADD COLUMN IF NOT EXISTS average_response_time INTEGER;
ALTER TABLE public.delivery_boys ADD COLUMN IF NOT EXISTS completed_orders_count INTEGER DEFAULT 0;
ALTER TABLE public.delivery_boys ADD COLUMN IF NOT EXISTS canceled_orders_count INTEGER DEFAULT 0;
ALTER TABLE public.delivery_boys ADD COLUMN IF NOT EXISTS badge_level INTEGER DEFAULT 0;
ALTER TABLE public.delivery_boys ADD COLUMN IF NOT EXISTS last_performance_review TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.delivery_boys ADD COLUMN IF NOT EXISTS preferred_zones JSONB;
COMMENT ON COLUMN public.delivery_boys.profile_image_url IS 'رابط صورة الملف الشخصي للمندوب';
COMMENT ON COLUMN public.delivery_boys.device_info IS 'معلومات عن جهاز المندوب (نوع الجهاز، إصدار نظام التشغيل، إصدار التطبيق)';
COMMENT ON COLUMN public.delivery_boys.average_response_time IS 'متوسط وقت استجابة المندوب للطلبات بالدقائق';
COMMENT ON COLUMN public.delivery_boys.badge_level IS 'مستوى الشارة للمندوب (1-5) بناءً على الأداء';
COMMENT ON COLUMN public.delivery_boys.preferred_zones IS 'المناطق المفضلة للمندوب للعمل فيها';

-- إنشاء جدول لتتبع أداء المندوبين على أساس يومي
CREATE TABLE IF NOT EXISTS public.delivery_boy_daily_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_boy_id UUID NOT NULL REFERENCES public.delivery_boys(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  orders_completed INTEGER DEFAULT 0,
  orders_canceled INTEGER DEFAULT 0,
  total_distance NUMERIC(10, 2) DEFAULT 0,
  total_earnings NUMERIC(10, 2) DEFAULT 0,
  average_rating NUMERIC(3, 2) DEFAULT 0,
  online_hours NUMERIC(5, 2) DEFAULT 0,
  waste_weight_collected NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT delivery_boy_daily_performance_delivery_boy_date_key UNIQUE (delivery_boy_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_performance_delivery_boy ON public.delivery_boy_daily_performance (delivery_boy_id);
CREATE INDEX IF NOT EXISTS idx_daily_performance_date ON public.delivery_boy_daily_performance (date);

-- إضافات مقترحة لجدول delivery_orders
ALTER TABLE public.delivery_orders ADD COLUMN IF NOT EXISTS analytics_data JSONB;
ALTER TABLE public.delivery_orders ADD COLUMN IF NOT EXISTS customer_feedback TEXT;
ALTER TABLE public.delivery_orders ADD COLUMN IF NOT EXISTS delivery_route JSONB;
ALTER TABLE public.delivery_orders ADD COLUMN IF NOT EXISTS order_processing_time INTEGER;
ALTER TABLE public.delivery_orders ADD COLUMN IF NOT EXISTS customer_waiting_time INTEGER;
ALTER TABLE public.delivery_orders ADD COLUMN IF NOT EXISTS weather_conditions JSONB;
COMMENT ON COLUMN public.delivery_orders.analytics_data IS 'بيانات تحليلية إضافية عن الطلب (وقت انتظار العميل، وقت الاستجابة، الخ)';
COMMENT ON COLUMN public.delivery_orders.delivery_route IS 'المسار المتبع لتوصيل الطلب كسلسلة من الإحداثيات';
COMMENT ON COLUMN public.delivery_orders.order_processing_time IS 'الوقت المستغرق لمعالجة الطلب قبل تعيينه لمندوب (بالدقائق)';
COMMENT ON COLUMN public.delivery_orders.customer_waiting_time IS 'وقت انتظار العميل من إنشاء الطلب حتى التوصيل (بالدقائق)';
COMMENT ON COLUMN public.delivery_orders.weather_conditions IS 'ظروف الطقس أثناء التوصيل (درجة الحرارة، الرطوبة، الخ)';

-- إضافات مقترحة لجدول waste_collection_sessions
ALTER TABLE public.waste_collection_sessions ADD COLUMN IF NOT EXISTS collection_efficiency NUMERIC(5, 2);
ALTER TABLE public.waste_collection_sessions ADD COLUMN IF NOT EXISTS collection_notes TEXT;
ALTER TABLE public.waste_collection_sessions ADD COLUMN IF NOT EXISTS quality_score INTEGER;
ALTER TABLE public.waste_collection_sessions ADD COLUMN IF NOT EXISTS photos JSONB;
COMMENT ON COLUMN public.waste_collection_sessions.collection_efficiency IS 'كفاءة عملية جمع النفايات (معدل بالنسبة المئوية)';
COMMENT ON COLUMN public.waste_collection_sessions.quality_score IS 'درجة جودة عملية الجمع (1-10)';
COMMENT ON COLUMN public.waste_collection_sessions.photos IS 'صور لعملية جمع النفايات (قبل وبعد)';

-- إنشاء جدول للتحليلات والإحصاءات
CREATE TABLE IF NOT EXISTS public.analytics_dashboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  canceled_orders INTEGER DEFAULT 0,
  total_waste_collected NUMERIC(10, 2) DEFAULT 0,
  total_revenue NUMERIC(12, 2) DEFAULT 0,
  active_agents INTEGER DEFAULT 0,
  average_delivery_time NUMERIC(10, 2) DEFAULT 0,
  average_collection_efficiency NUMERIC(5, 2) DEFAULT 0,
  stats_by_waste_type JSONB,
  stats_by_area JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT analytics_dashboard_date_key UNIQUE (date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_dashboard_date ON public.analytics_dashboard (date);

-- إنشاء جدول للمناطق الجغرافية لتحسين توزيع المندوبين
CREATE TABLE IF NOT EXISTS public.geographic_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  area_polygon GEOMETRY(POLYGON),
  center_point GEOMETRY(POINT),
  population_density NUMERIC(10, 2),
  waste_generation_rate NUMERIC(10, 2),
  agent_coverage INTEGER DEFAULT 0,
  active_status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_geographic_zones_area ON public.geographic_zones USING GIST (area_polygon);

-- إنشاء جدول لتخزين بيانات المركبات المستخدمة في التوصيل
CREATE TABLE IF NOT EXISTS public.delivery_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number TEXT NOT NULL,
  vehicle_type public.vehicle_type NOT NULL,
  capacity NUMERIC(10, 2),
  fuel_efficiency NUMERIC(5, 2),
  maintenance_status TEXT,
  last_maintenance_date TIMESTAMP WITH TIME ZONE,
  next_maintenance_date TIMESTAMP WITH TIME ZONE,
  assigned_agent_id UUID REFERENCES public.delivery_boys(id),
  status TEXT DEFAULT 'available',
  location GEOMETRY(POINT),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT delivery_vehicles_registration_number_key UNIQUE (registration_number)
);

CREATE INDEX IF NOT EXISTS idx_delivery_vehicles_agent ON public.delivery_vehicles (assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_delivery_vehicles_location ON public.delivery_vehicles USING GIST (location);

-- إنشاء جدول لسجل صيانة المركبات
CREATE TABLE IF NOT EXISTS public.vehicle_maintenance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.delivery_vehicles(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  cost NUMERIC(10, 2),
  performed_by TEXT,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  next_maintenance_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_vehicle ON public.vehicle_maintenance_log (vehicle_id);

-- إنشاء جدول لإشعارات النظام
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'alert', 'warning', 'info'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_role TEXT, -- 'admin', 'agent', 'all'
  target_user_id UUID REFERENCES auth.users(id),
  is_read BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_notifications_user ON public.system_notifications (target_user_id);
CREATE INDEX IF NOT EXISTS idx_system_notifications_is_read ON public.system_notifications (is_read);

-- إنشاء وظيفة لتحديث إحصائيات الأداء اليومية للمندوبين
CREATE OR REPLACE FUNCTION public.update_daily_performance()
RETURNS TRIGGER AS $$
DECLARE
  delivery_date DATE;
  waste_weight NUMERIC(10, 2);
  earnings NUMERIC(10, 2);
  distance NUMERIC(10, 2);
BEGIN
  -- حساب التاريخ من الطلب
  delivery_date := CURRENT_DATE;
  IF NEW.actual_delivery_time IS NOT NULL THEN
    delivery_date := DATE(NEW.actual_delivery_time);
  ELSIF NEW.created_at IS NOT NULL THEN
    delivery_date := DATE(NEW.created_at);
  END IF;
  
  -- حساب الوزن والأرباح والمسافة
  SELECT COALESCE(SUM(total_weight), 0) INTO waste_weight
  FROM public.waste_collection_sessions
  WHERE delivery_order_id = NEW.id;
  
  earnings := COALESCE(NEW.actual_total_amount, NEW.expected_total_amount, 0);
  distance := COALESCE(NEW.estimated_distance, 0);
  
  -- تحديث أو إدراج سجل الأداء اليومي
  INSERT INTO public.delivery_boy_daily_performance
    (delivery_boy_id, date, orders_completed, total_distance, total_earnings, waste_weight_collected)
  VALUES
    (NEW.delivery_boy_id, delivery_date, 
      CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END, 
      distance, earnings, waste_weight)
  ON CONFLICT (delivery_boy_id, date) DO UPDATE
    SET orders_completed = 
      CASE WHEN NEW.status = 'completed' THEN 
        delivery_boy_daily_performance.orders_completed + 1
      ELSE
        delivery_boy_daily_performance.orders_completed
      END,
      orders_canceled = 
      CASE WHEN NEW.status = 'canceled' THEN 
        delivery_boy_daily_performance.orders_canceled + 1
      ELSE
        delivery_boy_daily_performance.orders_canceled
      END,
      total_distance = delivery_boy_daily_performance.total_distance + distance,
      total_earnings = delivery_boy_daily_performance.total_earnings + earnings,
      waste_weight_collected = delivery_boy_daily_performance.waste_weight_collected + waste_weight;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء تريجر لتحديث إحصائيات الأداء اليومية عند تحديث أو إدراج طلب
DROP TRIGGER IF EXISTS delivery_orders_performance_update ON public.delivery_orders;
CREATE TRIGGER delivery_orders_performance_update
AFTER INSERT OR UPDATE OF status, actual_total_amount, delivery_boy_id ON public.delivery_orders
FOR EACH ROW
WHEN (NEW.delivery_boy_id IS NOT NULL)
EXECUTE FUNCTION public.update_daily_performance();

-- إنشاء وظيفة لتحديث حالة المندوب بناءً على إحصائيات الأداء
CREATE OR REPLACE FUNCTION public.update_delivery_boy_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث عدد الطلبات المكتملة والملغاة
  UPDATE public.delivery_boys
  SET 
    completed_orders_count = (
      SELECT COUNT(*) 
      FROM public.delivery_orders 
      WHERE delivery_boy_id = NEW.delivery_boy_id AND status = 'completed'
    ),
    canceled_orders_count = (
      SELECT COUNT(*) 
      FROM public.delivery_orders 
      WHERE delivery_boy_id = NEW.delivery_boy_id AND status = 'canceled'
    ),
    total_deliveries = (
      SELECT COUNT(*) 
      FROM public.delivery_orders 
      WHERE delivery_boy_id = NEW.delivery_boy_id AND status = 'completed'
    ),
    total_earnings = (
      SELECT COALESCE(SUM(actual_total_amount), 0) 
      FROM public.delivery_orders 
      WHERE delivery_boy_id = NEW.delivery_boy_id AND status = 'completed'
    ),
    rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM public.delivery_ratings 
      WHERE delivery_id = NEW.delivery_boy_id
    ),
    badge_level = CASE 
      WHEN (SELECT COUNT(*) FROM public.delivery_orders WHERE delivery_boy_id = NEW.delivery_boy_id AND status = 'completed') >= 500 THEN 5
      WHEN (SELECT COUNT(*) FROM public.delivery_orders WHERE delivery_boy_id = NEW.delivery_boy_id AND status = 'completed') >= 250 THEN 4
      WHEN (SELECT COUNT(*) FROM public.delivery_orders WHERE delivery_boy_id = NEW.delivery_boy_id AND status = 'completed') >= 100 THEN 3
      WHEN (SELECT COUNT(*) FROM public.delivery_orders WHERE delivery_boy_id = NEW.delivery_boy_id AND status = 'completed') >= 50 THEN 2
      WHEN (SELECT COUNT(*) FROM public.delivery_orders WHERE delivery_boy_id = NEW.delivery_boy_id AND status = 'completed') >= 10 THEN 1
      ELSE 0
    END
  WHERE id = NEW.delivery_boy_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء تريجر لتحديث إحصائيات المندوب
DROP TRIGGER IF EXISTS delivery_boy_stats_update ON public.delivery_orders;
CREATE TRIGGER delivery_boy_stats_update
AFTER INSERT OR UPDATE OF status ON public.delivery_orders
FOR EACH ROW
WHEN (NEW.delivery_boy_id IS NOT NULL)
EXECUTE FUNCTION public.update_delivery_boy_stats();

-- إنشاء وظيفة لتحديث إحصائيات لوحة الإدارة اليومية
CREATE OR REPLACE FUNCTION public.update_dashboard_analytics()
RETURNS TRIGGER AS $$
DECLARE
  today DATE;
BEGIN
  today := CURRENT_DATE;
  
  -- تحديث أو إدراج إحصائيات اليوم
  INSERT INTO public.analytics_dashboard
    (date, total_orders, completed_orders, canceled_orders, active_agents)
  VALUES
    (today, 
     (SELECT COUNT(*) FROM public.delivery_orders WHERE DATE(created_at) = today),
     (SELECT COUNT(*) FROM public.delivery_orders WHERE DATE(created_at) = today AND status = 'completed'),
     (SELECT COUNT(*) FROM public.delivery_orders WHERE DATE(created_at) = today AND status = 'canceled'),
     (SELECT COUNT(*) FROM public.delivery_boys WHERE is_available = TRUE)
    )
  ON CONFLICT (date) DO UPDATE
    SET 
      total_orders = (SELECT COUNT(*) FROM public.delivery_orders WHERE DATE(created_at) = today),
      completed_orders = (SELECT COUNT(*) FROM public.delivery_orders WHERE DATE(created_at) = today AND status = 'completed'),
      canceled_orders = (SELECT COUNT(*) FROM public.delivery_orders WHERE DATE(created_at) = today AND status = 'canceled'),
      active_agents = (SELECT COUNT(*) FROM public.delivery_boys WHERE is_available = TRUE),
      total_waste_collected = (
        SELECT COALESCE(SUM(total_weight), 0) 
        FROM public.waste_collection_sessions 
        WHERE DATE(created_at) = today
      ),
      total_revenue = (
        SELECT COALESCE(SUM(actual_total_amount), 0) 
        FROM public.delivery_orders 
        WHERE DATE(created_at) = today AND status = 'completed'
      ),
      average_delivery_time = (
        SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (actual_delivery_time - actual_pickup_time))/60), 0) 
        FROM public.delivery_orders 
        WHERE DATE(created_at) = today AND status = 'completed' 
          AND actual_pickup_time IS NOT NULL AND actual_delivery_time IS NOT NULL
      ),
      average_collection_efficiency = (
        SELECT COALESCE(AVG(collection_efficiency), 0) 
        FROM public.waste_collection_sessions 
        WHERE DATE(created_at) = today
      ),
      updated_at = CURRENT_TIMESTAMP;
      
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء تريجر لتحديث إحصائيات لوحة الإدارة
DROP TRIGGER IF EXISTS dashboard_analytics_update ON public.delivery_orders;
CREATE TRIGGER dashboard_analytics_update
AFTER INSERT OR UPDATE OF status ON public.delivery_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_dashboard_analytics();

-- وظيفة متقدمة لحساب إحصائيات الأداء للمندوب على مدى فترة زمنية
CREATE OR REPLACE FUNCTION public.get_delivery_boy_performance(
  p_delivery_boy_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  orders_completed INTEGER,
  orders_canceled INTEGER,
  total_distance NUMERIC,
  total_earnings NUMERIC,
  waste_weight_collected NUMERIC,
  average_rating NUMERIC,
  online_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dp.date,
    dp.orders_completed,
    dp.orders_canceled,
    dp.total_distance,
    dp.total_earnings,
    dp.waste_weight_collected,
    dp.average_rating,
    dp.online_hours
  FROM
    public.delivery_boy_daily_performance dp
  WHERE
    dp.delivery_boy_id = p_delivery_boy_id
    AND dp.date BETWEEN p_start_date AND p_end_date
  ORDER BY
    dp.date;
END;
$$ LANGUAGE plpgsql;

-- وظيفة لحساب إحصائيات متقدمة للطلبات حسب نوع النفايات
CREATE OR REPLACE FUNCTION public.get_waste_type_stats(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  waste_type TEXT,
  total_weight NUMERIC,
  total_orders INTEGER,
  total_revenue NUMERIC,
  average_weight_per_order NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wci.name AS waste_type,
    SUM(wci.actual_weight) AS total_weight,
    COUNT(DISTINCT wcs.id) AS total_orders,
    SUM(wci.total_price) AS total_revenue,
    CASE 
      WHEN COUNT(DISTINCT wcs.id) > 0 THEN SUM(wci.actual_weight) / COUNT(DISTINCT wcs.id)
      ELSE 0
    END AS average_weight_per_order
  FROM
    public.waste_collection_items wci
  JOIN
    public.waste_collection_sessions wcs ON wci.session_id = wcs.id
  WHERE
    wcs.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY
    wci.name
  ORDER BY
    total_weight DESC;
END;
$$ LANGUAGE plpgsql;

-- قيود وتريجرز إضافية لضمان سلامة البيانات

-- تريجر لحساب وقت انتظار العميل عند اكتمال الطلب
CREATE OR REPLACE FUNCTION public.calculate_customer_waiting_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.actual_delivery_time IS NOT NULL AND NEW.created_at IS NOT NULL THEN
    NEW.customer_waiting_time := EXTRACT(EPOCH FROM (NEW.actual_delivery_time - NEW.created_at))/60;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_customer_waiting_time ON public.delivery_orders;
CREATE TRIGGER update_customer_waiting_time
BEFORE UPDATE OF status, actual_delivery_time ON public.delivery_orders
FOR EACH ROW
EXECUTE FUNCTION public.calculate_customer_waiting_time();

-- وظيفة RPC لتخصيص الطلبات للمندوبين بشكل ذكي
CREATE OR REPLACE FUNCTION public.smart_assign_order(
  p_order_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_assigned_delivery_boy_id UUID;
  v_order_pickup_location GEOMETRY;
  v_order_category TEXT;
BEGIN
  -- الحصول على موقع الاستلام وفئة الطلب
  SELECT 
    pickup_location, 
    category_name 
  INTO 
    v_order_pickup_location, 
    v_order_category 
  FROM 
    public.delivery_orders 
  WHERE 
    id = p_order_id;

  -- البحث عن أفضل مندوب استنادًا إلى الموقع والكفاءة والخبرة
  SELECT 
    db.id INTO v_assigned_delivery_boy_id
  FROM 
    public.delivery_boys db
  WHERE 
    db.is_available = TRUE
    AND db.status = 'active'
  ORDER BY 
    -- أولوية للمندوبين الأقرب إلى موقع الاستلام
    ST_Distance(
      ST_SetSRID(ST_MakePoint(db.current_longitude, db.current_latitude), 4326), 
      v_order_pickup_location
    ) ASC,
    -- ثم حسب التقييم
    db.rating DESC,
    -- ثم حسب عدد التوصيلات
    db.total_deliveries DESC
  LIMIT 1;

  -- تحديث الطلب بالمندوب المخصص
  IF v_assigned_delivery_boy_id IS NOT NULL THEN
    UPDATE public.delivery_orders
    SET 
      delivery_boy_id = v_assigned_delivery_boy_id,
      status = 'assigned',
      updated_at = CURRENT_TIMESTAMP
    WHERE 
      id = p_order_id;
  END IF;

  RETURN v_assigned_delivery_boy_id;
END;
$$ LANGUAGE plpgsql;

-- السياسات الأمنية للجداول الجديدة

-- سياسة أمان لجدول أداء المندوبين اليومي
ALTER TABLE public.delivery_boy_daily_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all performance data" ON public.delivery_boy_daily_performance
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
  );
CREATE POLICY "Delivery boys can view their own performance data" ON public.delivery_boy_daily_performance
  FOR SELECT USING (
    auth.uid() = delivery_boy_id
  );

-- سياسة أمان لجدول تحليلات لوحة الإدارة
ALTER TABLE public.analytics_dashboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view analytics dashboard" ON public.analytics_dashboard
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
  );

-- سياسة أمان لجدول المناطق الجغرافية
ALTER TABLE public.geographic_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Geographic zones are viewable by everyone" ON public.geographic_zones
  FOR SELECT USING (true);
CREATE POLICY "Only admins can manage geographic zones" ON public.geographic_zones
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
  );

-- سياسة أمان لجدول مركبات التوصيل
ALTER TABLE public.delivery_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Delivery vehicles are viewable by admins" ON public.delivery_vehicles
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
  );
CREATE POLICY "Agents can view their assigned vehicles" ON public.delivery_vehicles
  FOR SELECT USING (
    auth.uid() = assigned_agent_id
  );
CREATE POLICY "Only admins can manage delivery vehicles" ON public.delivery_vehicles
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
  );

-- سياسة أمان لجدول سجل صيانة المركبات
ALTER TABLE public.vehicle_maintenance_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can manage maintenance logs" ON public.vehicle_maintenance_log
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
  );
CREATE POLICY "Agents can view maintenance logs of their vehicles" ON public.vehicle_maintenance_log
  FOR SELECT USING (
    auth.uid() IN (
      SELECT assigned_agent_id FROM public.delivery_vehicles WHERE id = vehicle_id
    )
  );

-- سياسة أمان لجدول إشعارات النظام
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view notifications targeted to them" ON public.system_notifications
  FOR SELECT USING (
    target_user_id = auth.uid() OR
    target_role = 'all' OR
    (target_role = 'admin' AND auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')) OR
    (target_role = 'agent' AND auth.uid() IN (SELECT id FROM auth.users WHERE role = 'agent'))
  );
CREATE POLICY "Only admins can create system notifications" ON public.system_notifications
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
  );
CREATE POLICY "Users can mark their notifications as read" ON public.system_notifications
  FOR UPDATE USING (
    target_user_id = auth.uid()
  ) WITH CHECK (
    is_read = TRUE AND
    id = id AND
    type = type AND
    title = title AND
    message = message AND
    target_role = target_role AND
    target_user_id = target_user_id
  );

-- إنشاء وظيفة تحديث للإشعارات للتحقق من التغييرات المسموح بها
CREATE OR REPLACE FUNCTION public.check_notification_update()
RETURNS TRIGGER AS $$
BEGIN
  -- التأكد من أن التحديث يغير فقط حقل is_read من FALSE إلى TRUE
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_read = FALSE AND NEW.is_read = TRUE AND
       NEW.id = OLD.id AND
       NEW.type = OLD.type AND
       NEW.title = OLD.title AND
       NEW.message = OLD.message AND
       NEW.target_role = OLD.target_role AND
       NEW.target_user_id = OLD.target_user_id AND
       NEW.expires_at = OLD.expires_at AND
       NEW.created_at = OLD.created_at THEN
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'غير مسموح بتغيير حقول أخرى غير is_read';
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- إنشاء تريجر للتحقق من تحديثات الإشعارات
DROP TRIGGER IF EXISTS check_notification_updates ON public.system_notifications;
CREATE TRIGGER check_notification_updates
BEFORE UPDATE ON public.system_notifications
FOR EACH ROW
EXECUTE FUNCTION public.check_notification_update();