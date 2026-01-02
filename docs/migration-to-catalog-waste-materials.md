# استراتيجية الانتقال من "إدارة الفئات والمنتجات" إلى "كتالوج المخلفات"

## تحليل المشكلة الحالية

### الوضع الحالي:

1. **تطبيق العميل يستخدم:**
   - `categories` و `subcategories` (من "إدارة الفئات والمنتجات" القديمة)
   - `waste_data_admin` (منتجات فعلية مثل "زجاجة مياه 1 لتر"، "علبة سمنة")
   - **المشكلة**: هذه التصنيفات لا تعكس التقسيم الحقيقي في كتالوج المخازن

2. **كتالوج المخازن (`catalog_waste_materials`):**
   - يحتوي على: `main_category_id`, `sub_category_id` (من `waste_main_categories` و `waste_sub_categories`)
   - يحدد "نوع المخلف" (مثل "بلاستيك PET شفاف وملون")
   - **لا يحتوي على منتجات فعلية** (مثل "زجاجة مياه 1 لتر")

3. **النتيجة:**
   - تطبيق العميل يعرض تصنيفات قديمة
   - لا يوجد ربط بين المنتجات الفعلية وكتالوج المخازن
   - البورصة والتسعير مرتبطة بـ `catalog_waste_materials` فقط

---

## الحل المقترح

### ✅ نعم، يجب استبدال التصنيف عند العميل بالتصنيفات من `catalog_waste_materials`

### ✅ نعم، يجب ربط المنتجات الفعلية بـ `catalog_waste_materials`

### ❌ لا، لا يجب إضافة المنتجات إلى `catalog_waste_materials` مباشرة

**السبب**: `catalog_waste_materials` يجب أن يبقى على مستوى "نوع المخلف"، وليس المنتجات الفعلية.

---

## البنية الصحيحة

### 1. `catalog_waste_materials` (نوع المخلف)
```
- id: 20
- waste_no: "WASTE-2026-331285"
- name: "بلاستيك PET شفاف وملون"
- main_category_id: 29 (بلاستيك)
- sub_category_id: 41 (بلاستيك PET)
```

**الغرض**: تحديد "نوع المخلف" للبورصة والتسعير

### 2. `waste_data_admin` (المنتجات الفعلية)
```
- id: "7c431740-c338-4b05-ab4d-3cc47aeca7d0"
- name: "زجاجة 10 لتر"
- catalog_waste_id: 20 ← ربط بنوع المخلف
- weight: 600 (جرام)
- price: 3 (ج.م)
```

**الغرض**: تحديد "المنتجات الفعلية" التي يضيفها العميل للسلة

### 3. العلاقة:
```
catalog_waste_materials (نوع المخلف)
    ↓ (1:N عبر catalog_waste_id)
waste_data_admin (المنتجات الفعلية)
```

**مثال:**
- نوع المخلف: "بلاستيك PET" (catalog_waste_id = 20)
- المنتجات الفعلية:
  - "زجاجة 10 لتر" (catalog_waste_id = 20)
  - "زجاجة 1 لتر" (catalog_waste_id = 20)
  - "زجاجة 500 مل" (catalog_waste_id = 20)

---

## خطة التنفيذ

### المرحلة 1: ربط المنتجات الموجودة مع `catalog_waste_materials`

#### الخطوة 1.1: إنشاء `catalog_waste_materials` للفئات المفقودة

```sql
-- إنشاء catalog_waste_materials لكل فئة فرعية موجودة في waste_data_admin
INSERT INTO catalog_waste_materials (
  waste_no,
  main_category_id,
  sub_category_id,
  expected_price
)
SELECT 
  'WASTE-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(ROW_NUMBER() OVER()::TEXT, 6, '0'),
  -- ربط main_category_id من waste_main_categories
  (SELECT wmc.id FROM waste_main_categories wmc 
   JOIN categories c ON c.name LIKE '%' || wmc.name || '%'
   WHERE c.id = wda.category_id LIMIT 1),
  -- ربط sub_category_id من waste_sub_categories
  (SELECT wsc.id FROM waste_sub_categories wsc 
   JOIN subcategories s ON s.name LIKE '%' || wsc.name || '%'
   WHERE s.id = wda.subcategory_id LIMIT 1),
  0
FROM waste_data_admin wda
WHERE wda.catalog_waste_id IS NULL
  AND wda.category_id IS NOT NULL
  AND wda.subcategory_id IS NOT NULL
GROUP BY wda.category_id, wda.subcategory_id;
```

#### الخطوة 1.2: ربط `waste_data_admin` مع `catalog_waste_materials`

```sql
-- ربط المنتجات الفعلية مع catalog_waste_materials
UPDATE waste_data_admin wda
SET catalog_waste_id = cwm.id
FROM catalog_waste_materials cwm
WHERE wda.catalog_waste_id IS NULL
  AND wda.category_id IS NOT NULL
  AND wda.subcategory_id IS NOT NULL
  -- ربط عبر الفئات
  AND cwm.main_category_id = (
    SELECT wmc.id FROM waste_main_categories wmc 
    JOIN categories c ON c.name LIKE '%' || wmc.name || '%'
    WHERE c.id = wda.category_id LIMIT 1
  )
  AND cwm.sub_category_id = (
    SELECT wsc.id FROM waste_sub_categories wsc 
    JOIN subcategories s ON s.name LIKE '%' || wsc.name || '%'
    WHERE s.id = wda.subcategory_id LIMIT 1
  );
```

### المرحلة 2: تحديث تطبيق العميل

#### الخطوة 2.1: تغيير API للفئات

**قبل (القديم):**
```typescript
// جلب الفئات من categories
const { data } = await supabase
  .from('categories')
  .select('*, subcategories(*)');
```

**بعد (الجديد):**
```typescript
// جلب الفئات من waste_main_categories و waste_sub_categories
const { data: mainCategories } = await supabase
  .from('waste_main_categories')
  .select('id, name, code')
  .order('name');

// عند اختيار الفئة الرئيسية
const { data: subCategories } = await supabase
  .from('waste_sub_categories')
  .select('id, name, code')
  .eq('main_category_id', selectedMainCategoryId)
  .order('name');
```

#### الخطوة 2.2: جلب المنتجات من `waste_data_admin` مرتبطة بـ `catalog_waste_materials`

```typescript
// عند اختيار الفئة الفرعية
// 1. جلب catalog_waste_materials للفئة الفرعية
const { data: catalogWastes } = await supabase
  .from('catalog_waste_materials')
  .select('id, waste_no, name')
  .eq('sub_category_id', selectedSubCategoryId);

// 2. جلب المنتجات الفعلية المرتبطة
const { data: products } = await supabase
  .from('waste_data_admin')
  .select('id, name, weight, price, price_per_kg')
  .in('catalog_waste_id', catalogWastes.map(cw => cw.id));
```

### المرحلة 3: إنشاء `catalog_waste_materials` للفئات الجديدة

عند إضافة فئة فرعية جديدة في كتالوج المخازن:
1. إنشاء `catalog_waste_materials` تلقائياً
2. ربطها بـ `stock_exchange` للبورصة
3. السماح بإضافة منتجات فعلية في `waste_data_admin` مرتبطة بها

---

## مثال عملي

### السيناريو: العميل يريد إضافة "زجاجة مياه 1 لتر"

#### الخطوات:

1. **العميل يفتح التطبيق:**
   - يرى الفئات الرئيسية من `waste_main_categories`:
     - بلاستيك
     - معادن
     - إلكترونيات
     - ...

2. **العميل يختار "بلاستيك":**
   - يرى الفئات الفرعية من `waste_sub_categories`:
     - زجاجات
     - بلاستيك PET
     - بلاستيك ناشف
     - ...

3. **العميل يختار "زجاجات":**
   - يرى `catalog_waste_materials` المرتبطة:
     - "بلاستيك PET شفاف وملون" (catalog_waste_id = 20)
     - "بلاستيك ناشف" (catalog_waste_id = 21)
     - ...

4. **العميل يختار "بلاستيك PET":**
   - يرى المنتجات الفعلية من `waste_data_admin`:
     - "زجاجة 10 لتر" (catalog_waste_id = 20)
     - "زجاجة 1 لتر" (catalog_waste_id = 20)
     - "زجاجة 500 مل" (catalog_waste_id = 20)

5. **العميل يختار "زجاجة 1 لتر":**
   - يرى السعر من `stock_exchange` (مرتبط بـ catalog_waste_id = 20)
   - يضيف للسلة

---

## الخلاصة

### ✅ يجب:
1. استبدال التصنيف عند العميل بالتصنيفات من `catalog_waste_materials`
2. ربط المنتجات الفعلية (`waste_data_admin`) مع `catalog_waste_materials` عبر `catalog_waste_id`
3. استخدام `waste_main_categories` و `waste_sub_categories` في التطبيق

### ❌ لا يجب:
1. إضافة المنتجات الفعلية إلى `catalog_waste_materials` مباشرة
2. الاحتفاظ بالتصنيفات القديمة (`categories` و `subcategories`) في التطبيق الجديد

### 📋 الخطوات:
1. ربط المنتجات الموجودة مع `catalog_waste_materials`
2. إنشاء `catalog_waste_materials` للفئات المفقودة
3. تحديث API التطبيق لاستخدام `catalog_waste_materials`
4. تحديث واجهة التطبيق لعرض الفئات من كتالوج المخازن

