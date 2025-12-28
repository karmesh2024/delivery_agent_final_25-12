# دليل تطبيق النظام الهرمي المرن 🚀

## نظرة عامة

هذا الدليل يوضح كيفية تطبيق النظام الهرمي المرن الجديد في مشروع إدارة المخازن.

## الملفات المُنشأة

### 1. قاعدة البيانات
- `flexible_hierarchical_categories_schema.sql` - مخطط قاعدة البيانات الجديد
- `create_exec_sql_function.sql` - دالة مساعدة لتطبيق الأوامر

### 2. الخدمات
- `src/domains/warehouse-management/services/flexibleCategoryService.ts` - خدمة إدارة الفئات المرنة

### 3. واجهة المستخدم
- `src/app/warehouse-management/admin-settings/flexible-categories/page.tsx` - صفحة إدارة الفئات المرنة

### 4. سكريبت التطبيق
- `apply_flexible_categories_system.js` - سكريبت تطبيق النظام

## خطوات التطبيق

### الخطوة 1: تطبيق دالة exec_sql

```bash
# تطبيق دالة exec_sql في Supabase
psql -h your-supabase-host -U postgres -d postgres -f create_exec_sql_function.sql
```

أو من خلال Supabase Dashboard:
1. انتقل إلى SQL Editor
2. انسخ محتوى `create_exec_sql_function.sql`
3. اضغط "Run"

### الخطوة 2: تطبيق النظام الجديد

```bash
# تثبيت التبعيات
npm install @supabase/supabase-js

# تعيين متغيرات البيئة
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# تشغيل سكريبت التطبيق
node apply_flexible_categories_system.js
```

### الخطوة 3: اختبار النظام

1. انتقل إلى `/warehouse-management/admin-settings/flexible-categories`
2. تأكد من ظهور واجهة إدارة الفئات المرنة
3. جرب إنشاء فئة جديدة
4. اختبر إنشاء فئة فرعية تحت فئة أخرى

## الميزات الجديدة

### 1. تداخل غير محدود
```
المنتجات
├── المنظفات
│   ├── منظفات الملابس
│   │   ├── منظفات الملابس البيضاء
│   │   ├── منظفات الملابس الملونة
│   │   └── منظفات الملابس الحساسة
│   ├── منظفات الأطباق
│   │   ├── منظفات الأطباق اليدوية
│   │   └── منظفات الأطباق الآلية
│   └── منظفات الأرضيات
│       ├── منظفات الأرضيات الخشبية
│       └── منظفات الأرضيات الرخامية
```

### 2. أنواع متعددة للفئات
- **منتجات** (product): فئات المنتجات
- **مخلفات** (waste): فئات المخلفات  
- **خدمات** (service): فئات الخدمات
- **أخرى** (other): فئات متنوعة

### 3. نظام مسارات ذكي
- **path**: مسار الفئة الكامل (مثل: "1/2/3")
- **level**: مستوى الفئة في الهرم (0 للجذر)
- **تحديث تلقائي**: عند تغيير الفئة الأب

## استخدام النظام

### إنشاء فئة جديدة

```typescript
import { flexibleCategoryService } from '@/domains/warehouse-management/services/flexibleCategoryService';

// إنشاء فئة جذرية
const category = await flexibleCategoryService.createCategory({
  name: 'المنتجات',
  description: 'جميع المنتجات',
  sector_id: 'sector-id',
  category_type: 'product'
});

// إنشاء فئة فرعية
const subCategory = await flexibleCategoryService.createCategory({
  name: 'المنظفات',
  parent_id: category.id,
  sector_id: 'sector-id',
  category_type: 'product'
});
```

### جلب الفئات

```typescript
// جلب جميع الفئات
const categories = await flexibleCategoryService.getAllCategories();

// جلب الفئات حسب النوع
const productCategories = await flexibleCategoryService.getCategoriesByType('product');

// جلب شجرة الفئات الكاملة
const tree = await flexibleCategoryService.getCategoryTree();

// البحث في الفئات
const searchResults = await flexibleCategoryService.searchCategories('منظفات');
```

### تحديث الفئات

```typescript
// تحديث فئة
await flexibleCategoryService.updateCategory(categoryId, {
  name: 'اسم جديد',
  description: 'وصف جديد'
});

// نقل فئة إلى فئة أب جديدة
await flexibleCategoryService.moveCategory(categoryId, newParentId);

// حذف فئة (soft delete)
await flexibleCategoryService.deleteCategory(categoryId);
```

## ربط الفئات بالمنتجات

```typescript
// ربط فئة بمنتج
await flexibleCategoryService.linkCategoryToProduct(
  categoryId, 
  productId, 
  true // isPrimary
);

// ربط فئة بمخلفة
await flexibleCategoryService.linkCategoryToWaste(
  categoryId, 
  wasteId, 
  true // isPrimary
);
```

## دوال قاعدة البيانات

### جلب شجرة الفئات
```sql
SELECT * FROM get_category_tree();
SELECT * FROM get_category_tree('root-category-id');
```

### جلب الفئات حسب النوع
```sql
SELECT * FROM get_categories_by_type('product');
```

### جلب الفئات الشائعة
```sql
SELECT * FROM get_popular_categories(10);
```

### جلب عدد الفئات الفرعية
```sql
SELECT get_category_children_count('category-id');
```

## استكشاف الأخطاء

### مشاكل شائعة

1. **خطأ في تطبيق SQL**
   - تأكد من تطبيق دالة `exec_sql` أولاً
   - تحقق من صلاحيات المستخدم

2. **خطأ في جلب البيانات**
   - تأكد من تطبيق الجداول الجديدة
   - تحقق من متغيرات البيئة

3. **خطأ في الواجهة**
   - تأكد من تثبيت التبعيات
   - تحقق من مسارات الملفات

### سجلات الأخطاء

```bash
# عرض سجلات التطبيق
node apply_flexible_categories_system.js 2>&1 | tee application.log

# عرض سجلات Supabase
# انتقل إلى Supabase Dashboard > Logs
```

## الصيانة والتطوير

### إضافة نوع فئة جديد

1. تحديث enum في قاعدة البيانات:
```sql
ALTER TABLE flexible_categories 
DROP CONSTRAINT flexible_categories_category_type_check;

ALTER TABLE flexible_categories 
ADD CONSTRAINT flexible_categories_category_type_check 
CHECK (category_type IN ('product', 'waste', 'service', 'other', 'new_type'));
```

2. تحديث TypeScript types:
```typescript
type CategoryType = 'product' | 'waste' | 'service' | 'other' | 'new_type';
```

### إضافة حقل جديد

1. تحديث الجدول:
```sql
ALTER TABLE flexible_categories 
ADD COLUMN new_field VARCHAR(100);
```

2. تحديث الواجهة:
```typescript
interface FlexibleCategory {
  // ... existing fields
  new_field?: string;
}
```

## الدعم والمساعدة

### الملفات المرجعية
- `FLEXIBLE_HIERARCHICAL_SYSTEM_REPORT.md` - تقرير شامل عن النظام
- `flexible_hierarchical_categories_schema.sql` - مخطط قاعدة البيانات
- `src/domains/warehouse-management/services/flexibleCategoryService.ts` - الخدمات

### الاختبار
- اختبر النظام مع بيانات تجريبية أولاً
- تأكد من عمل جميع الوظائف الأساسية
- اختبر الأداء مع كميات كبيرة من البيانات

## النتيجة النهائية

بعد تطبيق هذا النظام، ستحصل على:

✅ **نظام هرمي مرن** - تداخل غير محدود للفئات  
✅ **أنواع متعددة** - دعم المنتجات والمخلفات والخدمات  
✅ **واجهة متقدمة** - شجرة تفاعلية وبحث متقدم  
✅ **أداء عالي** - فهارس محسنة واستعلامات سريعة  
✅ **قابلية التوسع** - دعم أنواع فئات جديدة وربط مرن  

النظام جاهز للاستخدام ويمكن توسيعه بسهولة! 🚀


