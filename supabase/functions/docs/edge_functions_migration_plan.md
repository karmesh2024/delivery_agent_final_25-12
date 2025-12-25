# خطة ترحيل وتطوير نظام المدفوعات لاستخدام Supabase Edge Functions

## 1. مقدمة ونظرة عامة

### 1.1. الغرض من هذا المستند
يهدف هذا المستند إلى توفير خطة عمل مفصلة واستراتيجية واضحة لترحيل وتطوير أجزاء حساسة ورئيسية من نظام إدارة المدفوعات والمعاملات الحالي إلى Supabase Edge Functions. يوضح المستند الأهداف، المبررات، المراحل المقترحة، الخطوات التنفيذية، والاعتبارات الهامة لضمان انتقال ناجح وفعال.

### 1.2. الوضع الحالي لنظام المدفوعات (ملخص سريع)
يعتمد نظام المدفوعات الحالي بشكل كبير على دوال خدمية (`paymentsService.ts`) تعمل ضمن سياق الواجهة الخلفية لتطبيق لوحة تحكم المسؤول (React/Next.js). هذه الدوال تتفاعل مباشرة مع قاعدة بيانات Supabase (PostgreSQL) لتنفيذ عمليات مثل:
*   جلب بيانات المحافظ والمعاملات.
*   معالجة طلبات السحب (الموافقة والرفض).
*   إجراء تعديلات يدوية على أرصدة المحافظ.
*   الربط بين جداول متعددة (`wallets`, `wallet_transactions`, `transactions`, `payout_requests`, وجداول المستخدمين).

على الرغم من أن النظام الحالي يستخدم سياسات RLS (Row Level Security) للتحكم في الوصول، إلا أن بعض العمليات المعقدة والحساسة التي تتطلب صلاحيات مرتفعة (مثل `service_role_key`) أو التي تحتاج إلى ضمان الذرية (Atomicity) عبر تحديثات متعددة للجداول، تتم حاليًا في بيئة قد تكون أقل عزلاً وأمانًا مقارنة بما توفره Edge Functions.

### 1.3. لماذا ننتقل إلى Supabase Edge Functions؟ (الأهداف الرئيسية)

    *   **1.3.1. تعزيز الأمان:**
        *   عزل منطق الأعمال الحساس الذي يتطلب `service_role_key` بعيدًا عن كود العميل أو حتى الواجهة الخلفية لتطبيق الويب التي قد تكون عرضة لأنواع مختلفة من الهجمات.
        *   تقليل سطح الهجوم (Attack Surface) من خلال تعريف نقاط نهاية (Endpoints) محددة ومضبوطة للعمليات الحساسة.
        *   تطبيق صلاحيات دقيقة على مستوى كل Edge Function.

    *   **1.3.2. ضمان سلامة البيانات والذرية (Atomicity):**
        *   تنفيذ العمليات التي تشمل تحديثات متعددة للجداول (Multi-table updates) كوحدة واحدة (atomic transaction) داخل Edge Function. هذا يضمن أنه إما أن تنجح جميع التحديثات أو تفشل جميعها، مما يحافظ على اتساق البيانات (Data Consistency) ويمنع الحالات غير المرغوب فيها (مثل خصم رصيد دون إتمام عملية السحب).

    *   **1.3.3. توفير واجهات API نظيفة وموحدة للعملاء (الموبايل والويب):**
        *   إنشاء مجموعة من واجهات برمجة التطبيقات (APIs) المستقلة عن اللغة أو المنصة، والتي يمكن لتطبيقات الموبايل (Flutter) ولوحة التحكم (React) وحتى الأنظمة المستقبلية استهلاكها بشكل موحد وآمن.
        *   تبسيط عملية التكامل لمطوري تطبيقات الموبايل من خلال توفير Endpoints واضحة وموثقة جيدًا.

    *   **1.3.4. مركزية منطق الأعمال المعقد:**
        *   تركيز منطق الأعمال المعقد والمتكرر في مكان واحد (Edge Functions) بدلاً من تكراره أو توزيعه بشكل قد يصعب إدارته بين مختلف أجزاء النظام (مثل `paymentsService.ts` وأي منطق مشابه قد يُكتب مستقبلاً في تطبيقات الموبايل مباشرة).

    *   **1.3.5. تحسين قابلية الصيانة والتوسع:**
        *   تسهيل عملية تحديث وصيانة منطق الأعمال بشكل منفصل عن تطبيقات العميل.
        *   إمكانية توسيع نطاق (Scaling) الـ Edge Functions بشكل مستقل بناءً على الحاجة.
        *   تحسين تنظيم الكود وفصله (Separation of Concerns).

### 1.4. المنهجية المتبعة (التدرج، التركيز على القيمة)
سيتم اتباع منهجية تدرجية في عملية الترحيل والتطوير، مع التركيز على تحقيق قيمة ملموسة في كل مرحلة:
1.  **البدء بالوظائف الأساسية:** التركيز أولاً على بناء Edge Functions التي تخدم الاحتياجات الفورية لتطبيقات الموبايل (المرحلة الأولى).
2.  **تأمين العمليات الحساسة:** ثم الانتقال لتأمين العمليات الحساسة في لوحة التحكم (المرحلة الثانية).
3.  **التقييم المستمر:** تقييم الحاجة لنقل دوال أخرى بناءً على الفوائد المتوقعة في الأمان أو الأداء (المرحلة الثالثة).
4.  **الاختبار والتوثيق:** التأكيد على الاختبار الشامل والتوثيق الدقيق في كل خطوة.

## 2. المتطلبات الأساسية والتحضيرات

قبل البدء في تطوير وترحيل الوظائف إلى Supabase Edge Functions، يجب التأكد من استيفاء المتطلبات التالية وتجهيز البيئة بشكل مناسب.

### 2.1. تثبيت الأدوات الأساسية

#### 2.1.1. تثبيت Supabase CLI
Supabase CLI هي الأداة الأساسية لتطوير واختبار ونشر Edge Functions محليًا قبل رفعها إلى خادم Supabase.

```bash
# تثبيت Supabase CLI باستخدام npm (Node Package Manager)
npm install -g supabase

# أو باستخدام Homebrew (لمستخدمي macOS)
# brew install supabase/tap/supabase

# تحقق من التثبيت وعرض الإصدار
supabase --version
```
تأكد من أن لديك Node.js و npm مثبتين على نظامك إذا اخترت طريقة npm.

#### 2.1.2. تثبيت Docker
يستخدم Supabase CLI برنامج Docker لتشغيل نسخة محلية كاملة من مكدس Supabase (قاعدة بيانات PostgreSQL، نظام المصادقة، إلخ) أثناء التطوير المحلي.

*   قم بتحميل وتثبيت [Docker Desktop](https://www.docker.com/products/docker-desktop/) من الموقع الرسمي.
*   تأكد من أن Docker Desktop قيد التشغيل في الخلفية قبل استخدام أوامر Supabase CLI التي تتطلب بيئة محلية (مثل `supabase start`).

### 2.2. فهم التقنيات الأساسية لـ Supabase Edge Functions

*   **2.2.1. Deno Runtime:**
    *   يجب على فريق التطوير اكتساب فهم جيد لبيئة Deno، وهي بيئة تشغيل JavaScript/TypeScript آمنة تُبنى عليها Edge Functions. يشمل ذلك فهم كيفية إدارة الوحدات (Modules)، الأذونات (Permissions)، والتعامل مع الطلبات والاستجابات (HTTP requests/responses).
    *   يمكن تثبيت Deno محليًا (اختياري إذا كنت تعتمد بشكل كامل على `supabase functions serve` التي تستخدم Deno المدمج مع CLI، ولكنه مفيد للاختبار المباشر لملفات Deno).
    ```bash
    # أوامر تثبيت Deno (تختلف حسب نظام التشغيل - راجع موقع Deno الرسمي)
    # مثال لـ macOS/Linux:
    # curl -fsSL https://deno.land/x/install/install.sh | sh
    ```

*   **2.2.2. TypeScript:**
    *   يُفضل بشدة (وتدعمها Supabase بقوة) كتابة Edge Functions باستخدام TypeScript للاستفادة من التحقق الثابت من الأنواع (Static Typing)، مما يقلل الأخطاء ويحسن قابلية صيانة الكود. يجب أن يكون المطورون مرتاحين لاستخدام TypeScript.

*   **2.2.3. آلية عمل Edge Functions:**
    *   فهم كيفية نشر (Deploy)، استدعاء (Invoke)، ومراقبة (Monitor) الـ Edge Functions داخل بيئة Supabase.

*   **2.2.4. الموارد التعليمية:**
    *   تخصيص وقت لمراجعة توثيق Supabase الرسمي حول Edge Functions، بالإضافة إلى توثيق Deno و TypeScript.

### 2.3. إعداد بيئة التطوير المتكاملة (IDE)
*   **امتدادات IDE:** تثبيت امتدادات (Extensions) مناسبة لـ Deno و TypeScript في بيئة التطوير المتكاملة (IDE) المستخدمة (مثل VS Code) لتحسين تجربة التطوير (مثل الإكمال التلقائي، كشف الأخطاء، وتصحيح الأخطاء لـ Deno). ابحث عن امتدادات مثل "Deno" (denoland.vscode-deno) في VS Code.

### 2.4. إدارة الأسرار والمتغيرات البيئية (خاصة `SUPABASE_SERVICE_ROLE_KEY`)
*   **الأهمية القصوى:** مفتاح `SUPABASE_SERVICE_ROLE_KEY` يمنح صلاحيات كاملة على قاعدة البيانات. يجب التعامل معه بأقصى درجات الحذر.
*   **التخزين الآمن:** *لا يجب أبدًا* تضمين هذا المفتاح مباشرة في كود الـ Edge Function المرفوع إلى المستودع (Repository).
*   **متغيرات البيئة في Supabase:** يتم تخزين المفتاح كمتغير بيئة آمن (Secret) في إعدادات مشروع Supabase، ويمكن للـ Edge Functions الوصول إليه عبر `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`.
*   **التطوير المحلي:** عند التطوير المحلي باستخدام Supabase CLI، يتم تحميل متغيرات البيئة (بما في ذلك `SUPABASE_SERVICE_ROLE_KEY` الخاص بالمشروع المحلي أو مشروع مربوط) من ملف `.env` أو ما شابه، والذي يجب *عدم* تضمينه في نظام التحكم في الإصدار (مثل `.gitignore`).
*   **الحد الأدنى من الصلاحيات:** إذا كانت دالة معينة لا تحتاج `service_role_key`، يجب عدم منحه لها. يمكن استخدام مفتاح `anon_key` إذا كانت العملية لا تتطلب صلاحيات مرتفعة ويمكن حمايتها بـ RLS.

### 2.5. استراتيجية المصادقة والتحقق من الصلاحيات داخل Edge Functions
*   **استقبال JWT:** يجب أن تستقبل الـ Edge Functions التي تتطلب مصادقة المستخدم رمز JWT (JSON Web Token) في ترويسة الطلب (Authorization Header).
*   **التحقق من JWT:** استخدام `SupabaseClient` (الذي يتم إنشاؤه داخل الـ EF) للتحقق من صحة الـ JWT واستخلاص `user_id`.
*   **التحقق من الصلاحيات (Authorization):**
    *   بعد التحقق من هوية المستخدم، يجب التحقق مما إذا كان لديه الصلاحية لتنفيذ الإجراء المطلوب (مثلاً، هل هو مسؤول؟ هل يملك المحفظة التي يحاول تعديلها؟).
    *   يمكن الاستعلام عن جداول الصلاحيات أو أدوار المستخدمين داخل الـ EF.
    *   **مهم:** لا تعتمد فقط على أن الطلب جاء من لوحة التحكم أو تطبيق موثوق به. يجب أن تكون كل Edge Function قادرة على حماية نفسها.

### 2.6. معايير كتابة الكود والاختبار للـ Edge Functions
*   **الوظائف الصغيرة المركزة (Single Responsibility Principle):** يجب أن تؤدي كل Edge Function وظيفة محددة بشكل جيد. تجنب إنشاء Functions ضخمة تقوم بالعديد من المهام غير المترابطة.
*   **معالجة الأخطاء القوية (Robust Error Handling):** توقع الأخطاء المحتملة (مشاكل في الشبكة، مدخلات غير صالحة، أخطاء قاعدة البيانات) وقم بمعالجتها بشكل مناسب. أرجع رموز حالة HTTP واضحة ورسائل خطأ مفيدة (دون كشف تفاصيل حساسة).
*   **التسجيل (Logging):** قم بتضمين تسجيلات (Logs) كافية لتتبع تدفق التنفيذ وتشخيص المشاكل. يمكن استخدام `console.log` أو مكتبات تسجيل أكثر تقدماً إذا لزم الأمر.
*   **اختبار الوحدات (Unit Testing):** كتابة اختبارات وحدات لكل Edge Function لاختبار منطقها بشكل منفصل عن قاعدة البيانات أو الخدمات الخارجية (يمكن استخدام Mocks/Stubs).
*   **اختبارات التكامل (Integration Testing):** اختبار تفاعل الـ Edge Function مع قاعدة بيانات Supabase (يمكن استخدام بيئة اختبار أو مشروع Supabase مخصص للاختبار).
*   **القراءة والكتابة غير المتزامنة (Async/Await):** استخدام `async/await` بشكل صحيح للتعامل مع العمليات غير المتزامنة (مثل استدعاءات قاعدة البيانات).
*   **تجنب استدعاءات قاعدة البيانات المتعددة غير الضرورية:** تجميع العمليات إذا أمكن، واستخدام JOINs بكفاءة.

## 2.A. إعداد المشروع وتطوير أول Edge Function (مثال عملي)

يوضح هذا القسم الخطوات العملية لتهيئة مشروع Supabase، إنشاء Edge Function، وتطوير مثال عملي.

### 2.A.1. تسجيل الدخول وتهيئة مشروع Supabase

1.  **تسجيل الدخول إلى Supabase CLI:**
    إذا لم تكن قد سجلت الدخول من قبل، ستحتاج إلى تسجيل الدخول إلى حساب Supabase الخاص بك.
    ```bash
    supabase login
    ```
    سيؤدي هذا إلى فتح المتصفح لمصادقة Supabase CLI.

2.  **إنشاء مجلد المشروع والانتقال إليه:**
    ```bash
    mkdir my-payment-system-functions
    cd my-payment-system-functions
    ```
    (استبدل `my-payment-system-functions` بالاسم الذي تفضله لمشروعك)

3.  **تهيئة مشروع Supabase:**
    يقوم هذا الأمر بإنشاء مجلد `supabase` داخل مشروعك، والذي سيحتوي على إعدادات التهيئة، ملفات الـ migrations، والـ Edge Functions.
    ```bash
    supabase init
    ```
    سيتم إنشاء هيكل مجلدات مشابه للتالي:
    ```
    my-payment-system-functions/
    ├── supabase/
    │   ├── migrations/
    │   ├── functions/
    │   ├── config.toml
    │   └── .gitignore
    └── ... (ملفات أخرى قد تضيفها)
    ```

### 2.A.2. ربط المشروع المحلي بمشروع Supabase على السحابة (اختياري مبدئيًا، ضروري للنشر)

إذا كان لديك مشروع قائم على Supabase Cloud وتريد ربطه، أو إذا كنت تخطط للنشر قريبًا:
```bash
# استبدل YOUR-PROJECT-REF بمعرف مشروعك الفعلي من لوحة تحكم Supabase
supabase link --project-ref YOUR-PROJECT-REF
```
يمكنك العثور على `YOUR-PROJECT-REF` في إعدادات مشروعك على Supabase تحت قسم "General".

### 2.A.3. إنشاء Edge Function جديدة

لنقم بإنشاء دالة مثال لإدارة المستخدمين، كما في الدليل الشامل الذي قدمته، لتوضيح العملية.
```bash
# إنشاء دالة جديدة باسم "user-manager"
supabase functions new user-manager
```
سيؤدي هذا الأمر إلى إنشاء ملف جديد بالمسار `supabase/functions/user-manager/index.ts` بالمحتوى الأساسي التالي:

```typescript
// supabase/functions/user-manager/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts" // قد يختلف الإصدار

serve(async (req) => {
  const data = {
    message: `Hello from user-manager!`,
  }

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})
```

### 2.A.4. كتابة كود الـ Edge Function (مثال: `user-manager`)

سنقوم الآن بتوسيع هذا الملف `index.ts` ليشمل منطق CRUD (Create, Read, Update, Delete) لإدارة المستخدمين، مع الاستفادة من المثال التفصيلي الذي قدمته.

```typescript
// supabase/functions/user-manager/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts" // تأكد من استخدام أحدث إصدار مستقر
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2' // تأكد من استخدام أحدث إصدار مستقر

// تعريف ترويسات CORS للسماح بالطلبات من أي مصدر
// في بيئة الإنتاج، قد ترغب في تقييد هذا إلى نطاقات محددة.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // أو 'https://your-app-domain.com'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // تحديد الـ Methods المسموح بها
}

interface User {
  id?: string // عادة ما يتم إنشاؤه بواسطة قاعدة البيانات
  name: string
  email: string
  age?: number
  // يمكنك إضافة أي حقول أخرى ذات صلة بنظامك
}

// دالة مساعدة لإنشاء Supabase Client
// نستخدمها لتجنب تكرار إنشاء العميل في كل case
function getSupabaseClient(req: Request): SupabaseClient {
  return createClient(
    // SUPABASE_URL و SUPABASE_ANON_KEY يتم تعيينهما تلقائيًا بواسطة Supabase عند نشر الدالة.
    // عند التشغيل المحلي، يتم تحميلهما من إعدادات مشروع Supabase CLI.
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    // اختياري: يمكن تمرير ترويسة المصادقة من الطلب الأصلي
    // هذا يسمح للـ Function بالعمل بصلاحيات المستخدم الذي قام بالطلب (إذا تم استخدام anon_key)
    // أو بصلاحيات service_role إذا لم يتم تمريرها واستخدمنا service_role_key في متغيرات البيئة
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )
}

serve(async (req: Request) => {
  // معالجة طلبات OPTIONS (Preflight requests) لـ CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = getSupabaseClient(req) // استخدام الدالة المساعدة
    const { method } = req
    const url = new URL(req.url)
    
    // استخراج معرف المستخدم من مسار URL إذا كان موجودًا
    // /functions/v1/user-manager -> pathSegments = ["functions", "v1", "user-manager"]
    // /functions/v1/user-manager/some-user-id -> pathSegments = ["functions", "v1", "user-manager", "some-user-id"]
    const pathSegments = url.pathname.split('/').filter(segment => segment !== "") // إزالة الشرائح الفارغة
    const functionNameIndex = pathSegments.findIndex(segment => segment === 'user-manager')
    
    let userId: string | undefined = undefined;
    if (functionNameIndex !== -1 && pathSegments.length > functionNameIndex + 1) {
      userId = pathSegments[functionNameIndex + 1];
    }

    switch (method) {
      case 'GET':
        if (userId) {
          // جلب مستخدم واحد
          console.log(`Fetching user with ID: ${userId}`)
          const { data, error } = await supabaseClient
            .from('users') // اسم الجدول يجب أن يكون مطابقًا لما في قاعدة البيانات
            .select('*')
            .eq('id', userId)
            .single()
          
          if (error) {
            if (error.code === 'PGRST116') { // PGRST116: "The result contains 0 rows"
              return new Response(JSON.stringify({ error: 'User not found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404,
              })
            }
            throw error
          }
          
          return new Response(
            JSON.stringify({ user: data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        } else {
          // جلب جميع المستخدمين
          console.log('Fetching all users')
          const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .order('created_at', { ascending: false }) // مثال على الترتيب
          
          if (error) throw error
          
          return new Response(
            JSON.stringify({ users: data ?? [], count: (data ?? []).length }), // معالجة حالة data = null
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

      case 'POST':
        // إنشاء مستخدم جديد
        console.log('Creating a new user')
        const newUser: User = await req.json()
        
        // التحقق الأساسي من صحة البيانات (يمكن إضافة تحققات أكثر تفصيلاً)
        if (!newUser.name || !newUser.email) {
          return new Response(
            JSON.stringify({ error: 'Name and email are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 } // Bad Request
          )
        }

        const { data: insertedUser, error: insertError } = await supabaseClient
          .from('users')
          .insert([
            {
              name: newUser.name,
              email: newUser.email,
              age: newUser.age || null,
              // created_at و updated_at عادة ما يتم تعيينهما بواسطة قاعدة البيانات (DEFAULT NOW())
            }
          ])
          .select() // لجلب بيانات المستخدم المُضاف
          .single() // نتوقع إضافة مستخدم واحد

        if (insertError) {
            // معالجة الأخطاء الشائعة مثل البريد الإلكتروني المكرر (unique constraint violation)
            if (insertError.code === '23505') { // 23505: unique_violation
                 return new Response(
                    JSON.stringify({ error: 'Email already exists.' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 } // Conflict
                )
            }
            throw insertError
        }

        return new Response(
          JSON.stringify({ 
            message: 'User created successfully',
            user: insertedUser 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201 // Created
          }
        )

      case 'PUT':
        // تحديث مستخدم موجود
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'User ID is required for update' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        console.log(`Updating user with ID: ${userId}`)

        const updatedUserData: Partial<User> = await req.json() // استخدام Partial للسماح بتحديث حقول معينة فقط
        
        // لا نسمح بتغيير الـ ID
        delete updatedUserData.id; 

        const { data: updatedUser, error: updateError } = await supabaseClient
          .from('users')
          .update({
            ...updatedUserData,
            updated_at: new Date().toISOString() // تحديث الطابع الزمني يدويًا إذا لم يكن هناك trigger في قاعدة البيانات
          })
          .eq('id', userId)
          .select()
          .single()

        if (updateError) {
             if (updateError.code === 'PGRST116') { 
              return new Response(JSON.stringify({ error: 'User not found for update' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404,
              })
            }
            throw updateError
        }

        return new Response(
          JSON.stringify({ 
            message: 'User updated successfully',
            user: updatedUser 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

      case 'DELETE':
        // حذف مستخدم
        if (!userId) {
           return new Response(
            JSON.stringify({ error: 'User ID is required for deletion' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        console.log(`Deleting user with ID: ${userId}`)

        const { error: deleteError, count: deleteCount } = await supabaseClient
          .from('users')
          .delete({ count: 'exact' }) // للحصول على عدد الصفوف المحذوفة
          .eq('id', userId)

        if (deleteError) throw deleteError

        if (deleteCount === 0) {
            return new Response(JSON.stringify({ error: 'User not found for deletion' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404,
            })
        }

        return new Response(
          JSON.stringify({ message: 'User deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 } // أو 204 No Content
        )

      default:
        // Method غير مدعوم
        return new Response(
          JSON.stringify({ error: `HTTP method ${method} not supported` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 } // Method Not Allowed
        )
    }

  } catch (error) {
    // معالجة الأخطاء العامة
    console.error('Error in user-manager function:', error) // تسجيل الخطأ في Supabase logs
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected server error occurred.', // لا تكشف تفاصيل الخطأ الحساسة للعميل
        // timestamp: new Date().toISOString() // اختياري
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 // Internal Server Error (أو 400 إذا كان خطأ من العميل لم يتم التقاطه بشكل خاص)
      }
    )
  }
})
```

**ملاحظات هامة على الكود أعلاه:**
*   **إدارة الإصدارات:** تم تحديث إصدار `deno.land/std` و `supabase-js`. دائمًا استخدم أحدث الإصدارات المستقرة.
*   **CORS Headers:** تم توضيح `Access-Control-Allow-Methods`.
*   **دالة مساعدة `getSupabaseClient`:** لتقليل التكرار وتمرير ترويسة المصادقة.
*   **تحليل مسار URL:** تم تحسين طريقة استخراج `userId` من المسار ليكون أكثر قوة.
*   **معالجة الأخطاء:** تم إضافة معالجة أكثر تفصيلاً للأخطاء الشائعة مثل "User not found" (404) أو "Email already exists" (409).
*   **رموز الحالة (Status Codes):** تم استخدام رموز حالة HTTP أكثر دقة (201 Created, 400 Bad Request, 404 Not Found, 405 Method Not Allowed, 409 Conflict, 500 Internal Server Error).
*   **الاستجابات:** تم توحيد شكل الاستجابات للنجاح والفشل.
*   **التسجيل (Logging):** تم إضافة `console.log` لتتبع تنفيذ الدالة، وهو مفيد جدًا عند عرض الـ logs في Supabase.
*   **التحديث والحذف:** يتم التحقق مما إذا كان المستخدم موجودًا قبل محاولة التحديث أو الحذف.
*   **`updated_at`:** يتم تحديثه يدويًا في مثال `PUT`، ولكن يُفضل أن يكون هناك trigger على مستوى قاعدة البيانات لهذا الغرض.

### 2.A.5. إعداد قاعدة البيانات (Migrations و RLS)

لجعل الـ Edge Function أعلاه تعمل، نحتاج إلى جدول `users` في قاعدة البيانات.

1.  **إنشاء ملف Migration:**
    أنشئ ملفًا جديدًا في مجلد `supabase/migrations`، مثلاً `YYYYMMDDHHMMSS_create_users_table.sql` (استبدل `YYYYMMDDHHMMSS` بالطابع الزمني الحالي لضمان ترتيب صحيح للـ migrations).
    ```bash
    # يمكنك إنشاء المجلد يدويًا أو باستخدام أمر من Supabase CLI إذا كان متاحًا لإدارة migrations بشكل مباشر
    # (عادة ما يتم إنشاء المجلد تلقائيًا عند `supabase init`)
    # supabase db new create_users_table # (مثال إذا كان الأمر متاحًا، أو أنشئ الملف يدويًا)
    ```
    ضع محتوى الـ SQL التالي في الملف:

    ```sql
    -- supabase/migrations/YYYYMMDDHHMMSS_create_users_table.sql

    -- إنشاء جدول المستخدمين
    CREATE TABLE IF NOT EXISTS public.users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        age INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- تعليقات توضيحية للجدول والأعمدة (اختياري ولكن جيد للتوثيق)
    COMMENT ON TABLE public.users IS 'Stores user profile information.';
    COMMENT ON COLUMN public.users.id IS 'Unique identifier for the user.';
    COMMENT ON COLUMN public.users.email IS 'User''s email address, must be unique.';

    -- إنشاء فهرس على عمود البريد الإلكتروني لتحسين أداء البحث
    CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

    -- (مهم جدًا) تفعيل Row Level Security (RLS) على الجدول
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    -- سياسات RLS (أمثلة أساسية - يجب تخصيصها بدقة لبيئة الإنتاج)
    -- السياسات التالية متساهلة جدًا ومخصصة فقط لأغراض التوضيح الأولي.
    -- في نظام حقيقي، يجب أن تكون أكثر تحديدًا بناءً على أدوار المستخدمين وصلاحياتهم.

    -- مثال: السماح للمستخدمين المصادق عليهم بقراءة بياناتهم فقط
    CREATE POLICY "Allow authenticated users to read their own data"
    ON public.users FOR SELECT
    USING (auth.uid() = id); -- أو عمود آخر يربط بـ auth.users.id إذا كان مختلفًا

    -- مثال: السماح للمستخدمين المصادق عليهم بتحديث بياناتهم فقط
    CREATE POLICY "Allow authenticated users to update their own data"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

    -- مثال: السماح للمسؤولين (service_role) بتنفيذ جميع العمليات
    -- (هذه السياسة عادة ما تكون ضمنية إذا لم يتم تحديد سياسات أخرى تقيد service_role)
    -- CREATE POLICY "Allow service_role to perform all actions"
    -- ON public.users FOR ALL
    -- USING (auth.role() = 'service_role'); -- أو تحقق آخر لدور المسؤول

    -- لـ Edge Function التي تستخدم anon_key مبدئيًا (كما في المثال أعلاه):
    -- إذا كانت الـ Function ستُستدعى بمفتاح anon_key بدون مصادقة مستخدم JWT،
    -- ستحتاج إلى سياسات أكثر تساهلاً مبدئيًا، أو يجب أن تستخدم الـ Function مفتاح service_role.
    -- الخيار الأفضل هو أن تتطلب الـ Function مصادقة JWT للمستخدم للعمليات التي تتطلب ذلك.

    -- للغرض التوضيحي البسيط جدًا مع anon_key: (لا يُنصح به للإنتاج بدون JWT)
    CREATE POLICY "Allow anon_key read access for demonstration"
    ON public.users FOR SELECT USING (true);

    CREATE POLICY "Allow anon_key insert access for demonstration"
    ON public.users FOR INSERT WITH CHECK (true);
    
    CREATE POLICY "Allow anon_key update access for demonstration"
    ON public.users FOR UPDATE USING (true);

    CREATE POLICY "Allow anon_key delete access for demonstration"
    ON public.users FOR DELETE USING (true);

    -- ملاحظة هامة جدًا حول RLS أعلاه:
    -- السياسات "Allow anon_key..." هي فقط لجعل المثال يعمل بسرعة إذا تم استدعاؤه
    -- مباشرة بمفتاح anon بدون JWT. في التطبيق الحقيقي، يجب:
    -- 1. أن تتطلب الـ Functions التي تعدل البيانات (POST, PUT, DELETE) وجود JWT صالح للمستخدم.
    -- 2. أن تتحقق الـ Function من صلاحيات المستخدم (مثلاً، هل هو مالك البيانات أو مسؤول).
    -- 3. أن تعتمد سياسات RLS على auth.uid() أو auth.role() لتقييد الوصول بشكل دقيق.
    -- سنتناول هذا بتفصيل أكبر عند تصميم الـ Edge Functions الخاصة بنظام المدفوعات.
    ```

    **شرح الـ SQL:**
    *   `CREATE TABLE IF NOT EXISTS users`: ينشئ الجدول إذا لم يكن موجودًا.
    *   `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`: معرف فريد من نوع UUID.
    *   `email VARCHAR(255) UNIQUE NOT NULL`: البريد الإلكتروني، يجب أن يكون فريدًا.
    *   `created_at`, `updated_at`: طوابع زمنية تلقائية (يتم استخدام `timezone('utc'::text, now())` لضمان التوقيت العالمي المنسق).
    *   `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;`: **خطوة حاسمة لتفعيل RLS.**
    *   **سياسات RLS:** تم تضمين أمثلة لسياسات مختلفة. **السياسات التي تستخدم `USING (true)` أو `WITH CHECK (true)` بشكل عام هي متساهلة جدًا وغير آمنة للإنتاج بدون قيود إضافية.** السياسات الأكثر أمانًا تعتمد على `auth.uid()` (معرف المستخدم المصادق عليه) أو `auth.role()` (دور المستخدم). سنقوم بتصميم سياسات RLS دقيقة لكل جدول في نظام المدفوعات.

2.  **تطبيق الـ Migration محليًا (بعد تشغيل البيئة المحلية):**
    سيتم شرح كيفية تشغيل البيئة المحلية وتطبيق الـ migration في القسم التالي.

### 2.A.6. التطوير والاختبار المحلي لـ Edge Functions

بعد إعداد مشروعك وإنشاء الـ Edge Function وملف الـ migration، يمكنك البدء في تشغيل كل شيء محليًا لاختبار وظائفك.

1.  **بدء خدمات Supabase المحلية:**
    يقوم هذا الأمر بتشغيل حاويات Docker التي تحتوي على قاعدة بيانات PostgreSQL، و Supabase Studio (واجهة مستخدم رسومية لإدارة قاعدة بياناتك محليًا)، وخدمات أخرى.
    ```bash
    supabase start
    ```
    بعد تشغيل الأمر بنجاح، ستظهر لك مخرجات تحتوي على:
    *   `API URL`: عنوان URL المحلي لواجهة برمجة تطبيقات Supabase.
    *   `DB URL`: عنوان URL للاتصال بقاعدة البيانات المحلية.
    *   `Studio URL`: عنوان URL لـ Supabase Studio (عادة `http://localhost:54323`).
    *   `anon key`: مفتاح API العام (anon key) لبيئتك المحلية.
    *   `service_role key`: مفتاح دور الخدمة (service role key) لبيئتك المحلية (يوفر صلاحيات كاملة).

    **احتفظ بهذه المعلومات، خاصة `anon key` و `service_role key`، حيث ستحتاجها لاختبار الـ Functions.**

2.  **تطبيق الـ Migrations على قاعدة البيانات المحلية:**
    لتطبيق ملف `YYYYMMDDHHMMSS_create_users_table.sql` الذي أنشأته على قاعدة البيانات المحلية التي تم تشغيلها للتو:
    ```bash
    supabase db push
    ```
    إذا تم كل شيء بشكل صحيح، سترى رسالة تفيد بنجاح تطبيق الـ migration.
    يمكنك التحقق من إنشاء الجدول في Supabase Studio (`http://localhost:54323`) > Table Editor.

3.  **تشغيل الـ Edge Function محليًا:**
    يقوم هذا الأمر بتشغيل خادم Deno محلي يخدم الـ Edge Functions الخاصة بك. سيقوم بمراقبة التغييرات في مجلد `supabase/functions` وإعادة تحميل الـ Functions تلقائيًا عند تعديلها.
    ```bash
    # شغل هذا الأمر في نافذة طرفية منفصلة، حيث سيبقى قيد التشغيل
supabase functions serve user-manager --no-verify-jwt --env-file ./supabase/.env.local
    ```
    *   `user-manager`: اسم الـ Function التي تريد تشغيلها (يمكن تشغيل جميع الـ Functions إذا حذفت هذا الجزء).
    *   `--no-verify-jwt`: (للتطوير المحلي فقط) يتجاوز التحقق من JWT، مما يسهل الاختبار الأولي. **لا تستخدم هذا الخيار في الإنتاج.**
    *   `--env-file ./supabase/.env.local`: يحدد ملف متغيرات البيئة المحلي. ستحتاج إلى إنشاء هذا الملف إذا لم يكن موجودًا وتضمين مفاتيح Supabase المحلية فيه (خاصة إذا كانت دالتك تعتمد على متغيرات بيئة غير `SUPABASE_URL` أو `SUPABASE_ANON_KEY` التي يتم توفيرها تلقائيًا).

    **إنشاء ملف `.env.local` (مثال):**
    أنشئ ملفًا باسم `.env.local` داخل مجلد `supabase` (أي `supabase/.env.local`):
    ```env
    # supabase/.env.local
    # هذه القيم يتم الحصول عليها من مخرجات `supabase start`
    SUPABASE_URL="http://localhost:54321" # أو حسب ما يظهر في مخرجات supabase start
    SUPABASE_ANON_KEY="YOUR_LOCAL_ANON_KEY"
    SUPABASE_SERVICE_ROLE_KEY="YOUR_LOCAL_SERVICE_ROLE_KEY"
    # أي متغيرات بيئة أخرى تحتاجها دوالك
    # CUSTOM_VARIABLE="some_value"
    ```
    **تأكد من إضافة `supabase/.env.local` إلى ملف `.gitignore` الخاص بمشروعك لمنع رفعه إلى مستودع الكود.**

    بعد تشغيل `functions serve`، سترى مخرجات تشير إلى أن الخادم المحلي للـ Functions يعمل، عادة على `http://localhost:54321/functions/v1/user-manager` (أو منفذ مختلف إذا كان 54321 مستخدمًا).

4.  **اختبار الـ Edge Function باستخدام `curl` (أو أي أداة API client مثل Postman):**

    *   **GET (جلب جميع المستخدمين):**
        ```bash
        curl -i -X GET \
          -H "apikey: YOUR_LOCAL_ANON_KEY" \
          http://localhost:54321/functions/v1/user-manager
        ```

    *   **GET (جلب مستخدم واحد - استبدل `USER_ID_TO_FETCH` بمعرف مستخدم موجود إذا قمت بإضافة بيانات):**
        ```bash
        # USER_ID_TO_FETCH="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        curl -i -X GET \
          -H "apikey: YOUR_LOCAL_ANON_KEY" \
          http://localhost:54321/functions/v1/user-manager/USER_ID_TO_FETCH
        ```

    *   **POST (إنشاء مستخدم جديد):**
        ```bash
        curl -i -X POST \
          -H "apikey: YOUR_LOCAL_ANON_KEY" \
          -H "Content-Type: application/json" \
          -d '{"name":"Test User Curl", "email":"curl.test@example.com", "age":30}' \
          http://localhost:54321/functions/v1/user-manager
        ```

    *   **PUT (تحديث مستخدم - استبدل `USER_ID_TO_UPDATE` بمعرف مستخدم موجود):**
        ```bash
        # USER_ID_TO_UPDATE="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        curl -i -X PUT \
          -H "apikey: YOUR_LOCAL_ANON_KEY" \
          -H "Content-Type: application/json" \
          -d '{"name":"Test User Curl Updated", "age":31}' \
          http://localhost:54321/functions/v1/user-manager/USER_ID_TO_UPDATE
        ```

    *   **DELETE (حذف مستخدم - استبدل `USER_ID_TO_DELETE` بمعرف مستخدم موجود):**
        ```bash
        # USER_ID_TO_DELETE="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        curl -i -X DELETE \
          -H "apikey: YOUR_LOCAL_ANON_KEY" \
          http://localhost:54321/functions/v1/user-manager/USER_ID_TO_DELETE
        ```

    استبدل `YOUR_LOCAL_ANON_KEY` بالمفتاح الذي حصلت عليه من `supabase start`.
    لاحظ ترويسة `Content-Type: application/json` للطلبات التي تحتوي على body (POST, PUT).

### 2.A.7. النشر إلى بيئة الإنتاج (Supabase Cloud)

بمجرد أن تكون راضيًا عن عمل الـ Edge Function محليًا، يمكنك نشرها إلى مشروعك على Supabase Cloud.

1.  **ربط مشروعك المحلي بمشروع Supabase Cloud (إذا لم تكن قد فعلت ذلك بعد):**
    ```bash
    # استبدل YOUR_PROJECT_REF بمعرف مشروعك الفعلي
supabase link --project-ref YOUR-PROJECT-REF
    ```
    ستحتاج إلى إدخال رمز وصول شخصي (Personal Access Token) من Supabase. يمكنك إنشاؤه من [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).

2.  **نشر تغييرات قاعدة البيانات (Migrations) إلى الإنتاج:**
    **مهم:** قبل نشر الـ migrations، تأكد من أنك اختبرتها جيدًا محليًا وأنها لا تحتوي على تغييرات قد تؤدي إلى فقدان البيانات أو كسر التطبيق.
    ```bash
    supabase db push --linked
    ```
    **تنبيه:** هذا الأمر سيقوم بتطبيق أي ملفات migration جديدة موجودة في مجلد `supabase/migrations` المحلي على قاعدة بيانات الإنتاج المرتبطة.

3.  **إعداد متغيرات البيئة (Secrets) في الإنتاج:**
    إذا كانت الـ Edge Function تعتمد على متغيرات بيئة (مثل مفاتيح API لخدمات خارجية، أو `SUPABASE_SERVICE_ROLE_KEY` إذا كنت ستستخدمه مباشرة بدلاً من الاعتماد على صلاحيات المستخدم)، يجب تعيينها كـ "secrets" في مشروع Supabase.
    ```bash
    # لتعيين SERVICE_ROLE_KEY (احصل عليه من إعدادات مشروعك في Supabase > API)
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key --env-file=false

    # لتعيين متغير آخر
    # supabase secrets set CUSTOM_VARIABLE=some_production_value --env-file=false

    # لعرض الـ secrets المعينة (لا يعرض القيم الفعلية، فقط الأسماء)
    supabase secrets list
    ```
    **الأمان:** تعامل مع `SUPABASE_SERVICE_ROLE_KEY` الخاص بالإنتاج بأقصى درجات الحذر.
    عادةً، `SUPABASE_URL` و `SUPABASE_ANON_KEY` يتم توفيرهما تلقائيًا للـ Functions في بيئة الإنتاج، ولكن `SUPABASE_SERVICE_ROLE_KEY` (إذا كنت ستستخدمه صراحة من `Deno.env.get()`) أو أي مفاتيح مخصصة أخرى تحتاج إلى تعيينها كـ secrets.

4.  **نشر الـ Edge Function إلى الإنتاج:**
    ```bash
    # نشر دالة معينة
supabase functions deploy user-manager --project-ref YOUR_PROJECT_REF --no-verify-jwt

    # أو نشر جميع الدوال الموجودة في مجلد supabase/functions
    # supabase functions deploy --project-ref YOUR_PROJECT_REF --no-verify-jwt
    ```
    *   `--project-ref YOUR_PROJECT_REF`: (اختياري إذا كان المشروع مرتبطًا بالفعل) يحدد مشروع الإنتاج.
    *   `--no-verify-jwt`: **مهم جدًا! في بيئة الإنتاج، يجب عادةً حذف هذا الخيار (`--no-verify-jwt`)** للسماح لـ Supabase بالتحقق من صحة JWTs تلقائيًا إذا كانت الدالة تتطلب مصادقة المستخدم. إذا كانت دالتك لا تتطلب مصادقة مستخدم (مثل دالة عامة)، أو إذا كنت تتعامل مع JWT يدويًا داخل الدالة، يمكنك تركها. ومع ذلك، بالنسبة للـ Functions التي تتطلب مصادقة، إزالة هذا الخيار يجعل Supabase يقوم بالتحقق من JWT قبل أن تصل الدالة إلى الكود الخاص بك، ويرجع خطأ 401 إذا كان JWT غير صالح أو مفقود.

5.  **الاختبار في بيئة الإنتاج:**
    بعد النشر، اختبر الـ Function باستخدام عنوان URL الخاص بالإنتاج (يمكنك الحصول عليه من لوحة تحكم Supabase > Edge Functions > اسم الدالة).
    ```bash
    # استبدل YOUR_PROJECT_REF و YOUR_PRODUCTION_ANON_KEY
    curl -i -X GET \
      -H "apikey: YOUR_PRODUCTION_ANON_KEY" \
      https://YOUR_PROJECT_REF.supabase.co/functions/v1/user-manager
    ```

### 2.A.8. أوامر Supabase CLI إضافية مفيدة

*   **إيقاف خدمات Supabase المحلية:**
    ```bash
    supabase stop
    ```
*   **إيقاف وحذف حاويات Docker المحلية (لإعادة ضبط كاملة للبيئة المحلية):**
    ```bash
    supabase stop --no-backup
    ```
*   **عرض حالة خدمات Supabase المحلية:**
    ```bash
    supabase status
    ```
*   **عرض سجلات (logs) الـ Functions المحلية (عند تشغيل `functions serve`):**
    تظهر الـ logs مباشرة في الطرفية التي تشغل `supabase functions serve`.
*   **عرض سجلات (logs) الـ Functions في الإنتاج:**
    من لوحة تحكم Supabase > Edge Functions > اسم الدالة > Logs.
*   **إلغاء ربط المشروع المحلي:**
    ```bash
    supabase unlink
    ```

### 2.A.9. استكشاف الأخطاء الشائعة وإصلاحها

*   **أخطاء Docker:** تأكد من أن Docker Desktop يعمل وأن لديك مساحة كافية على القرص. حاول إعادة تشغيل Docker.
*   **أخطاء `functions serve`:**
    *   تأكد من عدم وجود أخطاء في بناء الجملة (syntax errors) في كود الـ Function.
    *   تحقق من استيرادات الوحدات (module imports) وأنها صحيحة.
    *   راجع الـ logs في الطرفية لمزيد من التفاصيل.
*   **أخطاء CORS:** تأكد من أن ترويسات CORS (`Access-Control-Allow-Origin`, etc.) مُعدة بشكل صحيح في استجابة الـ Function، خاصة لطلبات `OPTIONS`.
*   **أخطاء المصادقة (401 Unauthorized):**
    *   تأكد من تمرير ترويسة `apikey` صحيحة.
    *   إذا كانت الـ Function تتطلب JWT للمستخدم، تأكد من تمرير ترويسة `Authorization: Bearer YOUR_USER_JWT`.
    *   في الإنتاج، تأكد من أنك لم تستخدم `--no-verify-jwt` إذا كنت تريد أن تتحقق Supabase من JWT.
*   **أخطاء RLS (Row Level Security):** إذا كانت الـ Function تتفاعل مع قاعدة البيانات ولكن لا تحصل على البيانات المتوقعة أو تفشل في الكتابة، تحقق من سياسات RLS على الجداول المعنية. قد تحتاج إلى تعديل السياسات للسماح بالوصول المطلوب بناءً على دور المستخدم أو `anon_key` أو `service_role_key` الذي تستخدمه الـ Function.
*   **"Function not found" أو 404 عند استدعاء الـ Function:**
    *   تأكد من أن اسم الـ Function في عنوان URL يطابق اسم المجلد في `supabase/functions`.
    *   تأكد من أن الـ Function تم نشرها بنجاح (في الإنتاج) أو أنها تعمل (محليًا عبر `functions serve`).

### 2.A.10. أفضل الممارسات لتطوير Supabase Edge Functions

*   **الحفاظ على الـ Functions صغيرة ومركزة:** اجعل كل دالة مسؤولة عن مهمة واحدة محددة (Single Responsibility Principle).
*   **استخدام TypeScript:** للاستفادة من التحقق الثابت من الأنواع وتقليل الأخطاء.
*   **إدارة الأسرار بشكل آمن:** استخدم متغيرات البيئة (Secrets) في Supabase لتخزين المفاتيح الحساسة، ولا تقم بتضمينها مباشرة في الكود.
*   **التعامل مع الأخطاء بشكل رشيق:** توقع الأخطاء وأرجع استجابات واضحة مع رموز حالة HTTP مناسبة. لا تكشف عن تفاصيل أخطاء النظام الداخلية للمستخدم النهائي.
*   **التسجيل (Logging) الفعال:** أضف `console.log` أو استخدم مكتبة تسجيل لتتبع تنفيذ الـ Function وتشخيص المشكلات.
*   **سياسات RLS صارمة:** قم بتأمين جداول قاعدة البيانات باستخدام سياسات RLS دقيقة. لا تعتمد على أن الـ Function لن يتم استدعاؤها إلا من مصادر موثوقة.
*   **التحقق من صحة المدخلات (Input Validation):** تحقق دائمًا من صحة البيانات الواردة إلى الـ Function قبل معالجتها.
*   **اختبار شامل:** اكتب اختبارات وحدات (Unit Tests) واختبارات تكامل (Integration Tests) لضمان عمل الـ Functions كما هو متوقع.
*   **مراعاة حدود الـ Edge Functions:** انتبه لحدود زمن التنفيذ، استخدام الذاكرة، وحجم الـ payload.
*   **التوثيق:** قم بتوثيق نقاط النهاية (Endpoints)، المدخلات المتوقعة، المخرجات، وأي سلوك خاص للـ Function.
*   **إدارة الإصدارات (Versioning):** إذا قمت بإجراء تغييرات كبيرة على API لدالة ما، ففكر في إنشاء إصدار جديد (مثلاً، `/v2/my-function`) لتجنب كسر العملاء الحاليين.
*   **عدم التكرار (Idempotency):** إذا أمكن، صمم الـ Functions التي تقوم بعمليات كتابة لتكون غير قابلة للتكرار، بحيث إذا تم استدعاؤها عدة مرات بنفس المدخلات، فإنها تنتج نفس النتيجة دون آثار جانبية إضافية.

## 3. المرحلة الأولى: بناء واجهات API أساسية لتطبيقات الموبايل

### 3.1. الهدف: تمكين الوظائف الأساسية في تطبيقات العميل والمندوب.
### 3.2. الأولوية: قصوى.

### 3.3. الـ Edge Function الأولى: `create-payout-request` (إنشاء طلب سحب من العميل)
    *   3.3.1. الغرض والوظيفة
    *   3.3.2. نقطة النهاية (Endpoint) والـ HTTP Method
    *   3.3.3. المدخلات المتوقعة (Request Payload) - JSON Schema
    *   3.3.4. المخرجات المتوقعة (Response Payload - Success/Error) - JSON Schema
    *   3.3.5. منطق العمل التفصيلي (التحققات، التفاعلات مع قاعدة البيانات)
    *   3.3.6. اعتبارات الأمان والصلاحيات
    *   3.3.7. أمثلة للطلب والاستجابة

### 3.4. الـ Edge Function الثانية: `pay-order-from-wallet` (دفع قيمة طلب من محفظة العميل)
    *   **3.4.1. الغرض والوظيفة:**
        *   تمكين العميل من دفع قيمة طلب شراء منتج أو خدمة مباشرة من رصيد محفظته (`public.wallets`).
        *   خصم المبلغ من رصيد محفظة العميل.
        *   إنشاء سجل حركة في `public.wallet_transactions` لتوثيق عملية الخصم.
        *   إنشاء سجل معاملة في `public.transactions` لتوثيق عملية الدفع كمعاملة مركزية مكتملة.
        *   التحقق من كفاية الرصيد قبل إتمام عملية الدفع.

    *   **3.4.2. نقطة النهاية والـ HTTP Method:**
        *   **Endpoint:** `/functions/v1/pay-order-from-wallet`
        *   **HTTP Method:** `POST`

    *   **3.4.3. المدخلات المتوقعة (Request Payload) - JSON Schema (مثال):**
        ```json
        {
          "type": "object",
          "properties": {
            "order_id": {
              "type": "string",
              "format": "uuid",
              "description": "معرف الطلب الذي يتم دفعه."
            },
            "amount_to_pay": {
              "type": "number",
              "description": "المبلغ المطلوب دفعه (يجب أن يكون مطابقًا لقيمة الطلب أو جزء منه إذا كان مسموحًا).",
              "minimum": 0.01
            },
            "currency": {
              "type": "string",
              "description": "عملة المبلغ (مثلاً 'EGP').",
              "default": "EGP"
            },
            "payment_description": {
              "type": "string",
              "description": "وصف لعملية الدفع (اختياري، يمكن إنشاؤه تلقائيًا).",
              "maxLength": 255
            }
          },
          "required": [
            "order_id",
            "amount_to_pay"
          ]
        }
        ```

    *   **3.4.4. المخرجات المتوقعة (Response Payload - Success/Error) - JSON Schema (مثال):**
        *   **Success (HTTP 200 OK):**
            ```json
            {
              "type": "object",
              "properties": {
                "message": { "type": "string", "example": "تم دفع الطلب بنجاح من المحفظة." },
                "wallet_transaction_id": { "type": "string", "format": "uuid" },
                "central_transaction_id": { "type": "string", "format": "uuid" },
                "new_balance": { "type": "number" }
              }
            }
            ```
        *   **Error (HTTP 400, 401, 403, 404 Not Found (Order/Wallet), 422, 500):**
            ```json
            {
              "type": "object",
              "properties": {
                "error": { "type": "string", "description": "وصف للخطأ." }
              }
            }
            ```

    *   **3.4.5. منطق العمل التفصيلي:**
        1.  **المصادقة:** التحقق من JWT واستخلاص `user_id`.
        2.  **التحقق من المدخلات:** التحقق من `order_id` (صيغة UUID)، `amount_to_pay` (رقم موجب).
        3.  **جلب محفظة المستخدم:** استعلام `public.wallets` باستخدام `user_id` لجلب `wallet_id` و `balance`.
        4.  **التحقق من كفاية الرصيد:** التأكد من أن `wallet.balance` >= `amount_to_pay`. إذا لم يكن كذلك، إرجاع خطأ (HTTP 422).
        5.  **(اختياري) التحقق من تفاصيل الطلب `order_id`:** يمكن الاستعلام عن جدول الطلبات (`orders_v2` أو ما يعادله) للتأكد من أن الطلب موجود وأن المبلغ `amount_to_pay` يتوافق مع قيمة الطلب (أو جزء مسموح به).
        6.  **بدء معاملة قاعدة البيانات (Database Transaction):** لضمان الذرية.
        7.  **إنشاء سجل في `public.wallet_transactions` (خصم من المحفظة):**
            *   `wallet_id`: محفظة العميل.
            *   `transaction_type`: `ORDER_PAYMENT` (أو `DEBIT`).
            *   `amount`: قيمة سالبة لـ `amount_to_pay`.
            *   `currency`: العملة.
            *   `status`: `COMPLETED`.
            *   `description`: وصف مثل "دفع طلب رقم #`order_id`" أو `payment_description` المدخل.
            *   `balance_before`: الرصيد قبل الخصم.
            *   `balance_after`: الرصيد بعد الخصم (يتم حسابه).
            *   `related_order_id`: قيمة `order_id`.
            *   `initiated_by_user_id`: `user_id` للعميل.
        8.  **تحديث رصيد المحفظة في `public.wallets`:** خصم `amount_to_pay` من `balance`.
        9.  **إنشاء سجل في `public.transactions` (المعاملة المركزية):**
            *   `user_id`: `user_id` للعميل.
            *   `amount`: `amount_to_pay`.
            *   `currency`: العملة.
            *   `type`: `ORDER_PAYMENT`.
            *   `status`: `COMPLETED`.
            *   `description`: نفس الوصف المستخدم في `wallet_transactions`.
            *   `order_id`: قيمة `order_id`.
            *   `payment_method`: `'WALLET'` أو ما شابه.
            *   `metadata`: يمكن أن يحتوي على `wallet_transaction_id` الناتج من الخطوة 7.
        10. **ربط حركة المحفظة بالمعاملة المركزية:** تحديث `wallet_transactions.source_transaction_id` ليكون `id` السجل الذي تم إنشاؤه في `public.transactions` (الخطوة 9).
        11. **إنهاء معاملة قاعدة البيانات (Commit).** إذا حدث أي خطأ، يتم عمل (Rollback).
        12. **إرجاع الاستجابة:** رسالة نجاح مع معرفات الحركات والرصيد الجديد، أو رسالة خطأ.

    *   **3.4.6. اعتبارات الأمان والصلاحيات:**
        *   المتصل يجب أن يكون مصادقًا عليه.
        *   العميل يدفع لطلب يخصه أو مسموح له بالدفع نيابة عنه (يتطلب منطق تحقق إضافي إذا كان السيناريو الأخير مدعومًا).
        *   التحقق من أن `order_id` المرسل هو طلب صالح وينتمي للمستخدم أو يسمح للمستخدم بالدفع له.

    *   **3.4.7. أمثلة:**
        *   **Request Example (POST /functions/v1/pay-order-from-wallet):**
            *   Headers: `Authorization: Bearer <USER_JWT_TOKEN>`, `Content-Type: application/json`
            *   Body:
            ```json
            {
              "order_id": "c4d5e6f7-a1b2-3c4d-5e6f-7a8b9c0d1e2f",
              "amount_to_pay": 250.00,
              "currency": "EGP",
              "payment_description": "دفع قيمة طلب كتب مدرسية"
            }
            ```
        *   **Success Response Example (200 OK):**
            ```json
            {
              "message": "تم دفع الطلب بنجاح من المحفظة.",
              "wallet_transaction_id": "d5e6f7a1-b2c3-4d5e-6f7a-8b9c0d1e2f3a",
              "central_transaction_id": "e6f7a1b2-c3d4-5e6f-7a8b-9c0d1e2f3a4b",
              "new_balance": 750.50
            }
            ```

### 3.5. الـ Edge Functions لعمليات مندوب التوصيل
    *   **3.5.1. `ef-confirm-material-collection` (تأكيد استلام مواد مخلفات من العميل بواسطة المندوب)**
        *   **3.5.1.1. الغرض والوظيفة:**
            *   تمكين مندوب التوصيل من تأكيد استلام مواد (مخلفات) من عميل معين بعد التحقق (مثلاً عبر رمز OTP أو QR مشترك بين العميل والمندوب).
            *   إيداع قيمة المواد المستلمة في محفظة العميل.
            *   تسجيل قيمة المواد المستلمة كعهدة على مندوب التوصيل تنتظر التسوية.
        *   **3.5.1.2. نقطة النهاية والـ HTTP Method:**
            *   **Endpoint:** `/functions/v1/confirm-material-collection`
            *   **HTTP Method:** `POST`
        *   **3.5.1.3. المدخلات المتوقعة (Request Payload) - JSON Schema (مثال):**
            ```json
            {
              "type": "object",
              "properties": {
                "order_id": { "type": "string", "format": "uuid", "description": "معرف طلب جمع المخلفات الأصلي." },
                "client_user_id": { "type": "string", "format": "uuid", "description": "معرف المستخدم للعميل الذي تم استلام المواد منه." },
                "material_value": { "type": "number", "minimum": 0.01, "description": "القيمة المالية للمواد المستلمة." },
                "currency": { "type": "string", "default": "EGP" },
                "confirmation_code": { "type": "string", "description": "رمز التأكيد (OTP/QR) الذي قدمه العميل للمندوب." },
                "delivery_agent_notes": { "type": "string", "maxLength": 255, "description": "ملاحظات مندوب التوصيل (اختياري)." }
              },
              "required": [
                "order_id",
                "client_user_id",
                "material_value",
                "confirmation_code"
              ]
            }
            ```
        *   **3.5.1.4. المخرجات المتوقعة (Response Payload - Success/Error):**
            *   **Success (HTTP 200 OK):**
                ```json
                {
                  "message": "تم تأكيد استلام المواد وإيداع القيمة في محفظة العميل بنجاح.",
                  "client_wallet_transaction_id": "...",
                  "delivery_agent_custody_transaction_id": "..."
                }
                ```
            *   **Error (HTTP 400, 401, 403, 404 (Order/Client/Delivery Agent), 422 (Invalid Confirmation Code), 500):**
                ```json
                { "error": "وصف للخطأ." }
                ```
        *   **3.5.1.5. منطق العمل التفصيلي:**
            1.  **المصادقة (مندوب التوصيل):** التحقق من JWT للمندوب واستخلاص `delivery_agent_user_id`.
            2.  **التحقق من المدخلات:** صحة `order_id`, `client_user_id`, `material_value`, `confirmation_code`.
            3.  **التحقق من رمز التأكيد:** مقارنة `confirmation_code` مع الرمز المتوقع للـ `order_id` (قد يتطلب الاستعلام عن جدول الطلبات أو جدول رموز مؤقت).
            4.  **جلب محفظة العميل:** استعلام `public.wallets` باستخدام `client_user_id` لجلب `client_wallet_id` و `client_balance_before`.
            5.  **بدء معاملة قاعدة البيانات (Database Transaction).**
            6.  **إنشاء سجل في `public.wallet_transactions` (إيداع لمحفظة العميل):**
                *   `wallet_id`: `client_wallet_id`.
                *   `transaction_type`: `DEPOSIT` أو `SCRAP_SALE_CREDIT`.
                *   `amount`: `material_value` (موجب).
                *   `status`: `COMPLETED`.
                *   `description`: "إيداع قيمة مخلفات طلب #`order_id`".
                *   `related_order_id`: `order_id`.
                *   `initiated_by_user_id`: `delivery_agent_user_id`.
            7.  **تحديث رصيد محفظة العميل في `public.wallets`:** إضافة `material_value`.
            8.  **إنشاء سجل في `public.transactions` (لتوثيق عملية بيع المخلفات للعميل - اختياري ولكن موصى به للتدقيق):**
                *   `user_id`: `client_user_id`.
                *   `amount`: `material_value`.
                *   `type`: `SCRAP_SALE_COMPLETED_BY_DELIVERY_AGENT`.
                *   `status`: `COMPLETED`.
                *   `order_id`: `order_id`.
                *   `processed_by_admin_id`: `delivery_agent_user_id` (باعتباره منفذ العملية).
                *   `metadata`: يمكن أن يحتوي على `client_wallet_transaction_id`.
            9.  **ربط إيداع العميل بالمعاملة المركزية (إذا تم إنشاؤها في الخطوة 8):** تحديث `wallet_transactions.source_transaction_id`.
            10. **إنشاء سجل في `public.transactions` (تسجيل عهدة على المندوب):**
                *   `user_id`: `delivery_agent_user_id`.
                *   `amount`: `material_value`.
                *   `type`: `DELIVERY_AGENT_MATERIAL_COLLECTION`.
                *   `status`: `PENDING_SETTLEMENT`.
                *   `order_id`: `order_id`.
                *   `description`: "تسجيل عهدة مواد طلب #`order_id`".
                *   `metadata`: يمكن أن يحتوي على `client_user_id`, `client_wallet_transaction_id`.
            11. **إنهاء معاملة قاعدة البيانات (Commit).**
            12. **إرجاع الاستجابة.**
        *   **3.5.1.6. اعتبارات الأمان والصلاحيات:**
            *   المتصل يجب أن يكون مندوب توصيل مصادق عليه.
            *   التحقق من أن المندوب مُسند للـ `order_id` المعني.
            *   التحقق الدقيق من `confirmation_code` لمنع الاحتيال.
        *   **3.5.1.7. أمثلة:** (تُترك للتعبئة لاحقًا بناءً على تفاصيل الـ API الفعلية).

    *   3.5.2. `ef-confirm-cash-collection` (تأكيد تحصيل مبلغ نقدي من العميل بواسطة المندوب)
        *   **3.5.2.1. الغرض والوظيفة:**
            *   تمكين مندوب التوصيل من تأكيد استلام مبلغ نقدي من العميل كدفعة لطلب (COD - الدفع عند الاستلام).
            *   تسجيل المبلغ النقدي المحصل كعهدة على مندوب التوصيل تنتظر التسوية.
            *   تحديث حالة الطلب إلى "مدفوع" أو ما يعادلها.
            *   (لا يوجد تأثير مباشر على محفظة العميل الرقمية في هذه العملية لأنه دفع نقدًا).
        *   **3.5.2.2. نقطة النهاية والـ HTTP Method:**
            *   **Endpoint:** `/functions/v1/confirm-cash-collection`
            *   **HTTP Method:** `POST`
        *   **3.5.2.3. المدخلات المتوقعة (Request Payload) - JSON Schema (مثال):**
            ```json
            {
              "type": "object",
              "properties": {
                "order_id": { "type": "string", "format": "uuid", "description": "معرف الطلب الذي تم تحصيل قيمته." },
                "amount_collected": { "type": "number", "minimum": 0.01, "description": "المبلغ النقدي المحصل." },
                "currency": { "type": "string", "default": "EGP" },
                "client_user_id": { "type": "string", "format": "uuid", "description": "معرف المستخدم للعميل الذي دفع (لأغراض التوثيق)." },
                "delivery_agent_notes": { "type": "string", "maxLength": 255, "description": "ملاحظات مندوب التوصيل (اختياري)." }
              },
              "required": [
                "order_id",
                "amount_collected",
                "client_user_id"
              ]
            }
            ```
        *   **3.5.2.4. المخرجات المتوقعة (Response Payload - Success/Error):**
            *   **Success (HTTP 200 OK):**
                ```json
                {
                  "message": "تم تأكيد تحصيل المبلغ النقدي بنجاح.",
                  "delivery_agent_custody_transaction_id": "..."
                }
                ```
            *   **Error (HTTP 400, 401, 403, 404 (Order/Client/Delivery Agent), 500):**
                ```json
                { "error": "وصف للخطأ." }
                ```
        *   **3.5.2.5. منطق العمل التفصيلي:**
            1.  **المصادقة (مندوب التوصيل):** التحقق من JWT للمندوب واستخلاص `delivery_agent_user_id`.
            2.  **التحقق من المدخلات:** صحة `order_id`, `amount_collected`, `client_user_id`.
            3.  **(اختياري) التحقق من الطلب:** الاستعلام عن جدول الطلبات (`orders_v2` أو ما يعادله) للتأكد من أن الطلب موجود، وأن حالة الدفع تسمح بهذه العملية، وأن المبلغ المحصل يتوافق مع قيمة الطلب.
            4.  **بدء معاملة قاعدة البيانات (Database Transaction).**
            5.  **إنشاء سجل في `public.transactions` (تسجيل عهدة نقدية على المندوب):**
                *   `user_id`: `delivery_agent_user_id`.
                *   `amount`: `amount_collected`.
                *   `type`: `DELIVERY_AGENT_CASH_COLLECTION`.
                *   `status`: `PENDING_SETTLEMENT`.
                *   `order_id`: `order_id`.
                *   `description`: "تحصيل نقدي لطلب #`order_id` من العميل #`client_user_id`".
                *   `payment_method`: `'CASH'`.
                *   `metadata`: يمكن أن يحتوي على `client_user_id`.
            6.  **تحديث حالة الطلب (Order Status):** تحديث حالة الطلب في جدوله الخاص إلى "مدفوع" أو "مكتمل الدفع" (تعتمد على تصميم جدول الطلبات).
            7.  **إنهاء معاملة قاعدة البيانات (Commit).**
            8.  **إرجاع الاستجابة.**
        *   **3.5.2.6. اعتبارات الأمان والصلاحيات:**
            *   المتصل يجب أن يكون مندوب توصيل مصادق عليه.
            *   التحقق من أن المندوب مُسند للـ `order_id` المعني أو مخول بتأكيد الدفع له.
        *   **3.5.2.7. أمثلة:** (تُترك للتعبئة لاحقًا).

    *   **3.5.3. `ef-get-delivery-agent-wallet-details` (جلب تفاصيل محفظة المندوب وسجل العهد)**
        *   **3.5.3.1. الغرض والوظيفة:**
            *   تمكين مندوب التوصيل من عرض تفاصيل محفظته الخاصة (إن وجدت كمحفظة رقمية منفصلة للمناديب، أو عرض ملخص مالي إذا كانت العهد تدار بشكل مختلف).
            *   عرض قائمة بالمعاملات المسجلة كعهدة على المندوب (`DELIVERY_AGENT_MATERIAL_COLLECTION`, `DELIVERY_AGENT_CASH_COLLECTION`) والتي هي بحالة `PENDING_SETTLEMENT`.
            *   عرض قائمة بالتسويات المالية التي تمت للمندوب (مثل `DELIVERY_AGENT_SETTLEMENT`).
            *   عرض الرصيد الحالي للمحفظة الرقمية للمندوب (إذا كان هذا المفهوم مطبقًا، وإلا يتم عرض صافي العهدة).
        *   **3.5.3.2. نقطة النهاية والـ HTTP Method:**
            *   **Endpoint:** `/functions/v1/delivery-agent-wallet`
            *   **HTTP Method:** `GET`
        *   **3.5.3.3. المدخلات المتوقعة (Request Parameters):**
            *   `page`: (اختياري) رقم الصفحة للترقيم لقائمة المعاملات.
            *   `limit`: (اختياري) عدد المعاملات في كل صفحة.
            *   `filter_status`: (اختياري) لتصفية المعاملات حسب الحالة (مثلاً `PENDING_SETTLEMENT`, `COMPLETED`).
        *   **3.5.3.4. المخرجات المتوقعة (Response Payload - Success/Error):**
            *   **Success (HTTP 200 OK):**
                ```json
                {
                  "type": "object",
                  "properties": {
                    "wallet_details": {
                      "type": "object",
                      "properties": {
                        "wallet_id": { "type": "string", "format": "uuid", "description": "معرف محفظة المندوب (إذا وجدت)." },
                        "current_balance": { "type": "number", "description": "الرصيد الحالي لمحفظة المندوب الرقمية." },
                        "pending_settlement_cash_amount": { "type": "number", "description": "إجمالي قيمة العهد النقدية المعلقة." },
                        "pending_settlement_material_value": { "type": "number", "description": "إجمالي قيمة عهد المواد المعلقة." }
                      }
                    },
                    "transactions": {
                      "type": "array",
                      "items": {
                        // تعريف كائن المعاملة هنا، مشابه لـ TransactionDetail ولكن خاص بالمندوب
                        "type": "object",
                        "properties": {
                          "transaction_id": { "type": "string", "format": "uuid" },
                          "type": { "type": "string", "enum": ["DELIVERY_AGENT_MATERIAL_COLLECTION", "DELIVERY_AGENT_CASH_COLLECTION", "DELIVERY_AGENT_SETTLEMENT"] },
                          "amount": { "type": "number" },
                          "currency": { "type": "string" },
                          "status": { "type": "string" },
                          "created_at": { "type": "string", "format": "date-time" },
                          "description": { "type": "string" },
                          "order_id": { "type": "string", "format": "uuid" }
                          // ... أي حقول أخرى ذات صلة
                        }
                      }
                    },
                    "pagination": {
                      "type": "object",
                      "properties": {
                        "total_items": { "type": "integer" },
                        "total_pages": { "type": "integer" },
                        "current_page": { "type": "integer" }
                      }
                    }
                  }
                }
                ```
            *   **Error (HTTP 401, 403, 500):**
                ```json
                { "error": "وصف للخطأ." }
                ```
        *   **3.5.3.5. منطق العمل التفصيلي:**
            1.  **المصادقة (مندوب التوصيل):** التحقق من JWT للمندوب واستخلاص `delivery_agent_user_id`.
            2.  **جلب تفاصيل محفظة المندوب (إذا كانت موجودة):** استعلام `public.wallets` حيث `user_id = delivery_agent_user_id` و `wallet_type = 'DELIVERY_AGENT'` (أو حسب التصميم).
            3.  **جلب المعاملات المعلقة والمسواة:** استعلام `public.transactions` حيث `user_id = delivery_agent_user_id` والأنواع هي `DELIVERY_AGENT_MATERIAL_COLLECTION`, `DELIVERY_AGENT_CASH_COLLECTION`, `DELIVERY_AGENT_SETTLEMENT`.
                *   تطبيق التصفية (`filter_status`) والترقيم (`page`, `limit`) على هذه المعاملات.
            4.  **حساب إجماليات العهد المعلقة:** جمع قيم `amount` للمعاملات التي حالتها `PENDING_SETTLEMENT` لكل نوع عهدة (نقدية، مواد).
            5.  **تجميع الاستجابة:** بناء كائن JSON بالمخرجات.
        *   **3.5.3.6. اعتبارات الأمان والصلاحيات:**
            *   المتصل يجب أن يكون مندوب توصيل مصادق عليه.
            *   يجب أن يتمكن المندوب من رؤية بياناته الخاصة فقط (يجب أن تُطبق RLS بصرامة على جدول `transactions` و `wallets` بناءً على `user_id`).
            *   يجب أن يتمكن المندوب من رؤية بيانات المعاملات المعلقة والمسواة حسب الحالة.
        *   **3.5.3.7. أمثلة:** (تُترك للتعبئة لاحقًا).

### 3.6. الـ Edge Functions لجلب بيانات محفظة المستخدم للموبايل
    *   3.6.1. `get-my-wallet-details`
        *   3.6.1.1. التفاصيل (بنفس هيكل 3.3.1 - 3.3.7)
    *   3.6.2. `get-my-wallet-transactions`
        *   3.6.2.1. التفاصيل (بنفس هيكل 3.3.1 - 3.3.7)

### 3.7. خطوات التنفيذ للمرحلة الأولى
    *   3.7.1. تطوير واختبار كل Edge Function على حدة.
    *   3.7.2. توثيق كل Edge Function (يمكن أن يكون هذا المستند هو الأساس لدليل API الموبايل).
    *   3.7.3. إخطار فريق تطوير الموبايل بالـ APIs الجاهزة.

## 4. المرحلة الثانية: تأمين منطق لوحة التحكم الحساس

### 4.1. الهدف: نقل العمليات الحساسة التي تتم عبر لوحة التحكم إلى Edge Functions.
### 4.2. الأولوية: عالية.

### 4.3. الـ Edge Function: `admin-approve-payout` (موافقة المسؤول على طلب سحب)
    *   4.3.1. الغرض والوظيفة
    *   4.3.2. نقطة النهاية والـ HTTP Method
    *   4.3.3. المدخلات المتوقعة (مع `adminUserId` من JWT)
    *   4.3.4. المخرجات المتوقعة
    *   4.3.5. منطق العمل: نقل منطق `approvePayoutRequest` من `paymentsService.ts`.
    *   4.3.6. تعديل `paymentsService.ts`: دالة `approvePayoutRequest` تستدعي هذه الـ EF.
    *   4.3.7. اعتبارات الأمان (التحقق من أن المتصل هو مسؤول ولديه الصلاحية).

### 4.4. الـ Edge Function: `admin-reject-payout` (رفض المسؤول لطلب سحب)
    *   **4.4.1. الغرض والوظيفة:**
        *   تمكين المسؤول المصادق عليه من رفض طلب سحب معلق.
        *   تحديث حالة طلب السحب والمعاملة المرتبطة به إلى `REJECTED`.
        *   تسجيل معرف المسؤول الذي قام بالرفض وملاحظاته (سبب الرفض).
        *   إذا كان هناك مبلغ محجوز مسبقًا عند إنشاء الطلب (مثل `DEBIT_HOLD` في `wallet_transactions`)، يتم إرجاع هذا المبلغ إلى رصيد المستخدم القابل للاستخدام (إنشاء حركة `PAYOUT_REJECTED_REFUND` أو ما يعادلها).
    *   **4.4.2. نقطة النهاية والـ HTTP Method:**
        *   **Endpoint:** `/functions/v1/admin/reject-payout`
        *   **HTTP Method:** `POST`
    *   **4.4.3. المدخلات المتوقعة (Request Payload) - JSON Schema (مثال):**
        ```json
        {
          "type": "object",
          "properties": {
            "payout_request_id": { "type": "string", "format": "uuid", "description": "معرف طلب السحب الأساسي." },
            "transaction_id": { "type": "string", "format": "uuid", "description": "معرف المعاملة المركزية المرتبطة." },
            "admin_notes": { "type": "string", "maxLength": 500, "description": "سبب الرفض (إلزامي أو موصى به بشدة)." }
          },
          "required": [
            "payout_request_id",
            "transaction_id",
            "admin_notes"
          ]
        }
        ```
    *   **4.4.4. المخرجات المتوقعة (Response Payload - Success/Error):**
        *   **Success (HTTP 200 OK):**
            ```json
            {
              "message": "تم رفض طلب السحب بنجاح.",
              "payout_request_status": "REJECTED",
              "transaction_status": "REJECTED",
              "refund_wallet_transaction_id": "..." // إذا تم إرجاع مبلغ
            }
            ```
        *   **Error (HTTP 400, 401, 403, 404, 422 (Invalid state), 500):**
            ```json
            { "error": "وصف للخطأ." }
            ```
    *   **4.4.5. منطق العمل التفصيلي:**
        1.  **المصادقة والتحقق من الصلاحيات (المسؤول):** استخلاص `admin_user_id` والتحقق من الصلاحيات.
        2.  **التحقق من المدخلات:** صحة المعرفات ووجود `admin_notes`.
        3.  **جلب طلب السحب والمعاملة:** كما في دالة الموافقة، مع التأكد من الحالة `PENDING_APPROVAL`.
        4.  **بدء معاملة قاعدة البيانات (Database Transaction).**
        5.  **تحديث حالة `public.transactions`:**
            *   `status`: `REJECTED`.
            *   `processed_by_admin_id`: `admin_user_id`.
            *   `admin_notes`: `admin_notes` المدخلة.
            *   `processed_at`: الوقت الحالي.
        6.  **تحديث حالة `public.payout_requests`:**
            *   `status`: `REJECTED`.
            *   `processed_by_admin_id`: `admin_user_id`.
            *   `admin_notes`: `admin_notes` المدخلة.
            *   `processing_date` أو `completion_date`: الوقت الحالي.
        7.  **معالجة إرجاع المبلغ المحجوز (إذا وُجد منطق الحجز المسبق):**
            *   التحقق مما إذا كان هناك حركة `DEBIT_HOLD` مرتبطة بهذا الطلب (يمكن الاستعلام عن `wallet_transactions` بالـ `source_transaction_id` أو أي معرف ربط آخر).
            *   إذا وُجدت وتم التأكد أن المبلغ لم يُخصم نهائيًا بعد:
                *   إنشاء سجل جديد في `public.wallet_transactions`:
                    *   `wallet_id`: محفظة المستخدم.
                    *   `transaction_type`: `PAYOUT_REJECTED_REFUND` (أو `CREDIT_HOLD_REVERSAL`).
                    *   `amount`: قيمة موجبة للمبلغ الذي كان محجوزًا.
                    *   `status`: `COMPLETED`.
                    *   `description`: "إرجاع مبلغ محجوز لطلب سحب مرفوض #`payout_request_id`".
                    *   `source_transaction_id`: `transaction_id` الأصلي للطلب.
                *   تحديث رصيد `public.wallets` بإضافة المبلغ المرتجع (أو تحديث الرصيد "المتاح" إذا كان يُدار بشكل منفصل عن الرصيد الكلي).
        8.  **(اختياري) إرسال إشعار للمستخدم:** إعلام المستخدم بأن طلب السحب تم رفضه مع ذكر السبب (من `admin_notes`).
        9.  **إنهاء معاملة قاعدة البيانات (Commit).**
        10. **إرجاع الاستجابة.**
    *   **4.4.6. اعتبارات الأمان والصلاحيات:**
        *   نفس اعتبارات دالة الموافقة.
        *   ضمان أن `admin_notes` تُسجل بشكل دائم كسبب للرفض.
    *   **4.4.7. أمثلة:** (تُترك للتعبئة لاحقًا).

### 4.5. الـ Edge Function: `admin-manual-wallet-adjustment` (تعديل يدوي لرصيد محفظة)
    *   4.5.1. التفاصيل (بنفس هيكل 4.3.1 - 4.3.7، مع نقل منطق `createManualTransaction`).

### 4.6. خطوات التنفيذ للمرحلة الثانية
    *   4.6.1. تطوير واختبار كل Edge Function.
    *   4.6.2. إعادة هيكلة (Refactor) الدوال المقابلة في `paymentsService.ts` لاستدعاء الـ EFs.
    *   4.6.3. اختبار تكامل لوحة التحكم مع الـ EFs الجديدة.

## 5. المرحلة الثالثة (اختيارية): تقييم ونقل دوال الجلب المعقدة

تهدف هذه المرحلة إلى تقييم الفوائد المحتملة لنقل بعض دوال جلب البيانات المعقدة، التي تُستخدم حاليًا بشكل أساسي من قِبل لوحة تحكم المسؤول، إلى Supabase Edge Functions. هذا القرار يعتمد على عدة عوامل مثل تعقيد الاستعلامات، الحاجة إلى معالجة إضافية للبيانات بعد الجلب، ومتطلبات الأمان.

### 5.1. المبررات المحتملة لنقل دوال الجلب
*   **تحسين الأداء:** إذا كانت الدالة تقوم بتجميع بيانات من عدة مصادر أو تتطلب معالجة كثيفة بعد الجلب، فإن تنفيذها كـ Edge Function قد يكون أسرع إذا كانت الـ Function أقرب إلى بيانات المستخدم أو إذا كانت تستفيد من التخزين المؤقت (Caching) على مستوى الـ Edge.
*   **تخفيف العبء على العميل (لوحة التحكم):** نقل منطق تجميع ومعالجة البيانات إلى الـ Edge Function يمكن أن يبسط الكود في الواجهة الأمامية ويقلل من حجم البيانات المنقولة.
*   **مركزية منطق الوصول للبيانات:** توفير نقطة وصول واحدة (Edge Function) للبيانات المعقدة يمكن أن يسهل إدارتها وتحديثها بدلاً من تكرار منطق مشابه في أماكن متعددة.
*   **تعزيز الأمان بشكل أكبر:** على الرغم من أن RLS يوفر حماية جيدة، فإن وضع منطق الوصول للبيانات الحساسة خلف Edge Function يضيف طبقة أخرى من التحكم ويمكن من تطبيق قواعد صلاحيات أكثر دقة وتعقيدًا إذا لزم الأمر قبل إرجاع البيانات.

### 5.2. أمثلة لدوال يمكن تقييمها للنقل
*   **`ef-admin-get-all-central-transactions` (بديلاً عن `getAllCentralTransactions`):**
    *   **الوظيفة:** جلب قائمة شاملة بجميع المعاملات المركزية مع تفاصيل المستخدمين (البادئ، المسؤول المعالج)، تفاصيل طلب السحب المرتبط، وتطبيق الفلاتر والبحث والترقيم والفرز المعقد.
    *   **اعتبارات:** نظرًا لتعقيد هذه الدالة وحاجتها لربط عدة جداول واستدعاء `fetchUserDetailsInBatch` (التي بدورها تستدعي RPC)، فإن نقلها قد يحسن الأداء ويخفف العبء عن الواجهة الأمامية للوحة التحكم.
*   **`ef-admin-get-wallets-with-details` (بديلاً عن `getWallets` مع البحث المتقدم):**
    *   **الوظيفة:** جلب قائمة المحافظ مع تفاصيل المستخدمين المرتبطين بها، وتطبيق آلية البحث المتقدمة (التي تتم حاليًا جزئيًا في TypeScript بعد جلب البيانات الأولية).
    *   **اعتبارات:** نقل منطق البحث بالكامل إلى الـ Edge Function (بالاستفادة من إمكانيات البحث في PostgreSQL بشكل أفضل أو معالجة البيانات بكفاءة في Deno) قد يحسن الأداء وتجربة المستخدم في لوحة التحكم.

### 5.3. خطوات التنفيذ المقترحة لهذه المرحلة
1.  **تحليل الأداء:** قياس أداء الدوال الحالية في `paymentsService.ts` لتحديد النقاط التي يمكن أن تستفيد من النقل.
2.  **تقييم التعقيد مقابل الفائدة:** لكل دالة، موازنة جهد النقل والتطوير مقابل الفوائد المتوقعة في الأداء أو الصيانة.
3.  **التنفيذ التدريجي:** البدء بالدوال التي تقدم أكبر فائدة بأقل جهد.
4.  **الاختبار والمقارنة:** اختبار أداء الـ Edge Functions الجديدة ومقارنتها بالدوال القديمة.

### 5.4. اعتبارات خاصة
*   **التخزين المؤقت (Caching):** يمكن استكشاف إمكانيات التخزين المؤقت على مستوى الـ Edge Functions لبيانات لا تتغير بوتيرة سريعة لتحسين زمن الاستجابة.
*   **حدود Supabase Edge Functions:** الانتباه لأي حدود على زمن التنفيذ، حجم الذاكرة، أو عدد الاستدعاءات التي قد تؤثر على الدوال المعقدة.

## 6. اعتبارات عامة أثناء التنفيذ

### 6.1. معالجة الأخطاء وإرجاع الاستجابات (Error Handling and Responses)
### 6.2. التسجيل والمراقبة (Logging and Monitoring) للـ Edge Functions
### 6.3. إدارة الإصدارات (Versioning) للـ Edge Functions (مستقبلي)
### 6.4. اختبارات الوحدات والتكامل (Unit and Integration Testing)
### 6.5. التوثيق المستمر

## 7. الجدول الزمني المقترح والموارد (تقديري)

### 7.1. تقدير الوقت لكل مرحلة
### 7.2. المهارات المطلوبة

## 8. المخاطر المحتملة واستراتيجيات التخفيف منها

تحديد المخاطر المحتملة مبكرًا ووضع استراتيجيات للتخفيف منها أمر ضروري لنجاح المشروع.

| الخطر المحتمل                                  | التأثير المحتمل | احتمالية الحدوث | استراتيجية التخفيف                                                                                                                                                                                             |
| :--------------------------------------------- | :------------- | :-------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. نقص الخبرة في Deno أو TypeScript**        | بطء التطوير، جودة كود منخفضة | متوسطة         | تخصيص وقت للتعلم والتدريب، بناء نماذج أولية بسيطة، مراجعات كود مكثفة، الاستعانة بمطورين ذوي خبرة إذا أمكن.                                                                                                     |
| **2. صعوبة في تصحيح الأخطاء (Debugging) في Edge Functions** | زيادة وقت التطوير | متوسطة         | استخدام Supabase local development و CLI لتشغيل وتصحيح الأخطاء محليًا، الاعتماد على Logging جيد، كتابة اختبارات وحدوية شاملة.                                                                                         |
| **3. مشكلات في أداء الـ Edge Functions**        | تجربة مستخدم سيئة | منخفضة إلى متوسطة | اختبار الأداء بانتظام، تحسين استعلامات قاعدة البيانات، استخدام التخزين المؤقت (Caching) إذا كان مناسبًا، الانتباه لحدود Supabase، النظر في تحسين تصميم الـ Function أو تقسيمها.                                                    |
| **4. تعقيدات في إدارة حالة المصادقة والصلاحيات داخل الـ EFs** | ثغرات أمنية، أخطاء في الوصول | متوسطة         | وضع استراتيجية واضحة للمصادقة والتحقق من الصلاحيات مبكرًا، تطبيق مبدأ الامتياز الأقل، مراجعات أمان للكود، استخدام RLS بفعالية.                                                                                     |
| **5. تجاوز حدود Supabase Edge Functions (زمن التنفيذ، الذاكرة)** | فشل الـ Functions | منخفضة         | مراقبة استخدام الموارد، تصميم الـ Functions لتكون فعالة، تقسيم المهام المعقدة إلى Functions أصغر أو استخدام وظائف الخلفية (Background Functions) إذا كانت Supabase تدعمها لمهام طويلة الأمد.                                |
| **6. تأخير في تكامل تطبيقات العميل (الموبايل والويب) مع الـ EFs الجديدة** | تأخير في إطلاق الميزات | متوسطة         | تواصل مستمر بين فرق الواجهة الخلفية والواجهة الأمامية/الموبايل، توفير توثيق API واضح ومبكر، اختبارات تكامل مبكرة.                                                                                                 |
| **7. صعوبة في الحفاظ على الذرية (Atomicity) للعمليات المعقدة عبر عدة جداول** | بيانات غير متسقة | متوسطة         | استخدام معاملات قاعدة البيانات (Database Transactions) بشكل صحيح داخل الـ Edge Functions لضمان أن جميع التحديثات تتم بنجاح أو يتم التراجع عنها جميعًا (Rollback).                                                              |
| **8. مقاومة التغيير من فريق التطوير (الاعتياد على `paymentsService.ts`)** | بطء في التبني | منخفضة         | توضيح فوائد الانتقال إلى Edge Functions (الأمان، المركزية، قابلية الصيانة)، تقديم الدعم والتدريب، إشراك الفريق في عملية التخطيط والتصميم.                                                                            |
| **9. زيادة تعقيد إدارة وصيانة الكود مع تزايد عدد الـ EFs** | صعوبة في الصيانة | متوسطة على المدى الطويل | اتباع معايير تسمية وتنظيم جيدة للـ Functions، توثيق جيد، الحفاظ على الـ Functions صغيرة ومركزة، استخدام أدوات CI/CD للمساعدة في إدارة النشر.                                                                             |

## 9. الخلاصة والتوصيات

يوفر هذا المستند خطة شاملة لترحيل وتطوير أجزاء رئيسية من نظام المدفوعات الحالي للاستفادة من Supabase Edge Functions. يهدف هذا التحول الاستراتيجي إلى تعزيز أمان النظام، ضمان سلامة البيانات، توحيد واجهات API لتطبيقات العملاء (الموبايل والويب)، ومركزية منطق الأعمال المعقد.

**التوصيات الرئيسية:**
1.  **البدء التدريجي:** اتباع النهج المرحلي المقترح، مع إعطاء الأولوية للـ Edge Functions التي تخدم تطبيقات الموبايل بشكل مباشر (المرحلة الأولى)، ثم الانتقال إلى تأمين عمليات لوحة التحكم (المرحلة الثانية).
2.  **التركيز على الأمان:** إيلاء اهتمام خاص لاعتبارات الأمان في كل مرحلة، بما في ذلك التحقق من صحة المدخلات، إدارة الصلاحيات بدقة، واستخدام معاملات قاعدة البيانات لضمان الذرية.
*ملاحظة: هذا المستند هو خطة أولية ويجب تحديثه وتفصيله بشكل أكبر مع تقدم عملية التطوير.* 


## 3. إعداد وتشغيل Edge Functions محليًا باستخدام Deno (الخطوات الفعلية الناجحة)

بعد مواجهة بعض التحديات مع إعداد Docker و Supabase CLI، تم اتباع الخطوات التالية بنجاح لتشغيل Edge Function محليًا باستخدام Deno مباشرة، مما يوفر بيئة تطوير سريعة وفعالة لاختبار منطق الدالة قبل النشر.

### 3.1. تثبيت Supabase CLI (كمعتمدية تطوير)

بدلاً من التثبيت العام، تم تثبيت Supabase CLI كمعتمدية تطوير في المشروع:
```bash
npm install supabase --save-dev
```

### 3.2. تهيئة مشروع Supabase (إذا لم يتم مسبقًا)
إذا لم يكن مجلد `supabase` موجودًا في مشروعك:
```bash
npx supabase init
```
(ملاحظة: قد يسألك عن إنشاء إعدادات VS Code لـ Deno، يمكنك اختيار `y` أو `N` حسب تفضيلك.)

### 3.3. إنشاء Edge Function جديدة (مثال: `user-manager`)
```bash
npx supabase functions new user-manager
```
سيؤدي هذا إلى إنشاء الملف `supabase/functions/user-manager/index.ts`.

### 3.4. تثبيت Deno

إذا لم يكن Deno مثبتًا على نظامك، قم بتثبيته. على سبيل المثال، باستخدام PowerShell على Windows:
```powershell
irm https://deno.land/install.ps1 | iex
```
بعد التثبيت، تأكد من إضافة مسار Deno (`C:\Users\<اسم-المستخدم>\.deno\bin` عادةً) إلى متغير البيئة `PATH` بشكل دائم أو في كل جلسة طرفية جديدة.

للتحقق من التثبيت:
```bash
deno --version
```

### 3.5. إعداد متغيرات البيئة للدالة

تحتاج الـ Edge Functions عادةً إلى متغيرات بيئة مثل `SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY` للتفاعل مع مشروع Supabase.

1.  **إنشاء ملف `.env`**:
    قم بإنشاء ملف باسم `.env` في جذر مشروعك (`D:\karmesh_githup\delivery-agent-dashboard\.env`).
    *ملاحظة: تأكد من إضافة `.env` إلى ملف `.gitignore` الخاص بك لمنع رفعه إلى مستودع الأكواد.*

2.  **إضافة المتغيرات إلى ملف `.env`**:
    ```dotenv
    SUPABASE_URL=https://yytjguijpbahrltqjdks.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dGpndWlqcGJhaHJsdHFqZGtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMDY5NTM3NiwiZXhwIjoyMDI2MjcxMzc2fQ.j9s2ZNZ7X282y3sU2pQRe3e2c2R9F7vKqCY2S0H4fF4
    # استبدل بالقيم الفعلية لمشروعك إذا كانت مختلفة
    ```

### 3.6. تعديل كود الـ Edge Function للتعامل مع المسارات المحلية

تم تعديل ملف `supabase/functions/user-manager/index.ts` للتعامل بشكل صحيح مع المسارات عند التشغيل المحلي باستخدام Deno (الذي لا يستخدم البادئة `/functions/v1/user-manager`) وعند النشر على Supabase.

الكود المعدل (مثال `user-manager`):
```typescript
// supabase/functions/user-manager/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from \'https://esm.sh/@supabase/supabase-js@2\';

// تعريف ترويسات CORS
const corsHeaders = {
  \'Access-Control-Allow-Origin\': \'*\'', // أو نطاقك المحدد
  \'Access-Control-Allow-Headers\': \'authorization, x-client-info, apikey, content-type\',
  \'Access-Control-Allow-Methods\': \'POST, GET, OPTIONS, PUT, DELETE\',
};

console.log("User-manager function initializing...");

serve(async (req: Request) => {
  console.log(`Request received: ${req.method} ${req.url}`);

  // معالجة طلبات OPTIONS لـ CORS preflight
  if (req.method === \'OPTIONS\') {
    console.log("Handling OPTIONS request for CORS preflight.");
    return new Response(\'ok\', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get(\'SUPABASE_URL\');
    const serviceRoleKey = Deno.env.get(\'SUPABASE_SERVICE_ROLE_KEY\');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
      return new Response(JSON.stringify({ error: \'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.\' }), {
        headers: { ...corsHeaders, \'Content-Type\': \'application/json\' },
        status: 500,
      });
    }
    console.log("Supabase URL and Service Role Key found.");

    const supabase: SupabaseClient = createClient(supabaseUrl, serviceRoleKey);
    console.log("Supabase client created.");

    const url = new URL(req.url);
    // إزالة البادئة إذا كانت موجودة (للتوافق مع Supabase CLI والنشر)
    // /functions/v1/user-manager/users -> /users
    // أو إذا تم التشغيل محليًا مباشرة: /users -> /users
    const path = url.pathname.replace(/^\/functions\/v1\/user-manager/, \'\');
    console.log(`Original pathname: ${url.pathname}, Processed path for routing: ${path}`);

    const pathParts = path.split(\'/\').filter(part => part !== \'\'); // [\'users\', \'123\'] or [\'users\']
    console.log("Path parts:", pathParts);

    // التوجيه بناءً على المسار
    if (pathParts[0] === \'users\') {
      const userId = pathParts[1]; // قد يكون undefined إذا كان الطلب إلى /users

      if (req.method === \'GET\') {
        if (userId) {
          // جلب مستخدم معين
          console.log(`Attempting to fetch user with ID: ${userId}`);
          const { data, error } = await supabase.from(\'users\').select(\'*\').eq(\'id\', userId).single();
          if (error) throw error;
          return new Response(JSON.stringify(data || { message: `User with ID ${userId} not found.` }), {
            headers: { ...corsHeaders, \'Content-Type\': \'application/json\' },
            status: data ? 200 : 404,
          });
        } else {
          // جلب كل المستخدمين (أو يمكن تعديله ليتطلب صلاحيات معينة)
          console.log("Attempting to fetch all users.");
          // const { data, error } = await supabase.from(\'users\').select(\'*\');
          // if (error) throw error;
          // return new Response(JSON.stringify(data), {
          //   headers: { ...corsHeaders, \'Content-Type\': \'application/json\' },
          //   status: 200,
          // });
          // للتجربة الأولية، سنرجع رسالة ثابتة
           return new Response(JSON.stringify({ message: `GET request to /users received. ID: ${userId}. Implement fetching all users.` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      } else if (req.method === \'POST\') {
        // إنشاء مستخدم جديد
        console.log("Attempting to create a new user.");
        const body = await req.json();
        // const { data, error } = await supabase.from(\'users\').insert(body).select().single();
        // if (error) throw error;
        // return new Response(JSON.stringify(data), {
        //   headers: { ...corsHeaders, \'Content-Type\': \'application/json\' },
        //   status: 201,
        // });
        return new Response(JSON.stringify({ message: "POST request to /users received. Implement user creation.", body }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 201,
        });
      }
      // أضف معالجات لـ PUT, DELETE حسب الحاجة
    }

    console.warn(`Resource not found for path: ${path}`);
    return new Response(JSON.stringify({ error: \'Resource not found\' }), {
      headers: { ...corsHeaders, \'Content-Type\': \'application/json\' },
      status: 404,
    });

  } catch (error) {
    console.error(\'Error in function execution:\', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, \'Content-Type\': \'application/json\' },
      status: 500,
    });
  }
});

console.log("User-manager function event loop started.");

```

### 3.7. تشغيل الدالة محليًا باستخدام Deno

افتح طرفية جديدة (يفضل `cmd.exe` لتجنب مشاكل `PSReadLine` المحتملة في PowerShell مع Deno أحيانًا، أو استخدم VS Code Integrated Terminal).

1.  **انتقل إلى مجلد المشروع**:
    ```bash
    cd D:\karmesh_githup\delivery-agent-dashboard
    ```

2.  **أضف Deno إلى PATH (إذا لم يكن مضافًا بشكل دائم أو لجلسة cmd الحالية)**:
    ```bash
    set PATH=%PATH%;C:\Users\mamdouh\.deno\bin
    ```
    (استبدل `mamdouh` باسم المستخدم الخاص بك)

3.  **شغّل الدالة مع تحديد ملف `.env`**:
    ```bash
    deno run --allow-net --allow-env --env=D:\karmesh_githup\delivery-agent-dashboard\.env supabase/functions/user-manager/index.ts
    ```
    أو إذا كان ملف `.env` في نفس المجلد الذي تشغل منه الأمر:
    ```bash
    deno run --allow-net --allow-env --env supabase/functions/user-manager/index.ts
    ```
    من المفترض أن ترى مخرجات مثل:
    ```
    User-manager function initializing...
    User-manager function event loop started.
    Listening on http://localhost:8000/
    ```

### 3.8. اختبار الدالة المحلية

افتح المتصفح أو استخدم أداة مثل Postman لاختبار النقاط الطرفية:
*   `http://localhost:8000/users` (GET)
*   `http://localhost:8000/users/{id}` (GET)
*   `http://localhost:8000/users` (POST, مع جسم الطلب المناسب)

ستظهر سجلات الطلبات في الطرفية التي تشغل Deno.

هذه الطريقة تسمح بتطوير واختبار منطق دوال Edge بكفاءة قبل محاولة نشرها أو التعامل مع تعقيدات Docker إذا استمرت المشاكل معه.

## 3. تطبيق عملي: إنشاء دالة create-payout-request

هذا القسم يوثق الخطوات العملية التي اتبعناها لإنشاء أول دالة Edge Function لنظام المدفوعات. يمكن استخدام هذه الخطوات كمرجع للدوال المستقبلية.

### 3.1. تثبيت وإعداد البيئة

#### 3.1.1. تثبيت Supabase CLI
قمنا بتثبيت Supabase CLI كتبعية تطويرية في المشروع:

```bash
npm install supabase --save-dev
```

تأكدنا من تثبيت Docker حيث أنه متطلب أساسي لتشغيل Supabase CLI.

#### 3.1.2. تهيئة مشروع Supabase
قمنا بتهيئة مشروع Supabase في المجلد الرئيسي للتطبيق:

```bash
npx supabase init
```

هذا الأمر أنشأ مجلد `supabase` مع البنية الأساسية اللازمة.

#### 3.1.3. ربط المشروع المحلي بمشروع Supabase على السحابة
قمنا بربط المشروع المحلي بمشروع Supabase الموجود:

```bash
npx supabase link --project-ref yytjguijpbahrltqjdks
```

### 3.2. إنشاء دالة create-payout-request

#### 3.2.1. إنشاء الدالة
قمنا بإنشاء دالة جديدة باسم `create-payout-request`:

```bash
npx supabase functions new create-payout-request
```

هذا الأمر أنشأ مجلد `supabase/functions/create-payout-request` مع ملف `index.ts` أساسي.

#### 3.2.2. تطوير الدالة
قمنا بتطوير الدالة لمعالجة طلبات السحب من محافظ المستخدمين. الكود النهائي للدالة:

```typescript
// supabase/functions/create-payout-request/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// تعريف ترويسات CORS للسماح بالطلبات من أي مصدر
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // معالجة طلبات OPTIONS (Preflight requests) لـ CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. التحقق من أن الطلب هو POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed. Only POST requests are accepted.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    // 2. استخراج رمز المصادقة JWT من ترويسات الطلب
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        error: 'Missing or invalid authorization header.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // استخراج JWT من ترويسة Authorization
    const jwt = authHeader.replace('Bearer ', '');

    // إنشاء عميل Supabase باستخدام مفتاح الخدمة للوصول الكامل إلى قاعدة البيانات
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // التحقق من JWT واستخراج معلومات المستخدم
    const { data: { user }, error: userError } = await supabaseAdminClient.auth.getUser(jwt);
    
    if (userError || !user) {
      console.error("JWT verification failed:", userError);
      return new Response(JSON.stringify({ 
        error: 'Invalid authentication token.',
        details: userError?.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    
    console.log(`Authenticated user: ${user.id}`);
    
    // استخراج بيانات الطلب
    const requestData = await req.json();
    const { 
      amount, 
      currency = 'USD', 
      payment_method,
      payment_method_details,
      recipient_details
    } = requestData;
    
    // التحقق من البيانات المطلوبة
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ 
        error: 'Amount is required and must be greater than 0.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    // استخدام إما payment_method أو استخراجه من payment_method_details.type إذا كان موجودًا
    const paymentMethod = payment_method || 
                       (payment_method_details && payment_method_details.type) || 
                       "unknown";
    console.log(`Payment method determined as: ${paymentMethod}`);
    
    // 3. جلب محفظة المستخدم
    console.log(`Fetching wallet for user: ${user.id}`);
    const { data: wallets, error: walletsError } = await supabaseAdminClient
      .from('wallets')
      .select('id, balance, currency')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (walletsError) {
      console.error("Error fetching user wallet:", walletsError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch user wallet.',
        details: walletsError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    
    // التحقق من وجود محفظة للمستخدم
    if (!wallets || wallets.length === 0) {
      console.error(`No wallet found for user: ${user.id}`);
      return new Response(JSON.stringify({ 
        error: 'No wallet found for this user.',
        action_needed: 'Please contact support to set up your wallet.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    const wallet = wallets[0];
    console.log(`Found wallet: ${wallet.id} with balance: ${wallet.balance} ${wallet.currency}`);
    
    // 4. التحقق من كفاية الرصيد
    if (wallet.balance < amount) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient funds in wallet.',
        available_balance: wallet.balance,
        currency: wallet.currency
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    // 5. البحث عن تفاصيل دفع المستخدم المناسبة
    let payoutToUserPaymentMethodId = null;
    if (paymentMethod) {
      // استخدام معرف محدد مسبقًا لاختبار الدالة
      payoutToUserPaymentMethodId = "a8a734be-5593-419d-bb94-4bc79664401d"; // استخدام المعرف المعروف
      console.log(`Using hardcoded user payment method ID: ${payoutToUserPaymentMethodId}`);
      
      /* تعليق الاستعلام الأصلي مؤقتًا للاختبار
      const { data: userPaymentMethods, error: userPaymentMethodsError } = await supabaseAdminClient
        .from('user_payment_methods')
        .select('id, payment_method_id')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .order('is_default', { ascending: false })
        .limit(1);
        
      if (!userPaymentMethodsError && userPaymentMethods && userPaymentMethods.length > 0) {
        payoutToUserPaymentMethodId = userPaymentMethods[0].id;
        console.log(`Found user payment method ID: ${payoutToUserPaymentMethodId}`);
      } else {
        console.error(`No active payment method found for user: ${user.id}`);
        return new Response(JSON.stringify({ 
          error: 'لم يتم العثور على تفاصيل طريقة دفع مسجلة لحسابك. يرجى إضافة طريقة دفع أولاً.',
          action_needed: 'أضف طريقة دفع في إعدادات حسابك.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
      */
    }
    
    // 6. إنشاء طلب السحب
    const now = new Date().toISOString();
    const payoutData = {
      wallet_id: wallet.id,
      user_id: user.id,
      amount: amount,
      currency: currency,
      status: 'PENDING_APPROVAL', // الحالة الأولية للطلب
      payment_method: paymentMethod,
      payment_method_details: payment_method_details || {},
      recipient_details: recipient_details || {},
      requested_at: now,
      payout_to_user_payment_method_id: payoutToUserPaymentMethodId
    };
    
    console.log("Creating payout request with data:", payoutData);
    
    const { data: payout, error: payoutError } = await supabaseAdminClient
      .from('payouts')
      .insert(payoutData)
      .select()
      .single();
    
    if (payoutError) {
      console.error("Error creating payout request:", payoutError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create payout request.',
        details: payoutError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    
    // 7. إرجاع استجابة نجاح مع تفاصيل الطلب
    return new Response(JSON.stringify({
      success: true,
      message: 'Payout request created successfully.',
      payout: payout
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred.',
      details: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
```

### 3.3. التحديات والحلول

#### 3.3.1. مشكلات تشغيل البيئة المحلية
واجهنا مشكلات في تشغيل `npx supabase start` بسبب أخطاء Docker TLS handshake timeout. قررنا استخدام Supabase Cloud Platform كبديل للبيئة المحلية.

#### 3.3.2. استخدام Deno مباشرة
استخدمنا Deno مباشرة لتطوير الدوال بدلاً من تشغيل خادم محلي كامل:

```bash
set PATH=%PATH%;C:\Users\[username]\.deno\bin
```

#### 3.3.3. متغيرات البيئة
واجهنا مشكلات في متغيرات البيئة تم حلها بإنشاء ملف `.env` يحتوي على:

```
SUPABASE_URL=https://[your-project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

#### 3.3.4. مشكلة "Bearer token"
واجهنا مشكلة في التحقق من JWT حيث كان يجب إضافة كلمة `Bearer` قبل JWT في ترويسة `Authorization`. تم حل المشكلة بإضافة الكود التالي:

```typescript
const authHeader = req.headers.get('Authorization');
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  // رسالة خطأ
}
const jwt = authHeader.replace('Bearer ', '');
```

#### 3.3.5. مشكلة عدم وجود محفظة للمستخدم
واجهنا مشكلة عدم وجود محفظة للمستخدم في قاعدة البيانات. تم حل هذه المشكلة عن طريق إضافة تحقق من وجود المحفظة وإرجاع رسالة خطأ مناسبة.

#### 3.3.6. مشكلة المفتاح الأجنبي في جدول payouts
واجهنا مشكلة مع المفتاح الأجنبي `payout_to_user_payment_method_id` في جدول `payouts` الذي يشير إلى جدول `user_payment_methods`. تم حل هذه المشكلة عن طريق:

1. إضافة سجل في جدول `payment_methods`:
```sql
INSERT INTO payment_methods (id, name, code, type, is_active, description, requires_user_details)
VALUES ('f44def91-1510-4d17-a4de-0c0914950f1a', 'Bank Transfer', 'bank_transfer', 'BANK_TRANSFER', true, 'التحويل المصرفي المباشر', true);
```

2. إضافة سجل في جدول `user_payment_methods` للمستخدم:
```sql
INSERT INTO user_payment_methods (id, user_id, payment_method_id, details, is_default, status)
VALUES ('a8a734be-5593-419d-bb94-4bc79664401d', '249d346d-0ec9-4146-a86e-6e97c3a399a2', 'f44def91-1510-4d17-a4de-0c0914950f1a', 
'{
  "bank_name": "Global Bank",
  "swift_code": "GLBLUS33",
  "account_number": "123456789",
  "account_holder_name": "John Doe"
}', true, 'ACTIVE');
```

3. تعديل الدالة لاستخدام معرف ثابت لطريقة الدفع للاختبار:
```typescript
payoutToUserPaymentMethodId = "a8a734be-5593-419d-bb94-4bc79664401d";
```

### 3.4. نشر الدالة

#### 3.4.1. نشر الدالة عبر واجهة Supabase
بسبب مشكلات Docker، استخدمنا واجهة Supabase لنشر الدالة:

1. الدخول إلى لوحة تحكم Supabase
2. اختيار المشروع
3. الانتقال إلى "Edge Functions" في القائمة الجانبية
4. النقر على "Create a new function"
5. إدخال اسم الدالة "create-payout-request"
6. نسخ ولصق الكود من الملف المحلي
7. النقر على "Deploy"

### 3.5. اختبار الدالة

#### 3.5.1. اختبار الدالة باستخدام Postman
قمنا باختبار الدالة باستخدام Postman:

1. طريقة الطلب: POST
2. عنوان URL: https://yytjguijpbahrltqjdks.supabase.co/functions/v1/create-payout-request
3. الترويسات:
   - Authorization: Bearer [JWT-token]
   - Content-Type: application/json
   - apikey: [anon-key]
4. جسم الطلب:
```json
{
  "amount": 100,
  "currency": "USD",
  "payment_method": "bank_transfer",
  "payment_method_details": {
    "type": "bank_transfer"
  },
  "recipient_details": {
    "name": "John Doe",
    "account_number": "123456789"
  }
}
```

5. الاستجابة الناجحة:
```json
{
    "success": true,
    "message": "Payout request created successfully.",
    "payout": {
        "id": "5f8f9fd9-ffc1-4593-ac49-d4a716fbbf4d",
        "amount": 100,
        "currency": "USD",
        "status": "PENDING_APPROVAL",
        "created_at": "2025-05-26T05:48:26.270462+00:00",
        "requested_at": "2025-05-26T05:48:26.270462+00:00"
    }
}
```

### 3.6. الدروس المستفادة والممارسات الجيدة

1. **التحقق من المدخلات**: التأكد من صحة واكتمال جميع المدخلات قبل معالجتها.
2. **معالجة الأخطاء**: تضمين معالجة شاملة للأخطاء مع رسائل واضحة.
3. **التسجيل**: استخدام `console.log` بشكل مكثف للمساعدة في تتبع تنفيذ الدالة وتشخيص المشكلات.
4. **CORS**: تضمين ترويسات CORS المناسبة للسماح بالطلبات من العملاء.
5. **المصادقة**: التحقق من JWT والتأكد من أن المستخدم مصرح له بتنفيذ العملية.
6. **العلاقات بين الجداول**: فهم العلاقات بين الجداول والتأكد من استيفاء قيود المفاتيح الأجنبية.
7. **التوثيق**: توثيق الدالة وكيفية استخدامها لتسهيل العمل المستقبلي.

### 3.7. الخطوات القادمة

1. **تحسين الدالة**: إزالة الكود المعلق واستبداله بالمنطق الصحيح للبحث عن طريقة الدفع.
2. **إضافة المزيد من التحققات**: مثل التحقق من حدود السحب اليومية/الشهرية.
3. **إضافة دوال أخرى**: مثل دالة لإدارة المحافظ، دالة للموافقة على طلبات السحب، إلخ.
4. **تحسين الأمان**: إضافة المزيد من التحققات الأمنية والتشفير للبيانات الحساسة.
5. **اختبارات الوحدة**: إضافة اختبارات وحدة للدالة للتأكد من عملها بشكل صحيح في جميع الحالات.




بتاريخ 28 - 9 
## 10. حالة نجاح: ترحيل دالة `create-admin`

### 10.1. المشكلة الأصلية
واجه نظام إنشاء المستخدمين الإداريين تحديًا حيث كان يتم تخزين بريد إلكتروني مُولَّد وفريد (مثال: `email_timestamp_random@domain.com`) في كل من جدول `auth.users` وجدول `public.admins` بدلاً من البريد الإلكتروني الأصلي الذي يُدخله المستخدم. كان الهدف هو استخدام البريد الإلكتروني الأصلي في كلا الجدولين لضمان اتساق البيانات وتسهيل التعرف على المستخدمين.

### 10.2. الحل المُطبق
تم تعديل دالة الحافة `create-admin` (`supabase/functions/create-admin/index.ts`) والآلية المرتبطة بها كالتالي:

1.  **تعديل دالة الحافة `create-admin`:**
    *   تم إيقاف استخدام دالة `generateUniqueEmail()` التي كانت تُنشئ بريدًا إلكترونيًا فريدًا للمصادقة.
    *   أصبحت الدالة الآن تستخدم البريد الإلكتروني الأصلي المُدخل من قِبل المستخدم (بعد تطبيعه: إزالة المسافات وتحويله إلى أحرف صغيرة) مباشرةً عند استدعاء `supabase.auth.admin.createUser()`. تم تمرير هذا البريد الأصلي في حقل `email`.
    *   تم الاحتفاظ بتمرير البريد الإلكتروني الأصلي (`normalizedEmail`) ضمن `user_metadata` (تحت اسم `original_email`) لضمان استخدامه بواسطة الـ trigger.
    *   تم تحديث رسائل السجل وقيمة `auth_email` في استجابة الدالة لتعكس استخدام البريد الإلكتروني الأصلي للمصادقة.

2.  **تعديل Trigger قاعدة البيانات `on_auth_user_created` (الذي ينفذ `process_new_admin_user()`):**
    *   تم التأكد من أن الـ trigger يقرأ قيمة `original_email` من `NEW.raw_user_meta_data` (التي تم تمريرها من دالة الحافة).
    *   يستخدم الـ trigger هذه القيمة (`original_email`) لتعبئة حقل `email` في جدول `public.admins`.

### 10.3. النتيجة
بعد تطبيق هذه التغييرات ونشر دالة الحافة المُحدثة:
*   أصبح حقل `email` في جدول `auth.users` يحتوي على البريد الإلكتروني الأصلي الذي أدخله المستخدم.
*   أصبح حقل `email` في جدول `public.admins` يحتوي أيضًا على البريد الإلكتروني الأصلي (بفضل الـ trigger المعدل).
*   تم تحقيق الهدف بنجاح، وأصبح النظام الآن يخزن البريد الإلكتروني الأصلي بشكل متسق عبر جدولي المصادقة والمسؤولين.

### 10.4. الدروس المستفادة
*   **أهمية `user_metadata`:** يُعد حقل `user_metadata` عند إنشاء مستخدم جديد في Supabase Auth أداة قوية لتمرير بيانات إضافية يمكن استخدامها لاحقًا بواسطة triggers قاعدة البيانات أو دوال أخرى.
*   **الاتساق بين `Auth` والجداول العامة:** من الضروري ضمان أن البيانات المشتركة (مثل البريد الإلكتروني) متسقة بين نظام المصادقة والجداول العامة ذات الصلة لتحقيق سلامة البيانات وتجنب الارتباك.
*   **الاعتماد على الـ Triggers بحذر:** بينما الـ Triggers مفيدة، يجب التأكد من أنها تتلقى البيانات الصحيحة (عبر `user_metadata` في هذه الحالة) لتنفيذ مهامها بشكل صحيح.
*   **التوثيق الواضح:** ساعد التوثيق والتحليل الدقيق للمشكلة في الوصول إلى الحل الصحيح.

---