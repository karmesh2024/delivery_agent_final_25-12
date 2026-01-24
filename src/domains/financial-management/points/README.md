# نظام إدارة النقاط - Points Management System

## نظرة عامة

تم إنشاء نظام شامل لإدارة النقاط في قسم الإدارة المالية. يتضمن النظام:

1. **إعدادات النقاط**: إدارة إعدادات النقاط لكل فئة فرعية
2. **تسعير النقاط**: تحديد وتحديث القيمة المالية للنقاط
3. **معاملات النقاط**: تتبع جميع معاملات النقاط
4. **تقارير النقاط**: تحليلات وإحصائيات شاملة

## البنية

```
src/domains/financial-management/points/
├── types.ts                          # Types و Interfaces
├── services/
│   ├── pointsService.ts              # خدمة إعدادات النقاط
│   ├── pointsTransactionsService.ts  # خدمة معاملات النقاط
│   ├── pointsPricingService.ts       # خدمة تسعير النقاط
│   └── pointsReportsService.ts       # خدمة التقارير
├── store/
│   └── pointsSlice.ts                # Redux slice
└── pages/
    ├── PointsSettingsPage.tsx        # صفحة الإعدادات
    ├── PointsPricingPage.tsx         # صفحة التسعير
    ├── PointsTransactionsPage.tsx    # صفحة المعاملات
    └── PointsReportsPage.tsx         # صفحة التقارير
```

## الجداول في قاعدة البيانات

### points_configurations (موجود)
- إعدادات النقاط لكل فئة فرعية
- يحتوي على: `points_per_kg`, `price_per_kg`, `point_value`, `min_weight`, `max_weight`, `bonus_multiplier`

### points_transactions (تم إنشاؤه)
- سجل جميع معاملات النقاط
- يحتوي على: `profile_id`, `transaction_type`, `points`, `points_value`, `balance_before`, `balance_after`

### points_value_history (تم إنشاؤه)
- سجل تغييرات قيمة النقاط
- يحتوي على: `points_configuration_id`, `old_value`, `new_value`, `change_reason`

## الصفحات والمسارات

- `/financial-management/points` - الصفحة الرئيسية
- `/financial-management/points/settings` - إعدادات النقاط
- `/financial-management/points/pricing` - تسعير النقاط
- `/financial-management/points/transactions` - معاملات النقاط
- `/financial-management/points/reports` - تقارير النقاط

## الميزات

### إعدادات النقاط
- إضافة/تعديل/حذف إعدادات النقاط
- تحديد النقاط لكل كيلوجرام
- تحديد السعر لكل كيلوجرام
- تحديد قيمة النقطة المالية
- تحديد نطاق الوزن (الحد الأدنى والأقصى)
- تحديد مضاعف المكافأة

### تسعير النقاط
- عرض جميع إعدادات النقاط مع قيمها
- تحديث قيمة النقطة لكل فئة فرعية
- عرض سجل تغييرات القيمة
- حساب القيمة المالية للنقاط

### معاملات النقاط
- عرض جميع معاملات النقاط
- فلترة حسب نوع المعاملة
- فلترة حسب التاريخ
- فلترة حسب العميل
- تصدير البيانات

### تقارير النقاط
- ملخص شامل للنقاط
- إحصائيات النقاط الممنوحة والمستخدمة
- القيمة المالية الإجمالية
- أفضل العملاء من حيث النقاط
- تقارير لفترات زمنية محددة

## الاستخدام

### إضافة إعدادات نقاط جديدة

```typescript
import { useAppDispatch } from '@/store';
import { createPointsConfiguration } from '@/domains/financial-management/points/store/pointsSlice';

const dispatch = useAppDispatch();
await dispatch(createPointsConfiguration({
  subcategory_id: 'uuid',
  points_per_kg: 10,
  price_per_kg: 5.5,
  point_value: 0.05,
  is_active: true,
}));
```

### تحديث قيمة النقطة

```typescript
import { pointsPricingService } from '@/domains/financial-management/points/services/pointsPricingService';

await pointsPricingService.updatePointValue(
  'configuration-id',
  0.06, // القيمة الجديدة
  'تحديث بناءً على السوق'
);
```

## ملاحظات

- جميع القيم المالية بالجنيه المصري (EGP)
- النقاط تُحسب تلقائياً بناءً على الوزن وإعدادات الفئة الفرعية
- يتم تسجيل جميع التغييرات في سجل التاريخ
- النظام متكامل مع نظام الملفات الشخصية (`new_profiles`)
