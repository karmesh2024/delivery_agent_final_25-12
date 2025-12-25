# دليل استخدام نظام المصادقة المحسّن

## مقدمة

تم تحسين نظام المصادقة في التطبيق لمعالجة مشكلات JWT وضمان تجربة مستخدم أفضل. يتضمن النظام المحسّن:

1. تخزين JWT في localStorage للحفاظ على حالة المصادقة بين جلسات التصفح
2. التحقق التلقائي من حالة المصادقة عند بدء التطبيق
3. تجديد JWT تلقائيًا عند انتهاء صلاحيته
4. معالجة أخطاء المصادقة بشكل موحد

## استخدام نظام المصادقة

### تسجيل الدخول

عند تسجيل دخول المستخدم، يتم:
- تخزين JWT في حالة Redux
- تخزين JWT في localStorage
- توجيه المستخدم إلى الصفحة الرئيسية

```typescript
// مثال لتسجيل الدخول
import { login } from '@/domains/admins/store/authSlice';
import { useAppDispatch } from '@/store/hooks';

const dispatch = useAppDispatch();

// استخدام في نموذج تسجيل الدخول
const handleLogin = async (credentials) => {
  try {
    await dispatch(login(credentials)).unwrap();
    // تم تسجيل الدخول بنجاح
  } catch (error) {
    // معالجة الخطأ
  }
};
```

### تسجيل الخروج

عند تسجيل خروج المستخدم، يتم:
- حذف JWT من حالة Redux
- حذف JWT من localStorage
- توجيه المستخدم إلى صفحة تسجيل الدخول

```typescript
// مثال لتسجيل الخروج
import { logout } from '@/domains/admins/store/authSlice';
import { useAppDispatch } from '@/store/hooks';

const dispatch = useAppDispatch();

const handleLogout = async () => {
  await dispatch(logout());
  // سيتم توجيه المستخدم تلقائيًا إلى صفحة تسجيل الدخول
};
```

### الوصول إلى بيانات المستخدم الحالي

```typescript
// مثال للوصول إلى بيانات المستخدم الحالي
import { useAppSelector } from '@/store/hooks';

const { currentAdmin, isAuthenticated } = useAppSelector((state) => state.auth);

// استخدام البيانات
if (isAuthenticated && currentAdmin) {
  console.log(`مرحبًا ${currentAdmin.full_name}`);
}
```

## استخدام المعترض للطلبات

تم إضافة معترض للطلبات لمعالجة أخطاء المصادقة تلقائيًا. استخدم دالة `executeWithAuthRetry` لتنفيذ الطلبات مع معالجة أخطاء المصادقة:

```typescript
// مثال لاستخدام المعترض
import { executeWithAuthRetry } from '@/lib/apiInterceptor';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase';

const fetchData = async () => {
  return executeWithAuthRetry(async () => {
    const supabase = getAuthenticatedSupabaseClient();
    const { data, error } = await supabase.from('some_table').select('*');
    
    if (error) throw error;
    return data;
  });
};
```

## استخدام عميل Supabase المصادق

استخدم دالة `getAuthenticatedSupabaseClient` للحصول على عميل Supabase مع JWT للمصادقة:

```typescript
// مثال لاستخدام عميل Supabase المصادق
import { getAuthenticatedSupabaseClient } from '@/lib/supabase';

const fetchProtectedData = async () => {
  const supabase = getAuthenticatedSupabaseClient();
  
  if (!supabase) {
    throw new Error('عميل Supabase غير متاح');
  }
  
  const { data, error } = await supabase.from('protected_table').select('*');
  
  if (error) throw error;
  return data;
};
```

## التعامل مع انتهاء صلاحية JWT

تم إضافة آلية لتجديد JWT تلقائيًا عند انتهاء صلاحيته. يمكنك أيضًا تجديد JWT يدويًا:

```typescript
// مثال لتجديد JWT يدويًا
import { refreshToken } from '@/domains/admins/store/authSlice';
import { useAppDispatch } from '@/store/hooks';

const dispatch = useAppDispatch();

const handleRefreshToken = async () => {
  try {
    await dispatch(refreshToken()).unwrap();
    // تم تجديد JWT بنجاح
  } catch (error) {
    // فشل تجديد JWT، سيتم تسجيل الخروج تلقائيًا
  }
};
```

## تحديد مدة انتهاء صلاحية JWT

### تعديل مدة انتهاء الصلاحية في Supabase

لتعديل مدة انتهاء صلاحية JWT في Supabase:

1. الذهاب إلى لوحة تحكم Supabase
2. الانتقال إلى Authentication > Settings
3. تعديل قيمة "JWT Expiry" (الافتراضية هي 3600 ثانية أي ساعة واحدة)
4. حفظ التغييرات

### تعديل مدة انتهاء الصلاحية في التطبيق

في حالة استخدام Supabase Edge Functions أو API خاصة، يمكنك تحديد مدة انتهاء الصلاحية عند إنشاء الجلسة:

```typescript
// مثال لإنشاء جلسة مع تحديد مدة انتهاء الصلاحية
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
  options: {
    expiresIn: 86400 // 24 ساعة بالثواني
  }
});
```

## تطوير إدارة الإعدادات لنظام المصادقة

لتحسين إدارة إعدادات المصادقة في التطبيق، يُقترح تطوير الميزات التالية:

### 1. لوحة إدارة إعدادات المصادقة

إنشاء لوحة تحكم للمسؤولين تتيح:
- تعديل مدة انتهاء صلاحية JWT
- تحديد سياسات كلمات المرور (الطول الأدنى، التعقيد، إلخ)
- تفعيل/تعطيل المصادقة الثنائية
- إدارة جلسات المستخدمين النشطة

### 2. آلية تسجيل الأحداث الأمنية

إضافة نظام لتسجيل وتتبع:
- محاولات تسجيل الدخول الفاشلة
- عمليات تجديد JWT
- تغييرات كلمات المرور
- الوصول غير المصرح به

### 3. إدارة الجلسات المتعددة

تطوير نظام يسمح للمستخدمين:
- رؤية جميع الأجهزة المسجلة دخولها
- إنهاء جلسات محددة عن بعد
- تحديد عدد الجلسات المتزامنة المسموح بها

### 4. تكامل مع نظام الإشعارات

ربط نظام المصادقة بنظام الإشعارات لإرسال:
- إشعارات عند تسجيل الدخول من جهاز جديد
- تنبيهات قبل انتهاء صلاحية JWT
- إخطارات بتغييرات كلمة المرور

## ملاحظات هامة

1. **حماية الصفحات**: يتم التحقق تلقائيًا من حالة المصادقة في `AuthProvider`، وتوجيه المستخدمين غير المصادقين إلى صفحة تسجيل الدخول.

2. **تعامل مع الأخطاء**: يتم معالجة أخطاء المصادقة تلقائيًا في `apiInterceptor`، ولكن يجب عليك التعامل مع الأخطاء الأخرى في تطبيقك.

3. **تجديد JWT**: يتم تجديد JWT تلقائيًا عند انتهاء صلاحيته، ولكن يمكنك أيضًا تجديده يدويًا إذا لزم الأمر.

4. **تخزين JWT**: يتم تخزين JWT في localStorage، وهو متاح فقط في بيئة المتصفح. إذا كنت بحاجة إلى الوصول إلى JWT في بيئة الخادم، فستحتاج إلى استخدام آلية مختلفة. 