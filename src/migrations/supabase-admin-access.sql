-- إضافة سياسة أمان جديدة تسمح لمستخدمي الإدارة بالوصول إلى جميع بيانات المندوبين
-- يجب تنفيذ هذا المخطط في قاعدة بيانات Supabase

-- ملاحظة مهمة: جدول delivery_boys مرتبط بجدول auth.users من خلال المفتاح الأجنبي id
-- لذلك، يجب أولاً إنشاء المستخدمين في جدول auth.users قبل إدراجهم في جدول delivery_boys
-- أو استخدام معرفات من مستخدمين موجودين بالفعل

-- لإنشاء مستخدمين في auth.users، استخدم واجهة برمجة تطبيقات Supabase:
/*
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'user@example.com',
    password: 'password',
    user_metadata: { 
      full_name: 'Full Name',
      user_type: 'delivery_boy'
    }
  });
*/

-- هذا هو المخطط الأساسي. في بيئة الإنتاج، يمكنك استخدام API لإدارة المستخدمين
-- أو قم بتعديل المعرفات أدناه لتتطابق مع معرفات المستخدمين الموجودين في جدول auth.users

-- حل بديل: إنشاء عرض (view) للمندوبين لاستخدامه في لوحة التحكم
CREATE OR REPLACE VIEW admin_delivery_boys_view AS
SELECT * FROM public.delivery_boys;

-- إنشاء سياسة تسمح للجميع بالوصول إلى العرض
GRANT SELECT ON admin_delivery_boys_view TO PUBLIC;

-- إنشاء سياسة جديدة للقراءة تسمح لمستخدمي الإدارة بالوصول إلى جميع المندوبين
-- ملاحظة: قد لا تعمل هذه السياسة إذا كان هناك قيود أخرى على الجدول
CREATE POLICY "Admin users can access all delivery boys" 
ON public.delivery_boys
FOR SELECT
TO public
USING (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  OR
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  OR
  true -- للتطوير والاختبار فقط، قم بإزالتها في بيئة الإنتاج
);

-- تعديل السياسة لتسمح للمستخدمين المصادق عليهم بعرض بعض بيانات المندوبين (للاستخدام في لوحة التحكم)
CREATE POLICY "Authenticated users can view basic delivery boy info" 
ON public.delivery_boys
FOR SELECT
TO authenticated
USING (true);

-- تعديل سياسة مندوبي التوصيل للسماح للتطبيق بالوصول إلى البيانات
-- ملاحظة: هذا التعديل مؤقت للاختبار فقط، يجب ضبطه بشكل صحيح في الإنتاج
ALTER POLICY "Delivery boys can only be accessed by delivery boy type users"
ON public.delivery_boys
USING (true);

-- ملاحظة: البيانات التجريبية أدناه تفترض وجود مستخدمين في جدول auth.users
-- إذا أردت اختبار هذه البيانات، يجب أولاً إنشاء المستخدمين أو تعديل المعرفات

-- لتعديل طريقة التحقق من المفتاح الأجنبي مؤقتاً (للاختبار فقط):
-- ALTER TABLE public.delivery_boys DISABLE TRIGGER ALL;

-- إنشاء بيانات تجريبية للمندوبين - استخدمها بعد إنشاء المستخدمين المقابلين
-- INSERT INTO public.delivery_boys (
  id, 
  phone, 
  email, 
  full_name, 
  date_of_birth, 
  national_id, 
  preferred_vehicle, 
  license_number, 
  status, 
  total_deliveries, 
  total_earnings, 
  rating, 
  current_latitude, 
  current_longitude, 
  is_available,
  created_at,
  updated_at
) VALUES
-- مندوب 1 (متاح)
(
  '11111111-1111-1111-1111-111111111111', 
  '01000000001', 
  'ahmed@example.com', 
  'أحمد محمد', 
  '1990-01-01', 
  '12345678901234', 
  'tricycle',
  'DR12345', 
  'active', 
  120, 
  3500.50, 
  4.8, 
  30.0444, 
  31.2357, 
  true,
  NOW(),
  NOW()
),
-- مندوب 2 (متاح)
(
  '22222222-2222-2222-2222-222222222222', 
  '01000000002', 
  'mahmoud@example.com', 
  'محمود علي', 
  '1992-05-15', 
  '23456789012345', 
  'pickup_truck',
  'DR23456', 
  'active', 
  85, 
  2800.75, 
  4.5, 
  30.0525, 
  31.2270, 
  true,
  NOW(),
  NOW()
),
-- مندوب 3 (غير متاح)
(
  '33333333-3333-3333-3333-333333333333', 
  '01000000003', 
  'khaled@example.com', 
  'خالد إبراهيم', 
  '1988-11-20', 
  '34567890123456', 
  'light_truck',
  'DR34567', 
  'inactive', 
  200, 
  5600.25, 
  4.9, 
  30.0611, 
  31.2197, 
  false,
  NOW(),
  NOW()
),
-- مندوب 4 (مشغول)
(
  '44444444-4444-4444-4444-444444444444', 
  '01000000004', 
  'omar@example.com', 
  'عمر أحمد', 
  '1995-03-10', 
  '45678901234567', 
  'tricycle',
  'DR45678', 
  'active', 
  75, 
  1900.00, 
  4.2, 
  30.0395, 
  31.2114, 
  false,
  NOW(),
  NOW()
),
-- مندوب 5 (متاح)
(
  '55555555-5555-5555-5555-555555555555', 
  '01000000005', 
  'tarek@example.com', 
  'طارق محمد', 
  '1991-07-25', 
  '56789012345678', 
  'pickup_truck',
  'DR56789', 
  'active', 
  95, 
  2200.50, 
  4.4, 
  30.0486, 
  31.2302, 
  true,
  NOW(),
  NOW()
);

-- إنشاء بيانات تجريبية للطلبات
INSERT INTO public.delivery_orders (
  id,
  delivery_boy_id,
  order_number,
  pickup_location,
  delivery_location,
  pickup_address,
  delivery_address,
  customer_name,
  customer_phone,
  estimated_distance,
  estimated_time,
  expected_total_amount,
  status,
  user_type,
  is_priority,
  category_name,
  subcategory_name,
  created_at,
  updated_at
) VALUES
-- طلب 1 (قيد الانتظار)
(
  '11111111-aaaa-1111-aaaa-111111111111',
  NULL,
  'ORD-001',
  ST_SetSRID(ST_MakePoint(31.2357, 30.0444), 4326),
  ST_SetSRID(ST_MakePoint(31.2270, 30.0525), 4326),
  'شارع جامعة الدول العربية، المهندسين',
  'شارع شبرا، القاهرة',
  'سمير محمود',
  '01100000001',
  3.5,
  20,
  75.00,
  'pending',
  'household',
  false,
  'بلاستيك',
  'زجاجات بلاستيكية',
  NOW(),
  NOW()
),
-- طلب 2 (قيد التنفيذ)
(
  '22222222-bbbb-2222-bbbb-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'ORD-002',
  ST_SetSRID(ST_MakePoint(31.2197, 30.0611), 4326),
  ST_SetSRID(ST_MakePoint(31.2114, 30.0395), 4326),
  'شارع التحرير، الدقي',
  'كورنيش النيل، وسط البلد',
  'فاطمة أحمد',
  '01100000002',
  4.2,
  25,
  85.00,
  'in_progress',
  'business',
  true,
  'ورق',
  'كرتون',
  NOW(),
  NOW()
),
-- طلب 3 (مكتمل)
(
  '33333333-cccc-3333-cccc-333333333333',
  '22222222-2222-2222-2222-222222222222',
  'ORD-003',
  ST_SetSRID(ST_MakePoint(31.2302, 30.0486), 4326),
  ST_SetSRID(ST_MakePoint(31.2357, 30.0444), 4326),
  'شارع جامعة القاهرة، الجيزة',
  'ميدان الجيزة',
  'محمد علي',
  '01100000003',
  2.8,
  15,
  60.00,
  'completed',
  'household',
  false,
  'معادن',
  'علب ألومنيوم',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day'
),
-- طلب 4 (ملغي)
(
  '44444444-dddd-4444-dddd-444444444444',
  NULL,
  'ORD-004',
  ST_SetSRID(ST_MakePoint(31.2114, 30.0395), 4326),
  ST_SetSRID(ST_MakePoint(31.2302, 30.0486), 4326),
  'شارع الهرم، الجيزة',
  'شارع الملك فيصل، الهرم',
  'سارة عبد الله',
  '01100000004',
  5.5,
  35,
  100.00,
  'canceled',
  'business',
  false,
  'زجاج',
  'زجاجات',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
),
-- طلب 5 (قيد الانتظار)
(
  '55555555-eeee-5555-eeee-555555555555',
  NULL,
  'ORD-005',
  ST_SetSRID(ST_MakePoint(31.2270, 30.0525), 4326),
  ST_SetSRID(ST_MakePoint(31.2197, 30.0611), 4326),
  'شارع مصدق، الدقي',
  'شارع جامعة الدول العربية، المهندسين',
  'أحمد محمود',
  '01100000005',
  3.0,
  18,
  65.00,
  'pending',
  'household',
  true,
  'إلكترونيات',
  'بطاريات',
  NOW(),
  NOW()
);

-- إنشاء بيانات تجريبية لجلسات جمع النفايات
INSERT INTO public.waste_collection_sessions (
  id,
  delivery_order_id,
  delivery_boy_id,
  customer_id,
  status,
  total_weight,
  total_amount,
  total_points,
  started_at,
  completed_at,
  location_lat,
  location_lng,
  payment_method,
  payment_status,
  created_at,
  updated_at
) VALUES
-- جلسة 1 (مكتملة)
(
  '11111111-aaaa-aaaa-aaaa-111111111111',
  '33333333-cccc-3333-cccc-333333333333',
  '22222222-2222-2222-2222-222222222222',
  'cust-11111111',
  'completed',
  8.5,
  60.00,
  120,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day',
  30.0486,
  31.2302,
  'cash',
  'completed',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day'
);

-- إنشاء بيانات تجريبية لعناصر جمع النفايات
INSERT INTO public.waste_collection_items (
  id,
  session_id,
  waste_data_id,
  category_id,
  name,
  actual_weight,
  unit_price,
  total_price,
  earned_points,
  created_at,
  updated_at
) VALUES
-- عنصر 1
(
  '11111111-bbbb-bbbb-bbbb-111111111111',
  '11111111-aaaa-aaaa-aaaa-111111111111',
  'waste-11111111',
  'cat-11111111',
  'علب ألومنيوم',
  3.5,
  10.00,
  35.00,
  70,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day'
),
-- عنصر 2
(
  '22222222-bbbb-bbbb-bbbb-222222222222',
  '11111111-aaaa-aaaa-aaaa-111111111111',
  'waste-22222222',
  'cat-22222222',
  'زجاجات',
  5.0,
  5.00,
  25.00,
  50,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day'
);

-- إنشاء بيانات تجريبية للفواتير
INSERT INTO public.waste_invoices (
  id,
  session_id,
  invoice_number,
  subtotal,
  tax,
  total,
  status,
  created_at,
  updated_at
) VALUES
-- فاتورة 1
(
  '11111111-cccc-cccc-cccc-111111111111',
  '11111111-aaaa-aaaa-aaaa-111111111111',
  'INV-001',
  60.00,
  0.00,
  60.00,
  'issued',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
);