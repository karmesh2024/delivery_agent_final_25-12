# اقتراحات لتحسين وتطوير قواعد البيانات للتطبيق

## مقدمة

بعد مراجعة قواعد البيانات الفعلية المستخدمة في التطبيق ومقارنتها بالنموذج المقترح سابقاً، هذا المستند يقدم مجموعة من الاقتراحات لتحسين وتطوير قواعد البيانات. الهدف هو تقديم رؤية شاملة لكيفية تعزيز وظائف التطبيق من خلال تحسين هيكل قاعدة البيانات.

## مقارنة بين النموذجين

### الجداول المشتركة في كلا النموذجين
تشترك كلا النموذجين في الجداول الأساسية مثل:
- جداول مندوبي التوصيل (delivery_boys)
- جداول طلبات التوصيل (delivery_orders)
- جداول تاريخ حالة الطلبات (delivery_status_history)
- جداول تتبع الطلبات (order_tracking)
- جداول جلسات جمع النفايات (waste_collection_sessions)
- جداول عناصر جمع النفايات (waste_collection_items)
- جداول فواتير النفايات (waste_invoices)

### الجداول الموجودة في قاعدة البيانات الفعلية وغير موجودة في النموذج المقترح

1. **جداول متعلقة بمندوبي التوصيل**:
   - delivery_boy_order_history
   - delivery_documents
   - delivery_earnings
   - delivery_locations
   - delivery_performance_stats
   - delivery_ratings
   - delivery_zones
   - new_profiles_delivery

2. **جداول متعلقة بالدفع**:
   - payment_qr_codes
   - payment_settlements
   - wallets

3. **جداول تحسينات أخرى**:
   - waste_weights (جدول مخصص لتخزين معلومات أوزان النفايات)

### الجداول المقترحة غير الموجودة في قاعدة البيانات الفعلية

بناءً على المراجعة، لا يوجد جداول في النموذج المقترح سابقاً غير موجودة في قاعدة البيانات الفعلية. بل على العكس، قاعدة البيانات الفعلية أكثر شمولاً وتفصيلاً.

## اقتراحات لتحسين قاعدة البيانات الحالية

### 1. توحيد جداول مندوبي التوصيل

لوحظ وجود تكرار بين جدولي `delivery_boys` و `new_profiles_delivery`. يمكن توحيد هذين الجدولين لتبسيط هيكل قاعدة البيانات وتجنب الارتباك:

**الاقتراح**: 
- تحديد أي من الجدولين هو الرئيسي للاستخدام (يبدو أن `delivery_boys` هو الأكثر اكتمالاً)
- نقل البيانات من الجدول الآخر إلى الجدول الرئيسي
- تحديث جميع المراجع والوظائف المرتبطة

**الفوائد**:
- تبسيط هيكل قاعدة البيانات
- تجنب الارتباك في استخدام الجداول
- تحسين أداء الاستعلامات

### 2. تحسين هيكل بيانات المواقع الجغرافية

هناك تنوع في كيفية تخزين بيانات المواقع الجغرافية عبر الجداول المختلفة:

**الاقتراح**:
- استخدام نوع البيانات `geometry` بشكل موحد في جميع الجداول بدلاً من تخزين الإحداثيات كأعمدة منفصلة
- إنشاء وظائف مساعدة مشتركة للتعامل مع البيانات الجغرافية
- استخدام مؤشرات GiST لتحسين أداء الاستعلامات الجغرافية

**الفوائد**:
- تحسين أداء استعلامات البحث الجغرافي
- توحيد طريقة التعامل مع البيانات الجغرافية
- تبسيط عمليات حساب المسافات والمناطق

### 3. تعزيز نظام المحافظ والمدفوعات

نظام المحافظ والمدفوعات في قاعدة البيانات الحالية بسيط نسبياً ويمكن تعزيزه:

**الاقتراح**:
- إضافة جدول `wallet_transactions` لتسجيل جميع المعاملات المتعلقة بالمحافظ
- ربط المعاملات بالطلبات والفواتير
- إضافة حقول لتتبع رسوم المعاملات والضرائب

```sql
CREATE TABLE public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL,
  amount numeric(10, 2) NOT NULL,
  transaction_type character varying(20) NOT NULL,
  reference_id uuid NULL,
  reference_type character varying(20) NULL,
  status character varying(20) NOT NULL DEFAULT 'completed',
  description text NULL,
  fees numeric(10, 2) NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT wallet_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES wallets (id)
)
```

**الفوائد**:
- تتبع أفضل لحركة الأموال
- تحسين تقارير الأداء المالي
- دعم للخصومات والعروض الترويجية

### 4. تحسين إدارة النقاط والمكافآت

الجداول الحالية تتضمن حقولاً للنقاط المكتسبة، لكن يمكن تحسين هذا النظام:

**الاقتراح**:
- إضافة جدول `customer_points` لتتبع نقاط العملاء
- إضافة جدول `point_transactions` لتسجيل معاملات النقاط
- إنشاء جدول `rewards` لإدارة المكافآت المتاحة للعملاء

```sql
CREATE TABLE public.customer_points (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  total_points numeric(10, 2) NOT NULL DEFAULT 0,
  points_available numeric(10, 2) NOT NULL DEFAULT 0,
  points_redeemed numeric(10, 2) NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customer_points_pkey PRIMARY KEY (id),
  CONSTRAINT customer_points_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES new_profiles (id)
)

CREATE TABLE public.point_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  order_id uuid NULL,
  amount numeric(10, 2) NOT NULL,
  transaction_type character varying(20) NOT NULL,
  status character varying(20) NOT NULL DEFAULT 'completed',
  description text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT point_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT point_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES new_profiles (id)
)
```

**الفوائد**:
- نظام نقاط أكثر تفصيلاً وشفافية
- إمكانية تنفيذ برامج ولاء متقدمة
- تحسين تجربة المستخدم من خلال المكافآت

### 5. تحسين إدارة الوثائق والصور

لوحظ وجود حقول متعددة لتخزين روابط الصور والوثائق، لكن يمكن تنظيمها بشكل أفضل:

**الاقتراح**:
- توحيد جميع الملفات المرفقة في جدول واحد (`attachments`)
- ربط الملفات المرفقة بالكيانات المختلفة (مندوبي التوصيل، الطلبات، عناصر النفايات، إلخ)

```sql
CREATE TABLE public.attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  entity_type character varying(50) NOT NULL,
  file_type character varying(50) NOT NULL,
  file_url text NOT NULL,
  file_name character varying(255) NULL,
  file_size integer NULL,
  mime_type character varying(100) NULL,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT attachments_pkey PRIMARY KEY (id)
)
```

**الفوائد**:
- تنظيم أفضل للملفات المرفقة
- سهولة الوصول إلى جميع الملفات المرتبطة بكيان معين
- تحسين أداء إدارة الملفات

### 6. إضافة نظام الإشعارات

لتحسين تجربة المستخدم وتوفير معلومات فورية، يمكن إضافة نظام إشعارات:

**الاقتراح**:
- إضافة جدول `notifications` لتخزين جميع الإشعارات
- ربط الإشعارات بالمستخدمين والأحداث المختلفة

```sql
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title character varying(255) NOT NULL,
  message text NOT NULL,
  type character varying(50) NOT NULL,
  reference_id uuid NULL,
  reference_type character varying(50) NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
)
```

**الفوائد**:
- إمكانية إرسال إشعارات مختلفة للمستخدمين
- تحسين الاتصال والتواصل مع المستخدمين
- تحسين تجربة المستخدم من خلال معلومات فورية

### 7. تعزيز نظام جمع البيانات التحليلية

لتحسين فهم استخدام التطبيق واتخاذ قرارات أفضل، يمكن إضافة نظام لجمع البيانات التحليلية:

**الاقتراح**:
- إضافة جدول `analytics_events` لتسجيل أحداث استخدام التطبيق
- إضافة جدول `user_sessions` لتتبع جلسات المستخدمين

```sql
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  event_type character varying(50) NOT NULL,
  event_data jsonb NULL,
  client_info jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id)
)

CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_info jsonb NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone NULL,
  duration integer NULL,
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
)
```

**الفوائد**:
- فهم أفضل لسلوك المستخدمين
- تحديد المشكلات وفرص التحسين
- تحسين اتخاذ القرارات بناءً على البيانات

## اقتراحات لتعزيز الوظائف الحالية

### 1. تعزيز نظام الجدولة والتذكيرات

نظام الجدولة الحالي (جدول `order_schedule`) يمكن تعزيزه:

**الاقتراح**:
- تحسين جدول `order_schedule` بإضافة حقول للمرونة في تحديد المواعيد
- إضافة دعم لتكرار المواعيد للعملاء المنتظمين
- إضافة نظام تذكيرات أكثر تفصيلاً

**الفوائد**:
- تحسين تجربة تحديد المواعيد للعملاء
- تحسين إدارة جداول مندوبي التوصيل
- تقليل حالات إلغاء أو تفويت المواعيد

### 2. تحسين نظام العروض والخصومات

يمكن إضافة نظام للعروض والخصومات:

**الاقتراح**:
- إضافة جدول `promotions` لإدارة العروض الترويجية
- إضافة جدول `coupons` لإدارة كوبونات الخصم
- ربط العروض والخصومات بالطلبات والعملاء

```sql
CREATE TABLE public.promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(255) NOT NULL,
  description text NULL,
  discount_type character varying(20) NOT NULL,
  discount_value numeric(10, 2) NOT NULL,
  minimum_order_amount numeric(10, 2) NULL,
  maximum_discount numeric(10, 2) NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT promotions_pkey PRIMARY KEY (id)
)

CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code character varying(50) NOT NULL,
  promotion_id uuid NOT NULL,
  usage_limit integer NULL,
  usage_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coupons_pkey PRIMARY KEY (id),
  CONSTRAINT coupons_code_key UNIQUE (code),
  CONSTRAINT coupons_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES promotions (id)
)
```

**الفوائد**:
- زيادة ولاء العملاء من خلال العروض والخصومات
- جذب عملاء جدد
- زيادة حجم الطلبات والإيرادات

### 3. تحسين الأداء باستخدام الفهارس والتقسيم

يمكن تحسين أداء قاعدة البيانات الحالية:

**الاقتراح**:
- إضافة فهارس إضافية للحقول المستخدمة بشكل متكرر في الاستعلامات
- تقسيم الجداول الكبيرة مثل `order_tracking` و `delivery_status_history` حسب التاريخ
- تحسين استراتيجيات التخزين المؤقت

**الفوائد**:
- تحسين أداء الاستعلامات
- تحسين قابلية التوسع مع نمو البيانات
- تقليل وقت الاستجابة للمستخدمين

## اقتراحات للميزات الجديدة

### 1. نظام لإدارة المخزون

إضافة نظام لإدارة مخزون النفايات المجمعة:

**الاقتراح**:
- إضافة جدول `waste_inventory` لتتبع مخزون النفايات المجمعة
- إضافة جدول `waste_inventory_transactions` لتسجيل حركة المخزون

```sql
CREATE TABLE public.waste_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  subcategory_id uuid NULL,
  warehouse_id uuid NOT NULL,
  current_quantity numeric(10, 2) NOT NULL DEFAULT 0,
  minimum_quantity numeric(10, 2) NULL,
  maximum_quantity numeric(10, 2) NULL,
  unit character varying(20) NOT NULL DEFAULT 'kg',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT waste_inventory_pkey PRIMARY KEY (id),
  CONSTRAINT waste_inventory_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories (id)
)

CREATE TABLE public.waste_inventory_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL,
  session_id uuid NULL,
  transaction_type character varying(20) NOT NULL,
  quantity numeric(10, 2) NOT NULL,
  notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT waste_inventory_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT waste_inventory_transactions_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES waste_inventory (id)
)
```

**الفوائد**:
- تتبع مخزون النفايات المجمعة
- تحسين إدارة المستودعات
- تحسين عمليات البيع والتسويق للنفايات المجمعة

### 2. نظام لإدارة التقارير

إضافة نظام لإنشاء وإدارة التقارير:

**الاقتراح**:
- إضافة جدول `reports` لتخزين التقارير المنشأة
- إضافة جدول `report_schedules` لجدولة التقارير

```sql
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(255) NOT NULL,
  description text NULL,
  report_type character varying(50) NOT NULL,
  parameters jsonb NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id)
)

CREATE TABLE public.report_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL,
  schedule_type character varying(20) NOT NULL,
  schedule_parameters jsonb NULL,
  recipients jsonb NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT report_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT report_schedules_report_id_fkey FOREIGN KEY (report_id) REFERENCES reports (id)
)
```

**الفوائد**:
- توفير معلومات تفصيلية عن أداء التطبيق
- مساعدة في اتخاذ القرارات بناءً على البيانات
- تحسين الشفافية مع العملاء والشركاء

### 3. نظام لإدارة الرسائل والتواصل

إضافة نظام لإدارة التواصل بين المستخدمين:

**الاقتراح**:
- إضافة جدول `conversations` لتخزين المحادثات
- إضافة جدول `messages` لتخزين الرسائل

```sql
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  topic character varying(255) NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id)
)

CREATE TABLE public.conversation_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversation_participants_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations (id),
  CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
)

CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message_type character varying(20) NOT NULL DEFAULT 'text',
  content text NOT NULL,
  attachment_url text NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations (id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users (id)
)
```

**الفوائد**:
- تحسين التواصل بين العملاء ومندوبي التوصيل
- تخزين سجل كامل للتواصل
- تحسين دعم العملاء

## الختام

قاعدة البيانات الحالية توفر أساساً قوياً لتطبيق توصيل النفايات، لكن يمكن تعزيزها وتحسينها من خلال الاقتراحات المذكورة أعلاه. تنفيذ هذه التحسينات سيعزز من أداء التطبيق، ويحسن تجربة المستخدم، ويوفر معلومات أفضل لاتخاذ القرارات.

من المهم تنفيذ هذه التغييرات بحذر وخطة دقيقة، مع اختبار كل تغيير بشكل مناسب قبل نشره في بيئة الإنتاج. كما يجب مراعاة تأثير هذه التغييرات على الأداء وحجم البيانات والنسخ الاحتياطي.