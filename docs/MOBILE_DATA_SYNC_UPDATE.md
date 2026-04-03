# 📱 تحديث هيكلية البيانات لمبرمجي الموبايل

**تاريخ التحديث:** يناير 2026  
**الإصدار:** 2.0  
**الحالة:** ⚠️ يتطلب مراجعة كود الموبايل

---

## 🚨 تنبيه هام: توضيح أسماء الأعمدة الصحيحة

بعد مراجعة قاعدة البيانات والـ Dashboard، يجب التأكد من أن تطبيق الموبايل يستخدم أسماء الحقول الصحيحة.

### مقارنة أسماء الحقول:

| المستوى | المستند القديم | الاسم الصحيح في DB | الحالة |
|---------|---------------|-------------------|--------|
| الفئات الرئيسية | `waste_main_categories` | `waste_main_categories` | ✅ متوافق |
| الفئات الفرعية | `waste_sub_categories.main_id` | `waste_sub_categories.main_id` | ✅ متوافق |
| **ربط المنتجات** | `waste_data_admin.sub_id` ❌ | `waste_data_admin.subcategory_id` ✅ | ⚠️ **تحقق من الكود** |

> **ملاحظة:** إذا كان كود الموبايل يستخدم `sub_id`، يجب تغييره إلى `subcategory_id`

---

## 📊 الهيكل الفعلي الحالي لقاعدة البيانات

### المستوى الأول: الفئات الرئيسية
```sql
-- جدول: waste_main_categories
CREATE TABLE waste_main_categories (
    id          BIGINT PRIMARY KEY,      -- المعرف الفريد
    code        TEXT UNIQUE NOT NULL,    -- كود الفئة
    name        TEXT NOT NULL,           -- اسم الفئة (مثل: بلاستيك، ورق، معادن)
    description TEXT,                    -- وصف الفئة
    image_url   TEXT,                    -- رابط صورة الفئة
    created_at  TIMESTAMPTZ,
    updated_at  TIMESTAMPTZ
);
```

### المستوى الثاني: الفئات الفرعية
```sql
-- جدول: waste_sub_categories
CREATE TABLE waste_sub_categories (
    id                        BIGINT PRIMARY KEY,
    code                      TEXT UNIQUE NOT NULL,
    name                      TEXT NOT NULL,           -- اسم الفئة الفرعية
    main_id                   BIGINT REFERENCES waste_main_categories(id),  -- ✅ الربط بالفئة الرئيسية
    description               TEXT,
    image_url                 TEXT,
    price                     FLOAT,                   -- السعر الافتراضي
    points_per_kg             INTEGER,                 -- النقاط لكل كيلو
    created_at                TIMESTAMPTZ,
    updated_at                TIMESTAMPTZ
);
```

### المستوى الثالث: المنتجات
```sql
-- جدول: waste_data_admin
CREATE TABLE waste_data_admin (
    id                      UUID PRIMARY KEY,
    name                    TEXT NOT NULL,
    description             TEXT,
    image_url               TEXT,
    
    -- ⚠️ هذا هو الحقل الصحيح للربط (وليس sub_id!)
    subcategory_id          BIGINT REFERENCES waste_sub_categories(id),
    
    category_id             UUID,                      -- اختياري (للربط القديم)
    
    -- حقول الأسعار والنقاط
    price                   FLOAT,
    price_per_kg            FLOAT,
    price_unit              VARCHAR(10) DEFAULT 'EGP',
    points                  INTEGER,
    calculated_points       INTEGER DEFAULT 0,
    calculated_price        DECIMAL(10,2) DEFAULT 0,
    
    -- 🆕 حقل المنتجات المقترحة
    is_onboarding_featured  BOOLEAN DEFAULT FALSE,
    
    weight                  FLOAT,
    volume_liters           FLOAT DEFAULT 0,
    created_at              TIMESTAMPTZ,
    updated_at              TIMESTAMPTZ
);
```

---

## 🔄 الإجراء المطلوب من فريق الموبايل

### الخيار 1: تحديث كود الموبايل (مُوصى به)

غيّر جميع الاستعلامات التي تستخدم `sub_id` إلى `subcategory_id`:

```dart
// ❌ الكود القديم (خاطئ)
final products = await supabase
    .from('waste_data_admin')
    .select()
    .eq('sub_id', selectedSubCategoryId);

// ✅ الكود الجديد (صحيح)
final products = await supabase
    .from('waste_data_admin')
    .select()
    .eq('subcategory_id', selectedSubCategoryId);
```

### الخيار 2: إنشاء View في قاعدة البيانات (بديل)

إذا كان تحديث الموبايل صعباً، يمكن إنشاء View بالاسم القديم:

```sql
CREATE OR REPLACE VIEW waste_data_admin_mobile AS
SELECT 
    *,
    subcategory_id AS sub_id  -- alias للتوافق
FROM waste_data_admin;
```

---

## 🌟 الآلية الجديدة للمنتجات المقترحة (Onboarding Featured)

### ما هو `is_onboarding_featured`؟

هذا الحقل يتحكم في المنتجات التي تظهر للمستخدم الجديد كـ "اقتراحات" أو "منتجات مميزة".

### كيفية جلب المنتجات المقترحة:

```dart
// جلب المنتجات المقترحة فقط
final featuredProducts = await supabase
    .from('waste_data_admin')
    .select('''
        id,
        name,
        description,
        image_url,
        price,
        points,
        calculated_points,
        subcategory_id,
        waste_sub_categories!subcategory_id (
            id,
            name,
            main_id,
            waste_main_categories!main_id (
                id,
                name
            )
        )
    ''')
    .eq('is_onboarding_featured', true)
    .order('name');
```

### من يتحكم في هذا الحقل؟

- **لوحة التحكم (Dashboard)** فقط تستطيع تغيير قيمة `is_onboarding_featured`
- **تطبيق الموبايل** يقرأ فقط ولا يعدّل

---

## 📝 استعلامات مهمة للتطبيق

### 1. جلب الفئات الرئيسية
```dart
final mainCategories = await supabase
    .from('waste_main_categories')
    .select('id, name, code, description, image_url')
    .order('name');
```

### 2. جلب الفئات الفرعية لفئة رئيسية
```dart
final subCategories = await supabase
    .from('waste_sub_categories')
    .select('id, name, code, description, image_url, price, points_per_kg')
    .eq('main_id', mainCategoryId)  // ✅ main_id صحيح
    .order('name');
```

### 3. جلب المنتجات لفئة فرعية
```dart
// ✅ جلب المنتجات بدون علاقات
final products = await supabase
    .from('waste_data_admin')
    .select('''
        id,
        name,
        description,
        image_url,
        price,
        price_per_kg,
        points,
        calculated_points,
        weight
    ''')
    .eq('subcategory_id', subCategoryId)  // ⚠️ subcategory_id وليس sub_id
    .order('name');

// ✅ جلب المنتجات مع الفئة الفرعية والفئة الأساسية (الصحيح)
final productsWithRelations = await supabase
    .from('waste_data_admin')
    .select('''
        *,
        waste_sub_categories!subcategory_id (
            id,
            name,
            main_id,
            waste_main_categories!main_id (
                id,
                name
            )
        )
    ''')
    .eq('subcategory_id', subCategoryId)
    .order('name');
```

**⚠️ ملاحظة مهمة:** اسم العلاقة في PostgREST هو `waste_sub_categories` (بـ s في النهاية) وليس `waste_sub_category`.

### 4. استعلام التحقق من صحة الربط
```sql
-- للتأكد من أن المنتج مربوط بشكل صحيح
SELECT 
    p.id as product_id,
    p.name as product_name,
    s.name as sub_category_name,
    m.name as main_category_name
FROM waste_data_admin p
JOIN waste_sub_categories s ON p.subcategory_id = s.id
JOIN waste_main_categories m ON s.main_id = m.id
WHERE p.id = 'UUID_المنتج';

-- إذا لم يُرجع نتائج، فهناك مشكلة في الربط
```

---

## 🔍 جدول مقارنة أسماء الحقول

| الغرض | اسم الحقل الصحيح | الخطأ الشائع |
|-------|-----------------|--------------|
| ربط المنتج بالفئة الفرعية | `subcategory_id` | ~~sub_id~~ |
| ربط الفئة الفرعية بالرئيسية | `main_id` | ~~category_id~~ |
| المنتجات المقترحة | `is_onboarding_featured` | - |
| السعر لكل كيلو | `price_per_kg` | ~~price~~ (للسعر الإجمالي) |
| النقاط المحسوبة | `calculated_points` | ~~points~~ (النقاط الأساسية) |

---

## ⚡ نصائح للأداء

1. **استخدم الـ Select المحدد:** لا تجلب `*`، حدد الحقول المطلوبة فقط
2. **استخدم الـ Pagination:** للقوائم الطويلة
3. **Cache الفئات الرئيسية:** لأنها نادراً ما تتغير
4. **Real-time للأسعار:** إذا كانت الأسعار تتغير كثيراً

---

## 📞 للتواصل

إذا واجهتم أي مشاكل في الربط أو البيانات:
1. تحققوا من `subcategory_id` أولاً
2. تأكدوا أن الـ ID موجود في `waste_sub_categories`
3. راجعوا هذا المستند للتحقق من أسماء الحقول

---

**آخر تحديث:** يناير 2026
