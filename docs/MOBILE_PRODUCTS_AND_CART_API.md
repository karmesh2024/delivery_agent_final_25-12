# MOBILE: منتجات الفئات الفرعية والسلة (API من الباك إند)

هذا المستند يشرح لمطوري تطبيق الموبايل كيف يحصلون على:

- قائمة منتجات كل فئة فرعية **مع معرفة** هل إدخالها بالوزن أو بالقطعة.
- معرفة هل نقاط المستخدم لهذا المنتج تحسب بالكيلو أو بالقطعة (`points_mode`).
- سعر الكيلو من البورصة، وسعر القطعة (مشتق من سعر الكيلو × وزن القطعة).
- معاينة (Preview) دقيقة لبند السلة (سعر/وزن/نقاط) من الباك إند بدون حساب محلي.

> القاعدة: **الموبايل لا يحسب السعر ولا النقاط**.  
> الموبايل يرسل مدخلات السلة فقط (عدد/وزن) ويقرأ النتائج من الـ RPCs.

---

## 1) RPC: قائمة منتجات فئة فرعية للموبايل

### الاسم

`get_mobile_products_by_waste_subcategory(p_waste_subcategory_id BIGINT)`

### أين؟

موجود في: `supabase/migrations/add_mobile_products_rpc.sql`

### المدخل

- `p_waste_subcategory_id`: رقم الفئة الفرعية في جدول `waste_sub_categories.id` (BIGINT)

### الاستجابة (لكل منتج)

يرجع صفوف Table بالشكل التالي (أهم الحقول):

- `product_id` (UUID)
- `name`
- `image_url`
- `counting_method`:
  - `pieces` → المنتج يدخل السلة **بالقطعة** (الموبايل يعرض Quantity).
  - `weight` → المنتج يدخل السلة **بالكيلو** (الموبايل يعرض Weight).
- `points_mode`:
  - `per_piece` → نقاط المستخدم لهذا المنتج تعتمد على عدد القطع.
  - `per_kg` → نقاط المستخدم لهذا المنتج تعتمد على الوزن.
- `pricing_mode` (حاليًا قد يساوي `points_mode`، للتوسع لاحقًا)
- `unit_weight_kg`:
  - وزن القطعة بالكيلوجرام **إذا كان counting_method = pieces**
- `price_per_kg`:
  - سعر الكيلو من البورصة (stock_exchange.buy_price)
- `unit_price_per_piece`:
  - سعر القطعة = `unit_weight_kg × price_per_kg` (إذا كان المنتج بالقطعة)
- `customer_points_per_kg`:
  - عدد النقاط لكل كجم للمستخدم (بعد مراعاة points_per_kg_applies_to)
- `customer_points_per_piece`:
  - عدد النقاط لكل قطعة للمستخدم
- `is_priced`:
  - هل هناك سعر كيلو فعّال (>0)
- `is_points_configured`:
  - هل هناك إعداد نقاط فعّال (نقاط/كجم أو نقاط/قطعة)
- `display_hint`:
  - نص جاهز للعرض في الـ UI للموبايل:
    - `"بالكيلو"` أو `"بالقطعة"` (مشتق من نوع المنتج)
- `is_available_for_collection`:
  - هل المنتج جاهز فعلاً للاستلام في التطبيق:
    - `true` فقط إذا كان له سعر (price_per_kg > 0) **ولديه** إعداد نقاط مهيأ

### كيف يستخدمه الموبايل؟

1. عند فتح شاشة منتجات فئة فرعية:
   - استدعاء RPC بقيمة `waste_sub_category_id`.
2. عرض كروت المنتجات.
3. عند الضغط على منتج:
   - إذا `counting_method = 'pieces'`:
     - افتح BottomSheet لادخال `quantity`.
   - إذا `counting_method = 'weight'`:
     - افتح BottomSheet لادخال `weight_kg` (أو جرام ثم تحويل).

> الموبايل **لا** يحسب سعر القطعة أو النقاط محليًا؛ يستخدم RPC المعاينة في القسم التالي.

---

## 2) RPC: معاينة بند سلة (Preview) من الباك إند

### الاسم

`preview_mobile_cart_item(p_product_id UUID, p_quantity INTEGER, p_weight_kg NUMERIC)`

### أين؟

موجود في: `supabase/migrations/add_mobile_cart_item_preview_rpc.sql`

### المدخل

- `p_product_id`: معرف المنتج (UUID)
- `p_quantity`: عدد القطع (يستخدم عندما المنتج `counting_method = pieces`)
- `p_weight_kg`: وزن بالكيلوجرام (يستخدم عندما المنتج `counting_method = weight`)

> ملاحظة: أرسل واحد فقط (quantity أو weight_kg) حسب نوع المنتج.

### الاستجابة

يرجع Row واحد يحتوي (أهم الحقول):

- `counting_method` (pieces/weight)
- `points_mode` (per_piece/per_kg)
- `price_per_kg` (سعر الكيلو)
- `unit_weight_kg` (وزن القطعة بالكجم إذا كان المنتج بالقطعة)
- `total_weight_kg` (الوزن الكلي المحسوب)
- `unit_price_per_piece` (سعر القطعة المحسوب من سعر الكيلو × وزن القطعة)
- `total_price` (سعر البند الإجمالي)
- `estimated_points`:
  - مجموع نقاط هذا البند (سواء كانت من الوزن أو من القطعة) محسوبة في الباك إند
- `estimated_points_type`:
  - `"weight"` إذا كانت النقاط من الوزن
  - `"piece"` إذا كانت النقاط من عدد القطع
  - `"unknown"` لحالات نادرة/خاصة

### كيف يستخدمه الموبايل؟

- عند إدخال المستخدم قيمة `quantity` أو `weight_kg` في شاشة إضافة للسلة:
  1. استدعاء `preview_mobile_cart_item`.
  2. عرض:
     - سعر البند المتوقع (`total_price`).
     - نقاط البند المتوقعة من حقل واحد `estimated_points` مع معرفة نوعها من `estimated_points_type`.
  3. ثم عند التأكيد:
     - خزّن في السلة فقط **المدخلات**: `product_id` + `quantity` أو `weight_kg`.

> هذه المعاينة تساعد على عرض أسعار/نقاط دقيقة بدون حساب محلي،\n+> لكن الحساب النهائي يتم عند إنشاء الجلسة/الطلب في الباك إند.

---

## 3) توصية لتصميم عنصر السلة في الموبايل

يفضل أن يكون عنصر السلة في الموبايل:

- `product_id`
- `counting_method` (من RPC المنتجات)
- `quantity` (عند pieces) أو `weight_kg` (عند weight)
- (اختياري للعرض فقط) `preview_total_price`, `preview_points`

ثم عند إرسال السلة للباك إند:

- إرسال المدخلات الخام فقط.
- الباك إند سيعيد حساب الوزن والسعر والنقاط بشكل نهائي.

---

## 4) ملاحظات مهمة

- لا تستخدم `price` أو `points` الموجودة في `waste_data_admin` للحساب داخل الموبايل.
- اعتمد على:
  - `price_per_kg` من البورصة
  - `preview_mobile_cart_item` للمعاينة داخل السلة
  - الإجماليات النهائية من RPCs الرصيد/النقاط (مثل `get_customer_balance_summary`)

