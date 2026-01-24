# حالة تنفيذ نظام البث العام المستمر (Always-On Stream)

**التاريخ:** 2025-01-24  
**الإصدار:** V1.0  
**المرجع:** `.cursor/plans/نظام_البث_العام_المستمر_always-on_stream_66b6b118.plan.md`

---

## ✅ ما تم تنفيذه (Completed)

### 1. قاعدة البيانات (Database Schema) ✅

#### ✅ جداول قاعدة البيانات
- ✅ **`radio_content`** - مكتبة المحتوى (Clips, Music, Ads, Announcements)
- ✅ **`playlist_timeline`** - جدولة البث (ترتيب + قواعد التشغيل)
- ✅ **`playlist_logs`** - سجلات التشغيل
- ✅ **تحديث `club_activities`** - إضافة `broadcast_mode`, `playlist_engine_url`, `auto_switch_enabled`

**الملفات:**
- ✅ `supabase/migrations/20250123_create_always_on_stream_schema.sql`
- ✅ `supabase/migrations/20250123_add_broadcast_mode_to_club_activities.sql`

**الميزات:**
- ✅ RLS Policies للجداول
- ✅ Indexes للأداء
- ✅ Triggers للتبديل التلقائي
- ✅ Database Functions (`get_current_broadcast_mode`, `check_and_switch_broadcast`)

---

### 2. Backend Services ✅

#### ✅ Content Library Service
**الملف:** `src/domains/club-zone/services/radioContentService.ts`

**الوظائف المنفذة:**
- ✅ `uploadContent()` - رفع ملفات (Clips, Music, Ads)
- ✅ `getAllContent()` - جلب جميع المحتويات مع فلترة
- ✅ `updateContent()` - تحديث معلومات المحتوى
- ✅ `deleteContent()` - حذف المحتوى
- ✅ `getContentByType()` - جلب المحتوى حسب النوع

#### ✅ Playlist Timeline Service
**الملف:** `src/domains/club-zone/services/playlistTimelineService.ts`

**الوظائف المنفذة:**
- ✅ `createTimelineItem()` - إضافة عنصر للجدولة
- ✅ `getCurrentPlaylist()` - جلب Playlist الحالي للبث
- ✅ `updatePlaylistOrder()` - تحديث ترتيب العناصر
- ✅ `getNextContent()` - الحصول على المحتوى التالي حسب القواعد
- ✅ `generatePlaylist()` - توليد Playlist من Timeline

#### ✅ Auto Switch Service
**الملف:** `src/domains/club-zone/services/autoSwitchService.ts`

**الوظائف المنفذة:**
- ✅ `getBroadcastStatus()` - الحصول على حالة البث الحالية
- ✅ `checkAndSwitch()` - التحقق والتبديل التلقائي
- ✅ `startAlwaysOnStream()` - بدء Always-On Stream
- ✅ `stopAlwaysOnStream()` - إيقاف Always-On Stream
- ✅ `switchToLiveEvent()` - التبديل إلى Live Event
- ✅ `switchToAlwaysOn()` - التبديل إلى Always-On
- ✅ `setAutoSwitchEnabled()` - تفعيل/تعطيل Auto Switch
- ✅ `createAlwaysOnActivity()` - إنشاء Always-On Activity

#### ⚠️ Playlist Engine Service (جزئي)
**الملف:** `src/domains/club-zone/services/playlistEngineService.ts`

**الوظائف المنفذة:**
- ✅ `generatePlaylist()` - توليد Playlist من Timeline
- ✅ `getNextContent()` - الحصول على المحتوى التالي
- ✅ `logPlayback()` - تسجيل تشغيل محتوى
- ✅ `getEngineStatus()` - الحصول على حالة Playlist Engine
- ✅ `getPlaybackLogs()` - الحصول على سجلات التشغيل

**الوظائف المعلقة (TODO):**
- ⚠️ `startEngine()` - **يحتاج Backend Service منفصل** لبدء البث الفعلي إلى Icecast
- ⚠️ `stopEngine()` - **يحتاج Backend Service منفصل** لإيقاف البث الفعلي

---

### 3. Frontend Dashboard ✅

#### ✅ Always-On Dashboard
**الملف:** `src/app/club-zone/radio/always-on/page.tsx`

**المكونات المنفذة:**
- ✅ **Status Panel** - حالة البث (Active/Inactive)
- ✅ **Content Library Panel** - عرض وإدارة Clips/Music/Ads
- ✅ **Timeline Editor** - جدولة المحتوى
- ✅ **Settings Panel** - إعدادات التبديل التلقائي
- ✅ **Icecast URL Manager** - إدارة رابط Icecast Server

#### ✅ Content Library Component
**الملف:** `src/domains/club-zone/components/ContentLibrary.tsx`

**الميزات المنفذة:**
- ✅ عرض المحتوى في Grid/List
- ✅ فلترة حسب النوع (Clips, Music, Ads)
- ✅ رفع ملفات جديدة
- ✅ معاينة الملفات
- ✅ تحرير Metadata
- ✅ حذف المحتوى

#### ✅ Timeline Editor Component
**الملف:** `src/domains/club-zone/components/TimelineEditor.tsx`

**الميزات المنفذة:**
- ✅ عرض Timeline بصري
- ✅ إضافة/حذف عناصر
- ✅ تحديد قواعد التشغيل (Rules)
- ✅ تحديث ترتيب العناصر

---

### 4. التكامل مع النظام الحالي ✅

#### ✅ تحديث Radio Service
**الملف:** `src/domains/club-zone/services/clubRadioService.ts`

**التحديثات المنفذة:**
- ✅ `getCurrentStream()` - يدعم `broadcast_mode`
- ✅ `startLiveStream()` - يتحقق من `broadcast_mode`
- ✅ `stopLiveStream()` - يتحقق من Auto Switch

#### ✅ تحديث Radio Pages
- ✅ `src/app/club-zone/radio/page.tsx` - صفحة وسيطة مع بطاقتي البث المباشر والبث العام
- ✅ `src/app/club-zone/radio/live/page.tsx` - صفحة البث المباشر الأسبوعي
- ✅ `src/app/club-zone/radio/always-on/page.tsx` - صفحة البث العام

---

## ⚠️ ما لم يتم تنفيذه (Missing / Incomplete)

### 1. Playlist Engine Backend Service ❌

**المشكلة:**  
`playlistEngineService.ts` يحتوي على وظائف `startEngine()` و `stopEngine()` لكنها **لا تقوم بالبث الفعلي** إلى Icecast Server.

**ما المطلوب:**

#### أ) إنشاء Backend Service منفصل

**الخيارات:**

**الخيار 1: Next.js API Routes** (موصى به للبداية)
```
src/app/api/playlist-engine/
  ├── start/route.ts      - بدء البث
  ├── stop/route.ts       - إيقاف البث
  ├── status/route.ts     - حالة البث
  └── next-item/route.ts  - الحصول على المحتوى التالي
```

**الخيار 2: Node.js Service منفصل** (للمستقبل)
```
playlist-engine-service/
  ├── index.ts            - Main service
  ├── icecast-client.ts   - اتصال Icecast
  ├── audio-player.ts     - تشغيل الملفات
  └── scheduler.ts        - جدولة التشغيل
```

#### ب) المكتبات المطلوبة

```bash
npm install node-icecast fluent-ffmpeg node-fetch
# أو
npm install liquidsoap-client
```

#### ج) الوظائف المطلوبة

1. **تحميل الملفات من Supabase Storage**
   ```typescript
   async function downloadAudioFile(fileUrl: string): Promise<Buffer> {
     // تحميل الملف من Supabase Storage
   }
   ```

2. **البث إلى Icecast**
   ```typescript
   async function streamToIcecast(audioBuffer: Buffer, icecastUrl: string) {
     // إرسال Stream إلى Icecast Server
   }
   ```

3. **جدولة التشغيل**
   ```typescript
   async function schedulePlayback() {
     // قراءة Timeline من قاعدة البيانات
     // تشغيل الملفات حسب الترتيب والقواعد
     // تسجيل التشغيل في playlist_logs
   }
   ```

---

### 2. Stream Output Manager Component ❌

**المشكلة:**  
الخطة تتضمن `StreamOutputManager.tsx` لكنه **غير موجود**.

**ما المطلوب:**

**الملف:** `src/domains/club-zone/components/StreamOutputManager.tsx`

**الميزات المطلوبة:**
- عرض قنوات الإخراج المتاحة
- إدارة إعدادات Icecast Server
- اختبار الاتصال بـ Icecast
- عرض حالة البث (Connected/Disconnected)
- إحصائيات البث (Bitrate, Listeners, etc.)

---

### 3. Integration Testing ⚠️

**المشكلة:**  
الخطة تشير إلى "اختبار التكامل الكامل" لكنه **غير موثق**.

**ما المطلوب:**

#### أ) اختبارات يدوية

1. **اختبار Always-On → Live Event → Always-On**
   - بدء Always-On Stream
   - بدء Live Event
   - التحقق من إيقاف Always-On تلقائياً
   - إيقاف Live Event
   - التحقق من عودة Always-On تلقائياً

2. **اختبار Content Library**
   - رفع ملفات (Clips, Music, Ads)
   - إضافة للـ Timeline
   - التحقق من التشغيل

3. **اختبار Timeline Editor**
   - إضافة عناصر
   - تغيير الترتيب
   - تحديد قواعد التشغيل

#### ب) اختبارات تلقائية (اختياري)

```typescript
// tests/integration/always-on-stream.test.ts
describe('Always-On Stream Integration', () => {
  it('should switch from Always-On to Live Event', async () => {
    // ...
  });
});
```

---

## 📋 ما المطلوب منك (Action Items)

### الأولوية العالية (High Priority)

#### 1. تنفيذ Playlist Engine Backend Service ⚠️

**الخطوات:**

1. **إنشاء API Routes:**
   ```
   src/app/api/playlist-engine/
     ├── start/route.ts
     ├── stop/route.ts
     └── status/route.ts
   ```

2. **تثبيت المكتبات:**
   ```bash
   npm install node-icecast fluent-ffmpeg
   # أو استخدام liquidsoap
   ```

3. **تنفيذ الوظائف:**
   - تحميل الملفات من Supabase Storage
   - البث إلى Icecast Server
   - جدولة التشغيل من Timeline
   - تسجيل التشغيل في `playlist_logs`

4. **تحديث `playlistEngineService.ts`:**
   - إزالة TODO comments
   - استدعاء API Routes بدلاً من التعليقات

**المرجع:**  
راجع الملاحظات في `src/domains/club-zone/services/playlistEngineService.ts` (السطور 202-222)

---

#### 2. إنشاء Stream Output Manager Component ⚠️

**الملف:** `src/domains/club-zone/components/StreamOutputManager.tsx`

**الميزات المطلوبة:**
- عرض قنوات الإخراج (Icecast URLs)
- إضافة/حذف/تحديث قنوات
- اختبار الاتصال
- عرض حالة البث
- إحصائيات البث

**التكامل:**
- إضافة Tab في `always-on/page.tsx`:
  ```tsx
  <TabsTrigger value="output">إدارة الإخراج</TabsTrigger>
  <TabsContent value="output">
    <StreamOutputManager />
  </TabsContent>
  ```

---

### الأولوية المتوسطة (Medium Priority)

#### 3. تحسين Timeline Editor ⚠️

**التحسينات المطلوبة:**
- ✅ Drag & Drop لإعادة الترتيب (قد يكون موجوداً - يرجى التحقق)
- عرض Timeline بصري (Timeline Bar) - **يحتاج تحسين**
- معاينة المحتوى قبل الإضافة

---

#### 4. إضافة Real-time Updates ⚠️

**المطلوب:**
- Real-time subscription لتحديثات `playlist_timeline`
- Real-time subscription لتحديثات `playlist_logs`
- تحديث Status Panel تلقائياً

**المرجع:**  
راجع كيفية تنفيذ Real-time في `src/app/club-zone/radio/live/page.tsx`

---

### الأولوية المنخفضة (Low Priority)

#### 5. تحسينات UI/UX

- إضافة Loading States
- إضافة Error Handling أفضل
- تحسين Responsive Design
- إضافة Animations

#### 6. Documentation

- توثيق API Routes
- توثيق Backend Service
- دليل المستخدم للـ Dashboard

---

## 🎯 خطة التنفيذ المقترحة

### المرحلة 1: Playlist Engine Backend (أسبوع 1)

1. **اليوم 1-2:** إنشاء API Routes الأساسية
2. **اليوم 3-4:** تنفيذ تحميل الملفات من Supabase Storage
3. **اليوم 5:** تنفيذ البث إلى Icecast
4. **اليوم 6-7:** اختبار وتصحيح الأخطاء

### المرحلة 2: Stream Output Manager (أسبوع 2)

1. **اليوم 1-2:** إنشاء Component
2. **اليوم 3-4:** التكامل مع Always-On Dashboard
3. **اليوم 5:** اختبار

### المرحلة 3: التحسينات (أسبوع 3)

1. Real-time Updates
2. تحسين Timeline Editor
3. اختبار التكامل الكامل

---

## 📊 ملخص الحالة

| المكون | الحالة | النسبة |
|--------|--------|--------|
| **قاعدة البيانات** | ✅ مكتمل | 100% |
| **Backend Services** | ⚠️ جزئي | 80% |
| **Frontend Dashboard** | ✅ مكتمل | 95% |
| **Playlist Engine** | ❌ غير منفذ | 0% |
| **Stream Output Manager** | ❌ غير موجود | 0% |
| **Integration Testing** | ⚠️ غير موثق | 30% |

**الإجمالي:** ~70% مكتمل

---

## 🔗 روابط مفيدة

### الملفات الرئيسية

- **الخطة الأصلية:** `.cursor/plans/نظام_البث_العام_المستمر_always-on_stream_66b6b118.plan.md`
- **Always-On Dashboard:** `src/app/club-zone/radio/always-on/page.tsx`
- **Playlist Engine Service:** `src/domains/club-zone/services/playlistEngineService.ts`
- **Auto Switch Service:** `src/domains/club-zone/services/autoSwitchService.ts`

### المكتبات المقترحة

- **node-icecast:** https://www.npmjs.com/package/node-icecast
- **fluent-ffmpeg:** https://www.npmjs.com/package/fluent-ffmpeg
- **liquidsoap:** https://www.liquidsoap.info/

---

## 📝 ملاحظات مهمة

1. **Playlist Engine Backend Service** هو **الأولوية القصوى** - بدونها النظام لا يعمل بشكل كامل.

2. **Icecast Server** يجب أن يكون متاحاً ومهيأ قبل البدء.

3. **Supabase Storage** يجب أن يكون مهيأ لحفظ ملفات Clips/Music/Ads.

4. **Real-time Updates** مهمة لتحسين تجربة المستخدم.

5. **Integration Testing** ضروري قبل الإطلاق.

---

**آخر تحديث:** 2025-01-24  
**المسؤول:** [اسمك]  
**الحالة:** ⚠️ **قيد التنفيذ** - يحتاج Playlist Engine Backend Service
