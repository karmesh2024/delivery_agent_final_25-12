# تنفيذ هجرة Workflow التسلسل والتسعير (يدوياً)

## الملف
`20260130_subcategory_exchange_price_and_product_modifiers.sql`

## ماذا يفعل
1. ينشئ جدول **subcategory_exchange_price**: سعر البورصة لكل فئة فرعية (واحد لكل `waste_sub_categories.id`).
2. يضيف إلى **waste_data_admin**:
   - `price_premium_percentage` (نسبة تعديل السعر: + أو -)
   - `price_premium_fixed_amount` (مبلغ ثابت بالجنيه)
   - `display_order` (ترتيب العرض)
   - `pricing_subcategory_id` (اختياري: فئة التسعير إن اختلفت عن الفئة المرتبطة)

## كيفية التنفيذ
1. افتح Supabase Dashboard → SQL Editor.
2. انسخ محتوى الملف `20260130_subcategory_exchange_price_and_product_modifiers.sql`.
3. الصق ونفّذ (Run).
4. تأكد أن جدول `waste_sub_categories` موجود؛ إن كان مشروعك يستخدم UUID للفئات الفرعية فقط، قد تحتاج لتعديل المرجع في الجدول الجديد.

## بعد التنفيذ
- المنتجات الحالية تبقى كما هي (القيم الافتراضية للنسبة والمبلغ = 0).
- الباسكت وإعداداته لا تتأثر.
