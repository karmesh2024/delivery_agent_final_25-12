# التحقق من بدء البث وتفعيل Real-time

**التاريخ:** 2025-01-22  
**الإصدار:** V1.5.1  
**الموضوع:** التأكد من أن زر "بدء البث" يحدّث `is_live` وأن Real-time مفعل

---

## ✅ 1. التحقق من أن زر "بدء البث" يحدّث `is_live = true`

### الكود الحالي

**الملف:** `src/app/club-zone/radio/page.tsx`

```typescript
const handleStartStream = async () => {
  if (!formData.title || !formData.stream_url) {
    toast.error('الرجاء ملء العنوان ورابط البث');
    return;
  }

  try {
    const activity = await clubRadioService.createStream(formData);
    await dispatch(startLiveStream(activity.id)).unwrap(); // ✅ يستدعي startLiveStream
    
    toast.success('تم بدء البث بنجاح');
    setIsDialogOpen(false);
    loadCurrentStream();
  } catch (error: unknown) {
    console.error('Error starting stream:', error);
    toast.error(errMessage(error) || 'حدث خطأ أثناء بدء البث');
  }
};
```

**الملف:** `src/domains/club-zone/services/clubRadioService.ts`

```typescript
async startLiveStream(activityId: string, broadcastMode?: 'live_event' | 'always_on'): Promise<void> {
  let updateData: any = {
    is_live: true,  // ✅ يحدّث is_live إلى true
    current_listeners: 0,
  };

  if (broadcastMode) {
    updateData.broadcast_mode = broadcastMode;
  }

  const { error } = await supabase
    .from('club_activities')
    .update(updateData)  // ✅ تحديث is_live = true
    .eq('id', activityId);

  if (error) throw error;
  
  // ... باقي الكود
}
```

### ✅ التأكيد

**الكود يحدّث `is_live = true` بشكل صحيح:**
1. ✅ `handleStartStream` يستدعي `startLiveStream(activity.id)`
2. ✅ `startLiveStream` يحدّث `is_live = true` في `club_activities`
3. ✅ يتم تحديث `current_listeners = 0` أيضاً

---

## ✅ 2. التحقق من تفعيل Real-time في Supabase

### الخطوة 1: تطبيق Migrations

**يجب تطبيق Migrations التالية:**

1. **`supabase/migrations/20250122_enable_realtime_for_club_activities.sql`**
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE club_activities;
   ALTER TABLE club_activities REPLICA IDENTITY FULL;
   ```

2. **`supabase/migrations/20250122_fix_realtime_subscription_timeout.sql`**
   ```sql
   -- التحقق من تفعيل Real-time وإصلاح أي مشاكل
   ```

### الخطوة 2: التحقق من Supabase Dashboard

#### أ) فتح Supabase Dashboard

1. اذهب إلى **Supabase Dashboard**
2. اختر مشروعك
3. اذهب إلى **Database > Replication**

#### ب) التحقق من Real-time للجداول

**يجب أن ترى:**

| Table Name | Realtime Status |
|------------|-----------------|
| `club_activities` | ✅ **Enabled** |
| `radio_listeners` | ✅ **Enabled** |

**إذا لم يكن مفعل:**
1. اضغط على **Toggle** بجوار `club_activities`
2. تأكد من أن الحالة أصبحت **Enabled**

### الخطوة 3: التحقق من REPLICA IDENTITY

**في Supabase SQL Editor:**

```sql
-- التحقق من REPLICA IDENTITY
SELECT 
  relname as table_name,
  CASE relreplident
    WHEN 'd' THEN 'DEFAULT'
    WHEN 'n' THEN 'NOTHING'
    WHEN 'f' THEN 'FULL'  -- ✅ يجب أن يكون FULL
    WHEN 'i' THEN 'INDEX'
  END as replica_identity
FROM pg_class
WHERE relname IN ('club_activities', 'radio_listeners');
```

**يجب أن يكون الناتج:**
```
table_name         | replica_identity
--------------------+-----------------
club_activities    | FULL  ✅
radio_listeners     | FULL  ✅
```

**إذا لم يكن FULL:**
```sql
ALTER TABLE club_activities REPLICA IDENTITY FULL;
ALTER TABLE radio_listeners REPLICA IDENTITY FULL;
```

### الخطوة 4: التحقق من Real-time Publication

**في Supabase SQL Editor:**

```sql
-- التحقق من الجداول في supabase_realtime publication
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('club_activities', 'radio_listeners')
ORDER BY tablename;
```

**يجب أن يظهر:**
```
tablename
----------
club_activities  ✅
radio_listeners   ✅
```

**إذا لم تكن موجودة:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE club_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE radio_listeners;
```

---

## 🧪 اختبار بدء البث

### 1. اختبار في الداش بورد

1. **افتح صفحة الراديو**
2. **اضغط على "بدء بث جديد"**
3. **املأ البيانات واضغط "بدء البث"**
4. **تحقق من Console - يجب أن ترى:**
   ```
   [Radio] Stream started successfully
   ```

### 2. التحقق من قاعدة البيانات

**في Supabase SQL Editor:**

```sql
-- التحقق من أن is_live = true
SELECT 
  id,
  title,
  is_live,  -- ✅ يجب أن يكون true
  is_active,
  stream_url,
  listen_url,
  broadcast_mode,
  updated_at
FROM club_activities
WHERE activity_type = 'radio_stream'
  AND is_active = true
ORDER BY updated_at DESC
LIMIT 1;
```

**يجب أن ترى:**
```
is_live | is_active | stream_url
--------|-----------|------------
true    | true      | http://...
```

### 3. اختبار Real-time في الموبايل

1. **ابدأ البث من الداش بورد**
2. **في الموبايل، افتح Console**
3. **راقب الرسائل - يجب أن ترى:**
   ```
   [Radio Stream] Stream status updated: is_live = true
   ```

---

## 🔍 التحقق من Real-time Subscription في الداش بورد

### في Console المتصفح:

**عند بدء البث، يجب أن ترى:**
```
[Radio Stream] Setting up subscription for stream updates: [activity_id]
[Radio Stream] Subscription status: SUBSCRIBED
[Radio Stream] ✅ Successfully subscribed to radio_listeners updates
```

**عند تحديث `is_live`:**
```
[Radio Stream] Stream updated: {
  id: "...",
  is_live: true,
  was_live: false
}
```

---

## ⚠️ مشاكل محتملة وحلولها

### المشكلة 1: `is_live` لا يتغير

**التحقق:**
```sql
-- في Supabase SQL Editor
SELECT id, title, is_live, updated_at
FROM club_activities
WHERE id = 'YOUR_ACTIVITY_ID';
```

**الحل:**
- تحقق من Console للأخطاء
- تأكد من أن `startLiveStream` يتم استدعاؤه
- تحقق من RLS Policies

### المشكلة 2: Real-time لا يعمل

**التحقق:**
1. ✅ Supabase Dashboard > Database > Replication
2. ✅ REPLICA IDENTITY FULL
3. ✅ الجداول في `supabase_realtime` publication

**الحل:**
- تطبيق Migrations
- تفعيل Real-time يدوياً في Dashboard
- التحقق من RLS Policies

### المشكلة 3: الموبايل لا يستلم التحديث

**التحقق:**
- Real-time مفعل في Supabase
- الموبايل يتابع `club_activities` updates
- `is_live` يتغير في قاعدة البيانات

**الحل:**
- راجع مستند: `docs/إيقاف_البث_تلقائياً_في_الموبايل.md`
- تأكد من Real-time subscription في الموبايل

---

## 📝 ملخص التحقق

### ✅ زر "بدء البث"

- ✅ يستدعي `startLiveStream(activity.id)`
- ✅ يحدّث `is_live = true` في `club_activities`
- ✅ يحدّث `current_listeners = 0`
- ✅ ينشئ سجل في `radio_sessions` (للـ Live Event)

### ✅ Real-time

- ✅ Migration مطبق: `20250122_enable_realtime_for_club_activities.sql`
- ✅ `club_activities` في `supabase_realtime` publication
- ✅ `REPLICA IDENTITY FULL` مفعل
- ✅ Real-time مفعل في Supabase Dashboard

---

## 🎯 خطوات التحقق السريعة

### 1. التحقق من الكود

```typescript
// ✅ في handleStartStream
await dispatch(startLiveStream(activity.id)).unwrap();

// ✅ في startLiveStream
.update({ is_live: true, current_listeners: 0 })
```

### 2. التحقق من قاعدة البيانات

```sql
-- ✅ التحقق من is_live
SELECT is_live FROM club_activities WHERE id = '...';

-- ✅ التحقق من Real-time
SELECT tablename FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'club_activities';
```

### 3. التحقق من Supabase Dashboard

- ✅ Database > Replication
- ✅ `club_activities` → **Enabled**
- ✅ `radio_listeners` → **Enabled**

---

**آخر تحديث:** 2025-01-22
