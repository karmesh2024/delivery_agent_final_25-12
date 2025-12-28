# 🚀 دليل البدء السريع - إعداد نظام البراندز مع الصور

## الخطوات السريعة:

### 1. إنشاء ملف .env
```bash
# في المجلد الجذر، أنشئ ملف .env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 2. إصلاح السياسات الأمنية للـ Storage
```bash
npm run fix:storage-policies
```

### 3. إنشاء جدول البراندز
```bash
npm run create:brands
```

### 4. التحقق من النجاح
ستظهر رسائل:
```
✅ Storage policies fixed successfully!
✅ warehouse_product_brands table created successfully!
```

## 🔧 إذا لم تعمل الطريقة الأولى:

### إعداد Storage يدوياً:
1. اذهب إلى Supabase Dashboard
2. اختر مشروعك
3. اذهب إلى Storage
4. أنشئ bucket جديد باسم "brand-logos"
5. اجعله public
6. اذهب إلى SQL Editor
7. انسخ والصق محتوى ملف `create_storage_bucket.sql`
8. اضغط Run

### إنشاء جدول البراندز يدوياً:
1. اذهب إلى SQL Editor
2. انسخ والصق محتوى ملف `create_brands_table.sql`
3. اضغط Run

## 📋 ما سيتم إنشاؤه:

### Storage Bucket:
- اسم: `brand-logos`
- نوع: Public
- السياسات: قراءة عامة، كتابة للمستخدمين المصادقين

### جدول البراندز:
- `id` (Primary Key)
- `name` (Unique)
- `logo_url` (رابط الصورة)
- `logo_path` (مسار الملف في Storage)
- `description`
- `created_at`

### بيانات أولية:
- 10 براندز شائعة باللغة العربية

## ✅ بعد النجاح:
- يمكن رفع صور البراندز إلى Supabase Storage
- الروابط تُحفظ في قاعدة البيانات
- جميع وظائف إضافة البراندز تعمل بشكل طبيعي!
