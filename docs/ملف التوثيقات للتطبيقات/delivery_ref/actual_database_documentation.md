# توثيق قاعدة البيانات المستخدمة في تطبيق مندوب التوصيل (Delivery Karmesh)

## مقدمة

يقدم هذا المستند توثيقًا شاملًا لقاعدة البيانات المستخدمة حاليًا في تطبيق مندوب التوصيل (Delivery Karmesh)، استنادًا إلى الكود المصدري للتطبيق وبنية قاعدة البيانات SQL. يهدف هذا التوثيق إلى توفير فهم عميق للهيكل الحالي لقاعدة البيانات والعلاقات بين مكوناتها وكيفية تفاعلها مع التطبيق.

## نظرة عامة على قاعدة البيانات

تستخدم قاعدة البيانات خدمة Supabase كمنصة أساسية، وهي مبنية على PostgreSQL. يتفاعل التطبيق مع قاعدة البيانات من خلال العميل الرسمي لـ Supabase وذلك باستخدام الهيكل المعماري النظيف (Clean Architecture) المكون من الطبقات التالية:

1. **طبقة العرض (Presentation)**: تستخدم BLoC لإدارة حالة التطبيق.
2. **طبقة منطق الأعمال (Domain)**: تحتوي على واجهات المستودعات وحالات الاستخدام (UseCases).
3. **طبقة البيانات (Data)**: تحتوي على تنفيذات المستودعات ومصادر البيانات.

## جداول قاعدة البيانات المستخدمة حاليًا

### 1. جداول إدارة حسابات المندوبين

#### 1.1 جدول `delivery_boys` (مندوبي التوصيل)

**الاستخدام الفعلي**: يستخدم لتخزين البيانات الأساسية لمندوبي التوصيل وإدارة حالتهم وموقعهم.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
phone VARCHAR(20) NOT NULL,
email VARCHAR(255),
full_name VARCHAR(255) NOT NULL,
date_of_birth DATE,
national_id VARCHAR(50),
preferred_vehicle vehicle_type,
license_number VARCHAR(50),
status delivery_boy_status,
current_latitude NUMERIC(10, 8),
current_longitude NUMERIC(11, 8),
is_available BOOLEAN,
last_location_update TIMESTAMP WITH TIME ZONE,
online_status delivery_boy_online_status,
device_info JSONB,
average_response_time INTEGER,
identity_documents JSONB,
badge_level INTEGER
```

**التريجرز المرتبطة**:
- `check_delivery_boy_type_trigger`: يتحقق من أن المستخدم من نوع مندوب توصيل
- `update_delivery_boys_modtime`: يحدث وقت التعديل

**المراجع في الكود**:
- `profile_bloc.dart`: يستخدم لإدارة حالة المندوب
- `update_availability_usecase.dart`: يحدث حالة توفر المندوب

#### 1.2 جدول `new_profiles_delivery` (الملفات الشخصية للمندوبين)

**الاستخدام الفعلي**: يستخدم لتخزين معلومات الملف الشخصي الموسعة للمندوبين.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
phone VARCHAR(20) NOT NULL,
email VARCHAR(255),
full_name VARCHAR(255) NOT NULL,
national_id VARCHAR(20) NOT NULL,
preferred_vehicle vehicle_type NOT NULL,
license_number VARCHAR(50),
delivery_code VARCHAR(50),
delivery_code_status verification_status,
status delivery_boy_status,
is_available BOOLEAN,
avatar_url TEXT,
preferred_language VARCHAR(10),
referral_code VARCHAR(50)
```

**المراجع في الكود**:
- `init_dependencies.main.dart`: تسجيل خدمات التفاعل مع هذا الجدول
- `profile_bloc.dart`: إدارة بيانات الملفات الشخصية للمندوبين

#### 1.3 جدول `delivery_documents` (وثائق المندوبين)

**الاستخدام الفعلي**: يستخدم لتخزين وثائق المندوبين مثل صور الهوية ورخصة القيادة.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
delivery_id UUID,
document_type VARCHAR(50) NOT NULL,
document_url TEXT NOT NULL,
verification_status VARCHAR(20),
uploaded_at TIMESTAMP WITH TIME ZONE,
verified_at TIMESTAMP WITH TIME ZONE
```

#### 1.4 جدول `delivery_zones` (مناطق عمل المندوبين)

**الاستخدام الفعلي**: يستخدم لتحديد المناطق المفضلة للعمل بالنسبة للمندوبين.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
delivery_id UUID,
zone_name VARCHAR(100) NOT NULL,
is_active BOOLEAN,
created_at TIMESTAMP WITH TIME ZONE
```

### 2. جداول الطلبات والتوصيل

#### 2.1 جدول `delivery_orders` (طلبات التوصيل)

**الاستخدام الفعلي**: الجدول الرئيسي لإدارة طلبات التوصيل المخصصة للمندوبين.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
delivery_boy_id UUID,
customer_order_id UUID,
order_number VARCHAR(50) NOT NULL,
pickup_location GEOMETRY NOT NULL,
pickup_address TEXT NOT NULL,
customer_name VARCHAR(255),
customer_phone VARCHAR(20),
status delivery_status_enum,
expected_total_amount NUMERIC(10, 2),
actual_total_amount NUMERIC(10, 2),
actual_pickup_time TIMESTAMP WITH TIME ZONE,
actual_delivery_time TIMESTAMP WITH TIME ZONE,
notes TEXT,
voice_notes JSONB,
user_type user_type_enum,
category_name TEXT,
subcategory_name TEXT,
analytics_data JSONB,
order_processing_time INTEGER,
customer_waiting_time INTEGER,
priority order_priority_enum,
delivery_location GEOMETRY
```

**التريجرز المرتبطة**:
- `delivery_boy_stats_update`: يحدث إحصائيات المندوب
- `delivery_orders_performance_update`: يحدث أداء التوصيل
- `log_status_change`: يسجل تغييرات الحالة
- `order_status_track_trigger`: يتتبع تغييرات حالة الطلب
- `update_customer_waiting_time`: يحسب وقت انتظار العميل
- `update_delivery_orders_timestamp`: يحدث وقت تعديل الطلبات
- `update_performance_on_completion`: يحدث الأداء عند إتمام الطلب

**المراجع في الكود**:
- `order_card.dart`: عرض بطاقة الطلب في واجهة المستخدم
- `OrdersBlocV2`: إدارة حالة الطلبات في التطبيق

#### 2.2 جدول `order_details` (تفاصيل الطلبات)

**الاستخدام الفعلي**: يستخدم لتخزين تفاصيل المنتجات في كل طلب.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
order_id UUID,
delivery_order_id UUID,
product_name TEXT NOT NULL,
quantity NUMERIC NOT NULL,
price NUMERIC NOT NULL,
earned_points NUMERIC,
notes TEXT,
category_name TEXT,
subcategory_name TEXT
```

**التريجرز المرتبطة**:
- `set_updated_at`: يحدث وقت التعديل

**المراجع في الكود**:
- `OrdersDetailsBloc`: إدارة تفاصيل الطلبات
- `order_details_modal.dart`: عرض تفاصيل الطلب في نافذة منبثقة

#### 2.3 جدول `order_tracking` (تتبع الطلبات)

**الاستخدام الفعلي**: يستخدم لتسجيل نقاط تتبع المندوب أثناء توصيل الطلب.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
order_id UUID NOT NULL,
delivery_boy_id UUID NOT NULL,
latitude DOUBLE PRECISION NOT NULL,
longitude DOUBLE PRECISION NOT NULL,
speed DOUBLE PRECISION,
heading DOUBLE PRECISION,
timestamp TIMESTAMP WITH TIME ZONE,
status delivery_boy_online_status,
active_status delivery_boy_status,
available_for_orders BOOLEAN
```

**السياسات المطبقة**:
- `order_tracking_insert`: تسمح بإدراج نقاط التتبع
- `order_tracking_select`: تسمح بعرض نقاط التتبع

**المراجع في الكود**:
- `OrderTrackingBloc`: إدارة تتبع الطلبات
- `get_order_tracking_points`: دالة للحصول على نقاط تتبع الطلب

#### 2.4 جدول `delivery_status_history` (تاريخ حالات التوصيل)

**الاستخدام الفعلي**: يستخدم لتسجيل تاريخ تغييرات حالة الطلب.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
delivery_order_id UUID,
status delivery_status_enum NOT NULL,
notes TEXT,
created_at TIMESTAMP WITH TIME ZONE
```

**المراجع في الكود**:
- يتم ملؤه تلقائيًا عند تغيير حالة الطلب بواسطة التريجرز

#### 2.5 جدول `order_schedule` (جدولة الطلبات)

**الاستخدام الفعلي**: يستخدم لإدارة جدولة أوقات الاستلام والتسليم للطلبات.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
order_id UUID NOT NULL,
scheduled_pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
scheduled_delivery_time TIMESTAMP WITH TIME ZONE,
actual_pickup_time TIMESTAMP WITH TIME ZONE,
actual_delivery_time TIMESTAMP WITH TIME ZONE,
status schedule_status,
notes TEXT,
customer_notified BOOLEAN,
pickup_reminder_sent BOOLEAN,
delivery_reminder_sent BOOLEAN,
metadata JSONB
```

**المراجع في الكود**:
- `ScheduleOrderUseCase`: إدارة جدولة الطلبات
- `order_card.dart`: عرض معلومات الجدولة وتنفيذ جدولة الطلبات

#### 2.6 جدول `customer_interactions` (تفاعلات العملاء)

**الاستخدام الفعلي**: *جدول لم يتم توثيقه سابقًا* - يستخدم لتسجيل التفاعلات بين المندوبين والعملاء مثل إرسال الإشعارات وتحديثات الحالة.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
order_id UUID NOT NULL,
customer_id UUID NOT NULL,
created_by UUID,
type interaction_type NOT NULL,
message TEXT,
status_from VARCHAR(50),
status_to VARCHAR(50),
scheduled_pickup_time TIMESTAMP WITH TIME ZONE,
scheduled_delivery_time TIMESTAMP WITH TIME ZONE,
is_read BOOLEAN,
read_at TIMESTAMP WITH TIME ZONE,
notification_channel VARCHAR(50),
metadata JSONB
```

**المراجع في الكود**:
- `CustomerInteractionRepository`: إدارة تفاعلات العملاء
- `SendNotificationToCustomerUseCase`: إرسال إشعارات للعملاء

### 3. جداول جمع المخلفات والفواتير

#### 3.1 جدول `waste_collection_sessions` (جلسات جمع المخلفات)

**الاستخدام الفعلي**: يستخدم لإدارة جلسات جمع المخلفات من العملاء.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
delivery_order_id UUID NOT NULL,
delivery_boy_id UUID NOT NULL,
customer_id UUID NOT NULL,
status VARCHAR(20) NOT NULL,
total_weight NUMERIC(10, 2),
total_amount NUMERIC(10, 2),
total_points NUMERIC(10, 2),
started_at TIMESTAMP WITH TIME ZONE,
completed_at TIMESTAMP WITH TIME ZONE,
signature_url TEXT,
customer_approval_status customer_approval_status_enum,
customer_comment TEXT,
collection_efficiency NUMERIC(5, 2),
quality_score INTEGER,
photos JSONB
```

**السياسات المطبقة**:
- `Allow delivery boys to update their sessions`: تسمح للمندوبين بتحديث جلساتهم

**المراجع في الكود**:
- `WasteCollectionBloc`: إدارة جلسات جمع المخلفات
- `CreateSessionUseCase`: إنشاء جلسة جمع مخلفات جديدة

#### 3.2 جدول `waste_collection_items` (عناصر جمع المخلفات)

**الاستخدام الفعلي**: يستخدم لتسجيل عناصر المخلفات المجمعة في كل جلسة.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
session_id UUID NOT NULL,
waste_data_id UUID NOT NULL,
category_id UUID NOT NULL,
subcategory_id UUID,
name VARCHAR(255) NOT NULL,
actual_weight NUMERIC(10, 3) NOT NULL,
unit_price NUMERIC(10, 2) NOT NULL,
total_price NUMERIC(10, 2) NOT NULL,
earned_points NUMERIC(10, 2),
measurement_photo_url TEXT
```

**المراجع في الكود**:
- `AddWasteItemUseCase`: إضافة عناصر مخلفات جديدة
- `waste_collection_bloc.dart`: إدارة عناصر المخلفات

#### 3.3 جدول `waste_invoices` (فواتير المخلفات)

**الاستخدام الفعلي**: يستخدم لإنشاء وإدارة فواتير المخلفات المجمعة.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
session_id UUID NOT NULL,
invoice_number VARCHAR(50) NOT NULL,
subtotal NUMERIC(10, 2) NOT NULL,
tax NUMERIC(10, 2),
total NUMERIC(10, 2) NOT NULL,
status VARCHAR(20) NOT NULL,
qr_code_url TEXT,
offline_code VARCHAR(8),
customer_approval_status customer_approval_status_enum,
customer_approval_timestamp TIMESTAMP WITHOUT TIME ZONE,
customer_comment TEXT,
items JSONB
```

**السياسات المطبقة**:
- `Allow authorized users to update invoices`: تسمح للمستخدمين المصرح لهم بتحديث الفواتير

**المراجع في الكود**:
- `InvoiceBloc`: إدارة الفواتير
- `GenerateInvoiceUseCase`: إنشاء فاتورة جديدة
- `SendInvoiceToCustomerUseCase`: إرسال الفاتورة للعميل

#### 3.4 جدول `categories` (الفئات)

**الاستخدام الفعلي**: يستخدم لتخزين فئات المخلفات.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
name TEXT NOT NULL,
description TEXT,
image_url TEXT
```

**المراجع في الكود**:
- `WasteCategoriesBloc`: إدارة فئات المخلفات
- `GetCategoriesUseCase`: استرجاع فئات المخلفات

#### 3.5 جدول `subcategories` (الفئات الفرعية)

**الاستخدام الفعلي**: يستخدم لتخزين الفئات الفرعية للمخلفات.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
name TEXT NOT NULL,
category_id UUID,
description TEXT,
image_url TEXT,
price DOUBLE PRECISION,
points_per_kg INTEGER
```

**المراجع في الكود**:
- `GetSubcategoriesByCategoryUseCase`: استرجاع الفئات الفرعية لفئة معينة

#### 3.6 جدول `waste_data_admin` (بيانات المخلفات الإدارية)

**الاستخدام الفعلي**: يستخدم لتخزين بيانات المخلفات المدخلة من قبل الإدارة.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
category_id UUID,
subcategory_id UUID,
name TEXT NOT NULL,
weight DOUBLE PRECISION NOT NULL,
price DOUBLE PRECISION NOT NULL,
points INTEGER NOT NULL
```

**المراجع في الكود**:
- يستخدم في عمليات جمع المخلفات لتحديد الأسعار والنقاط

### 4. جداول الأداء والمكافآت

#### 4.1 جدول `delivery_boy_daily_performance` (أداء المندوب اليومي)

**الاستخدام الفعلي**: يستخدم لتسجيل وعرض إحصائيات أداء المندوب اليومية.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
delivery_boy_id UUID NOT NULL,
date DATE NOT NULL,
orders_completed INTEGER,
orders_canceled INTEGER,
total_distance NUMERIC(10, 2),
total_earnings NUMERIC(10, 2),
average_rating NUMERIC(3, 2),
online_hours NUMERIC(5, 2),
waste_weight_collected NUMERIC(10, 2)
```

**السياسات المطبقة**:
- `Delivery boys can view their own performance data`: تسمح للمندوبين بعرض بيانات أدائهم

**المراجع في الكود**:
- يتم تحديثه تلقائيًا عن طريق التريجرز عند تغيير حالة الطلبات

#### 4.2 جدول `delivery_performance_stats` (إحصائيات أداء التوصيل)

**الاستخدام الفعلي**: يستخدم لتخزين إحصائيات أداء المندوب الشهرية.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
delivery_boy_id UUID,
month DATE NOT NULL,
total_orders INTEGER,
completed_orders INTEGER,
total_distance NUMERIC(10, 2),
average_delivery_time NUMERIC(10, 2)
```

**السياسات المطبقة**:
- `Delivery boys can view their own stats`: تسمح للمندوبين بعرض إحصائياتهم

**المراجع في الكود**:
- `get_delivery_boy_performance`: دالة للحصول على أداء المندوب

#### 4.3 جدول `delivery_earnings` (أرباح المندوبين)

**الاستخدام الفعلي**: يستخدم لتسجيل أرباح المندوبين من الطلبات المكتملة.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
delivery_id UUID,
order_id UUID NOT NULL,
amount NUMERIC(10, 2) NOT NULL,
bonus_amount NUMERIC(10, 2),
earning_type VARCHAR(20),
status VARCHAR(20),
paid_at TIMESTAMP WITH TIME ZONE
```

**السياسات المطبقة**:
- `Users can view their own delivery earnings`: تسمح للمندوبين بعرض أرباحهم

#### 4.4 جدول `delivery_ratings` (تقييمات المندوبين)

**الاستخدام الفعلي**: يستخدم لتخزين تقييمات العملاء للمندوبين.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
delivery_id UUID,
order_id UUID NOT NULL,
customer_id UUID NOT NULL,
rating INTEGER,
comment TEXT
```

**السياسات المطبقة**:
- `Users can view their own delivery ratings`: تسمح للمندوبين بعرض تقييماتهم

### 5. جداول العملاء وتفاعلاتهم

#### 5.1 جدول `customers` (العملاء)

**الاستخدام الفعلي**: *لم يتم توثيقه بشكل كامل سابقًا* - الجدول الرئيسي لبيانات العملاء.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
user_id UUID,
full_name TEXT NOT NULL,
email TEXT,
phone_number VARCHAR NOT NULL,
customer_type customer_type_enum,
organization_name VARCHAR,
customer_status customer_status,
wallet_id UUID,
preferred_language VARCHAR,
total_orders INTEGER,
total_spent NUMERIC,
loyalty_points INTEGER,
default_address_id UUID
```

**التريجرز المرتبطة**:
- `new_customer_profile_trigger`: ينشئ ملف تعريف جديد للعميل عند إنشاء حساب

**المراجع في الكود**:
- `create_customer_profile`: دالة لإنشاء ملف شخصي للعميل

#### 5.2 جدول `new_profiles` (الملفات الشخصية الجديدة)

**الاستخدام الفعلي**: *لم يتم توثيقه بشكل كامل سابقًا* - يستخدم لتخزين ملفات تعريف العملاء الموسعة.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
full_name TEXT NOT NULL,
phone_number TEXT NOT NULL,
email TEXT,
avatar_url TEXT,
preferred_language TEXT,
bio TEXT,
date_of_birth DATE,
gender TEXT,
notification_preferences JSONB,
social_links JSONB,
statistics JSONB,
points INTEGER,
status profile_status_enum,
default_address_id UUID
```

**التريجرز المرتبطة**:
- `create_default_address_trigger`: ينشئ عنوان افتراضي للعميل
- `sync_phone_trigger`: يزامن رقم الهاتف مع جدول customer_phones

#### 5.3 جدول `customer_addresses` (عناوين العملاء)

**الاستخدام الفعلي**: *لم يتم توثيقه بشكل كامل سابقًا* - يستخدم لتخزين عناوين العملاء.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
profile_id UUID,
address_type address_type_enum,
address_line TEXT NOT NULL,
city TEXT,
area TEXT,
building_number TEXT,
floor_number TEXT,
apartment_number TEXT,
additional_directions TEXT,
landmark TEXT,
latitude DOUBLE PRECISION NOT NULL,
longitude DOUBLE PRECISION NOT NULL,
geom GEOMETRY,
is_default BOOLEAN,
is_verified BOOLEAN
```

**التريجرز المرتبطة**:
- `enforce_single_default_address`: يضمن وجود عنوان افتراضي واحد فقط
- `set_profile_id`: يعين profile_id تلقائيًا

#### 5.4 جدول `customer_phones` (هواتف العملاء)

**الاستخدام الفعلي**: *لم يتم توثيقه سابقًا* - يستخدم لتخزين أرقام هواتف العملاء.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
profile_id UUID NOT NULL,
phone_number TEXT NOT NULL,
is_primary BOOLEAN,
is_verified BOOLEAN,
phone_verification_status verification_status_enum
```

**التريجرز المرتبطة**:
- `enforce_single_primary_phone`: يضمن وجود رقم هاتف رئيسي واحد فقط

#### 5.5 جدول `customer_orders` (طلبات العملاء)

**الاستخدام الفعلي**: *لم يتم توثيقه بشكل كامل سابقًا* - يستخدم لتخزين طلبات العملاء.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
payment_method payment_method_enum,
priority order_priority_enum,
pickup_address TEXT NOT NULL,
pickup_location GEOMETRY NOT NULL,
expected_total NUMERIC(10, 2),
actual_total NUMERIC(10, 2),
is_fully_verified BOOLEAN,
customer_id UUID,
profile_id UUID,
order_details JSONB,
category_name TEXT,
subcategory_name TEXT,
status delivery_status_enum
```

**التريجرز المرتبطة**:
- `create_delivery_order`: ينشئ سجل في جدول delivery_orders عند إنشاء طلب عميل
- `sync_delivery_amounts`: يزامن المبالغ مع جدول delivery_orders

### 6. جداول إضافية تستخدم في التطبيق

#### 6.1 جدول `system_notifications` (إشعارات النظام)

**الاستخدام الفعلي**: *لم يتم توثيقه سابقًا* - يستخدم لإدارة إشعارات النظام للمستخدمين.

**الحقول الرئيسية**:
```sql
id UUID PRIMARY KEY,
type TEXT NOT NULL,
title TEXT NOT NULL,
message TEXT NOT NULL,
target_role TEXT,
target_user_id UUID,
is_read BOOLEAN,
expires_at TIMESTAMP WITH TIME ZONE
```

**التريجرز المرتبطة**:
- `check_notification_updates`: يتحقق من تحديثات الإشعارات

#### 6.2 جدول `onboarding_data` (بيانات التعريف)

**الاستخدام الفعلي**: *لم يتم توثيقه سابقًا* - يستخدم لتخزين بيانات شاشات التعريف بالتطبيق.

**الحقول الرئيسية**:
```sql
id SERIAL PRIMARY KEY,
title TEXT NOT NULL,
body TEXT NOT NULL,
image_url TEXT NOT NULL
```

**المراجع في الكود**:
- `OnboardingCubit`: إدارة شاشات التعريف بالتطبيق

## الأنواع المخصصة (Enums) المستخدمة حاليًا

1. **`delivery_boy_status`**:
   - القيم: `'active'`, `'inactive'`, `'suspended'`, `'pending_approval'`, `'rejected'`
   - الاستخدام: تحديد حالة مندوب التوصيل في جدول `delivery_boys`

2. **`delivery_boy_online_status`**:
   - القيم: `'online'`, `'offline'`, `'busy'`, `'away'`
   - الاستخدام: تحديد حالة الاتصال للمندوب في جدول `delivery_boys`

3. **`verification_status`**:
   - القيم: `'pending'`, `'verified'`, `'failed'`
   - الاستخدام: تحديد حالة التحقق من رمز التوصيل ورقم الهاتف

4. **`vehicle_type`**:
   - القيم: `'bicycle'`, `'motorcycle'`, `'car'`, `'van'`, `'truck'`
   - الاستخدام: تحديد نوع مركبة المندوب

5. **`delivery_status_enum`**:
   - القيم: `'pending'`, `'assigned'`, `'confirmed'`, `'pickedUp'`, `'inReceipt'`, `'completed'`, `'canceled'`, `'scheduled'`, `'returned'`
   - الاستخدام: تحديد حالة طلب التوصيل

6. **`schedule_status`**:
   - القيم: `'scheduled'`, `'in_progress'`, `'completed'`, `'missed'`, `'rescheduled'`
   - الاستخدام: تحديد حالة جدولة الطلب

7. **`customer_approval_status_enum`**:
   - القيم: `'pending'`, `'approved'`, `'rejected'`, `'modified'`
   - الاستخدام: تحديد حالة موافقة العميل على الفاتورة

8. **`user_type_enum`** (غير موثق سابقًا):
   - القيم: `'household'`, `'distributor'`, `'business'`, `'other'`
   - الاستخدام: تحديد نوع المستخدم (العميل)

9. **`order_priority_enum`** (غير موثق سابقًا):
   - القيم: `'low'`, `'normal'`, `'high'`, `'urgent'`
   - الاستخدام: تحديد أولوية الطلب

10. **`address_type_enum`** (غير موثق سابقًا):
    - القيم: `'home'`, `'work'`, `'other'`
    - الاستخدام: تحديد نوع عنوان العميل

11. **`profile_status_enum`** (غير موثق سابقًا):
    - القيم: `'pending'`, `'active'`, `'suspended'`, `'banned'`
    - الاستخدام: تحديد حالة ملف تعريف المستخدم

12. **`interaction_type`** (غير موثق سابقًا):
    - القيم: تحدد أنواع التفاعلات مع العملاء
    - الاستخدام: في جدول `customer_interactions`

## الدوال (Functions) المستخدمة حاليًا

### 1. دوال المصادقة وإدارة الحساب

1. **`generate_phone_verification_code()`**
   - الوصف: تقوم بإنشاء رمز تحقق لرقم الهاتف
   - الاستخدام: تستخدم في عملية التحقق من رقم الهاتف

2. **`handle_delivery_user_creation()`**
   - الوصف: تنشئ بيانات المندوب عند تسجيل حساب جديد
   - الاستخدام: تستخدم داخليًا عند تسجيل مندوب جديد

3. **`handle_new_profiles_delivery()`**
   - الوصف: تنشئ ملف تعريفي جديد للمندوب
   - الاستخدام: تستخدم داخليًا عند تسجيل مندوب جديد

4. **`handle_new_user()`** (غير موثقة سابقًا)
   - الوصف: تعالج إنشاء مستخدم جديد وتوجيهه للدالة المناسبة
   - الاستخدام: تستخدم كتريجر عند إنشاء مستخدم جديد

5. **`generate_verification_code()`** (غير موثقة سابقًا)
   - الوصف: تولد كود تحقق للمستخدم
   - الاستخدام: تستخدم في عملية التحقق من رقم الهاتف

### 2. دوال تتبع المواقع والطلبات

1. **`insert_tracking_location()`**
   - الوصف: تسجل موقع المندوب أثناء التوصيل
   - الاستخدام: تستخدم لتحديث موقع المندوب بشكل دوري

2. **`update_delivery_boy_location()`**
   - الوصف: تحدث موقع المندوب في الجدول الرئيسي
   - الاستخدام: تستخدم عند تحديث موقع المندوب

3. **`update_delivery_boy_on_order_pickup()`**
   - الوصف: تحدث حالة المندوب عند استلام الطلب
   - الاستخدام: تستخدم عند تغيير حالة الطلب إلى "تم الاستلام"

4. **`get_order_tracking_points()`**
   - الوصف: تسترجع نقاط تتبع الطلب
   - الاستخدام: تستخدم لعرض مسار توصيل الطلب على الخريطة

5. **`calculate_distance()`** (غير موثقة سابقًا)
   - الوصف: تحسب المسافة بين نقطتين جغرافيتين
   - الاستخدام: تستخدم في حساب المسافات والتكاليف

6. **`calculate_delivery_stats()`** (غير موثقة سابقًا)
   - الوصف: تحسب إحصائيات التوصيل مثل المسافة والوقت والسرعة
   - الاستخدام: تستخدم في تقارير الأداء

7. **`get_nearby_available_delivery_boys()`** (غير موثقة سابقًا)
   - الوصف: تسترجع المندوبين المتاحين القريبين من موقع معين
   - الاستخدام: تستخدم في تخصيص الطلبات للمندوبين

8. **`smart_assign_order()`** (غير موثقة سابقًا)
   - الوصف: تخصص الطلب للمندوب الأنسب بناءً على عدة معايير
   - الاستخدام: تستخدم في تخصيص الطلبات تلقائيًا

### 3. دوال الفواتير وجمع المخلفات

1. **`insert_waste_invoice()`**
   - الوصف: تدرج فاتورة مخلفات جديدة
   - الاستخدام: تستخدم عند إنشاء فاتورة جديدة بعد جمع المخلفات

2. **`send_invoice_to_customer()`**
   - الوصف: ترسل الفاتورة للعميل للمراجعة والموافقة
   - الاستخدام: تستخدم بعد إنشاء الفاتورة

3. **`update_invoice_approval_status()`**
   - الوصف: تحدث حالة موافقة العميل على الفاتورة
   - الاستخدام: تستخدم عند استلام رد العميل على الفاتورة

4. **`get_invoice_by_id()`** (غير موثقة سابقًا)
   - الوصف: تسترجع فاتورة بواسطة معرفها
   - الاستخدام: تستخدم في شاشة تفاصيل الفاتورة

5. **`get_invoice_by_session_id()`** (غير موثقة سابقًا)
   - الوصف: تسترجع فاتورة بواسطة معرف جلسة جمع المخلفات
   - الاستخدام: تستخدم في شاشة تفاصيل جلسة جمع المخلفات

### 4. دوال إكمال الطلبات وتحديث الإحصائيات

1. **`complete_order()`**
   - الوصف: تكمل الطلب وتغير حالته إلى "مكتمل"
   - الاستخدام: تستخدم عند الانتهاء من الطلب

2. **`get_delivery_boy_performance()`**
   - الوصف: تسترجع إحصائيات أداء المندوب
   - الاستخدام: تستخدم لعرض إحصائيات الأداء

3. **`update_delivery_boy_availability()`**
   - الوصف: تحدث حالة توفر المندوب
   - الاستخدام: تستخدم لتغيير حالة المندوب بين متاح وغير متاح

4. **`direct_update_order_to_completed()`** (غير موثقة سابقًا)
   - الوصف: تحدث حالة الطلب مباشرة إلى "مكتمل"
   - الاستخدام: تستخدم في حالات محددة لتحديث حالة الطلب

### 5. دوال العملاء وتفاعلاتهم (غير موثقة سابقًا)

1. **`send_customer_notification()`**
   - الوصف: ترسل إشعارًا للعميل
   - الاستخدام: تستخدم في التواصل مع العملاء

2. **`update_customer_location()`**
   - الوصف: تحدث موقع العميل وعنوانه الافتراضي
   - الاستخدام: تستخدم لتحديث موقع العميل الحالي

3. **`update_customer_statistics()`**
   - الوصف: تحدث إحصائيات العميل مثل عدد الطلبات والإنفاق
   - الاستخدام: تستخدم بعد اكتمال الطلبات

4. **`add_new_address()`**
   - الوصف: تضيف عنوانًا جديدًا للعميل
   - الاستخدام: تستخدم في شاشة إضافة عنوان

5. **`find_addresses_within_radius()`**
   - الوصف: تبحث عن العناوين ضمن نطاق محدد
   - الاستخدام: تستخدم في البحث عن العناوين القريبة

6. **`find_nearby_customers()`**
   - الوصف: تبحث عن العملاء القريبين من موقع محدد
   - الاستخدام: تستخدم في تحليلات التسويق

## خلاصة التوثيق

هذا التوثيق المحدث يعكس بشكل أكثر دقة وشمولية الجداول والدوال والتريجرز والأنواع المخصصة المستخدمة حاليًا في تطبيق مندوب التوصيل (Delivery Karmesh). تم إضافة العديد من العناصر التي لم تكن موثقة سابقًا، وتحديث الوصف لتعكس الحالة الراهنة للتطبيق.

يجب ملاحظة أن هناك جداول موجودة في قاعدة البيانات ولكنها غير مستخدمة حاليًا في التطبيق، مثل:
1. `delivery_vehicles` (مركبات التوصيل)
2. `vehicle_maintenance_log` (سجل صيانة المركبات)
3. `geographic_zones` (المناطق الجغرافية)
4. `payment_settlements` (تسويات الدفع)
5. `payment_qr_codes` (رموز الدفع QR)

هذه الجداول جاهزة للاستخدام في تطوير ميزات مستقبلية للتطبيق.