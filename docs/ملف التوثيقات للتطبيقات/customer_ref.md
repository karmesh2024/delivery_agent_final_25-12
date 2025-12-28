# Customer Application Database Documentation

This document outlines the database schema relevant to the customer application.

## Relevant Tables

### `customers`

**الشرح:** الجدول الرئيسي لبيانات العملاء الأساسية (يرتبط بـ `auth.users`).

| Column Name                       | Data Type                 | Nullable | Default                   | Notes                                           |
| --------------------------------- | ------------------------- | -------- | ------------------------- | ----------------------------------------------- |
| `id`                              | uuid                      | NO       |                           | Primary Key, references `auth.users.id`               |
| `user_id`                         | uuid                      | YES      |                           | Foreign Key to `auth.users.id`                  |
| `full_name`                       | text                      | NO       |                           | Full name of the customer                       |
| `email`                           | text                      | YES      |                           | Customer's email address                        |
| `phone_number`                    | character varying         | NO       |                           | Primary phone number                            |
| `customer_type`                   | customer_type_enum        | YES      | 'household'               | Type of customer (e.g., household, business)  |
| `organization_name`               | character varying         | YES      |                           | Name of organization if `customer_type` is business |
| `contact_person`                  | character varying         | YES      |                           | Contact person if `customer_type` is business |
| `customer_status`                 | customer_status           | YES      | 'inactive'                | Status of the customer (e.g., active, inactive) |
| `wallet_id`                       | uuid                      | YES      |                           | Foreign Key to `wallets` table                |
| `preferred_language`              | character varying         | YES      | 'ar'                      | Customer's preferred language                   |
| `total_orders`                    | integer                   | YES      | 0                         | Total number of orders placed                 |
| `total_spent`                     | numeric                   | YES      | 0                         | Total amount spent by the customer              |
| `loyalty_points`                  | integer                   | YES      | 0                         | Current loyalty points balance                  |
| `first_order_date`                | timestamp without time zone | YES      |                           | Date of the first order                         |
| `last_order_date`                 | timestamp without time zone | YES      |                           | Date of the last order                          |
| `phone_verification_code`         | character varying         | YES      |                           | OTP code for phone verification                 |
| `phone_verification_expires_at`   | timestamp with time zone  | YES      |                           | Expiry time for the verification code           |
| `phone_verification_attempts`     | integer                   | YES      | 0                         | Number of verification attempts                 |
| `is_available`                    | boolean                   | YES      | true                      | Customer availability (less common)             |
| `last_location_update`            | timestamp with time zone  | YES      |                           | Timestamp of last location update (live tracking?) |
| `voice_notes`                     | jsonb                     | YES      | '{}'                      | JSONB to store voice note references            |
| `rating`                          | numeric                   | YES      | 0                         | Customer rating (if applicable)                 |
| `referral_code`                   | character varying         | YES      |                           | Customer's unique referral code                 |
| `notes`                           | text                      | YES      |                           | Internal notes about the customer               |
| `addresses`                       | text                      | YES      |                           | Potentially deprecated, use `customer_addresses` |
| `current_location`                | geometry(Point,4326)      | YES      |                           | Live location (Point geometry)                  |
| `created_at`                      | timestamp without time zone | YES      | CURRENT_TIMESTAMP         | Timestamp of creation                           |
| `updated_at`                      | timestamp without time zone | YES      | CURRENT_TIMESTAMP         | Timestamp of last update                        |
| `default_address_id`              | uuid                      | YES      |                           | Foreign Key to the default `customer_addresses` |

### `new_profiles`

**الشرح:** يبدو أنه جدول بروفايل أحدث أو بديل لـ `customers`. يجب التحقق من الغرض منه وعلاقته بـ `customers`.

| Column Name                | Data Type                 | Nullable | Default         | Notes                                         |
| -------------------------- | ------------------------- | -------- | --------------- | --------------------------------------------- |
| `id`                       | uuid                      | NO       |                 | Primary Key, should match `customers.id`      |
| `full_name`                | text                      | NO       |                 | Full name                                     |
| `phone_number`             | text                      | NO       |                 | Phone number                                  |
| `email`                    | text                      | YES      |                 | Email address                                 |
| `avatar_url`               | text                      | YES      |                 | URL to profile picture                        |
| `preferred_language`       | text                      | YES      | 'ar'            | Preferred language                            |
| `bio`                      | text                      | YES      |                 | Short biography                               |
| `date_of_birth`            | date                      | YES      |                 | Date of birth                                 |
| `gender`                   | text                      | YES      |                 | Gender                                        |
| `notification_preferences` | jsonb                     | YES      | '{}'            | Notification settings                         |
| `social_links`             | jsonb                     | YES      | '{}'            | Links to social media profiles                |
| `statistics`               | jsonb                     | YES      | '{}'            | Stores statistics like orders, spent, points |
| `points`                   | integer                   | YES      | 0               | Loyalty points (potentially redundant)        |
| `status`                   | profile_status_enum       | YES      | 'pending'       | Profile status (e.g., pending, active)        |
| `isaddresscomplete`        | boolean                   | YES      | false           | Flag indicating if address info is complete   |
| `created_at`               | timestamp with time zone  | YES      | CURRENT_TIMESTAMP | Creation timestamp                            |
| `updated_at`               | timestamp with time zone  | YES      | CURRENT_TIMESTAMP | Last update timestamp                         |
| `addresses`                | jsonb                     | YES      |                 | JSONB for addresses (potentially deprecated)  |
| `phone_numbers`            | jsonb                     | YES      |                 | JSONB for phones (potentially deprecated)     |
| `profile_status`           | profile_status_enum       | YES      | 'pending'       | Profile status (redundant with `status`?)     |
| `default_address_id`       | uuid                      | YES      |                 | FK to default `customer_addresses`          |

### `customer_orders`

**الشرح:** يخزن معلومات طلبات العملاء الرئيسية.

| Column Name           | Data Type                 | Nullable | Default             | Notes                                                |
| --------------------- | ------------------------- | -------- | ------------------- | ---------------------------------------------------- |
| `id`                  | uuid                      | NO       | uuid_generate_v4()  | Primary Key                                          |
| `payment_method`      | payment_method_enum       | YES      | 'cash'              | Payment method used (cash, wallet, etc.)             |
| `priority`            | order_priority_enum       | YES      | 'normal'            | Order priority (normal, urgent)                    |
| `pickup_address`      | text                      | NO       |                     | Text description of pickup address                   |
| `pickup_location`     | geometry(Point,4326)      | NO       |                     | Geographic coordinates of pickup location            |
| `expected_total`      | numeric                   | YES      |                     | Estimated total amount of the order                |
| `actual_total`        | numeric                   | YES      |                     | Actual total amount after collection/verification    |
| `is_fully_verified`   | boolean                   | YES      | false               | Flag if all items in the order are verified        |
| `created_at`          | timestamp with time zone  | YES      | CURRENT_TIMESTAMP   | Timestamp when the order was created                 |
| `updated_at`          | timestamp with time zone  | YES      | CURRENT_TIMESTAMP   | Timestamp of the last update to the order          |
| `earned_points`       | numeric                   | YES      |                     | Points earned for this order                         |
| `customer_id`         | uuid                      | YES      |                     | Foreign Key to `customers` table (or `new_profiles`) |
| `profile_id`          | uuid                      | YES      |                     | Potentially redundant FK to `new_profiles`         |
| `order_details`       | jsonb                     | YES      |                     | JSONB containing details of items (use `order_details` table?) |
| `category_name`       | text                      | YES      |                     | Name of the main category                            |
| `subcategory_name`    | text                      | YES      |                     | Name of the subcategory                            |
| `status`              | delivery_status_enum      | YES      |                     | Current status of the order (e.g., pending, completed) |

### `customer_addresses`

**الشرح:** يخزن عناوين العملاء المتعددة مع تفاصيلها وموقعها الجغرافي.

| Column Name           | Data Type                 | Nullable | Default            | Notes                                                 |
| --------------------- | ------------------------- | -------- | ------------------ | ----------------------------------------------------- |
| `id`                  | uuid                      | NO       | uuid_generate_v4() | Primary Key                                           |
| `profile_id`          | uuid                      | YES      |                    | Foreign Key to `new_profiles` table                 |
| `address_type`        | address_type_enum         | YES      | 'home'             | Type of address (home, work, other)                   |
| `address_line`        | text                      | NO       |                    | Main address line (street, etc.)                      |
| `city`                | text                      | YES      |                    | City                                                  |
| `area`                | text                      | YES      |                    | Area/District                                         |
| `building_number`     | text                      | YES      |                    | Building number                                       |
| `floor_number`        | text                      | YES      |                    | Floor number                                          |
| `apartment_number`    | text                      | YES      |                    | Apartment/Unit number                                 |
| `additional_directions` | text                      | YES      |                    | Extra directions                                      |
| `landmark`            | text                      | YES      |                    | Nearby landmark                                       |
| `latitude`            | double precision          | NO       |                    | Latitude coordinate                                   |
| `longitude`           | double precision          | NO       |                    | Longitude coordinate                                  |
| `geom`                | geometry(Point,4326)      | YES      |                    | PostGIS geometry point representation                 |
| `is_default`          | boolean                   | YES      | false              | Flag indicating if this is the default address        |
| `is_verified`         | boolean                   | YES      | false              | Flag indicating if the address is verified          |
| `created_at`          | timestamp with time zone  | YES      | now()              | Timestamp of creation                                 |
| `updated_at`          | timestamp with time zone  | YES      | now()              | Timestamp of last update                              |
| `street_address`      | text                      | YES      |                    | Potentially redundant address field                 |

### `customer_phones`

**الشرح:** يخزن أرقام هواتف العملاء المتعددة.

| Column Name                 | Data Type                 | Nullable | Default         | Notes                                           |
| --------------------------- | ------------------------- | -------- | --------------- | ----------------------------------------------- |
| `id`                        | uuid                      | NO       | uuid_generate_v4() | Primary Key                                   |
| `profile_id`                | uuid                      | NO       |                 | Foreign Key to `new_profiles` table           |
| `phone_number`              | text                      | NO       |                 | Phone number                                  |
| `is_primary`                | boolean                   | YES      | false           | Flag indicating if this is the primary phone    |
| `is_verified`               | boolean                   | YES      | false           | Flag indicating if the phone is verified        |
| `phone_verification_status` | verification_status_enum  | YES      | 'pending'       | Verification status (pending, verified, failed) |
| `created_at`                | timestamp with time zone  | YES      | now()           | Creation timestamp                            |
| `updated_at`                | timestamp with time zone  | YES      | now()           | Last update timestamp                         |

### `wallets`

**الشرح:** يخزن أرصدة المحافظ الإلكترونية للمستخدمين (بما في ذلك العملاء).

| Column Name | Data Type                 | Nullable | Default | Notes                                                    |
| ----------- | ------------------------- | -------- | ------- | -------------------------------------------------------- |
| `id`        | uuid                      | NO       | gen_random_uuid() | Primary Key                                           |
| `user_id`   | uuid                      | NO       |         | Foreign Key to the user (`customers` or `delivery_boys`) |
| `balance`   | numeric                   | NO       | 0.00    | Current wallet balance                                   |
| `currency`  | character varying         | NO       | 'EGP'   | Currency code (e.g., EGP)                              |
| `is_active` | boolean                   | NO       | true    | Flag indicating if the wallet is active                  |
| `created_at`| timestamp with time zone  | NO       | now()   | Creation timestamp                                       |
| `updated_at`| timestamp with time zone  | NO       | now()   | Last update timestamp                                    |

### `wallet_transactions`

**الشرح:** يسجل جميع المعاملات التي تتم على المحافظ الإلكترونية للعملاء.

| Column Name      | Data Type                 | Nullable | Default        | Notes                                                       |
| ---------------- | ------------------------- | -------- | -------------- | ----------------------------------------------------------- |
| `id`             | uuid                      | NO       | gen_random_uuid() | Primary Key                                               |
| `wallet_id`      | uuid                      | NO       |                | Foreign Key to `wallets` table                            |
| `transaction_type`| transaction_type          | NO       |                | Type of transaction (deposit, withdrawal, qr_payment, etc.) |
| `amount`         | numeric                   | NO       |                | Transaction amount                                          |
| `status`         | transaction_status        | NO       | 'pending'      | Status of the transaction (pending, completed, failed)    |
| `qr_code_id`     | uuid                      | YES      |                | Foreign Key to `payment_qr_codes` if applicable         |
| `reference_id`   | character varying         | YES      |                | External reference ID (e.g., order ID)                    |
| `description`    | text                      | YES      |                | Description of the transaction                            |
| `metadata`       | jsonb                     | YES      |                | Additional metadata                                         |
| `created_at`     | timestamp with time zone  | NO       | now()          | Creation timestamp                                        |
| `updated_at`     | timestamp with time zone  | NO       | now()          | Last update timestamp                                     |

### `complaints`

**الشرح:** يخزن الشكاوى المقدمة من العملاء بخصوص الطلبات.

| Column Name      | Data Type                 | Nullable | Default         | Notes                                                     |
| ---------------- | ------------------------- | -------- | --------------- | --------------------------------------------------------- |
| `id`             | integer                   | NO       | nextval(...)    | Primary Key (Serial)                                    |
| `order_id`       | integer                   | NO       |                 | Foreign Key to the related order (needs review if orders use UUID) |
| `client_id`      | uuid                      | NO       |                 | Foreign Key to the customer (`customers` or `new_profiles`) |
| `complaint_text` | text                      | NO       |                 | Text of the complaint                                     |
| `complaint_status`| text                     | YES      | 'Pending'       | Status of the complaint resolution (Pending, Resolved)  |
| `created_at`     | timestamp with time zone  | YES      | CURRENT_TIMESTAMP | Timestamp of creation                                     |
| `updated_at`     | timestamp with time zone  | YES      | CURRENT_TIMESTAMP | Timestamp of last update                                  |

### `order_details`

**الشرح:** يخزن تفاصيل الأصناف داخل طلب العميل (قد يكون مكررًا إذا كانت التفاصيل مخزنة في `customer_orders.order_details` JSONB).

| Column Name       | Data Type                 | Nullable | Default         | Notes                                                |
| ----------------- | ------------------------- | -------- | --------------- | ---------------------------------------------------- |
| `id`              | uuid                      | NO       | gen_random_uuid() | Primary Key                                          |
| `order_id`        | uuid                      | YES      |                 | Foreign Key to `customer_orders`                     |
| `product_name`    | text                      | NO       |                 | Name of the item/waste type                          |
| `quantity`        | numeric                   | NO       |                 | Quantity/weight of the item                          |
| `price`           | numeric                   | NO       |                 | Price per unit/kg                                    |
| `earned_points`   | numeric                   | YES      | 0               | Points earned for this item                          |
| `notes`           | text                      | YES      |                 | Notes specific to this item                          |
| `created_at`      | timestamp with time zone  | NO       | now()           | Creation timestamp                                   |
| `updated_at`      | timestamp with time zone  | NO       | now()           | Last update timestamp                                |
| `delivery_order_id` | uuid                      | YES      |                 | Foreign Key to `delivery_orders` (potentially redundant) |
| `category_name`   | text                      | YES      |                 | Category name (potentially redundant)              |
| `subcategory_name`| text                      | YES      |                 | Subcategory name (potentially redundant)           |

### `invoice_details`

**الشرح:** يخزن تفاصيل الفاتورة لكل صنف في طلب العميل، غالبًا بعد عملية التحقق والوزن.

| Column Name         | Data Type                 | Nullable | Default         | Notes                                                    |
| ------------------- | ------------------------- | -------- | --------------- | -------------------------------------------------------- |
| `id`                | uuid                      | NO       | uuid_generate_v4() | Primary Key                                           |
| `customer_order_id` | uuid                      | NO       |                 | Foreign Key to `customer_orders`                     |
| `product_name`      | character varying         | NO       |                 | Name of the verified item/waste type                   |
| `expected_quantity` | numeric                   | NO       |                 | Quantity/weight initially expected by customer           |
| `actual_quantity`   | numeric                   | YES      |                 | Actual quantity/weight measured by delivery agent      |
| `unit_price`        | numeric                   | NO       |                 | Price per unit/kg for this item                        |
| `expected_total`    | numeric                   | YES      |                 | Calculated total based on expected quantity            |
| `actual_total`      | numeric                   | YES      |                 | Calculated total based on actual quantity              |
| `points`            | numeric                   | YES      | 0               | Points earned for this item based on actual quantity |
| `is_verified`       | boolean                   | YES      | false           | Flag indicating if this item detail is verified        |
| `created_at`        | timestamp with time zone  | YES      | CURRENT_TIMESTAMP | Creation timestamp                                       |
| `updated_at`        | timestamp with time zone  | YES      | CURRENT_TIMESTAMP | Last update timestamp                                    |

### `messages`

**الشرح:** يخزن الرسائل الفردية ضمن المحادثات (قد تكون بين العميل والمندوب أو الدعم).
*(Stores individual messages within conversations. Details omitted for brevity)*

### `conversations`

**الشرح:** يمثل المحادثات النصية المرتبطة بالطلبات أو بالدعم.
*(Represents chat conversations. Details omitted for brevity)*

### `conversation_participants`

**الشرح:** يربط العملاء بالمحادثات.
*(Links customers to conversations. Details omitted for brevity)*

### `system_notifications`

**الشرح:** يخزن الإشعارات المرسلة من النظام إلى العملاء.
*(Stores system notifications targeted at customers. Details omitted for brevity)*

### `customer_interactions`

**الشرح:** يسجل أنواع مختلفة من التفاعلات مع العميل المتعلقة بالطلب (رسائل، تغييرات حالة، إلخ).
*(Logs various interactions with the customer related to an order. Details omitted for brevity)*

### `waste_weights` (Potentially, if customers see weights)

**الشرح:** (إذا كان العملاء يرون الأوزان المقاسة، فقد يكون هذا الجدول ذا صلة).
*(If customers can view measured weights, this might be relevant. Details omitted for brevity)*

## Relevant Functions

*(Functions typically called by the customer application)*

- **`generate_verification_code(phone_param text)`**: `TABLE(verification_code text, expires_at timestamp with time zone, attempts_remaining integer)`
  - **الشرح:** إنشاء وإرسال رمز تحقق OTP لرقم هاتف العميل المحدد لتأكيد الملكية.

- **`update_customer_location(p_profile_id uuid, p_address_id uuid DEFAULT NULL, p_lat double precision DEFAULT NULL, p_lng double precision DEFAULT NULL)`**: `boolean`
  - **الشرح:** تحديث الموقع الافتراضي للعميل إما باختيار عنوان موجود (`p_address_id`) أو بتوفير إحداثيات حية (`p_lat`, `p_lng`).

- **`add_new_address(p_customer_id uuid, p_latitude double precision, p_longitude double precision, p_address_line text, ...)`**: `uuid`
  - **الشرح:** إضافة عنوان جديد لملف العميل المحدد باستخدام تفاصيله وإحداثياته.

- **`get_profile_info(profile_id uuid)`**: `json`
  - **الشرح:** استرجاع بيانات ملف العميل (الاسم، الهاتف، البريد، إلخ) بصيغة JSON.

- **`update_profile_points(profile_id uuid, points_to_add integer)`**: `void`
  - **الشرح:** (إذا كان منطق إضافة النقاط من جهة العميل) إضافة نقاط إلى رصيد نقاط ولاء العميل.

- **`mark_messages_as_read(p_conversation_id uuid, p_participant_type character varying, p_participant_id uuid)`**: `void`
  - **الشرح:** تحديد الرسائل في محادثة معينة كمقروءة للمشارك المحدد (العميل في هذه الحالة).

- **`verify_qr_payment(p_qr_id uuid, p_verification_code character varying)`**: `boolean`
  - **الشرح:** (إذا كان العميل هو من يتحقق من استلام مبلغ عبر QR) التحقق من صحة رمز دفعة QR لتأكيد العملية.

- **`get_invoice_by_session_id(p_session_id uuid)`**: `jsonb`
  - **الشرح:** استرداد تفاصيل الفاتورة المتعلقة بجلسة جمع نفايات معينة (إذا كان العميل يطلع على الفواتير بهذه الطريقة).

- **`get_invoice_by_id(p_invoice_id uuid)`**: `jsonb`
  - **الشرح:** استرداد تفاصيل فاتورة محددة باستخدام معرفها (إذا كان العميل يستعرض فواتير فردية).

- **`update_invoice_approval_status(p_invoice_id uuid, p_status text, p_comment text DEFAULT NULL)`**: `jsonb`
  - **الشرح:** السماح للعميل بتحديث حالة الموافقة على الفاتورة (pending, approved, rejected) مع إضافة تعليق اختياري.

- **`get_order_tracking_points(order_id_param uuid)`**: `TABLE(...)`
  - **الشرح:** استرداد سلسلة نقاط تتبع موقع المندوب لطلب معين للسماح للعميل بمتابعة مسار الطلب.

- **`send_customer_notification(p_order_id uuid, p_type interaction_type, p_message text)`**: `uuid`
  - **الشرح:** (تستدعى من النظام أو المندوب) لإضافة سجل تفاعل/إشعار للعميل بخصوص طلبه.

*(قد تكون هناك دوال أخرى مثل إنشاء الطلب، استرجاع تاريخ الطلبات، إلخ، والتي قد يتم استدعاؤها مباشرة عبر واجهة برمجة التطبيقات RESTful بدلاً من دوال SQL مباشرة)*

## Relevant ENUM Types

*(Relevant ENUMs for customer context)*

- **`customer_type_enum`**: (`household`, `business`, `distributor`)
  - **الشرح:** نوع العميل (منزلي، تجاري، موزع).

- **`customer_status`**: (`active`, `inactive`, `blocked`, `pending_verification`)
  - **الشرح:** الحالة العامة لحساب العميل (نشط، غير نشط، محظور، بانتظار التحقق).

- **`address_type_enum`**: (`home`, `work`, `other`)
  - **الشرح:** نوع العنوان المحفوظ للعميل (منزل، عمل، آخر).

- **`payment_method_enum`**: (`cash`, `wallet`, `card`, `bank_transfer`)
  - **الشرح:** طرق الدفع المتاحة أو المستخدمة في الطلبات (نقدي، محفظة، بطاقة، تحويل بنكي).

- **`order_priority_enum`**: (`low`, `normal`, `high`, `urgent`)
  - **الشرح:** أولوية معالجة الطلب (منخفضة، عادية، عالية، عاجلة).

- **`delivery_status_enum`**: (`pending`, `confirmed`, `pickedUp`, `inReceipt`, `completed`, `cancelled`, `scheduled`, `returned`, `canceled`)
  - **الشرح:** مراحل طلب التوصيل التي يراها العميل (معلق، مؤكد، تم الاستلام، في الطريق، مكتمل، ملغي، مجدول، مرتجع).
  - *ملاحظة:* وجود `cancelled` و `canceled` قد يشير إلى تكرار.

- **`transaction_type`**: (`deposit`, `withdrawal`, `purchase`, `refund`, `exchange`, `qr_payment`)
  - **الشرح:** أنواع المعاملات في محفظة العميل (إيداع، سحب، شراء نقاط، استرداد قيمة، استبدال نقاط، دفعة QR).

- **`transaction_status`**: (`pending`, `completed`, `failed`, `cancelled`, `verification_pending`, `verified`)
  - **الشرح:** حالات المعاملات المالية في المحفظة أو دفعات QR.

- **`verification_status_enum`**: (`pending`, `verified`, `expired`, `max_attempts`, `failed`)
  - **الشرح:** حالات التحقق من رقم الهاتف أو رموز أخرى (معلق، تم التحقق، منتهي الصلاحية، تم تجاوز المحاولات، فاشل).

- **`profile_status_enum`**: (`pending`, `active`, `inactive`, `incomplete`, `suspended`)
  - **الشرح:** حالة ملف تعريف العميل (قيد الانتظار، نشط، غير نشط، غير مكتمل، موقوف).

- **`interaction_type`**: (`status_update`, `schedule_notification`, `pickup_notification`, `delivery_notification`, `delay_notification`, `location_update`, `message`, `call_log`, `feedback_request`, `other`)
  - **الشرح:** أنواع التفاعلات أو الإشعارات التي يتلقاها العميل بخصوص طلبه.

- **`customer_approval_status_enum`**: (`pending`, `under_review`, `approved`, `rejected`)
  - **الشرح:** حالة موافقة العميل على الفاتورة أو جلسة جمع النفايات.

## Relevant RLS Policies

*(Policies governing customer access to their own data)*

- **Table:** `customers`
  - **Policy:** `customers_update_policy` (UPDATE)
    - **USING:** `(auth.uid() = user_id)`
    - **الشرح:** يسمح للعميل بتحديث بياناته في جدول `customers`.
  - **Policy:** `customers_delete_policy` (DELETE)
    - **USING:** `((auth.uid() = id) OR (auth.uid() = user_id))`
    - **الشرح:** يسمح للعميل بحذف حسابه.
  - **Policy:** `Customers can insert their own data` (INSERT)
    - **CHECK:** `((auth.uid() = id) AND (((auth.jwt() ->> 'role'::text) = 'authenticated'::text) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text)))`
    - **الشرح:** يسمح للمستخدم المصادق عليه بإنشاء سجل عميل لنفسه.
  - **Policy:** `Customers can view their own data` (SELECT)
    - **USING:** `((auth.uid() = id) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text))`
    - **الشرح:** يسمح للعميل بالاطلاع على بياناته.
  - **Policy:** `Customers can update their own data` (UPDATE)
    - **USING/CHECK:** `(auth.uid() = id)`
    - **الشرح:** يسمح للعميل بتحديث بياناته (قد تكون مكررة مع `customers_update_policy`).
  - **Policy:** `customers_select_policy` (SELECT)
    - **USING:** `(auth.uid() = user_id)`
    - **الشرح:** يسمح للعميل بالاطلاع على بياناته (قد تكون مكررة).

- **Table:** `new_profiles`
  - **Policy:** `profiles_select_policy` / `select_own_profile_data` (SELECT)
    - **USING:** `(auth.uid() = id)`
    - **الشرح:** يسمح للعميل بالاطلاع على بيانات ملفه الشخصي.
  - **Policy:** `profiles_insert_policy` / `insert_profile_data` (INSERT)
    - **CHECK:** `(auth.uid() = id)`
    - **الشرح:** يسمح للعميل بإنشاء ملفه الشخصي.
  - **Policy:** `profiles_update_policy` / `update_own_profile_data` (UPDATE)
    - **USING:** `(auth.uid() = id)`
    - **الشرح:** يسمح للعميل بتحديث ملفه الشخصي.

- **Table:** `customer_orders`
  - **Policy:** `Users can view their own order details` / `Users can view their own orders` (SELECT)
    - **USING:** `(auth.uid() = customer_id)`
    - **الشرح:** يسمح للعميل بالاطلاع على طلباته.
  - **Policy:** `Users can create their own orders` / `Users can insert their own order details` (INSERT)
    - **CHECK:** `(auth.uid() = customer_id)`
    - **الشرح:** يسمح للعميل بإنشاء طلبات جديدة لنفسه.
  - **Policy:** `Users can update their own orders` / `Users can update their own order details` (UPDATE)
    - **USING/CHECK:** `(auth.uid() = customer_id)`
    - **الشرح:** يسمح للعميل بتحديث طلباته (ربما قبل تأكيدها؟).
  - **Policy:** `Users can delete their own orders` (DELETE)
    - **USING:** `(auth.uid() = customer_id)`
    - **الشرح:** يسمح للعميل بحذف طلباته (ربما قبل تأكيدها؟).

- **Table:** `customer_addresses`
  - **Policy:** `Users can insert their own addresses` (INSERT)
    - **CHECK:** `(auth.uid() = ( SELECT auth.uid() FROM new_profiles WHERE (new_profiles.id = customer_addresses.profile_id)))`
    - **الشرح:** يسمح للعميل بإضافة عناوين جديدة لملفه الشخصي.
  - **Policy:** `Users can update their own addresses` (UPDATE)
    - **USING:** `(auth.uid() = ( SELECT auth.uid() FROM new_profiles WHERE (new_profiles.id = customer_addresses.profile_id)))`
    - **الشرح:** يسمح للعميل بتحديث عناوينه.
  - **Policy:** `Users can delete their own addresses` (DELETE)
    - **USING:** `(auth.uid() = ( SELECT auth.uid() FROM new_profiles WHERE (new_profiles.id = customer_addresses.profile_id)))`
    - **الشرح:** يسمح للعميل بحذف عناوينه.
  - **Policy:** `Users can view their own addresses` (SELECT)
    - **USING:** `(auth.uid() = ( SELECT auth.uid() FROM new_profiles WHERE (new_profiles.id = customer_addresses.profile_id)))`
    - **الشرح:** يسمح للعميل بالاطلاع على عناوينه.

- **Table:** `customer_phones`
  - **Policy:** `Users can insert their own phone numbers` (INSERT)
    - **CHECK:** `(auth.uid() = ( SELECT auth.uid() FROM new_profiles WHERE (new_profiles.id = customer_phones.profile_id)))`
    - **الشرح:** يسمح للعميل بإضافة أرقام هواتف جديدة.
  - **Policy:** `Users can update their own phone numbers` (UPDATE)
    - **USING:** `(auth.uid() = ( SELECT auth.uid() FROM new_profiles WHERE (new_profiles.id = customer_phones.profile_id)))`
    - **الشرح:** يسمح للعميل بتحديث أرقام هواتفه.
  - **Policy:** `Users can delete their own phone numbers` (DELETE)
    - **USING:** `(auth.uid() = ( SELECT auth.uid() FROM new_profiles WHERE (new_profiles.id = customer_phones.profile_id)))`
    - **الشرح:** يسمح للعميل بحذف أرقام هواتفه.
  - **Policy:** `Users can view their own phone numbers` (SELECT)
    - **USING:** `(auth.uid() = ( SELECT auth.uid() FROM new_profiles WHERE (new_profiles.id = customer_phones.profile_id)))`
    - **الشرح:** يسمح للعميل بالاطلاع على أرقام هواتفه.

- **Table:** `wallets` / `wallet_transactions`
  - **الشرح:** (يُفترض وجود سياسات تسمح للعميل بالاطلاع على محفظته ومعاملاتها وإجراء معاملات مثل الإيداع أو الدفع، بناءً على `auth.uid()` ومطابقته لـ `user_id` أو `wallet_id` المرتبط).

- **Table:** `complaints`
  - **Policy:** `Clients can insert their own complaints.` (INSERT)
    - **CHECK:** `(( SELECT auth.uid() AS uid) = client_id)`
    - **الشرح:** يسمح للعميل بإضافة شكوى لنفسه.
  - **الشرح:** (يُفترض وجود سياسات تسمح للعميل بالاطلاع على شكاواه الخاصة).

- **Table:** `order_details` / `invoice_details`
  - **Policy:** `Enable read access for all users` / (Assumed Policy)
    - **الشرح:** تسمح (أو يُفترض أن تسمح) للمستخدمين (بما في ذلك العميل) بقراءة تفاصيل الطلبات/الفواتير المرتبطة بطلباتهم.

- **Table:** `messages` / `conversations` / `conversation_participants`
  - **الشرح:** الوصول يعتمد على ما إذا كان العميل مشاركًا في المحادثة (عبر `customer_id`).

- **Table:** `customer_interactions`
  - **Policy:** `customer_interactions_basic_policy` (ALL)
    - **USING/CHECK:** `((auth.uid() = customer_id) OR ...)`
    - **الشرح:** يسمح للعميل بالوصول (قراءة، إضافة، تعديل، حذف) للتفاعلات المتعلقة به.

- **Table:** `system_notifications`
  - **Policy:** `Users can view notifications targeted to them` (SELECT)
    - **USING:** `((target_user_id = auth.uid()) OR (target_role = 'all'::text) OR ...)`
    - **الشرح:** يسمح للعميل برؤية الإشعارات الموجهة له مباشرة أو للجميع.
  - **Policy:** `Users can mark their notifications as read` (UPDATE)
    - **USING:** `(target_user_id = auth.uid())`
    - **CHECK:** (Complex check ensuring only `is_read` changes)
    - **الشرح:** يسمح للعميل بتحديث الإشعار لتمييزه كمقروء.

- **Table:** `waste_invoices`
  - **الشرح:** (يُفترض وجود سياسة تسمح للعميل بقراءة الفواتير المرتبطة بجلساته أو طلباته).
  - **Policy:** `Allow authorized users to update invoices` (UPDATE) (Maybe customer approval?)
    - **USING:** `(auth.uid() = created_by)`
    - **الشرح:** (إذا كان `created_by` هو العميل) يسمح للعميل بتحديث الفاتورة (ربما لتأكيد الموافقة؟). *تحتاج لمراجعة*. قد تكون مرتبطة بدالة `update_invoice_approval_status`.

## Relevant Triggers

*(Triggers related to customer actions)*

- **Table:** `customers`
  - **Trigger:** `new_customer_profile_trigger` (AFTER INSERT)
    - **Executes:** `create_new_profile_on_customer_insert()`
    - **الشرح:** عند إنشاء سجل عميل جديد، يقوم بإنشاء سجل مطابق في `new_profiles`.
  - **Trigger:** (Assumed `update_timestamp` trigger)
    - **الشرح:** (يُفترض وجود مشغل لتحديث حقل `updated_at` تلقائيًا عند تعديل بيانات العميل).

- **Table:** `new_profiles`
  - **Trigger:** `create_default_address_trigger` (AFTER INSERT)
    - **Executes:** `create_default_address()`
    - **الشرح:** عند إنشاء ملف تعريف جديد، يقوم بإنشاء عنوان افتراضي له في `customer_addresses`.
  - **Trigger:** `sync_phone_trigger` (AFTER INSERT, UPDATE)
    - **Executes:** `sync_phone_to_customer_phones()`
    - **الشرح:** عند إضافة أو تحديث رقم الهاتف في `new_profiles`، يقوم بمزامنته مع جدول `customer_phones` (يضيفه أو يجعله أساسيًا).
  - **Trigger:** (Assumed `update_timestamp` trigger)
    - **الشرح:** (يُفترض وجود مشغل لتحديث حقل `updated_at` تلقائيًا عند تعديل بيانات الملف الشخصي).

- **Table:** `customer_orders`
  - **Trigger:** `update_customer_orders_timestamp` (BEFORE UPDATE)
    - **Executes:** `update_customer_timestamp()`
    - **الشرح:** يحدث حقل `updated_at` تلقائيًا عند تعديل طلب العميل.
  - **Trigger:** `sync_amounts_from_customer_order` (AFTER UPDATE)
    - **Executes:** `sync_delivery_amounts()`
    - **الشرح:** عند تحديث المبالغ أو حالة التحقق في `customer_orders`، يقوم بمزامنة هذه القيم إلى السجل المقابل في `delivery_orders`.
  - **Trigger:** `tr_create_delivery_order` (AFTER INSERT)
    - **Executes:** `create_delivery_order()`
    - **الشرح:** عند إنشاء طلب عميل جديد، يقوم تلقائيًا بإنشاء سجل مقابل له في جدول `delivery_orders` لنظام التوصيل.

- **Table:** `invoice_details`
  - **Trigger:** `update_invoice_details_timestamp` (BEFORE UPDATE)
    - **Executes:** `update_customer_timestamp()`
    - **الشرح:** يحدث حقل `updated_at` تلقائيًا عند تعديل تفاصيل الفاتورة.
  - **Trigger:** `update_customer_totals` (AFTER INSERT, UPDATE)
    - **Executes:** `update_customer_order_totals()`
    - **الشرح:** عند إضافة أو تحديث تفاصيل الفاتورة، يقوم بإعادة حساب وتحديث الإجماليات (`expected_total`, `actual_total`, `is_fully_verified`) في السجل الأب `customer_orders`.
  - **Trigger:** `trigger_update_invoice_details_id` (AFTER INSERT)
    - **Executes:** `update_invoice_details_id()`
    - **الشرح:** (يبدو أنه يحاول تحديث معرف تفاصيل الفاتورة في `delivery_orders`، قد يكون زائدًا عن الحاجة أو بحاجة لمراجعة).

- **Table:** `customer_addresses`
  - **Trigger:** `update_customer_addresses_modtime` (BEFORE UPDATE)
    - **Executes:** `update_modified_column()`
    - **الشرح:** يحدث حقل `updated_at` تلقائيًا عند تعديل عنوان العميل.
  - **Trigger:** `single_default_address_trigger` (AFTER INSERT, UPDATE)
    - **Executes:** `enforce_single_default_address()`
    - **الشرح:** يضمن وجود عنوان افتراضي واحد فقط للعميل؛ عند تعيين عنوان كافتراضي، يتم إلغاء تحديد العناوين الأخرى.
  - **Trigger:** `ensure_profile_id` (BEFORE INSERT)
    - **Executes:** `set_profile_id()`
    - **الشرح:** إذا لم يتم توفير `profile_id` عند إضافة عنوان، يحاول تعيينه باستخدام `auth.uid()$.

- **Table:** `customer_phones`
  - **Trigger:** `update_customer_phones_modtime` (BEFORE UPDATE)
    - **Executes:** `update_modified_column()`
    - **الشرح:** يحدث حقل `updated_at` تلقائيًا عند تعديل رقم هاتف العميل.
  - **Trigger:** `single_primary_phone_trigger` (AFTER INSERT, UPDATE)
    - **Executes:** `enforce_single_primary_phone()`
    - **الشرح:** يضمن وجود رقم هاتف أساسي واحد فقط للعميل؛ عند تعيين رقم كأساسي، يتم إلغاء تحديد الأرقام الأخرى.

- **Table:** `messages`
  - **Trigger:** `update_conversation_last_message` (AFTER INSERT)
    - **Executes:** `update_conversation_on_new_message()`
    - **الشرح:** عند إرسال رسالة جديدة (من العميل أو إليه)، يقوم بتحديث بيانات المحادثة الأم (آخر رسالة، الوقت، عداد غير المقروء للمستلمين).

### مخطط العلاقات الخاص بالتطبيق (ERD)

```mermaid
erDiagram
    %% Customer Application Specific Relationships
    new_profiles ||--o{ customer_addresses : "profile_id"
    new_profiles ||--o{ customer_orders : "profile_id"
    new_profiles ||--o{ customer_phones : "profile_id (fk_profile)"
    customers ||--o{ new_profiles : "id (new_profiles_id_fkey)"
    customers ||--o{ customer_addresses : "default_address_id" %% Also fk_default_address
    wallets ||--o{ wallet_transactions : "wallet_id"
    payment_qr_codes ||--o{ wallet_transactions : "qr_code_id"
    customer_orders ||--o{ invoice_details : "customer_order_id"
    new_profiles ||--o{ customer_interactions : "customer_id"
    %% Relationships to shared/core tables from Customer context
    customer_orders ||--o{ order_details : "order_id (fk_order_details_customer)"
    customers ||--o{ messages : "sender_customer_id"
    customers ||--o{ conversation_participants : "customer_id"

``` 