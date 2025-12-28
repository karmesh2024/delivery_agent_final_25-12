# التوثيق الكامل لقاعدة بيانات الوكيل وأنشطته في النظام

---

## واجهات API للموبايل (خاصة بالوكيل)

### 1) المنتجات بأسعار الوكيل
- GET `/api/agents/me/products?shop_id={SHOP_ID}&audience_id={AUDIENCE_ID}`
- الوصف: يعيد منتجات المتجر مع اختيار السعر وفق السياسة:
  - سعر جمهور الوكيل (إن وُجد) > السعر العام (`target_audience_id = NULL`).
- استجابة نموذجية:
```json
{
  "items": [
    {
      "id": "PRODUCT_ID",
      "shop_id": "SHOP_ID",
      "name_ar": "اسم المنتج",
      "name_en": "Product Name",
      "sku": "SKU-123",
      "stock_quantity": 50,
      "is_active": true,
      "primary_image_url": "https://.../image.jpg",
      "price": {
        "value": "120.00",
        "type": "selling",
        "is_on_sale": false,
        "sale_price": null,
        "min_price": null,
        "max_discount_percentage": "0",
        "is_negotiable": false,
        "effective_from": "2025-06-01T00:00:00.000Z",
        "effective_to": null,
        "price_name_ar": "سعر التجزئة",
        "price_name_en": "Retail Price",
        "target_audience_id": "AUDIENCE_ID_OR_NULL"
      }
    }
  ]
}
```
- ملاحظات:
  - تمرير `audience_id` (جمهور الوكيل) اختياري؛ عند عدم تمريره سيتم استخدام السعر العام فقط.
  - يوصى بإنشاء جمهور للوكلاء في جدول `store_target_audiences` ليكون `audience_id` ثابتًا لتطبيقات الوكلاء.

### 2) المتاجر الخاصة بالوكيل (مؤقتًا عامة)
- GET `/api/agents/me/stores`
- الوصف: يعيد قائمة المتاجر الفعّالة. لاحقًا يمكن ربط الوكيل بمتجر/متاجر محددة.
- استجابة نموذجية:
```json
{
  "items": [
    {
      "id": "SHOP_ID",
      "name_ar": "اسم المتجر",
      "name_en": "Store Name",
      "slug": "store-slug",
      "logo_path": "https://.../logo.png",
      "is_active": true,
      "created_at": "2025-06-01T00:00:00.000Z"
    }
  ]
}
```

### 3) فلترة المنتجات (معلمات اختيارية)
- GET `/api/agents/me/products?shop_id={SHOP_ID}&audience_id={AUDIENCE_ID}&category_id={CATEGORY_ID}&search={SEARCH_TERM}&min_price={MIN}&max_price={MAX}&in_stock={true|false}`
- الوصف: جلب المنتجات مع إمكانية الفلترة حسب:
  - `shop_id` (مطلوب): معرف المتجر
  - `audience_id` (اختياري): جمهور الوكيل للحصول على الأسعار المخصصة
  - `category_id` (اختياري): فلترة حسب الفئة الرئيسية
  - `search` (اختياري): البحث في اسم المنتج (عربي/إنجليزي) أو SKU
  - `min_price` / `max_price` (اختياري): فلترة حسب نطاق السعر
  - `in_stock` (اختياري): فلترة المنتجات المتوفرة فقط (`true`) أو جميع المنتجات
- ملاحظات:
  - الفلترة حسب الفئة والبحث والسعر يمكن تطبيقها في الكود لاحقًا حسب الحاجة
  - حالياً API يعيد جميع المنتجات الفعّالة للمتجر مع الأسعار المخصصة

### 4) إنشاء طلب جديد من قبل الوكيل
- POST `/api/agents/me/orders`
- الوصف: يسمح للوكيل بإنشاء طلب خاص به لجلب البضائع من المنتجات
- **المصادقة:** يتطلب `Authorization: Bearer {TOKEN}` في الهيدر
- **الجسم (Request Body):**
```json
{
  "shop_id": "SHOP_ID",
  "items": [
    {
      "product_id": "PRODUCT_ID",
      "quantity": 2,
      "unit_price": "120.00"
    }
  ],
  "shipping_address": {
    "street": "شارع الرئيسي",
    "city": "القاهرة",
    "postal_code": "12345",
    "country": "مصر",
    "coordinates": {
      "lat": 30.0444,
      "lng": 31.2357
    }
  },
  "payment_method": "cash_on_delivery",
  "notes": "ملاحظات إضافية للطلب"
}
```
- **استجابة نجاح (201):**
```json
{
  "id": "ORDER_ID",
  "order_number": "ORD-2025-001234",
  "shop_id": "SHOP_ID",
  "status": "pending",
  "final_amount": "240.00",
  "payment_method": "cash_on_delivery",
  "payment_status": "pending",
  "created_at": "2025-06-01T10:30:00.000Z",
  "items": [
    {
      "id": "ITEM_ID",
      "product_id": "PRODUCT_ID",
      "quantity": 2,
      "unit_price": "120.00",
      "product_data": {
        "name_ar": "اسم المنتج",
        "sku": "SKU-123"
      }
    }
  ]
}
```
- **أخطاء محتملة:**
  - `400`: بيانات غير صحيحة (مثل منتج غير موجود، كمية غير صالحة)
  - `401`: غير مصرح (توكن غير صالح أو منتهي)
  - `404`: متجر غير موجود
  - `500`: خطأ في الخادم

### 5) جلب طلبات الوكيل
- GET `/api/agents/me/orders?status={STATUS}&shop_id={SHOP_ID}&limit={LIMIT}&offset={OFFSET}`
- الوصف: يعيد قائمة طلبات الوكيل مع إمكانية الفلترة
- **المصادقة:** يتطلب `Authorization: Bearer {TOKEN}` في الهيدر
- **معاملات الاستعلام (Query Parameters):**
  - `status` (اختياري): فلترة حسب الحالة (`pending`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`, `completed`)
  - `shop_id` (اختياري): فلترة حسب المتجر
  - `limit` (اختياري): عدد النتائج (افتراضي: 20)
  - `offset` (اختياري): إزاحة للصفحة (افتراضي: 0)
- **استجابة نموذجية:**
```json
{
  "items": [
    {
      "id": "ORDER_ID",
      "order_number": "ORD-2025-001234",
      "shop_id": "SHOP_ID",
      "shop_name_ar": "اسم المتجر",
      "status": "pending",
      "final_amount": "240.00",
      "payment_method": "cash_on_delivery",
      "payment_status": "pending",
      "shipping_address": {
        "street": "شارع الرئيسي",
        "city": "القاهرة"
      },
      "created_at": "2025-06-01T10:30:00.000Z",
      "updated_at": "2025-06-01T10:30:00.000Z",
      "items_count": 2
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

### 6) جلب تفاصيل طلب محدد
- GET `/api/agents/me/orders/{ORDER_ID}`
- الوصف: يعيد تفاصيل كاملة لطلب محدد
- **المصادقة:** يتطلب `Authorization: Bearer {TOKEN}` في الهيدر
- **استجابة نموذجية:**
```json
{
  "id": "ORDER_ID",
  "order_number": "ORD-2025-001234",
  "shop_id": "SHOP_ID",
  "shop_name_ar": "اسم المتجر",
  "status": "pending",
  "final_amount": "240.00",
  "payment_method": "cash_on_delivery",
  "payment_status": "pending",
  "shipping_address": {
    "street": "شارع الرئيسي",
    "city": "القاهرة",
    "postal_code": "12345",
    "country": "مصر",
    "coordinates": {
      "lat": 30.0444,
      "lng": 31.2357
    }
  },
  "notes": "ملاحظات إضافية",
  "created_at": "2025-06-01T10:30:00.000Z",
  "updated_at": "2025-06-01T10:30:00.000Z",
  "items": [
    {
      "id": "ITEM_ID",
      "product_id": "PRODUCT_ID",
      "product_name_ar": "اسم المنتج",
      "product_name_en": "Product Name",
      "sku": "SKU-123",
      "quantity": 2,
      "unit_price": "120.00",
      "total_price": "240.00",
      "product_data": {
        "name_ar": "اسم المنتج",
        "sku": "SKU-123",
        "primary_image_url": "https://.../image.jpg"
      }
    }
  ]
}
```

### 7) إلغاء طلب
- PATCH `/api/agents/me/orders/{ORDER_ID}/cancel`
- الوصف: يسمح للوكيل بإلغاء طلب في حالة `pending` أو `processing`
- **المصادقة:** يتطلب `Authorization: Bearer {TOKEN}` في الهيدر
- **استجابة نجاح (200):**
```json
{
  "id": "ORDER_ID",
  "status": "cancelled",
  "updated_at": "2025-06-01T11:00:00.000Z"
}
```

---

## 1. جدول الوكلاء (`agents`)
يمثل معلومات كل وكيل، العوامل المالية، المستخدم المرتبط، علاقات التحصيل والتوصيل:
- **الحقول الأساسية:**
  - `id`: معرّف الوكيل
  - `phone`, `full_name`, `email`
  - `commission_type`, `commission_rate` (نوع ونسبة العمولة)
  - `wallet_id`: المحفظة المرتبطة للوكيل
  - `approved_agent_zones`: المناطق المعتمدة للوكيل
  - `user_payment_methods`: طرق دفع المرتبطة للوكيل
  - `created_at`, `updated_at`: الأوقات الزمنية
- **العلاقات:**
  - علاقات التحصيل: `agent_collections`
  - علاقات التوصيل: `agent_shipping_deliveries`, `delivery_orders`
  - علاقات العملاء: `customer_collection_records`
  - علاقات المستندات والملف الشخصي

---

## 2. جدول المتاجر (`store_shops`)
- **الحقول الأساسية:**
  - `id`, `name_ar`, `name_en`, `description_ar`, `logo_path`, `is_active`
  - إعدادات المتجر: `settings`
  - `created_at`, `updated_at`
- **العلاقات:**
  - المنتجات (`store_products`)
  - الطلبات (`store_orders`)
  - الأقسام والتصنيفات
  - جماهير المتجر

---

## 3. جدول المنتجات (`store_products`)
- **الحقول الأساسية:**
  - `id`, `shop_id`, `main_category_id`, `name_ar`, `sku`, `cost_price`, `stock_quantity`, `default_selling_price`, `is_active`, `tags`
  - بيانات إضافية: وزن، أبعاد، هدايا، تقييمات
- **العلاقات:**
  - صور المنتجات (`store_product_images`)
  - أسعار المنتجات (`store_product_prices`)
  - تقييمات المنتجات، العناصر المرتبطة بالفواتير والمخزون

---

## 4. جدول أسعار المنتجات (`store_product_prices`)
- **الحقول الأساسية:**
  - `id`, `product_id`, `price`, `price_name_ar`, `price_name_en`, `is_on_sale`, `sale_price`, `price_type`, `profit_margin`, `min_price`, `max_discount_percentage`, `is_negotiable`, `effective_from`, `effective_to` 
- **العلاقات:**
  - المنتج المرتبط (`store_products`)
  - شريحة الاستهداف (`store_target_audiences`)

---

## 5. جدول الطلبات (`store_orders`)
- **الحقول الأساسية:**
  - `id`: معرّف الطلب (UUID)
  - `order_number`: رقم الطلب الفريد (مثل: ORD-2025-001234)
  - `customer_id`: معرّف العميل (اختياري - يمكن أن يكون NULL للطلبات الخاصة بالوكلاء)
  - `shop_id`: معرّف المتجر (مطلوب)
  - `status`: حالة الطلب (`pending`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`, `completed`)
  - `final_amount`: المبلغ الإجمالي للطلب (Decimal 10,2)
  - `payment_method`: طريقة الدفع (`cash_on_delivery`, `credit_card`, `bank_transfer`, `wallet`)
  - `payment_status`: حالة الدفع (`pending`, `completed`, `failed`, `refunded`)
  - `shipping_address`: عنوان الشحن (JSONB) - يحتوي على: street, city, postal_code, country, coordinates
  - `notes`: ملاحظات إضافية (نص)
  - `created_at`, `updated_at`: الأوقات الزمنية
- **العلاقات:**
  - عناصر الطلب (`store_order_items`)
  - المتجر (`store_shops`)
  - العملاء (`customers`) - اختياري
- **ملاحظات مهمة:**
  - للطلبات الخاصة بالوكلاء، يمكن ترك `customer_id` كـ NULL أو ربطه بسجل وكيل في جدول `customers`
  - `order_number` يجب أن يكون فريدًا ويُنشأ تلقائيًا عند إنشاء الطلب
  - `shipping_address` يُخزن كـ JSONB لمرونة في تخزين بيانات العنوان

## 5.1. جدول عناصر الطلب (`store_order_items`)
- **الحقول الأساسية:**
  - `id`: معرّف العنصر (UUID)
  - `order_id`: معرّف الطلب المرتبط
  - `product_id`: معرّف المنتج
  - `quantity`: الكمية المطلوبة (عدد صحيح)
  - `unit_price`: سعر الوحدة عند الطلب (Decimal 10,2) - يُحفظ لحفظ السعر التاريخي
  - `product_data`: لقطة من بيانات المنتج عند الطلب (JSONB) - يحتوي على: name_ar, name_en, sku, primary_image_url
  - `created_at`: وقت الإنشاء
- **العلاقات:**
  - الطلب المرتبط (`store_orders`)
  - المنتج (`store_products`)
- **ملاحظات:**
  - `unit_price` و `product_data` يُحفظان لحفظ السعر والبيانات التاريخية حتى لو تغيرت بعد الطلب

---

## 6. جدول التحصيلات (`agent_collections`)
عمليات التحصيل الميدانية والتعاملات المالية بشكل دوري:
- **الحقول الأساسية:**
  - `id`, `agent_id`, `collection_date`, `total_amount`, `payment_status`, `agent_commission`, `total_weight`, `payment_method`, `notes`, `location_lat`, `location_lng`
- **العلاقات:**
  - تفاصيل العناصر (`agent_collection_items`)
  - العملاء المعروفين أو غير المسجلين
  - صور التصوير والتحصيل
  - سجل جمع النقاط (`customer_collection_records`)

---

## 7. جدول العملاء (`customers`)
بيانات العملاء الأفراد أو الشركات:
- **الحقول الأساسية:**
  - `id`, `full_name`, `email`, `phone_number`, `customer_type`, `addresses`, `loyalty_points`, `wallet_id`, `preferred_language`, `referral_code`, `created_at`, `updated_at`
- **العلاقات:**
  - تحصيلات العملاء
  - سجل المحادثات والنقاط

---

## 8. جداول المخزون والمستودعات (Warehouses)
تشمل تسجيل المخزن، الأقسام، المعدات، المخزون اليومي، إعدادات وسياسات العمل:
- **جداول رئيسية:**
  - `warehouse_inventory`: كمية ونوع وسعر المنتج في المخزن
  - `warehouse_departments`, `warehouse_admin_settings`, `warehouse_hours_policies`, `warehouse_equipment`, `warehouse_hierarchy`, `warehouse_functional_structure`

---

## 9. جداول المدفوعات وطرق الدفع
- **user_payment_methods:** تعريف طرق دفع المستخدم/الوكيل
  - `id`, `user_id`, `payment_method_id`, `details`, `is_default`, `status`
- **payouts:** تحويلات مالية للوكيل
  - `id`, `agent_id`, `amount`, `payment_status`, `created_at`

---

## 10. المصادقة والصلاحيات للوكلاء
- **آلية المصادقة:**
  - الوكلاء يسجلون الدخول عبر نظام المصادقة (Supabase Auth أو نظام مخصص)
  - عند تسجيل الدخول، يحصل الوكيل على `access_token` (JWT)
  - جميع طلبات API للوكلاء تتطلب `Authorization: Bearer {TOKEN}` في الهيدر
  - الخادم يتحقق من صحة التوكن ويستخرج `agent_id` من التوكن أو من جدول `agents` المرتبط بـ `user_id`
- **ربط الوكيل بالمتاجر:**
  - حالياً: جميع المتاجر الفعّالة متاحة للوكلاء (مؤقت)
  - مستقبلاً: يمكن إضافة جدول `agent_shops` لربط الوكيل بمتاجر محددة:
    ```sql
    CREATE TABLE agent_shops (
      agent_id UUID REFERENCES agents(id),
      shop_id UUID REFERENCES store_shops(id),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (agent_id, shop_id)
    );
    ```
- **ربط الوكيل بجمهور (Audience):**
  - يُنشأ جمهور خاص بالوكلاء في جدول `store_target_audiences`
  - يمكن ربط الوكيل بجمهور محدد عبر:
    - إضافة حقل `default_audience_id` في جدول `agents`
    - أو تمرير `audience_id` صراحةً في طلبات API
  - عند جلب المنتجات، يتم اختيار السعر حسب الأولوية:
    1. سعر جمهور الوكيل (`target_audience_id = audience_id`)
    2. السعر العام (`target_audience_id = NULL`)

## 11. ملخص علاقات وقواعد بيانات الوكيل في النظام
1. **الوكيل (agents)** مرتبط بحساب مستخدم (users/auth_users)
2. **المتاجر والمنتجات:**
   - له متاجر (`store_shops`) - حالياً جميع المتاجر، مستقبلاً متاجر محددة
   - منتجات (`store_products`) مرتبطة بالمتاجر
   - أسعار منتجات (`store_product_prices`) مع أسعار مخصصة للوكلاء عبر `store_target_audiences`
3. **الطلبات:**
   - يمكن للوكيل إنشاء طلبات خاصة به (`store_orders` مع `customer_id = NULL` أو مرتبطة بسجل وكيل)
   - عناصر الطلب (`store_order_items`) تحتوي على المنتجات والكميات والأسعار
4. **التحصيلات:**
   - يدير عمليات تحصيل (`agent_collections`) ترتبط بالعملاء (customers)، الطلبات (store_orders)، والتحصيلات التفصيلية
5. **المخزون:**
   - يدير المخزون ومستودعات المنتجات عبر جداول warehouse
6. **المدفوعات:**
   - طرق الدفع والمدفوعات مُدارة عبر جداول `user_payment_methods` و `payouts`

---

### توضيح مسار بيانات الوكيل عملياً:

#### 1. تسجيل الدخول والمصادقة:
- الوكيل يسجل الدخول → يحصل على `access_token`
- جميع الطلبات تتضمن `Authorization: Bearer {TOKEN}`

#### 2. عرض المتاجر والمنتجات:
- جلب المتاجر المتاحة: `GET /api/agents/me/stores`
- جلب المنتجات: `GET /api/agents/me/products?shop_id={SHOP_ID}&audience_id={AUDIENCE_ID}`
- الفلترة: حسب الفئة، البحث، السعر، التوفر

#### 3. إنشاء الطلبات:
- الوكيل يختار المنتجات والكميات
- إنشاء الطلب: `POST /api/agents/me/orders` مع:
  - `shop_id`: المتجر
  - `items`: المنتجات والكميات والأسعار
  - `shipping_address`: عنوان التوصيل
  - `payment_method`: طريقة الدفع
- النظام ينشئ `order_number` فريد ويحفظ الطلب في `store_orders`

#### 4. متابعة الطلبات:
- جلب قائمة الطلبات: `GET /api/agents/me/orders?status={STATUS}`
- جلب تفاصيل طلب: `GET /api/agents/me/orders/{ORDER_ID}`
- إلغاء طلب: `PATCH /api/agents/me/orders/{ORDER_ID}/cancel`

#### 5. الأنشطة الأخرى:
- تحصيل المدفوعات وإدارتها للأوامر/العملاء
- متابعة أوامر البيع أو التجميع للعملاء
- إدارة المخزون والتدفق من وإلى المستودعات
- إدارة دفعات وتحويلات مالية عبر قنوات الدفع المعتمدة

---

---

## ملخص التغطية للمتطلبات

### ✅ المتطلبات المغطاة بالكامل:

1. **عرض المتاجر مع تخصيص المنتجات للوكلاء:**
   - ✅ API لجلب المتاجر: `GET /api/agents/me/stores`
   - ✅ API لجلب المنتجات: `GET /api/agents/me/products?shop_id={SHOP_ID}&audience_id={AUDIENCE_ID}`
   - ✅ آلية ربط الوكيل بالمتاجر (مؤقتاً: جميع المتاجر، مستقبلاً: متاجر محددة)

2. **عرض أسعار المنتجات المخصصة للوكلاء:**
   - ✅ نظام `store_target_audiences` لإنشاء جمهور خاص بالوكلاء
   - ✅ آلية اختيار السعر: سعر جمهور الوكيل أولاً، ثم السعر العام
   - ✅ API يعيد السعر المناسب حسب `audience_id`

3. **فلترة المنتجات:**
   - ✅ توثيق معاملات الفلترة (category_id, search, min_price, max_price, in_stock)
   - ✅ ملاحظة: يمكن تطبيق الفلترة في الكود لاحقاً

4. **إنشاء الطلبات من قبل الوكلاء:**
   - ✅ API لإنشاء الطلب: `POST /api/agents/me/orders`
   - ✅ توثيق كامل لبنية الطلب (items, shipping_address, payment_method)
   - ✅ توثيق جدول `store_orders` و `store_order_items`

5. **متابعة الطلبات:**
   - ✅ API لجلب قائمة الطلبات: `GET /api/agents/me/orders`
   - ✅ API لجلب تفاصيل طلب: `GET /api/agents/me/orders/{ORDER_ID}`
   - ✅ API لإلغاء طلب: `PATCH /api/agents/me/orders/{ORDER_ID}/cancel`

6. **المصادقة والصلاحيات:**
   - ✅ توثيق آلية المصادقة (JWT Token)
   - ✅ توثيق ربط الوكيل بالمتاجر والجمهور

### ⚠️ ملاحظات مهمة للمطور:

1. **APIs المطلوب تنفيذها:**
   - ⚠️ `POST /api/agents/me/orders` - **غير مطبق حالياً** (يحتاج تنفيذ)
   - ⚠️ `GET /api/agents/me/orders` - **غير مطبق حالياً** (يحتاج تنفيذ)
   - ⚠️ `GET /api/agents/me/orders/{ORDER_ID}` - **غير مطبق حالياً** (يحتاج تنفيذ)
   - ⚠️ `PATCH /api/agents/me/orders/{ORDER_ID}/cancel` - **غير مطبق حالياً** (يحتاج تنفيذ)

2. **الفلترة المتقدمة:**
   - ⚠️ معاملات الفلترة (category_id, search, min_price, max_price) موثقة ولكن تحتاج تطبيق في الكود

3. **المصادقة:**
   - ⚠️ يجب التأكد من تطبيق آلية استخراج `agent_id` من التوكن في جميع APIs

4. **ربط الوكيل بالمتاجر:**
   - ⚠️ حالياً جميع المتاجر متاحة (مؤقت)
   - ⚠️ مستقبلاً قد يحتاج جدول `agent_shops` لربط الوكيل بمتاجر محددة

### 📋 الخلاصة:

**نعم، هذا المستند كافٍ وصحيح** لتطبيق موبايل للوكلاء بشرط:
- ✅ جميع APIs المطلوبة موثقة بالكامل
- ✅ بنية قاعدة البيانات موثقة
- ✅ آلية المصادقة موثقة
- ⚠️ يحتاج تنفيذ APIs الطلبات (4 endpoints)
- ⚠️ يحتاج تطبيق الفلترة المتقدمة في API المنتجات

**التوصية:** يمكن البدء بتطوير تطبيق Flutter باستخدام هذا المستند كمرجع، مع تنفيذ APIs الطلبات المفقودة في الخادم.

---

هذا التوثيق يتضمن جميع الجداول والعلاقات الهامة التي يحتاجها مطور تكامل أو ربط خاصية جديدة للوكيل مع النظام، ويمكن استخدام هذا الملف كمرجع رئيسي لأعمال تطوير تطبيقات Flutter أو غيرها.
