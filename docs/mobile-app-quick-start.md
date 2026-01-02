# دليل البدء السريع لتحديث تطبيق الموبايل

## 🚀 التغييرات السريعة (Quick Changes)

### 1. استبدال API Calls

#### ❌ القديم:
```dart
// جلب الفئات
final categories = await http.get(Uri.parse('$baseUrl/api/categories'));

// جلب الفئات الفرعية
final subcategories = await http.get(
  Uri.parse('$baseUrl/api/subcategories?category_id=$categoryId')
);

// جلب المنتجات
final products = await http.get(
  Uri.parse('$baseUrl/api/waste-items?subcategory_id=$subcategoryId')
);
```

#### ✅ الجديد:
```dart
// جلب الفئات الرئيسية
final mainCategories = await supabase
  .from('waste_main_categories')
  .select('id, name, code')
  .order('name');

// جلب الفئات الفرعية
final subCategories = await supabase
  .from('waste_sub_categories')
  .select('id, name, code, main_category_id')
  .eq('main_category_id', mainCategoryId)
  .order('name');

// جلب catalog_waste_materials
final catalogWastes = await supabase
  .from('catalog_waste_materials')
  .select('id, waste_no, name')
  .eq('sub_category_id', subCategoryId);

// جلب المنتجات الفعلية
final products = await supabase
  .from('waste_data_admin')
  .select('''
    id,
    name,
    weight,
    price,
    price_per_kg,
    catalog_waste_id
  ''')
  .in('catalog_waste_id', catalogWastes.map((cw) => cw['id']).toList());
```

---

### 2. تحديث تدفق الاختيار

#### ❌ القديم:
```
الفئة الرئيسية → الفئة الفرعية → المنتج → السعر
```

#### ✅ الجديد:
```
الفئة الرئيسية → الفئة الفرعية → نوع المخلف (catalog_waste) → المنتج → السعر من البورصة
```

---

### 3. حساب السعر

#### ❌ القديم:
```dart
final price = product['price']; // سعر ثابت
```

#### ✅ الجديد:
```dart
// جلب سعر البورصة
final exchangePrice = await supabase
  .from('stock_exchange')
  .select('buy_price')
  .eq('catalog_waste_id', product['catalog_waste_id'])
  .single();

// حساب سعر الوحدة
final weightInKg = product['weight'] / 1000; // تحويل من جرام إلى كيلو
final unitPrice = exchangePrice['buy_price'] * weightInKg;
```

---

## 📝 Checklist التنفيذ

### المرحلة 1: تحديث API Calls
- [ ] استبدال `categories` بـ `waste_main_categories`
- [ ] استبدال `subcategories` بـ `waste_sub_categories`
- [ ] إضافة جلب `catalog_waste_materials`
- [ ] تحديث جلب المنتجات لاستخدام `catalog_waste_id`

### المرحلة 2: تحديث UI
- [ ] إضافة خطوة اختيار `catalog_waste` في التدفق
- [ ] تحديث عرض المنتجات
- [ ] تحديث عرض الأسعار

### المرحلة 3: تحديث الحسابات
- [ ] تحديث حساب السعر لاستخدام `stock_exchange`
- [ ] تحديث حساب الوزن (التحويل من جرام إلى كيلو)
- [ ] تحديث إضافة المنتجات للسلة

### المرحلة 4: الاختبار
- [ ] اختبار التدفق الكامل
- [ ] اختبار الحسابات
- [ ] اختبار الربط مع البورصة

---

## 🔗 روابط مهمة

- [الدليل الكامل](./mobile-app-migration-guide.md)
- [استراتيجية التصنيف](./waste-classification-strategy.md)
- [تكامل السلة مع البورصة](./basket-pricing-integration.md)

---

**آخر تحديث:** 2024-01-15

