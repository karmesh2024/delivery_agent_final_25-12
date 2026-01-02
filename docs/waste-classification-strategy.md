# استراتيجية التصنيف في نظام إدارة المخلفات

## تحليل المشكلة الحالية

### الوضع الحالي:

1. **كتالوج المخازن (`catalog_waste_materials`)**:
   - يحتوي على: `main_category_id`, `sub_category_id` من `waste_main_categories` و `waste_sub_categories`
   - يحدد "نوع المخلف" (مثل "بلاستيك PET شفاف وملون")
   - **لا يحدد المنتجات الفعلية** (مثل "زجاجة 10 لتر")

2. **إدارة الفئات والمنتجات السابقة (`waste_data_admin`)**:
   - يحتوي على: `category_id`, `subcategory_id` من `categories` و `subcategories`
   - يحدد "المنتجات الفعلية" (مثل "زجاجة 10 لتر" بوزن 0.6 كجم)
   - **لا يرتبط بكتالوج المخازن**

3. **المشكلة**:
   - لا يوجد ربط واضح بين "نوع المخلف" و "المنتجات الفعلية"
   - التطبيقات الثلاثة (العميل، الدليفرى، الوكيل) تحتاج لتصنيف موحد

---

## السؤال الأساسي: أين يجب أن يتم التصنيف؟

### الخيار 1: التصنيف في تطبيق العميل (موصى به) ✅

**المميزات:**
- العميل يعرف نوع المخلف الذي يجمعه
- تقليل الأخطاء في التصنيف
- تسريع عملية الاستلام
- العميل يرى السعر المتوقع مباشرة

**العيوب:**
- يحتاج تدريب العميل
- قد يحتاج الدليفرى للتحقق

**السيناريو:**
1. العميل يفتح التطبيق
2. يختار "إضافة مخلفات"
3. يختار الفئة الرئيسية (مثل "مخلفات بلاستيك")
4. يختار الفئة الفرعية (مثل "زجاجات")
5. يختار المنتج الفعلي (مثل "زجاجة 10 لتر")
6. يضيف الكمية
7. يضيف للسلة

**المصدر:**
- الفئات من `catalog_waste_materials` → `waste_main_categories` → `waste_sub_categories`
- المنتجات من `waste_data_admin` (مرتبطة بـ `catalog_waste_id`)

---

### الخيار 2: التصنيف عند الدليفرى بوي

**المميزات:**
- الدليفرى لديه خبرة في التصنيف
- يمكن التحقق من جودة المخلفات
- تقليل الأخطاء

**العيوب:**
- أبطأ في الاستلام
- يحتاج اتصال بالإنترنت
- قد يختلف التصنيف بين الدليفرى

**السيناريو:**
1. العميل يطلب الشحن (بدون تصنيف)
2. الدليفرى يأتي
3. يفتح التطبيق
4. يزن المخلفات
5. يصنفها (الفئة الرئيسية → الفئة الفرعية → المنتج)
6. يحسب السعر

---

### الخيار 3: التصنيف عند الوكيل

**المميزات:**
- الوكيل لديه خبرة أكبر
- يمكن الفرز الدقيق

**العيوب:**
- أبطأ في المعالجة
- يحتاج مساحة تخزين
- العميل لا يعرف السعر مسبقاً

---

## الحل المقترح: نظام هجين (Hybrid)

### المرحلة 1: التصنيف في تطبيق العميل (الافتراضي)

1. **العميل يصنف المخلفات:**
   - يختار الفئة الرئيسية والفرعية من `catalog_waste_materials`
   - يختار المنتج الفعلي من `waste_data_admin` (مرتبط بـ `catalog_waste_id`)
   - يضيف للسلة

2. **عرض السعر المتوقع:**
   - حساب السعر بناءً على `stock_exchange.buy_price`
   - عرض السعر للعميل

3. **عند الاستلام:**
   - الدليفرى يتحقق من التصنيف
   - يزن المخلفات فعلياً
   - يعدل التصنيف إذا لزم الأمر

### المرحلة 2: التصنيف عند الدليفرى (للحالات الخاصة)

1. **إذا لم يصنف العميل:**
   - الدليفرى يصنف المخلفات
   - يزنها
   - يحسب السعر

2. **إذا كان التصنيف غير صحيح:**
   - الدليفرى يعدل التصنيف
   - يزن المخلفات
   - يحسب السعر

---

## البنية المقترحة

### 1. ربط `catalog_waste_materials` مع `waste_data_admin`

```
catalog_waste_materials (نوع المخلف)
    ↓ (1:N)
waste_data_admin (المنتجات الفعلية)
    - catalog_waste_id → catalog_waste_materials.id
    - category_id → categories.id (للتوافق مع النظام القديم)
    - subcategory_id → subcategories.id (للتوافق مع النظام القديم)
```

### 2. ربط الفئات

```
waste_main_categories (كتالوج المخازن)
    ↓ (ربط غير مباشر)
unified_main_categories (النظام الموحد)
    ↓ (ربط غير مباشر)
categories (النظام القديم)
```

**المشكلة**: لا يوجد ربط مباشر بين `waste_main_categories` و `categories`

**الحل المقترح**:
- إضافة `waste_main_category_id` إلى `categories`
- إضافة `waste_sub_category_id` إلى `subcategories`
- ربط `catalog_waste_materials` مع `waste_data_admin` عبر `catalog_waste_id`

---

## التطبيق العملي

### في تطبيق العميل:

```typescript
// 1. جلب الفئات الرئيسية من catalog_waste_materials
const { data: mainCategories } = await supabase
  .from('waste_main_categories')
  .select('id, name, code')
  .order('name');

// 2. عند اختيار الفئة الرئيسية، جلب الفئات الفرعية
const { data: subCategories } = await supabase
  .from('waste_sub_categories')
  .select('id, name, code')
  .eq('main_category_id', selectedMainCategoryId)
  .order('name');

// 3. عند اختيار الفئة الفرعية، جلب catalog_waste_materials
const { data: catalogWastes } = await supabase
  .from('catalog_waste_materials')
  .select('id, waste_no, name, main_category_id, sub_category_id')
  .eq('sub_category_id', selectedSubCategoryId);

// 4. عند اختيار catalog_waste، جلب المنتجات الفعلية
const { data: products } = await supabase
  .from('waste_data_admin')
  .select('id, name, weight, price, price_per_kg')
  .eq('catalog_waste_id', selectedCatalogWasteId);

// 5. عرض السعر من stock_exchange
const { data: exchangePrice } = await supabase
  .from('stock_exchange')
  .select('buy_price, sell_price')
  .eq('catalog_waste_id', selectedCatalogWasteId)
  .single();
```

### في تطبيق الدليفرى:

```typescript
// 1. جلب السلة من العميل
const { data: basket } = await supabase
  .from('baskets')
  .select(`
    *,
    basket_contents(
      *,
      waste_data:waste_data_admin(
        *,
        catalog_waste:catalog_waste_materials(*)
      )
    )
  `)
  .eq('id', basketId)
  .single();

// 2. التحقق من التصنيف
// 3. وزن المخلفات فعلياً
// 4. تعديل التصنيف إذا لزم الأمر
// 5. حساب السعر النهائي
```

---

## الخلاصة والتوصيات

### ✅ التوصية: التصنيف في تطبيق العميل (مع التحقق من الدليفرى)

**الأسباب:**
1. **سرعة**: العميل يصنف أثناء الجمع
2. **شفافية**: العميل يرى السعر المتوقع
3. **دقة**: تقليل الأخطاء
4. **مرونة**: الدليفرى يتحقق ويعدل إذا لزم الأمر

**الخطوات:**
1. ربط `catalog_waste_materials` مع `waste_data_admin` عبر `catalog_waste_id` ✅ (تم)
2. ربط `waste_main_categories` مع `categories` (مطلوب)
3. تحديث تطبيق العميل لاستخدام `catalog_waste_materials` بدلاً من `categories`
4. تحديث تطبيق الدليفرى للتحقق من التصنيف
5. تحديث تطبيق الوكيل للتحقق النهائي

---

## الأسئلة المتبقية

1. **هل يجب ربط `waste_main_categories` مع `categories` مباشرة؟**
   - نعم، لإظهار نفس الفئات في التطبيقات الثلاثة

2. **هل يجب إزالة "إدارة الفئات والمنتجات" السابقة؟**
   - لا، يمكن الاحتفاظ بها للتوافق مع النظام القديم
   - لكن التطبيقات الجديدة تستخدم `catalog_waste_materials`

3. **كيف نربط المنتجات الفعلية مع catalog_waste_materials؟**
   - عبر `catalog_waste_id` في `waste_data_admin` ✅ (تم)

