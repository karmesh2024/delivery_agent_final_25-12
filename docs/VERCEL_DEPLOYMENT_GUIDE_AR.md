# دليل نشر مشروع بيكب على منصة Vercel 🚀

يحتوي هذا الدليل على الخطوات المخصصة لرفع تطبيق Next.js المرتبط بـ Supabase و
Prisma.

## 1. ربط الحساب واختيار المشروع

1. اذهب إلى [Vercel.com](https://vercel.com) وسجل الدخول عبر **GitHub**.
2. اضغط على زر **Add New...** ثم اختر **Project**.
3. ابحث عن المستودع المسمى `delivery_agent_final_25-12` واضغط على **Import**.

## 2. إعداد متغيرات البيئة (Environment Variables) 🔐

**هام جداً:** قبل الضغط على Deploy، يجب إضافة المفاتيح التالية من ملف `.env`
المحلي لديك إلى قسم `Environment Variables` في Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`: رابط مشروع Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: مفتاح Anon العام.
- `DATABASE_URL`: رابط الاتصال المباشر بقاعدة البيانات (لـ Prisma).
- `DIRECT_URL`: الرابط المباشر (Session mode) إذا كنت تستخدم Pgbouncer.
- `SUPABASE_SERVICE_ROLE_KEY`: **(لا تشاركه مع أحد)** للعمليات الإدارية من جهة
  الخادم.

## 3. إعدادات بناء المشروع (Build Settings)

بما أن المشروع يستخدم **Prisma**، تأكد من تحديث أمر البناء (Build Command) لضمان
توافق قاعدة البيانات:

- **Build Command:** `npx prisma generate && next build`
- **Install Command:** `npm install`

## 4. الخطوات النهائية

1. اضغط على **Deploy**.
2. انتظر حتى تكتمل عملية البناء (قد تستغرق 2-5 دقائق).
3. بمجرد الانتهاء، سيعطيك Vercel رابطاً (Domain) لموقعك.

## 5. ملاحظات أمنية بعد الرفع

- تأكد من أن المستودع على GitHub لا يزال **Private**.
- تأكد من عدم وجود ملف الجلسة `.env` مرفوعاً بالخطأ على GitHub.

---

**أنا هنا معك، أخبرني عند الوصول لأي خطوة أو إذا واجهت أي خطأ في البناء (Build
Errors).**
