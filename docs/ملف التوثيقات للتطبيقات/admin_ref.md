# Admin Application Database Documentation

This document provides a comprehensive overview of the database schema used by the admin application.

## Tables

### `admins`

**الشرح:** الجدول الرئيسي لتخزين بيانات حسابات المشرفين وربطهم بالمستخدمين في `auth.users` وأدوارهم وإداراتهم.

| Column Name         | Data Type                 | Nullable | Default             | Notes                                            |
| ------------------- | ------------------------- | -------- | ------------------- | ------------------------------------------------ |
| `id`                | uuid                      | NO       | uuid_generate_v4()  | Primary Key (Admin specific ID)                  |
| `user_id`           | uuid                      | YES      |                     | Foreign Key to `auth.users.id`                   |
| `department_id`     | uuid                      | YES      |                     | Foreign Key to `departments`                     |
| `role_id`           | uuid                      | YES      |                     | Foreign Key to `roles`                           |
| `manager_id`        | uuid                      | YES      |                     | Foreign Key to `admins` (for hierarchy)        |
| `email`             | text                      | NO       |                     | Admin's email address                            |
| `username`          | text                      | YES      |                     | Admin's username                                 |
| `full_name`         | text                      | YES      |                     | Admin's full name                                |
| `phone`             | text                      | YES      |                     | Admin's phone number                             |
| `job_title`         | text                      | YES      |                     | Admin's job title                                |
| `profile_image_url` | text                      | YES      |                     | URL of the admin's profile picture                |
| `permissions`       | jsonb                     | YES      |                     | JSONB field for direct permission overrides (legacy?) |
| `is_active`         | boolean                   | NO       | true                | Flag indicating if the admin account is active     |
| `last_login`        | timestamp with time zone  | YES      |                     | Timestamp of the last login                      |
| `created_at`        | timestamp with time zone  | NO       | CURRENT_TIMESTAMP   | Record creation time                             |
| `updated_at`        | timestamp with time zone  | NO       | CURRENT_TIMESTAMP   | Record last update time                            |

### `roles`

**الشرح:** تعريف الأدوار المختلفة للمشرفين وصلاحياتهم الأساسية.

| Column Name | Data Type                 | Nullable | Default             | Notes                                              |
| ----------- | ------------------------- | -------- | ------------------- | -------------------------------------------------- |
| `id`        | uuid                      | NO       | uuid_generate_v4()  | Primary Key                                        |
| `name`      | text                      | NO       |                     | Name of the role (e.g., Super Admin, Manager, Viewer) |
| `description`| text                     | YES      |                     | Description of the role                            |
| `level`     | integer                   | NO       | 0                   | Hierarchy level of the role                        |
| `is_system` | boolean                   | NO       | false               | Flag indicating if it's a system-defined role    |
| `is_active` | boolean                   | NO       | true                | Flag indicating if the role is currently active      |
| `created_at`| timestamp with time zone  | NO       | CURRENT_TIMESTAMP   | Record creation time                               |
| `updated_at`| timestamp with time zone  | NO       | CURRENT_TIMESTAMP   | Record last update time                            |
| `code`      | text                      | YES      |                     | Unique code for the role (e.g., 'super_admin')     |

### `permissions`

**الشرح:** تعريف الصلاحيات الفردية (الإجراءات الممكنة على الموارد).

| Column Name | Data Type                 | Nullable | Default             | Notes                                           |
| ----------- | ------------------------- | -------- | ------------------- | ----------------------------------------------- |
| `id`        | uuid                      | NO       | uuid_generate_v4()  | Primary Key                                     |
| `resource_id`| uuid                     | NO       |                     | Foreign Key to `resources`                      |
| `action_id` | uuid                      | NO       |                     | Foreign Key to `actions`                        |
| `description`| text                     | YES      |                     | Description of the permission                   |
| `code`      | text                      | NO       |                     | Unique code (e.g., 'users:read', 'orders:update') |
| `created_at`| timestamp with time zone  | NO       | CURRENT_TIMESTAMP   | Record creation time                            |
| `name`      | text                      | YES      |                     | Human-readable name of the permission           |
| `updated_at`| timestamp with time zone  | YES      |                     | Record last update time                         |

### `role_permissions`

**الشرح:** ربط الأدوار بالصلاحيات الممنوحة لها.

| Column Name   | Data Type                 | Nullable | Default             | Notes                                |
| ------------- | ------------------------- | -------- | ------------------- | ------------------------------------ |
| `id`          | uuid                      | NO       | uuid_generate_v4()  | Primary Key                          |
| `role_id`     | uuid                      | NO       |                     | Foreign Key to `roles`               |
| `permission_id`| uuid                    | NO       |                     | Foreign Key to `permissions`         |
| `created_at`  | timestamp with time zone  | NO       | CURRENT_TIMESTAMP   | Record creation time                 |
| `created_by`  | uuid                      | YES      |                     | Admin ID who granted the permission |

### `admin_permissions_overrides`

**الشرح:** السماح بمنح أو منع صلاحيات محددة لمشرف معين بشكل استثنائي، متجاوزًا دوره الأساسي.

| Column Name           | Data Type                 | Nullable | Default             | Notes                                              |
| --------------------- | ------------------------- | -------- | ------------------- | -------------------------------------------------- |
| `id`                  | uuid                      | NO       | uuid_generate_v4()  | Primary Key                                        |
| `admin_id`            | uuid                      | NO       |                     | Foreign Key to `admins` (the admin being overridden) |
| `permission_id`       | uuid                      | NO       |                     | Foreign Key to `permissions` (the permission)    |
| `is_granted`          | boolean                   | NO       | true                | True if granted, False if denied                 |
| `reason`              | text                      | YES      |                     | Reason for the override                            |
| `granted_by_admin_id` | uuid                      | YES      |                     | Admin ID who created the override                |
| `expires_at`          | timestamp with time zone  | YES      |                     | Optional expiry date for the override              |
| `created_at`          | timestamp with time zone  | NO       | CURRENT_TIMESTAMP   | Record creation time                               |

### `resources`

**الشرح:** تعريف الموارد التي يمكن التحكم فيها (مثل الجداول، الواجهات، إلخ).

| Column Name | Data Type                 | Nullable | Default             | Notes                                  |
| ----------- | ------------------------- | -------- | ------------------- | -------------------------------------- |
| `id`        | uuid                      | NO       | uuid_generate_v4()  | Primary Key                            |
| `name`      | text                      | NO       |                     | Name of the resource (e.g., 'Users')    |
| `description`| text                     | YES      |                     | Description of the resource            |
| `code`      | text                      | NO       |                     | Unique code for the resource (e.g., 'users') |
| `is_active` | boolean                   | NO       | true                | Is the resource currently active?      |
| `created_at`| timestamp with time zone  | NO       | CURRENT_TIMESTAMP   | Record creation time                   |
| `updated_at`| timestamp with time zone  | NO       | CURRENT_TIMESTAMP   | Record last update time                |

### `actions`

**الشرح:** تعريف الإجراءات التي يمكن تنفيذها على الموارد (مثل قراءة، إنشاء، تحديث، حذف).

| Column Name | Data Type                 | Nullable | Default             | Notes                                |
| ----------- | ------------------------- | -------- | ------------------- | ------------------------------------ |
| `id`        | uuid                      | NO       | uuid_generate_v4()  | Primary Key                          |
| `name`      | text                      | NO       |                     | Name of the action (e.g., 'Read')    |
| `description`| text                     | YES      |                     | Description of the action            |
| `code`      | text                      | NO       |                     | Unique code for the action (e.g., 'read') |
| `created_at`| timestamp with time zone  | NO       | CURRENT_TIMESTAMP   | Record creation time                 |

### `data_scopes`

**الشرح:** تعريف نطاقات البيانات لتطبيق تصفية دقيقة على الوصول للبيانات بناءً على شروط محددة.

| Column Name | Data Type                 | Nullable | Default             | Notes                                              |
| ----------- | ------------------------- | -------- | ------------------- | -------------------------------------------------- |
| `id`        | uuid                      | NO       | uuid_generate_v4()  | Primary Key                                        |
| `name`      | text                      | NO       |                     | Name of the data scope                             |
| `description`| text                     | YES      |                     | Description of the scope                           |
| `admin_id`  | uuid                      | YES      |                     | Link to specific admin (if scope is admin-specific) |
| `role_id`   | uuid                      | YES      |                     | Link to specific role (if scope is role-specific)   |
| `group_id`  | uuid                      | YES      |                     | Link to specific group (if scope is group-specific) |
| `resource_id`| uuid                    | NO       |                     | Foreign Key to `resources` (resource being scoped) |
| `condition` | jsonb                     | NO       |                     | JSONB defining the filtering condition             |
| `created_at`| timestamp with time zone  | NO       | CURRENT_TIMESTAMP   | Record creation time                               |
| `created_by`| uuid                      | YES      |                     | Admin ID who created the scope                   |
| `is_active` | boolean                   | NO       | true                | Is the scope currently active?                     |

### `admin_activity_log`

**الشرح:** سجل لتتبع الأنشطة والإجراءات التي يقوم بها المشرفون في النظام.

| Column Name | Data Type                 | Nullable | Default             | Notes                                      |
| ----------- | ------------------------- | -------- | ------------------- | ------------------------------------------ |
| `id`        | uuid                      | NO       | uuid_generate_v4()  | Primary Key                                |
| `admin_id`  | uuid                      | NO       |                     | Foreign Key to `admins` (who performed action) |
| `action_type`| text                    | NO       |                     | Type of action performed (e.g., 'login', 'update_user') |
| `target_type`| text                    | YES      |                     | Type of the entity affected (e.g., 'user', 'order') |
| `target_id` | text                      | YES      |                     | ID of the entity affected                |
| `details`   | jsonb                     | YES      |                     | Additional details about the action        |
| `ip_address`| text                      | YES      |                     | IP address from which action was performed |
| `user_agent`| text                      | YES      |                     | User agent string of the admin's browser |
| `created_at`| timestamp with time zone  | NO       | CURRENT_TIMESTAMP   | Timestamp of the activity                  |

### `admin_system_settings`

**الشرح:** لتخزين إعدادات النظام العامة التي يتحكم فيها المشرفون.

| Column Name   | Data Type                 | Nullable | Default             | Notes                          |
| ------------- | ------------------------- | -------- | ------------------- | ------------------------------ |
| `id`          | uuid                      | NO       | uuid_generate_v4()  | Primary Key                    |
| `setting_key` | text                      | NO       |                     | Unique key for the setting     |
| `setting_value`| jsonb                   | NO       |                     | Value of the setting (as JSONB) |
| `description` | text                      | YES      |                     | Description of the setting     |
| `updated_at`  | timestamp with time zone  | NO       | CURRENT_TIMESTAMP   | Last update time               |
| `updated_by`  | uuid                      | YES      |                     | Admin who last updated setting |

### `categories` / `subcategories`

**الشرح:** إدارة فئات وفئات فرعية للمخلفات أو المنتجات.
*(Details omitted for brevity, assume standard structure with name, description, parent category link)*

### `delivery_boys` (Admin View)

**الشرح:** عرض وإدارة بيانات مندوبي التوصيل (تحديث الحالة، المراجعة، إلخ).
*(Details omitted for brevity, assume admin has read/update access)*

### `customer_orders` (Admin View)

**الشرح:** عرض وإدارة طلبات العملاء (مراجعة، إعادة تعيين، تحليل).
*(Details omitted for brevity, assume admin has read/update access)*

### `customers` / `new_profiles` (Admin View)

**الشرح:** عرض وإدارة بيانات العملاء.
*(Details omitted for brevity, assume admin has read/update access)*

### `complaints` (Admin View)

**الشرح:** مراجعة وإدارة شكاوى العملاء.
*(Details omitted for brevity, assume admin has full access)*

### `payment_settlements` (Admin View)

**الشرح:** مراجعة وإدارة تسويات المدفوعات للمناديب.
*(Details omitted for brevity, assume admin has full access)*

### `analytics_dashboard`

**الشرح:** جدول لتخزين بيانات تحليلية مجمعة لعرضها في لوحة التحكم.
*(Details omitted for brevity)*

### `admin_groups` / `admin_group_members`

**الشرح:** إدارة مجموعات المشرفين والأعضاء فيها لتطبيق صلاحيات جماعية.
*(Details omitted for brevity)*

### `departments`

**الشرح:** إدارة الأقسام التنظيمية داخل الشركة (إذا كانت مستخدمة).
*(Details omitted for brevity)*

### `geographic_zones`

**الشرح:** إدارة المناطق الجغرافية وتحديد خصائصها.
*(Details omitted for brevity)*

### `delivery_vehicles` / `vehicle_maintenance_log`

**الشرح:** إدارة مركبات التوصيل وسجلات صيانتها.
*(Details omitted for brevity)*

### `system_notifications` (Admin View)

**الشرح:** إنشاء وإدارة الإشعارات المرسلة للمستخدمين.
*(Details omitted for brevity, assume admin has insert/manage access)*

### `onboarding_data`
*(Details omitted for brevity)*

### `invoice_details`
*(Details omitted for brevity)*

### `new_profiles_delivery`
*(Details omitted for brevity)*

### `waste_data_admin`
*(Details omitted for brevity)*

### `waste_recycling`
*(Details omitted for brevity)*

### `waste_weights`
*(Details omitted for brevity)*

### `delivery_boy_order_history`
*(Details omitted for brevity)*

### `delivery_orders`
*(Details omitted for brevity)*

### `delivery_performance_stats`
*(Details omitted for brevity)*

### `delivery_status_history`
*(Details omitted for brevity)*

### `payment_qr_codes`
*(Details omitted for brevity)*

### `delivery_ratings`
*(Details omitted for brevity)*

### `delivery_locations`
*(Details omitted for brevity)*

### `delivery_documents`
*(Details omitted for brevity)*

### `delivery_earnings`
*(Details omitted for brevity)*

### `customer_phones`
*(Details omitted for brevity)*

### `wallets`
*(Details omitted for brevity)*

### `wallet_transactions`
*(Details omitted for brevity)*

### `delivery_zones`
*(Details omitted for brevity)*

### `order_details`
*(Details omitted for brevity)*

### `tracking_points_with_details` (View)
*(Details omitted for brevity)*

### `conversations`
*(Details omitted for brevity)*

### `conversation_participants`
*(Details omitted for brevity)*

### `order_schedule`
*(Details omitted for brevity)*

### `resources`
*(Details omitted for brevity)*

### `roles`
*(Details omitted for brevity)*

### `actions`
*(Details omitted for brevity)*

### `group_permissions`
*(Details omitted for brevity)*

### `approval_workflows`
*(Details omitted for brevity)*

### `admin_activity_log`
*(Details omitted for brevity)*

### `order_tracking`
*(Details omitted for brevity)*

### `admin_system_settings`
*(Details omitted for brevity)*

### `customer_interactions`
*(Details omitted for brevity)*

### `waste_collection_sessions`
*(Details omitted for brevity)*

### `waste_collection_items`
*(Details omitted for brevity)*

### `waste_invoices`
*(Details omitted for brevity)*

### `admin_invitations`
*(Details omitted for brevity)*

### `admin_groups`
*(Details omitted for brevity)*

### `admin_group_members`
*(Details omitted for brevity)*

### `scoped_permissions`
*(Details omitted for brevity)*

### `delivery_boy_daily_performance`
*(Details omitted for brevity)*

### `analytics_dashboard`
*(Details omitted for brevity)*

### `geographic_zones`
*(Details omitted for brevity)*

### `delivery_vehicles`
*(Details omitted for brevity)*

### `vehicle_maintenance_log`
*(Details omitted for brevity)*

### `system_notifications`
*(Details omitted for brevity)*

### `delegated_permissions`
*(Details omitted for brevity)*

### `active_delivery_boys_view` (View)
*(Details omitted for brevity)*

### `data_scopes`
*(Details omitted for brevity)*

### `messages`
*(Details omitted for brevity)*

### `permission_audit_log`
*(Details omitted for brevity)*

### `logs.user_creation_log`
*(Details omitted for brevity)*

### `logs.verification_attempts`
*(Details omitted for brevity)*

### `logs.errors`
*(Details omitted for brevity)*

## Extensions

- `postgis_topology` (version 3.3.2)
- `plpgsql` (version 1.0)
- `pgsodium` (version 3.1.8)
- `pgtap` (version 1.1.0)
- `plpgsql_check` (version 2.6)
- `postgis` (version 3.3.2)
- `pg_graphql` (version 1.5.1)
- `pg_stat_statements` (version 1.10)
- `uuid-ossp` (version 1.1)
- `pgsodium_masks` (version 3.1.8)
- `supabase_vault` (version 0.1.3)
- `pgjwt` (version 0.2.0)
- `pgcrypto` (version 1.3)

## Functions

*(Functions relevant to admin actions and system management)*

- **`check_admin_permission_enhanced(p_admin_id uuid, permission_code text)`**: `boolean`
  - **الشرح:** التحقق مما إذا كان لدى المشرف المحدد صلاحية معينة، مع الأخذ في الاعتبار الصلاحيات المباشرة، الدور، المجموعات، التجاوزات، والتسلسل الهرمي للمدراء.

- **`add_admin_permission_override(p_admin_id uuid, p_permission_code text, p_is_granted boolean, p_reason text, p_granted_by_admin_id uuid, p_expires_at timestamp with time zone DEFAULT NULL)`**: `uuid`
  - **الشرح:** إضافة أو تحديث تجاوز صلاحية لمشرف معين، إما لمنحه أو منعه صلاحية محددة، مع تسجيل السبب والمانح وتاريخ انتهاء صلاحية اختياري.

- **`create_data_scope(p_name text, p_resource_code text, p_condition jsonb, p_admin_id uuid DEFAULT NULL, p_role_id uuid DEFAULT NULL, p_group_id uuid DEFAULT NULL, p_created_by uuid DEFAULT NULL)`**: `uuid`
  - **الشرح:** إنشاء نطاق بيانات جديد لتقييد الوصول إلى مورد معين بناءً على شرط (بسيط)، مع ربطه بمشرف أو دور أو مجموعة معينة.

- **`create_data_scope_enhanced(p_name text, p_resource_code text, p_conditions jsonb[], ...)`**: `uuid`
  - **الشرح:** نسخة محسنة لإنشاء نطاق بيانات، تدعم شروطًا متعددة مركبة (AND/OR).

- **`apply_data_scopes(p_admin_id uuid, p_resource_code text, p_base_query text)`**: `text`
  - **الشرح:** تعديل استعلام SQL أساسي بإضافة شروط `WHERE` تلقائيًا بناءً على نطاقات البيانات النشطة المطبقة على المشرف المحدد للمورد المحدد (يدعم الشروط البسيطة).

- **`apply_data_scopes_enhanced(p_admin_id uuid, p_resource_code text, p_base_query text)`**: `text`
  - **الشرح:** نسخة محسنة لتطبيق نطاقات البيانات، تستخدم دالة `parse_data_scope_condition` لدعم شروط أكثر تعقيدًا (AND/OR).

- **`parse_data_scope_condition(condition jsonb)`**: `text`
  - **الشرح:** دالة مساعدة لتحليل بنية شرط نطاق البيانات (JSONB) وتحويله إلى جزء صالح من جملة SQL `WHERE`.

- **`log_admin_activity(admin_id uuid, action_type text, target_type text, target_id text, details jsonb, ip_address text DEFAULT NULL, user_agent text DEFAULT NULL)`**: `uuid`
  - **الشرح:** تسجيل نشاط قام به مشرف في جدول `admin_activity_log`.

- **`setup_permissions()`**: `void`
  - **الشرح:** دالة لإعادة إنشاء أو تحديث الصلاحيات في جدول `permissions` بناءً على الموارد والإجراءات المعرفة، ومنح الصلاحيات الأساسية لأدوار النظام (مثل super_admin, viewer).

- **`cleanup_expired_overrides()`**: `integer`
  - **الشرح:** حذف تجاوزات الصلاحيات منتهية الصلاحية من جدول `admin_permissions_overrides` وتسجيل الحذف في سجل التدقيق.

- **`get_my_role()`**: `text`
  - **الشرح:** استرجاع رمز الدور (`code`) للمشرف الحالي المصادق عليه.

- **`delete_user_completely(user_id_to_delete uuid)`**: `boolean`
  - **الشرح:** حذف مستخدم بالكامل من النظام (بما في ذلك من `auth.users` و `delivery_boys`).

- **`smart_assign_order(p_order_id uuid)`**: `uuid`
  - **الشرح:** (إذا كانت تستدعى من لوحة التحكم) محاولة تعيين طلب لمندوب توصيل متاح ومناسب تلقائيًا بناءً على الموقع والكفاءة.

- **`get_nearby_available_delivery_boys(lat numeric, lng numeric, distance_km numeric DEFAULT 5)`**: `TABLE(...)`
  - **الشرح:** البحث عن مندوبي التوصيل المتاحين والمتصلين ضمن نطاق محدد حول نقطة جغرافية معينة.

- **`find_online_inactive_delivery_boys()`**: `TABLE(...)`
  - **الشرح:** البحث عن مندوبي التوصيل المتصلين ولكن حالتهم ليست `active` أو غير متاحين لاستلام الطلبات.

- **`get_delivery_boy_performance(p_delivery_boy_id uuid, p_start_date date, p_end_date date)`**: `TABLE(...)`
  - **الشرح:** استرداد إحصائيات الأداء اليومية لمندوب توصيل معين خلال فترة زمنية محددة.

- **`get_waste_type_stats(p_start_date timestamp with time zone, p_end_date timestamp with time zone)`**: `TABLE(...)`
  - **الشرح:** استرداد إحصائيات مجمعة لأنواع النفايات (الوزن، الطلبات، الإيرادات) خلال فترة زمنية محددة.

*(قد تكون هناك دوال أخرى متعلقة بإدارة المستخدمين، الطلبات، أو الإعدادات يتم استدعاؤها عبر واجهة برمجة التطبيقات)*

## Types

### ENUM Types

*(ENUM types relevant to admin context)*

- **`delivery_boy_status`**: (`active`, `busy`, `inactive`, `suspended`)
  - **الشرح:** الحالات التي يمكن للمشرف تعيينها لمندوب التوصيل.

- **`customer_status`**: (`active`, `inactive`, `suspended`, `blocked`, `pending_verification`)
  - **الشرح:** الحالات التي يمكن للمشرف تعيينها للعميل.

- **`transaction_status`**: (`pending`, `completed`, `failed`, `cancelled`, `verification_pending`, `verified`)
  - **الشرح:** الحالات المختلفة للمعاملات المالية التي قد يراقبها المشرف.

- **`verification_status`**: (`pending`, `verified`, `expired`, `max_attempts`, `failed`)
  - **الشرح:** حالات عمليات التحقق التي قد يراقبها أو يديرها المشرف.

- **`profile_status_enum`**: (`active`, `inactive`, `pending`, `suspended`, `incomplete`)
  - **الشرح:** حالات ملفات تعريف المستخدمين التي قد يديرها المشرف.

- **`approval_status`**: (`pending`, `under_review`, `approved`, `rejected`)
  - **الشرح:** حالات الموافقة التي قد يستخدمها المشرف في عمليات مختلفة.

- **`delivery_status_enum`**: (`pending`, `confirmed`, `pickedUp`, `inReceipt`, `completed`, `cancelled`, `scheduled`, `returned`, `canceled`)
  - **الشرح:** جميع حالات الطلب التي قد يراها أو يعدلها المشرف.

*(الأنواع الأخرى مثل `vehicle_type`, `payment_method_enum`, `order_priority_enum` قد تكون ذات صلة أيضًا حسب مسؤوليات المشرف.)*

### Composite & Other Types
*(List of composite, base, pseudo, domain, range types would go here. Omitted for brevity.)*

## Row Level Security Policies

*(Policies governing admin access to system data and user management)*

- **General Admin Access:**
  - **Tables:** `customers`, `delivery_boys`, `customer_orders`, `delivery_orders`, `complaints`, `wallets`, `wallet_transactions`, `categories`, `subcategories`, `analytics_dashboard`, `geographic_zones`, `delivery_vehicles`, etc.
  - **Policies:** (Often policies checking for `auth.jwt() ->> 'role' = 'admin'` or specific permission checks using `check_admin_permission_enhanced`)
  - **الشرح:** يُفترض وجود سياسات تسمح للمشرفين (بناءً على أدوارهم وصلاحياتهم) بالاطلاع على وتعديل بيانات المستخدمين والطلبات والإعدادات المختلفة حسب الحاجة.

- **Table:** `admins`
  - **Policy:** `Allow managers to select all admin records` (SELECT)
    - **USING:** `check_admin_permission_enhanced(auth.uid(), 'admins:manage'::text)`
    - **الشرح:** يسمح للمشرفين الذين لديهم صلاحية `admins:manage` بالاطلاع على جميع سجلات المشرفين الآخرين.
  - **Policy:** `Insert admins if they have permission` (INSERT)
    - **CHECK:** `(EXISTS ( SELECT 1 FROM admins a WHERE ((a.user_id = auth.uid()) AND (((a.permissions ->> 'admins:create'::text))::boolean = true))))`
    - **الشرح:** يسمح للمشرفين الذين لديهم صلاحية `admins:create` بإضافة مشرفين جدد.
  - **Policy:** `Allow admins with manage permission to update admins` (UPDATE)
    - **CHECK:** `((auth.role() = 'authenticated'::text) AND check_admin_permission_enhanced(( SELECT a.id FROM admins a WHERE (a.user_id = auth.uid()) LIMIT 1), 'admins:manage'::text))`
    - **الشرح:** يسمح للمشرفين الذين لديهم صلاحية `admins:manage` بتحديث بيانات أي مشرف آخر.
  - **Policy:** `Allow authenticated users to select own admin record` (SELECT)
    - **USING:** `(auth.uid() = user_id)`
    - **الشرح:** يسمح للمشرف بالاطلاع على سجله الخاص في جدول `admins`.

- **Table:** `roles`
  - **Policies:** (Various SELECT, INSERT, UPDATE, DELETE policies)
    - **CHECK/USING:** Based on `admins.permissions @> '{"roles:manage": true}'::jsonb` or `check_admin_permission_enhanced`.
    - **الشرح:** تسمح للمشرفين الذين لديهم صلاحية `roles:manage` بإدارة الأدوار (عرض، إنشاء، تحديث، حذف).

- **Table:** `permissions`
  - **Policy:** `المستخدمون المصادقون يمكنهم قراءة` (SELECT)
    - **USING:** `true`
    - **الشرح:** يسمح لجميع المستخدمين المصادق عليهم (بما في ذلك المشرفين) بقراءة تعريفات الصلاحيات.
  - **Policies:** (INSERT, UPDATE, DELETE policies)
    - **CHECK/USING:** Based on `admins.permissions @> '{"permissions:manage": true}'::jsonb` or checks for `settings:manage` or `permissions:manage`.
    - **الشرح:** تسمح للمشرفين الذين لديهم صلاحية `permissions:manage` أو `settings:manage` بإدارة الصلاحيات.

- **Table:** `admin_groups` / `admin_group_members`
  - **Policies:** (Various SELECT, INSERT, UPDATE, DELETE policies)
    - **CHECK/USING:** Often checks `get_my_role() = ANY (ARRAY['admin'::text, 'super_admin'::text])`.
    - **الشرح:** تسمح للمشرفين (بدور admin أو super_admin) بإدارة المجموعات وأعضائها.

- **Table:** `order_tracking`
  - **Policy:** `order_tracking_delete` (DELETE)
    - **USING:** `((auth.jwt() ->> 'role'::text) = 'admin'::text)`
    - **الشرح:** يسمح للمشرفين بحذف سجلات تتبع الطلبات.
  - **Policy:** `order_tracking_insert` / `order_tracking_update`
    - **CHECK/USING:** `((auth.uid() = delivery_boy_id) OR ((auth.jwt() ->> 'role'::text) = 'admin'::text))`
    - **الشرح:** يسمح للمشرف بإضافة أو تعديل نقاط تتبع لأي مندوب.

- **Table:** `delivery_boy_daily_performance`
  - **Policies:** (SELECT, INSERT, UPDATE)
    - **USING/CHECK:** Based on `auth.uid() IN ( SELECT users.id FROM auth.users WHERE ((users.role)::text = 'admin'::text))`.
    - **الشرح:** تسمح للمشرفين بالاطلاع على وإدارة بيانات الأداء اليومية لجميع المندوبين.

- **Table:** `system_notifications`
  - **Policy:** `Only admins can create system notifications` (INSERT)
    - **CHECK:** `(auth.uid() IN ( SELECT users.id FROM auth.users WHERE ((users.role)::text = 'admin'::text)))`
    - **الشرح:** يسمح للمشرفين فقط بإنشاء إشعارات النظام.

*(قد تكون هناك سياسات أخرى تمنح وصولًا خاصًا لدور `service_role` أو تستخدم نطاقات البيانات `data_scopes` لتصفية أدق.)*

## Triggers

*(Triggers related to admin account management, permissions, and activity logging)*

- **Table:** `auth.users`
  - **Trigger:** `on_auth_user_created` (AFTER INSERT)
    - **Executes:** `handle_new_user()` (This function likely routes to `process_new_admin_user` if user type is admin)
    - **الشرح:** عند إنشاء مستخدم جديد في `auth.users`، يتم استدعاء دالة لمعالجة إنشاء السجلات المقابلة في الجداول العامة (مثل `admins` إذا كان نوع المستخدم مشرف).
  - **Trigger:** `on_auth_user_updated` (AFTER UPDATE)
    - **Executes:** `update_admin_on_user_change()`
    - **الشرح:** عند تحديث بيانات مستخدم في `auth.users` (مثل البريد الإلكتروني)، يقوم بتحديث السجل المقابل في جدول `admins`.

- **Table:** `admins`
  - **Trigger:** `update_admins_updated_at` (BEFORE UPDATE)
    - **Executes:** `update_updated_at_column()`
    - **الشرح:** يحدث حقل `updated_at` تلقائيًا عند تعديل بيانات المشرف.

- **Table:** `roles`
  - **Trigger:** `update_roles_updated_at` (BEFORE UPDATE)
    - **Executes:** `update_updated_at_column()`
    - **الشرح:** يحدث حقل `updated_at` تلقائيًا عند تعديل بيانات الدور.

- **Table:** `admin_groups`
  - **Trigger:** `update_admin_groups_updated_at` (BEFORE UPDATE)
    - **Executes:** `update_updated_at_column()`
    - **الشرح:** يحدث حقل `updated_at` تلقائيًا عند تعديل بيانات مجموعة المشرفين.

- **Table:** `resources`
  - **Trigger:** `update_resources_updated_at` (BEFORE UPDATE)
    - **Executes:** `update_updated_at_column()`
    - **الشرح:** يحدث حقل `updated_at` تلقائيًا عند تعديل بيانات المورد.

- **Table:** `departments`
  - **Trigger:** `update_departments_updated_at` (BEFORE UPDATE)
    - **Executes:** `update_updated_at_column()`
    - **الشرح:** يحدث حقل `updated_at` تلقائيًا عند تعديل بيانات القسم.

- **General Triggers (on multiple tables):**
  - **Triggers like:** `handle_updated_at`, `set_updated_at`, `update_timestamp`, `update_modified_column`.
  - **الشرح:** مجموعة متنوعة من المشغلات عبر جداول مختلفة (مثل `admin_system_settings`, `permissions`, `categories`, `subcategories`, etc.) لضمان تحديث حقل `updated_at` تلقائيًا عند تعديل أي سجل.

*(قد تكون هناك مشغلات أخرى لتسجيل الأنشطة بشكل أكثر تفصيلاً أو لتحديث بيانات مجمعة بناءً على إجراءات المشرفين.)*

### مخطط العلاقات الخاص بالتطبيق (ERD)

```mermaid
erDiagram
    %% Admin Application Specific Relationships
    admins ||--o{ delegated_permissions : "from_admin_id / to_admin_id"
    permissions ||--o{ delegated_permissions : "permission_id"
    actions ||--o{ permissions : "action_id"
    resources ||--o{ permissions : "resource_id"
    admins ||--o{ admin_invitations : "invited_by"
    roles ||--o{ admin_invitations : "role_id"
    admins ||--o{ permission_audit_log : "changed_by"
    permissions ||--o{ permission_audit_log : "permission_id"
    admins ||--o{ admin_activity_log : "admin_id"
    admins ||--o{ admin_system_settings : "updated_by"
    departments ||--o{ departments : "parent_id" %% Hierarchy
    departments ||--o{ admins : "department_id"
    admins ||--o{ admins : "manager_id" %% Hierarchy
    roles ||--o{ admins : "role_id"
    departments ||--o{ admin_groups : "department_id"
    admins ||--o{ admin_group_members : "admin_id"
    admin_groups ||--o{ admin_group_members : "group_id"
    admins ||--o{ data_scopes : "admin_id / created_by"
    admin_groups ||--o{ data_scopes : "group_id"
    resources ||--o{ data_scopes : "resource_id"
    roles ||--o{ data_scopes : "role_id"
    admin_groups ||--o{ group_permissions : "group_id"
    permissions ||--o{ group_permissions : "permission_id"
    permissions ||--o{ role_permissions : "permission_id"
    roles ||--o{ role_permissions : "role_id"
    admins ||--o{ scoped_permissions : "admin_id"
    admin_groups ||--o{ scoped_permissions : "group_id"
    permissions ||--o{ scoped_permissions : "permission_id"
    roles ||--o{ scoped_permissions : "role_id"
    permission_scopes ||--o{ scoped_permissions : "scope_id"
    admins ||--o{ admin_permissions_overrides : "admin_id / granted_by_admin_id"
    permissions ||--o{ admin_permissions_overrides : "permission_id"
    %% Relationships to shared/core tables from Admin context
    categories ||--o{ waste_data_admin : "category_id"
    subcategories ||--o{ waste_data_admin : "subcategory_id"
    waste_data_admin ||--o{ waste_collection_items : "waste_data_id"

``` 