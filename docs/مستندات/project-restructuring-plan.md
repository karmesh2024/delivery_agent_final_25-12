# خطة إعادة هيكلة مشروع Delivery Agent Dashboard

## مقدمة

هذا المستند يوثق استراتيجية شاملة لإعادة هيكلة مشروع Delivery Agent Dashboard لدعم التوسع المستقبلي ليشمل هيكلة الموظفين والمرتبات والأنظمة المالية واللوجستية وغيرها من المميزات. الهدف هو إنشاء أساس متين يسمح بالتطوير المستمر مع الحفاظ على جودة الكود وسهولة الصيانة.

## استراتيجية إعادة الهيكلة

### 1. هيكلة المشروع على أساس النطاقات (Domain-Driven Design)

سيتم إعادة تنظيم المشروع باستخدام نهج Domain-Driven Design (DDD) لفصل النطاقات المختلفة للأعمال:

```
src/
├── core/                   # المكونات الأساسية المشتركة
│   ├── api/                # مكتبة التعامل مع API
│   ├── auth/               # خدمات المصادقة
│   ├── config/             # إعدادات التطبيق
│   ├── hooks/              # React Hooks المشتركة
│   ├── layouts/            # تخطيطات الصفحات المشتركة
│   └── utils/              # أدوات مساعدة عامة
│
├── domains/                # نطاقات الأعمال المختلفة
│   ├── delivery/           # نظام التوصيل الحالي
│   │   ├── api/            # خدمات API خاصة بالتوصيل
│   │   ├── components/     # مكونات UI خاصة بالتوصيل
│   │   ├── hooks/          # React Hooks خاصة بالتوصيل
│   │   ├── models/         # أنواع البيانات وتعريفات النماذج
│   │   ├── pages/          # صفحات التوصيل
│   │   ├── store/          # إدارة حالة التوصيل (Redux)
│   │   └── utils/          # أدوات مساعدة خاصة بالتوصيل
│   │
│   ├── hr/                 # نظام الموارد البشرية (مستقبلي)
│   ├── finance/            # النظام المالي (مستقبلي)
│   └── logistics/          # النظام اللوجستي (مستقبلي)
│
├── shared/                 # المكونات المشتركة بين النطاقات
│   ├── components/         # مكونات UI العامة
│   ├── constants/          # الثوابت المشتركة
│   └── types/              # تعريفات الأنواع المشتركة
│
└── app/                    # مدخل التطبيق (Next.js app router)
    ├── layout.tsx
    ├── providers.tsx       # مزودي Redux, Theme, Auth, وغيرها
    └── [domains]/          # صفحات النطاقات المختلفة
```

### 2. إدارة الحالة المركزية باستخدام Redux Toolkit

سيتم تنفيذ Redux Toolkit لإدارة حالة التطبيق مع تنظيم المخازن حسب النطاق:

```
src/store/
├── index.ts               # تكوين المتجر الرئيسي
├── middleware.ts          # تكوين Middleware الشائعة
│
├── delivery/              # متجر التوصيل
│   ├── ordersSlice.ts
│   ├── agentsSlice.ts
│   └── trackingSlice.ts
│
├── hr/                    # متجر الموارد البشرية (مستقبلي)
├── finance/               # متجر النظام المالي (مستقبلي)
└── logistics/             # متجر النظام اللوجستي (مستقبلي)
```

### 3. طبقة خدمات API مرنة

سيتم إنشاء طبقة خدمات API موحدة باستخدام RTK Query:

```typescript
// src/core/api/apiClient.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiClient = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  endpoints: () => ({})
});
```

### 4. معمارية المكونات القابلة للتركيب

سيتم تنظيم المكونات في هيكل هرمي:

```
src/shared/components/
├── primitives/           # المكونات الأساسية البسيطة
├── modules/              # وحدات مركبة معقدة
└── layouts/              # تخطيطات الصفحات
```

### 5. إدارة الأدوار والصلاحيات

سيتم تطوير نظام للأدوار والصلاحيات:

```typescript
type Permission = 
  | 'delivery:read'
  | 'delivery:write'
  | 'hr:read'
  | 'hr:write'
  | 'finance:read'
  | 'finance:write'
  | 'logistics:read'
  | 'logistics:write';

// ... تنفيذ نظام الصلاحيات
```

## خطة التنفيذ المرحلية

لتطبيق هذه المقترحات بشكل تدريجي دون تعطيل العمل الجاري، نقترح الخطة المرحلية التالية:

### المرحلة 1: إعادة تنظيم الكود الحالي (1-2 أسبوع)

1. **إنشاء الهيكل الجديد**: إنشاء المجلدات الرئيسية (core, domains, shared)
2. **نقل الكود الحالي**: نقل مكونات التطبيق الحالية إلى الهيكل الجديد بدون تغيير جوهري
   - نقل components/ إلى shared/components/ أو domains/delivery/components/ حسب الاختصاص
   - نقل app/ بدون تغييرات جوهرية في هذه المرحلة
   - نقل lib/ إلى core/
   - نقل types/ إلى shared/types/
3. **تحديث مسارات الاستيراد**: تعديل مسارات الاستيراد في الملفات المنقولة

### المرحلة 2: تنفيذ Redux Toolkit (2-3 أسابيع)

1. **إضافة المكتبات**: تثبيت Redux Toolkit وملحقاتها
   ```bash
   npm install @reduxjs/toolkit react-redux
   ```

2. **إنشاء مخزن Redux الأساسي**: إنشاء store/index.ts
3. **تنفيذ الشرائح الأساسية**: البدء بتنفيذ شرائح الطلبات والعملاء
4. **تحويل المكونات تدريجياً**: تحويل المكونات لاستخدام Redux بدلاً من useState محلي

### المرحلة 3: تنفيذ طبقة API (2-3 أسابيع)

1. **إنشاء apiClient**: تنفيذ عميل API الأساسي باستخدام RTK Query
2. **تحويل استدعاءات Supabase**: نقل استدعاءات قاعدة البيانات المباشرة إلى خدمات API
3. **تنفيذ نقاط النهاية الأساسية**: البدء بنقاط نهاية الطلبات والعملاء

### المرحلة 4: البدء بالنطاقات الجديدة (على حسب الأولويات)

بناءً على الأولوية، يمكن البدء بأحد النطاقات الجديدة (HR، Finance، Logistics) مع استخدام الهيكل الجديد من البداية.

## كيف نبدأ (الخطوات العملية الأولى)

للبدء فوراً، يمكن اتباع الخطوات التالية:

### 1. إنشاء ملفات التكوين الأساسية (1-2 يوم)

1. **إنشاء مخزن Redux الأساسي**:

```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    // سيتم إضافة reducers لاحقاً
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

2. **إنشاء Provider لتطبيق Redux**:

```tsx
// src/app/providers.tsx
'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
}
```

3. **تحديث layout.tsx لاستخدام Provider**:

```tsx
// src/app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### 2. إعادة تنظيم المجلدات (2-3 أيام)

1. **إنشاء المجلدات الرئيسية الجديدة**:
   ```
   mkdir -p src/core src/domains/delivery src/shared
   ```

2. **نقل مكون واحد للاختبار**:
   - اختر مكون بسيط (مثل: agent-card.tsx)
   - انقله إلى الهيكل الجديد مع تحديث الاستيرادات

3. **إنشاء شريحة Redux تجريبية**:
   - إنشاء ordersSlice.ts بالوظائف الأساسية
   - تحويل مكون واحد للعمل مع Redux

### 3. تجريب نهج الهيكلة في صفحة جديدة (3-5 أيام)

قبل تطبيق التغييرات على كامل المشروع، يمكن إنشاء صفحة جديدة تتبع الهيكلة المقترحة:

1. **إنشاء صفحة تجريبية**:
   ```
   src/app/experimental/page.tsx
   ```

2. **تنفيذ المكونات والمتجر المرتبط بها**:
   ```
   src/domains/delivery/components/ExperimentalView.tsx
   src/domains/delivery/store/experimentalSlice.ts
   ```

3. **اختبار الصفحة الجديدة واستخدام الدروس المستفادة للتوسع**

### 4. التوثيق والمبادئ التوجيهية للفريق (1-2 يوم)

1. **وثيقة المبادئ التوجيهية للتطوير**:
   - إنشاء دليل نمط الكود
   - توثيق كيفية إضافة ميزات جديدة باستخدام الهيكل الجديد

2. **جلسة إحاطة للفريق**:
   - مشاركة الرؤية والخطة العامة
   - شرح كيفية العمل أثناء عملية إعادة الهيكلة

## تحديات متوقعة وحلولها

1. **التعامل مع الكود المترابط بشكل كبير**:
   - استخدام نمط الواجهة (Façade) للتعامل مع الكود القديم
   - إعادة البناء التدريجي على مراحل صغيرة

2. **ضمان استمرارية العمل**:
   - اختبارات شاملة لكل مرحلة
   - إطلاق تدريجي للتغييرات

3. **منحنى التعلم للفريق**:
   - جلسات تدريب وورش عمل
   - توثيق جيد وأمثلة

## الخاتمة

إعادة هيكلة المشروع خطوة ضرورية للتوسع المستقبلي. باتباع هذه الخطة المرحلية، يمكن تحقيق ذلك بطريقة منظمة ومنهجية مع الحفاظ على استمرارية عمل التطبيق الحالي. الفائدة طويلة المدى ستكون مشروعاً أكثر قابلية للصيانة والتوسع مع تقليل الديون التقنية.