# تطبيق Migration للمنتجات المميزة

## المشكلة
عند محاولة تشغيل `prisma migrate dev`، يحدث خطأ بسبب مشكلة في shadow database مع migrations سابقة.

## الحلول المتاحة

### الحل 1: تطبيق SQL مباشرة (موصى به)

قم بتشغيل SQL التالي مباشرة على قاعدة البيانات Supabase:

```sql
-- التحقق من وجود العمود أولاً
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'waste_data_admin' 
    AND column_name = 'is_onboarding_featured'
  ) THEN
    ALTER TABLE "public"."waste_data_admin" 
    ADD COLUMN "is_onboarding_featured" BOOLEAN NOT NULL DEFAULT false;
    
    RAISE NOTICE 'Column is_onboarding_featured added successfully';
  ELSE
    RAISE NOTICE 'Column is_onboarding_featured already exists';
  END IF;
END $$;
```

**كيفية التطبيق:**
1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. الصق الكود أعلاه
4. اضغط Run

### الحل 2: استخدام Prisma Studio

1. شغل `npx prisma studio`
2. افتح جدول `waste_data_admin`
3. ستجد أن العمود موجود بالفعل (إذا تم تطبيقه)

### الحل 3: استخدام Supabase CLI

إذا كان لديك Supabase CLI مثبت:

```bash
supabase db push
```

أو تطبيق migration مباشرة:

```bash
supabase migration up
```

## التحقق من التطبيق

بعد تطبيق Migration، تحقق من:

1. **في قاعدة البيانات:**
   ```sql
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'waste_data_admin' 
   AND column_name = 'is_onboarding_featured';
   ```

2. **في التطبيق:**
   - افتح صفحة إدارة المنتجات
   - يجب أن ترى عمود "إظهار في الاقتراحات الذكية" في الجدول
   - جرب تفعيل/إلغاء التفعيل لأحد المنتجات

## ملاحظات

- Migration file موجود في: `prisma/migrations/20260124_add_is_onboarding_featured/migration.sql`
- SQL file جاهز في: `supabase/migrations/add_is_onboarding_featured.sql`
- بعد تطبيق Migration، يمكنك استخدام الميزة مباشرة في لوحة التحكم
