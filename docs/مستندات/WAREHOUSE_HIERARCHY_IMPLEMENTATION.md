# 🏗️ تطوير الهيكل الهرمي للمخازن

## 📋 نظرة عامة

تم تطوير نظام هيكل هرمي متكامل للمخازن يدعم ثلاثة مستويات:
- **المستوى الأول**: المخزن الأم على مستوى الدولة
- **المستوى الثاني**: مخازن المدن
- **المستوى الثالث**: مخازن المناطق

## 🎯 الأهداف المحققة

### ✅ قاعدة البيانات
- [x] تحديث جدول `warehouses` لدعم الهيكل الهرمي
- [x] إضافة جدول `warehouse_sectors` لربط المخازن بالقطاعات
- [x] إنشاء جداول مساعدة للمخازن الرئيسية والمدن والمناطق
- [x] إضافة دوال SQL للاستعلامات الهرمية
- [x] تطبيق سياسات الأمان (RLS)

### ✅ الخدمات (Services)
- [x] تحديث `warehouseService` لدعم الهيكل الهرمي
- [x] إضافة دوال جديدة لإدارة القطاعات
- [x] دعم إنشاء المخازن الهرمية
- [x] دوال للاستعلامات المتقدمة

### ✅ واجهة المستخدم
- [x] مكون `WarehouseHierarchyTree` لعرض الشجرة الهرمية
- [x] مكون `WarehouseSectorsManager` لإدارة القطاعات
- [x] صفحة `hierarchy` لإدارة الهيكل الهرمي
- [x] تحديث صفحة إدارة المخازن الرئيسية

## 🗂️ الملفات المضافة/المحدثة

### ملفات قاعدة البيانات
```
warehouse_hierarchy_schema.sql - مخطط قاعدة البيانات الجديد
```

### ملفات الخدمات
```
src/domains/warehouse-management/services/warehouseService.ts - محدث
```

### مكونات واجهة المستخدم
```
src/domains/warehouse-management/components/WarehouseHierarchyTree.tsx - جديد
src/domains/warehouse-management/components/WarehouseSectorsManager.tsx - جديد
```

### صفحات التطبيق
```
src/app/warehouse-management/hierarchy/page.tsx - جديد
src/app/warehouse-management/page.tsx - محدث
```

## 🚀 كيفية الاستخدام

### 1. تطبيق التحديثات على قاعدة البيانات
```sql
-- تشغيل ملف warehouse_hierarchy_schema.sql
\i warehouse_hierarchy_schema.sql
```

### 2. الوصول للهيكل الهرمي
- انتقل إلى `/warehouse-management/hierarchy`
- أو من الصفحة الرئيسية لإدارة المخازن، اضغط على "إدارة الهيكل الهرمي"

### 3. إنشاء مخزن جديد
1. في تبويب "شجرة المخازن"
2. اضغط على "إضافة مخزن رئيسي" لإنشاء مخزن على مستوى الدولة
3. أو اختر مخزن موجود واضغط على "+" لإضافة مخزن فرعي

### 4. إدارة القطاعات
1. اختر مخزن من الشجرة
2. انتقل إلى تبويب "إدارة القطاعات"
3. أضف أو عدّل القطاعات المرتبطة بالمخزن

## 🏗️ الهيكل التقني

### قاعدة البيانات
```sql
-- الجداول الرئيسية
warehouses (محدث)
├── parent_warehouse_id
├── warehouse_level
├── hierarchy_path
└── is_main_warehouse

warehouse_sectors (جديد)
├── warehouse_id
├── sector_code
├── is_primary
└── capacity_percentage

main_warehouses (جديد)
city_warehouses (جديد)
district_warehouses (جديد)
```

### الخدمات
```typescript
// دوال جديدة
getWarehouseTree()
getChildWarehouses()
getWarehouseWithHierarchy()
getSectors()
addWarehouseSector()
removeWarehouseSector()
createHierarchicalWarehouse()
```

### المكونات
```typescript
// مكونات جديدة
WarehouseHierarchyTree
├── عرض الشجرة الهرمية
├── إدارة التوسيع/الطي
└── إجراءات المخازن

WarehouseSectorsManager
├── إدارة القطاعات
├── ربط/فصل القطاعات
└── إعدادات السعة
```

## 📊 المميزات

### 🎯 إدارة هرمية متقدمة
- شجرة مخازن تفاعلية
- دعم ثلاثة مستويات (دولة - مدينة - منطقة)
- مسار هرمي تلقائي

### 🔗 ربط بالقطاعات
- ربط المخازن بالقطاعات المختلفة
- تحديد القطاع الأساسي
- إدارة نسبة السعة لكل قطاع

### 🛡️ أمان متقدم
- سياسات RLS للجداول الجديدة
- حماية البيانات الحساسة
- تحكم في الوصول

### 📱 واجهة مستخدم متطورة
- شجرة تفاعلية قابلة للتوسيع
- إدارة سهلة للقطاعات
- تصميم متجاوب

## 🔄 الخطوات التالية

### المرحلة القادمة
- [ ] تطبيق التحديثات على قاعدة البيانات
- [ ] اختبار الوظائف الجديدة
- [ ] ربط مع نظام المخزون الحالي
- [ ] إضافة تقارير هرمية

### التحسينات المقترحة
- [ ] إضافة إحصائيات هرمية
- [ ] دعم النقل بين المخازن الهرمية
- [ ] تقارير متقدمة للهيكل الهرمي
- [ ] إشعارات للتحكم الهرمي

## 🐛 استكشاف الأخطاء

### مشاكل محتملة
1. **خطأ في ربط القطاعات**: تأكد من وجود القطاعات في جدول `waste_sectors`
2. **مشكلة في الشجرة**: تحقق من صحة `hierarchy_path`
3. **خطأ في الصلاحيات**: تأكد من تطبيق سياسات RLS

### حلول سريعة
```sql
-- إعادة تعيين مسار هرمي
UPDATE warehouses SET hierarchy_path = id::text WHERE parent_warehouse_id IS NULL;

-- فحص القطاعات
SELECT * FROM waste_sectors;

-- فحص الصلاحيات
SELECT * FROM pg_policies WHERE tablename = 'warehouses';
```

## 📞 الدعم

للحصول على المساعدة:
1. راجع ملف `warehouse_hierarchy_schema.sql` للتفاصيل التقنية
2. تحقق من ملفات الخدمات في `src/domains/warehouse-management/services/`
3. راجع مكونات واجهة المستخدم في `src/domains/warehouse-management/components/`

---

**تاريخ التطوير**: 2025-01-18  
**المطور**: AI Assistant  
**الإصدار**: 1.0.0






