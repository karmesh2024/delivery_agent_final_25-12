# إضافة catalog_waste_id إلى waste_data_admin

## الملف
`20260201_add_catalog_waste_id_to_waste_data_admin.sql`

## الغرض
- ربط كل منتج في `waste_data_admin` بسجل في كتالوج المخلفات `catalog_waste_materials` عبر عمود `catalog_waste_id`.
- إدارة المخازن والبورصة يمكنها الاعتماد على هذا الربط.

## التشغيل
1. افتح **Supabase Dashboard** → **SQL Editor**.
2. انسخ محتوى الملف والصقّه ثم نفّذ (Run).
3. أو عبر CLI: `supabase db push` (إن كنت تستخدم Supabase CLI).

## بعد التشغيل
- المزامنة التلقائية من `productService` (عند إضافة/تعديل منتج) ستُحدّث `catalog_waste_id` تلقائياً.
- للمنتجات **القديمة** التي ليس لها `catalog_waste_id`: شغّل المزامنة الأولية بإحدى الطرق التالية.

### طريقة 1: من المتصفح (بعد تسجيل الدخول)
1. افتح التطبيق (مثلاً `http://localhost:3000`).
2. سجّل الدخول كمسؤول.
3. افتح **Developer Tools** (F12) → تبويب **Console**.
4. نفّذ:
   ```javascript
   fetch('/api/admin/sync-catalog', { method: 'POST' })
     .then(r => r.json())
     .then(d => console.log(d.message || d));
   ```
   أو لرؤية النتيجة كاملة:
   ```javascript
   fetch('/api/admin/sync-catalog', { method: 'POST' })
     .then(r => r.json())
     .then(d => console.log('مُزامَن:', d.synced, 'فشل:', d.failed, 'مُتخطّى:', d.skipped, d));
   ```

### طريقة 2: من سطر الأوامر (curl)
```bash
curl -X POST http://localhost:3000/api/admin/sync-catalog
```
(يجب أن يكون التطبيق يعمل وأن ترفق Cookie الجلسة إن كان الـ API يتطلب تسجيل دخول.)

### طريقة 3: من الكود (TypeScript)
```ts
import { wasteCatalogSyncService } from '@/services/wasteCatalogSyncService';
const { synced, failed, skipped } = await wasteCatalogSyncService.syncAllProducts();
console.log(`مُزامَن: ${synced}, فشل: ${failed}, مُتخطّى: ${skipped}`);
```
