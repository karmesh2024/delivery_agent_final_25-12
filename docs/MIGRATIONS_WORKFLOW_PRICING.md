# تنفيذ هجرات Workflow التسلسل والتسعير (يدوياً)

هذا الملف يوضح **ترتيب** تنفيذ الهجرات الخاصة بتسعير الفئات الفرعية ومعدّلات المنتج وطلبات الموافقة.

## الترتيب المطلوب

نفّذ الملفات التالية في **Supabase SQL Editor** بهذا الترتيب:

### 1. سعر الفئة الفرعية + معدّلات المنتج
**الملف:** `supabase/migrations/20260130_subcategory_exchange_price_and_product_modifiers.sql`

- ينشئ جدول **subcategory_exchange_price** (سعر البورصة لكل فئة فرعية).
- يضيف إلى **waste_data_admin**: `price_premium_percentage`, `price_premium_fixed_amount`, `display_order`, `pricing_subcategory_id`.

**التفاصيل:** راجع `supabase/migrations/README_20260130_workflow_pricing.md`.

---

### 2. طلبات الموافقة على سعر الفئة الفرعية
**الملف:** `supabase/migrations/20260129_subcategory_price_approval_requests.sql`

- ينشئ جدول **subcategory_price_approval_requests** لطلبات الموافقة عندما يكون تغيير السعر ≥ 10%.

**التفاصيل:** راجع `supabase/migrations/README_subcategory_price_approval.md`.

---

## خطوات التنفيذ

1. افتح **Supabase Dashboard** → **SQL Editor**.
2. نفّذ الملف **الأول** (20260130) ثم **Run**.
3. نفّذ الملف **الثاني** (20260129) ثم **Run**.

## التحقق

- وجود جدول `subcategory_exchange_price` وأعمدة `price_premium_percentage`, `price_premium_fixed_amount`, `display_order` في `waste_data_admin`.
- وجود جدول `subcategory_price_approval_requests`.

بعد التنفيذ يمكنك استخدام:
- **إدارة الفئات والمنتجات** → **جميع المنتجات (إعدادات تشغيلية)** لعرض السعر الفعلي وتعديل الظهور وترتيب العرض ومعدّلات السعر.
- **إدارة التسعير والبورصة** → **أسعار الفئات الفرعية** لتعديل سعر كل فئة (مع منطق 10% للموافقة).
- **طلبات الموافقة على الأسعار** (`/waste-management/pricing-approvals`) للموافقة على تغييرات الأسعار الكبيرة.
