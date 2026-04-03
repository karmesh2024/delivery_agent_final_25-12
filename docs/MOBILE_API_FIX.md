# إصلاح مشكلة API Query لتطبيق الموبايل

## المشكلة:
تطبيق الموبايل يحاول استخدام query غير صحيح:
```
GET /rest/v1/waste_data_admin?select=*,waste_sub_category:waste_sub_categories(...)&subcategory_id=eq.51
```

الخطأ: `300 Multiple Choices (PGRST201)` - اسم العلاقة غير صحيح.

## الحل:

### الاسم الصحيح للعلاقة:
في PostgREST/Supabase، اسم العلاقة يكون نفس اسم الجدول المرتبط به. بناءً على Prisma schema:
- الجدول: `waste_sub_categories`
- العلاقة في `waste_data_admin`: `waste_sub_categories` (وليس `waste_sub_category`)

### Query الصحيح:
```http
GET /rest/v1/waste_data_admin?select=*,waste_sub_categories(id,name,main_id,waste_main_categories(id,name))&subcategory_id=eq.51
```

### أمثلة Queries صحيحة:

#### 1. جلب المنتجات مع الفئة الفرعية فقط:
```http
GET /rest/v1/waste_data_admin?select=*,waste_sub_categories(id,name,main_id)&subcategory_id=eq.51
```

#### 2. جلب المنتجات مع الفئة الفرعية والفئة الأساسية:
```http
GET /rest/v1/waste_data_admin?select=*,waste_sub_categories(id,name,main_id,waste_main_categories(id,name))&subcategory_id=eq.51
```

#### 3. جلب منتج واحد مع العلاقات:
```http
GET /rest/v1/waste_data_admin?id=eq.{product_id}&select=*,waste_sub_categories(*,waste_main_categories(*))
```

### ملاحظات مهمة:
1. **اسم العلاقة**: يجب أن يكون `waste_sub_categories` (بـ s في النهاية) وليس `waste_sub_category`
2. **نوع subcategory_id**: يجب أن يكون `BigInt` (رقم) وليس `UUID`
3. **التحويل**: عند إرسال `subcategory_id` في query، يجب أن يكون رقم (مثل `51`) وليس string

### مثال كود Dart/Flutter:
```dart
final response = await supabase
  .from('waste_data_admin')
  .select('''
    *,
    waste_sub_categories(
      id,
      name,
      main_id,
      waste_main_categories(
        id,
        name
      )
    )
  ''')
  .eq('subcategory_id', 51); // رقم وليس string
```

### إذا كان تطبيق الموبايل يستخدم REST API مباشرة:
```dart
final url = Uri.parse(
  'https://your-project.supabase.co/rest/v1/waste_data_admin'
    '?select=*,waste_sub_categories(id,name,main_id,waste_main_categories(id,name))'
    '&subcategory_id=eq.51'
);
```

## التحقق من العلاقات:
يمكنك التحقق من العلاقات المتاحة في PostgREST باستخدام:
```http
GET /rest/v1/waste_data_admin?select=*
```

وستجد في الـ response العلاقات المتاحة.
