# مستند تحليل: البث المباشر العام المستمر (Always-On Stream)

**التاريخ:** 2025-01-23  
**الإصدار:** 1.1  
**الغرض:** مرجع شامل وتفصيلي لما تم تنفيذه من الخطة وما تبقى للتنفيذ

---

## 1. ملخص تنفيذي

هذا المستند يوثق حالة تنفيذ نظام **البث العام المستمر (Always-On Stream)** وفق الخطتين المعتمدَتين:

- **الخطة الأولى** (`.cursor/plans/نظام_البث_العام_المستمر_always-on_stream_66b6b118.plan.md`): المراحل 1–5 (قاعدة البيانات، الخدمات، الداشبورد، محرك القوائم، التكامل).
- **الخطة الثانية** (`.cursor/plans/always-on_radio_implementation_08c6641d.plan.md`): API Routes، Cron، Liquidsoap، تحديث الخدمات والداشبورد.

**حالة التنفيذ الحالية:**

| المرحلة | الوصف | الحالة |
|---------|--------|--------|
| **المرحلة 1** | قاعدة البيانات (Schema، جداول، Storage، RLS، Triggers) | مكتملة |
| **المرحلة 2** | Backend Services (محتوى، جدولة، تبديل تلقائي، محرك قوائم، تحديث clubRadioService) | مكتملة |
| **المرحلة 3** | Frontend Dashboard (Always-On صفحة، ContentLibrary، TimelineEditor، روابط وAPI) | مكتملة |
| **المرحلة 4** | Playlist Engine على السيرفر (Liquidsoap + Icecast) | معلقة — تتطلب سيرفر (Hetzner) |
| **المرحلة 5** | التكامل النهائي واختبار البث الفعلي | بعد إعداد السيرفر |

**الخطوة التالية المطلوبة:** حجز سيرفر على **Hetzner** وإعداد بيئة البث (Icecast2، Liquidsoap، مجلد الملفات، البورتات) ثم ربط الداشبورد برابط البث.

**مراجع الخطط (في المشروع):**

- `.cursor/plans/نظام_البث_العام_المستمر_always-on_stream_66b6b118.plan.md` — المراحل 1–5 (DB، Services، Dashboard، Playlist Engine، التكامل).
- `.cursor/plans/always-on_radio_implementation_08c6641d.plan.md` — API Routes، Cron، Liquidsoap، متطلبات السيرفر (VPS/Hetzner).

---

## 2. البنية المعمارية المستهدفة (من الخطة)

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Dashboard                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Live Event   │  │ Always-On    │  │ Content      │     │
│  │ Dashboard    │  │ Dashboard    │  │ Library      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │club_activities│  │radio_content │  │playlist_timeline│   │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Playlist Engine (M3U + Liquidsoap)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Timeline      │  │Scheduler     │  │Auto Switch   │     │
│  │Manager       │  │              │  │Controller    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓ (PCM/MP3 Stream)
┌─────────────────────────────────────────────────────────────┐
│                    Icecast Server                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Mobile App / Web Players                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. ما تم تنفيذه (الوضع الحالي)

### 3.1 قاعدة البيانات (Database)

| العنصر | الحالة | الملف / التفاصيل |
|--------|--------|-------------------|
| جدول `radio_content` | منفذ | `20250123_create_always_on_stream_schema.sql` — حقول: id, title, content_type, file_url, file_duration_seconds, metadata, is_active, created_by, created_at, updated_at |
| جدول `playlist_timeline` | منفذ | نفس الملف — حقول: content_id, play_order, scheduled_time, play_rule, priority, is_active |
| جدول `playlist_logs` | منفذ | نفس الملف — تسجيل التشغيل: content_id, played_at, duration_seconds, listeners_count |
| تحديث `club_activities` | منفذ | `20250123_add_broadcast_mode_to_club_activities.sql` — إضافة: broadcast_mode, playlist_engine_url, auto_switch_enabled |
| دوال وTriggers التبديل التلقائي | منفذ | `get_current_broadcast_mode()`, `check_and_switch_broadcast()`, Trigger على club_activities |
| Indexes و RLS | منفذ | على radio_content, playlist_timeline, playlist_logs |
| Storage Buckets | منفذ | `20250124_radio_storage_and_schema.sql` — buckets: radio-content, radio-playlists + سياسات RLS |

**ملاحظة:** إذا كان مشروعك يستخدم `20250124_radio_storage_and_schema.sql` فقد يكون فيه تعريفات مكررة للجداول؛ يُفضّل التأكد من ترتيب الـ migrations وتجنب التعارض.

---

### 3.2 الخدمات (Services) — Backend Logic

| الخدمة | الملف | الوظائف المنفذة |
|--------|-------|-----------------|
| **radioContentService** | `src/domains/club-zone/services/radioContentService.ts` | رفع ملفات، إنشاء/تحديث/حذف محتوى، جلب بفلاتر (نوع، بحث)، حساب مدة الصوت/الفيديو (Web Audio API)، دعم visual_ad |
| **playlistTimelineService** | `src/domains/club-zone/services/playlistTimelineService.ts` | إنشاء/تحديث/حذف عناصر الجدولة، getCurrentPlaylist، getNextContent (حسب القواعد)، updatePlaylistOrder، generatePlaylist |
| **autoSwitchService** | `src/domains/club-zone/services/autoSwitchService.ts` | getBroadcastStatus، checkAndSwitch، startAlwaysOnStream، stopAlwaysOnStream، switchToLiveEvent، switchToAlwaysOn، setAutoSwitchEnabled، createAlwaysOnActivity |
| **playlistEngineService** | `src/domains/club-zone/services/playlistEngineService.ts` | generatePlaylist، getNextContent، logPlayback، getEngineStatus، startEngine، stopEngine، getPlaybackLogs، generateM3UPlaylist، generateScheduledAdsM3U (M3U + Liquidsoap) |
| **clubRadioService** (تحديث) | `src/domains/club-zone/services/clubRadioService.ts` | getCurrentStream يعيد broadcast_mode، getAllStreams يدعم فلتر broadcast_mode، startLiveStream/stopLiveStream يدعمان النوعين |

---

### 3.3 واجهات المستخدم (Frontend)

| الصفحة/المكون | المسار | الوظائف |
|----------------|--------|---------|
| **Always-On Dashboard** | `src/app/club-zone/radio/always-on/page.tsx` | لوحة حالة البث، بدء/إيقاف، رابط Icecast، عرض المحتوى الحالي/التالي، توليد M3U، روابط M3U (Playlist + Ads)، إحصائيات المستمعين، تبويبات: مكتبة المحتوى، الجدولة، الإعلانات المرئية، الإعدادات |
| **ContentLibrary** | `src/domains/club-zone/components/ContentLibrary.tsx` | عرض المحتوى (Grid)، فلترة حسب النوع والبحث، رفع محتوى جديد، تحرير/حذف، معاينة (حسب التنفيذ) |
| **TimelineEditor** | `src/domains/club-zone/components/TimelineEditor.tsx` | عرض عناصر الجدولة، إضافة/تعديل/حذف، ترتيب (أعلى/أسفل)، اختيار محتوى من المكتبة، قواعد التشغيل (continuous، every_30_minutes، hourly، daily، once)، أولوية |
| **Radio (Live) Page** | `src/app/club-zone/radio/page.tsx` | رابط إلى "فتح البث العام" (`/club-zone/radio/always-on`) |

**ما لم يُنفذ من الخطة في الواجهات:**

- **Stream Output Manager** كصفحة/مكون مستقل لم يُنشأ؛ جزء من الوظيفة موجود داخل Always-On (رابط Icecast وإعدادات البث).

---

### 3.4 واجهات API

| المسار | الوظيفة |
|--------|---------|
| `POST /api/playlist-engine/generate-m3u` | توليد M3U من playlist_timeline وحفظه في Storage (radio-playlists) وإرجاع الرابط العام |
| `POST /api/playlist-engine/scheduled-ads` | توليد M3U للإعلانات المجدولة |
| `GET /api/playlist-engine/status` | حالة البث (Always-On)، المستمعين، المحتوى الحالي/التالي، روابط M3U، ملخص الجدولة |
| `GET /api/radio/now-playing` | المحتوى المعروض حالياً (للموبايل/ويب) مع دعم broadcast_mode |

---

### 3.5 الأنواع (Types)

- في `src/domains/club-zone/types/index.ts`: تمت إضافة `broadcast_mode`, `playlist_engine_url`, `auto_switch_enabled` إلى `ClubActivity` و `RadioStream`.

---

## 4. ما هو ناقص أو مؤجل (وفق تحليل التطبيق والخطة)

### 4.1 البث الفعلي إلى Icecast (خارج التطبيق)

- **الخطة الأصلية:** Playlist Engine يبث فعلياً (PCM/MP3) إلى Icecast.
- **الوضع الحالي:** التطبيق يولد ملفات M3U ويحدّث قاعدة البيانات وحالة البث؛ **البث الفعلي يتم عبر Liquidsoap (خارج هذا المشروع)**.
- **ما يلزم للتوثيق:** توثيق إعداد Liquidsoap لقراءة M3U من الروابط التي يوفرها الـ API (أو من Storage)، والتوصيل إلى Icecast. لا يوجد في المشروع كود Node.js يبث مباشرة إلى Icecast.

### 4.2 مكون Stream Output Manager (من الخطة)

- **الخطة:** "Stream Output Manager" — إدارة قنوات الإخراج (مثلاً Voice + Music / Voice Only).
- **الوضع:** غير منفذ كصفحة أو مكون مستقل. يمكن اعتباره توسيعاً مستقبلاً (قنوات متعددة، إعدادات Icecast من الداشبورد).

### 4.3 التكامل مع Sidebar / التنقل

- **الوضع:** صفحة الراديو تحت `/club-zone/radio` تعرض زر "فتح البث العام" يوجه إلى `/club-zone/radio/always-on`.
- **ما يمكن تحسينه:** إضافة رابط "البث العام المستمر" في القائمة الجانبية (Sidebar) تحت قسم نادي Scope Zone إذا رغبت في وصول أسرع.

### 4.4 حساب المدة تلقائياً عند الرفع

- **الوضع:** في `radioContentService` يوجد دوال مثل `calculateAudioDuration` و `calculateMediaDuration` (Web Audio API).
- **ما يمكن تحسينه:** التأكد من أن نموذج رفع المحتوى في ContentLibrary يستدعيها ويخزن `file_duration_seconds` تلقائياً حتى لا تبقى القيمة 0.

### 4.5 إعادة التشغيل التلقائي لـ Always-On بعد Live Event

- **الخطة:** "بعد انتهاء Live Event، يعود Always-On تلقائياً".
- **الوضع:** Trigger الحالي يوقف Always-On عندما يبدأ Live Event؛ **لا يوجد آلية تلقائية لإعادة تشغيل Always-On عند انتهاء Live Event** (يعتمد على إما Cron/Job يتحقق من نهاية Live Event أو المستخدم يبدأ Always-On يدوياً مرة أخرى).

### 4.6 Real-time للتحديثات على الجدولة والمحتوى

- **الخطة:** "متابعة تغييرات Timeline عبر Supabase Realtime".
- **الوضع:** لم يُضف اشتراك Realtime على `playlist_timeline` أو `radio_content` في الواجهة؛ التحديث يتم عند إعادة تحميل الصفحة أو استدعاء load يدوي.

### 4.7 صلاحيات الأدمن

- **الوضع:** RLS على الجداول وStorage يعتمد على وجود جدول `admins` ومصادقة المستخدم. لم يُراجع في هذا المستند تفصيل صلاحيات "فقط أدمن الراديو" إن وُجدت في المشروع.

### 4.8 اختبارات آلية (Integration / E2E)

- **الخطة:** "اختبار التكامل: Always-On → Live Event → Always-On".
- **الوضع:** لا يوجد في المستند أو في طلبك ذكر وجود اختبارات آلية مكتوبة؛ يُوصى بإضافة اختبارات للتبديل التلقائي وسيناريوهات البدء/الإيقاف.

---

## 5. خريطة الملفات المرجعية

| الغرض | المسار |
|-------|--------|
| Migrations (الجداول + broadcast_mode) | `supabase/migrations/20250123_*.sql` |
| Storage + سياسات RLS للراديو | `supabase/migrations/20250124_radio_storage_and_schema.sql` |
| خدمة المحتوى | `src/domains/club-zone/services/radioContentService.ts` |
| خدمة الجدولة | `src/domains/club-zone/services/playlistTimelineService.ts` |
| خدمة التبديل التلقائي | `src/domains/club-zone/services/autoSwitchService.ts` |
| خدمة محرك القوائم + M3U | `src/domains/club-zone/services/playlistEngineService.ts` |
| خدمة الراديو (محدّثة) | `src/domains/club-zone/services/clubRadioService.ts` |
| صفحة Always-On | `src/app/club-zone/radio/always-on/page.tsx` |
| مكتبة المحتوى | `src/domains/club-zone/components/ContentLibrary.tsx` |
| محرر الجدولة | `src/domains/club-zone/components/TimelineEditor.tsx` |
| توليد M3U | `src/app/api/playlist-engine/generate-m3u/route.ts` |
| إعلانات مجدولة | `src/app/api/playlist-engine/scheduled-ads/route.ts` |
| حالة المحرك | `src/app/api/playlist-engine/status/route.ts` |
| الآن يُبث | `src/app/api/radio/now-playing/route.ts` |

---

## 6. سيرفر Hetzner — متطلبات وحجز وإعداد البث

هذا القسم مرجع لتنفيذ **المرحلة 4** بعد إكمال المراحل 1–3. البث الفعلي (Liquidsoap → Icecast) يعمل على سيرفر مستقل؛ الموصى به هو **حجز VPS على Hetzner** ثم إعداد البيئة كما يلي.

### 6.1 المواصفات المطلوبة للسيرفر (Hetzner)

| البند | التوصية |
|--------|----------|
| **النوع** | VPS (Cloud Server) أو Dedicated حسب الحمل المتوقع |
| **نظام التشغيل** | Ubuntu 22.04 LTS (مُوصى به) أو Debian 12 |
| **الحد الأدنى للموارد** | 2 vCPU، 4 GB RAM، 40 GB SSD (لبداية التشغيل) |
| **الشبكة** | عنوان IP ثابت (يُوفره Hetzner افتراضياً)؛ عرض نطاق كافٍ للبث (مثلاً 128 kbps × عدد المستمعين) |
| **البورتات** | فتح **8000** (Icecast HTTP/Stream) و **8001** إن استخدمت (Icecast Admin) — من لوحة Hetzner Firewall و/أو من جدار النظام على السيرفر |

### 6.2 خطوات حجز السيرفر على Hetzner

1. **الدخول إلى Hetzner:**  
   [https://www.hetzner.com](https://www.hetzner.com) → تسجيل الدخول أو إنشاء حساب.

2. **إنشاء سيرفر جديد:**  
   - من **Cloud** أو **Robot** (حسب نوع الحساب): إنشاء سيرفر جديد (Create Server).  
   - اختيار الموقع (مثلاً Falkenstein أو Nuremberg أو Helsinki).  
   - اختيار الصورة: **Ubuntu 22.04**.  
   - اختيار الحجم: على الأقل CX22 أو ما يعادله (2 vCPU، 4 GB RAM).  
   - إضافة SSH Key للدخول الآمن.  
   - اختيار اسم للسيرفر (مثلاً `radio-karmesh`).

3. **بعد الإنشاء:**  
   - تسجيل **عنوان IP العام** للسيرفر.  
   - الدخول عبر SSH:  
     `ssh root@<IP_ADDRESS>`  
     (أو مستخدم مع صلاحيات sudo).

4. **إعداد Firewall (مهم للبث):**  
   - من لوحة Hetzner: فتح البورت **8000** (TCP) للـ Inbound إن كان هناك جدار ناري على مستوى الحساب.  
   - على السيرفر نفسه: التأكد من أن **ufw** أو **iptables** يسمح بالبورت 8000 إذا كنت تستخدمها.

### 6.3 تثبيت Icecast2 على السيرفر

```bash
# تحديث الحزم
sudo apt update && sudo apt upgrade -y

# تثبيت Icecast2
sudo apt install -y icecast2

# أثناء التثبيت قد يُسأل عن تفعيل Icecast: اختر Yes إن ظهر السؤال
```

**إعداد Icecast:**

- ملف الإعداد عادة: `/etc/icecast2/icecast.xml`
- تعديل على الأقل:
  - `<hostname>`: عنوان IP السيرفر أو الدومين (مثلاً `radio.karmesh.eg` إذا ربطت دومين).
  - `<listen-socket><port>`: `8000`.
  - `<authentication><source-password>` و `<relay-password>` و `<admin-password>`: كلمات مرور قوية وحفظها في مكان آمن.

```bash
sudo systemctl enable icecast2
sudo systemctl start icecast2
sudo systemctl status icecast2
```

التحقق: فتح في المتصفح `http://<IP_SERVER>:8000` — يجب أن تظهر صفحة Icecast.

### 6.4 تثبيت Liquidsoap

```bash
# تثبيت Liquidsoap (من حزم Ubuntu إن وُجدت)
sudo apt install -y liquidsoap

# أو من مصدر/PPA إذا احتجت إصداراً أحدث — راجع التوثيق الرسمي
```

### 6.5 مجلد الملفات وملف M3U

- إنشاء مجلد للراديو (مطابق لما ذُكر في الخطة الثانية):

```bash
sudo mkdir -p /var/radio
sudo chown $USER:$USER /var/radio
```

- ملفات M3U التي يولدها الداشبورد (من API) يمكن:
  - إما أن يُحمّلها **Cron** أو **خدمة وسيطة** من روابط Supabase Storage إلى السيرفر في مسارات ثابتة، مثلاً:
    - `/var/radio/playlist.m3u`
    - `/var/radio/scheduled_ads.m3u`
  - أو أن يقرأ Liquidsoap الملف من **رابط HTTP** (URL لملف M3U عام من Supabase أو من تطبيقك) إذا دعمت إصدارتك ذلك.

### 6.6 سكريبت Liquidsoap (مثال)

ملف على السيرفر، مثلاً `/etc/liquidsoap/radio_karmesh.liq` (أو في مسار تختاره):

```liquidsoap
#!/usr/bin/liquidsoap

# مصدر البث المباشر (إن وُجد — من مصدر خارجي)
# live = input.http("http://...")

# قائمة التشغيل Always-On (يُحدَّث من الداشبورد/API)
playlist = playlist.safe(
  reload_mode="rounds",
  reload=60,
  "/var/radio/playlist.m3u"
)

# إعلانات مجدولة
ads = playlist.safe(
  reload_mode="rounds",
  reload=60,
  "/var/radio/scheduled_ads.m3u"
)

# منطق Fallback: Live ثم Ads ثم Playlist (عدّل حسب الحاجة)
radio = fallback(track_sensitive=false, [ads, playlist])
radio = crossfade(radio)

# الإخراج إلى Icecast
output.icecast(
  %mp3(bitrate=128),
  host="localhost",
  port=8000,
  password="<SOURCE_PASSWORD>",
  mount="/stream",
  radio
)
```

- استبدال `<SOURCE_PASSWORD>` بكلمة مرور المصدر من `icecast.xml`.
- تشغيل Liquidsoap كخدمة (systemd) أو يدوياً للاختبار:
  `liquidsoap /etc/liquidsoap/radio_karmesh.liq`

### 6.7 ربط الداشبورد بالسيرفر

- **رابط الاستماع للمستخدمين (Stream URL):**  
  `http://<IP_SERVER>:8000/stream`  
  أو مع دومين: `http://radio.karmesh.eg:8000/stream`

- في **صفحة Always-On** في الداشبورد:
  - حقل "رابط Icecast" (أو ما يعادله): إدخال الرابط أعلاه.
  - حفظ/بدء البث بحيث يظهر هذا الرابط للموبايل/الويب.

- (اختياري) إذا كان Cron أو خدمة وسيطة يحمّل M3U من API التطبيق إلى السيرفر، تأكد من أن:
  - عنوان M3U الذي يرجعه `generate-m3u` (أو من Storage) متاح للسيرفر (رابط عام).
  - السكريبت على السيرفر يحمّل الملف إلى `/var/radio/playlist.m3u` (والمسار الآخر للإعلانات) بشكل دوري.

### 6.8 ملخص خطوات ما بعد الحجز

| الترتيب | المهمة |
|---------|--------|
| 1 | حجز VPS على Hetzner (Ubuntu 22.04، مواصفات 6.1) |
| 2 | فتح البورت 8000 وربط الدومين إن وُجد |
| 3 | تثبيت Icecast2 وتعديل `icecast.xml` وتشغيل الخدمة |
| 4 | تثبيت Liquidsoap وإنشاء مجلد `/var/radio` |
| 5 | وضع سكريبت Liquidsoap وتشغيله (أو تشغيله كخدمة) |
| 6 | إعداد تحميل M3U من API/Storage إلى `/var/radio/` (Cron أو أداة أخرى) |
| 7 | تحديث رابط Icecast في داشبورد Always-On واختبار الاستماع |

---

## 7. الخطوات الموصى بها لإكمال النظام (مرجع تنفيذ)

**الوضع الحالي:** المراحل 1 و 2 و 3 من الخطة مُكتملة. الخطوة التالية هي **حجز سيرفر Hetzner وإعداد البث** (القسم 6 أعلاه)، ثم إكمال التكامل والتحسينات أدناه.

### 7.1 أولوية فورية (بعد حجز Hetzner)

1. **حجز وإعداد سيرفر Hetzner**  
   اتباع **القسم 6** بالكامل: الحجز، تثبيت Icecast2 و Liquidsoap، إنشاء `/var/radio`، وضع سكريبت Liquidsoap، فتح البورت 8000.

2. **ربط الداشبورد بالسيرفر**  
   في صفحة Always-On إدخال رابط البث النهائي (مثلاً `http://<IP>:8000/stream`) وحفظه؛ التأكد من أن الموبايل/الويب يستخدمان هذا الرابط.

3. **تحميل M3U إلى السيرفر**  
   إما Cron يستدعي API التطبيق ويحمّل الملف الناتج إلى `/var/radio/playlist.m3u` (والإعلانات إن وُجدت)، أو أداة وسيطة تقوم بذلك؛ التأكد من تحديث الملفات دورياً (مثلاً كل دقيقة كما في الخطة الثانية).

### 7.2 قصيرة الأجل (للاستخدام الفعلي)

4. **التأكد من تطبيق الـ migrations بالترتيب**  
   تشغيل `20250123_create_always_on_stream_schema.sql` و `20250123_add_broadcast_mode_to_club_activities.sql` و `20250124_radio_storage_and_schema.sql` (مع حل أي تعارض في تعريف الجداول إن وُجد).

5. **ربط حساب المدة بالرفع**  
   في واجهة رفع المحتوى (ContentLibrary أو النموذج المرتبط)، استدعاء `calculateAudioDuration` (أو المناسب للفيديو) وحفظ `file_duration_seconds` في `radio_content` بعد الرفع.

6. **إضافة رابط Always-On في القائمة الجانبية**  
   في `Sidebar` أو ما يعادله، إضافة عنصر "البث العام المستمر" يوجه إلى `/club-zone/radio/always-on`.

### 7.3 متوسطة الأجل (تحسينات)

7. **إعادة تشغيل Always-On بعد Live Event**  
   - إما: Cron/Job يتحقق دورياً من انتهاء آخر Live Event ويشغّل Always-On إن كان مفترضاً أن يعود تلقائياً.  
   - أو: عند استدعاء `stopLiveStream` لـ activity من نوع live_event، استدعاء منطق يتحقق إن كان يجب إعادة تشغيل Always-On.

8. **Real-time للجدولة والمحتوى**  
   استخدام Supabase Realtime للاشتراك في تغييرات `playlist_timeline` و/أو `radio_content` في Always-On Dashboard وتحديث الواجهة دون إعادة تحميل كاملة.

9. **مكون Stream Output Manager (اختياري)**  
   إذا احتجت قنوات إخراج متعددة أو إعدادات Icecast من الداشبورد، إنشاء صفحة/مكون لإدارة "قنوات الإخراج" وربطها بالإعدادات أو بالـ API.

### 7.4 طويلة الأجل (اختياري)

10. **اختبارات تكامل وسيناريوهات E2E**  
    لسيناريوهات: بدء Always-On، بدء Live Event (والتأكد من إيقاف Always-On)، إيقاف Live Event، وإعادة Always-On إن وُجدت آلية لذلك.

11. **مراجعة الصلاحيات**  
    التأكد من أن فقط الأدوار المطلوبة (مثل أدمن الراديو) يمكنهم إدارة المحتوى والجدولة وبدء/إيقاف البث.

12. **مراقبة وسجلات**  
    استخدام `playlist_logs` وربما سجلات إضافية لمراقبة التشغيل الفعلي وعدد المستمعين وتقارير الاستماع.

---

## 8. سيناريوهات الاستخدام (للتحقق اليدوي)

| السيناريو | الخطوات | ما يجب التحقق منه |
|------------|---------|-------------------|
| تشغيل Always-On | الدخول إلى Always-On → إدخال رابط Icecast → بدء البث → (اختياري) توليد M3U | ظهور "البث نشط"، ظهور روابط M3U، تحديث المحتوى الحالي/التالي |
| إيقاف Always-On | من نفس الصفحة → إيقاف البث | عودة الحالة إلى "متوقف" |
| إضافة محتوى وجدولة | تبويب مكتبة المحتوى → رفع ملف → تبويب الجدولة → إضافة عنصر وربطه بالمحتوى | ظهور المحتوى في القائمة وفي الجدولة، وحفظ المدة إن تم ربط الحساب |
| التبديل عند Live Event | من صفحة البث المباشر (Live) بدء بث حي | من قاعدة البيانات أو الواجهة: Always-On يصبح غير نشط (is_live=false) إذا كان التبديل التلقائي مفعّلاً |
| الاستماع من الموبايل/ويب | استخدام رابط Icecast في تطبيق استماع | وصول البث عند تشغيل Liquidsoap وربطه بـ M3U الصادر من التطبيق |

---

## 9. الخلاصة

- **تم تنفيذ (المراحل 1–3):** قاعدة البيانات (جداول + broadcast_mode + Storage + RLS)، كل الخدمات الأساسية (محتوى، جدولة، تبديل تلقائي، محرك قوائم + M3U)، واجهة Always-On مع مكتبة المحتوى ومحرر الجدولة، وواجهات API للتوليد والحالة و now-playing. وفق الخطتين في `.cursor/plans/` المرحلة الأولى والثانية والثالثة مُكتملة.
- **الخطوة التالية:** حجز سيرفر على **Hetzner** وإعداد بيئة البث (Icecast2، Liquidsoap، مجلد الملفات، البورت 8000) وربط الداشبورد برابط البث — راجع **القسم 6**.
- **ناقص أو مؤجل بعد السيرفر:** مكون Stream Output Manager المستقل، إعادة تشغيل Always-On تلقائياً بعد Live Event، Real-time للجدولة، وربط حساب المدة بالرفع إن لم يكن مكتملاً.
- **هذا المستند** يصلح كمرجع واحد للتنفيذ والإكمال والصيانة؛ يُحدَّث عند تنفيذ أي من الخطوات أعلاه أو تغيير المعمارية.

---

**آخر تحديث للمستند:** 2025-01-23 (إصدار 1.1 — إضافة مرجع Hetzner وتحديث حالة المراحل 1–3)
