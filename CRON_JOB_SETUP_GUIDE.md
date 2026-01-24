# دليل إعداد Cron Jobs مع cron-job.org (مجاني تماماً)

## 🎯 الهدف
إعداد Cron Jobs لتحديث ملفات M3U تلقائياً كل دقيقة **بدون الحاجة لـ Vercel Pro**

## ✅ المتطلبات
- ✅ حساب في cron-job.org (مجاني)
- ✅ تطبيق Next.js متاح على الإنترنت (أي استضافة)
- ✅ معرفة رابط التطبيق

---

## 📝 خطوات الإعداد خطوة بخطوة

### الخطوة 1: إنشاء حساب في cron-job.org

1. اذهب إلى: https://cron-job.org
2. اضغط على **"Sign Up"** أو **"Create Account"**
3. سجل بحساب جديد (مجاني تماماً)
4. تحقق من البريد الإلكتروني

### الخطوة 2: معرفة رابط التطبيق

**أين تجد رابط التطبيق؟**

#### إذا كنت تستخدم Vercel:
- اذهب إلى: https://vercel.com/dashboard
- اختر مشروعك
- انسخ الرابط من قسم **"Domains"**
- مثال: `https://your-project.vercel.app`

#### إذا كنت تستخدم Netlify:
- اذهب إلى: https://app.netlify.com
- اختر موقعك
- انسخ الرابط من قسم **"Domain"**
- مثال: `https://your-project.netlify.app`

#### إذا كان لديك Domain مخصص:
- استخدمه مباشرة
- مثال: `https://radio.karmesh.eg`

### الخطوة 3: إضافة Cron Job الأول (Generate M3U)

1. **في cron-job.org Dashboard:**
   - اضغط على **"Create cronjob"** أو **"+"**

2. **املأ البيانات:**
   ```
   Title: Update Radio Playlist M3U
   Address: https://YOUR-APP-DOMAIN/api/playlist-engine/generate-m3u
   ```
   > ⚠️ استبدل `YOUR-APP-DOMAIN` برابط تطبيقك الفعلي

3. **اختر Method:**
   - اختر **POST** من القائمة المنسدلة

4. **أضف Headers:**
   - اضغط على **"Request Headers"** أو **"Headers"**
   - أضف Header جديد:
     ```
     Name: Authorization
     Value: Bearer karmesh_radio_cron_secret_2024
     ```
   - أضف Header آخر:
     ```
     Name: Content-Type
     Value: application/json
     ```

5. **حدد Schedule:**
   - اختر **"Every minute"** أو اكتب: `* * * * *`

6. **حفظ:**
   - اضغط **"Create cronjob"** أو **"Save"**

### الخطوة 4: إضافة Cron Job الثاني (Scheduled Ads)

1. **كرر الخطوة 3** مع البيانات التالية:
   ```
   Title: Update Scheduled Ads M3U
   Address: https://YOUR-APP-DOMAIN/api/playlist-engine/scheduled-ads
   Method: POST
   Headers:
     - Authorization: Bearer karmesh_radio_cron_secret_2024
     - Content-Type: application/json
   Schedule: * * * * * (كل دقيقة)
   ```

### الخطوة 5: اختبار Cron Jobs

1. **اختبار يدوي:**
   - في cron-job.org، اضغط على **"Run now"** بجانب كل Cron Job
   - تحقق من **"Execution Log"** للتأكد من النجاح

2. **التحقق من Supabase Storage:**
   - اذهب إلى Supabase Dashboard
   - Storage → radio-playlists
   - تحقق من وجود/تحديث:
     - `playlist.m3u`
     - `scheduled_ads.m3u`

---

## 🔍 استكشاف الأخطاء

### المشكلة: Cron Job يفشل مع 401 Unauthorized
**الحل:**
- تحقق من أن Header `Authorization` مكتوب بشكل صحيح
- تأكد من وجود `CRON_SECRET` في متغيرات البيئة

### المشكلة: Cron Job يفشل مع 404 Not Found
**الحل:**
- تحقق من رابط التطبيق
- تأكد من أن الـ API Route موجودة: `/api/playlist-engine/generate-m3u`
- جرب فتح الرابط في المتصفح مباشرة

### المشكلة: Cron Job يفشل مع 500 Internal Server Error
**الحل:**
- تحقق من سجلات التطبيق (Vercel Logs, Netlify Logs, etc.)
- تأكد من وجود `SUPABASE_SERVICE_ROLE_KEY` في متغيرات البيئة
- تحقق من وجود bucket `radio-playlists` في Supabase Storage

### المشكلة: الملفات لا تُحدث
**الحل:**
- تحقق من أن Cron Job يعمل (Execution Log)
- تأكد من أن Schedule مضبوط على `* * * * *`
- تحقق من أن هناك محتوى في `playlist_timeline`

---

## 📊 مراقبة Cron Jobs

### في cron-job.org:
- **Dashboard:** عرض حالة جميع Cron Jobs
- **Execution Log:** سجل تنفيذ كل Cron Job
- **Statistics:** إحصائيات النجاح/الفشل

### في Supabase Storage:
- تحقق من **"Last Modified"** للملفات
- يجب أن يتغير كل دقيقة

### في Vercel/Netlify Logs:
- ابحث عن رسائل: `[Generate M3U] Playlist updated at...`
- تحقق من عدم وجود أخطاء

---

## 💡 نصائح إضافية

1. **إشعارات البريد الإلكتروني:**
   - في cron-job.org، يمكنك تفعيل إشعارات عند فشل Cron Job
   - مفيد جداً للمراقبة

2. **تقليل التكرار (اختياري):**
   - إذا كان التحديث كل دقيقة كثيراً، يمكنك تغيير Schedule إلى:
     - `*/5 * * * *` (كل 5 دقائق)
     - `*/10 * * * *` (كل 10 دقائق)

3. **اختبار قبل الإنتاج:**
   - جرب Cron Job يدوياً أولاً
   - تأكد من عمل الـ API قبل تفعيل Schedule

---

## ✅ التحقق النهائي

بعد إكمال الإعداد، تأكد من:
- ✅ Cron Jobs تعمل في cron-job.org
- ✅ Execution Log يظهر نجاح
- ✅ ملفات M3U تُحدث في Supabase Storage
- ✅ Last Modified يتغير كل دقيقة

---

## 🎉 مبروك!

الآن لديك نظام تحديث تلقائي يعمل **مجاناً تماماً** بدون الحاجة لـ Vercel Pro!

**التالي:** المرحلة 3 - إعداد Liquidsoap Script على السيرفر