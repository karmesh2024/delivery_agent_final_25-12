# 🚀 دليل تطبيق النظام الهرمي للمخازن - خطوة بخطوة

## 📋 الملفات المُقسمة للتطبيق السهل

تم تقسيم النظام الهرمي إلى 6 أجزاء لتسهيل التطبيق:

### 1️⃣ **الجزء الأول: الجداول الأساسية**
📁 `warehouse_hierarchy_part1_tables.sql`
- جدول المستويات الهرمية (`warehouse_levels`)
- إدراج المستويات الأساسية

### 2️⃣ **الجزء الثاني: جداول الصلاحيات**
📁 `warehouse_hierarchy_part2_permissions.sql`
- جدول الصلاحيات (`warehouse_permissions`)
- جدول الهيكل الهرمي (`warehouse_hierarchy`)
- جدول التفويض (`permission_delegations`)

### 3️⃣ **الجزء الثالث: الفهارس والتحديثات**
📁 `warehouse_hierarchy_part3_indexes.sql`
- تحديث جدول المخازن
- إنشاء الفهارس للأداء

### 4️⃣ **الجزء الرابع: الدوال المساعدة**
📁 `warehouse_hierarchy_part4_functions.sql`
- دالة تحديث المسار الهرمي
- دالة جلب المخازن التابعة

### 5️⃣ **الجزء الخامس: دوال الصلاحيات**
📁 `warehouse_hierarchy_part5_security.sql`
- دالة التحقق من الصلاحيات
- دالة إنشاء مخزن مع الصلاحيات

### 6️⃣ **الجزء السادس: الأمان والبيانات**
📁 `warehouse_hierarchy_part6_data.sql`
- سياسات الأمان (RLS)
- البيانات التجريبية

## 🛠️ طرق التطبيق

### الطريقة الأولى: Supabase Dashboard (الأسهل)

1. **انتقل إلى Supabase Dashboard:**
   - اذهب إلى [supabase.com/dashboard](https://supabase.com/dashboard)
   - اختر مشروعك

2. **افتح SQL Editor:**
   - اضغط على "SQL Editor" في القائمة الجانبية

3. **طبق الأجزاء بالترتيب:**
   ```
   الجزء 1 → الجزء 2 → الجزء 3 → الجزء 4 → الجزء 5 → الجزء 6
   ```

4. **لكل جزء:**
   - انسخ محتوى الملف
   - الصق في SQL Editor
   - اضغط "Run"

### الطريقة الثانية: استخدام الملف الكامل

إذا كنت تفضل استخدام الملف الكامل:

1. **استخدم ملف `warehouse_hierarchy_system.sql`**
2. **انسخ المحتوى كاملاً**
3. **طبق في Supabase Dashboard**

### الطريقة الثالثة: Supabase CLI

```bash
# تثبيت Supabase CLI
npm install -g supabase

# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref your-project-ref

# تطبيق الملفات
supabase db push
```

## ⚠️ ملاحظات مهمة

### قبل التطبيق:
1. **تأكد من وجود جدول `warehouses`** في قاعدة البيانات
2. **تأكد من وجود جدول `auth.users`** (متوفر افتراضياً في Supabase)
3. **احتفظ بنسخة احتياطية** من قاعدة البيانات

### أثناء التطبيق:
1. **طبق الأجزاء بالترتيب** المذكور أعلاه
2. **تأكد من نجاح كل جزء** قبل الانتقال للآخر
3. **راقب رسائل الخطأ** إذا ظهرت

### بعد التطبيق:
1. **تحقق من الجداول الجديدة:**
   ```sql
   SELECT * FROM warehouse_levels;
   SELECT * FROM warehouse_hierarchy;
   SELECT * FROM warehouse_permissions;
   ```

2. **اختبر الدوال:**
   ```sql
   SELECT * FROM get_sub_warehouses('warehouse-id-here');
   SELECT check_warehouse_permission('warehouse-id-here', 'view_reports');
   ```

## 🔍 استكشاف الأخطاء

### خطأ في المفاتيح الخارجية:
```sql
-- تحقق من وجود جدول warehouses
SELECT * FROM warehouses LIMIT 1;
```

### خطأ في الصلاحيات:
```sql
-- تحقق من سياسات RLS
SELECT * FROM warehouse_hierarchy LIMIT 1;
```

### خطأ في الدوال:
```sql
-- تحقق من الدوال المُنشأة
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%warehouse%';
```

## ✅ التحقق من نجاح التطبيق

بعد تطبيق جميع الأجزاء، يجب أن تجد:

### الجداول الجديدة:
- ✅ `warehouse_levels` (4 مستويات)
- ✅ `warehouse_hierarchy` (فارغ في البداية)
- ✅ `warehouse_permissions` (فارغ في البداية)
- ✅ `permission_delegations` (فارغ في البداية)

### الدوال الجديدة:
- ✅ `update_warehouse_hierarchy_path()`
- ✅ `get_sub_warehouses()`
- ✅ `check_warehouse_permission()`
- ✅ `create_warehouse_with_hierarchy()`

### البيانات التجريبية:
- ✅ 4 مستويات هرمية
- ✅ 4 مخازن تجريبية
- ✅ صلاحيات افتراضية

## 🎉 بعد التطبيق الناجح

1. **اختبر النظام الهرمي:**
   - انتقل إلى `/warehouse-management/hierarchy`
   - تأكد من ظهور البيانات

2. **اختبر إنشاء مخزن جديد:**
   - اضغط "إضافة مخزن جديد"
   - اختر مستوى واملأ البيانات

3. **اختبر الصلاحيات:**
   - انتقل إلى تبويب "الصلاحيات"
   - تأكد من ظهور الصلاحيات

---

**💡 نصيحة:** ابدأ بالجزء الأول وتأكد من نجاحه قبل الانتقال للآخر!
