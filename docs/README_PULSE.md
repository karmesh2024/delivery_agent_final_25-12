# إعداد محرك الاكتشاف الاستباقي (Zoon Proactive Pulse)

نقطة النهاية (Endpoint): `/api/zoon/discovery/pulse`

### 1. المتطلبات
- تأكد من وجود المتغير `CRON_SECRET` في ملف `.env.local`.
- تأكد من أن قاعدة البيانات تحتوي على جدول `discovery_feed`.

### 2. كيفية الإعداد (Cron Job)

#### أ. على Linux (Crontab)
أضف السطر التالي لتشغيل المحرك كل ساعة:
```bash
0 * * * * curl -X POST "https://your-domain.com/api/zoon/discovery/pulse" -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### ب. على Windows (Task Scheduler + PowerShell)
1. افتح Task Scheduler.
2. أنشئ Task جديدة.
3. في الـ Actions، اختر `Start a program`.
4. البرنامج: `powershell`.
5. المعاملات (Arguments):
```powershell
-Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/zoon/discovery/pulse' -Method Post -Headers @{ Authorization = 'Bearer YOUR_CRON_SECRET' }"
```

#### ج. باستخدام خدمة خارجية (مثل Vercel Cron أو Cron-job.org)
قم بضبط طلب POST للرابط الخاص بك مع رأس (Header) الـ Authorization الصحيح.

---
### ⚠️ ملاحظة أمنية
يتم حماية نقطة النهاية عبر الـ Secret لضمان عدم تشغيلها من قبل أطراف خارجية واستهلاك حصص الـ API.
