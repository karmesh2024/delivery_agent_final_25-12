# دليل تطوير تطبيق الإدارة (Admin Application Guide)

## مقدمة

هذا الدليل موجه خصيصًا لمبرمجي تطبيق الإدارة (Admin Dashboard) المسؤولين عن تطوير لوحة تحكم المشرفين لنظام مندوب التوصيل (Delivery Karmesh). يهدف هذا الدليل إلى توفير المعلومات والإرشادات اللازمة لبناء تطبيق إدارة متكامل يتفاعل مع قاعدة البيانات الحالية ويوفر للمشرفين أدوات فعالة لإدارة النظام بأكمله.

هذا الدليل يعد مكملاً للتوثيق الموجود في:
- `actual_database_documentation.md`: توثيق شامل لقاعدة البيانات
- `application_development_documentation.md`: توثيق تفصيلي لكيفية بناء تطبيق المندوب

## 1. نظرة عامة على تطبيق الإدارة

تطبيق الإدارة هو واجهة رسومية تمكّن المشرفين من:
1. مراقبة أداء المندوبين في الوقت الفعلي
2. إدارة المندوبين (إضافة، تعديل، تفعيل/تعطيل)
3. متابعة الطلبات وحالتها
4. عرض إحصاءات وتقارير مفصلة
5. إدارة أسعار المخلفات وفئاتها
6. تتبع المدفوعات والفواتير
7. إدارة حسابات العملاء
8. عرض خرائط ومناطق التغطية

## 2. الواجهات البرمجية (APIs) المتاحة

### 2.1 واجهة Supabase المباشرة

تستخدم قاعدة البيانات Supabase كخلفية، وتوفر Supabase واجهة RESTful API و Realtime API يمكن استخدامها مباشرة في تطبيق الإدارة.

#### مثال للتوثيق للمطورين:

```javascript
// الاتصال بـ Supabase من تطبيق الويب
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_KEY'
const supabase = createClient(supabaseUrl, supabaseKey)

// مثال لجلب المندوبين النشطين
const getActiveDeliveryBoys = async () => {
  const { data, error } = await supabase
    .from('delivery_boys')
    .select('id, full_name, phone, online_status, current_latitude, current_longitude, total_deliveries, rating')
    .eq('status', 'active')
    .order('rating', { ascending: false })

  if (error) {
    console.error('Error fetching delivery boys:', error)
    return []
  }
  return data
}
```

### 2.2 وظائف RPC المتاحة

توفر قاعدة البيانات العديد من وظائف RPC (Remote Procedure Call) التي يمكن استدعاؤها من واجهة الإدارة:

#### 1. إدارة المندوبين
- `update_delivery_boy_availability(user_id UUID, available BOOLEAN)`
- `update_delivery_boy_location(user_id UUID, lat NUMERIC, lng NUMERIC)`
- `find_nearby_available_delivery_boys(lat NUMERIC, lng NUMERIC, distance_km NUMERIC)`
- `smart_assign_order(order_id UUID)`

#### 2. إدارة الطلبات
- `complete_order(order_id UUID, notes TEXT)`
- `get_order_tracking_points(order_id_param UUID)`
- `get_effective_order_status(order_id UUID)`
- `direct_update_order_to_completed(order_id UUID, notes TEXT)`

#### 3. إدارة المخلفات والفواتير
- `get_invoice_by_id(p_invoice_id UUID)`
- `get_invoice_by_session_id(p_session_id UUID)`
- `send_invoice_to_customer(p_invoice_id UUID)`
- `update_invoice_approval_status(p_invoice_id UUID, p_status TEXT, p_comment TEXT)`
- `get_waste_type_stats(p_start_date TIMESTAMP, p_end_date TIMESTAMP)`

### 2.3 الاشتراك في تحديثات الوقت الفعلي

يمكن استخدام ميزة Realtime في Supabase للاشتراك في تحديثات الجداول المهمة:

```javascript
// مثال للاشتراك في تحديثات حالة المندوبين في الوقت الفعلي
const subscribeToDeliveryBoysStatus = () => {
  const subscription = supabase
    .from('delivery_boys')
    .on('UPDATE', payload => {
      console.log('تم تحديث حالة المندوب:', payload.new)
      // تحديث واجهة المستخدم هنا
    })
    .subscribe()

  return subscription
}

// مثال للاشتراك في الطلبات الجديدة
const subscribeToNewOrders = () => {
  const subscription = supabase
    .from('delivery_orders')
    .on('INSERT', payload => {
      console.log('طلب جديد:', payload.new)
      // تحديث واجهة المستخدم هنا
    })
    .subscribe()

  return subscription
}
```

## 3. استعلامات SQL مفيدة للمشرفين

### 3.1 استعلام لعرض أداء المندوبين

```sql
-- استعلام تفصيلي لأداء المندوبين خلال فترة معينة
SELECT 
  db.id, 
  db.full_name, 
  db.phone,
  COUNT(CASE WHEN do.status = 'completed' THEN 1 ELSE NULL END) AS completed_orders,
  COUNT(CASE WHEN do.status = 'canceled' THEN 1 ELSE NULL END) AS canceled_orders,
  SUM(CASE WHEN do.status = 'completed' THEN do.actual_total_amount ELSE 0 END) AS total_earnings,
  AVG(CASE WHEN do.status = 'completed' THEN 
      EXTRACT(EPOCH FROM (do.actual_delivery_time - do.created_at))/60 
    ELSE NULL END) AS avg_delivery_time_minutes,
  ROUND(AVG(dr.rating), 2) AS average_rating
FROM 
  delivery_boys db
LEFT JOIN 
  delivery_orders do ON db.id = do.delivery_boy_id AND do.created_at BETWEEN :start_date AND :end_date
LEFT JOIN 
  delivery_ratings dr ON db.id = dr.delivery_id
GROUP BY 
  db.id, db.full_name, db.phone
ORDER BY 
  completed_orders DESC;
```

### 3.2 استعلام لتحليل المخلفات المجمعة

```sql
-- تحليل المخلفات المجمعة حسب النوع والفئة
SELECT 
  c.name AS category_name,
  sc.name AS subcategory_name,
  SUM(wci.actual_weight) AS total_weight,
  SUM(wci.total_price) AS total_revenue,
  COUNT(DISTINCT wcs.id) AS session_count
FROM 
  waste_collection_items wci
JOIN 
  waste_collection_sessions wcs ON wci.session_id = wcs.id
JOIN 
  categories c ON wci.category_id = c.id
LEFT JOIN 
  subcategories sc ON wci.subcategory_id = sc.id
WHERE 
  wcs.completed_at BETWEEN :start_date AND :end_date
GROUP BY 
  c.name, sc.name
ORDER BY 
  total_revenue DESC;
```

### 3.3 استعلام لتحليل الإيرادات حسب المنطقة

```sql
-- تحليل الإيرادات حسب المنطقة
SELECT 
  ca.city, 
  ca.area,
  COUNT(do.id) AS order_count,
  SUM(do.actual_total_amount) AS total_revenue,
  AVG(do.actual_total_amount) AS avg_order_value
FROM 
  delivery_orders do
JOIN 
  customer_addresses ca ON ST_DWithin(do.pickup_location, ca.geom, 100)
WHERE 
  do.status = 'completed'
  AND do.created_at BETWEEN :start_date AND :end_date
GROUP BY 
  ca.city, ca.area
ORDER BY 
  total_revenue DESC;
```

### 3.4 استعلام للكشف عن المندوبين غير النشطين

```sql
-- المندوبين المتصلين لكن غير نشطين (قد يحتاج لتدخل)
SELECT 
  db.id, 
  db.full_name, 
  db.phone, 
  db.online_status, 
  db.last_location_update,
  db.last_login
FROM 
  delivery_boys db
WHERE 
  db.online_status = 'online' 
  AND (db.status = 'inactive' OR (db.status = 'active' AND NOT db.is_available))
  AND db.last_location_update > NOW() - INTERVAL '24 hours'
ORDER BY 
  db.last_login DESC;
```

## 4. هيكل لوحة تحكم المشرفين المقترح

### 4.1 الصفحة الرئيسية (Dashboard)

**المكونات المقترحة:**
- لوحة معلومات تفاعلية مع أهم المؤشرات:
  - عدد الطلبات النشطة
  - عدد المندوبين المتصلين
  - إجمالي المخلفات المجمعة اليوم
  - الإيرادات اليومية
- خريطة تفاعلية تعرض مواقع المندوبين والطلبات
- رسم بياني للطلبات على مدار اليوم
- رسم بياني للإيرادات الأسبوعية
- قائمة بأحدث الطلبات
- قائمة بأعلى المندوبين أداءً

### 4.2 إدارة المندوبين

**المكونات المقترحة:**
- جدول تفاعلي لجميع المندوبين مع إمكانيات البحث والتصفية
- صفحة تفاصيل لكل مندوب تعرض:
  - المعلومات الشخصية
  - إحصاءات الأداء
  - التقييمات والتعليقات
  - تاريخ الطلبات
  - سجل الأماكن
- أدوات لإدارة المندوبين:
  - تفعيل/تعطيل حساب
  - تعديل البيانات
  - تغيير المناطق المفضلة
  - تتبع على الخريطة

### 4.3 إدارة الطلبات

**المكونات المقترحة:**
- جدول تفاعلي للطلبات مع تصفية حسب الحالة
- خريطة لعرض مواقع الطلبات النشطة
- صفحة تفاصيل للطلب تعرض:
  - معلومات العميل
  - حالة الطلب الحالية
  - تاريخ تغييرات الحالة
  - المندوب المخصص
  - تفاصيل المنتجات
  - المبالغ والمدفوعات
  - مسار التوصيل على الخريطة
- أدوات لإدارة الطلبات:
  - تعيين مندوب للطلب
  - تغيير حالة الطلب
  - إلغاء الطلب
  - التواصل مع العميل
  - التواصل مع المندوب

### 4.4 إدارة المخلفات والفواتير

**المكونات المقترحة:**
- جدول لجلسات جمع المخلفات مع تصفية حسب الحالة
- صفحة لإدارة الفئات وفئاتها الفرعية
- أداة لتحديث الأسعار والنقاط
- صفحة تفاصيل لجلسة جمع المخلفات:
  - العناصر المجمعة وأوزانها
  - الصور والقياسات
  - الفاتورة المرتبطة
  - حالة موافقة العميل
- أدوات لإدارة الفواتير:
  - عرض الفواتير
  - طباعة وتصدير الفواتير
  - إرسال الفواتير للعملاء
  - متابعة حالة الموافقة

### 4.5 التقارير والإحصاءات

**المكونات المقترحة:**
- منشئ تقارير مخصصة مع عدة معايير وتصفية
- تقارير جاهزة:
  - أداء المندوبين
  - إيرادات حسب المنطقة
  - تحليل المخلفات المجمعة
  - تقرير رضا العملاء
  - تحليل وقت التوصيل
- رسوم بيانية وتصويرية:
  - خريطة حرارية للمناطق النشطة
  - رسوم بيانية لاتجاهات الطلبات
  - رسوم بيانية لنسب أنواع المخلفات

## 5. واجهة المستخدم المقترحة

### 5.1 تقنيات الواجهة المقترحة

- **Frontend Framework**: React.js أو Vue.js
- **UI Library**: Material-UI أو Ant Design
- **Charts**: Chart.js أو D3.js
- **Maps**: Mapbox أو Google Maps API
- **Tables**: React Table أو AG Grid
- **State Management**: Redux أو Vuex

### 5.2 توجيهات تصميم الواجهة

- استخدام نفس ألوان العلامة التجارية الموجودة في تطبيق المندوب للحفاظ على التناسق
- تقسيم الشاشة إلى مناطق عمل واضحة
- توفير لوحات معلومات قابلة للتخصيص للمشرفين
- دعم الوضع المظلم وخيارات التخصيص
- تصميم متجاوب يعمل على جميع أحجام الشاشات
- دعم اللغة العربية والإنجليزية

### 5.3 تسلسل التفاعل المقترح

1. شاشة تسجيل الدخول
2. اللوحة الرئيسية مع نظرة عامة
3. تصفح المندوبين/الطلبات/المخلفات من القوائم الجانبية
4. عرض التفاصيل عند النقر على عنصر
5. تنفيذ الإجراءات مثل التعيين أو التحديث من شاشات التفاصيل
6. عرض التنبيهات والإشعارات في الوقت الفعلي

## 6. متطلبات التكامل مع نظام المصادقة

### 6.1 التكامل مع Supabase Auth

تطبيق الإدارة سيحتاج للتكامل مع نظام المصادقة الحالي في Supabase. نوصي باتباع النهج التالي:

```javascript
// مثال لتكامل المصادقة في تطبيق React
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

function AdminLogin() {
  return (
    <Auth
      supabaseClient={supabase}
      appearance={{ theme: ThemeSupa }}
      theme="dark"
      providers={[]}
      redirectTo="/admin/dashboard"
    />
  )
}
```

### 6.2 التحقق من صلاحيات المشرف

يجب التحقق من أن المستخدم الحالي لديه دور المشرف قبل السماح بالوصول إلى لوحة التحكم:

```javascript
// مثال للتحقق من صلاحيات المشرف
const checkAdminPermissions = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  // التحقق من وجود المستخدم في جدول المشرفين
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  if (error || !data) {
    console.error('User is not an admin:', error)
    return false
  }
  
  return data.is_active === true
}
```

### 6.3 ضبط سياسات RLS في Supabase

تأكد من تحديث سياسات Row Level Security (RLS) في Supabase للسماح للمشرفين بالوصول إلى البيانات:

```sql
-- مثال لسياسة تمنح المشرفين صلاحيات القراءة لجميع الطلبات
CREATE POLICY "Admins can view all orders" ON delivery_orders
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );
  
-- مثال لسياسة تمنح المشرفين صلاحيات التحديث للمندوبين
CREATE POLICY "Admins can update delivery boys" ON delivery_boys
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );
```

## 7. إدارة الإشعارات

### 7.1 إشعارات في الوقت الفعلي

يمكن استخدام Supabase Realtime للاشتراك في الأحداث والتحديثات الهامة:

```javascript
// مثال للاشتراك في إشعارات النظام
const subscribeToSystemNotifications = () => {
  const subscription = supabase
    .from('system_notifications')
    .on('INSERT', payload => {
      // عرض إشعار للمشرف
      notifyAdmin({
        title: payload.new.title,
        message: payload.new.message,
        type: payload.new.type
      })
    })
    .subscribe()

  return subscription
}
```

### 7.2 إرسال إشعارات للمندوبين

يمكن للمشرفين إرسال إشعارات للمندوبين من خلال إضافة سجلات في جدول `system_notifications`:

```javascript
// مثال لإرسال إشعار لمندوب
const sendNotificationToDeliveryBoy = async (deliveryBoyId, title, message) => {
  const { data, error } = await supabase
    .from('system_notifications')
    .insert([
      {
        type: 'admin_message',
        title,
        message,
        target_role: 'delivery_boy',
        target_user_id: deliveryBoyId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // تنتهي بعد أسبوع
      }
    ])
  
  if (error) {
    console.error('Error sending notification:', error)
    return false
  }
  
  return true
}
```

## 8. نصائح للتطوير الناجح

### 8.1 أفضل الممارسات

- **التطوير التدريجي**: ابدأ بالميزات الأساسية ثم أضف تدريجياً
- **الاختبار المستمر**: تأكد من اختبار كل ميزة مع قاعدة البيانات الفعلية
- **التوثيق**: وثق واجهات API وأي تغييرات على قاعدة البيانات
- **أمان البيانات**: تأكد من تنفيذ ضوابط الوصول المناسبة
- **واجهة مستخدم متجاوبة**: تأكد أن التطبيق يعمل على مختلف الأجهزة

### 8.2 أمور يجب تجنبها

- لا تقم بتعديل بنية قاعدة البيانات الحالية دون تنسيق مع فريق تطوير تطبيق المندوب
- تجنب الاستعلامات الثقيلة التي قد تؤثر على أداء تطبيق المندوب
- لا تقم بتجاوز سياسات الأمان الموجودة في Supabase
- تجنب الإفراط في استخدام تحديثات الوقت الفعلي لتوفير موارد الخادم
- لا تخزن المعلومات الحساسة في وحدة تخزين الجلسة

## 9. موارد إضافية

### 9.1 وثائق Supabase
- [Supabase Documentation](https://supabase.io/docs)
- [Supabase JavaScript SDK](https://supabase.io/docs/reference/javascript/introduction)
- [Supabase Auth](https://supabase.io/docs/guides/auth)
- [Supabase Realtime](https://supabase.io/docs/guides/realtime)

### 9.2 مكتبات مفيدة
- [React Admin](https://marmelab.com/react-admin/)
- [Recharts](https://recharts.org/)
- [React Map GL](https://visgl.github.io/react-map-gl/)
- [Material UI](https://mui.com/)
- [Apex Charts](https://apexcharts.com/)

### 9.3 مصادر التعلم
- [Building a Dashboard with React and Supabase](https://www.freecodecamp.org/news/build-a-dashboard-with-react-and-supabase/)
- [Creating Reports with PostgreSQL](https://www.postgresql.org/docs/current/queries.html)
- [Google Maps API Documentation](https://developers.google.com/maps/documentation)

## 10. خطة التطوير المقترحة

### المرحلة 1: الإعداد والأساسيات (2-3 أسابيع)
- إعداد مشروع React/Vue
- تكامل مع Supabase
- تنفيذ نظام المصادقة والصلاحيات
- إنشاء هيكل التطبيق الأساسي
- تطوير اللوحة الرئيسية البسيطة

### المرحلة 2: ميزات المندوبين والطلبات (3-4 أسابيع)
- تطوير واجهة إدارة المندوبين
- تطوير واجهة إدارة الطلبات
- تنفيذ التتبع على الخريطة
- تنفيذ التنبيهات والإشعارات

### المرحلة 3: إدارة المخلفات والفواتير (2-3 أسابيع)
- تطوير واجهة إدارة المخلفات
- تطوير واجهة إدارة الفواتير
- تنفيذ تحميل وعرض المستندات

### المرحلة 4: التقارير والتحليلات (2-3 أسابيع)
- تطوير واجهة التقارير
- إنشاء الرسوم البيانية والتصورات
- تنفيذ منشئ التقارير المخصص

### المرحلة 5: التحسين والإطلاق (2 أسابيع)
- اختبار الأداء والتحسين
- اختبار المستخدم واجتماعات المراجعة
- التوثيق النهائي والتدريب
- الإطلاق النهائي

## 11. الخاتمة

تطوير تطبيق إدارة فعال للمشرفين سيعزز بشكل كبير كفاءة نظام مندوب التوصيل (Delivery Karmesh) ويوفر أدوات قيمة لإدارة ومراقبة جميع جوانب العمل. من خلال اتباع هذا الدليل والتعاون مع فريق تطوير تطبيق المندوب، يمكن بناء تطبيق إدارة متكامل ومتميز.

هذا الدليل، جنبًا إلى جنب مع توثيق قاعدة البيانات وتوثيق تطبيق المندوب، يوفر نظرة شاملة وخارطة طريق واضحة لتطوير تطبيق الإدارة. نشجع المطورين على التواصل مع فريق تطبيق المندوب لأي استفسارات أو توضيحات إضافية.