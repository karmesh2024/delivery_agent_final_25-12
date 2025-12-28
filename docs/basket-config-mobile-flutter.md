# توثيق تقييد سلات النفايات بالوزن والحجم لتطبيق الموبايل (Flutter + Bloc)

## مقدمة

هذا التوثيق موجه لمبرمجي تطبيق الموبايل (Flutter) الخاص بالوكلاء المعتمدين، ويوضح كيف يتم التحكم في سعة السلات (الوزن والحجم) عند إضافة أو تعديل أو تعبئة السلة، بناءً على جداول وقواعد البيانات في الاسكيما الموحدة.

---

## الجداول الأساسية في قاعدة البيانات

### 1. جدول سلة الفئة الرئيسية (`category_bucket_config`)

```sql
CREATE TABLE public.category_bucket_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  supplier_type public.basket_supplier_type NOT NULL,
  basket_size public.basket_size NOT NULL,
  basket_empty_weight_kg DOUBLE PRECISION NOT NULL,
  max_net_weight_kg DOUBLE PRECISION NOT NULL,
  max_volume_liters DOUBLE PRECISION NULL,
  min_fill_percentage INTEGER NOT NULL DEFAULT 80,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  allocated_net_weight_kg DOUBLE PRECISION NOT NULL DEFAULT 0,
  allocated_volume_liters DOUBLE PRECISION NULL DEFAULT 0,
  CONSTRAINT category_bucket_config_pkey PRIMARY KEY (id),
  CONSTRAINT category_bucket_config_unique UNIQUE (category_id, supplier_type, basket_size),
  CONSTRAINT category_bucket_config_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
  CONSTRAINT min_fill_percentage_check CHECK (
    (min_fill_percentage >= 0) AND (min_fill_percentage <= 100)
  )
) TABLESPACE pg_default;
```

#### أهم الحقول:
- **max_net_weight_kg**: الحد الأقصى للوزن الصافي المسموح به للسلة.
- **max_volume_liters**: الحد الأقصى للحجم (باللتر) المسموح به للسلة.
- **allocated_net_weight_kg**: الوزن الذي تم تخصيصه بالفعل للسلال الفرعية (يجب خصمه من الحد الأقصى عند وجود سلال فرعية).
- **allocated_volume_liters**: الحجم الذي تم تخصيصه بالفعل للسلال الفرعية.

---

### 2. جدول سلة الفئة الفرعية (`subcategory_bucket_config`)

```sql
CREATE TABLE public.subcategory_bucket_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subcategory_id uuid NOT NULL,
  supplier_type public.basket_supplier_type NOT NULL,
  basket_size public.basket_size NOT NULL,
  basket_empty_weight_kg DOUBLE PRECISION NOT NULL,
  max_net_weight_kg DOUBLE PRECISION NOT NULL,
  max_volume_liters DOUBLE PRECISION NULL,
  min_fill_percentage INTEGER NOT NULL DEFAULT 80,
  max_items_count INTEGER NULL,
  requires_separation BOOLEAN NOT NULL DEFAULT FALSE,
  special_handling_notes TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT subcategory_bucket_config_pkey PRIMARY KEY (id),
  CONSTRAINT subcategory_bucket_config_unique UNIQUE (subcategory_id, supplier_type, basket_size),
  CONSTRAINT subcategory_bucket_config_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES subcategories (id) ON DELETE CASCADE,
  CONSTRAINT subcategory_min_fill_percentage_check CHECK (
    (min_fill_percentage >= 0) AND (min_fill_percentage <= 100)
  )
) TABLESPACE pg_default;
```

#### أهم الحقول:
- **max_net_weight_kg**: الحد الأقصى للوزن الصافي المسموح به للسلة الفرعية.
- **max_volume_liters**: الحد الأقصى للحجم (باللتر) المسموح به للسلة الفرعية.

---

## منطق التقييد في التطبيق

### 1. عند وجود سلة فرعية (`subcategory_bucket_config`)
- يجب على التطبيق عند إضافة أو تعديل أو تعبئة السلة أن يتحقق من:
  - **ألا يتجاوز مجموع وزن المنتجات في السلة الفرعية** القيمة الموجودة في `max_net_weight_kg`.
  - **ألا يتجاوز مجموع حجم المنتجات في السلة الفرعية** القيمة الموجودة في `max_volume_liters` (إذا كانت غير null).
- **ملاحظة:** لا يمكن إضافة منتجات تتجاوز هذه الحدود، ويجب إظهار رسالة للمستخدم عند محاولة التجاوز.

### 2. عند عدم وجود سلة فرعية (الاعتماد على سلة الفئة الرئيسية فقط)
- يتم التحقق مباشرة من حدود السلة الرئيسية (`category_bucket_config`):
  - **max_net_weight_kg** و **max_volume_liters**.
- أي منتج يُضاف يجب ألا يتجاوز هذه الحدود.

### 3. عند وجود تخصيص (allocated) في السلة الرئيسية
- إذا كان هناك سلال فرعية، يجب على التطبيق عند عرض السعة المتبقية للسلة الرئيسية أن يخصم القيم الموجودة في:
  - **allocated_net_weight_kg**
  - **allocated_volume_liters**
- أي سلة فرعية جديدة يجب ألا تتجاوز السعة المتبقية.

---

## مثال عملي (Pseudo-code)

```dart
// عند محاولة إضافة منتج إلى سلة
final double currentWeight = ...; // الوزن الحالي في السلة
final double currentVolume = ...; // الحجم الحالي في السلة
final double itemWeight = ...;    // وزن المنتج الجديد
final double itemVolume = ...;    // حجم المنتج الجديد

final double maxWeight = config.maxNetWeightKg;
final double maxVolume = config.maxVolumeLiters ?? double.infinity;

if ((currentWeight + itemWeight) > maxWeight) {
  // أظهر رسالة: السلة ممتلئة وزناً
  emit(BasketError('لا يمكن إضافة المنتج، السلة ممتلئة وزناً'));
  return;
}
if ((currentVolume + itemVolume) > maxVolume) {
  // أظهر رسالة: السلة ممتلئة حجماً
  emit(BasketError('لا يمكن إضافة المنتج، السلة ممتلئة حجماً'));
  return;
}
// أضف المنتج للسلة
```

---

## نصائح هندسية

- يجب جلب بيانات التكوين من الـ API عند كل عملية إضافة/تعديل أو عند فتح شاشة السلة.
- يفضل أن يكون التحقق من الحدود (Validation) في طبقة الـ Bloc أو UseCase وليس فقط في الواجهة.
- يجب توحيد رسائل الخطأ للمستخدم النهائي (مثلاً: "لا يمكن إضافة المنتج، السلة ممتلئة").
- عند وجود سلال فرعية، يجب أن يتم التحقق من السعة المتبقية في السلة الرئيسية قبل السماح بإنشاء سلة فرعية جديدة.

---

## روابط ذات صلة

- [20240729_unified_basket_schema.sql](../supabase/migrations/20240729_unified_basket_schema.sql)
- [20240723140000_add_allocated_capacity_to_category_bucket_config.sql](../supabase/migrations/20240723140000_add_allocated_capacity_to_category_bucket_config.sql)

---

## تواصل واستفسارات

لأي استفسار تقني أو توضيح إضافي، يرجى التواصل مع فريق الـ Backend أو مسؤول الـ Database. 