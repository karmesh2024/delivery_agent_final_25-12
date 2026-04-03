# حل مشكلة Migration Status

## الوضع الحالي
✅ العمود `is_onboarding_featured` موجود في قاعدة البيانات (تم تطبيقه يدوياً)
✅ العمود موجود في Prisma schema
❌ Prisma يعتقد أن migration لم تُطبق بعد

## الحل: تحديد Migration كأنها تم تطبيقها

بما أن التغيير تم تطبيقه يدوياً على قاعدة البيانات، نحتاج فقط أن نخبر Prisma أن migration تم تطبيقها.

### الطريقة 1: استخدام `prisma migrate resolve` (موصى به)

```bash
npx prisma migrate resolve --applied 20260124_add_is_onboarding_featured
```

هذا الأمر سيخبر Prisma أن migration `20260124_add_is_onboarding_featured` تم تطبيقها بالفعل.

### الطريقة 2: تجاهل المشكلة (إذا لم تكن بحاجة لـ migrations)

إذا كنت لا تستخدم Prisma migrations بشكل منتظم، يمكنك ببساطة:
1. تجاهل الخطأ
2. استخدام `prisma db pull` لمزامنة schema مع قاعدة البيانات عند الحاجة
3. استخدام `prisma db push` لتطبيق التغييرات مباشرة

### الطريقة 3: حذف migration folder (إذا لم تكن بحاجة لها)

إذا كنت تطبق التغييرات يدوياً دائماً:

```bash
# احذف مجلد migration (احتفظ بنسخة احتياطية أولاً)
rm -rf prisma/migrations/20260124_add_is_onboarding_featured
```

## التحقق من الحالة

بعد تطبيق `prisma migrate resolve`، جرب:

```bash
npx prisma migrate status
```

يجب أن ترى أن migration `20260124_add_is_onboarding_featured` معلمة كـ "Applied".

## ملاحظات

- `prisma migrate resolve` آمن ولا يغير قاعدة البيانات
- يستخدم فقط لتحديث سجل migrations في Prisma
- بعد ذلك، يمكنك استخدام `prisma migrate dev` بشكل طبيعي (إذا أصلحت مشكلة shadow database)

## حل مشكلة Shadow Database (اختياري)

إذا أردت إصلاح مشكلة shadow database لاستخدام `prisma migrate dev` في المستقبل:

1. **تأكد من أن جميع migrations السابقة مطبقة:**
   ```bash
   npx prisma migrate status
   ```

2. **إذا كانت هناك migrations غير مطبقة، طبقها يدوياً أو استخدم:**
   ```bash
   npx prisma migrate deploy
   ```

3. **أو استخدم `prisma db push` بدلاً من `migrate dev` للتغييرات البسيطة**
