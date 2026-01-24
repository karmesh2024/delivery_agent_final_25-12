# دليل تشغيل نظام البث العام المستمر (Always-On)

## نظرة عامة

تم تنفيذ نظام البث العام المستمر باستخدام:
- **Next.js API Routes** - لتوليد M3U files
- **Liquidsoap** - لمعالجة الصوت والبث
- **Icecast** - لخدمة المستمعين
- **Vercel Cron** - لتحديث M3U كل دقيقة

---

## البنية المعمارية

```
┌─── Next.js Dashboard ───────────────────┐
│  /club-zone/radio/always-on             │
│  - ContentLibrary (رفع المحتوى)         │
│  - TimelineEditor (جدولة)               │
│  - Status Panel (حالة البث)            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─── API Routes ──────────────────────────┐
│  /api/playlist-engine/generate-m3u      │
│  /api/playlist-engine/scheduled-ads     │
│  /api/playlist-engine/status            │
│  /api/radio/now-playing                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─── Supabase Storage ────────────────────┐
│  radio-playlists/playlist.m3u           │
│  radio-playlists/scheduled_ads.m3u      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─── Liquidsoap (على السيرفر) ───────────┐
│  playlist.safe(reload_mode="rounds")    │
│  fallback([live, ads, playlist])        │
│  crossfade + normalize                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─── Icecast Server ──────────────────────┐
│  http://radio.karmesh.eg:8000/stream    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─── المستمعين ───────────────────────────┐
│  📱 Mobile App                          │
│  🌐 Web Player                          │
└─────────────────────────────────────────┘
```

---

## الملفات المُنشأة

### API Routes

| الملف | الغرض |
|------|-------|
| `src/app/api/playlist-engine/generate-m3u/route.ts` | توليد M3U الرئيسي |
| `src/app/api/playlist-engine/scheduled-ads/route.ts` | توليد M3U للإعلانات |
| `src/app/api/playlist-engine/status/route.ts` | حالة البث الكاملة |
| `src/app/api/radio/now-playing/route.ts` | المحتوى الحالي |

### التكوين

| الملف | الغرض |
|------|-------|
| `vercel.json` | Cron Jobs كل دقيقة |
| `docs/الراديو/liquidsoap_radio_karmesh.liq` | سكريبت Liquidsoap |

### الخدمات المحدّثة

| الملف | التحديثات |
|------|----------|
| `playlistEngineService.ts` | إضافة `generateM3UPlaylist()`, `getFullStatus()`, `getNowPlaying()` |
| `radioContentService.ts` | إضافة `calculateAudioDuration()`, `updateContentDuration()` |

### واجهة المستخدم

| الملف | التحديثات |
|------|----------|
| `always-on/page.tsx` | إضافة روابط M3U، إحصائيات، توليد يدوي |

---

## API Endpoints

### GET /api/playlist-engine/generate-m3u
يُرجع ملف M3U مباشرة.

```bash
curl https://your-domain.com/api/playlist-engine/generate-m3u
```

### POST /api/playlist-engine/generate-m3u
يولد M3U ويحفظه في Supabase Storage.

```bash
curl -X POST https://your-domain.com/api/playlist-engine/generate-m3u
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items_count": 5,
    "generated_at": "2025-01-24T10:00:00Z",
    "public_url": "https://xxx.supabase.co/storage/v1/object/public/radio-playlists/playlist.m3u"
  }
}
```

### GET /api/playlist-engine/status
```json
{
  "success": true,
  "data": {
    "broadcast_status": {
      "is_running": true,
      "stream_url": "http://radio.karmesh.eg:8000/stream"
    },
    "listeners": {
      "current_count": 42
    },
    "current_item": {
      "title": "إعلان صباحي",
      "content_type": "ad"
    },
    "m3u_urls": {
      "playlist_storage": "https://xxx.supabase.co/.../playlist.m3u",
      "ads_storage": "https://xxx.supabase.co/.../scheduled_ads.m3u"
    }
  }
}
```

### GET /api/radio/now-playing
للموبايل والويب:
```json
{
  "success": true,
  "data": {
    "status": {
      "is_live": true,
      "stream_url": "http://radio.karmesh.eg:8000/stream"
    },
    "now_playing": {
      "title": "مقطع كوميدي",
      "duration_seconds": 180,
      "progress_seconds": 45
    },
    "up_next": [
      {"title": "إعلان", "content_type": "ad"}
    ]
  }
}
```

---

## إعداد السيرفر (VPS)

### 1. تثبيت Icecast

```bash
sudo apt update
sudo apt install icecast2
```

تعديل `/etc/icecast2/icecast.xml`:
```xml
<source-password>YOUR_PASSWORD</source-password>
<admin-password>ADMIN_PASSWORD</admin-password>
<hostname>radio.karmesh.eg</hostname>
```

```bash
sudo systemctl enable icecast2
sudo systemctl start icecast2
```

### 2. تثبيت Liquidsoap

```bash
sudo apt install liquidsoap
```

### 3. إعداد السكريبت

نسخ `liquidsoap_radio_karmesh.liq` إلى `/etc/liquidsoap/`:

```bash
sudo cp liquidsoap_radio_karmesh.liq /etc/liquidsoap/radio_karmesh.liq
```

تعديل الإعدادات:
- `icecast_password`
- `playlist_path` أو استخدام URLs من Supabase

### 4. إنشاء مجلد الملفات

```bash
sudo mkdir -p /var/radio
sudo chown liquidsoap:liquidsoap /var/radio
```

### 5. Cron لتحديث M3U محلياً (اختياري)

إذا كنت تفضل ملفات محلية:

```bash
crontab -e
```

```
* * * * * curl -s https://your-domain.com/api/playlist-engine/generate-m3u > /var/radio/playlist.m3u
* * * * * curl -s https://your-domain.com/api/playlist-engine/scheduled-ads > /var/radio/scheduled_ads.m3u
```

### 6. تشغيل Liquidsoap

```bash
sudo liquidsoap /etc/liquidsoap/radio_karmesh.liq
```

أو كخدمة:

```bash
sudo systemctl enable liquidsoap
sudo systemctl start liquidsoap
```

---

## اختبار النظام

### 1. اختبار API

```bash
# توليد M3U
curl -X POST https://your-domain.com/api/playlist-engine/generate-m3u

# حالة البث
curl https://your-domain.com/api/playlist-engine/status

# المحتوى الحالي
curl https://your-domain.com/api/radio/now-playing
```

### 2. اختبار البث

فتح رابط البث في VLC أو أي مشغل:
```
http://radio.karmesh.eg:8000/stream
```

### 3. اختبار من Dashboard

1. افتح `/club-zone/radio/always-on`
2. ارفع محتوى في "مكتبة المحتوى"
3. أضف المحتوى في "الجدولة"
4. اضغط "توليد M3U الآن"
5. تحقق من الروابط

---

## قواعد التشغيل (Play Rules)

| القاعدة | الوصف |
|--------|-------|
| `continuous` | يدور باستمرار |
| `every_30_minutes` | يُشغل عند :00 و :30 |
| `hourly` | يُشغل عند :00 |
| `daily` | يُشغل في وقت محدد يومياً |
| `once` | يُشغل مرة واحدة في وقت محدد |

---

## الأولويات

| الأولوية | القيمة |
|---------|-------|
| `high` | 3 (أعلى) |
| `medium` | 2 |
| `low` | 1 (أدنى) |

---

## استكشاف الأخطاء

### M3U لا يتحدث
- تحقق من Vercel Cron في Vercel Dashboard
- استخدم cron-job.org كبديل خارجي

### Liquidsoap لا يقرأ الملفات
- تحقق من الصلاحيات على `/var/radio/`
- استخدم URLs بدلاً من الملفات المحلية

### لا يوجد صوت
- تحقق من Icecast: `http://localhost:8000/admin/`
- تحقق من logs: `/var/log/liquidsoap/`

---

## التطوير المستقبلي

- [ ] Music Overlay (خلفية موسيقية)
- [ ] Ducking (خفض الموسيقى عند الكلام)
- [ ] إحصائيات تفصيلية للمستمعين
- [ ] جدولة متقدمة (أسبوعية/شهرية)
- [ ] تكامل مع Push Notifications

---

## المراجع

- [Liquidsoap Documentation](https://www.liquidsoap.info/doc-dev/)
- [Icecast Documentation](https://icecast.org/docs/)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
