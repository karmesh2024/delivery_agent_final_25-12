# تطبيق Migration: إضافة catalog_product_id إلى warehouse_invoice_items

## الوصف
هذا الـ migration يضيف عمود `catalog_product_id` إلى جدول `warehouse_invoice_items` للسماح بربط عناصر الفاتورة بمنتجات كتالوج المخازن (`catalog_products`).

## الخطوات

1. **تطبيق الـ Migration على قاعدة البيانات:**
   ```sql
   -- قم بتشغيل محتوى الملف:
   -- src/migrations/add_catalog_product_id_to_warehouse_invoice_items.sql
   ```

2. **التحقق من التطبيق:**
   ```sql
   -- التحقق من وجود العمود
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'warehouse_invoice_items' 
   AND column_name = 'catalog_product_id';
   
   -- يجب أن ترى:
   -- column_name: catalog_product_id
   -- data_type: bigint
   ```

3. **التحقق من الـ Index:**
   ```sql
   SELECT indexname 
   FROM pg_indexes 
   WHERE tablename = 'warehouse_invoice_items' 
   AND indexname = 'idx_warehouse_invoice_items_catalog_product_id';
   ```

## التغييرات في الكود

- ✅ تم تحديث `prisma/schema.prisma` لإضافة `catalog_product_id` إلى `warehouse_invoice_items`
- ✅ تم تحديث `SupplyOrderItem` interface لدعم `catalog_product_id`
- ✅ تم تحديث صفحة إنشاء طلب التوريد لاستخدام `catalog_product_id` بدلاً من `product_id`

## ملاحظات

- `product_id` أصبح اختياريًا (nullable) للسماح باستخدام `catalog_product_id` بدلاً منه
- عند العمل مع منتجات الكتالوج، يجب استخدام `catalog_product_id` (BigInt)
- عند العمل مع منتجات المتجر، يجب استخدام `product_id` (UUID)

