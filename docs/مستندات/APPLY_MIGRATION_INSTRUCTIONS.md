# تعليمات تطبيق ترحيل قاعدة البيانات

## الطرق المتاحة:

### الطريقة الأولى: إنشاء جدول product_types فقط (الأسرع)

#### 1. إعداد متغيرات البيئة
أنشئ ملف `.env` في المجلد الجذر وأضف:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

#### 2. تطبيق الترحيل
شغل الأمر التالي:

```bash
npm run create:product-types
```

أو:

```bash
node create-product-types.js
```

### الطريقة الثانية: تطبيق الترحيل الكامل

#### 1. إعداد متغيرات البيئة (نفس الخطوة أعلاه)

#### 2. تطبيق الترحيل الكامل
```bash
npm run migrate:catalog
```

أو:

```bash
node apply-migration.js
```

### 3. التحقق من النجاح
بعد تطبيق الترحيل، ستظهر رسالة نجاح مع قائمة الجداول المنشأة.

## الجداول التي سيتم إنشاؤها:

- `product_types` - أنواع المنتجات
- `units` - الوحدات
- `product_main_categories` - الفئات الرئيسية للمنتجات
- `product_sub_categories` - الفئات الفرعية للمنتجات
- `catalog_products` - كتالوج المنتجات
- `waste_main_categories` - الفئات الرئيسية للمخلفات
- `waste_sub_categories` - الفئات الفرعية للمخلفات
- `catalog_waste_materials` - كتالوج المخلفات
- `product_brands` - العلامات التجارية
- `plastic_types` - أنواع البلاستيك
- `metal_types` - أنواع المعادن
- `paper_types` - أنواع الورق
- `glass_types` - أنواع الزجاج
- `fabric_types` - أنواع الأقمشة

## ملاحظات:

- تأكد من أن لديك صلاحيات إدارة قاعدة البيانات
- احتفظ بنسخة احتياطية من قاعدة البيانات قبل الترحيل
- في حالة وجود أخطاء، تحقق من صحة مفاتيح Supabase
