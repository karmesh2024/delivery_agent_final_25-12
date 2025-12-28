# الملفات القديمة التي يمكن حذفها

بعد إتمام عملية تحويل المشروع إلى هيكلية DDD، ويمكن حذف الملفات التالية بأمان حيث تم نقل وظائفها بالكامل إلى الهيكل الجديد:

## مكونات المندوبين

- `src/components/agents/agent-card.tsx` => تم تحويلها إلى `src/domains/agents/components/AgentCard.tsx`
- `src/components/agents/agent-detail.tsx` => تم تحويلها إلى `src/domains/agents/components/AgentDetail.tsx`
- `src/components/agents/agent-grid-view.tsx` => تم تحويلها إلى `src/domains/agents/components/AgentGridView.tsx`
- `src/components/agents/agent-status-filter.tsx` => تم تحويلها إلى `src/domains/agents/components/AgentStatusFilter.tsx`

## مكونات لوحة القيادة

- `src/components/dashboard/filter-tabs.tsx` => تم تحويلها إلى `src/shared/components/filters/FilterTabs.tsx`
- `src/components/dashboard/stat-card.tsx` => تم تحويلها إلى `src/shared/components/dashboard/StatCard.tsx`

## مكونات الخرائط

- `src/components/map/agent-map-alternate.tsx` => تم تحويلها إلى `src/domains/mapping/components/AgentMapAlternate.tsx`
- `src/components/map/map-view-alternate.tsx` => تم تحويلها إلى `src/domains/mapping/components/MapViewAlternate.tsx`
- `src/components/map/google-maps-component.tsx` => تم تحويلها إلى `src/domains/mapping/components/GoogleMapsComponent.tsx`

## مكونات الطلبات

- `src/components/orders/order-detail.tsx` => تم تحويلها إلى `src/domains/orders/components/OrderDetail.tsx`
- `src/components/orders/orders-grid-view.tsx` => تم تحويلها إلى `src/domains/orders/components/OrdersGridView.tsx`

## مكونات التخطيط

> ملاحظة: مكونات التخطيط موجودة الآن في المسار الجديد، لكن قد تكون هناك بعض الصفحات التي ما زالت تستخدم الملفات القديمة، لذا يجب التأكد من أن جميع الصفحات تستخدم المسارات الجديدة قبل حذف هذه الملفات.

- `src/components/layout/dashboard-layout.tsx` => تم تحويلها إلى `src/shared/layouts/DashboardLayout.tsx`
- `src/components/layout/header.tsx` => تم تحويلها إلى `src/shared/layouts/Header.tsx`
- `src/components/layout/sidebar.tsx` => تم تحويلها إلى `src/shared/layouts/Sidebar.tsx`

## ملاحظات هامة

1. قبل حذف أي ملف، يجب التأكد من:
   - تشغيل واختبار الصفحات ذات الصلة بهذه المكونات للتأكد من عملها بشكل صحيح
   - التأكد من عدم وجود أي استخدامات متبقية للملفات القديمة في أجزاء أخرى من التطبيق
   - مراجعة `import` في جميع الملفات للتأكد من أنها تستخدم المسارات الجديدة

2. في حالة وجود أي استخدامات متبقية للملفات القديمة، يجب تحويلها لاستخدام الملفات الجديدة قبل الحذف.

3. بعد حذف الملفات، يجب إعادة تشغيل التطبيق والتأكد من عدم وجود أخطاء.

## صفحات Next.js المتبقية للتحويل

تم تحويل معظم صفحات Next.js لاستخدام منهجية DDD، لكن يجب التأكد من تحويل الصفحات المتبقية التالية (إن وجدت):

- `src/app/trips/page.tsx` - يحتاج إلى استكمال التحويل الكامل بنطاق DDD

## التحقق من الدقة

بعد الانتهاء من تحويل جميع الصفحات والتأكد من عملها بشكل صحيح، يمكن تنفيذ أمر لتحديد الاستيرادات التي لم يتم استخدامها لضمان عدم وجود أي استخدام للملفات القديمة:

```bash
npx next-unused
```

(ستحتاج إلى إعداد الأداة أولاً وتحديد الملفات التي تريد فحصها)