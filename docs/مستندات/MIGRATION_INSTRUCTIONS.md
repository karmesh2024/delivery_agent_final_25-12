# تعليمات تطبيق Migration: إضافة حقول التوقيت

## المشكلة المحتملة:
إذا لم يتم تطبيق Migration، قد تكون المشكلة في:
1. **الصلاحيات**: تأكد من أن لديك صلاحيات `ALTER TABLE`
2. **الجدول قيد الاستخدام**: قد يكون هناك قفل على الجدول
3. **مشكلة في الاتصال**: timeout أو مشكلة في الشبكة

## الحلول:

### الحل 1: تطبيق خطوة بخطوة في Supabase Dashboard

1. افتح [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك `remony`
3. اذهب إلى **SQL Editor**
4. **قم بتطبيق كل خطوة على حدة:**

#### الخطوة 1: إضافة الأعمدة (واحد تلو الآخر)
```sql
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS pending_at TIMESTAMPTZ;
```
اضغط **Run** وتحقق من النجاح، ثم:
```sql
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS collecting_at TIMESTAMPTZ;
```
... وهكذا لكل عمود

#### الخطوة 2: تحديث البيانات الموجودة
```sql
UPDATE public.store_orders
SET pending_at = created_at
WHERE fulfillment_status = 'pending' AND pending_at IS NULL;
```

#### الخطوة 3: إنشاء Trigger Function
```sql
CREATE OR REPLACE FUNCTION set_pending_at_on_order_create()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pending_at IS NULL THEN
    NEW.pending_at = NEW.created_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### الخطوة 4: إنشاء Trigger
```sql
DROP TRIGGER IF EXISTS trigger_set_pending_at_on_order_create ON public.store_orders;
CREATE TRIGGER trigger_set_pending_at_on_order_create
  BEFORE INSERT ON public.store_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_pending_at_on_order_create();
```

### الحل 2: التحقق من الصلاحيات

قم بتشغيل هذا الاستعلام للتحقق من الصلاحيات:
```sql
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'store_orders';
```

### الحل 3: استخدام Prisma Migrate (إن كان متاحاً)

إذا كان لديك Prisma CLI مثبت:
```bash
npx prisma migrate dev --name add_fulfillment_timestamps
```

ثم انسخ محتوى الملف `src/migrations/add_fulfillment_timestamps_to_store_orders.sql` إلى migration الجديد.

### الحل 4: التحقق من وجود الأعمدة

بعد التطبيق، تحقق من وجود الأعمدة:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'store_orders' 
  AND column_name IN ('pending_at', 'collecting_at', 'verifying_at', 'packaging_at', 'ready_at', 'completed_at');
```

يجب أن ترى 6 أعمدة في النتيجة.

## ملاحظات مهمة:

1. **لا تقم بتطبيق Migration مرتين**: استخدم `IF NOT EXISTS` لتجنب الأخطاء
2. **احفظ نسخة احتياطية**: قبل التطبيق، احفظ بياناتك
3. **اختبر في بيئة التطوير أولاً**: إذا كان لديك بيئة تطوير منفصلة

## في حالة الفشل:

إذا استمرت المشكلة، قد تحتاج إلى:
1. التحقق من سجلات الأخطاء في Supabase Dashboard
2. الاتصال بدعم Supabase
3. استخدام Supabase CLI بدلاً من Dashboard

