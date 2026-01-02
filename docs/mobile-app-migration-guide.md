# دليل تحديث تطبيق الموبايل: الانتقال إلى كتالوج المخلفات

## 📋 نظرة عامة

تم تحديث النظام لاستخدام **كتالوج المخلفات** (`catalog_waste_materials`) من إدارة المخازن بدلاً من "إدارة الفئات والمنتجات" القديمة. هذا التحديث يضمن توحيد التصنيفات في جميع التطبيقات وربطها بالبورصة والتسعير.

---

## 🔄 التغييرات الرئيسية

### قبل (النظام القديم):
- الفئات من `categories` و `subcategories`
- المنتجات من `waste_data_admin` فقط
- لا يوجد ربط بالبورصة

### بعد (النظام الجديد):
- الفئات من `waste_main_categories` و `waste_sub_categories`
- المنتجات من `waste_data_admin` مرتبطة بـ `catalog_waste_materials`
- الربط بالبورصة عبر `catalog_waste_id`

---

## 📱 التعديلات المطلوبة في تطبيق الموبايل

### 1. تغيير API للفئات الرئيسية

#### ❌ القديم:
```dart
// جلب الفئات من categories
final response = await http.get(
  Uri.parse('$baseUrl/api/categories'),
);
```

#### ✅ الجديد:
```dart
// جلب الفئات من waste_main_categories
final response = await http.get(
  Uri.parse('$baseUrl/api/waste-main-categories'),
);

// أو استخدام Supabase مباشرة
final response = await supabase
  .from('waste_main_categories')
  .select('id, name, code')
  .order('name');
```

---

### 2. تغيير API للفئات الفرعية

#### ❌ القديم:
```dart
// جلب الفئات الفرعية من subcategories
final response = await http.get(
  Uri.parse('$baseUrl/api/subcategories?category_id=$categoryId'),
);
```

#### ✅ الجديد:
```dart
// جلب الفئات الفرعية من waste_sub_categories
final response = await supabase
  .from('waste_sub_categories')
  .select('id, name, code, main_category_id')
  .eq('main_category_id', mainCategoryId)
  .order('name');
```

---

### 3. جلب المنتجات الفعلية

#### ❌ القديم:
```dart
// جلب المنتجات مباشرة من waste_data_admin
final response = await supabase
  .from('waste_data_admin')
  .select('*')
  .eq('subcategory_id', subcategoryId);
```

#### ✅ الجديد:
```dart
// 1. أولاً: جلب catalog_waste_materials للفئة الفرعية
final catalogResponse = await supabase
  .from('catalog_waste_materials')
  .select('id, waste_no, name, main_category_id, sub_category_id')
  .eq('sub_category_id', subCategoryId);

final catalogIds = catalogResponse
    .map((item) => item['id'] as int)
    .toList();

// 2. ثانياً: جلب المنتجات الفعلية المرتبطة
final productsResponse = await supabase
  .from('waste_data_admin')
  .select('''
    id,
    name,
    weight,
    price,
    price_per_kg,
    catalog_waste_id,
    catalog_waste:catalog_waste_materials(
      id,
      waste_no,
      name
    )
  ''')
  .in('catalog_waste_id', catalogIds);
```

---

### 4. جلب السعر من البورصة

#### ❌ القديم:
```dart
// السعر من waste_data_admin مباشرة
final price = product['price'];
```

#### ✅ الجديد:
```dart
// السعر من stock_exchange المرتبط بـ catalog_waste_id
final catalogWasteId = product['catalog_waste_id'];

final exchangeResponse = await supabase
  .from('stock_exchange')
  .select('buy_price, sell_price, last_update')
  .eq('catalog_waste_id', catalogWasteId)
  .single();

final buyPrice = exchangeResponse['buy_price']; // سعر الكيلو
final sellPrice = exchangeResponse['sell_price'];

// حساب سعر الوحدة
final unitWeight = product['weight'] / 1000; // تحويل من جرام إلى كيلو
final unitPrice = buyPrice * unitWeight;
```

---

## 🏗️ البنية الجديدة للبيانات

### نموذج البيانات (Models)

#### 1. MainCategory (الفئة الرئيسية)
```dart
class MainCategory {
  final int id;
  final String name;
  final String? code;

  MainCategory({
    required this.id,
    required this.name,
    this.code,
  });

  factory MainCategory.fromJson(Map<String, dynamic> json) {
    return MainCategory(
      id: json['id'] as int,
      name: json['name'] as String,
      code: json['code'] as String?,
    );
  }
}
```

#### 2. SubCategory (الفئة الفرعية)
```dart
class SubCategory {
  final int id;
  final String name;
  final String? code;
  final int mainCategoryId;

  SubCategory({
    required this.id,
    required this.name,
    this.code,
    required this.mainCategoryId,
  });

  factory SubCategory.fromJson(Map<String, dynamic> json) {
    return SubCategory(
      id: json['id'] as int,
      name: json['name'] as String,
      code: json['code'] as String?,
      mainCategoryId: json['main_category_id'] as int,
    );
  }
}
```

#### 3. CatalogWaste (نوع المخلف)
```dart
class CatalogWaste {
  final int id;
  final String wasteNo;
  final String? name;
  final int mainCategoryId;
  final int subCategoryId;

  CatalogWaste({
    required this.id,
    required this.wasteNo,
    this.name,
    required this.mainCategoryId,
    required this.subCategoryId,
  });

  factory CatalogWaste.fromJson(Map<String, dynamic> json) {
    return CatalogWaste(
      id: json['id'] as int,
      wasteNo: json['waste_no'] as String,
      name: json['name'] as String?,
      mainCategoryId: json['main_category_id'] as int,
      subCategoryId: json['sub_category_id'] as int,
    );
  }
}
```

#### 4. WasteProduct (المنتج الفعلي)
```dart
class WasteProduct {
  final String id;
  final String name;
  final double weight; // بالجرام
  final double price; // سعر الوحدة
  final double? pricePerKg; // سعر الكيلو
  final int? catalogWasteId;
  final CatalogWaste? catalogWaste;

  WasteProduct({
    required this.id,
    required this.name,
    required this.weight,
    required this.price,
    this.pricePerKg,
    this.catalogWasteId,
    this.catalogWaste,
  });

  factory WasteProduct.fromJson(Map<String, dynamic> json) {
    return WasteProduct(
      id: json['id'] as String,
      name: json['name'] as String,
      weight: (json['weight'] as num).toDouble(),
      price: (json['price'] as num).toDouble(),
      pricePerKg: json['price_per_kg'] != null 
          ? (json['price_per_kg'] as num).toDouble() 
          : null,
      catalogWasteId: json['catalog_waste_id'] as int?,
      catalogWaste: json['catalog_waste'] != null
          ? CatalogWaste.fromJson(json['catalog_waste'] as Map<String, dynamic>)
          : null,
    );
  }
}
```

#### 5. ExchangePrice (سعر البورصة)
```dart
class ExchangePrice {
  final double buyPrice; // سعر الشراء (للطن/كيلو)
  final double sellPrice; // سعر البيع
  final DateTime lastUpdate;

  ExchangePrice({
    required this.buyPrice,
    required this.sellPrice,
    required this.lastUpdate,
  });

  factory ExchangePrice.fromJson(Map<String, dynamic> json) {
    return ExchangePrice(
      buyPrice: (json['buy_price'] as num).toDouble(),
      sellPrice: (json['sell_price'] as num).toDouble(),
      lastUpdate: DateTime.parse(json['last_update'] as String),
    );
  }
}
```

---

## 🔌 API Endpoints الجديدة

### ملاحظة مهمة:
يمكن استخدام Supabase مباشرة من التطبيق، أو إنشاء API endpoints في Next.js. نوصي باستخدام Supabase مباشرة للأداء الأفضل.

---

### 1. جلب الفئات الرئيسية

#### باستخدام Supabase:
```dart
final response = await supabase
  .from('waste_main_categories')
  .select('id, name, code')
  .order('name');
```

#### أو API Endpoint:
```
GET /api/waste-main-categories
```

**Response:**
```json
[
  {
    "id": 29,
    "name": "بلاستيك",
    "code": "PL-0"
  },
  {
    "id": 2,
    "name": "معادن",
    "code": "WC-002"
  }
]
```

---

### 2. جلب الفئات الفرعية

#### باستخدام Supabase:
```dart
final response = await supabase
  .from('waste_sub_categories')
  .select('id, name, code, main_category_id')
  .eq('main_category_id', mainCategoryId)
  .order('name');
```

#### أو API Endpoint:
```
GET /api/waste-sub-categories?main_category_id=29
```

**Response:**
```json
[
  {
    "id": 41,
    "name": "بلاستيك PET شفاف وملون",
    "code": "PET-001",
    "main_category_id": 29
  }
]
```

---

### 3. جلب catalog_waste_materials للفئة الفرعية

#### باستخدام Supabase:
```dart
final response = await supabase
  .from('catalog_waste_materials')
  .select('id, waste_no, name, main_category_id, sub_category_id')
  .eq('sub_category_id', subCategoryId);
```

#### أو API Endpoint:
```
GET /api/catalog-waste-materials?sub_category_id=41
```

**Response:**
```json
[
  {
    "id": 20,
    "waste_no": "WASTE-2026-331285",
    "name": "بلاستيك PET شفاف وملون",
    "main_category_id": 29,
    "sub_category_id": 41
  }
]
```

---

### 4. جلب المنتجات الفعلية

#### باستخدام Supabase:
```dart
final response = await supabase
  .from('waste_data_admin')
  .select('''
    id,
    name,
    weight,
    price,
    price_per_kg,
    catalog_waste_id,
    catalog_waste:catalog_waste_materials(
      id,
      waste_no,
      name
    )
  ''')
  .eq('catalog_waste_id', catalogWasteId);
```

#### أو API Endpoint:
```
GET /api/waste-products?catalog_waste_id=20
```

**Response:**
```json
[
  {
    "id": "7c431740-c338-4b05-ab4d-3cc47aeca7d0",
    "name": "زجاجة 10 لتر",
    "weight": 600,
    "price": 0.03,
    "price_per_kg": 20,
    "catalog_waste_id": 20,
    "catalog_waste": {
      "id": 20,
      "waste_no": "WASTE-2026-331285",
      "name": "بلاستيك PET شفاف وملون"
    }
  }
]
```

---

### 5. جلب سعر البورصة

#### باستخدام Supabase:
```dart
final response = await supabase
  .from('stock_exchange')
  .select('buy_price, sell_price, last_update, catalog_waste_id')
  .eq('catalog_waste_id', catalogWasteId)
  .single();
```

#### أو API Endpoint:
```
GET /api/exchange/prices?catalog_waste_id=20
```

**Response:**
```json
{
  "catalog_waste_id": 20,
  "buy_price": 20.00,
  "sell_price": 24.00,
  "last_update": "2024-01-15T10:30:00Z"
}
```

---

### 6. إضافة منتج للسلة

#### باستخدام Supabase:
```dart
await supabase.from('basket_contents').insert({
  'basket_id': basketId,
  'waste_data_id': productId,
  'quantity': quantity,
  'total_weight_kg': totalWeightKg,
});
```

#### أو API Endpoint:
```
POST /api/baskets/{basketId}/contents
```

**Request Body:**
```json
{
  "waste_data_id": "7c431740-c338-4b05-ab4d-3cc47aeca7d0",
  "quantity": 5,
  "total_weight_kg": 3.0
}
```

---

## 💻 مثال كامل: تدفق إضافة منتج للسلة

```dart
class WasteCollectionService {
  final SupabaseClient supabase;

  WasteCollectionService(this.supabase);

  // 1. جلب الفئات الرئيسية
  Future<List<MainCategory>> getMainCategories() async {
    final response = await supabase
      .from('waste_main_categories')
      .select('id, name, code')
      .order('name');

    return (response as List)
        .map((json) => MainCategory.fromJson(json))
        .toList();
  }

  // 2. جلب الفئات الفرعية
  Future<List<SubCategory>> getSubCategories(int mainCategoryId) async {
    final response = await supabase
      .from('waste_sub_categories')
      .select('id, name, code, main_category_id')
      .eq('main_category_id', mainCategoryId)
      .order('name');

    return (response as List)
        .map((json) => SubCategory.fromJson(json))
        .toList();
  }

  // 3. جلب catalog_waste_materials للفئة الفرعية
  Future<List<CatalogWaste>> getCatalogWastes(int subCategoryId) async {
    final response = await supabase
      .from('catalog_waste_materials')
      .select('id, waste_no, name, main_category_id, sub_category_id')
      .eq('sub_category_id', subCategoryId);

    return (response as List)
        .map((json) => CatalogWaste.fromJson(json))
        .toList();
  }

  // 4. جلب المنتجات الفعلية
  Future<List<WasteProduct>> getProducts(int catalogWasteId) async {
    final response = await supabase
      .from('waste_data_admin')
      .select('''
        id,
        name,
        weight,
        price,
        price_per_kg,
        catalog_waste_id,
        catalog_waste:catalog_waste_materials(
          id,
          waste_no,
          name
        )
      ''')
      .eq('catalog_waste_id', catalogWasteId);

    return (response as List)
        .map((json) => WasteProduct.fromJson(json))
        .toList();
  }

  // 5. جلب سعر البورصة
  Future<ExchangePrice> getExchangePrice(int catalogWasteId) async {
    final response = await supabase
      .from('stock_exchange')
      .select('buy_price, sell_price, last_update')
      .eq('catalog_waste_id', catalogWasteId)
      .single();

    return ExchangePrice.fromJson(response);
  }

  // 6. حساب السعر النهائي للمنتج
  Future<double> calculateProductPrice(WasteProduct product) async {
    if (product.catalogWasteId == null) {
      return product.price; // السعر القديم
    }

    // جلب سعر البورصة
    final exchangePrice = await getExchangePrice(product.catalogWasteId!);
    
    // حساب سعر الوحدة: (سعر الكيلو × الوزن بالكيلو)
    final weightInKg = product.weight / 1000;
    return exchangePrice.buyPrice * weightInKg;
  }

  // 7. إضافة منتج للسلة
  Future<void> addToBasket({
    required String basketId,
    required String productId,
    required int quantity,
  }) async {
    // جلب معلومات المنتج
    final productResponse = await supabase
      .from('waste_data_admin')
      .select('id, weight, catalog_waste_id')
      .eq('id', productId)
      .single();

    final weight = (productResponse['weight'] as num).toDouble();
    final totalWeightKg = (weight / 1000) * quantity;

    // إضافة للسلة
    await supabase.from('basket_contents').insert({
      'basket_id': basketId,
      'waste_data_id': productId,
      'quantity': quantity,
      'total_weight_kg': totalWeightKg,
    });
  }
}
```

---

## 🎨 مثال واجهة المستخدم (UI)

```dart
class WasteCollectionScreen extends StatefulWidget {
  @override
  _WasteCollectionScreenState createState() => _WasteCollectionScreenState();
}

class _WasteCollectionScreenState extends State<WasteCollectionScreen> {
  final WasteCollectionService service = WasteCollectionService(supabase);
  
  List<MainCategory>? mainCategories;
  List<SubCategory>? subCategories;
  List<CatalogWaste>? catalogWastes;
  List<WasteProduct>? products;
  MainCategory? selectedMainCategory;
  SubCategory? selectedSubCategory;
  CatalogWaste? selectedCatalogWaste;
  WasteProduct? selectedProduct;

  @override
  void initState() {
    super.initState();
    loadMainCategories();
  }

  Future<void> loadMainCategories() async {
    final categories = await service.getMainCategories();
    setState(() {
      mainCategories = categories;
    });
  }

  Future<void> onMainCategorySelected(MainCategory category) async {
    setState(() {
      selectedMainCategory = category;
      selectedSubCategory = null;
      selectedCatalogWaste = null;
      selectedProduct = null;
    });

    final subCats = await service.getSubCategories(category.id);
    setState(() {
      subCategories = subCats;
    });
  }

  Future<void> onSubCategorySelected(SubCategory subCategory) async {
    setState(() {
      selectedSubCategory = subCategory;
      selectedCatalogWaste = null;
      selectedProduct = null;
    });

    final catalogWastes = await service.getCatalogWastes(subCategory.id);
    setState(() {
      this.catalogWastes = catalogWastes;
    });
  }

  Future<void> onCatalogWasteSelected(CatalogWaste catalogWaste) async {
    setState(() {
      selectedCatalogWaste = catalogWaste;
      selectedProduct = null;
    });

    final products = await service.getProducts(catalogWaste.id);
    setState(() {
      this.products = products;
    });
  }

  Future<void> onProductSelected(WasteProduct product) async {
    setState(() {
      selectedProduct = product;
    });

    // حساب السعر النهائي
    final finalPrice = await service.calculateProductPrice(product);
    
    // عرض السعر للعميل
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('السعر المتوقع'),
        content: Text('السعر: ${finalPrice.toStringAsFixed(2)} ج.م'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('إلغاء'),
          ),
          TextButton(
            onPressed: () {
              // إضافة للسلة
              // ...
              Navigator.pop(context);
            },
            child: Text('إضافة للسلة'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('إضافة مخلفات')),
      body: Column(
        children: [
          // خطوات الاختيار
          if (mainCategories != null)
            _buildCategorySelector(),
          if (subCategories != null)
            _buildSubCategorySelector(),
          if (catalogWastes != null)
            _buildCatalogWasteSelector(),
          if (products != null)
            _buildProductSelector(),
        ],
      ),
    );
  }

  Widget _buildCategorySelector() {
    return Expanded(
      child: ListView.builder(
        itemCount: mainCategories!.length,
        itemBuilder: (context, index) {
          final category = mainCategories![index];
          return ListTile(
            title: Text(category.name),
            onTap: () => onMainCategorySelected(category),
            selected: selectedMainCategory?.id == category.id,
          );
        },
      ),
    );
  }

  // ... باقي الـ widgets
}
```

---

## ⚠️ ملاحظات مهمة

### 1. الوزن بالجرام
- `waste_data_admin.weight` بالجرام، وليس بالكيلو
- عند الحساب: `weightInKg = weight / 1000`

### 2. السعر
- `stock_exchange.buy_price` = سعر الكيلو
- `waste_data_admin.price` = سعر الوحدة
- الحساب: `unitPrice = buyPrice * (weight / 1000)`

### 3. المزامنة التلقائية
- عند تحديث السعر في البورصة، يتم تحديث جميع المنتجات المرتبطة تلقائياً
- لا حاجة لتحديث يدوي

### 4. التوافق مع النظام القديم
- المنتجات القديمة التي لا تحتوي على `catalog_waste_id` ستستخدم السعر من `waste_data_admin.price` مباشرة
- يُفضل ربط جميع المنتجات مع `catalog_waste_materials`

---

## ✅ Checklist للتنفيذ

- [ ] تحديث API calls للفئات الرئيسية
- [ ] تحديث API calls للفئات الفرعية
- [ ] تحديث API calls للمنتجات
- [ ] إضافة جلب سعر البورصة
- [ ] تحديث نماذج البيانات (Models)
- [ ] تحديث واجهة المستخدم (UI)
- [ ] اختبار التدفق الكامل
- [ ] اختبار الحسابات (الأسعار والأوزان)
- [ ] اختبار إضافة المنتجات للسلة
- [ ] تحديث التوثيق الداخلي

---

## 📞 الدعم

في حالة وجود أي استفسارات أو مشاكل، يرجى التواصل مع فريق التطوير.

---

**آخر تحديث:** 2024-01-15

