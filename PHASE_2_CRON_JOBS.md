# المرحلة 2: Cron Jobs للتحديث التلقائي

## 🎯 الهدف
إعداد نظام تحديث تلقائي لملفات M3U كل دقيقة

## ✅ ما تم إنجازه

### 1. API Routes جاهزة
- ✅ `/api/playlist-engine/generate-m3u` - توليد قائمة التشغيل الرئيسية
- ✅ `/api/playlist-engine/scheduled-ads` - توليد الإعلانات المجدولة

### 2. متغيرات البيئة
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - مفتاح الخدمة الصحيح
- ✅ `CRON_SECRET` - سر التحقق من Cron Jobs

### 3. Vercel Configuration (اختياري)
- ✅ `vercel.json` مُعد بـ Cron Jobs **مرة يومياً** (متوافق مع Hobby Plan)
- ⚠️ **مهم:** Vercel Hobby Plan (المجاني) يسمح فقط بـ Cron Jobs **مرة واحدة يومياً**
- ✅ **الحل المجاني للتكرار كل دقيقة:** استخدام cron-job.org (موصى به بشدة)
- 📖 راجع: `VERCEL_CRON_LIMITATIONS.md` للتفاصيل الكاملة

## 🔧 الخطوات التالية

### الخطوة 1: إنشاء Supabase Storage Bucket
```sql
-- في Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('radio-playlists', 'radio-playlists', true);
```

### الخطوة 2: معرفة رابط التطبيق واختبار الـ API

**كيف تعرف رابط التطبيق؟**
- إذا كنت تستخدم **Vercel:** `https://your-project.vercel.app`
- إذا كنت تستخدم **Netlify:** `https://your-project.netlify.app`
- إذا كنت تستخدم **Railway:** `https://your-project.railway.app`
- إذا كان لديك **Domain مخصص:** استخدمه مباشرة

**اختبار الـ API يدوياً:**

استبدل `YOUR-APP-DOMAIN` برابط تطبيقك الفعلي:

```bash
# اختبار Generate M3U
curl -X POST https://YOUR-APP-DOMAIN/api/playlist-engine/generate-m3u \
  -H "Authorization: Bearer karmesh_radio_cron_secret_2024" \
  -H "Content-Type: application/json"

# اختبار Scheduled Ads
curl -X POST https://YOUR-APP-DOMAIN/api/playlist-engine/scheduled-ads \
  -H "Authorization: Bearer karmesh_radio_cron_secret_2024" \
  -H "Content-Type: application/json"
```

**أو استخدم Postman/Browser:**
- افتح المتصفح واذهب إلى: `https://YOUR-APP-DOMAIN/api/playlist-engine/generate-m3u`
- يجب أن ترى محتوى M3U أو رسالة خطأ (هذا طبيعي بدون Authorization)

### الخطوة 3: إعداد Cron Job خارجي (cron-job.org) ⭐ **الخيار الموصى به**

> **ملاحظة مهمة:** لا تحتاج Vercel بالضرورة! يمكنك استخدام cron-job.org مع **أي استضافة** (Vercel, Netlify, Railway, أو حتى سيرفر خاص).

**المتطلبات الوحيدة:**
- ✅ التطبيق متاح عبر الإنترنت (على أي استضافة)
- ✅ الـ API Routes تعمل بشكل صحيح
- ✅ حساب مجاني في cron-job.org

**خطوات الإعداد:**

1. **إنشاء حساب:** https://cron-job.org (مجاني تماماً)

2. **إضافة Cron Job الأول:**
   - **Title:** `Update Radio Playlist M3U`
   - **URL:** `https://YOUR-APP-DOMAIN/api/playlist-engine/generate-m3u`
     > ⚠️ استبدل `YOUR-APP-DOMAIN` برابط تطبيقك الفعلي
   - **Method:** POST
   - **Schedule:** `* * * * *` (كل دقيقة)
   - **Request Headers:**
     ```
     Authorization: Bearer karmesh_radio_cron_secret_2024
     Content-Type: application/json
     ```
   - **Notifications:** (اختياري) يمكنك إضافة إشعارات عند الفشل

3. **إضافة Cron Job الثاني:**
   - **Title:** `Update Scheduled Ads M3U`
   - **URL:** `https://YOUR-APP-DOMAIN/api/playlist-engine/scheduled-ads`
   - **Method:** POST
   - **Schedule:** `* * * * *` (كل دقيقة)
   - **Request Headers:**
     ```
     Authorization: Bearer karmesh_radio_cron_secret_2024
     Content-Type: application/json
     ```

**أمثلة على الروابط:**
- Vercel: `https://your-app.vercel.app/api/...`
- Netlify: `https://your-app.netlify.app/api/...`
- Railway: `https://your-app.railway.app/api/...`
- Custom Domain: `https://radio.karmesh.eg/api/...`

## 📊 التحقق من النجاح

### في Supabase Storage:
- ✅ ملف `playlist.m3u` يتم تحديثه كل دقيقة
- ✅ ملف `scheduled_ads.m3u` يتم تحديثه كل دقيقة

### في Vercel Logs:
- ✅ رسائل نجاح: "Playlist updated at [timestamp]"
- ✅ عدد العناصر المُحدثة
- ✅ روابط الملفات العامة

## 🚨 استكشاف الأخطاء

### إذا لم يعمل Vercel Cron:
```json
// في vercel.json
{
  "crons": [
    {
      "path": "/api/playlist-engine/generate-m3u",
      "schedule": "*/1 * * * *"  // جرب هذا التنسيق
    }
  ]
}
```

### إذا كان هناك خطأ في Supabase:
- تحقق من `SUPABASE_SERVICE_ROLE_KEY`
- تأكد من وجود الـ bucket `radio-playlists`
- تحقق من صلاحيات الـ Storage

### إذا كان هناك timeout:
- قلل من حجم البيانات المُسترجعة
- أضف فهرسة للجداول
- استخدم cache إذا أمكن

## 🎉 النتيجة المتوقعة

بعد إكمال هذه المرحلة:
- ✅ ملفات M3U تُحدث تلقائياً كل دقيقة
- ✅ Liquidsoap يقرأ قوائم محدثة
- ✅ البث يعكس التغييرات فوراً
- ✅ الإعلانات تُبث في أوقاتها المحددة

## 📞 التالي: المرحلة 3

بعد التأكد من عمل Cron Jobs:
- إعداد Liquidsoap Script على السيرفر
- ربط M3U files بـ Icecast
- اختبار البث الفعلي