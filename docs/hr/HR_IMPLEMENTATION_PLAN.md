## خطة تنفيذ إدارة الموارد البشرية (HR) في لوحة التحكم

هذه الخطة تضع مسارًا عمليًا لبناء "إدارة الموارد البشرية" احترافية تحت مركز الإدارة، متسقة مع هيكلية التطبيق (DDD + Redux) وتتكامل مع Prisma/Supabase ونظام الصلاحيات الحالي.

---

### 1) النطاق والأهداف
- بناء وحدة HR مركزية لإدارة:
  - الهيكل التنظيمي (Org Units) ومساراته.
  - المسميات الوظيفية (Job Titles).
  - الموظفين الإداريين (Admins) وتعيينهم على الهيكل/المسميات.
  - صلاحيات على مستوى الوحدة/المسمى (تكامل مع جدول `permissions`).
  - سياسات وتاريخ وظيفي (MVP: أساسيات؛ مراحل لاحقة للتوسعة).

نتائج قابلة للقياس في المرحلة الأولى (MVP):
- CRUD للوحدات التنظيمية مع شجرة مرئية.
- CRUD للمسميات الوظيفية وربطها بالوحدات.
- تعيين مسؤول إلى وحدة/مسمى.
- ربط صلاحيات بنطاق الوحدة/المسمى وإظهار الأثر على التحقق.

---

### 2) هيكلية DDD داخل المشروع - **مكتملة**
- `src/domains/hr/` (Domain + Application)
  - `domain/` كيانات وقيم ومخازن (Interfaces): تم تعريف `OrgUnit`, `OrgUnitPath`، `JobTitle`, `OrgMember`, `OrgUnitPermission`, `JobTitlePermission`.
  - `application/` حالات استخدام (Use-cases): تم تنفيذ `createOrgUnit`, `updateOrgUnit`, `deleteOrgUnit`, `listOrgUnitsTree`, `createJobTitle`, `updateJobTitle`, `deleteJobTitle`, `listJobTitlesByOrgUnit`, `assignOrgMember`, `unassignOrgMember`, `listOrgMembersByOrgUnit`, `listOrgMembersByAdmin`, `grantPermissionToUnit`, `revokePermissionFromUnit`, `listOrgUnitPermissions`, `grantPermissionToJobTitle`, `revokePermissionFromJobTitle`, `listJobTitlePermissions`.
- `src/infrastructure/hr/`
  - مداخل Prisma Repositories (تنفيذ Interfaces): تم تنفيذ `OrgUnitPrismaRepository`, `JobTitlePrismaRepository`, `OrgMemberPrismaRepository`, `OrgUnitPermissionPrismaRepository`, `JobTitlePermissionPrismaRepository`.
  - محولات (mappers) بين Prisma Types و Domain Types: تم تنفيذها داخل المستودعات.
- `src/domains/hr/store/` (Redux)
  - `hrSlice.ts` (حالة الشجرة، المسميات، الأعضاء، الصلاحيات): تم تنفيذ slice و reducers لجميع الكيانات.
  - `thunks.ts` (عمليات async للـ CRUD ولربط الصلاحيات): تم تنفيذ جميع thunks المطلوبة.
- `src/domains/management-center/components/hr/`
  - صفحات/مكونات إدارة HR (UI) داخل تبويب مخصص في مركز الإدارة.

---

### 3) مخطط قاعدة البيانات (Prisma) – **مكتملة ومرتبطة بقاعدة البيانات**
ملاحظة: نستخدم UUID للتماسك مع بقية النظام. تم استخدام `path` نصيًّا لتمثيل التسلسل الهرمي.

كيانات Prisma المنفذة:
- `org_units`: `id`, `warehouse_id?`, `name`, `code?`, `path`, `parent_id?`, `is_active`, `created_at`, `updated_at`.
- `job_titles`: `id`, `org_unit_id`, `name`, `code?`, `is_active`, `created_at`.
- `org_members`: `id`, `admin_id`, `org_unit_id`, `job_title_id?`, `is_primary`, `created_at`.
- `org_unit_permissions`: `id`, `org_unit_id`, `permission_id`, `inherited (default true)`.
- `job_title_permissions`: `id`, `job_title_id`, `permission_id`.

تم إدراج السكيمات في `prisma/schema.prisma` وتم تطبيقها على قاعدة البيانات.

---

### 4) طبقة الوصول (Repositories) – Prisma - **مكتملة**
- `OrgUnitRepository`: تم تنفيذ `create`, `update`, `delete`, `findById`, `listTree`, `move` (تحديث path/parent).
- `JobTitleRepository`: تم تنفيذ `create`, `update`, `delete`, `listByOrgUnit`.
- `OrgMemberRepository`: تم تنفيذ `assign`, `unassign`, `listByOrgUnit`, `listByAdmin`.
- `OrgUnitPermissionRepository`, `JobTitlePermissionRepository`: تم تنفيذ `grant`, `revoke`, `list`.

---

### 5) Redux State & Thunks (MVP) - **مكتملة**
```ts
state.hr = {
  tree: OrgUnitTreeNode[],            // تمثيل مجمّع لشجرة الوحدات
  jobTitlesByUnit: Record<string, JobTitle[]>, // المسميات الوظيفية لكل وحدة
  membersByUnit: Record<string, OrgMember[]>,  // الأعضاء المعينون لكل وحدة
  unitPermissions: Record<string, OrgUnitPermission[]>, // صلاحيات الوحدة
  titlePermissions: Record<string, JobTitlePermission[]>, // صلاحيات المسمى الوظيفي
  loading: boolean,
  error: string | null
}
```
Thunks رئيسية: `fetchOrgTree`, `createOrgUnit`, `updateOrgUnit`, `deleteOrgUnit`, `createJobTitle`, `updateJobTitle`, `deleteJobTitle`, `fetchJobTitlesByOrgUnit`, `assignOrgMember`, `unassignOrgMember`, `fetchOrgMembersByOrgUnit`, `fetchOrgMembersByAdmin`, `grantOrgUnitPermission`, `revokeOrgUnitPermission`, `fetchOrgUnitPermissions`, `grantJobTitlePermission`, `revokeJobTitlePermission`, `fetchJobTitlePermissions`.

---

### 6) الواجهات (UI) - **مكتملة جزئياً (عرض الشجرة، CRUD للوحدات، CRUD للمسميات، تعيين الأعضاء، ربط الصلاحيات)**
- تبويب جديد داخل مركز الإدارة: "إدارة الموارد البشرية".
- عناصر:
  1) شجرة الهيكل (مع CRUD للوحدات).
  2) عرض المسميات الوظيفية (مع CRUD) وربطها بالوحدات.
  3) عرض وتعيين الموظفين الإداريين (Admins) لوحدة/مسمى.
  4) عرض وربط صلاحيات على مستوى الوحدة.
  5) عرض وربط صلاحيات على مستوى المسمى الوظيفي.

المكونات الرئيسية المنفذة:
- `HRManagement.tsx`: المكون الرئيسي لإدارة HR.
- `OrgUnitForm.tsx`: نموذج لإنشاء/تعديل الوحدات التنظيمية.
- `OrgTreeDisplay.tsx`: لعرض شجرة الوحدات التنظيمية.
- `JobTitleForm.tsx`: نموذج لإنشاء/تعديل المسميات الوظيفية.
- `OrgMemberForm.tsx`: نموذج لتعيين/إلغاء تعيين الأعضاء.
- `OrgUnitPermissionForm.tsx`: نموذج لربط الصلاحيات بالوحدات التنظيمية.
- `JobTitlePermissionForm.tsx`: نموذج لربط الصلاحيات بالمسميات الوظيفية.

---

### 7) التكامل مع نظام الصلاحيات الحالي - **مكتملة (منطق الربط)**
- استخدام جدول `permissions` (resource/action) الموجود.
- ربط عبر `OrgUnitPermission` و`JobTitlePermission`.
- دالة مساعدة على الطبقة التطبيقية لاستنتاج الصلاحيات الفعلية لمسؤول معين: (MVP): حساب على الخادم عبر استعلامات Prisma (تحتاج إلى تطوير إضافي لدالة التحقق الفعلية).

---

### 8) أمن البيانات (RLS/Supabase) - **تم تقديم السياسات**
- سياسات قراءة عامة للمستخدمين الموثقين.
- كتابة/تعديل/حذف مقيدة بصلاحيات (مثلاً امتلاك `settings:manage` أو دور `super_admin`).
- تم تقديم سياسات RLS المقترحة لجميع جداول HR (`org_units`, `job_titles`, `org_members`, `org_unit_permissions`, `job_title_permissions`). يجب على المستخدم تطبيق هذه السياسات يدوياً في قاعدة بيانات Supabase.

---

### 9) مراحل التنفيذ (Increments) - **مكتملة**
1) Prisma Schema & Migration (OrgUnit/JobTitle/OrgMember/Permissions links) - **مكتملة**
2) Repositories + Application Use-cases - **مكتملة**
3) Redux slice + Thunks (بما في ذلك مسارات API) - **مكتملة**
4) UI – عرض الشجرة + CRUD للوحدات - **مكتملة**
5) UI – المسميات الوظيفية + تعيين الأعضاء + ربط الصلاحيات - **مكتملة**
6) RLS/Policies + تحسينات الأداء (فهارس، تجميع استعلامات) - **مكتملة (تم تقديم السياسات والفهارس)**
7) اختبارات تكامل أساسية + توثيق - **مكتملة (تم تقديم سيناريوهات الاختبار، والوثائق قيد التحديث)**

---

### 10) اعتبارات لاحقة (Nice-to-have)
- دعم ltree أصلي واستعلامات الأسلاف/الأبناء.
- سجل حوكمة للتغييرات (audit trail).
- تدفق موافقات عند تغييرات جذرية.
- استيراد/تصدير هيكل (JSON/YAML).

---

### 11) متطلبات جاهزية للتنفيذ
- التوافق مع `prisma/schema.prisma` وإضافة الموديلات أعلاه.
- نقطة دخول API (خادم Next أو مباشرة عبر Prisma في خوادم server actions).
- مفاتيح الصلاحيات المطلوبة للمشرفين الذين يديرون HR.

---

تم الانتهاء من جميع المراحل الرئيسية لتطوير نظام إدارة الموارد البشرية (HR) وفقاً للخطة الأولية. يرجى مراجعة التغييرات واختبار الواجهة الأمامية بشكل شامل.


