# إصلاح خطأ getActiveListenersWithDetails

**تاريخ الإصلاح:** 2025-01-21

---

## 🔴 المشكلة

عند محاولة جلب المستمعين النشطين للراديو، يظهر الخطأ:

```
Error: [Radio Listeners] Error fetching listeners: {}
```

**السبب:**
- الدالة RPC `get_active_radio_listeners` تم تحديثها لتعيد `location JSONB` بدلاً من الحقول المنفصلة
- الكود في `clubRadioService.ts` كان يتوقع الحقول المنفصلة (`current_latitude`, `current_longitude`, `location_source`)
- هذا التضارب يسبب خطأ في parsing البيانات

---

## ✅ الحل المطبق

### 1. تحديث TypeScript Interface

تم تحديث `RadioListener` interface لدعم كلا الشكلين:

```typescript
export interface RadioListener {
  // ... حقول أخرى
  // الشكل الجديد: location JSONB
  location?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    district?: string;
    address?: string;
    source?: 'gps' | 'district' | 'address';
    [key: string]: any;
  } | null;
  // الشكل القديم: حقول منفصلة (للتوافق)
  current_latitude?: number;
  current_longitude?: number;
  location_source?: 'gps' | 'district' | 'address';
  // ...
}
```

### 2. تحديث Logic في clubRadioService.ts

تم تحديث الكود لدعم كلا الشكلين:

```typescript
// الشكل الجديد: location JSONB
if (listener.location && typeof listener.location === 'object') {
  const loc = listener.location as any;
  if (loc.latitude && loc.longitude) {
    locationData = {
      latitude: loc.latitude,
      longitude: loc.longitude,
      address: loc.address || loc.district || 'موقع غير محدد',
      city: loc.city || 'الإسكندرية',
      area: loc.district || loc.area,
      source: loc.source || 'gps',
    };
  }
}

// الشكل القديم: حقول منفصلة (للتوافق)
if (!locationData && listener.current_latitude && listener.current_longitude) {
  // ... كود قديم
}
```

---

## 🔍 التحقق من الإصلاح

### 1. التحقق من Migration

تأكد من تطبيق migration التالي:
- ✅ `20250121_fix_get_active_radio_listeners_to_use_location_jsonb.sql`
- ✅ أو الملف الموحد: `20250121_apply_all_missing_changes.sql`

### 2. اختبار الدالة RPC

```sql
-- في Supabase Dashboard > SQL Editor
SELECT * FROM get_active_radio_listeners('activity-id-here'::UUID);
```

**النتيجة المتوقعة:**
- يجب أن تعيد جدولاً يحتوي على حقل `location JSONB`
- يجب ألا تظهر أخطاء

### 3. اختبار من Flutter/Next.js

```typescript
const listeners = await clubRadioService.getActiveListenersWithDetails(activityId);
console.log('Listeners:', listeners);
```

**النتيجة المتوقعة:**
- يجب أن تعيد مصفوفة من المستمعين
- يجب أن يحتوي كل مستمع على `location` object (إن كان موجوداً)

---

## 📝 ملاحظات مهمة

1. **التوافق مع الكود القديم:**
   - الكود يدعم كلا الشكلين (JSONB والحقول المنفصلة)
   - هذا يضمن التوافق مع البيانات القديمة والجديدة

2. **ترتيب الأولوية:**
   - يتم استخدام `location JSONB` أولاً (الشكل الجديد)
   - إذا لم يكن موجوداً، يتم استخدام الحقول المنفصلة (الشكل القديم)

3. **Fallback:**
   - إذا لم يكن هناك موقع في `radio_listeners`، يتم البحث في `customer_addresses`

---

## 🚀 الخطوات التالية

1. ✅ **تطبيق Migration** (إذا لم يتم تطبيقه بعد)
2. ✅ **تحديث الكود** (تم بالفعل)
3. ⚠️ **اختبار الدالة** للتأكد من عملها بشكل صحيح
4. ⚠️ **التحقق من البيانات** في قاعدة البيانات

---

**آخر تحديث:** 2025-01-21
