# دليل تكامل تسعير السلة مع البورصة

## نظرة عامة

تم تطبيق نظام متكامل يربط بين:
- **البورصة (stock_exchange)**: تسعير على مستوى نوع المخلف (بالكيلو)
- **المنتجات الفعلية (waste_data_admin)**: منتجات مختلفة لنفس النوع (أوزان مختلفة)
- **السلة (basket_contents)**: جمع منتجات مختلفة في سلة واحدة
- **الطلب (delivery_orders + order_details)**: حساب السلة بناءً على الوزن الفعلي × سعر الكيلو

## البنية الجديدة

### 1. catalog_waste_materials (نوع المخلف)
- يحتوي على: `id`, `waste_no`, `name`, `main_category_id`, `sub_category_id`
- مثال: "كانزات" أو "بلاستيك"

### 2. stock_exchange (البورصة - التسعير بالكيلو)
- **جديد**: `catalog_waste_id` → يشير إلى `catalog_waste_materials.id`
- يحتوي على: `buy_price` (سعر الكيلو)
- **التسعير على مستوى نوع المخلف، وليس المنتج الفعلي**

### 3. waste_data_admin (المنتجات الفعلية)
- **جديد**: `catalog_waste_id` → يشير إلى `catalog_waste_materials.id`
- يحتوي على: `name` (مثل "كنزة 330 مل"), `weight` (بالجرام), `price` (سعر الوحدة)
- **الحساب التلقائي**: `price = (stock_exchange.buy_price * weight) / 1000`

### 4. basket_contents (محتويات السلة)
- يحتوي على: `basket_id`, `waste_data_id`, `quantity`, `total_weight_kg`
- العميل يضيف منتجات مختلفة في السلة
- **الربط**: `waste_data_id` → `waste_data_admin.id` → `catalog_waste_id`

### 5. delivery_orders + order_details (الطلب)
- عند استلام السلة من الدليفرى:
  - حساب الوزن الفعلي لكل نوع مخلف
  - حساب السعر بناءً على: `الوزن الفعلي × stock_exchange.buy_price`
  - تحديث `order_details` لكل نوع

## المزامنة التلقائية

### Trigger: sync_waste_data_admin_price_from_stock_exchange
عند تحديث `buy_price` في `stock_exchange`:
1. يتم تحديث جميع `waste_data_admin` التي لها نفس `catalog_waste_id`
2. يتم حساب `price` (سعر الوحدة) تلقائياً: `(buy_price * weight) / 1000`
3. يتم تحديث `price_per_kg` = `buy_price`

## Functions الجديدة

### 1. check_minimum_weight_for_basket(basket_id)
**الغرض**: التحقق من الحد الأدنى للشحن لكل نوع مخلف في السلة

**المعاملات**:
- `basket_id_param`: معرف السلة

**الإرجاع**:
- `catalog_waste_id`: معرف نوع المخلف
- `current_weight_kg`: الوزن الحالي بالكيلو
- `minimum_weight_kg`: الحد الأدنى المطلوب بالكيلو
- `is_valid`: هل الوزن كافٍ؟
- `message`: رسالة توضيحية

**مثال الاستخدام**:
```sql
SELECT * FROM check_minimum_weight_for_basket('basket-uuid-here');
```

### 2. calculate_basket_price_on_delivery(basket_id, delivery_order_id)
**الغرض**: حساب السعر عند استلام السلة بناءً على الوزن الفعلي × سعر الكيلو

**المعاملات**:
- `basket_id_param`: معرف السلة
- `delivery_order_id_param`: معرف طلب التوصيل

**الإرجاع**:
- `catalog_waste_id`: معرف نوع المخلف
- `catalog_waste_name`: اسم نوع المخلف
- `total_weight_kg`: الوزن الإجمالي بالكيلو
- `price_per_kg`: سعر الكيلو من البورصة
- `total_price`: السعر الإجمالي
- `total_points`: النقاط الإجمالية
- `order_detail_id`: معرف order_detail المُنشأ

**مثال الاستخدام**:
```sql
SELECT * FROM calculate_basket_price_on_delivery('basket-uuid', 'delivery-order-uuid');
```

## إعداد الحد الأدنى للشحن

### في category_bucket_config أو subcategory_bucket_config:
```json
{
  "minimum_weight_per_category": {
    "20": 0.5,  // كانزات: 0.5 كجم
    "21": 2.0   // بلاستيك: 2.0 كجم
  }
}
```

حيث:
- المفتاح: `catalog_waste_id` (كنص)
- القيمة: الحد الأدنى من الوزن بالكيلو

## مثال عملي

### السيناريو:
- العميل جمع: 20 كنزة (0.5 كجم) + 30 قطعة بلاستيك (2 كجم)
- البورصة: كانزات (catalog_waste_id = 20) = 20 ج.م/كجم، بلاستيك (catalog_waste_id = 21) = 15 ج.م/كجم

### الحساب:
1. **كانزات**:
   - الوزن الفعلي = 0.5 كجم
   - السعر = 0.5 × 20 = 10 ج.م
   - النقاط = حسب نظام النقاط

2. **بلاستيك**:
   - الوزن الفعلي = 2 كجم
   - السعر = 2 × 15 = 30 ج.م
   - النقاط = حسب نظام النقاط

3. **الإجمالي**:
   - السعر الإجمالي = 10 + 30 = 40 ج.م
   - النقاط الإجمالية = مجموع النقاط

### الكود:
```sql
-- 1. التحقق من الحد الأدنى
SELECT * FROM check_minimum_weight_for_basket('basket-uuid');

-- 2. حساب السعر عند استلام السلة
SELECT * FROM calculate_basket_price_on_delivery('basket-uuid', 'delivery-order-uuid');
```

## تحديث الكود في التطبيق

### 1. عند إضافة منتج للسلة:
```typescript
// جلب catalog_waste_id من waste_data_admin
const wasteData = await supabase
  .from('waste_data_admin')
  .select('catalog_waste_id')
  .eq('id', waste_data_id)
  .single();

// إضافة المنتج للسلة
await supabase
  .from('basket_contents')
  .insert({
    basket_id: basketId,
    waste_data_id: wasteDataId,
    quantity: quantity,
    total_weight_kg: weight * quantity
  });
```

### 2. عند استلام السلة من الدليفرى:
```typescript
// حساب السعر
const priceCalculation = await supabase.rpc('calculate_basket_price_on_delivery', {
  basket_id_param: basketId,
  delivery_order_id_param: deliveryOrderId
});

// التحقق من الحد الأدنى
const minWeightCheck = await supabase.rpc('check_minimum_weight_for_basket', {
  basket_id_param: basketId
});
```

## ملاحظات مهمة

1. **الوزن بالجرام**: `waste_data_admin.weight` بالجرام، وليس بالكيلو
2. **الحساب**: `price = (buy_price * weight) / 1000`
3. **المزامنة**: تحديث `buy_price` في `stock_exchange` يحدث تلقائياً جميع المنتجات المرتبطة
4. **الحد الأدنى**: يجب إعداد `minimum_weight_per_category` في `basket_config` قبل السماح بالشحن

