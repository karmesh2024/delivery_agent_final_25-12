# 📋 إعداد Cron Jobs على cron-job.org — خطوة بخطوة

> تم إنشاء الحساب ✅ — نكمل من هنا

---

## الخطوة 1: الدخول إلى لوحة التحكم

1. افتح المتصفح واذهب إلى: **https://cron-job.org**
2. اضغط **"Log in"** أو **"Sign in"**
3. أدخل البريد وكلمة المرور
4. بعد الدخول، ستظهر **Dashboard** (لوحة التحكم)

---

## الخطوة 2: معرفة رابط التطبيق (مهم جداً)

قبل إنشاء أي Cron Job، نحتاج الرابط الكامل للتطبيق:

### إذا التطبيق على Vercel:
1. اذهب إلى: **https://vercel.com/dashboard**
2. اختر المشروع الذي رفعته
3. في تبويب **"Settings"** أو الصفحة الرئيسية للمشروع
4. انسخ الرابط من قسم **"Domains"**
   - يكون مثل: `https://delivery-agent-xxx.vercel.app`
   - أو: `https://your-custom-domain.com`

> **اكتب هذا الرابط في ورقة** — سنستخدمه في كل Cron Job.

**⚠️ في الـ Cron استخدم الرابط الكامل (الدومين + المسار)، وليس الدومين فقط:**

| ✅ في حقل URL بالـ Cron تكتب | ❌ لا تكتب الدومين فقط |
|-----------------------------|-------------------------|
| `https://delivery-agent-final-25-12-w9ew.vercel.app/api/playlist-engine/generate-m3u` | `https://delivery-agent-final-25-12-w9ew.vercel.app` |

- **الدومين من Domains:** `delivery-agent-final-25-12-w9ew.vercel.app`
- **رابط Cron 1 للنسخ:**  
  `https://delivery-agent-final-25-12-w9ew.vercel.app/api/playlist-engine/generate-m3u`
- **رابط Cron 2 للنسخ:**  
  `https://delivery-agent-final-25-12-w9ew.vercel.app/api/playlist-engine/scheduled-ads`

---

## الخطوة 3: إنشاء Cron Job الأول (قائمة التشغيل الرئيسية)

### 3.1 فتح صفحة إنشاء Cron Job

1. في **cron-job.org** اضغط:
   - **"Create cronjob"** أو
   - **"New cronjob"** أو
   - أيقونة **"+"**
2. ستفتح صفحة نموذج إدخال البيانات

---

### 3.2 تعبئة الحقول — Cron Job الأول

| الحقل | القيمة المطلوبة |
|-------|-----------------|
| **Title** أو **Name** | `Update Radio Playlist M3U` |
| **URL** أو **Address** | `https://delivery-agent-final-25-12-w9ew.vercel.app/api/playlist-engine/generate-m3u` |
| **Request Method** | `POST` |
| **Schedule** | `* * * * *` أو **Every minute** |

> ⚠️ **مهم:** استخدم الرابط **الكامل** (الدومين + المسار) كما في الجدول، وليس الدومين فقط كما في Domains.

---

### 3.3 إضافة Request Headers

1. ابحث عن قسم اسمه أحد الآتي:
   - **"Request Headers"**
   - **"Headers"**
   - **"Advanced"** أو **"إعدادات متقدمة"**
2. اضغط **"Add header"** أو **"Add"**
3. أضف **Header الأول:**
   - **Name:** `Authorization`
   - **Value:** `Bearer karmesh_radio_cron_secret_2024`
4. أضف **Header الثاني:**
   - **Name:** `Content-Type`
   - **Value:** `application/json`

> إذا لم تجد خيار Headers، جرب أولاً حفظ الـ Cron Job ثم تعديله من الإعدادات المتقدمة.

---

### 3.4 ضبط التوقيت (Schedule)

1. في حقل **Schedule** اختر:
   - **"Every minute"** أو
   - **"Each minute"** أو
   - اكتب: `* * * * *`
2. احفظ بضغطة **"Create"** أو **"Save"**

---

### 3.5 التحقق من Cron Job الأول

- في القائمة يجب أن يظهر: **Update Radio Playlist M3U**
- تأكد أن الحالة **Enabled** أو **Active**

---

## الخطوة 4: إنشاء Cron Job الثاني (الإعلانات المجدولة)

1. اضغط مرة أخرى **"Create cronjob"** أو **"+"**
2. املأ النموذج كالتالي:

| الحقل | القيمة المطلوبة |
|-------|-----------------|
| **Title** | `Update Scheduled Ads M3U` |
| **URL** | `https://delivery-agent-final-25-12-w9ew.vercel.app/api/playlist-engine/scheduled-ads` |
| **Request Method** | `POST` |
| **Schedule** | `* * * * *` أو **Every minute** |

3. **Request Headers** (نفس القيم كما في Cron Job الأول):
   - `Authorization` → `Bearer karmesh_radio_cron_secret_2024`
   - `Content-Type` → `application/json`

4. احفظ **"Create"** أو **"Save"**

---

## الخطوة 5: تشغيل اختبار يدوي (Run now)

1. في قائمة Cron Jobs، بجانب **"Update Radio Playlist M3U"**
2. اضغط **"Run now"** أو **"Execute now"** أو أيقونة ▶
3. انتظر 5–10 ثوانٍ
4. افتح **"Execution log"** أو **"Log"** أو **"History"**
5. تحقق من آخر تنفيذ:
   - **Status 200** أو **Success** = نجاح
   - **4xx أو 5xx** = راجع الرابط والـ Headers

كرر **"Run now"** لـ **"Update Scheduled Ads M3U"** وتحقق من الـ Log بنفس الطريقة.

---

## الخطوة 6: التحقق من Supabase Storage

1. اذهب إلى: **https://supabase.com/dashboard**
2. اختر مشروعك
3. من القائمة الجانبية: **Storage**
4. اختر الـ bucket: **radio-playlists**

### إذا ظهر أن الـ bucket غير موجود:

1. اضغط **"New bucket"**
2. **Name:** `radio-playlists`
3. فعّل **"Public bucket"**
4. احفظ

### تحقق من الملفات:

- `playlist.m3u`
- `scheduled_ads.m3u`

بعد تشغيل **"Run now"** من cron-job.org، تحقق من **"Last modified"** — يجب أن يتحدث لكل من الملفين.

---

## الخطوة 7: (اختياري) تفعيل الإشعارات عند الفشل

1. في cron-job.org: **Settings** أو **Account**
2. ابحث عن **"Notifications"** أو **"Email alerts"**
3. فعّل إشعار عند **Failure** أو **Error**
4. بهذا تصلك رسالة إذا توقف أحد الـ Cron Jobs عن النجاح

---

## ملخص القيم المهمة (للنسخ)

```
الدومين فقط (من Domains):  delivery-agent-final-25-12-w9ew.vercel.app
                            ↑ هذا لا يكفي للـ Cron

CRON 1 - URL (كامل):      https://delivery-agent-final-25-12-w9ew.vercel.app/api/playlist-engine/generate-m3u
CRON 2 - URL (كامل):      https://delivery-agent-final-25-12-w9ew.vercel.app/api/playlist-engine/scheduled-ads

Method:                   POST
Header 1:                 Authorization: Bearer karmesh_radio_cron_secret_2024
Header 2:                 Content-Type: application/json
Schedule:                 * * * * *  (كل دقيقة)
```

---

## استكشاف الأخطاء السريع

| المشكلة | الحل |
|---------|------|
| **404 Not Found** | تأكد من الرابط، خاصة `/api/playlist-engine/generate-m3u` و `/api/playlist-engine/scheduled-ads` |
| **401 Unauthorized** | تأكد من قيمة `Authorization: Bearer karmesh_radio_cron_secret_2024` بالكامل |
| **500 Error** | راجع Vercel Logs و Supabase؛ تأكد من `SUPABASE_SERVICE_ROLE_KEY` ووجود bucket `radio-playlists` |
| **لا توجد Headers في cron-job.org** | جرّب الخطة الأعلى أو استخدم خدمة مثل **cron-job.org** الإصدار المدفوع إن وجد؛ أو تأكد أنك في وضع "Advanced" |

---

## التحقق النهائي

- [ ] Cron Job 1: **Update Radio Playlist M3U** — مفعّل ويظهر **Success** في Log
- [ ] Cron Job 2: **Update Scheduled Ads M3U** — مفعّل ويظهر **Success** في Log
- [ ] في Supabase Storage: ملفا `playlist.m3u` و `scheduled_ads.m3u` موجودان ويتحدث **Last modified** بعد كل **Run now**

إذا تحققت كل النقاط أعلاه، الإعداد يعمل بشكل صحيح.

---

## ما التالي؟

بعد أن تتأكد من عمل الـ Cron Jobs وتحديث الملفات في Supabase Storage:

- المرحلة 3: إعداد **Liquidsoap** على السيرفر وربط ملفات M3U بـ **Icecast** للبث الفعلي.

إذا واجهت خطأ معين (مثل 404 أو 401 أو 500)، اكتب لي الرسالة أو لقطة شاشة من **Execution log** وسأحدد معك السبب خطوة بخطوة.
