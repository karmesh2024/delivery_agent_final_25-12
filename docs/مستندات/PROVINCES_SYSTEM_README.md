# نظام المحافظات والصلاحيات المؤقتة

## نظرة عامة

هذا النظام يوفر إدارة شاملة للمحافظات والمناطق والمدن المصرية مع نظام صلاحيات مؤقتة متقدم. تم تطويره باستخدام Next.js، Prisma، Redux Toolkit، وPostgreSQL.

## المميزات

### 🏛️ إدارة المحافظات
- إدارة المحافظات المصرية (27 محافظة)
- إضافة وتعديل وحذف المحافظات
- ربط المحافظات بالمناطق والمدن

### 🗺️ إدارة المناطق والمدن
- إدارة المناطق داخل كل محافظة
- إدارة المدن داخل كل منطقة
- نظام هرمي للمناطق (مناطق فرعية)

### 🔐 نظام الصلاحيات المؤقتة
- طلب صلاحيات مؤقتة
- نظام موافقات متعدد المستويات
- صلاحيات محددة النطاق (محافظة، منطقة، مدينة، مستودع)
- انتهاء صلاحيات تلقائي

### 📊 لوحة تحكم شاملة
- إحصائيات مباشرة
- إدارة الطلبات والموافقات
- نظام إشعارات متقدم
- واجهة مستخدم حديثة وسهلة الاستخدام

## التقنيات المستخدمة

- **Frontend**: Next.js 14, React 18, TypeScript
- **State Management**: Redux Toolkit, React Redux
- **Database**: PostgreSQL, Prisma ORM
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Heroicons

## التثبيت والإعداد

### 1. تثبيت التبعيات

```bash
npm install
```

### 2. إعداد قاعدة البيانات

```bash
# تشغيل Prisma migration
npx prisma migrate dev --name provinces_system

# أو استخدام db push
npx prisma db push

# توليد Prisma client
npx prisma generate
```

### 3. إعداد البيانات الأولية

```bash
# تشغيل script إعداد البيانات
npm run setup:provinces
```

### 4. تشغيل التطبيق

```bash
npm run dev
```

### 5. الوصول للنظام

افتح المتصفح وانتقل إلى: `http://localhost:3000/admin/provinces`

## هيكل المشروع

```
src/
├── components/
│   ├── ProvincesManagement.tsx    # مكون إدارة المحافظات
│   └── PermissionsManagement.tsx  # مكون إدارة الصلاحيات
├── pages/
│   └── admin/
│       └── provinces.tsx          # صفحة النظام الرئيسية
├── store/
│   ├── index.ts                   # Redux store الرئيسي
│   ├── hooks.ts                   # Redux hooks
│   └── slices/
│       ├── provincesSlice.ts      # Redux slice للمحافظات
│       └── permissionsSlice.ts    # Redux slice للصلاحيات
└── pages/api/
    ├── provinces/                 # API routes للمحافظات
    ├── regions/                   # API routes للمناطق
    ├── cities/                    # API routes للمدن
    ├── permissions/               # API routes للصلاحيات
    └── notifications/             # API routes للإشعارات
```

## قاعدة البيانات

### الجداول الرئيسية

- **Province**: المحافظات المصرية
- **Region**: المناطق داخل المحافظات
- **City**: المدن داخل المناطق
- **TemporaryPermission**: الصلاحيات المؤقتة
- **PermissionRequest**: طلبات الصلاحيات
- **Approval**: الموافقات على الطلبات
- **ApprovalWorkflow**: سير عمل الموافقات
- **ActivityLog**: سجل الأنشطة
- **AdvancedNotification**: الإشعارات المتقدمة

### العلاقات

- محافظة ←→ مناطق (One-to-Many)
- منطقة ←→ مدن (One-to-Many)
- منطقة ←→ مناطق فرعية (Self-referencing)
- صلاحيات مؤقتة ←→ أدمن (Many-to-One)
- طلبات صلاحيات ←→ أدمن (Many-to-One)

## API Endpoints

### المحافظات
- `GET /api/provinces` - جلب جميع المحافظات
- `POST /api/provinces` - إنشاء محافظة جديدة
- `GET /api/provinces/[id]` - جلب محافظة محددة
- `PUT /api/provinces/[id]` - تحديث محافظة
- `DELETE /api/provinces/[id]` - حذف محافظة

### المناطق
- `GET /api/regions` - جلب المناطق
- `POST /api/regions` - إنشاء منطقة جديدة

### المدن
- `GET /api/cities` - جلب المدن
- `POST /api/cities` - إنشاء مدينة جديدة

### الصلاحيات
- `GET /api/permissions/temporary` - جلب الصلاحيات المؤقتة
- `POST /api/permissions/temporary` - إنشاء صلاحية مؤقتة
- `GET /api/permissions/requests` - جلب طلبات الصلاحيات
- `POST /api/permissions/requests` - إنشاء طلب صلاحية

### الإشعارات
- `GET /api/notifications` - جلب الإشعارات
- `POST /api/notifications` - إنشاء إشعار
- `PUT /api/notifications/[id]/read` - تمييز إشعار كمقروء

## الاستخدام

### إدارة المحافظات

1. **إضافة محافظة جديدة**:
   - اضغط على "إضافة محافظة +"
   - أدخل الاسم العربي والإنجليزي والكود
   - اضغط "حفظ"

2. **إضافة منطقة**:
   - اختر محافظة من القائمة
   - اضغط على "إضافة منطقة +"
   - أدخل تفاصيل المنطقة
   - اضغط "حفظ"

3. **إضافة مدينة**:
   - اختر منطقة من القائمة
   - اضغط على "إضافة مدينة +"
   - أدخل تفاصيل المدينة
   - اضغط "حفظ"

### إدارة الصلاحيات

1. **طلب صلاحية جديدة**:
   - انتقل لتبويب "إدارة الصلاحيات"
   - اضغط على "طلب صلاحية جديدة"
   - اختر نوع النطاق والسبب
   - حدد الأولوية وتاريخ الانتهاء
   - اضغط "إرسال الطلب"

2. **الموافقة على الطلبات**:
   - انتقل لتبويب "طلبات الصلاحيات"
   - اضغط "موافقة" أو "رفض" للطلبات المعلقة

3. **متابعة الإشعارات**:
   - انتقل لتبويب "الإشعارات"
   - اضغط "تم القراءة" للإشعارات الجديدة

## التخصيص

### إضافة محافظات جديدة

```typescript
// في scripts/setup-provinces-system.js
const provinces = [
  { name_ar: 'اسم المحافظة', name_en: 'Province Name', code: 'XX' },
  // ... المزيد من المحافظات
]
```

### تخصيص سير عمل الموافقات

```typescript
// في قاعدة البيانات
await prisma.approvalWorkflow.create({
  data: {
    permission_id: 'permission-id',
    scope_type: 'province',
    level: 1,
    approver_role_id: 'role-id',
    is_required: true
  }
})
```

## الأمان

- جميع العمليات محمية بـ Row Level Security (RLS)
- التحقق من الصلاحيات قبل كل عملية
- تسجيل جميع الأنشطة في سجل العمليات
- تشفير البيانات الحساسة

## الأداء

- فهرسة قاعدة البيانات محسنة
- استعلامات محسنة مع Prisma
- تحميل البيانات بشكل تدريجي
- تخزين مؤقت للبيانات المتكررة

## الدعم والمساهمة

للمساهمة في المشروع أو الإبلاغ عن مشاكل:

1. Fork المشروع
2. إنشاء branch جديد
3. إجراء التغييرات
4. إرسال Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.

## التحديثات المستقبلية

- [ ] دعم المحافظات الدولية
- [ ] نظام خرائط تفاعلية
- [ ] تقارير متقدمة
- [ ] API للهواتف المحمولة
- [ ] نظام إشعارات فورية
- [ ] دعم اللغات المتعددة

---

تم تطوير هذا النظام بواسطة فريق التطوير باستخدام أحدث التقنيات وأفضل الممارسات.