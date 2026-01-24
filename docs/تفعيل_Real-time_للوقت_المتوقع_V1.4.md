# تفعيل Real-time للوقت المتوقع في قائمة المستمعين (V1.4)

## المشكلة

الوقت المتوقع (`duration_minutes`) والنقاط (`points_earned`) لا يتم تحديثهما تلقائياً في قائمة المستمعين إلا بعد تحديث الصفحة يدوياً.

## الحل

استخدام **Supabase Realtime** لتحديث القيم تلقائياً عند تحديثها في قاعدة البيانات من الموبايل.

---

## 1. تفعيل Realtime في قاعدة البيانات

### Migration: `20250122_enable_realtime_for_radio_listeners.sql`

```sql
-- تفعيل Realtime للجدول
ALTER PUBLICATION supabase_realtime ADD TABLE radio_listeners;

-- التأكد من REPLICA IDENTITY كامل
ALTER TABLE radio_listeners REPLICA IDENTITY FULL;
```

**ملاحظة:** إذا كان Realtime غير مفعل في Supabase Dashboard:
1. اذهب إلى **Database > Replication**
2. فعّل **Realtime** لجدول `radio_listeners`
3. أو استخدم: `ALTER TABLE radio_listeners REPLICA IDENTITY FULL;`

---

## 2. إضافة Realtime Subscription في Frontend

### الكود في `src/app/club-zone/radio/page.tsx`

```typescript
// V1.4: Real-time updates للوقت المتوقع والنقاط من قاعدة البيانات
useEffect(() => {
  if (!currentStream?.id) return;

  console.log('[Radio Realtime] Setting up subscription for activity:', currentStream.id);

  // إنشاء Realtime subscription لتحديثات radio_listeners
  const channel = supabase
    .channel(`radio_listeners_${currentStream.id}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'radio_listeners',
        filter: `activity_id=eq.${currentStream.id}`,
      },
      (payload) => {
        console.log('[Radio Realtime] Received update:', payload);
        
        const updatedListener = payload.new as any;
        
        // تحديث القيم فقط للمستمع المحدد (بدون إعادة تحميل كامل)
        setActiveListeners((prev) => {
          const index = prev.findIndex((l) => l.id === updatedListener.id);
          
          if (index === -1) {
            // إذا لم يكن المستمع موجوداً، لا نفعل شيئاً
            return prev;
          }
          
          // تحديث القيم فقط (duration_minutes و points_earned و last_active_at)
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            duration_minutes: updatedListener.duration_minutes || 0,
            points_earned: updatedListener.points_earned || 0,
            last_active_at: updatedListener.last_active_at,
            updated_at: updatedListener.updated_at,
          };
          
          return updated;
        });
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'radio_listeners',
        filter: `activity_id=eq.${currentStream.id}`,
      },
      (payload) => {
        console.log('[Radio Realtime] New listener added:', payload);
        // إعادة تحميل القائمة عند إضافة مستمع جديد
        loadListeners();
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'radio_listeners',
        filter: `activity_id=eq.${currentStream.id}`,
      },
      (payload) => {
        console.log('[Radio Realtime] Listener removed:', payload);
        // إزالة المستمع من القائمة
        setActiveListeners((prev) => prev.filter((l) => l.id !== payload.old.id));
      }
    )
    .subscribe((status) => {
      console.log('[Radio Realtime] Subscription status:', status);
    });

  return () => {
    console.log('[Radio Realtime] Cleaning up subscription');
    supabase.removeChannel(channel);
  };
}, [currentStream?.id, loadListeners]);
```

---

## 3. تحسين العرض مع Animation

### إضافة `key` و `transition` للعناصر

```typescript
{listener.is_active && (
  <div className="flex items-center gap-2 mt-0.5">
    <span 
      key={`duration-${listener.id}-${durationMinutes}`}
      className="text-xs text-muted-foreground transition-all duration-300"
    >
      {durationMinutes > 0 ? `${durationMinutes} دقيقة` : 'بدأ للتو'}
    </span>
    {!isOnline && (
      <span className="text-xs text-red-500">🔴 انقطع الاتصال</span>
    )}
  </div>
)}

{/* النقاط */}
<span 
  key={`points-${listener.id}-${estimatedPoints}`}
  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-all duration-300 ${
    estimatedPoints > 0 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-600'
  }`}
>
  <FiStar className={`w-3 h-3 ${estimatedPoints > 0 ? 'text-green-500' : 'text-gray-500'}`} />
  ⚡ {estimatedPoints}
  <span className="text-[10px] opacity-75">(متوقع)</span>
</span>
```

**الفوائد:**
- `key` مع القيمة المتغيرة يضمن إعادة Render عند التغيير
- `transition-all duration-300` يضيف تأثير انتقال سلس

---

## 4. كيف يعمل؟

### دورة العمل:

1. **الموبايل يحدث البيانات:**
   - كل 60 ثانية، الموبايل يرسل `duration_minutes` و `points_earned` إلى قاعدة البيانات
   - يتم تحديث `radio_listeners` table

2. **Supabase Realtime يكتشف التغيير:**
   - Realtime يكتشف UPDATE في `radio_listeners`
   - يرسل Event إلى Frontend عبر WebSocket

3. **Frontend يستقبل التحديث:**
   - `postgres_changes` event يتم استقباله
   - يتم تحديث `activeListeners` state للعنصر المحدد فقط

4. **React يعيد Render:**
   - بسبب تغيير State، React يعيد Render العنصر المحدد فقط
   - `key` مع القيمة الجديدة يضمن تحديث صحيح
   - `transition` يضيف تأثير انتقال سلس

---

## 5. التحقق من العمل

### Console Logs:

عند تفعيل Realtime، يجب أن ترى في Console:

```
[Radio Realtime] Setting up subscription for activity: abc-123
[Radio Realtime] Subscription status: SUBSCRIBED
[Radio Realtime] Received update: { new: { id: '...', duration_minutes: 5, points_earned: 5, ... } }
```

### الاختبار:

1. افتح الداش بورد
2. ابدأ البث المباشر
3. افتح تطبيق الموبايل وابدأ الاستماع
4. راقب القائمة الجانبية - يجب أن ترى:
   - `duration_minutes` يتحدث تلقائياً كل 60 ثانية
   - `points_earned` يتحدث تلقائياً كل 60 ثانية
   - **بدون تحديث الصفحة**

---

## 6. استكشاف الأخطاء

### المشكلة: Realtime لا يعمل

**التحقق:**
1. ✅ هل تم تطبيق Migration `20250122_enable_realtime_for_radio_listeners.sql`؟
2. ✅ هل Realtime مفعل في Supabase Dashboard (Database > Replication)?
3. ✅ هل `REPLICA IDENTITY FULL` مفعل للجدول؟

**الحل:**
```sql
-- التحقق من REPLICA IDENTITY
SELECT relreplident FROM pg_class WHERE relname = 'radio_listeners';
-- يجب أن يكون: 'f' (FULL)

-- إذا لم يكن FULL:
ALTER TABLE radio_listeners REPLICA IDENTITY FULL;
```

### المشكلة: التحديثات لا تصل

**التحقق:**
1. ✅ افتح Console في المتصفح
2. ✅ ابحث عن `[Radio Realtime]` logs
3. ✅ تحقق من حالة Subscription (يجب أن تكون `SUBSCRIBED`)

**الحل:**
- تأكد من أن `currentStream?.id` موجود
- تأكد من أن Filter صحيح: `activity_id=eq.${currentStream.id}`

### المشكلة: التحديثات تصل لكن لا تظهر

**التحقق:**
1. ✅ تحقق من Console logs - هل `payload.new` يحتوي على البيانات؟
2. ✅ تحقق من `setActiveListeners` - هل يتم استدعاؤها؟

**الحل:**
- تأكد من أن `key` في JSX يحتوي على القيمة المتغيرة
- تأكد من أن `transition` classes موجودة

---

## 7. الأداء

### التحسينات:

1. **تحديث جزئي:**
   - يتم تحديث العنصر المحدد فقط (ليس القائمة كاملة)
   - `findIndex` و `spread operator` يضمنان تحديث دقيق

2. **Realtime Efficient:**
   - Subscription واحد لكل `activity_id`
   - يتم تنظيف Subscription عند unmount

3. **Animation Smooth:**
   - `transition-all duration-300` يضيف تأثير انتقال سلس
   - `key` يضمن إعادة Render صحيحة

---

## 8. ملخص

| العنصر | قبل | بعد |
|--------|-----|-----|
| التحديث | يدوي (تحديث الصفحة) | تلقائي (Real-time) |
| التكرار | كل 10 ثواني (polling) | فوري (WebSocket) |
| الأداء | إعادة تحميل كامل | تحديث جزئي |
| تجربة المستخدم | يحتاج تحديث يدوي | تحديث تلقائي سلس |

---

**آخر تحديث:** 2025-01-22 (V1.4)
