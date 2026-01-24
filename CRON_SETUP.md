# إعداد Cron Jobs للـ Radio System

## الخيار 1: Vercel Cron Jobs (مُعد بالفعل)

✅ **مُعد في `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/playlist-engine/generate-m3u",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/playlist-engine/scheduled-ads",
      "schedule": "* * * * *"
    }
  ]
}
```

**متطلبات Vercel:**
- Vercel Pro أو Enterprise plan
- Cron Jobs enabled
- متغير `CRON_SECRET` محدد

## الخيار 2: Cron Job خارجي (cron-job.org) ⭐ الموصى به

### خطوات الإعداد:

1. **إنشاء حساب في cron-job.org:**
   - اذهب إلى https://cron-job.org
   - سجل حساب جديد مجاني

2. **إضافة Cron Job الأول:**
   - **URL:** `https://your-app.vercel.app/api/playlist-engine/generate-m3u`
   - **Method:** POST
   - **Headers:**
     ```
     Authorization: Bearer karmesh_radio_cron_secret_2024
     Content-Type: application/json
     ```
   - **Schedule:** `* * * * *` (كل دقيقة)

3. **إضافة Cron Job الثاني:**
   - **URL:** `https://your-app.vercel.app/api/playlist-engine/scheduled-ads`
   - **Method:** POST
   - **Headers:**
     ```
     Authorization: Bearer karmesh_radio_cron_secret_2024
     Content-Type: application/json
     ```
   - **Schedule:** `* * * * *` (كل دقيقة)

### التحقق من العمل:

```bash
# اختبار يدوي
curl -X POST https://your-app.vercel.app/api/playlist-engine/generate-m3u \
  -H "Authorization: Bearer karmesh_radio_cron_secret_2024" \
  -H "Content-Type: application/json"
```

### متطلبات Supabase Storage:

تأكد من إنشاء bucket `radio-playlists` في Supabase Dashboard:
- **Settings → Storage**
- **Create bucket:** `radio-playlists`
- **Public bucket:** ✅ Enabled
- **Allowed MIME types:** `audio/x-mpegurl, text/plain`

### مراقبة السجلات:

تحقق من Vercel Logs أو Supabase Logs للتأكد من:
- نجاح رفع الملفات إلى Storage
- تحديث M3U files كل دقيقة
- عدم وجود أخطاء في الـ API calls

## الخيار 3: Railway Cron Jobs (بديل آخر)

إذا كنت تستخدم Railway:
```yaml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
cron = "0 * * * *"  # أو حسب الحاجة
```

## ملاحظات مهمة:

- **Cron Secret:** `karmesh_radio_cron_secret_2024`
- **Frequency:** كل دقيقة لتحديث سريع
- **Timeout:** تأكد من أن Vercel functions لا تتجاوز timeout limit
- **Storage:** تأكد من وجود bucket `radio-playlists` في Supabase
- **Monitoring:** راقب السجلات للتأكد من التحديث المنتظم