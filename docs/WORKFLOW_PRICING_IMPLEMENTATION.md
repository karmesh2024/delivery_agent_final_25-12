# تنفيذ Workflow التسلسل والتسعير

## ما تم تنفيذه

### 1. قاعدة البيانات (تنفيذ يدوي)
- **الملف**: `supabase/migrations/20260130_subcategory_exchange_price_and_product_modifiers.sql`
- **التعليمات**: راجع `supabase/migrations/README_20260130_workflow_pricing.md`
- **المحتوى**:
  - جدول `subcategory_exchange_price`: سعر البورصة لكل فئة فرعية (واحد لكل `waste_sub_categories.id`).
  - أعمدة جديدة على `waste_data_admin`: `price_premium_percentage`, `price_premium_fixed_amount`, `display_order`, `pricing_subcategory_id`.

### 2. الخدمات
- **subcategoryExchangePriceService** (`src/domains/waste-management/services/subcategoryExchangePriceService.ts`):
  - `getSubcategoryExchangePrice(subcategoryId)` — جلب سعر الفئة الفرعية.
  - `setSubcategoryExchangePrice(subcategoryId, buyPrice, sellPrice?, userId?)` — تعيين/تحديث سعر الفئة.
  - `getAllSubcategoryExchangePrices()` — جلب كل أسعار الفئات.
  - `computeProductPricePerKg(subcategoryBuyPrice, product)` — حساب سعر الكيلو الفعلي للمنتج من سعر الفئة + النسبة + المبلغ.
- **wasteProductWorkflowService** (`src/domains/waste-management/services/wasteProductWorkflowService.ts`):
  - `createProductWithOpeningPrice(input)` — إنشاء منتج مع سعر افتتاحي، وربط سعر الفئة إن لم يكن موجوداً، وإدراج المنتج في `waste_data_admin` (واختيارياً في `stock_exchange`).

### 3. واجهة إدارة التسلسل والتنظيم
- **صفحة**: `src/domains/warehouse-management/pages/OrganizationStructurePage.tsx`
- **التعديلات**:
  - زر **"المنتجات"** على كل فئة فرعية من نوع **مخلف** (waste) في تبويب الفئات الفرعية.
  - عند الضغط يفتح حوار **"منتجات الفئة الفرعية"** يعرض قائمة المنتجات تحت هذه الفئة وزر **"إضافة منتج جديد"**.
  - حوار **"إضافة منتج جديد"** يتضمن: الاسم، الاسم بالعربية، الوصف، السعر الافتتاحي (ج/كجم)، نسبة تعديل السعر، مبلغ إضافي، طريقة الحساب (بالكيلو/بالقطعة)، وزن الوحدة (للقطعة).
  - عند الحفظ يتم استدعاء `createProductWithOpeningPrice` ثم تحديث قائمة المنتجات.

## ما يمكن إضافته لاحقاً
- **إدارة التسعير**: واجهة لتحديث سعر الفئة الفرعية من صفحة البورصة/التسعير مع الاحتفاظ بمنطق الموافقة (10%).
- **إدارة الفئات والمنتجات**: تعديل حقول `display_order`, `price_premium_percentage`, `price_premium_fixed_amount` من نموذج تعديل المنتج (ProductForm) بعد تشغيل الهجرة.
- **عرض السعر الفعلي**: استخدام `computeProductPricePerKg` عند عرض سعر المنتج في القوائم أو الفواتير.

## معادلة السعر الفعلي للمنتج
```
سعر_كيلو_المنتج = سعر_بورصة_الفئة_الفرعية × (1 + price_premium_percentage/100) + price_premium_fixed_amount
```

## تشغيل الهجرة
1. افتح Supabase Dashboard → SQL Editor.
2. انسخ محتوى `supabase/migrations/20260130_subcategory_exchange_price_and_product_modifiers.sql`.
3. نفّذ (Run).
4. تأكد من وجود جدول `waste_sub_categories` قبل التشغيل.
