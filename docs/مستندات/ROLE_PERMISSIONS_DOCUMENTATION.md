# توثيق أدوار وصلاحيات النظام (حسب جدول role_permissions)

آخر تحديث: 2025-04-25

يوضح هذا المستند الأدوار المعرفة في النظام والصلاحيات الممنوحة لكل دور حاليًا من خلال جدول الربط `public.role_permissions`. تعتمد دالة التحقق من الصلاحيات (`check_admin_permission_enhanced`) على هذه الارتباطات لتحديد وصول المستخدم.

## الأدوار والصلاحيات

### 1. مدير النظام (`مدير النظام`, ID: `b98dc...`)
   - `reports:view`
   - `roles:manage`
   - `admins:create`
   - `admins:delete`
   - `admins:manage`
   - `admins:update`
   - `orders:manage`
   - `dashboard:view`
   - `reports:export`
   - `messages:manage`
   - `settings:manage`
   - *(ملاحظة: تم نسخ هذه الصلاحيات أيضًا إلى دور `admin`)*

### 2. مسؤول النظام (`admin`, ID: `000...002`)
   - `reports:view`
   - `roles:manage`
   - `admins:create`
   - `admins:delete`
   - `admins:manage`
   - `admins:update`
   - `orders:view`  *(أضيفت بشكل منفصل)*
   - `orders:manage`
   - `dashboard:view`
   - `reports:export`
   - `messages:manage`
   - `settings:manage`

### 3. مدير قسم (`manager`, ID: `000...003`)
   - `dashboard:view`
   - `orders:view`
   - `orders:create`
   - `orders:manage`
   - `orders:assign`
   - `agents:view`
   - `agents:manage`
   - `reports:view`
   - `reports:export`
   - `messages:view`
   - `messages:manage`

### 4. مشرف (`supervisor`, ID: `000...004`)
   - `dashboard:view`
   - `orders:view`
   - `orders:manage`
   - `orders:assign`
   - `agents:view`
   - `agents:manage`
   - `reports:view`

### 5. دعم فني (`support`, ID: `000...005`)
   - `dashboard:view`
   - `orders:view`
   - `agents:view`
   - `messages:view`
   - `messages:create`
   - `messages:reply`
   - `messages:manage`

### 6. مراقب (`viewer`, ID: `000...006`)
   - `dashboard:view`
   - `orders:view`
   - `agents:view`
   - `reports:view`

## ملاحظات هامة

*   **الاعتماد على `role_permissions`:** نظام التحقق من الصلاحيات يعتمد **أساسًا** على الارتباطات في جدول `role_permissions`.
*   **`admins.permissions`:** حقل `permissions` في جدول `admins` مخصص للصلاحيات المباشرة أو التجاوزات لمستخدم معين.
*   **`roles.permissions`:** حقل `permissions` في جدول `roles` لا يُستخدم حاليًا بواسطة دالة التحقق الأساسية، ولكنه قد يُستخدم بواسطة Trigger المزامنة (`sync_role_permissions`) لملء جدول `role_permissions` عند تحديث الدور.
*   **صلاحيات الإدارة الشاملة:** صلاحيات مثل `admins:manage`, `roles:manage`, `settings:manage` تمنح تحكمًا واسعًا ويجب منحها بحذر. 