# تقرير نظام التصنيفات الهرمية المتكامل

## نظرة عامة
تم إنشاء نظام هرمي متكامل لإدارة التصنيفات والفئات في نظام إدارة المخازن، يتكون من 4 مستويات:

1. **القطاعات** (Sectors) - المستوى الأعلى
2. **تصنيفات المنتجات** (Product Classifications) - تحت كل قطاع
3. **الفئات الأساسية** (Main Categories) - تحت كل تصنيف
4. **الفئات الفرعية** (Sub Categories) - تحت كل فئة أساسية

## الهيكل التقني

### 1. قاعدة البيانات

#### جدول القطاعات (warehouse_sectors)
```sql
CREATE TABLE public.warehouse_sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    code VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    warehouse_levels TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### جدول التصنيفات (product_classifications)
```sql
CREATE TABLE public.product_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sector_id UUID REFERENCES public.warehouse_sectors(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### جدول الفئات الأساسية (main_categories)
```sql
CREATE TABLE public.main_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    classification_id UUID REFERENCES public.product_classifications(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### جدول الفئات الفرعية (sub_categories)
```sql
CREATE TABLE public.sub_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    main_category_id UUID REFERENCES public.main_categories(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. الخدمات (Services)

تم إضافة دوال شاملة في `warehouseService.ts`:

#### دوال الجلب
- `getProductClassifications()` - جلب جميع التصنيفات مع القطاعات
- `getMainCategories(classificationId)` - جلب الفئات الأساسية تحت تصنيف معين
- `getSubCategories(mainCategoryId)` - جلب الفئات الفرعية تحت فئة أساسية معينة
- `getFullHierarchy()` - جلب التسلسل الهرمي الكامل

#### دوال الإنشاء
- `createProductClassification(data)` - إنشاء تصنيف جديد
- `createMainCategory(data)` - إنشاء فئة أساسية جديدة
- `createSubCategory(data)` - إنشاء فئة فرعية جديدة

#### دوال التحديث
- `updateProductClassification(id, data)` - تحديث تصنيف
- `updateMainCategory(id, data)` - تحديث فئة أساسية
- `updateSubCategory(id, data)` - تحديث فئة فرعية

#### دوال الحذف
- `deleteProductClassification(id)` - حذف تصنيف
- `deleteMainCategory(id)` - حذف فئة أساسية
- `deleteSubCategory(id)` - حذف فئة فرعية

### 3. واجهة المستخدم

#### صفحة التصنيفات الهرمية
تم إنشاء صفحة متقدمة في `/warehouse-management/admin-settings/hierarchical-categories` تحتوي على:

- **عرض التسلسل الهرمي**: عرض كامل للقطاعات والتصنيفات والفئات
- **إدارة التصنيفات**: إضافة وتعديل وحذف التصنيفات
- **إدارة الفئات الأساسية**: إضافة وتعديل وحذف الفئات الأساسية
- **إدارة الفئات الفرعية**: إضافة وتعديل وحذف الفئات الفرعية
- **واجهة تفاعلية**: توسيع وطي العناصر، ألوان مميزة للقطاعات

#### ميزات الواجهة
- **تصميم هرمي بصري**: عرض واضح للتسلسل الهرمي
- **ألوان مميزة**: كل قطاع له لون مميز
- **أيقونات معبرة**: أيقونات مختلفة لكل مستوى
- **أزرار سريعة**: إضافة فئات بسرعة من أي مستوى
- **تعديل وحذف**: إمكانية تعديل وحذف أي عنصر

## البيانات التجريبية المُنشأة

### القطاعات (9 قطاعات)
- القطاع الصناعي (INDUSTRIAL)
- القطاع التجاري (COMMERCIAL)
- القطاع الزراعي (AGRICULTURAL)
- القطاع الطبي (MEDICAL)
- القطاع المنزلي (HOUSEHOLD)
- القطاع الإداري (ADMINISTRATIVE)
- القطاع السياحي (TOURISM)
- القطاع الحكومي (GOVERNMENT)
- القطاع الخدمي (SERVICE)

### التصنيفات (12 تصنيف)
- الأجهزة والمعدات الصناعية
- المواد الخام الصناعية
- السلع الاستهلاكية
- المواد الغذائية
- المنسوجات والملابس
- المعدات الزراعية
- البذور والمبيدات
- الأدوية والمستلزمات الطبية
- المعدات الطبية
- الأثاث والأدوات المنزلية
- الألعاب والترفيه

### الفئات الأساسية (12 فئة)
- معدات الإنتاج
- معدات السلامة
- أدوات القياس
- الإلكترونيات
- الأثاث المنزلي
- الملابس والأزياء
- الأطعمة المعلبة
- الأطعمة الطازجة
- المشروبات
- أدوات الزراعة
- الآلات الزراعية
- الأدوية
- المستلزمات الطبية

### الفئات الفرعية (15 فئة)
- أجهزة الكمبيوتر
- الهواتف الذكية
- الأجهزة المنزلية
- غرف النوم
- غرف المعيشة
- المطابخ
- ملابس الرجال
- ملابس النساء
- الأحذية
- اللحوم المعلبة
- الخضروات المعلبة
- الحلويات
- الأدوية المسكنة
- المضادات الحيوية
- الفيتامينات

## مثال على التسلسل الهرمي

```
القطاع التجاري (COMMERCIAL)
├── السلع الاستهلاكية
│   ├── الإلكترونيات
│   │   ├── أجهزة الكمبيوتر
│   │   ├── الهواتف الذكية
│   │   └── الأجهزة المنزلية
│   ├── الأثاث المنزلي
│   │   ├── غرف النوم
│   │   ├── غرف المعيشة
│   │   └── المطابخ
│   └── الملابس والأزياء
│       ├── ملابس الرجال
│       ├── ملابس النساء
│       └── الأحذية
├── المواد الغذائية
│   ├── الأطعمة المعلبة
│   │   ├── اللحوم المعلبة
│   │   ├── الخضروات المعلبة
│   │   └── الحلويات
│   ├── الأطعمة الطازجة
│   └── المشروبات
└── المنسوجات والملابس
```

## الميزات المتقدمة

### 1. إدارة شاملة
- **إنشاء**: إضافة عناصر جديدة في أي مستوى
- **تعديل**: تعديل أي عنصر موجود
- **حذف**: حذف عناصر (soft delete)
- **عرض**: عرض التسلسل الهرمي الكامل

### 2. واجهة متقدمة
- **تصميم هرمي**: عرض واضح للتسلسل
- **ألوان مميزة**: تمييز بصري للقطاعات
- **تفاعلية**: توسيع وطي العناصر
- **استجابة**: تصميم متجاوب

### 3. أمان البيانات
- **Row Level Security**: حماية على مستوى الصفوف
- **Foreign Keys**: ربط آمن بين الجداول
- **Soft Delete**: حذف آمن للبيانات
- **Validation**: التحقق من صحة البيانات

## كيفية الاستخدام

### 1. الوصول للنظام
```
/warehouse-management/admin-settings/hierarchical-categories
```

### 2. إضافة تصنيف جديد
1. اختر القطاع
2. أدخل اسم التصنيف
3. أدخل الوصف
4. اضغط "إضافة"

### 3. إضافة فئة أساسية
1. اختر التصنيف
2. أدخل اسم الفئة
3. أدخل الوصف
4. اضغط "إضافة"

### 4. إضافة فئة فرعية
1. اختر الفئة الأساسية
2. أدخل اسم الفئة الفرعية
3. أدخل الوصف
4. اضغط "إضافة"

## الملفات المُنشأة/المُحدثة

### ملفات قاعدة البيانات
- `create_hierarchical_categories_system.sql` - إنشاء الجداول
- بيانات تجريبية شاملة

### ملفات الخدمات
- `src/domains/warehouse-management/services/warehouseService.ts` - إضافة دوال النظام الهرمي

### ملفات الواجهة
- `src/app/warehouse-management/admin-settings/hierarchical-categories/page.tsx` - صفحة النظام الهرمي
- `src/app/warehouse-management/admin-settings/sectors/page.tsx` - إضافة رابط للنظام الهرمي

## النتيجة النهائية

تم إنشاء نظام هرمي متكامل وشامل لإدارة التصنيفات والفئات يتيح:

✅ **إدارة القطاعات** - 9 قطاعات مع ألوان مميزة
✅ **إدارة التصنيفات** - 12 تصنيف تحت القطاعات
✅ **إدارة الفئات الأساسية** - 12 فئة أساسية تحت التصنيفات
✅ **إدارة الفئات الفرعية** - 15 فئة فرعية تحت الفئات الأساسية
✅ **واجهة متقدمة** - تصميم هرمي تفاعلي
✅ **عمليات CRUD شاملة** - إنشاء، قراءة، تحديث، حذف
✅ **أمان البيانات** - حماية شاملة للبيانات
✅ **سهولة الاستخدام** - واجهة بديهية ومتجاوبة

النظام جاهز للاستخدام ويمكن توسيعه بسهولة لإضافة المزيد من المستويات أو الميزات! 🚀
