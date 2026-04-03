# دليل Migration: تحديث waste_data_admin.subcategory_id

## 📋 نظرة عامة

هذا الدليل يشرح كيفية تحديث `waste_data_admin.subcategory_id` من نوع `UUID` إلى `BIGINT` وربطه بـ `waste_sub_categories.id` بدلاً من `subcategories.id`.

## ⚠️ تحذير مهم

**قبل تنفيذ أي Migration، تأكد من:**
1. عمل نسخة احتياطية من قاعدة البيانات
2. تنفيذ الاستعلامات في بيئة التطوير أولاً
3. مراجعة جميع النتائج بعناية

## 📁 الملفات المتوفرة

### 1. `check_waste_data_admin_before_migration.sql`
**الغرض:** فحص البيانات الحالية قبل Migration

**يحتوي على:**
- ✅ إحصائيات عن المنتجات والفئات
- ✅ مقارنة بين الجداول القديمة والجديدة
- ✅ تحديد المنتجات التي قد تفقد الربط
- ✅ إنشاء جدول مؤقت للربط التلقائي

**متى تستخدمه:** قبل أي شيء - لتقييم الوضع الحالي

---

### 2. `manual_subcategory_mapping.sql`
**الغرض:** مساعدتك في الربط اليدوي للفئات التي لا يمكن ربطها تلقائياً

**يحتوي على:**
- ✅ عرض جميع الفئات المتاحة
- ✅ استعلامات لإضافة/تحديث/حذف الربط اليدوي
- ✅ التحقق من صحة الربط

**متى تستخدمه:** بعد تشغيل ملف الفحص، إذا وجدت فئات تحتاج ربط يدوي

---

### 3. `migrate_waste_data_admin_subcategory_id.sql`
**الغرض:** تنفيذ Migration الفعلي

**يحتوي على:**
- ✅ إنشاء عمود مؤقت
- ✅ تحويل البيانات
- ✅ إزالة القيد القديم وإضافة الجديد
- ✅ التحقق من النتائج

**متى تستخدمه:** بعد التأكد من صحة جميع البيانات والربط

---

## 🚀 خطوات التنفيذ

### الخطوة 1: فحص البيانات الحالية

```sql
-- شغّل هذا الملف في Supabase SQL Editor
\i supabase/migrations/check_waste_data_admin_before_migration.sql
```

**ما يجب أن تتحقق منه:**
- ✅ عدد المنتجات الكلي
- ✅ عدد المنتجات التي لديها `subcategory_id`
- ✅ عدد الفئات في الجدول القديم vs الجديد
- ✅ عدد المنتجات التي يمكن ربطها تلقائياً
- ✅ عدد المنتجات التي تحتاج ربط يدوي

---

### الخطوة 2: الربط اليدوي (إذا لزم الأمر)

إذا وجدت منتجات تحتاج ربط يدوي:

```sql
-- 1. شغّل هذا الملف
\i supabase/migrations/manual_subcategory_mapping.sql

-- 2. استخدم الاستعلامات المعلقة (uncommented) لإضافة الربط اليدوي
-- مثال:
INSERT INTO temp_subcategory_mapping (
    old_subcategory_uuid, 
    old_subcategory_name, 
    new_subcategory_id, 
    new_subcategory_name, 
    match_method
)
VALUES (
    '123e4567-e89b-12d3-a456-426614174000'::uuid,
    'اسم الفئة القديمة',
    1,  -- ID الفئة الجديدة من waste_sub_categories
    'اسم الفئة الجديدة',
    'manual'
);
```

---

### الخطوة 3: التحقق النهائي قبل Migration

```sql
-- تأكد من أن جميع المنتجات المهمة مرتبطة
SELECT 
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE subcategory_id IS NOT NULL) as with_subcategory,
    COUNT(*) FILTER (
        WHERE subcategory_id IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM temp_subcategory_mapping 
            WHERE old_subcategory_uuid::text = waste_data_admin.subcategory_id
        )
    ) as can_be_migrated
FROM waste_data_admin;
```

---

### الخطوة 4: تنفيذ Migration

```sql
-- ⚠️ تأكد من عمل نسخة احتياطية أولاً!
-- شغّل هذا الملف
\i supabase/migrations/migrate_waste_data_admin_subcategory_id.sql
```

**ما سيحدث:**
1. ✅ إنشاء عمود مؤقت `subcategory_id_new`
2. ✅ تحويل البيانات من UUID إلى BIGINT
3. ✅ حذف العمود القديم
4. ✅ إعادة تسمية العمود الجديد
5. ✅ إضافة القيد الخارجي الجديد
6. ✅ التحقق من صحة البيانات

---

### الخطوة 5: التحقق بعد Migration

```sql
-- التحقق من أن جميع المنتجات مرتبطة بشكل صحيح
SELECT 
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE subcategory_id IS NOT NULL) as with_subcategory,
    COUNT(*) FILTER (
        WHERE subcategory_id IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM waste_sub_categories 
            WHERE id = waste_data_admin.subcategory_id
        )
    ) as correctly_linked
FROM waste_data_admin;

-- عرض عينة من البيانات المحولة
SELECT 
    wda.id,
    wda.name as product_name,
    wda.subcategory_id,
    wsc.name as subcategory_name,
    wmc.name as main_category_name
FROM waste_data_admin wda
LEFT JOIN waste_sub_categories wsc ON wda.subcategory_id = wsc.id
LEFT JOIN waste_main_categories wmc ON wsc.main_id = wmc.id
WHERE wda.subcategory_id IS NOT NULL
LIMIT 10;
```

---

### الخطوة 6: تنظيف الجدول المؤقت (اختياري)

```sql
-- بعد التأكد من نجاح Migration
DROP TABLE IF EXISTS temp_subcategory_mapping;
```

---

## 🔧 تحديث Prisma Schema

بعد نجاح Migration، قم بتحديث `prisma/schema.prisma`:

```prisma
model waste_data_admin {
  // ... الأعمدة الأخرى
  subcategory_id             BigInt?                      // تغيير من String? إلى BigInt?
  // ...
  waste_sub_categories      waste_sub_categories?        @relation(fields: [subcategory_id], references: [id], onDelete: SetNull, onUpdate: Cascade)
  // إزالة العلاقة القديمة:
  // subcategories              subcategories?               @relation(...)
}
```

ثم شغّل:
```bash
npx prisma generate
```

---

## ❓ استعلامات مفيدة إضافية

### عرض جميع الفئات الفرعية الجديدة مع عدد المنتجات

```sql
SELECT 
    wsc.id,
    wsc.code,
    wsc.name,
    wmc.name as main_category,
    COUNT(wda.id) as products_count
FROM waste_sub_categories wsc
LEFT JOIN waste_main_categories wmc ON wsc.main_id = wmc.id
LEFT JOIN waste_data_admin wda ON wda.subcategory_id = wsc.id::text
GROUP BY wsc.id, wsc.code, wsc.name, wmc.name
ORDER BY products_count DESC;
```

### البحث عن منتجات محددة

```sql
-- استبدل 'اسم_المنتج' بالاسم الفعلي
SELECT 
    wda.*,
    wsc.name as subcategory_name,
    wmc.name as main_category_name
FROM waste_data_admin wda
LEFT JOIN waste_sub_categories wsc ON wda.subcategory_id = wsc.id::text
LEFT JOIN waste_main_categories wmc ON wsc.main_id = wmc.id
WHERE wda.name ILIKE '%اسم_المنتج%';
```

---

## 🆘 حل المشاكل

### المشكلة: بعض المنتجات لم يتم تحويلها

**الحل:**
1. تحقق من الجدول المؤقت `temp_subcategory_mapping`
2. أضف الربط اليدوي للمنتجات المفقودة
3. أعد تشغيل Migration (قد تحتاج تعديل الاستعلام)

### المشكلة: أخطاء في القيد الخارجي

**الحل:**
```sql
-- تحقق من وجود القيد
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'waste_data_admin' 
AND constraint_type = 'FOREIGN KEY';

-- إذا كان هناك قيد قديم، احذفه يدوياً
ALTER TABLE waste_data_admin 
DROP CONSTRAINT IF EXISTS waste_data_admin_subcategory_id_fkey;
```

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من سجلات الأخطاء في Supabase
2. راجع الاستعلامات في ملفات الفحص
3. تأكد من أن جميع الجداول موجودة

---

## ✅ Checklist

- [ ] عمل نسخة احتياطية من قاعدة البيانات
- [ ] تشغيل ملف الفحص الأولي
- [ ] مراجعة النتائج
- [ ] إضافة الربط اليدوي (إذا لزم الأمر)
- [ ] تنفيذ Migration
- [ ] التحقق من النتائج
- [ ] تحديث Prisma Schema
- [ ] تشغيل `npx prisma generate`
- [ ] اختبار النظام
- [ ] حذف الجدول المؤقت
