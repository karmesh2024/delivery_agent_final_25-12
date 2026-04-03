# آلية طلبات السوق المباشر وتأثيرها على تسعير المواد في البورصة

> **المشروع:** لوحة تحكم كرمش (Delivery Agent Dashboard)\
> **آخر تحديث:** 2026-02-18\
> **الحالة:** المرجع النهائي المعتمد للتنفيذ\
> **إصدار المستند:** 4.0 (النسخة المعتمدة)

---

## 1. دورة التسعير الكاملة

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  المصنع يقدم  │───▶│  المدير يوافق │───▶│  عقد رسمي    │───▶│  الحاسبة     │───▶│  المندوب     │
│  عرض سعر     │    │  أو يرفض     │    │  (بسعر وكمية) │    │  الذكية      │    │  يشتري       │
│  (للطن)      │    │              │    │              │    │  (كيلو)      │    │  من العميل   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
   market_bids          المدير           partner_contracts      الحاسبة          stock_exchange
```

---

## 2. المعادلة النهائية المعتمدة

### المتوسط المرجّح بالكميات (Weighted Average)

```
متوسط البيع = مجموع (سعر_العقد × كمية_العقد) ÷ مجموع (الكميات)
```

> ⚠️ **لماذا مرجّح وليس بسيط؟** المتوسط البسيط يعامل عقد 10 طن وعقد 500 طن
> بالتساوي، وهذا مضلل تجارياً.

### مثال المتوسط المرجّح:

| العقد | المصنع     | السعر/طن | الكمية | السعر × الكمية |
| ----- | ---------- | -------- | ------ | -------------- |
| #1    | أبو الذهب  | 30,000   | 10 طن  | 300,000        |
| #2    | مصنع النور | 25,000   | 500 طن | 12,500,000     |

```
متوسط بسيط  = (30,000 + 25,000) ÷ 2 = 27,500  ❌ مضلل
متوسط مرجّح = (300,000 + 12,500,000) ÷ (10 + 500) = 25,098  ✅ واقعي
```

### حساب سعر الشراء النهائي:

```
تكلفة_فعلية = COALESCE(عقد.operational_cost_override, فئة.total_cost)

سعر الشراء (كيلو) =
  (متوسط_مرجّح - تكلفة_فعلية - (متوسط_مرجّح × نسبة_الربح)) ÷ 1000
```

### مثال كامل:

| العقد | المصنع     | السعر/طن | الكمية | التكلفة التشغيلية     |
| ----- | ---------- | -------- | ------ | --------------------- |
| #1    | أبو الذهب  | 27,000   | 50 طن  | NULL → افتراضي: 3,000 |
| #2    | مصنع النور | 25,000   | 200 طن | 1,500 (قريب)          |
| #3    | شركة الأمل | 29,000   | 100 طن | NULL → افتراضي: 3,000 |

```
متوسط البيع المرجّح = (27000×50 + 25000×200 + 29000×100) ÷ (50+200+100)
                     = (1,350,000 + 5,000,000 + 2,900,000) ÷ 350
                     = 26,428 ج.م/طن

متوسط التكلفة المرجّح = (3000×50 + 1500×200 + 3000×100) ÷ 350
                       = (150,000 + 300,000 + 300,000) ÷ 350
                       = 2,143 ج.م/طن

نسبة الربح = 15%
هامش الربح = 26,428 × 0.15 = 3,964 ج.م/طن

سعر الشراء = (26,428 - 2,143 - 3,964) ÷ 1000 = 20.32 ج.م/كيلو
```

> **هذا السعر (20.32 ج.م/كيلو) هو ما سيراه المندوب ويشتري به من العملاء.**

---

## 3. مبادئ التصميم المعتمدة

### 3.1 الإعداد الافتراضي مع إمكانية التخصيص

```
التكلفة الفعلية = COALESCE(
    عقد.operational_cost_override,    -- أولوية 1: تكلفة مخصصة للعقد
    فئة.total_cost                     -- أولوية 2: تكلفة افتراضية للفئة
)
```

### 3.2 الكمية الموردة بدل المتبقية

```
delivered_quantity  → يزيد فقط (أبسط، أقل أخطاء)
remaining          → تُحسب: quantity - delivered_quantity
العقد مستنفد       → عندما delivered_quantity >= quantity
```

> **لماذا؟** العقد لا ينتهي فقط بالتاريخ — ينتهي أيضاً باستنفاد الكمية. العقود
> المستنفدة تخرج تلقائياً من حساب المتوسط المرجّح.

### 3.3 الدقة الرقمية

| النوع   | الدقة           | الاستخدام                     |
| ------- | --------------- | ----------------------------- |
| الأسعار | `NUMERIC(15,2)` | أسعار البيع والشراء والتكاليف |
| الكميات | `NUMERIC(12,3)` | كميات الأطنان (دقة الكيلو)    |

---

## 4. خطة التنفيذ المعتمدة

### المرحلة صفر — تعديل فوري

إضافة حالة `contracted` لـ `market_bids` + لون **بنفسجي** في الواجهة.

```sql
ALTER TABLE market_bids
DROP CONSTRAINT IF EXISTS market_bids_status_check;

ALTER TABLE market_bids
ADD CONSTRAINT market_bids_status_check
CHECK (status IN ('active', 'accepted', 'contracted', 'rejected', 'expired'));
```

---

### المرحلة الأولى — نظام العقود والتكاليف (مكتملة ✅)

#### أ. جدول التكاليف التشغيلية

```sql
CREATE TABLE category_operational_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id BIGINT REFERENCES waste_sub_categories(id) UNIQUE,
    transport_cost NUMERIC(15,2) DEFAULT 0,
    sorting_cost NUMERIC(15,2) DEFAULT 0,
    storage_cost NUMERIC(15,2) DEFAULT 0,
    total_cost NUMERIC(15,2) GENERATED ALWAYS AS
        (transport_cost + sorting_cost + storage_cost) STORED,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### ب. جدول العقود

```sql
CREATE TABLE partner_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES industrial_partners(id),
    bid_id UUID REFERENCES market_bids(id),
    subcategory_id BIGINT REFERENCES waste_sub_categories(id),
    contract_type TEXT CHECK (contract_type IN
        ('one_time', 'short_term', 'long_term')),
    agreed_price NUMERIC(15,2) NOT NULL,
    operational_cost_override NUMERIC(15,2) DEFAULT NULL,
    quantity NUMERIC(12,3) NOT NULL,
    delivered_quantity NUMERIC(12,3) DEFAULT 0,
    unit TEXT DEFAULT 'ton',
    start_date DATE,
    end_date DATE,
    status TEXT CHECK (status IN
        ('draft','active','completed','cancelled','expired'))
        DEFAULT 'draft',
    approved_by UUID REFERENCES admins(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**الملفات المطلوبة:**

| الملف                        | الإجراء                              |
| ---------------------------- | ------------------------------------ |
| `market-bids.types.ts`       | إضافة `'contracted'` إلى `BidStatus` |
| `types.ts` (partners)        | إضافة `PartnerContract` interface    |
| `contractService.ts`         | إنشاء — CRUD للعقود                  |
| `operationalCostService.ts`  | إنشاء — خدمة التكاليف                |
| `ContractsPage.tsx`          | إنشاء — واجهة العقود                 |
| `industrialPartnersSlice.ts` | إضافة actions للعقود                 |

---

### المرحلة الثانية — تكامل الحاسبة بالمتوسط المرجّح (مكتملة ✅)

**الكود:**

```typescript
// العقود الفعّالة = نشطة ولم تُستنفد
const activeContracts = contracts.filter((c) =>
  c.status === "active" && c.delivered_quantity < c.quantity
);

// المتوسط المرجّح
const totalValue = activeContracts.reduce(
  (s, c) => s + (c.agreed_price * c.quantity),
  0,
);
const totalQty = activeContracts.reduce((s, c) => s + c.quantity, 0);
const weightedAvg = totalQty > 0 ? totalValue / totalQty : 0;

// التكلفة المرجّحة
const totalCost = activeContracts.reduce((s, c) => {
  const cost = c.operational_cost_override ?? categoryDefaultCost;
  return s + (cost * c.quantity);
}, 0);
const weightedCost = totalQty > 0 ? totalCost / totalQty : 0;

// سعر الشراء بالكيلو
const buyPriceKg =
  (weightedAvg - weightedCost - (weightedAvg * marginPercent / 100)) / 1000;
```

---

### المرحلة الثالثة — التعميم والإشعارات

- إشعار فوري لجميع المناديب عند تغيير سعر الشراء.
- عرض مؤشر التغيير (صعود/هبوط) في تطبيق الجوال.

---

### المرحلة الرابعة — مؤشر العرض والطلب + Materialized View

> **التوقيت:** بعد 3 أشهر من تشغيل النظام\
> **الوضع:** استشاري فقط — المدير يقرر

**محتويات المرحلة:**

1. `Materialized View` لتسريع حساب المتوسط المرجّح عند كبر حجم البيانات.
2. مؤشر العرض والطلب الديناميكي.

```
عامل العرض والطلب = الطلب المفتوح ÷ المخزون المتاح

لو النسبة > 1 → اقتراح رفع السعر 2-5%
لو النسبة < 1 → اقتراح خفض السعر 2-5%
```

**شكل الواجهة:**

```
┌─────────────────────────────────────────────┐
│  ⚡ مؤشر السوق: زجاجات PET                  │
│  المخزون: 12 طن  │  الطلب المفتوح: 20 طن    │
│  النسبة: 166%    │  الاتجاه: 📈 طلب مرتفع    │
│                                              │
│  💡 النظام يقترح: رفع سعر الشراء 3%          │
│  [تطبيق]  [تجاهل]                           │
└─────────────────────────────────────────────┘
```

**المتطلبات قبل التفعيل:**

- بيانات مخزون لحظية دقيقة.
- تاريخ بيانات لا يقل عن 3 أشهر.
- اختبار المؤشر في وضع "مراقبة" لمدة شهر.

---

## 5. هيكل الجداول والعلاقات

```
industrial_partners (المصانع)
    │
    ├──▶ market_bids (عروض الأسعار)
    │        │  status: active → contracted (بنفسجي)
    │        │
    │        └──▶ partner_contracts (العقود الرسمية)
    │                 │  agreed_price NUMERIC(15,2)
    │                 │  quantity NUMERIC(12,3)
    │                 │  delivered_quantity NUMERIC(12,3)
    │                 │  operational_cost_override NUMERIC(15,2)
    │                 │
    │                 └──▶ industrial_partner_orders (أوامر التوريد)
    │
    └──▶ admins.id (approved_by)

waste_sub_categories (فئات المواد)
    │
    ├──▶ category_operational_costs (تكاليف افتراضية)
    │       transport + sorting + storage = total_cost
    │
    └──▶ partner_contracts.subcategory_id

         المتوسط المرجّح للعقود النشطة غير المستنفدة
                    │
                    ▼
         ┌─────────────────────┐
         │  حاسبة التسعير      │
         │  متوسط مرجّح        │
         │  - تكاليف تشغيل     │
         │  - هامش ربح         │
         │  = سعر شراء/كيلو    │
         └─────────────────────┘
                    │
                    ▼
              stock_exchange
              buy_price  = سعر الشراء بالكيلو
              sell_price = متوسط البيع بالطن
                    │
                    ▼
           تطبيق الجوال (المندوب + العميل)
```

---

## 6. جدول القرارات المعتمدة

| القرار                | التفاصيل                                           |
| --------------------- | -------------------------------------------------- |
| نوع المتوسط           | **مرجّح بالكميات** (Weighted Average)               |
| التكاليف التشغيلية    | افتراضي لكل فئة + تخصيص لكل عقد                    |
| دقة الأسعار           | `NUMERIC(15,2)`                                    |
| دقة الكميات           | `NUMERIC(12,3)`                                    |
| تتبع التوريد          | `delivered_quantity` (يزيد فقط) — المتبقي يُحسب     |
| استنفاد العقد         | `delivered_quantity >= quantity` → يخرج من المتوسط |
| لون حالة `contracted` | **بنفسجي**                                         |
| FK للموافقة           | `admins.id`                                        |
| سجل الأسعار           | ✅ موجود — `exchange_price_history`                |
| Materialized View     | المرحلة 4 — عند كبر البيانات                       |
| محرك العرض/الطلب      | المرحلة 4 — استشاري — بعد 3 أشهر                   |
| وحدة سعر البيع        | **ج.م/طن**                                         |
| وحدة سعر الشراء       | **ج.م/كيلو**                                       |
