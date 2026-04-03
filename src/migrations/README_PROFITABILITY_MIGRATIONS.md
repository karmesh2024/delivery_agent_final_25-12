# 📋 دليل تطبيق Migrations - نظام الربحية والاحتياطيات

**تاريخ الإنشاء:** يناير 2026  
**المرجع:** تقرير المستشار المالي + الرد على التقرير

---

## 🎯 نظرة عامة

هذه الـ migrations تنفذ التوصيات المالية من تقرير المستشار المالي:

1. ✅ **الربحية** - إضافة sell_price + profit
2. ✅ **الاحتياطيات المالية** - نظام إدارة الالتزامات
3. ✅ **حدود السحب** - حماية مالية
4. ✅ **قواعد store_points** - نظام واضح للبونص

---

## 📅 ترتيب التطبيق

### المرحلة 1: الأساسيات (يجب تطبيقها أولاً)

```bash
# 1. Schema الأساسي
psql -d YOUR_DATABASE -f hybrid_points_system_schema.sql

# 2. Functions الأساسية
psql -d YOUR_DATABASE -f hybrid_points_system_functions.sql
```

### المرحلة 2: الربحية (عاجل) 🔴

```bash
# 3. الربحية (sell_price + profit)
psql -d YOUR_DATABASE -f hybrid_points_system_profitability.sql
```

**ما يفعله:**
- ✅ إضافة `sell_price` و `item_profit` إلى `waste_collection_items`
- ✅ إضافة `buy_total`, `sell_total`, `platform_profit` إلى `waste_collection_sessions`
- ✅ تحديث `calculate_collection_item()` لتجميد sell_price
- ✅ تحديث `update_session_totals()` لحساب الربح

---

### المرحلة 3: الاحتياطيات المالية (مهم) 🔴

```bash
# 4. الاحتياطيات المالية
psql -d YOUR_DATABASE -f hybrid_points_system_reserves.sql
```

**ما يفعله:**
- ✅ إنشاء جدول `financial_reserves`
- ✅ Function `calculate_daily_reserves()`
- ✅ Function `get_financial_reserves_summary()`

**ملاحظة:** يجب تشغيل `calculate_daily_reserves()` يومياً (يفضل عبر Cron Job)

---

### المرحلة 4: حدود السحب (مهم) ⚠️

```bash
# 5. حدود السحب
psql -d YOUR_DATABASE -f hybrid_points_system_withdrawal_limits.sql
```

**ما يفعله:**
- ✅ إنشاء جدول `withdrawal_limits`
- ✅ Function `check_withdrawal_limits()`
- ✅ تحديث `withdraw_from_wallet()` للتحقق من الحدود

---

### المرحلة 5: قواعد store_points (متوسط) ⚠️

```bash
# 6. قواعد store_points
psql -d YOUR_DATABASE -f hybrid_points_system_store_points_rules.sql

# 7. تحديث calculate_session_points لاستخدام القواعد
psql -d YOUR_DATABASE -f hybrid_points_system_update_session_points_for_rules.sql
```

**ما يفعله:**
- ✅ إنشاء جدول `store_points_rules`
- ✅ Function `calculate_store_points_bonus()`
- ✅ تحديث `calculate_session_points()` لاستخدام القواعد

---

## ⚠️ ملاحظات مهمة

### 1. ترتيب التطبيق إلزامي

**لا تغير الترتيب!** لأن:
- `profitability.sql` يحتاج `functions.sql` أولاً
- `reserves.sql` يحتاج `profitability.sql` أولاً
- `store_points_rules.sql` يحتاج `functions.sql` أولاً

### 2. التحقق من stock_exchange

**مهم:** تأكد من وجود `sell_price` في جدول `stock_exchange`

إذا لم يكن موجوداً:
```sql
-- إضافة sell_price إلى stock_exchange
ALTER TABLE stock_exchange
ADD COLUMN IF NOT EXISTS sell_price DECIMAL(10,2);

-- أو استخدام buy_price × 1.2 كافتراضي (في الكود)
```

### 3. Cron Job للاحتياطيات

**يُنصح بإعداد Cron Job:**

```sql
-- إذا كان لديك pg_cron extension
SELECT cron.schedule(
    'daily_reserves_calculation',
    '0 0 * * *',  -- كل يوم في منتصف الليل
    'SELECT public.calculate_daily_reserves()'
);
```

أو عبر نظام Cron خارجي:
```bash
# في crontab
0 0 * * * psql -d YOUR_DATABASE -c "SELECT public.calculate_daily_reserves()"
```

---

## ✅ Checklist بعد التطبيق

### التحقق من الربحية:

```sql
-- التحقق من وجود الحقول
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'waste_collection_items' 
  AND column_name IN ('sell_price', 'item_profit');

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'waste_collection_sessions' 
  AND column_name IN ('buy_total', 'sell_total', 'platform_profit');
```

### التحقق من الاحتياطيات:

```sql
-- تشغيل حساب اليوم
SELECT public.calculate_daily_reserves();

-- عرض النتائج
SELECT * FROM financial_reserves 
WHERE date = CURRENT_DATE;
```

### التحقق من حدود السحب:

```sql
-- اختبار Function
SELECT * FROM public.check_withdrawal_limits(
    'customer_id_here'::UUID,
    100.00
);
```

### التحقق من قواعد store_points:

```sql
-- عرض القواعد النشطة
SELECT * FROM store_points_rules 
WHERE is_active = true;

-- اختبار Function
SELECT public.calculate_store_points_bonus(
    'customer_id_here'::UUID,
    10000
);
```

---

## 🚨 مشاكل محتملة وحلولها

### المشكلة 1: sell_price غير موجود في stock_exchange

**الحل:**
```sql
-- إضافة الحقل
ALTER TABLE stock_exchange
ADD COLUMN IF NOT EXISTS sell_price DECIMAL(10,2);

-- أو استخدام buy_price × 1.2 كافتراضي
UPDATE stock_exchange
SET sell_price = buy_price * 1.2
WHERE sell_price IS NULL;
```

### المشكلة 2: calculate_daily_reserves() يفشل

**الحل:**
```sql
-- التحقق من وجود الجداول
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('new_profiles', 'points_redemptions', 'waste_collection_sessions');

-- التحقق من وجود الحقول
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'waste_collection_sessions' 
  AND column_name IN ('buy_total', 'sell_total');
```

### المشكلة 3: calculate_store_points_bonus() غير موجود

**الحل:**
- تأكد من تطبيق `hybrid_points_system_store_points_rules.sql` أولاً
- Function موجودة في هذا الملف

---

## 📊 بعد التطبيق

### 1. تحديث Dashboard

- ✅ إضافة صفحة الربحية
- ✅ إضافة صفحة الاحتياطيات
- ✅ إضافة صفحة قواعد store_points

### 2. تحديث API

- ✅ إضافة endpoints للربحية
- ✅ إضافة endpoints للاحتياطيات
- ✅ إضافة endpoints لقواعد store_points

### 3. تحديث المستندات

- ✅ تحديث `النظام_الموحد_للنقاط_القيمة_النقدية_والولاء.md`
- ✅ تحديث `دليل_التنفيذ_للداش_بورد.md`

---

**آخر تحديث:** يناير 2026  
**الحالة:** ✅ جاهز للتطبيق
