# إصلاح خطأ getActiveListenersWithDetails (V1.4)

## 🔴 المشكلة

عند محاولة جلب المستمعين النشطين للراديو، يظهر الخطأ:

```
Error: [Radio Listeners] Error fetching listeners: {}
```

**السبب المحتمل:**
- RPC function `get_active_radio_listeners` قد لا تكون موجودة أو محدثة
- مشكلة في RLS (Row Level Security)
- مشكلة في schema cache

---

## ✅ الحل المطبق

### 1. تحسين معالجة الأخطاء

تم تحديث `getActiveListenersWithDetails` لطباعة تفاصيل الخطأ بشكل أفضل:

```typescript
async getActiveListenersWithDetails(activityId: string): Promise<RadioListenerWithDetails[]> {
  try {
    console.log('[Radio Listeners] Fetching active listeners for activity:', activityId);
    
    if (!activityId) {
      console.warn('[Radio Listeners] No activity ID provided');
      return [];
    }
    
    // محاولة 1: استخدام RPC function
    let listeners: any[] | null = null;
    let listenersError: any = null;
    
    try {
      const rpcResult = await supabase
        .rpc('get_active_radio_listeners', { p_activity_id: activityId });
      
      if (rpcResult.error) {
        console.warn('[Radio Listeners] RPC function failed:', {
          error: rpcResult.error,
          code: rpcResult.error?.code,
          message: rpcResult.error?.message,
          details: rpcResult.error?.details,
          hint: rpcResult.error?.hint,
        });
        listenersError = rpcResult.error;
      } else {
        listeners = rpcResult.data || [];
        console.log(`[Radio Listeners] RPC returned ${listeners.length} listeners`);
      }
    } catch (rpcErr: any) {
      console.warn('[Radio Listeners] RPC function exception:', {
        error: rpcErr,
        message: rpcErr?.message,
        stack: rpcErr?.stack,
      });
      listenersError = rpcErr;
    }

    // محاولة 2: استخدام الطريقة العادية (Fallback)
    if (!listeners && listenersError) {
      console.log('[Radio Listeners] Trying direct query as fallback...');
      try {
        const { data, error } = await supabase
          .from('radio_listeners')
          .select('*')
          .eq('activity_id', activityId)
          .eq('is_active', true)
          .gt('last_active_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
          .order('started_listening_at', { ascending: false });

        if (error) {
          console.error('[Radio Listeners] Direct query also failed:', {
            error,
            code: error?.code,
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
          });
          return [];
        }

        listeners = data || [];
        console.log(`[Radio Listeners] Direct query returned ${listeners.length} listeners`);
      } catch (directErr: any) {
        console.error('[Radio Listeners] Direct query exception:', {
          error: directErr,
          message: directErr?.message,
          stack: directErr?.stack,
        });
        return [];
      }
    }

    if (listenersError && !listeners) {
      console.error('[Radio Listeners] All methods failed. Last error:', {
        error: listenersError,
        code: listenersError?.code,
        message: listenersError?.message,
        details: listenersError?.details,
        hint: listenersError?.hint,
      });
      return [];
    }

    // ... باقي الكود
  } catch (error: any) {
    console.error('[Radio] Error fetching active listeners with details:', {
      error,
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
    });
    return [];
  }
}
```

---

## 🔍 خطوات التحقق

### 1. التحقق من RPC Function

```sql
-- في Supabase Dashboard > SQL Editor
SELECT 
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'get_active_radio_listeners';
```

**النتيجة المتوقعة:**
- يجب أن تظهر الدالة موجودة

### 2. اختبار RPC Function مباشرة

```sql
-- استبدل 'activity-id-here' بـ activity_id فعلي
SELECT * FROM get_active_radio_listeners('activity-id-here'::UUID);
```

**النتيجة المتوقعة:**
- يجب أن تعيد جدولاً (حتى لو كان فارغاً)
- يجب ألا تظهر أخطاء

### 3. التحقق من Console Logs

افتح Console في المتصفح وابحث عن:

```
[Radio Listeners] Fetching active listeners for activity: ...
[Radio Listeners] RPC function failed: { ... }
[Radio Listeners] Trying direct query as fallback...
```

**التحقق من:**
- `code`: كود الخطأ (مثلاً: `PGRST116`, `42883`, `PGRST406`)
- `message`: رسالة الخطأ
- `details`: تفاصيل إضافية
- `hint`: تلميحات لحل المشكلة

---

## 🛠️ الحلول المحتملة

### الحل 1: تطبيق Migration

إذا كانت RPC function غير موجودة:

```sql
-- تطبيق: supabase/migrations/20250122_update_get_active_radio_listeners_v1_4.sql
```

### الحل 2: تحديث Schema Cache

في Supabase Dashboard:
1. اذهب إلى **Settings > API**
2. اضغط **Refresh Schema Cache**

### الحل 3: التحقق من RLS

```sql
-- التحقق من RLS policies
SELECT * FROM pg_policies WHERE tablename = 'radio_listeners';
```

### الحل 4: التحقق من Permissions

```sql
-- التحقق من permissions على RPC function
SELECT 
  p.proname,
  pg_get_function_identity_arguments(p.oid) as args,
  a.rolname as grantee
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_proc_acl pa ON p.oid = pa.oid
LEFT JOIN pg_authid a ON pa.grantee = a.oid
WHERE p.proname = 'get_active_radio_listeners';
```

---

## 📝 ملاحظات

1. **الخطأ الفارغ `{}`:**
   - يعني أن الخطأ موجود لكن لا يحتوي على معلومات مفيدة
   - التحسينات الجديدة تطبع `code`, `message`, `details`, `hint` لمساعدة في التشخيص

2. **Fallback Strategy:**
   - إذا فشلت RPC function، يتم استخدام direct query
   - هذا يضمن أن النظام يعمل حتى لو كانت RPC function غير متاحة

3. **Error Handling:**
   - جميع الأخطاء يتم تسجيلها في Console
   - يتم إرجاع مصفوفة فارغة بدلاً من throw error (لعدم كسر UI)

---

**آخر تحديث:** 2025-01-22 (V1.4)
