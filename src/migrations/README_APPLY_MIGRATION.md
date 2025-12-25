# تعليمات تطبيق Migration

## المشكلة
عند البحث عن المخزون، يظهر خطأ 500 لأن حقل `catalog_product_id` غير موجود في جدول `warehouse_inventory`.

## الحل
يجب تطبيق migration لإضافة حقل `catalog_product_id` إلى جدول `warehouse_inventory`.

## خطوات التطبيق

### 1. الاتصال بقاعدة البيانات
استخدم أي أداة للاتصال بقاعدة البيانات PostgreSQL (مثل pgAdmin، DBeaver، أو psql).

### 2. تشغيل Migration
قم بتشغيل محتوى الملف التالي على قاعدة البيانات:

**الملف:** `src/migrations/add_catalog_product_id_to_warehouse_inventory.sql`

### 3. التحقق من التطبيق
بعد تطبيق الـ migration، تحقق من وجود الحقل:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'warehouse_inventory' 
AND column_name = 'catalog_product_id';
```

يجب أن ترى النتيجة:
- `column_name`: `catalog_product_id`
- `data_type`: `bigint`

### 4. إعادة تشغيل التطبيق
بعد تطبيق الـ migration، أعد تشغيل التطبيق وجرب البحث عن المخزون مرة أخرى.

## ملاحظات
- تأكد من عمل نسخة احتياطية من قاعدة البيانات قبل تطبيق أي migration
- إذا كان لديك بيانات موجودة في `warehouse_inventory` مرتبطة بـ `catalog_products`، قد تحتاج إلى تحديثها يدوياً

