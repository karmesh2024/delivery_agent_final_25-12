# ⚠️ تحديث مهم: Vercel Hobby Plan و Cron Jobs

## المشكلة
Vercel Hobby Plan (المجاني) يسمح فقط بـ **Cron Jobs مرة واحدة يومياً**، وليس كل دقيقة.

## ✅ الحلول المتاحة

### الخيار 1: استخدام cron-job.org (⭐ موصى به بشدة)

**لماذا هذا الخيار الأفضل؟**
- ✅ مجاني تماماً
- ✅ يدعم التكرار كل دقيقة
- ✅ يعمل مع أي استضافة
- ✅ لوحة تحكم سهلة
- ✅ إشعارات عند الفشل

**الإعداد:**
1. سجل في: https://cron-job.org
2. أضف Cron Job:
   - URL: `https://YOUR-APP-DOMAIN/api/playlist-engine/generate-m3u`
   - Method: POST
   - Schedule: `* * * * *` (كل دقيقة)
   - Headers: `Authorization: Bearer karmesh_radio_cron_secret_2024`

**راجع:** `CRON_JOB_SETUP_GUIDE.md` للتفاصيل الكاملة

---

### الخيار 2: استخدام Vercel Cron (مرة يومياً)

**تم تعديل `vercel.json` ليكون:**
```json
{
  "crons": [
    {
      "path": "/api/playlist-engine/generate-m3u",
      "schedule": "0 0 * * *"  // منتصف الليل كل يوم
    },
    {
      "path": "/api/playlist-engine/scheduled-ads",
      "schedule": "0 0 * * *"  // منتصف الليل كل يوم
    }
  ]
}
```

**أوقات أخرى متاحة:**
- `"0 0 * * *"` - منتصف الليل (12:00 AM)
- `"0 6 * * *"` - الساعة 6 صباحاً
- `"0 12 * * *"` - الساعة 12 ظهراً
- `"0 18 * * *"` - الساعة 6 مساءً

**⚠️ تحذير:**
- هذا يعني أن ملفات M3U ستُحدث **مرة واحدة فقط يومياً**
- قد لا يكون مناسباً للبث المباشر الذي يحتاج تحديثات فورية

---

### الخيار 3: ترقية Vercel إلى Pro ($20/شهر)

إذا كنت تحتاج Vercel Cron مع تكرار كل دقيقة:
- ترقية إلى Vercel Pro
- ستحصل على Cron Jobs بدون قيود

---

## 🎯 التوصية النهائية

**استخدم cron-job.org** لأنه:
1. مجاني تماماً
2. يدعم التكرار كل دقيقة
3. يعمل مع Vercel Hobby Plan
4. لا يحتاج ترقية

**ملاحظة:** يمكنك استخدام الاثنين معاً:
- Vercel Cron: تحديث يومي احتياطي
- cron-job.org: تحديث كل دقيقة (الرئيسي)

---

## 📝 الخطوات التالية

1. **إذا اخترت cron-job.org:**
   - اتبع `CRON_JOB_SETUP_GUIDE.md`
   - يمكنك ترك `vercel.json` كما هو (سيعمل كنسخة احتياطية)

2. **إذا اخترت Vercel Cron فقط:**
   - الملف `vercel.json` جاهز الآن
   - ادفع التغييرات: `git push`
   - Vercel سيعيد النشر تلقائياً

3. **للترقية إلى Vercel Pro:**
   - اذهب إلى: https://vercel.com/dashboard
   - Settings → Plan → Upgrade to Pro