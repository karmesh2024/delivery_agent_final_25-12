# توثيق الوحدة المشتركة للمصادقة والصلاحيات (`_shared/auth.ts`)

## 1. مقدمة

يهدف هذا المستند إلى توفير شرح تفصيلي للوحدة المشتركة `_shared/auth.ts` الموجودة ضمن دوال الحافة (Edge Functions) لمشروع Supabase. هذه الوحدة بمثابة مكتبة مركزية تحتوي على مجموعة من الوظائف والواجهات والأنواع المتعلقة بعمليات المصادقة (Authentication) والتحقق من الصلاحيات (Authorization).

**الغرض الأساسي من `_shared/auth.ts`:**

*   **توحيد منطق المصادقة والصلاحيات:** بدلاً من تكرار كود التحقق من رموز JWT أو صلاحيات المستخدم في كل دالة حافة، يتم توفير هذا المنطق في مكان واحد.
*   **إعادة الاستخدام:** يمكن لأي دالة حافة تحتاج إلى تأمين نفسها أو التحقق من صلاحيات مستخدم معين أن تستورد وتستخدم الوظائف من هذه الوحدة.
*   **تحسين الصيانة:** أي تحديثات أو تعديلات على منطق المصادقة أو الأدوار تتم في هذا الملف المركزي، مما يسهل عملية الصيانة ويقلل من احتمالية الأخطاء.
*   **تعزيز الأمان:** من خلال توفير أدوات موحدة للتحقق من الهوية والصلاحيات، تساعد هذه الوحدة في بناء دوال حافة أكثر أمانًا.

## 2. المكونات الرئيسية للوحدة

يحتوي ملف `_shared/auth.ts` على عدة مكونات رئيسية مُصدَّرة (`export`) يمكن استخدامها في دوال الحافة الأخرى:

### 2.1. `verifyToken(req: Request, supabaseUrl: string, supabaseKey: string, requiredRoles?: UserRole[]): Promise<UserInfo>`

*   **الوظيفة:** هي الدالة الأساسية للتحقق من رمز JWT المُرسل في ترويسة `Authorization` للطلب (`req`).
*   **المدخلات:**
    *   `req`: كائن الطلب (Request) الذي يحتوي على الترويسات.
    *   `supabaseUrl`: عنوان URL الخاص بمشروع Supabase (عادةً من `Deno.env.get('SUPABASE_URL')`).
    *   `supabaseKey`: مفتاح Supabase (عادةً `SUPABASE_ANON_KEY` أو `SUPABASE_SERVICE_ROLE_KEY` حسب الحاجة، ولكن للتحقق من توكن المستخدم يُفضل `ANON_KEY`).
    *   `requiredRoles` (اختياري): مصفوفة من الأدوار (`UserRole[]`) المطلوبة لتنفيذ الإجراء. إذا تم توفيرها، ستقوم الدالة بالتحقق مما إذا كان دور المستخدم المستخرج من التوكن وبياناته يطابق أحد هذه الأدوار.
*   **المخرجات:**
    *   تُرجع `Promise` يؤول إلى كائن `UserInfo` إذا كان التوكن صالحًا والمستخدم لديه الصلاحيات المطلوبة (إذا تم تحديدها).
    *   تُطلق خطأ (`AuthError`) في الحالات التالية:
        *   عدم وجود ترويسة `Authorization`.
        *   صيغة توكن غير صالحة.
        *   توكن غير صالح أو منتهي الصلاحية.
        *   عدم العثور على المستخدم في جدول `admins` أو `users`.
        *   عدم كفاية الصلاحيات (إذا تم تحديد `requiredRoles` ولم يتطابق دور المستخدم).
*   **المنطق الداخلي:**
    1.  تستخرج التوكن من ترويسة `Authorization: Bearer <token>`.
    2.  تُنشئ عميل Supabase باستخدام `supabaseUrl` و `supabaseKey` والتوكن المستخرج.
    3.  تستدعي `supabase.auth.getUser()` للتحقق من صحة التوكن واستخلاص معلومات المستخدم الأساسية من Supabase Auth.
    4.  تستعلم من جدول `public.admins` (ثم `public.users` كاحتياطي) لجلب معلومات المستخدم التفصيلية ودوره المخصص في التطبيق.
    5.  تتحقق من الصلاحيات المطلوبة (`requiredRoles`) إذا تم توفيرها.

### 2.2. `UserInfo` (واجهة - Interface)

*   **الوصف:** تُمثل هيكل البيانات لمعلومات المستخدم التي تُرجعها دالة `verifyToken`.
*   **الحقول النموذجية:**
    *   `id: string` (معرف المستخدم من جدول `admins` أو `users`).
    *   `email: string`.
    *   `role: UserRole` (دور المستخدم في النظام).
    *   `department_id?: string` (اختياري).
    *   `metadata?: Record<string, unknown>` (اختياري، لأي بيانات إضافية).

### 2.3. `UserRole` (نوع - Type)

*   **الوصف:** يُمثل الأدوار المختلفة الممكنة للمستخدمين في النظام.
*   **مثال:** `'super_admin' | 'admin' | 'manager' | 'viewer' | 'finance_manager' | ...`
*   يجب تحديث هذا النوع ليعكس جميع الأدوار المستخدمة فعليًا في التطبيق.

### 2.4. `ROLE_HIERARCHY` (كائن - Object)

*   **الوصف:** يُعرّف التسلسل الهرمي للأدوار، حيث يُعطى لكل دور قيمة رقمية تمثل مستواه.
*   **مثال:**
    ```typescript
    export const ROLE_HIERARCHY = {
      'super_admin': 100,
      'admin': 90,
      // ... باقي الأدوار ومستوياتها
    };
    ```
*   **الاستخدام:** يُستخدم داخليًا (مثلاً بواسطة `hasRoleAccess` أو في دالة `auth/index.ts` لإضافة `role_level` للاستجابة).

### 2.5. `AuthError` (فئة - Class)

*   **الوصف:** فئة خطأ مخصصة تُطلقها `verifyToken` عند حدوث مشاكل في المصادقة أو الصلاحيات.
*   **الخصائص:**
    *   `message: string` (رسالة الخطأ).
    *   `statusCode: number` (رمز حالة HTTP المقترح، عادةً 401 أو 403).

### 2.6. `hasRoleAccess(userRole: UserRole, minimumRole: UserRole): boolean`

*   **الوظيفة:** تتحقق مما إذا كان دور المستخدم (`userRole`) يملك صلاحية مساوية أو أعلى من الحد الأدنى للدور المطلوب (`minimumRole`) بناءً على `ROLE_HIERARCHY`.
*   **الاستخدام:** مفيدة للتحقق من الصلاحيات بطريقة هرمية.

### 2.7. `isValidUserRole(role: string): boolean`

*   **الوظيفة:** تتحقق مما إذا كان السلسلة النصية المُدخلة (`role`) تمثل دورًا صالحًا مُعرفًا في `ROLE_HIERARCHY`.
*   **الاستخدام:** للتحقق من صحة قيمة الدور قبل استخدامها.

### 2.8. `getAdminByUserId(userId: string): Promise<{ admin: any | null, error: Error | null }>`

*   **الوظيفة:** تقوم بجلب بيانات مسؤول معين من جدول `admins` بناءً على `user_id` (الذي يكون عادةً معرف المستخدم من `auth.users`).
*   **الاستخدام:** يمكن استخدامها في دوال الحافة التي تحتاج إلى جلب تفاصيل مسؤول معين لعمليات لاحقة.

### 2.9. `createAuditLog(...)`

*   **الوظيفة:** تقوم بإنشاء سجل تدقيق (audit log) في جدول `audit_logs`.
*   **الاستخدام:** لتسجيل الإجراءات الهامة التي يقوم بها المستخدمون أو النظام، مما يساعد في التتبع والتحليل الأمني.

## 3. كيفية الاستخدام في دوال الحافة الأخرى

لتأمين دالة حافة والتحقق من صلاحيات المستخدم، اتبع الخطوات التالية:

1.  **الاستيراد:** قم باستيراد الوظائف والأنواع الضرورية من `_shared/auth.ts` في بداية ملف دالة الحافة:
    ```typescript
    import { 
      verifyToken, 
      UserInfo, 
      AuthError, 
      UserRole, 
      hasRoleAccess 
      // ... أي مكونات أخرى تحتاجها 
    } from '../_shared/auth.ts'; // تأكد من صحة المسار النسبي
    ```

2.  **استدعاء `verifyToken`:** في بداية منطق معالجة الطلب (عادةً داخل دالة `serve`), قم باستدعاء `await verifyToken(...)`:
    ```typescript
    serve(async (req: Request) => {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!; // أو SERVICE_ROLE_KEY حسب الحاجة
      
      try {
        // تحديد الأدوار المطلوبة (اختياري)
        const requiredRoles: UserRole[] = ['admin', 'manager']; 
        const userInfo: UserInfo = await verifyToken(req, supabaseUrl, supabaseAnonKey, requiredRoles);

        // إذا وصل التنفيذ إلى هنا، فالمستخدم مصادق عليه ولديه الصلاحيات المطلوبة
        console.log(`User ${userInfo.email} (Role: ${userInfo.role}) is authorized.`);
        
        // (اختياري) يمكنك استخدام hasRoleAccess لمزيد من التحققات
        if (hasRoleAccess(userInfo.role, 'manager')) {
          // منطق خاص بالمدراء أو أعلى
        }

        // ... ابدأ بتنفيذ المنطق الأساسي لدالة الحافة ...
        const responseData = { message: `Hello ${userInfo.email}, you have access!` };
        return new Response(JSON.stringify(responseData), { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        });

      } catch (error) {
        if (error instanceof AuthError) {
          return new Response(JSON.stringify({ error: error.message }), { 
            status: error.statusCode, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }
        // معالجة أخطاء أخرى غير متوقعة
        return new Response(JSON.stringify({ error: 'Internal server error' }), { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
    });
    ```

## 4. اعتبارات الأمان وأفضل الممارسات

*   **مفتاح Supabase:** عند استدعاء `verifyToken` للتحقق من توكن مستخدم قادم من العميل، يُفضل استخدام `SUPABASE_ANON_KEY`. يُستخدم `SUPABASE_SERVICE_ROLE_KEY` بحذر شديد للعمليات التي تتطلب صلاحيات كاملة *بعد* التحقق من هوية المستخدم وصلاحياته.
*   **الأدوار المطلوبة:** كن محددًا قدر الإمكان عند تعريف `requiredRoles`.
*   **معالجة الأخطاء:** تأكد دائمًا من معالجة الأخطاء التي قد تُطلقها `verifyToken` (خاصة `AuthError`) وإرجاع استجابات HTTP مناسبة.
*   **RLS (Row Level Security):** لا تزال سياسات RLS على جداول قاعدة البيانات خط دفاع مهم. `_shared/auth.ts` يوفر طبقة إضافية من التحقق على مستوى دالة الحافة.
*   **التحديثات:** حافظ على تحديث الأدوار (`UserRole`) والتسلسل الهرمي (`ROLE_HIERARCHY`) في `_shared/auth.ts` لتعكس أي تغييرات في نظام الصلاحيات الخاص بتطبيقك.

## 5. الاستخدامات المستقبلية والتوسع

*   **إضافة أنواع صلاحيات أكثر تعقيدًا:** يمكن توسيع الوحدة لدعم نماذج صلاحيات أكثر تفصيلاً (مثلاً، صلاحيات على مستوى الكيان أو صلاحيات مخصصة).
*   **التكامل مع أنظمة أخرى:** إذا تم استخدام أنظمة مصادقة خارجية، يمكن تكييف `verifyToken` للتعامل مع أنواع مختلفة من التوكنات.
*   **التدقيق والتسجيل المركزي:** يمكن تعزيز وظيفة `createAuditLog` أو إضافة وظائف تسجيل أخرى لتتبع محاولات المصادقة الناجحة والفاشلة.

---

هذا المستند يوفر نظرة عامة على وحدة `_shared/auth.ts`. يُنصح بالرجوع إلى الكود المصدري الفعلي للملف للحصول على أحدث التفاصيل والتعريفات. 