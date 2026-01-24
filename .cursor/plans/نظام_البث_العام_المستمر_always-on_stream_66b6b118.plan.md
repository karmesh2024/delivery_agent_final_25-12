---
name: نظام البث العام المستمر Always-On Stream
overview: "تنفيذ نظام بث عام مستمر 24/7 يدير Playlist تلقائي من Clips/Music/Ads، مع التبديل التلقائي للبث الأسبوعي المباشر عند الحاجة. النظام يتكون من: قاعدة بيانات للمحتوى والجدولة، Playlist Engine (Backend)، Dashboard لإدارة المحتوى والجدولة، ونظام تبديل تلقائي بين Always-On و Live Event."
todos:
  - id: db-schema
    content: "إنشاء جداول قاعدة البيانات: radio_content, playlist_timeline, playlist_logs + تحديث club_activities"
    status: completed
  - id: content-service
    content: تنفيذ radioContentService.ts لإدارة المحتوى (رفع، جلب، تحديث، حذف)
    status: completed
  - id: timeline-service
    content: تنفيذ playlistTimelineService.ts لإدارة الجدولة والترتيب
    status: completed
  - id: auto-switch-service
    content: تنفيذ autoSwitchService.ts للتبديل التلقائي بين Always-On و Live Event
    status: completed
  - id: content-library-ui
    content: بناء ContentLibrary component لعرض وإدارة Clips/Music/Ads
    status: completed
  - id: always-on-dashboard
    content: بناء Always-On Dashboard page مع Status Panel و Content Library
    status: completed
  - id: timeline-editor
    content: بناء TimelineEditor component للجدولة البصرية
    status: completed
  - id: playlist-engine
    content: تنفيذ playlistEngineService.ts لتوليد Playlist وإرسال Stream إلى Icecast
    status: completed
  - id: update-radio-service
    content: تحديث clubRadioService.ts لدعم broadcast_mode
    status: completed
  - id: integration-testing
    content: "اختبار التكامل الكامل: Always-On → Live Event → Always-On"
    status: completed
isProject: false
---

# خطة تنفيذ نظام البث العام المستمر (Always-On Stream)

## 🏗️ البنية المعمارية

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
│  │              │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Playlist Engine (Backend Service)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Timeline      │  │Scheduler     │  │Auto Switch   │     │
│  │Manager       │  │              │  │Controller    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓ (PCM/MP3 Stream)
┌─────────────────────────────────────────────────────────────┐
│                    Icecast Server                            │
│              (Output: http://radio.karmesh.eg:8000/stream)  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Mobile App / Web Players                         │
└─────────────────────────────────────────────────────────────┘
```

## 📋 المراحل التنفيذية

### المرحلة 1: قاعدة البيانات (Database Schema)

#### 1.1 جدول `radio_content` (مكتبة المحتوى)

```sql
CREATE TABLE radio_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('clip', 'music', 'ad', 'announcement')),
  file_url TEXT NOT NULL,
  file_duration_seconds INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  -- Metadata مثال: {"tags": ["comedy"], "allow_music_overlay": true, "priority": "high"}
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES new_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**الحقول:**

- `content_type`: نوع المحتوى (clip, music, ad, announcement)
- `file_url`: رابط الملف في Supabase Storage
- `file_duration_seconds`: مدة الملف بالثواني
- `metadata`: معلومات إضافية (tags, priority, allow_music_overlay)

#### 1.2 جدول `playlist_timeline` (جدولة البث)

```sql
CREATE TABLE playlist_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES radio_content(id) ON DELETE CASCADE,
  play_order INTEGER NOT NULL,
  scheduled_time TIME,  -- وقت محدد (مثل 10:00:00)
  play_rule VARCHAR(50), -- 'every_30_minutes', 'hourly', 'daily', 'once'
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.3 تحديث `club_activities` لدعم Always-On

```sql
ALTER TABLE club_activities 
ADD COLUMN IF NOT EXISTS broadcast_mode VARCHAR(20) DEFAULT 'live_event' 
  CHECK (broadcast_mode IN ('live_event', 'always_on')),
ADD COLUMN IF NOT EXISTS playlist_engine_url TEXT,
ADD COLUMN IF NOT EXISTS auto_switch_enabled BOOLEAN DEFAULT TRUE;
```

**المنطق:**

- `broadcast_mode = 'live_event'`: البث الأسبوعي المباشر (موجود)
- `broadcast_mode = 'always_on'`: البث العام المستمر (جديد)
- عند `is_live = true` و `broadcast_mode = 'always_on'`: Playlist Engine يعمل
- عند `is_live = true` و `broadcast_mode = 'live_event'`: Microphone يعمل

#### 1.4 جدول `playlist_logs` (سجلات التشغيل)

```sql
CREATE TABLE playlist_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES radio_content(id),
  played_at TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INTEGER,
  listeners_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### المرحلة 2: Backend Services

#### 2.1 Content Library Service

**الملف:** `src/domains/club-zone/services/radioContentService.ts`

**الوظائف:**

- `uploadContent()`: رفع ملفات (Clips, Music, Ads)
- `getAllContent()`: جلب جميع المحتويات مع فلترة
- `updateContent()`: تحديث معلومات المحتوى
- `deleteContent()`: حذف المحتوى
- `getContentByType()`: جلب المحتوى حسب النوع

#### 2.2 Playlist Timeline Service

**الملف:** `src/domains/club-zone/services/playlistTimelineService.ts`

**الوظائف:**

- `createTimelineItem()`: إضافة عنصر للجدولة
- `getCurrentPlaylist()`: جلب Playlist الحالي للبث
- `updatePlaylistOrder()`: تحديث ترتيب العناصر
- `getNextContent()`: الحصول على المحتوى التالي حسب القواعد

#### 2.3 Auto Switch Controller

**الملف:** `src/domains/club-zone/services/autoSwitchService.ts`

**المنطق:**

```typescript
async function checkAndSwitch() {
  // 1. التحقق من وجود Live Event نشط
  const liveEvent = await getActiveLiveEvent();
  
  if (liveEvent && liveEvent.is_live) {
    // 2. إذا كان Live Event نشط → إيقاف Always-On
    await stopAlwaysOnStream();
    await switchToLiveEvent(liveEvent);
  } else {
    // 3. إذا لم يكن Live Event → تشغيل Always-On
    await startAlwaysOnStream();
  }
}
```

### المرحلة 3: Frontend Dashboard

#### 3.1 Always-On Dashboard

**الملف:** `src/app/club-zone/radio/always-on/page.tsx`

**المكونات:**

- **Status Panel**: حالة البث (Active/Inactive)
- **Content Library Panel**: عرض وإدارة Clips/Music/Ads
- **Timeline Editor**: جدولة المحتوى
- **Scheduler Panel**: قواعد التشغيل (every_30_minutes, hourly, etc.)
- **Stream Output Manager**: إدارة قنوات الإخراج

#### 3.2 Content Library Component

**الملف:** `src/domains/club-zone/components/ContentLibrary.tsx`

**الميزات:**

- عرض المحتوى في Grid/List
- فلترة حسب النوع (Clips, Music, Ads)
- رفع ملفات جديدة
- معاينة الملفات
- تحرير Metadata

#### 3.3 Timeline Editor Component

**الملف:** `src/domains/club-zone/components/TimelineEditor.tsx`

**الميزات:**

- عرض Timeline بصري (Timeline Bar)
- Drag & Drop لإعادة الترتيب
- إضافة/حذف عناصر
- تحديد قواعد التشغيل (Rules)

### المرحلة 4: Playlist Engine (Backend Service)

#### 4.1 Playlist Engine Service

**الملف:** `src/domains/club-zone/services/playlistEngineService.ts`

**الوظائف:**

- `generatePlaylist()`: توليد Playlist من Timeline
- `getNextItem()`: الحصول على العنصر التالي
- `playContent()`: تشغيل ملف صوتي
- `streamToIcecast()`: إرسال Stream إلى Icecast

#### 4.2 Integration with Icecast

- استخدام `node-icecast` أو `liquidsoap` للبث
- إرسال PCM/MP3 Stream إلى Icecast Server
- معالجة التبديل بين Always-On و Live Event

### المرحلة 5: التكامل مع النظام الحالي

#### 5.1 تحديث Radio Service

**الملف:** `src/domains/club-zone/services/clubRadioService.ts`

**التحديثات:**

- `getCurrentStream()`: يدعم `broadcast_mode`
- `startLiveStream()`: يتحقق من `broadcast_mode`
- `stopLiveStream()`: يتحقق من Auto Switch

#### 5.2 تحديث Radio Page

**الملف:** `src/app/club-zone/radio/page.tsx`

**التحديثات:**

- إضافة Tab للتبديل بين Live Event و Always-On
- عرض حالة البث الحالي (Live Event أو Always-On)
- زر للتبديل اليدوي (إذا لزم الأمر)

## 📁 الملفات المطلوبة

### قاعدة البيانات

- `supabase/migrations/YYYYMMDD_create_always_on_stream_schema.sql`
- `supabase/migrations/YYYYMMDD_add_broadcast_mode_to_club_activities.sql`

### Services

- `src/domains/club-zone/services/radioContentService.ts` (جديد)
- `src/domains/club-zone/services/playlistTimelineService.ts` (جديد)
- `src/domains/club-zone/services/autoSwitchService.ts` (جديد)
- `src/domains/club-zone/services/playlistEngineService.ts` (جديد)
- `src/domains/club-zone/services/clubRadioService.ts` (تحديث)

### Components

- `src/app/club-zone/radio/always-on/page.tsx` (جديد)
- `src/domains/club-zone/components/ContentLibrary.tsx` (جديد)
- `src/domains/club-zone/components/TimelineEditor.tsx` (جديد)
- `src/domains/club-zone/components/StreamOutputManager.tsx` (جديد)
- `src/app/club-zone/radio/page.tsx` (تحديث)

### Types

- `src/domains/club-zone/types/index.ts` (إضافة أنواع جديدة)

## 🔄 سيناريوهات الاستخدام

### السيناريو 1: تشغيل Always-On Stream

1. الأدمن يفتح Always-On Dashboard
2. يرفع Clips/Music/Ads
3. ينشئ Timeline (ترتيب + قواعد)
4. يضغط "Start Always-On Stream"
5. Playlist Engine يبدأ البث إلى Icecast
6. المستخدمون يستمعون عبر Mobile/Web

### السيناريو 2: التبديل التلقائي للبث الأسبوعي

1. Always-On Stream يعمل
2. الأدمن يبدأ Live Event من Dashboard
3. Auto Switch Controller يكتشف `is_live = true` و `broadcast_mode = 'live_event'`
4. يتوقف Always-On تلقائياً
5. يبدأ Live Event (Microphone)
6. بعد انتهاء Live Event، يعود Always-On تلقائياً

### السيناريو 3: إدارة المحتوى

1. الأدمن يفتح Content Library
2. يرفع ملف جديد (Clip/Music/Ad)
3. يضيف Metadata (tags, priority)
4. يضيف العنصر للـ Timeline
5. يحدد قواعد التشغيل (every_30_minutes, hourly)

## ⚠️ ملاحظات تقنية

1. **Supabase Storage**: تخزين ملفات Clips/Music/Ads
2. **Real-time Updates**: متابعة تغييرات Timeline عبر Supabase Realtime
3. **Playlist Engine**: يمكن تنفيذه كـ Node.js Service منفصل أو كجزء من Backend
4. **Icecast Integration**: استخدام `node-icecast` أو `liquidsoap` للبث
5. **Auto Switch**: يجب أن يكون موثوقاً - استخدام Database Triggers + Backend Service

## 🎯 الأولويات

1. **Phase 1**: قاعدة البيانات + Content Library Service
2. **Phase 2**: Always-On Dashboard + Content Library UI
3. **Phase 3**: Timeline Editor + Scheduler
4. **Phase 4**: Playlist Engine + Icecast Integration
5. **Phase 5**: Auto Switch Controller + التكامل النهائي