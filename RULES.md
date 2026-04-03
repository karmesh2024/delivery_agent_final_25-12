# قواعد تطوير مشروع لوحة تحكم الوكيل (Delivery Agent Dashboard)

هذا المستند يحدد القواعد الصارمة والهيكلية التي يجب اتباعها عند تطوير أو تعديل
هذا التطبيق. الالتزام بهذه القواعد إلزامي لضمان جودة الكود، قابلية الصيانة،
وتوحيد أسلوب العمل.

## 1. اللغة والتواصل (Language & Communication)

- **العربية فقط**: جميع الشروحات، التوضيحات، الاقتراحات، التحليلات، والتعليقات
  داخل المحادثة يجب أن تكون باللغة العربية الفصحى.
- **الإنجليزية للكود**: يُسمح باستخدام اللغة الإنجليزية فقط في:
  - أسماء الملفات والمجلدات.
  - أسماء المتغيرات، الدوال، الكلاسات، والمكونات (Components).
  - أكواد البرمجة (Syntax).
  - أسماء جداول وحقول قاعدة البيانات.
  - المصطلحات التقنية القياسية (مثل: Clean Architecture, Redux Slice, Hook,
    Component).

## 2. التقنيات المستخدمة (Technical Stack)

يعتمد التطبيق على التقنيات التالية:

- **إطار العمل (Framework)**: Next.js (App Router).
- **لغة البرمجة**: TypeScript.
- **تنسيق الواجهات (Styling)**: Tailwind CSS مع مكتبة Radix UI (shadcn/ui).
- **إدارة الحالة (State Management)**: Redux Toolkit.
- **قاعدة البيانات (Database)**: Supabase (PostgreSQL) مع استخدام Prisma ORM
  للتعامل مع البيانات في بعض الأجزاء، و Supabase Client في أجزاء أخرى.
- **إدارة النماذج (Forms)**: React Hook Form + Zod.

## 3. هيكلية المشروع (Project Structure - Feature-Based Architecture)

يتبع المشروع **Feature-Based Architecture** (معمارية موجهة بالميزات) مع الفصل
الواضح بين الطبقات:

> **ملاحظة**: المشروع لا يتبع DDD الكلاسيكي بشكل كامل (Entities, Value Objects,
> Aggregates)، بل يعتمد على تقسيم النطاقات (Domains) كطريقة لتنظيم الكود حسب
> الميزات (Features).

- **`src/domains`**: هذا هو قلب التطبيق. يتم تقسيم الميزات (Features) إلى مجلدات
  فرعية بناءً على النطاق (مثل: `waste-management`, `financial-management`,
  `admins`). كل مجلد يحتوي على:
  - مكونات خاصة بالنطاق (Components).
  - خطافات (Hooks).
  - تعريفات الأنواع (Types).
- **`src/app`**: يحتوي على الصفحات (Pages) وتوجيهات التطبيق (Routing) فقط. لا يجب
  وضع منطق معقد هنا.
- **`src/store`**: يحتوي على إدارة الحالة العامة للتطبيق باستخدام Redux Slices.
- **`src/services`**: الطبقة المسؤولة عن الاتصال الخارجي (API Calls) والتعامل مع
  Supabase/Prisma.
- **`src/components`**: المكونات المشتركة والعامة (UI Kit) التي يُعاد استخدامها
  عبر النطاقات المختلفة.

## 4. قواعد التعامل مع قواعد البيانات (Database Rules - Strict)

**قاعدة صارمة جدًا:** التعامل مع قاعدة البيانات يتم بحذر شديد وبآلية محددة.

1. **دور الذكاء الاصطناعي (AI Role)**:
   - كتابة مقترحات Schema (JSQL/Prisma).
   - كتابة استعلامات SQL أو Supabase/Prisma Queries.
   - اقتراح أسماء الجداول، الأعمدة، والعلاقات.
   - تحليل النتائج النصية التي يقدمها المستخدم.
   - **ممنوع**: تنفيذ الاستعلامات (Execute/Apply) مباشرة.
   - **ممنوع**: جلب البيانات الفعلية أو افتراض وجودها.

2. **دور المستخدم (User Role)**:
   - تنفيذ الاستعلامات (Migrations/Queries) يدويًا في Supabase أو عبر التيرمينال.
   - تزويد الذكاء الاصطناعي بنتائج التنفيذ أو عينات من البيانات.

3. **آلية العمل (Workflow)**:
   - AI يكتب الكود/الاستعلام -> المستخدم ينفذ -> المستخدم يعيد النتيجة -> AI يحلل
     ويكمل العمل.

## 5. إدارة الحالة (Redux Toolkit)

- يجب استخدام **Slices** منفصلة لكل ميزة رئيسية.
- استخدام **Async Thunks** للعمليات غير المتزامنة (API Calls).
- يجب فصل المنطق (Business Logic) عن واجهة المستخدم (UI) ووضعه داخل الـ Thunks
  أو Services.

## 6. جودة الكود (Code Quality)

- **Clean Code**: كتابة كود مقروء، دوال قصيرة ومحددة المسؤولية (Single
  Responsibility).
- **Reusable Components**: تجنب تكرار الكود (DRY) وبناء مكونات قابلة لإعادة
  الاستخدام.
- **Refactoring**: اقتراح تحسين الكود القديم إذا وجد أنه يخالف هذه القواعد.
- **Strict Typing**: استخدام TypeScript بصرامة وتجنب استخدام `any` قدر الإمكان.

## 7. الأمان (Security - Critical Rules)

**قواعد صارمة لحماية التطبيق والبيانات:**

### 7.1 حماية المفاتيح السرية (API Keys & Secrets)

- **ممنوع منعًا باتًا**: كتابة أي مفتاح سري (API Keys, Database Passwords, Tokens)
  داخل الكود مباشرة.
- **الطريقة الصحيحة**: استخدام متغيرات البيئة (Environment Variables) فقط:
  ```bash
  # .env.local (لا يُرفع للـ Git أبداً)
  NEXT_PUBLIC_SUPABASE_URL=your_url
  SUPABASE_SERVICE_ROLE_KEY=your_key
  ```
- **التحقق من `.gitignore`**: يجب التأكد دائماً من أن ملفات `.env*` مدرجة في
  `.gitignore`.
- **التفرقة بين المفاتيح**:
  - `NEXT_PUBLIC_*`: مفاتيح يمكن كشفها للعميل (Client-Side).
  - بدون `NEXT_PUBLIC_`: مفاتيح سرية للخادم فقط (Server-Side).

### 7.2 المصادقة والترخيص (Authentication & Authorization)

- **Supabase Auth**: استخدام نظام المصادقة المدمج في Supabase لإدارة المستخدمين.
- **Row Level Security (RLS)**: تفعيل RLS على جميع الجداول الحساسة في Supabase
  لضمان أن المستخدم يصل فقط لبياناته.
- **Middleware Protection**: حماية المسارات الحساسة (`/admin`, `/warehouse`,
  `/payment`) عبر `middleware.ts`.
- **Token Validation**: التحقق من صحة الـ JWT Tokens في كل طلب API حساس.

### 7.3 Rate Limiting

- **تطبيق Rate Limiting**: منع الهجمات (DDoS, Brute Force) بتحديد عدد الطلبات
  المسموحة:
  - طلبات المصادقة: 5 طلبات/دقيقة.
  - طلبات حساسة (Admin/Payments): 10 طلبات/دقيقة.
  - طلبات عامة: 100 طلب/دقيقة.
- **التنفيذ**: استخدام `middleware.ts` مع مكتبة Rate Limiting (موجودة في
  المشروع).

### 7.4 التحقق من المدخلات (Input Validation)

- **استخدام Zod**: جميع النماذج يجب أن تستخدم Zod Schema للتحقق من صحة البيانات.
- **Sanitization**: تنظيف البيانات من أي أكواد خبيثة (XSS, SQL Injection).
- **التحقق على مستوى الخادم**: لا تثق أبداً بالبيانات القادمة من العميل، تحقق منها
  على الخادم دائماً.

### 7.5 Security Headers

- **إضافة Security Headers** في `next.config.js`:
  ```javascript
  headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  ];
  ```

### 7.6 تسجيل الأحداث الأمنية (Security Logging)

- **تسجيل جميع المحاولات المشبوهة**:
  - محاولات الدخول الفاشلة.
  - الوصول غير المصرح به.
  - تجاوز حدود Rate Limiting.
- **استخدام Audit Logger**: المتوفر في `lib/auditLogger.ts`.

## 8. الأداء (Performance Optimization)

**قواعد لضمان أداء عالي وسرعة استجابة ممتازة:**

### 8.1 Next.js App Router Best Practices

- **Server Components by Default**: جميع المكونات يجب أن تكون Server Components
  ما لم يكن هناك حاجة للتفاعل (interactivity).
- **استخدام `'use client'`**: فقط عند الحاجة لـ:
  - `useState`, `useEffect`, `useContext`
  - Event Handlers (onClick, onChange)
  - Browser APIs
- **فصل المنطق عن الواجهة**: Server Components تجلب البيانات، Client Components
  تعرض التفاعل.

### 8.2 تحسين الصور (Image Optimization)

- **استخدام `next/image`**: دائماً بدلاً من `<img>` التقليدي.
- **تحديد الأبعاد**: إضافة `width` و `height` لتجنب Layout Shift.
- **استخدام `priority`**: للصور المهمة فوق الطية (Above the Fold).
- **تنسيقات حديثة**: Next.js يحول الصور تلقائياً إلى WebP/AVIF.

### 8.3 Code Splitting & Lazy Loading

- **Dynamic Imports**: لتحميل المكونات الثقيلة عند الحاجة فقط:
  ```typescript
  import dynamic from "next/dynamic";
  const HeavyChart = dynamic(() => import("./HeavyChart"), {
      loading: () => <Spinner />,
      ssr: false, // إذا كان المكون يعتمد على Browser APIs
  });
  ```
- **Route-Based Splitting**: Next.js يقوم بهذا تلقائياً لكل صفحة.

### 8.4 Data Fetching Strategies

- **Server-Side Rendering (SSR)**: للبيانات الديناميكية المهمة لـ SEO:
  ```typescript
  // في مكون Server Component
  async function getData() {
      const res = await fetch("...", { cache: "no-store" });
      return res.json();
  }
  ```
- **Static Site Generation (SSG)**: للصفحات الثابتة (إن وجدت).
- **Incremental Static Regeneration (ISR)**: للتوازن بين SSR و SSG:
  ```typescript
  fetch("...", { next: { revalidate: 3600 } }); // إعادة البناء كل ساعة
  ```

### 8.5 Redux Performance

- **Memoization**: استخدام `createSelector` من Reselect لتجنب إعادة الحساب:
  ```typescript
  import { createSelector } from '@reduxjs/toolkit';
  const selectFilteredData = createSelector(
    [state => state.items, state => state.filter],
    (items, filter) => items.filter(item => /* logic */)
  );
  ```
- **تجنب الـ Re-renders**: استخدام `React.memo` للمكونات الثقيلة.
- **Slice Splitting**: فصل الـ Slices حسب الميزة لتجنب تحميل كل الـ Store.

### 8.6 Bundle Size Optimization

- **تحليل الحجم**: استخدام `@next/bundle-analyzer`:
  ```bash
  npm run build
  ANALYZE=true npm run build
  ```
- **Tree Shaking**: استيراد الدوال المحددة فقط:
  ```typescript
  import { Button } from "@/components/ui/button"; // ✅
  import * as UI from "@/components/ui"; // ❌
  ```
- **تجنب المكتبات الضخمة**: اختيار alternatives خفيفة (مثل: `date-fns` بدل
  `moment.js`).

### 8.7 Database & API Performance

- **Supabase Query Optimization**:
  - استخدام `select()` لجلب الحقول المطلوبة فقط.
  - تجنب `select('*')` إلا عند الضرورة.
  - استخدام Indexes على الحقول المستخدمة في `WHERE` و `ORDER BY`.
- **API Caching**: استخدام `cache` في `fetch()` أو Redis للكاش.
- **Connection Pooling**: Supabase يدعم هذا، التأكد من استخدام Connection Pool
  في البيئة Production.

### 8.8 Monitoring & Profiling

- **Next.js Speed Insights**: تفعيل Vercel Analytics لمراقبة الأداء.
- **React DevTools Profiler**: لتحليل Re-renders.
- **Lighthouse**: فحص دوري للأداء (يجب أن يكون Score > 90).

---

**تنبيه هام**: أي تطوير جديد يجب أن يبدأ بقراءة وفهم هذه القواعد، وأي خروج عنها
يعتبر خطأ يجب تصحيحه فوراً.
