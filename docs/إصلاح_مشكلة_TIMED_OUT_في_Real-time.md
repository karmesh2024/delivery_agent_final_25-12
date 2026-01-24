# إصلاح مشكلة TIMED_OUT في Real-time Subscription

**التاريخ:** 2025-01-22  
**الإصدار:** V1.5.1  
**المشكلة:** Real-time subscription يفشل مع `TIMED_OUT`

---

## 🔴 المشكلة

عند محاولة الاشتراك في Real-time updates، يظهر الخطأ:
```
[Radio Realtime] Subscription status: TIMED_OUT
[Radio Realtime] ⚠️ Subscription timed out - falling back to polling
```

---

## 🔍 الأسباب المحتملة

1. **Real-time غير مفعل في Supabase Dashboard**
2. **REPLICA IDENTITY غير FULL**
3. **مشاكل في الاتصال بالإنترنت**
4. **Supabase Realtime service غير متاح مؤقتاً**
5. **RLS Policies تمنع الوصول**

---

## ✅ الحلول المطبقة

### 1. Migration لإصلاح Real-time

**الملف:** `supabase/migrations/20250122_fix_realtime_subscription_timeout.sql`

```sql
-- التحقق من تفعيل Real-time للجداول
-- التأكد من REPLICA IDENTITY FULL
-- عرض حالة Real-time
```

**الخطوات:**
1. تطبيق Migration في Supabase SQL Editor
2. التحقق من Supabase Dashboard > Database > Replication
3. التأكد من تفعيل Real-time للجداول

### 2. تحسين معالجة الأخطاء في Frontend

**الملف:** `src/app/club-zone/radio/page.tsx`

```typescript
.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    console.log('[Radio Realtime] ✅ Successfully subscribed');
  } else if (status === 'TIMED_OUT') {
    console.warn('[Radio Realtime] ⚠️ Subscription timed out');
    // إعادة المحاولة (حتى 3 مرات)
    if (retryCount <= maxRetries) {
      setTimeout(() => {
        loadListeners();
      }, 5000 * retryCount);
    }
  } else if (status === 'CHANNEL_ERROR') {
    console.error('[Radio Realtime] ❌ Channel error');
    // إعادة المحاولة بعد 3 ثواني
    setTimeout(() => {
      loadListeners();
    }, 3000);
  }
});
```

### 3. Polling كـ Backup

**تم تقليل وقت polling إلى 5 ثواني** كـ backup في حالة فشل Real-time.

---

## 🔧 خطوات الإصلاح

### الخطوة 1: تطبيق Migration

```sql
-- في Supabase SQL Editor
-- تطبيق: supabase/migrations/20250122_fix_realtime_subscription_timeout.sql
```

### الخطوة 2: التحقق من Supabase Dashboard

1. اذهب إلى **Supabase Dashboard**
2. اختر **Database > Replication**
3. تحقق من أن **Real-time** مفعل لـ:
   - `radio_listeners`
   - `club_activities`

### الخطوة 3: التحقق من REPLICA IDENTITY

```sql
-- في Supabase SQL Editor
SELECT 
  relname as table_name,
  CASE relreplident
    WHEN 'd' THEN 'DEFAULT'
    WHEN 'n' THEN 'NOTHING'
    WHEN 'f' THEN 'FULL'  -- ✅ يجب أن يكون FULL
    WHEN 'i' THEN 'INDEX'
  END as replica_identity
FROM pg_class
WHERE relname IN ('radio_listeners', 'club_activities');
```

**يجب أن يكون الناتج:**
```
table_name         | replica_identity
-------------------+-----------------
radio_listeners    | FULL
club_activities    | FULL
```

### الخطوة 4: إصلاح REPLICA IDENTITY (إذا لزم الأمر)

```sql
-- إذا لم يكن FULL:
ALTER TABLE radio_listeners REPLICA IDENTITY FULL;
ALTER TABLE club_activities REPLICA IDENTITY FULL;
```

### الخطوة 5: التحقق من Real-time Publication

```sql
-- التحقق من الجداول في supabase_realtime publication
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('radio_listeners', 'club_activities');
```

**يجب أن يظهر:**
```
tablename
----------
radio_listeners
club_activities
```

### الخطوة 6: إضافة الجداول إلى Publication (إذا لزم الأمر)

```sql
-- إذا لم تكن موجودة:
ALTER PUBLICATION supabase_realtime ADD TABLE radio_listeners;
ALTER PUBLICATION supabase_realtime ADD TABLE club_activities;
```

---

## 🧪 اختبار الإصلاح

### 1. اختبار Real-time Subscription

1. افتح Console في المتصفح
2. ابدأ بث مباشر
3. راقب الرسائل:
   ```
   [Radio Realtime] Setting up subscription for activity: [id]
   [Radio Realtime] Subscription status: SUBSCRIBED
   [Radio Realtime] ✅ Successfully subscribed to radio_listeners updates
   ```

### 2. اختبار التحديثات

1. ابدأ الاستماع من الموبايل
2. راقب Console - يجب أن ترى:
   ```
   [Radio Realtime] New listener added: { ... }
   [Radio Realtime] Received update: { ... }
   ```

### 3. اختبار Fallback

إذا فشل Real-time:
- يجب أن ترى: `[Radio Realtime] ⚠️ Subscription timed out`
- Polling يجب أن يعمل كل 5 ثواني
- يجب أن ترى: `[Radio] Polling: Refreshing listeners list...`

---

## ⚠️ ملاحظات مهمة

### 1. Real-time في Supabase Dashboard

**يجب تفعيل Real-time يدوياً في Supabase Dashboard:**
1. اذهب إلى **Database > Replication**
2. فعّل **Real-time** للجداول المطلوبة
3. أو استخدم SQL: `ALTER PUBLICATION supabase_realtime ADD TABLE [table_name];`

### 2. REPLICA IDENTITY FULL

**مطلوب لإرسال البيانات الكاملة في التحديثات:**
```sql
ALTER TABLE radio_listeners REPLICA IDENTITY FULL;
ALTER TABLE club_activities REPLICA IDENTITY FULL;
```

### 3. RLS Policies

**تأكد من أن RLS Policies تسمح بالقراءة:**
```sql
-- التحقق من RLS Policies
SELECT * FROM pg_policies 
WHERE tablename IN ('radio_listeners', 'club_activities');
```

### 4. Polling كـ Backup

**حتى لو فشل Real-time، Polling يعمل كـ backup:**
- Polling كل 5 ثواني
- إعادة محاولة subscription عند TIMED_OUT
- تحديث القائمة تلقائياً

---

## 🔄 سيناريوهات الاستخدام

### السيناريو 1: Real-time يعمل بشكل صحيح

1. ✅ Subscription status: `SUBSCRIBED`
2. ✅ التحديثات تصل فوراً
3. ✅ لا حاجة لـ polling

### السيناريو 2: Real-time يفشل (TIMED_OUT)

1. ⚠️ Subscription status: `TIMED_OUT`
2. ✅ Polling يعمل كـ backup (كل 5 ثواني)
3. ✅ إعادة محاولة subscription (حتى 3 مرات)
4. ✅ التحديثات تصل عبر polling

### السيناريو 3: Real-time يعمل بعد إصلاح

1. ✅ تطبيق Migration
2. ✅ تفعيل Real-time في Dashboard
3. ✅ Subscription status: `SUBSCRIBED`
4. ✅ التحديثات تصل فوراً

---

## 📝 ملخص الإصلاحات

### 1. Migration

- ✅ التحقق من Real-time publication
- ✅ التأكد من REPLICA IDENTITY FULL
- ✅ عرض حالة Real-time

### 2. Frontend

- ✅ تحسين معالجة الأخطاء
- ✅ إضافة retry logic
- ✅ Polling كـ backup

### 3. Monitoring

- ✅ Logging أفضل للأخطاء
- ✅ تتبع حالة subscription
- ✅ إشعارات عند الفشل

---

## 🎯 الخطوات التالية

1. **تطبيق Migration:**
   ```sql
   -- في Supabase SQL Editor
   -- تطبيق: supabase/migrations/20250122_fix_realtime_subscription_timeout.sql
   ```

2. **التحقق من Supabase Dashboard:**
   - Database > Replication
   - تفعيل Real-time للجداول

3. **اختبار الكود:**
   - افتح Console في المتصفح
   - راقب حالة subscription
   - تحقق من وصول التحديثات

---

**آخر تحديث:** 2025-01-22
