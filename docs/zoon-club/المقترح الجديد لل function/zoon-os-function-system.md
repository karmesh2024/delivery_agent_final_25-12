# Zoon OS — نظام الـ Functions الهجين
### Function System Developer Guide v2.0
#### دليل المطور الشامل لبناء وتوسيع نظام الـ Functions + Skill Modules

> **الهدف من هذا المستند:** شرح كامل لكيفية بناء نظام Functions هجين داخل Next.js يسمح للمدير بتشغيل عمليات معقدة (PDF، حسابات، بحث، تصدير) من الواجهة دون كتابة كود، مع إمكانية التوسع اللانهائي من قِبل المطور.

---

## 📋 فهرس المحتويات

1. [الفكرة والسيناريو](#1-الفكرة-والسيناريو)
2. [المعمارية الكاملة](#2-المعمارية-الكاملة)
3. [هيكل المجلدات](#3-هيكل-المجلدات)
4. [المكتبات المطلوبة](#4-المكتبات-المطلوبة)
5. [Function Registry — سجل الـ Functions](#5-function-registry--سجل-الـ-functions)
6. [Function Handlers — منفذو الـ Functions](#6-function-handlers--منفذو-الـ-functions)
7. [Exporters — محركات التصدير](#7-exporters--محركات-التصدير)
8. [Pipeline Engine — محرك التسلسل](#8-pipeline-engine--محرك-التسلسل)
9. [API Endpoint الموحد](#9-api-endpoint-الموحد)
10. [ربط الـ Functions بـ Zoon Agent](#10-ربط-الـ-functions-بـ-zoon-agent)
11. [قاعدة البيانات](#11-قاعدة-البيانات)
12. [كيفية إضافة Function جديدة](#12-كيفية-إضافة-function-جديدة)
13. [السيناريوهات الكاملة](#13-السيناريوهات-الكاملة)
14. [معايير الجودة والاختبار](#14-معايير-الجودة-والاختبار)
15. [Skill Modules — المهارات كـ Modules متكاملة ⭐ v2.0](#15-skill-modules--المهارات-كـ-modules-متكاملة)
16. [Production Roadmap — خارطة طريق الإنتاج 🚀](#16-production-roadmap--خارطة-طريق-الإنتاج)
17. [File Management — إدارة الملفات كـ Skill Module ✨](#17-file-management--إدارة-الملفات-كـ-skill-module)
18. [Workflow Builder — من Pipeline إلى Skill تلقائياً 🏗️](#18-workflow-builder--من-pipeline-إلى-skill-تلقائياً)

---

## 1. الفكرة والسيناريو

### المشكلة التي يحلها النظام

في النظام التقليدي، كل عملية جديدة (تصدير تقرير، حساب أرباح، إرسال ملف) تتطلب:
- مطور يكتب كوداً جديداً
- نشر تحديث للتطبيق
- انتظار أيام أو أسابيع

**مع نظام Functions الهجين:**
```
المدير من الواجهة:
"احسب أرباح مارس وصدّرها PDF وابعتها تليجرام"
          ↓
الوكيل يفهم ← يختار الـ Functions المناسبة ← ينفذها بالتسلسل
          ↓
النتيجة في ثوانٍ — بدون مطور — بدون كود جديد
```

### السيناريوهات الرئيسية

#### السيناريو 1: تقرير مالي
```
المدير: "عايز تقرير أرباح ربع السنة الأول PDF"
          ↓
calcProfits(startDate=Jan, endDate=Mar)
          ↓
exportPDF(data=النتائج, template=financial)
          ↓
sendTelegram(file=الـ PDF, message="تقرير Q1 جاهز")
```

#### السيناريو 2: بحث وتلخيص
```
المدير: "ابحث عن أخبار أسعار الوقود ولخّص وانشر في غرفة الإدارة"
          ↓
websearch(query="أسعار الوقود اليوم")
          ↓
webfetch(url=أفضل نتيجة)
          ↓
summarizeText(text=المحتوى, language=arabic)
          ↓
publishRoom(roomId=admin-room, content=الملخص)
```

#### السيناريو 3: تقرير المناديب
```
المدير: "اعمل تقرير أداء المناديب الأسبوع ده Word وابعته"
          ↓
deliveryPerformance(startDate=السبت, endDate=الجمعة)
          ↓
exportDOCX(data=النتائج, template=drivers)
          ↓
sendTelegram(file=الـ DOCX)
```

### مبدأ عمل النظام

```
┌─────────────────────────────────────────────────────┐
│                  مبدأ الطبقتين                       │
│                                                      │
│  طبقة الواجهة:                                       │
│  المدير يختار Functions ويملأ معاملاتها              │
│  لا كود — لا تقنية — فقط اختيارات                   │
│                                                      │
│  طبقة الكود (أنت تكتبها مرة واحدة):                 │
│  كل Function = Handler في الكود                      │
│  يستدعي مكتبات npm، Prisma، APIs                     │
│  آمن، موثوق، قابل للاختبار                           │
└─────────────────────────────────────────────────────┘
```

---

## 2. المعمارية الكاملة

```
┌──────────────────────────────────────────────────────────────┐
│                    واجهة المدير (UI)                          │
│         يختار Functions → يملأ المعاملات → ينفذ             │
└──────────────────────────┬───────────────────────────────────┘
                           ↓
┌──────────────────────────▼───────────────────────────────────┐
│                   Zoon Agent (LLM)                            │
│    يفهم الأمر ← يختار الـ Functions ← يمررها للـ Engine      │
└──────────────────────────┬───────────────────────────────────┘
                           ↓
┌──────────────────────────▼───────────────────────────────────┐
│              Function Registry (السجل)                        │
│    قائمة بكل Function المتاحة + معاملاتها + نوعها           │
└──────┬───────────────────┬──────────────────┬────────────────┘
       ↓                   ↓                  ↓
┌──────▼──────┐   ┌────────▼──────┐   ┌──────▼──────────┐
│  Financial  │   │    Export     │   │    Messaging    │
│  Handlers   │   │   Handlers    │   │    Handlers     │
│             │   │               │   │                 │
│ calcProfits │   │  exportPDF    │   │  sendTelegram   │
│ calcCommiss │   │  exportDOCX   │   │  publishRoom    │
│ zoneStats   │   │  exportXLSX   │   │  sendEmail      │
└──────┬──────┘   └────────┬──────┘   └──────┬──────────┘
       ↓                   ↓                  ↓
┌──────▼───────────────────▼──────────────────▼──────────┐
│                    المكتبات الخارجية                    │
│   prisma • pdfkit • docx-js • axios • telegraf • xlsx  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. هيكل المجلدات

```
src/
└── domains/
    └── zoon-os/
        └── functions/
            ├── registry/
            │   ├── index.ts                  ← تصدير كل الـ registry
            │   ├── financial-nodes.ts        ← تعريف nodes المالية
            │   ├── export-nodes.ts           ← تعريف nodes التصدير
            │   ├── search-nodes.ts           ← تعريف nodes البحث
            │   ├── delivery-nodes.ts         ← تعريف nodes التوصيل
            │   ├── messaging-nodes.ts        ← تعريف nodes الرسائل
            │   └── ai-nodes.ts              ← تعريف nodes الذكاء الاصطناعي
            │
            ├── handlers/
            │   ├── financial-handlers.ts     ← تنفيذ العمليات المالية
            │   ├── export-handlers.ts        ← تنفيذ عمليات التصدير
            │   ├── search-handlers.ts        ← تنفيذ عمليات البحث
            │   ├── delivery-handlers.ts      ← تنفيذ عمليات التوصيل
            │   ├── messaging-handlers.ts     ← تنفيذ عمليات الرسائل
            │   └── ai-handlers.ts           ← تنفيذ عمليات الذكاء الاصطناعي
            │
            ├── exporters/
            │   ├── pdf-exporter.ts          ← محرك توليد PDF
            │   ├── docx-exporter.ts         ← محرك توليد DOCX
            │   ├── xlsx-exporter.ts         ← محرك توليد Excel
            │   └── templates/               ← قوالب التصدير
            │       ├── financial.ts
            │       ├── drivers.ts
            │       └── orders.ts
            │
            ├── pipeline/
            │   ├── pipeline-engine.ts       ← محرك تشغيل التسلسل
            │   └── pipeline-validator.ts    ← التحقق من صحة الـ Pipeline
            │
            └── executor.ts                  ← نقطة الدخول الموحدة

app/
└── api/
    └── internal/
        └── run-function/
            └── route.ts                     ← API endpoint الموحد
```

---

## 4. المكتبات المطلوبة

```bash
# التصدير
npm install pdfkit @types/pdfkit
npm install docx
npm install xlsx
npm install puppeteer          # PDF من HTML (أجمل تصميماً)

# البحث والجلب
npm install axios
npm install cheerio @types/cheerio

# معالجة البيانات
npm install lodash @types/lodash
npm install date-fns

# الرسائل
npm install telegraf

# الرسوم البيانية
npm install chartjs-node-canvas chart.js

# معالجة الصور
npm install sharp

# الإيميل
npm install nodemailer @types/nodemailer

# الـ Storage (رفع الملفات)
npm install @supabase/storage-js   # مدمج مع Supabase
```

---

## 5. Function Registry — سجل الـ Functions

**الملف:** `src/domains/zoon-os/functions/registry/index.ts`

هذا هو قلب النظام — كل Function موجودة هنا يراها المدير في الواجهة والوكيل في السجل.

```typescript
// src/domains/zoon-os/functions/registry/index.ts

export type ParamType = 'date' | 'text' | 'number' | 'select' | 'boolean' | 'object'
export type OutputFormat = 'pdf' | 'docx' | 'xlsx' | 'json' | 'text' | 'binary'
export type NodeCategory = 'financial' | 'export' | 'search' | 'delivery' | 'messaging' | 'ai'

export interface NodeParam {
  key: string
  label: string              // عرض بالعربي في الواجهة
  type: ParamType
  required: boolean
  options?: string[]         // للـ select فقط
  default?: unknown
  description?: string       // تلميح في الواجهة
}

export interface NodeOutput {
  key: string
  type: string
  description: string
}

export interface FunctionNode {
  id: string
  label: string              // اسم عربي للواجهة
  description: string        // وصف لما تفعله
  category: NodeCategory
  icon: string
  params: NodeParam[]
  outputs: NodeOutput[]
  handler: string            // اسم الدالة في handlers/
  isHITL?: boolean           // هل تحتاج موافقة بشرية؟
  supportedFormats?: OutputFormat[]
}

// ========================================================
// سجل كل الـ Functions المتاحة في النظام
// ========================================================
export const FUNCTION_NODES: Record<string, FunctionNode> = {

  // ===== 💰 المالية =====
  'calc-profits': {
    id: 'calc-profits',
    label: 'حساب الأرباح والخسائر',
    description: 'يحسب الإيرادات والتكاليف وصافي الأرباح لفترة محددة',
    category: 'financial',
    icon: '💰',
    params: [
      { key: 'startDate', label: 'من تاريخ', type: 'date', required: true },
      { key: 'endDate', label: 'إلى تاريخ', type: 'date', required: true },
      {
        key: 'groupBy',
        label: 'تجميع حسب',
        type: 'select',
        required: false,
        options: ['none', 'day', 'week', 'month'],
        default: 'none'
      }
    ],
    outputs: [
      { key: 'revenue', type: 'number', description: 'إجمالي الإيرادات' },
      { key: 'costs', type: 'number', description: 'إجمالي التكاليف' },
      { key: 'profit', type: 'number', description: 'صافي الربح' },
      { key: 'margin', type: 'string', description: 'هامش الربح %' },
      { key: 'ordersCount', type: 'number', description: 'عدد الطلبات' }
    ],
    handler: 'calcProfitsHandler'
  },

  'calc-driver-commission': {
    id: 'calc-driver-commission',
    label: 'عمولة المناديب',
    description: 'يحسب عمولة مندوب أو كل المناديب لفترة محددة',
    category: 'financial',
    icon: '💵',
    params: [
      { key: 'startDate', label: 'من تاريخ', type: 'date', required: true },
      { key: 'endDate', label: 'إلى تاريخ', type: 'date', required: true },
      { key: 'driverId', label: 'رقم المندوب (اتركه فارغاً للكل)', type: 'text', required: false },
      { key: 'commissionRate', label: 'نسبة العمولة %', type: 'number', required: false, default: 10 }
    ],
    outputs: [
      { key: 'drivers', type: 'array', description: 'قائمة المناديب مع عمولة كل واحد' },
      { key: 'totalCommissions', type: 'number', description: 'إجمالي العمولات' }
    ],
    handler: 'calcDriverCommissionHandler'
  },

  'zone-analytics': {
    id: 'zone-analytics',
    label: 'تحليل المناطق',
    description: 'مقارنة أداء المناطق من حيث الطلبات والإيرادات',
    category: 'financial',
    icon: '🗺️',
    params: [
      { key: 'startDate', label: 'من تاريخ', type: 'date', required: true },
      { key: 'endDate', label: 'إلى تاريخ', type: 'date', required: true },
      { key: 'topN', label: 'أفضل كم منطقة؟', type: 'number', required: false, default: 5 }
    ],
    outputs: [
      { key: 'zones', type: 'array', description: 'المناطق مرتبة حسب الأداء' },
      { key: 'topZone', type: 'string', description: 'أفضل منطقة' }
    ],
    handler: 'zoneAnalyticsHandler'
  },

  // ===== 📄 التصدير =====
  'export-pdf': {
    id: 'export-pdf',
    label: 'تصدير PDF',
    description: 'يحول البيانات إلى ملف PDF احترافي',
    category: 'export',
    icon: '📄',
    params: [
      { key: 'data', label: 'البيانات', type: 'object', required: true, description: 'يأتي من الـ function السابقة' },
      {
        key: 'template',
        label: 'القالب',
        type: 'select',
        required: true,
        options: ['financial', 'drivers', 'orders', 'zones', 'general']
      },
      { key: 'title', label: 'عنوان التقرير', type: 'text', required: false }
    ],
    outputs: [
      { key: 'fileUrl', type: 'string', description: 'رابط الملف في Storage' },
      { key: 'fileName', type: 'string', description: 'اسم الملف' },
      { key: 'fileBuffer', type: 'binary', description: 'بيانات الملف' }
    ],
    supportedFormats: ['pdf'],
    handler: 'exportPDFHandler'
  },

  'export-docx': {
    id: 'export-docx',
    label: 'تصدير Word (DOCX)',
    description: 'يحول البيانات إلى مستند Word قابل للتعديل',
    category: 'export',
    icon: '📝',
    params: [
      { key: 'data', label: 'البيانات', type: 'object', required: true },
      {
        key: 'template',
        label: 'القالب',
        type: 'select',
        required: true,
        options: ['financial', 'drivers', 'orders', 'general']
      },
      { key: 'title', label: 'عنوان المستند', type: 'text', required: false }
    ],
    outputs: [
      { key: 'fileUrl', type: 'string', description: 'رابط الملف' },
      { key: 'fileName', type: 'string', description: 'اسم الملف' }
    ],
    supportedFormats: ['docx'],
    handler: 'exportDOCXHandler'
  },

  'export-xlsx': {
    id: 'export-xlsx',
    label: 'تصدير Excel (XLSX)',
    description: 'يصدّر البيانات كجدول Excel',
    category: 'export',
    icon: '📊',
    params: [
      { key: 'data', label: 'البيانات', type: 'object', required: true },
      { key: 'sheetName', label: 'اسم الشيت', type: 'text', required: false, default: 'Report' }
    ],
    outputs: [
      { key: 'fileUrl', type: 'string', description: 'رابط الملف' },
      { key: 'fileName', type: 'string', description: 'اسم الملف' }
    ],
    supportedFormats: ['xlsx'],
    handler: 'exportXLSXHandler'
  },

  // ===== 🔍 البحث والجلب =====
  'web-search': {
    id: 'web-search',
    label: 'بحث على الإنترنت',
    description: 'يبحث عن معلومات على الإنترنت ويعيد النتائج',
    category: 'search',
    icon: '🔍',
    params: [
      { key: 'query', label: 'نص البحث', type: 'text', required: true },
      { key: 'limit', label: 'عدد النتائج', type: 'number', required: false, default: 5 }
    ],
    outputs: [
      { key: 'results', type: 'array', description: 'نتائج البحث' },
      { key: 'topUrl', type: 'string', description: 'رابط أفضل نتيجة' }
    ],
    handler: 'webSearchHandler'
  },

  'web-fetch': {
    id: 'web-fetch',
    label: 'جلب محتوى صفحة',
    description: 'يجلب محتوى صفحة ويب معينة',
    category: 'search',
    icon: '🌐',
    params: [
      { key: 'url', label: 'رابط الصفحة', type: 'text', required: true },
      { key: 'extractText', label: 'استخراج النص فقط؟', type: 'boolean', required: false, default: true }
    ],
    outputs: [
      { key: 'content', type: 'string', description: 'محتوى الصفحة' },
      { key: 'title', type: 'string', description: 'عنوان الصفحة' }
    ],
    handler: 'webFetchHandler'
  },

  // ===== 🚴 التوصيل =====
  'get-delayed-drivers': {
    id: 'get-delayed-drivers',
    label: 'المناديب المتأخرون',
    description: 'يجلب قائمة المناديب الذين تأخروا عن حد معين',
    category: 'delivery',
    icon: '⏰',
    params: [
      { key: 'minutesThreshold', label: 'حد التأخير (دقائق)', type: 'number', required: true, default: 30 }
    ],
    outputs: [
      { key: 'drivers', type: 'array', description: 'قائمة المناديب المتأخرين' },
      { key: 'count', type: 'number', description: 'عدد المناديب المتأخرين' }
    ],
    handler: 'getDelayedDriversHandler'
  },

  'delivery-performance': {
    id: 'delivery-performance',
    label: 'تقرير أداء المناديب',
    description: 'يحلل أداء المناديب لفترة محددة',
    category: 'delivery',
    icon: '📈',
    params: [
      { key: 'startDate', label: 'من تاريخ', type: 'date', required: true },
      { key: 'endDate', label: 'إلى تاريخ', type: 'date', required: true },
      { key: 'driverId', label: 'مندوب محدد (اختياري)', type: 'text', required: false }
    ],
    outputs: [
      { key: 'drivers', type: 'array', description: 'أداء كل مندوب' },
      { key: 'topDriver', type: 'object', description: 'أفضل مندوب' },
      { key: 'summary', type: 'string', description: 'ملخص نصي' }
    ],
    handler: 'deliveryPerformanceHandler'
  },

  // ===== 💬 الرسائل =====
  'send-telegram': {
    id: 'send-telegram',
    label: 'إرسال تليجرام',
    description: 'يرسل رسالة أو ملف عبر تليجرام',
    category: 'messaging',
    icon: '📨',
    isHITL: true,
    params: [
      { key: 'message', label: 'نص الرسالة', type: 'text', required: true },
      { key: 'fileUrl', label: 'رابط ملف (اختياري)', type: 'text', required: false },
      { key: 'chatId', label: 'معرّف المجموعة', type: 'text', required: false }
    ],
    outputs: [
      { key: 'sent', type: 'boolean', description: 'هل تم الإرسال؟' },
      { key: 'messageId', type: 'string', description: 'معرّف الرسالة' }
    ],
    handler: 'sendTelegramHandler'
  },

  'publish-room': {
    id: 'publish-room',
    label: 'نشر في غرفة',
    description: 'ينشر محتوى في غرفة النادي',
    category: 'messaging',
    icon: '🏠',
    isHITL: true,
    params: [
      { key: 'roomId', label: 'معرّف الغرفة', type: 'text', required: true },
      { key: 'content', label: 'المحتوى', type: 'text', required: true },
      { key: 'title', label: 'العنوان', type: 'text', required: false }
    ],
    outputs: [
      { key: 'published', type: 'boolean', description: 'هل تم النشر؟' },
      { key: 'postId', type: 'string', description: 'معرّف المنشور' }
    ],
    handler: 'publishRoomHandler'
  },

  // ===== 🧠 الذكاء الاصطناعي =====
  'summarize-text': {
    id: 'summarize-text',
    label: 'تلخيص نص بالذكاء الاصطناعي',
    description: 'يلخص نصاً طويلاً بنقاط مختصرة',
    category: 'ai',
    icon: '🧠',
    params: [
      { key: 'text', label: 'النص المراد تلخيصه', type: 'text', required: true },
      {
        key: 'language',
        label: 'لغة الملخص',
        type: 'select',
        required: false,
        options: ['arabic', 'english'],
        default: 'arabic'
      },
      { key: 'maxPoints', label: 'عدد النقاط', type: 'number', required: false, default: 5 }
    ],
    outputs: [
      { key: 'summary', type: 'string', description: 'الملخص' },
      { key: 'points', type: 'array', description: 'النقاط الرئيسية' }
    ],
    handler: 'summarizeTextHandler'
  },

  'translate-text': {
    id: 'translate-text',
    label: 'ترجمة نص',
    description: 'يترجم نصاً من لغة إلى أخرى',
    category: 'ai',
    icon: '🌍',
    params: [
      { key: 'text', label: 'النص', type: 'text', required: true },
      {
        key: 'targetLanguage',
        label: 'اللغة المستهدفة',
        type: 'select',
        required: true,
        options: ['arabic', 'english', 'french'],
        default: 'arabic'
      }
    ],
    outputs: [
      { key: 'translated', type: 'string', description: 'النص المترجم' }
    ],
    handler: 'translateTextHandler'
  }
}

// مساعد: جلب Function بالـ ID
export function getFunctionNode(id: string): FunctionNode | undefined {
  return FUNCTION_NODES[id]
}

// مساعد: جلب كل Functions فئة معينة
export function getFunctionsByCategory(category: NodeCategory): FunctionNode[] {
  return Object.values(FUNCTION_NODES).filter(n => n.category === category)
}

// مساعد: بناء وصف للوكيل (يُحقن في System Prompt)
export function buildFunctionsDescription(): string {
  const categories = [...new Set(Object.values(FUNCTION_NODES).map(n => n.category))]
  
  return categories.map(cat => {
    const nodes = getFunctionsByCategory(cat)
    const nodesList = nodes.map(n => `  - ${n.id}: ${n.description}`).join('\n')
    return `### ${cat}\n${nodesList}`
  }).join('\n\n')
}
```

---

## 6. Function Handlers — منفذو الـ Functions

### 6.1 Financial Handlers

**الملف:** `src/domains/zoon-os/functions/handlers/financial-handlers.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface HandlerResult<T = unknown> {
  success: boolean
  data?: T
  summary?: string       // ملخص نصي للوكيل
  fileBuffer?: Buffer
  fileName?: string
  mimeType?: string
  error?: string
}

// ===== حساب الأرباح والخسائر =====
export async function calcProfitsHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  const { startDate, endDate, groupBy } = params

  try {
    const orders = await prisma.delivery_orders.findMany({
      where: {
        created_at: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        },
        status: 'completed'
      },
      select: {
        actual_total_amount: true,
        delivery_cost: true,
        created_at: true,
        zone: true
      }
    })

    const revenue = orders.reduce((s, o) => s + Number(o.actual_total_amount ?? 0), 0)
    const costs   = orders.reduce((s, o) => s + Number(o.delivery_cost ?? 0), 0)
    const profit  = revenue - costs
    const margin  = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0'

    // تجميع حسب الفترة إذا طُلب
    let grouped = null
    if (groupBy && groupBy !== 'none') {
      grouped = groupOrdersByPeriod(orders, groupBy as string)
    }

    const data = {
      revenue,
      costs,
      profit,
      margin: margin + '%',
      ordersCount: orders.length,
      avgOrderValue: orders.length > 0 ? (revenue / orders.length).toFixed(0) : '0',
      period: { startDate, endDate },
      grouped
    }

    return {
      success: true,
      data,
      summary: `📊 التقرير المالي (${startDate} → ${endDate}):
• الإيرادات: ${revenue.toLocaleString()} ج.م
• التكاليف: ${costs.toLocaleString()} ج.م
• الأرباح: ${profit.toLocaleString()} ج.م
• هامش الربح: ${margin}%
• عدد الطلبات: ${orders.length}`
    }
  } catch (error) {
    return { success: false, error: `فشل حساب الأرباح: ${(error as Error).message}` }
  }
}

// ===== عمولة المناديب =====
export async function calcDriverCommissionHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  const { startDate, endDate, driverId, commissionRate = 10 } = params

  try {
    const whereClause: Record<string, unknown> = {
      created_at: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      },
      status: 'completed'
    }
    if (driverId) whereClause.driver_id = driverId

    const orders = await prisma.delivery_orders.findMany({
      where: whereClause,
      include: { driver: { select: { id: true, name: true } } }
    })

    // تجميع حسب المندوب
    const driversMap = new Map<string, { name: string; orders: number; revenue: number }>()

    for (const order of orders) {
      const id = (order as any).driver_id ?? 'unknown'
      const driver = driversMap.get(id) ?? {
        name: (order as any).driver?.name ?? 'غير معروف',
        orders: 0,
        revenue: 0
      }
      driver.orders++
      driver.revenue += Number(order.actual_total_amount ?? 0)
      driversMap.set(id, driver)
    }

    const drivers = Array.from(driversMap.entries()).map(([id, d]) => ({
      id,
      name: d.name,
      ordersCount: d.orders,
      revenue: d.revenue,
      commission: (d.revenue * Number(commissionRate) / 100).toFixed(2)
    }))

    const totalCommissions = drivers.reduce((s, d) => s + Number(d.commission), 0)

    return {
      success: true,
      data: { drivers, totalCommissions, commissionRate },
      summary: `💵 عمولة ${drivers.length} مندوب = ${totalCommissions.toFixed(2)} ج.م (${commissionRate}%)`
    }
  } catch (error) {
    return { success: false, error: `فشل حساب العمولات: ${(error as Error).message}` }
  }
}

// ===== تحليل المناطق =====
export async function zoneAnalyticsHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  const { startDate, endDate, topN = 5 } = params

  try {
    const orders = await prisma.delivery_orders.findMany({
      where: {
        created_at: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      },
      select: { zone: true, actual_total_amount: true, status: true }
    })

    const zonesMap = new Map<string, { total: number; completed: number; revenue: number }>()

    for (const order of orders) {
      const zone = (order as any).zone ?? 'غير محدد'
      const existing = zonesMap.get(zone) ?? { total: 0, completed: 0, revenue: 0 }
      existing.total++
      if (order.status === 'completed') {
        existing.completed++
        existing.revenue += Number(order.actual_total_amount ?? 0)
      }
      zonesMap.set(zone, existing)
    }

    const zones = Array.from(zonesMap.entries())
      .map(([name, stats]) => ({
        name,
        ...stats,
        successRate: ((stats.completed / stats.total) * 100).toFixed(0) + '%'
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, Number(topN))

    return {
      success: true,
      data: { zones, topZone: zones[0]?.name ?? 'لا توجد بيانات' },
      summary: `🗺️ أفضل ${zones.length} منطقة — الأولى: ${zones[0]?.name} بإيرادات ${zones[0]?.revenue?.toLocaleString()} ج.م`
    }
  } catch (error) {
    return { success: false, error: `فشل تحليل المناطق: ${(error as Error).message}` }
  }
}

// ===== مساعد داخلي =====
function groupOrdersByPeriod(orders: any[], groupBy: string) {
  const grouped = new Map<string, { revenue: number; count: number }>()
  
  for (const order of orders) {
    const date = new Date(order.created_at)
    let key: string
    
    if (groupBy === 'day') key = date.toISOString().split('T')[0]
    else if (groupBy === 'week') key = `Week-${getWeekNumber(date)}`
    else key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    const existing = grouped.get(key) ?? { revenue: 0, count: 0 }
    existing.revenue += Number(order.actual_total_amount ?? 0)
    existing.count++
    grouped.set(key, existing)
  }
  
  return Array.from(grouped.entries()).map(([period, stats]) => ({ period, ...stats }))
}

function getWeekNumber(date: Date): number {
  const firstDay = new Date(date.getFullYear(), 0, 1)
  return Math.ceil(((date.getTime() - firstDay.getTime()) / 86400000 + firstDay.getDay() + 1) / 7)
}
```

### 6.2 Search Handlers

**الملف:** `src/domains/zoon-os/functions/handlers/search-handlers.ts`

```typescript
import axios from 'axios'
import * as cheerio from 'cheerio'
import { HandlerResult } from './financial-handlers'

// ===== بحث على الإنترنت =====
export async function webSearchHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  const { query, limit = 5 } = params

  try {
    // استخدام Serper API (أو أي search API)
    const response = await axios.post(
      'https://google.serper.dev/search',
      { q: query, num: limit },
      { headers: { 'X-API-KEY': process.env.SERPER_API_KEY! } }
    )

    const results = (response.data.organic ?? []).map((r: any) => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet
    }))

    return {
      success: true,
      data: { results, count: results.length, topUrl: results[0]?.url },
      summary: `🔍 وجدت ${results.length} نتيجة لـ "${query}"`
    }
  } catch (error) {
    return { success: false, error: `فشل البحث: ${(error as Error).message}` }
  }
}

// ===== جلب محتوى صفحة =====
export async function webFetchHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  const { url, extractText = true } = params

  try {
    const response = await axios.get(url as string, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZoonBot/1.0)' }
    })

    const $ = cheerio.load(response.data)
    
    // حذف scripts و styles
    $('script, style, nav, footer, header').remove()
    
    const title = $('title').text().trim()
    const content = extractText
      ? $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000)
      : response.data

    return {
      success: true,
      data: { content, title, url },
      summary: `🌐 تم جلب: "${title}" (${content.length} حرف)`
    }
  } catch (error) {
    return { success: false, error: `فشل جلب الصفحة: ${(error as Error).message}` }
  }
}
```

### 6.3 AI Handlers

**الملف:** `src/domains/zoon-os/functions/handlers/ai-handlers.ts`

```typescript
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { HandlerResult } from './financial-handlers'

// ===== تلخيص النص =====
export async function summarizeTextHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  const { text, language = 'arabic', maxPoints = 5 } = params

  try {
    const langInstruction = language === 'arabic' ? 'بالعربية' : 'in English'
    
    const result = await generateText({
      model: google('gemini-2.5-flash-lite'),
      prompt: `لخّص النص التالي ${langInstruction} في ${maxPoints} نقاط مختصرة:

${text}

اكتب الملخص كنقاط مرقمة فقط.`
    })

    const points = result.text
      .split('\n')
      .filter(line => line.trim())
      .slice(0, Number(maxPoints))

    return {
      success: true,
      data: { summary: result.text, points },
      summary: `🧠 تم تلخيص النص في ${points.length} نقاط`
    }
  } catch (error) {
    return { success: false, error: `فشل التلخيص: ${(error as Error).message}` }
  }
}

// ===== ترجمة النص =====
export async function translateTextHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  const { text, targetLanguage = 'arabic' } = params

  const langNames: Record<string, string> = {
    arabic: 'العربية',
    english: 'الإنجليزية',
    french: 'الفرنسية'
  }

  try {
    const result = await generateText({
      model: google('gemini-2.5-flash-lite'),
      prompt: `ترجم النص التالي إلى ${langNames[targetLanguage as string] ?? targetLanguage}. اكتب الترجمة فقط بدون أي تعليق:

${text}`
    })

    return {
      success: true,
      data: { translated: result.text, originalLength: (text as string).length },
      summary: `🌍 تمت الترجمة إلى ${langNames[targetLanguage as string]}`
    }
  } catch (error) {
    return { success: false, error: `فشل الترجمة: ${(error as Error).message}` }
  }
}
```

---

## 7. Exporters — محركات التصدير

### 7.1 PDF Exporter

**الملف:** `src/domains/zoon-os/functions/exporters/pdf-exporter.ts`

```typescript
import PDFDocument from 'pdfkit'
import { HandlerResult } from '../handlers/financial-handlers'

type PDFTemplate = 'financial' | 'drivers' | 'orders' | 'zones' | 'general'

export async function exportPDFHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  const { data, template, title } = params

  try {
    const buffer = await generatePDF(template as PDFTemplate, data as Record<string, unknown>, title as string)
    const fileName = `${template}-report-${Date.now()}.pdf`

    // رفع لـ Supabase Storage
    const fileUrl = await uploadToStorage(buffer, fileName, 'application/pdf')

    return {
      success: true,
      data: { fileUrl, fileName },
      fileBuffer: buffer,
      fileName,
      mimeType: 'application/pdf',
      summary: `📄 تم إنشاء ملف PDF: ${fileName}`
    }
  } catch (error) {
    return { success: false, error: `فشل إنشاء PDF: ${(error as Error).message}` }
  }
}

async function generatePDF(
  template: PDFTemplate,
  data: Record<string, unknown>,
  title?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: { Title: title ?? 'Zoon OS Report' }
    })

    const buffers: Buffer[] = []
    doc.on('data', chunk => buffers.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    // --- Header ---
    doc.rect(0, 0, doc.page.width, 80).fill('#6C5CE7')
    doc.fillColor('white')
      .fontSize(22)
      .text(title ?? getTemplateTitle(template), 50, 25, { align: 'center' })
    doc.fillColor('black').moveDown(2)

    // --- المحتوى حسب القالب ---
    switch (template) {
      case 'financial':
        renderFinancialPDF(doc, data)
        break
      case 'drivers':
        renderDriversPDF(doc, data)
        break
      case 'orders':
        renderOrdersPDF(doc, data)
        break
      default:
        renderGeneralPDF(doc, data)
    }

    // --- Footer ---
    doc.fontSize(8)
      .fillColor('#999')
      .text(
        `Zoon OS — تقرير تلقائي — ${new Date().toLocaleDateString('ar-EG')}`,
        50, doc.page.height - 30,
        { align: 'center' }
      )

    doc.end()
  })
}

function renderFinancialPDF(doc: PDFKit.PDFDocument, data: Record<string, unknown>) {
  const { revenue, costs, profit, margin, ordersCount } = data

  // بطاقات الإحصائيات
  const cards = [
    { label: 'الإيرادات', value: `${Number(revenue).toLocaleString()} ج.م`, color: '#00B894' },
    { label: 'التكاليف', value: `${Number(costs).toLocaleString()} ج.م`, color: '#E17055' },
    { label: 'الأرباح', value: `${Number(profit).toLocaleString()} ج.م`, color: '#6C5CE7' },
    { label: 'هامش الربح', value: String(margin), color: '#0984E3' }
  ]

  let x = 50
  cards.forEach(card => {
    doc.rect(x, 100, 110, 60).fill(card.color)
    doc.fillColor('white').fontSize(10).text(card.label, x + 5, 108)
    doc.fontSize(14).text(card.value, x + 5, 125)
    doc.fillColor('black')
    x += 125
  })

  doc.moveDown(5)
  doc.fontSize(12).text(`عدد الطلبات: ${ordersCount}`, { align: 'right' })
}

function renderDriversPDF(doc: PDFKit.PDFDocument, data: Record<string, unknown>) {
  const drivers = (data.drivers ?? []) as any[]

  // جدول المناديب
  doc.moveDown()
  doc.fontSize(14).text('أداء المناديب', { align: 'right', underline: true })
  doc.moveDown()

  const headers = ['النجاح%', 'الإيرادات', 'الطلبات', 'الاسم']
  const colWidths = [80, 120, 80, 180]
  let x = 50
  let y = doc.y

  // رسم رأس الجدول
  doc.rect(x, y, 490, 20).fill('#6C5CE7')
  doc.fillColor('white').fontSize(10)
  let cx = x + 10
  headers.forEach((h, i) => {
    doc.text(h, cx, y + 4, { width: colWidths[i] })
    cx += colWidths[i]
  })

  // رسم الصفوف
  doc.fillColor('black')
  drivers.slice(0, 20).forEach((driver, idx) => {
    y += 22
    if (idx % 2 === 0) doc.rect(x, y, 490, 20).fill('#F8F9FA')
    doc.fillColor('#333').fontSize(9)
    cx = x + 10
    const row = [driver.successRate, `${Number(driver.revenue).toLocaleString()}`, String(driver.ordersCount), driver.name]
    row.forEach((cell, i) => {
      doc.text(String(cell), cx, y + 4, { width: colWidths[i] })
      cx += colWidths[i]
    })
  })
}

function renderOrdersPDF(doc: PDFKit.PDFDocument, data: Record<string, unknown>) {
  doc.fontSize(12).text(JSON.stringify(data, null, 2))
}

function renderGeneralPDF(doc: PDFKit.PDFDocument, data: Record<string, unknown>) {
  doc.fontSize(12).text(JSON.stringify(data, null, 2), { align: 'right' })
}

function getTemplateTitle(template: PDFTemplate): string {
  const titles: Record<PDFTemplate, string> = {
    financial: 'التقرير المالي',
    drivers: 'تقرير أداء المناديب',
    orders: 'تقرير الطلبات',
    zones: 'تقرير المناطق',
    general: 'تقرير عام'
  }
  return titles[template]
}

// رفع الملف لـ Supabase Storage
async function uploadToStorage(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const { data, error } = await supabase.storage
    .from('zoon-reports')
    .upload(`reports/${fileName}`, buffer, { contentType: mimeType, upsert: true })

  if (error) throw new Error(`فشل رفع الملف: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from('zoon-reports')
    .getPublicUrl(`reports/${fileName}`)

  return publicUrl
}
```

### 7.2 DOCX Exporter

**الملف:** `src/domains/zoon-os/functions/exporters/docx-exporter.ts`

```typescript
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow,
  TableCell, HeadingLevel, AlignmentType, WidthType, BorderStyle
} from 'docx'
import { HandlerResult } from '../handlers/financial-handlers'

export async function exportDOCXHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  const { data, template, title } = params

  try {
    const buffer = await generateDOCX(
      template as string,
      data as Record<string, unknown>,
      title as string
    )
    const fileName = `${template}-report-${Date.now()}.docx`
    const { uploadToStorage } = await import('./pdf-exporter')
    const fileUrl = await uploadToStorage(
      buffer,
      fileName,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )

    return {
      success: true,
      data: { fileUrl, fileName },
      fileBuffer: buffer,
      fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      summary: `📝 تم إنشاء ملف Word: ${fileName}`
    }
  } catch (error) {
    return { success: false, error: `فشل إنشاء DOCX: ${(error as Error).message}` }
  }
}

async function generateDOCX(
  template: string,
  data: Record<string, unknown>,
  title?: string
): Promise<Buffer> {
  const children: Paragraph[] = []

  // العنوان الرئيسي
  children.push(
    new Paragraph({
      text: title ?? 'تقرير Zoon OS',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.RIGHT
    }),
    new Paragraph({
      children: [new TextRun({
        text: `تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`,
        color: '999999',
        size: 20
      })],
      alignment: AlignmentType.RIGHT
    }),
    new Paragraph({ text: '' }) // فراغ
  )

  if (template === 'financial') {
    const { revenue, costs, profit, margin, ordersCount } = data
    const stats = [
      ['الإيرادات', `${Number(revenue).toLocaleString()} ج.م`],
      ['التكاليف', `${Number(costs).toLocaleString()} ج.م`],
      ['الأرباح', `${Number(profit).toLocaleString()} ج.م`],
      ['هامش الربح', String(margin)],
      ['عدد الطلبات', String(ordersCount)]
    ]

    // جدول الإحصائيات
    const table = new Table({
      width: { size: 9000, type: WidthType.DXA },
      rows: stats.map(([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: value, bold: true })] })],
              width: { size: 4500, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: label })],
                alignment: AlignmentType.RIGHT
              })],
              width: { size: 4500, type: WidthType.DXA }
            })
          ]
        })
      )
    })
    children.push(table as unknown as Paragraph)
  }

  if (template === 'drivers') {
    const drivers = (data.drivers ?? []) as any[]
    children.push(
      new Paragraph({ text: 'أداء المناديب', heading: HeadingLevel.HEADING_2 }),
      new Table({
        width: { size: 9000, type: WidthType.DXA },
        rows: [
          new TableRow({
            children: ['الاسم', 'الطلبات', 'الإيرادات', 'نسبة النجاح'].map(h =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })]
              })
            )
          }),
          ...drivers.map(d =>
            new TableRow({
              children: [d.name, d.ordersCount, d.revenue, d.successRate].map(val =>
                new TableCell({
                  children: [new Paragraph({ text: String(val) })]
                })
              )
            })
          )
        ]
      }) as unknown as Paragraph
    )
  }

  const doc = new Document({ sections: [{ children }] })
  return Packer.toBuffer(doc)
}
```

---

## 8. Pipeline Engine — محرك التسلسل

**الملف:** `src/domains/zoon-os/functions/pipeline/pipeline-engine.ts`

```typescript
import * as financialHandlers from '../handlers/financial-handlers'
import * as searchHandlers from '../handlers/search-handlers'
import * as aiHandlers from '../handlers/ai-handlers'
import { exportPDFHandler } from '../exporters/pdf-exporter'
import { exportDOCXHandler } from '../exporters/docx-exporter'
import { HandlerResult } from '../handlers/financial-handlers'

// خريطة: handler name → الدالة الفعلية
const HANDLER_MAP: Record<string, (params: Record<string, unknown>) => Promise<HandlerResult>> = {
  calcProfitsHandler:          financialHandlers.calcProfitsHandler,
  calcDriverCommissionHandler: financialHandlers.calcDriverCommissionHandler,
  zoneAnalyticsHandler:        financialHandlers.zoneAnalyticsHandler,
  webSearchHandler:            searchHandlers.webSearchHandler,
  webFetchHandler:             searchHandlers.webFetchHandler,
  summarizeTextHandler:        aiHandlers.summarizeTextHandler,
  translateTextHandler:        aiHandlers.translateTextHandler,
  exportPDFHandler,
  exportDOCXHandler
}

export interface PipelineStep {
  nodeId: string              // مثل: 'calc-profits'
  params: Record<string, unknown>
  // إذا كانت قيمة حقل تأتي من نتيجة خطوة سابقة:
  // { data: '{{step_0.data}}', title: 'تقرير مارس' }
  inputFrom?: number          // رقم الخطوة السابقة التي نأخذ منها البيانات
}

export interface PipelineResult {
  success: boolean
  steps: Array<{
    nodeId: string
    success: boolean
    data?: unknown
    summary?: string
    error?: string
    durationMs: number
  }>
  finalOutput?: unknown
  totalDurationMs: number
}

/**
 * تشغيل Pipeline كامل خطوة بخطوة
 * نتيجة كل خطوة تُمرر للخطوة التالية تلقائياً
 */
export async function runPipeline(steps: PipelineStep[]): Promise<PipelineResult> {
  const startTime = Date.now()
  const results: PipelineResult['steps'] = []
  let previousOutput: unknown = null

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const stepStart = Date.now()

    // استبدال {{prev.data}} بالبيانات الفعلية من الخطوة السابقة
    const resolvedParams = resolveParams(step.params, previousOutput, results)

    // إيجاد الـ handler
    const { getFunctionNode } = await import('../registry')
    const node = getFunctionNode(step.nodeId)

    if (!node) {
      results.push({
        nodeId: step.nodeId,
        success: false,
        error: `Function غير موجودة: ${step.nodeId}`,
        durationMs: Date.now() - stepStart
      })
      break
    }

    const handler = HANDLER_MAP[node.handler]
    if (!handler) {
      results.push({
        nodeId: step.nodeId,
        success: false,
        error: `Handler غير موجود: ${node.handler}`,
        durationMs: Date.now() - stepStart
      })
      break
    }

    try {
      const result = await handler(resolvedParams)
      const durationMs = Date.now() - stepStart

      results.push({
        nodeId: step.nodeId,
        success: result.success,
        data: result.data,
        summary: result.summary,
        error: result.error,
        durationMs
      })

      if (!result.success) break  // أوقف عند أول فشل
      previousOutput = result.data
    } catch (err) {
      results.push({
        nodeId: step.nodeId,
        success: false,
        error: (err as Error).message,
        durationMs: Date.now() - stepStart
      })
      break
    }
  }

  const allSuccess = results.every(r => r.success)
  return {
    success: allSuccess,
    steps: results,
    finalOutput: previousOutput,
    totalDurationMs: Date.now() - startTime
  }
}

/**
 * استبدال {{prev.fieldName}} بالقيم الفعلية من الخطوات السابقة
 */
function resolveParams(
  params: Record<string, unknown>,
  prevOutput: unknown,
  allResults: PipelineResult['steps']
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      const path = value.slice(2, -2).trim()  // مثل: prev.data أو step_0.data

      if (path.startsWith('prev.')) {
        const field = path.slice(5)
        resolved[key] = getNestedValue(prevOutput, field)
      } else if (path.startsWith('step_')) {
        const [stepPart, ...fieldParts] = path.split('.')
        const stepIndex = parseInt(stepPart.replace('step_', ''))
        const stepData = allResults[stepIndex]?.data
        resolved[key] = getNestedValue(stepData, fieldParts.join('.'))
      } else {
        resolved[key] = value
      }
    } else {
      resolved[key] = value
    }
  }

  return resolved
}

function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || !path) return obj
  return path.split('.').reduce((curr: any, key) => curr?.[key], obj)
}
```

---

## 9. API Endpoint الموحد

**الملف:** `app/api/internal/run-function/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getFunctionNode, FUNCTION_NODES } from '@/domains/zoon-os/functions/registry'
import { runPipeline, PipelineStep } from '@/domains/zoon-os/functions/pipeline/pipeline-engine'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { mode, nodeId, params, steps } = body

    // ===== الوضع 1: تشغيل Function واحدة =====
    if (mode === 'single' || nodeId) {
      const node = getFunctionNode(nodeId)
      if (!node) {
        return NextResponse.json({ error: `Function غير موجودة: ${nodeId}` }, { status: 404 })
      }

      // التحقق من المعاملات المطلوبة
      const missing = node.params
        .filter(p => p.required && !params?.[p.key])
        .map(p => p.label)

      if (missing.length > 0) {
        return NextResponse.json({
          error: `معاملات ناقصة: ${missing.join(', ')}`
        }, { status: 400 })
      }

      // تشغيل كـ Pipeline بخطوة واحدة
      const result = await runPipeline([{ nodeId, params: params ?? {} }])
      return NextResponse.json(result)
    }

    // ===== الوضع 2: تشغيل Pipeline متعدد الخطوات =====
    if (mode === 'pipeline' && steps) {
      const result = await runPipeline(steps as PipelineStep[])
      return NextResponse.json(result)
    }

    // ===== الوضع 3: جلب قائمة الـ Functions المتاحة =====
    if (mode === 'list') {
      return NextResponse.json({
        functions: Object.values(FUNCTION_NODES).map(n => ({
          id: n.id,
          label: n.label,
          description: n.description,
          category: n.category,
          icon: n.icon,
          isHITL: n.isHITL ?? false,
          paramsCount: n.params.length
        }))
      })
    }

    return NextResponse.json({ error: 'mode غير صحيح' }, { status: 400 })

  } catch (error) {
    console.error('[Function API] خطأ:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

// GET: جلب تفاصيل Function معينة
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const nodeId = searchParams.get('nodeId')

  if (nodeId) {
    const node = getFunctionNode(nodeId)
    if (!node) return NextResponse.json({ error: 'غير موجودة' }, { status: 404 })
    return NextResponse.json(node)
  }

  return NextResponse.json({ functions: Object.values(FUNCTION_NODES) })
}
```

---

## 10. ربط الـ Functions بـ Zoon Agent

أضف مهارة واحدة في قاعدة البيانات تفتح كل الـ Functions للوكيل:

```sql
INSERT INTO ai_skills (name, description, type, webhook_url, input_schema, is_active)
VALUES (
  'runFunction',
  'استخدم هذه المهارة لتشغيل أي عملية حسابية أو تصدير أو بحث.
  
  الـ Functions المتاحة:
  - calc-profits: حساب الأرباح والخسائر (يحتاج startDate, endDate)
  - calc-driver-commission: عمولة المناديب
  - zone-analytics: تحليل المناطق
  - delivery-performance: أداء المناديب
  - web-search: بحث على الإنترنت (يحتاج query)
  - web-fetch: جلب محتوى صفحة (يحتاج url)
  - summarize-text: تلخيص نص (يحتاج text)
  - translate-text: ترجمة نص
  - export-pdf: تصدير PDF (يحتاج data, template)
  - export-docx: تصدير Word
  - send-telegram: إرسال تليجرام (HITL - يحتاج موافقة)
  - publish-room: نشر في غرفة (HITL - يحتاج موافقة)
  
  للعمليات المتسلسلة استخدم mode=pipeline مع قائمة steps.',
  'webhook',
  '/api/internal/run-function',
  '{
    "mode": {"type": "string", "enum": ["single", "pipeline", "list"]},
    "nodeId": {"type": "string", "description": "معرّف الـ Function للـ single mode"},
    "params": {"type": "object", "description": "معاملات الـ Function"},
    "steps": {"type": "array", "description": "خطوات الـ Pipeline"}
  }',
  true
);
```

---

## 11. قاعدة البيانات

```sql
-- جدول حفظ الـ Pipelines المحفوظة
CREATE TABLE function_pipelines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  steps         JSONB NOT NULL,     -- قائمة الخطوات
  is_active     BOOLEAN DEFAULT true,
  created_by    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- جدول سجل تنفيذ الـ Functions
CREATE TABLE function_execution_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id         TEXT NOT NULL,
  pipeline_id     UUID REFERENCES function_pipelines(id),
  triggered_by    TEXT,             -- 'agent' | 'manual' | 'cron'
  status          TEXT NOT NULL CHECK (status IN ('success', 'error')),
  params          JSONB DEFAULT '{}',
  result_summary  TEXT,
  error_message   TEXT,
  duration_ms     INTEGER,
  file_url        TEXT,             -- إذا أُنتج ملف
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fn_logs_node ON function_execution_logs(node_id);
CREATE INDEX idx_fn_logs_date ON function_execution_logs(created_at);
```

---

## 12. كيفية إضافة Function جديدة

### مثال: إضافة Function لتوليد صورة Chart

**الخطوة 1:** تثبيت المكتبة
```bash
npm install chartjs-node-canvas chart.js
```

**الخطوة 2:** كتابة الـ Handler
```typescript
// src/domains/zoon-os/functions/handlers/chart-handlers.ts
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import { HandlerResult } from './financial-handlers'

export async function generateChartHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  const { data, chartType = 'bar', title } = params

  const canvas = new ChartJSNodeCanvas({ width: 800, height: 400 })

  const buffer = await canvas.renderToBuffer({
    type: chartType as any,
    data: data as any,
    options: {
      plugins: { title: { display: true, text: String(title ?? '') } }
    }
  })

  const { uploadToStorage } = await import('../exporters/pdf-exporter')
  const fileName = `chart-${Date.now()}.png`
  const fileUrl = await uploadToStorage(buffer, fileName, 'image/png')

  return {
    success: true,
    data: { fileUrl, fileName },
    summary: `📊 تم إنشاء رسم بياني: ${fileName}`
  }
}
```

**الخطوة 3:** تسجيله في Registry
```typescript
// في src/domains/zoon-os/functions/registry/index.ts أضف:
'generate-chart': {
  id: 'generate-chart',
  label: 'رسم بياني',
  description: 'يولد رسماً بيانياً من البيانات',
  category: 'export',
  icon: '📊',
  params: [
    { key: 'data', label: 'البيانات', type: 'object', required: true },
    {
      key: 'chartType',
      label: 'نوع الرسم',
      type: 'select',
      required: false,
      options: ['bar', 'line', 'pie', 'doughnut'],
      default: 'bar'
    },
    { key: 'title', label: 'العنوان', type: 'text', required: false }
  ],
  outputs: [
    { key: 'fileUrl', type: 'string', description: 'رابط الصورة' }
  ],
  handler: 'generateChartHandler'
}
```

**الخطوة 4:** إضافة الـ handler في HANDLER_MAP
```typescript
// في pipeline-engine.ts
import * as chartHandlers from '../handlers/chart-handlers'

const HANDLER_MAP = {
  // ... الموجود
  generateChartHandler: chartHandlers.generateChartHandler,
}
```

**النتيجة:** المدير يرى الـ Function فوراً في الواجهة — لا تعديل آخر مطلوب.

---

## 13. السيناريوهات الكاملة

### السيناريو 1: تقرير مالي كامل
```json
{
  "mode": "pipeline",
  "steps": [
    {
      "nodeId": "calc-profits",
      "params": {
        "startDate": "2026-03-01",
        "endDate": "2026-03-31"
      }
    },
    {
      "nodeId": "export-pdf",
      "params": {
        "data": "{{prev.data}}",
        "template": "financial",
        "title": "تقرير مارس 2026"
      }
    },
    {
      "nodeId": "send-telegram",
      "params": {
        "message": "تقرير مارس المالي جاهز ✅",
        "fileUrl": "{{prev.data.fileUrl}}"
      }
    }
  ]
}
```

### السيناريو 2: بحث وتلخيص ونشر
```json
{
  "mode": "pipeline",
  "steps": [
    {
      "nodeId": "web-search",
      "params": { "query": "أسعار الوقود مصر اليوم", "limit": 3 }
    },
    {
      "nodeId": "web-fetch",
      "params": { "url": "{{prev.topUrl}}", "extractText": true }
    },
    {
      "nodeId": "summarize-text",
      "params": {
        "text": "{{prev.content}}",
        "language": "arabic",
        "maxPoints": 5
      }
    },
    {
      "nodeId": "publish-room",
      "params": {
        "roomId": "admin-room",
        "content": "{{prev.summary}}",
        "title": "أخبار الوقود اليوم"
      }
    }
  ]
}
```

### السيناريو 3: تقرير المناديب + Excel
```json
{
  "mode": "pipeline",
  "steps": [
    {
      "nodeId": "delivery-performance",
      "params": {
        "startDate": "2026-03-01",
        "endDate": "2026-03-31"
      }
    },
    {
      "nodeId": "export-xlsx",
      "params": {
        "data": "{{prev.data}}",
        "sheetName": "أداء مارس"
      }
    },
    {
      "nodeId": "send-telegram",
      "params": {
        "message": "تقرير أداء المناديب - مارس 📊",
        "fileUrl": "{{prev.data.fileUrl}}"
      }
    }
  ]
}
```

---

## 14. معايير الجودة والاختبار

### اختبار Handler منفرد
```typescript
// tests/functions/financial-handlers.test.ts
import { calcProfitsHandler } from '@/domains/zoon-os/functions/handlers/financial-handlers'

describe('calcProfitsHandler', () => {
  it('يحسب الأرباح بشكل صحيح', async () => {
    const result = await calcProfitsHandler({
      startDate: '2026-03-01',
      endDate: '2026-03-31'
    })
    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty('revenue')
    expect(result.data).toHaveProperty('profit')
    expect(result.summary).toContain('ج.م')
  })

  it('يفشل بأسلوب مهذب عند خطأ في DB', async () => {
    const result = await calcProfitsHandler({
      startDate: 'invalid-date',
      endDate: '2026-03-31'
    })
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})
```

### اختبار Pipeline
```typescript
// tests/functions/pipeline-engine.test.ts
import { runPipeline } from '@/domains/zoon-os/functions/pipeline/pipeline-engine'

describe('runPipeline', () => {
  it('ينفذ خطوتين بالتسلسل', async () => {
    const result = await runPipeline([
      { nodeId: 'calc-profits', params: { startDate: '2026-03-01', endDate: '2026-03-31' } },
      { nodeId: 'export-pdf', params: { data: '{{prev.data}}', template: 'financial' } }
    ])
    expect(result.success).toBe(true)
    expect(result.steps).toHaveLength(2)
    expect(result.steps[0].success).toBe(true)
  })
})
```

### Checklist قبل إضافة Function جديدة
- [ ] تثبيت المكتبة في `package.json`
- [ ] كتابة Handler يعيد `HandlerResult` دائماً (حتى عند الفشل)
- [ ] تسجيل الـ node في `FUNCTION_NODES` مع label عربي
- [ ] إضافة الـ handler في `HANDLER_MAP` في `pipeline-engine.ts`
- [ ] كتابة اختبار وحدة للـ handler
- [ ] اختبار كـ pipeline مع خطوتين على الأقل
- [ ] التأكد أن الأخطاء تُسجل في `function_execution_logs`

---

## 📌 القواعد الذهبية للمطورين

> **القاعدة 1:** كل Handler يجب أن يعيد `HandlerResult` — لا `throw` مباشرة للمستخدم.

> **القاعدة 2:** كل Function لها `summary` نصي — الوكيل يستخدمه لإخبار المدير بالنتيجة.

> **القاعدة 3:** Functions نوع `isHITL: true` تنتظر موافقة المدير قبل التنفيذ.

> **القاعدة 4:** استخدم `{{prev.fieldName}}` لتمرير البيانات بين خطوات الـ Pipeline.

> **القاعدة 5:** كل Function جديدة = 4 خطوات فقط (install + handler + registry + handler_map).

> **القاعدة 6:** كل مهارة (Skill Module) تحتوي على Functions مترابطة — لا تضع Functions من مجالات مختلفة تحت نفس المهارة.

---

## 15. Skill Modules — المهارات كـ Modules متكاملة

### 15.1 الفكرة والتطور المعماري

النظام في **v1.0** يعامل كل Function كوحدة مستقلة. التطور في **v2.0** هو تجميع Functions المترابطة تحت **مهارة واحدة (Skill Module)**، تماماً كما تفعل منصات الأتمتة الكبرى:

```
Zapier:   Google Drive (App)  ← يحتوي على Actions منفصلة
Make.com: Gmail (Module)      ← يحتوي على Operations
Skywork:  Drive Skill         ← يحتوي على Sub-functions

Zoon v2:  orderManagement     ← يحتوي على Functions مترابطة
```

### 15.2 الفرق بين المستويين

```
┌─────────────────────────────────────────────────────┐
│                  v1.0 — Tool منفرد                  │
│                                                     │
│  checkorder ──────────────► webhook واحد            │
│  updateOrder ─────────────► webhook آخر             │
│  calcOrderCost ───────────► webhook ثالث            │
│                                                     │
│  المشكلة: الوكيل لا يعرف العلاقة بينها             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               v2.0 — Skill Module                   │
│                                                     │
│  orderManagement (Skill)                            │
│  ├── getOrderDetails()    ← internal                │
│  ├── updateOrderStatus()  ← hitl                    │
│  └── calcOrderCost()      ← internal                │
│                                                     │
│  الفائدة: الوكيل يفهم أنها كلها تخص "الطلبات"     │
│  ويختار الـ Function المناسبة بدقة أعلى            │
└─────────────────────────────────────────────────────┘
```

### 15.3 تعديل قاعدة البيانات

```sql
-- ===== الجدول الأساسي: Skill Modules =====
CREATE TABLE ai_skill_modules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,     -- 'orderManagement'
  label         TEXT NOT NULL,            -- 'إدارة الطلبات'
  description   TEXT NOT NULL,            -- وصف للوكيل يفهم متى يستخدمها
  icon          TEXT DEFAULT '🔧',
  category      TEXT NOT NULL,            -- 'delivery' | 'financial' | 'content' ...
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ===== Functions تحت كل Module =====
CREATE TABLE ai_skill_functions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_module_id UUID NOT NULL REFERENCES ai_skill_modules(id) ON DELETE CASCADE,
  function_name   TEXT NOT NULL,          -- 'getOrderDetails'
  label           TEXT NOT NULL,          -- 'جلب تفاصيل الطلب'
  description     TEXT NOT NULL,          -- وصف للوكيل
  type            TEXT NOT NULL CHECK (type IN ('internal', 'webhook', 'hitl')),
  endpoint        TEXT,                   -- /api/internal/orders/details
  input_schema    JSONB DEFAULT '{}',     -- معاملات الـ Function
  output_schema   JSONB DEFAULT '{}',     -- شكل النتيجة المتوقعة
  is_active       BOOLEAN DEFAULT true,
  sort_order      INTEGER DEFAULT 0,      -- ترتيب العرض في الواجهة
  created_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE(skill_module_id, function_name)
);

-- ===== فهارس للأداء =====
CREATE INDEX idx_skill_functions_module ON ai_skill_functions(skill_module_id);
CREATE INDEX idx_skill_functions_active ON ai_skill_functions(is_active);
```

### 15.4 أمثلة Skill Modules جاهزة

#### Module 1: إدارة الطلبات
```sql
-- الـ Module
INSERT INTO ai_skill_modules (name, label, description, icon, category)
VALUES (
  'orderManagement',
  'إدارة الطلبات',
  'كل العمليات المتعلقة بالطلبات: استعلام، تحديث، حساب، إلغاء.',
  '📦',
  'delivery'
);

-- Functions تحته
INSERT INTO ai_skill_functions (skill_module_id, function_name, label, description, type, endpoint, input_schema)
VALUES
(
  -- getOrderDetails
  '<module_id>',
  'getOrderDetails',
  'جلب تفاصيل طلب',
  'يجلب كل تفاصيل طلب محدد بالرقم المرجعي.',
  'internal',
  '/api/internal/orders/details',
  '{"orderId": {"type": "string", "required": true}}'
),
(
  -- updateOrderStatus
  '<module_id>',
  'updateOrderStatus',
  'تحديث حالة طلب',
  'يغير حالة الطلب — يحتاج موافقة المدير (HITL).',
  'hitl',
  '/api/internal/orders/update-status',
  '{"orderId": {"type": "string"}, "status": {"type": "string", "enum": ["pending","in_progress","completed","cancelled"]}}'
),
(
  -- calcOrderCost
  '<module_id>',
  'calcOrderCost',
  'حساب تكلفة الطلب',
  'يحسب التكلفة الإجمالية مع رسوم التوصيل والضريبة.',
  'internal',
  '/api/internal/orders/calc-cost',
  '{"orderId": {"type": "string"}}'
);
```

#### Module 2: إدارة المحتوى
```sql
INSERT INTO ai_skill_modules (name, label, description, icon, category)
VALUES (
  'contentManagement',
  'إدارة المحتوى',
  'إنشاء ونشر المحتوى على منصات التواصل والغرف الداخلية.',
  '✍️',
  'content'
);

INSERT INTO ai_skill_functions (skill_module_id, function_name, label, description, type, endpoint, input_schema)
VALUES
(
  '<module_id>', 'draftPost', 'صياغة منشور',
  'يصيغ محتوى جاهز للنشر بأسلوب احترافي.',
  'internal', '/api/internal/content/draft',
  '{"topic": {"type": "string"}, "platform": {"type": "string", "enum": ["facebook","instagram","twitter","internal"]}, "tone": {"type": "string"}}'
),
(
  '<module_id>', 'publishPost', 'نشر منشور',
  'ينشر المحتوى على المنصة المحددة — يحتاج موافقة.',
  'hitl', '/api/internal/content/publish',
  '{"content": {"type": "string"}, "platform": {"type": "string"}, "scheduleAt": {"type": "string"}}'
),
(
  '<module_id>', 'generateHashtags', 'توليد هاشتاقات',
  'يقترح هاشتاقات مناسبة للمحتوى.',
  'internal', '/api/internal/content/hashtags',
  '{"content": {"type": "string"}, "count": {"type": "number"}}'
);
```

#### Module 3: التقارير المالية
```sql
INSERT INTO ai_skill_modules (name, label, description, icon, category)
VALUES (
  'financialReports',
  'التقارير المالية',
  'حساب وتصدير التقارير المالية: أرباح، عمولات، مناطق.',
  '💰',
  'financial'
);

INSERT INTO ai_skill_functions (skill_module_id, function_name, label, description, type, endpoint, input_schema)
VALUES
(
  '<module_id>', 'calcProfits', 'حساب الأرباح',
  'يحسب الإيرادات والتكاليف وصافي الأرباح لفترة محددة.',
  'internal', '/api/internal/run-function',
  '{"nodeId": "calc-profits", "params": {"startDate": {"type": "date"}, "endDate": {"type": "date"}}}'
),
(
  '<module_id>', 'calcCommissions', 'حساب العمولات',
  'يحسب عمولات المناديب.',
  'internal', '/api/internal/run-function',
  '{"nodeId": "calc-driver-commission", "params": {"startDate": {"type": "date"}, "endDate": {"type": "date"}}}'
),
(
  '<module_id>', 'exportReport', 'تصدير تقرير',
  'يصدّر أي تقرير بصيغة PDF أو DOCX أو Excel.',
  'internal', '/api/internal/run-function',
  '{"nodeId": {"type": "string", "enum": ["export-pdf","export-docx","export-xlsx"]}, "params": {"type": "object"}}'
);
```

### 15.5 تغيير في كيفية تحميل المهارات للوكيل

```typescript
// src/domains/zoon-os/skills/load-skill-modules.ts

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

/**
 * يجلب كل Skill Modules مع Functions تحتها
 * ويبنيها كـ tools جاهزة للوكيل
 */
export async function loadSkillModulesAsTools() {
  // جلب الـ Modules النشطة مع Functions تحتها
  const { data: modules } = await supabase
    .from('ai_skill_modules')
    .select(`
      id, name, label, description,
      ai_skill_functions (
        function_name, label, description,
        type, endpoint, input_schema, is_active
      )
    `)
    .eq('is_active', true)
    .order('category')

  if (!modules) return {}

  const tools: Record<string, unknown> = {}

  for (const module of modules) {
    const activeFunctions = (module.ai_skill_functions as any[])
      .filter(f => f.is_active)

    for (const fn of activeFunctions) {
      // اسم الـ tool: moduleName.functionName
      const toolName = `${module.name}__${fn.function_name}`

      tools[toolName] = {
        description: `[${module.label}] ${fn.description}`,
        parameters: buildZodSchema(fn.input_schema),
        execute: fn.type === 'hitl'
          ? undefined  // HITL لا تُنفذ تلقائياً
          : async (params: Record<string, unknown>) => {
              return callFunctionEndpoint(fn.endpoint, params)
            }
      }
    }
  }

  return tools
}

/**
 * بناء وصف نصي للـ System Prompt
 * الوكيل يقرأه ليفهم ما هو متاح
 */
export function buildModulesDescription(modules: any[]): string {
  return modules.map(module => {
    const fns = (module.ai_skill_functions as any[])
      .filter(f => f.is_active)
      .map(f => `    • ${module.name}__${f.function_name}: ${f.description}${f.type === 'hitl' ? ' ⚠️ يحتاج موافقة' : ''}`)
      .join('\n')

    return `**${module.label}** (${module.name})\n${fns}`
  }).join('\n\n')
}

async function callFunctionEndpoint(
  endpoint: string,
  params: Record<string, unknown>
): Promise<unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })
  return response.json()
}

function buildZodSchema(inputSchema: Record<string, unknown>) {
  // تحويل JSON Schema إلى Zod schema بسيط
  // في الإنتاج استخدم مكتبة مثل json-schema-to-zod
  const { z } = require('zod')
  const shape: Record<string, unknown> = {}

  for (const [key, def] of Object.entries(inputSchema as Record<string, any>)) {
    if (def.type === 'string') shape[key] = def.required ? z.string() : z.string().optional()
    else if (def.type === 'number') shape[key] = def.required ? z.number() : z.number().optional()
    else if (def.type === 'boolean') shape[key] = z.boolean().optional()
    else if (def.type === 'date') shape[key] = z.string().optional()
    else shape[key] = z.unknown().optional()
  }

  return z.object(shape)
}
```

### 15.6 كيف يرى الوكيل المهارات الجديدة

```
System Prompt (يُبنى تلقائياً من DB):

المهارات المتاحة:
─────────────────
**إدارة الطلبات** (orderManagement)
    • orderManagement__getOrderDetails: يجلب تفاصيل طلب
    • orderManagement__updateOrderStatus: يحدّث حالة الطلب ⚠️ يحتاج موافقة
    • orderManagement__calcOrderCost: يحسب تكلفة الطلب

**إدارة المحتوى** (contentManagement)
    • contentManagement__draftPost: يصيغ منشوراً جاهزاً
    • contentManagement__publishPost: ينشر على المنصة ⚠️ يحتاج موافقة
    • contentManagement__generateHashtags: يقترح هاشتاقات

**التقارير المالية** (financialReports)
    • financialReports__calcProfits: يحسب الأرباح والخسائر
    • financialReports__calcCommissions: يحسب عمولات المناديب
    • financialReports__exportReport: يصدّر تقريراً بصيغة PDF/DOCX/Excel
```

### 15.7 تعديل واجهة إضافة المهارة

عند إضافة مهارة جديدة من الواجهة، تصبح النموذج من مستوى واحد إلى مستويين:

```
المستوى 1 — تعريف الـ Module:
┌─────────────────────────────────────────┐
│  اسم المهارة (بالكود): orderManagement  │
│  الاسم العربي: إدارة الطلبات           │
│  الوصف: كل عمليات الطلبات...           │
│  الأيقونة: 📦                           │
│  الفئة: [delivery ▼]                   │
└─────────────────────────────────────────┘
         ↓ بعد الحفظ
المستوى 2 — إضافة Functions:
┌─────────────────────────────────────────┐
│  + إضافة Function                       │
│                                         │
│  ┌─ Function 1 ────────────────────┐    │
│  │ الاسم: getOrderDetails          │    │
│  │ الوصف: يجلب تفاصيل الطلب       │    │
│  │ النوع: [internal ▼]             │    │
│  │ الـ Endpoint: /api/orders/...   │    │
│  │ Input Schema: { orderId: str }  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─ Function 2 ────────────────────┐    │
│  │ الاسم: updateOrderStatus        │    │
│  │ النوع: [hitl ▼]                 │    │
│  │ ...                             │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 15.8 خارطة الطريق للتطبيق

```
الأسبوع 1 — قاعدة البيانات:
  ✅ إنشاء جدولي ai_skill_modules و ai_skill_functions
  ✅ نقل المهارات الموجودة (checkorder, createContent...) إلى النظام الجديد
  ✅ كتابة migration script للبيانات القديمة

الأسبوع 2 — Backend:
  ✅ كتابة loadSkillModulesAsTools()
  ✅ تعديل route.ts لاستخدام Modules بدلاً من Skills المنفردة
  ✅ تحديث System Prompt ليعرض المهارات بشكل هرمي

الأسبوع 3 — Frontend:
  ✅ تعديل واجهة إضافة المهارة لتدعم المستويين
  ✅ عرض Functions تحت كل Module في صفحة Registry
  ✅ إضافة زر "إضافة Function" داخل كل Module

الأسبوع 4 — اختبار:
  ✅ التحقق أن الوكيل يختار الـ Function الصحيحة
  ✅ اختبار HITL مع Functions داخل Module
  ✅ اختبار Pipeline يعبر عدة Modules
```

### 15.9 Migration — نقل البيانات القديمة

```typescript
// scripts/migrate-skills-to-modules.ts
// شغّله مرة واحدة لنقل المهارات الموجودة للنظام الجديد

import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

async function migrate() {
  // جلب المهارات القديمة
  const oldSkills = await (prisma as any).ai_skills.findMany({ where: { is_active: true } })

  for (const skill of oldSkills) {
    // إنشاء Module
    const { data: module } = await supabase
      .from('ai_skill_modules')
      .insert({
        name: skill.name,
        label: skill.name,         // تحديثه لاحقاً بالعربي
        description: skill.description,
        category: 'general'        // تحديثه لاحقاً
      })
      .select()
      .single()

    if (!module) continue

    // إنشاء Function واحدة تحته (تمثل الـ Skill القديمة)
    await supabase.from('ai_skill_functions').insert({
      skill_module_id: module.id,
      function_name: 'execute',   // اسم افتراضي
      label: `تنفيذ ${skill.name}`,
      description: skill.description,
      type: skill.type,
      endpoint: skill.webhook_url,
      input_schema: skill.input_schema ?? {}
    })

    console.log(`✅ تم نقل: ${skill.name}`)
  }

  console.log('🎉 اكتملت عملية النقل')
}

migrate().catch(console.error)
```

---

## 📌 القواعد الذهبية للمطورين (محدّثة)

> **القاعدة 1:** كل Handler يجب أن يعيد `HandlerResult` — لا `throw` مباشرة للمستخدم.

> **القاعدة 2:** كل Function لها `summary` نصي — الوكيل يستخدمه لإخبار المدير بالنتيجة.

> **القاعدة 3:** Functions نوع `isHITL: true` تنتظر موافقة المدير قبل التنفيذ.

> **القاعدة 4:** استخدم `{{prev.fieldName}}` لتمرير البيانات بين خطوات الـ Pipeline.

> **القاعدة 5:** كل Function جديدة = 4 خطوات فقط (install + handler + registry + handler_map).

> **القاعدة 6:** كل Skill Module يجتمع Functions من **نفس المجال** فقط — لا تخلط الطلبات مع المحتوى.

> **القاعدة 7:** اسم الـ tool للوكيل = `moduleName__functionName` — الشرطتان `__` تفصلان الـ Module عن الـ Function.

---

---

## 16. Production Roadmap — خارطة طريق الإنتاج

> هذا القسم يوثّق التطورات المخططة للنظام بترتيب الأولوية الحقيقية. النظام في حالته الحالية **قابل للتشغيل**، وهذه التحسينات تنقله من مستوى Beta إلى مستوى Production كامل.

---

### 🔴 المرحلة الأولى — قبل أي مستخدم حقيقي

#### 1.1 Retry Logic — إعادة المحاولة عند الفشل

**المشكلة:**
Pipeline الحالي يتوقف عند أول فشل دون محاولة ثانية، وهذا غير مقبول في بيئة الإنتاج حيث قد يكون الفشل مؤقتاً (انقطاع شبكة، timeout عابر).

**الحل:**
```typescript
// تعديل في pipeline-engine.ts

export interface PipelineStep {
  nodeId: string
  params: Record<string, unknown>
  inputFrom?: number
  retryOnFailure?: number        // ← جديد: عدد المحاولات (افتراضي: 0)
  retryDelayMs?: number          // ← جديد: انتظار بين المحاولات (افتراضي: 1000ms)
}

// داخل runPipeline — بعد الاستدعاء الأول:
let result = await handler(resolvedParams)

if (!result.success && step.retryOnFailure && step.retryOnFailure > 0) {
  console.log(`[Pipeline] ⟳ إعادة محاولة ${step.nodeId}...`)
  
  for (let attempt = 1; attempt <= step.retryOnFailure; attempt++) {
    // انتظار قبل إعادة المحاولة
    await new Promise(r => setTimeout(r, step.retryDelayMs ?? 1000))
    
    result = await handler(resolvedParams)
    
    if (result.success) {
      console.log(`[Pipeline] ✅ نجحت المحاولة ${attempt} لـ ${step.nodeId}`)
      break
    }
    
    console.warn(`[Pipeline] ❌ فشلت المحاولة ${attempt}/${step.retryOnFailure} لـ ${step.nodeId}`)
  }
}
```

**مثال استخدام:**
```json
{
  "nodeId": "send-telegram",
  "retryOnFailure": 3,
  "retryDelayMs": 2000,
  "params": { "message": "تقرير مارس جاهز" }
}
```

#### 1.2 RBAC بسيط — نظام الصلاحيات الأساسي

**المشكلة:**
حالياً أي مستخدم يستطيع تشغيل أي Function بما فيها العمليات الحساسة كحساب الأرباح أو تحديث حالة الطلبات.

**Schema قاعدة البيانات:**
```sql
-- جدول صلاحيات الـ Functions
CREATE TABLE ai_skill_permissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_module_id UUID REFERENCES ai_skill_modules(id) ON DELETE CASCADE,
  function_name   TEXT,                    -- NULL = تطبق على كل الـ Module
  role            TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'viewer')),
  can_execute     BOOLEAN DEFAULT false,
  can_approve     BOOLEAN DEFAULT false,   -- للـ HITL Functions فقط
  created_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE(skill_module_id, function_name, role)
);

-- بيانات افتراضية
INSERT INTO ai_skill_permissions (skill_module_id, function_name, role, can_execute, can_approve)
VALUES
  -- admin يملك كل شيء
  ('<financialReports_id>', NULL, 'admin', true, true),
  ('<orderManagement_id>', NULL, 'admin', true, true),
  ('<contentManagement_id>', NULL, 'admin', true, true),

  -- manager يستطيع التنفيذ لكن لا يرى الأرباح
  ('<orderManagement_id>', 'getOrderDetails', 'manager', true, false),
  ('<orderManagement_id>', 'updateOrderStatus', 'manager', false, true),
  ('<contentManagement_id>', NULL, 'manager', true, true),

  -- viewer يقرأ فقط
  ('<orderManagement_id>', 'getOrderDetails', 'viewer', true, false);
```

**التحقق في Pipeline:**
```typescript
// إضافة في pipeline-engine.ts
async function checkPermission(
  userId: string,
  moduleId: string,
  functionName: string
): Promise<boolean> {
  const userRole = await getUserRole(userId)  // من JWT أو Session

  const { data } = await supabase
    .from('ai_skill_permissions')
    .select('can_execute')
    .eq('skill_module_id', moduleId)
    .or(`function_name.eq.${functionName},function_name.is.null`)
    .eq('role', userRole)
    .eq('can_execute', true)
    .limit(1)
    .single()

  return !!data
}

// داخل runPipeline — قبل تشغيل كل خطوة:
const hasPermission = await checkPermission(userId, node.moduleId, node.handler)
if (!hasPermission) {
  results.push({
    nodeId: step.nodeId,
    success: false,
    error: `ليس لديك صلاحية تشغيل: ${node.label}`,
    durationMs: 0
  })
  break
}
```

---

### 🟠 المرحلة الثانية — قبل Beta (الشهر الأول)

#### 2.1 Rollback Strategy — التراجع عند الفشل الكامل

**المشكلة:**
إذا نجحت خطوة رفع ملف لـ Storage ثم فشل الإرسال، الملف يبقى في Storage لكن المهمة فشلت — حالة غير متسقة.

**الحل:**
```typescript
export interface PipelineStep {
  nodeId: string
  params: Record<string, unknown>
  retryOnFailure?: number
  rollbackHandler?: string       // ← جديد: اسم دالة التراجع
}

// خريطة Rollback Handlers
const ROLLBACK_HANDLERS: Record<string, (data: unknown) => Promise<void>> = {
  'deleteUploadedFile': async (data: any) => {
    if (data?.fileName) {
      await supabase.storage.from('zoon-reports').remove([`reports/${data.fileName}`])
      console.log(`[Rollback] 🗑️ تم حذف الملف: ${data.fileName}`)
    }
  },
  'cancelTelegramMessage': async (data: any) => {
    // إلغاء رسالة تليجرام إذا أمكن
    if (data?.messageId) {
      await telegraf.telegram.deleteMessage(data.chatId, data.messageId)
    }
  }
}

// في runPipeline — عند الفشل النهائي:
async function executeRollback(
  completedSteps: PipelineResult['steps'],
  originalSteps: PipelineStep[]
): Promise<void> {
  console.log('[Pipeline] ↩️ جاري التراجع عن الخطوات المنجزة...')

  // التراجع بترتيب عكسي
  for (let i = completedSteps.length - 1; i >= 0; i--) {
    const step = originalSteps[i]
    const stepResult = completedSteps[i]

    if (step.rollbackHandler && stepResult.success && stepResult.data) {
      const rollbackFn = ROLLBACK_HANDLERS[step.rollbackHandler]
      if (rollbackFn) {
        await rollbackFn(stepResult.data)
        console.log(`[Rollback] ✅ تم التراجع عن: ${step.nodeId}`)
      }
    }
  }
}
```

**مثال Pipeline مع Rollback:**
```json
{
  "mode": "pipeline",
  "steps": [
    {
      "nodeId": "calc-profits",
      "params": { "startDate": "2026-03-01", "endDate": "2026-03-31" }
    },
    {
      "nodeId": "export-pdf",
      "params": { "data": "{{prev.data}}", "template": "financial" },
      "rollbackHandler": "deleteUploadedFile",
      "retryOnFailure": 2
    },
    {
      "nodeId": "send-telegram",
      "params": { "message": "التقرير جاهز", "fileUrl": "{{prev.data.fileUrl}}" },
      "retryOnFailure": 3,
      "retryDelayMs": 2000
    }
  ]
}
```

#### 2.2 Integration Tests — اختبارات التكامل

**المشكلة:**
الاختبارات الحالية تختبر كل Handler منفرداً. لا يوجد اختبار للـ Pipeline الكاملة من البداية للنهاية.

```typescript
// tests/integration/pipelines.test.ts

describe('Pipeline: التقرير المالي الكامل', () => {

  it('ينفذ Pipeline من 3 خطوات بنجاح', async () => {
    const result = await runPipeline([
      {
        nodeId: 'calc-profits',
        params: { startDate: '2026-03-01', endDate: '2026-03-31' }
      },
      {
        nodeId: 'export-pdf',
        params: { data: '{{prev.data}}', template: 'financial' }
      },
      {
        nodeId: 'send-telegram',
        params: { message: 'تقرير مارس ✅', fileUrl: '{{prev.data.fileUrl}}' }
      }
    ])

    expect(result.success).toBe(true)
    expect(result.steps).toHaveLength(3)
    expect(result.steps.every(s => s.success)).toBe(true)
    expect(result.totalDurationMs).toBeLessThan(30000)
  })

  it('يتوقف عند فشل خطوة ويُشغّل Rollback', async () => {
    // محاكاة فشل التليجرام
    jest.spyOn(messagingHandlers, 'sendTelegramHandler')
      .mockResolvedValue({ success: false, error: 'Telegram API timeout' })

    const result = await runPipeline([
      { nodeId: 'calc-profits', params: { startDate: '2026-03-01', endDate: '2026-03-31' } },
      { nodeId: 'export-pdf', params: { data: '{{prev.data}}', template: 'financial' }, rollbackHandler: 'deleteUploadedFile' },
      { nodeId: 'send-telegram', params: { message: 'تقرير', fileUrl: '{{prev.data.fileUrl}}' }, retryOnFailure: 2 }
    ])

    expect(result.success).toBe(false)
    expect(result.steps[2].error).toContain('Telegram API timeout')
    // التحقق أن الـ Rollback حذف الملف
    const fileExists = await checkFileInStorage(result.steps[1].data?.fileName)
    expect(fileExists).toBe(false)
  })

  it('ينجح بعد Retry في الخطوة الثانية', async () => {
    let callCount = 0
    jest.spyOn(exportHandlers, 'exportPDFHandler').mockImplementation(async () => {
      callCount++
      if (callCount < 3) return { success: false, error: 'Storage timeout' }
      return { success: true, data: { fileUrl: 'https://...' }, summary: 'تم' }
    })

    const result = await runPipeline([
      { nodeId: 'calc-profits', params: { startDate: '2026-03-01', endDate: '2026-03-31' } },
      { nodeId: 'export-pdf', params: { data: '{{prev.data}}', template: 'financial' }, retryOnFailure: 3 }
    ])

    expect(result.success).toBe(true)
    expect(callCount).toBe(3)  // فشل مرتين ونجح في الثالثة
  })
})

describe('Pipeline: Rate Limiting', () => {
  it('يرفض التنفيذ عند تجاوز الحد', async () => {
    // تشغيل 101 مرة
    for (let i = 0; i < 100; i++) {
      await runPipeline([{ nodeId: 'calc-profits', params: { startDate: '2026-03-01', endDate: '2026-03-31' } }])
    }

    const result = await runPipeline([
      { nodeId: 'calc-profits', params: { startDate: '2026-03-01', endDate: '2026-03-31' } }
    ])

    expect(result.success).toBe(false)
    expect(result.steps[0].error).toContain('تجاوزت الحد المسموح')
  })
})
```

#### 2.3 Rate Limiting — الحماية من الإساءة

```sql
-- جدول Rate Limiting
CREATE TABLE function_rate_limits (
  user_id         TEXT NOT NULL,
  function_id     UUID REFERENCES ai_skill_functions(id),
  executions      INTEGER DEFAULT 0,
  window_start    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, function_id)
);
```

```typescript
// src/domains/zoon-os/functions/rate-limiter.ts

const RATE_LIMITS: Record<string, number> = {
  'calc-profits':      20,   // 20 مرة في الساعة
  'export-pdf':        10,   // 10 مرات في الساعة
  'send-telegram':     50,   // 50 مرة في الساعة
  'web-search':        30,   // 30 مرة في الساعة
  'default':           100   // افتراضي
}

export async function checkRateLimit(
  userId: string,
  nodeId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = RATE_LIMITS[nodeId] ?? RATE_LIMITS.default
  const windowMs = 60 * 60 * 1000  // ساعة واحدة

  const { data } = await supabase
    .from('function_rate_limits')
    .select('executions, window_start')
    .eq('user_id', userId)
    .eq('function_id', nodeId)
    .single()

  const now = Date.now()
  const windowStart = data ? new Date(data.window_start).getTime() : now
  const isNewWindow = (now - windowStart) > windowMs

  const executions = isNewWindow ? 0 : (data?.executions ?? 0)
  const allowed = executions < limit

  if (allowed) {
    await supabase.from('function_rate_limits').upsert({
      user_id: userId,
      function_id: nodeId,
      executions: isNewWindow ? 1 : executions + 1,
      window_start: isNewWindow ? new Date().toISOString() : data?.window_start
    })
  }

  return { allowed, remaining: Math.max(0, limit - executions - 1) }
}
```

---

### 🟡 المرحلة الثالثة — بعد Beta (الشهر 2-3)

#### 3.1 Monitoring Dashboard — لوحة المراقبة

**الـ API:**
```typescript
// app/api/internal/function-metrics/route.ts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? '7d'
  const since = getDateFromPeriod(period)

  const logs = await (prisma as any).function_execution_logs.groupBy({
    by: ['node_id', 'status'],
    _count: { id: true },
    _avg: { duration_ms: true },
    where: { created_at: { gte: since } }
  })

  const totalExecutions = logs.reduce((s: number, l: any) => s + l._count.id, 0)
  const successCount = logs.filter((l: any) => l.status === 'success').reduce((s: number, l: any) => s + l._count.id, 0)

  // أكثر Functions استخداماً
  const byFunction = new Map<string, { total: number; success: number; avgMs: number }>()
  for (const log of logs) {
    const existing = byFunction.get(log.node_id) ?? { total: 0, success: 0, avgMs: 0 }
    existing.total += log._count.id
    if (log.status === 'success') existing.success += log._count.id
    existing.avgMs = log._avg.duration_ms ?? 0
    byFunction.set(log.node_id, existing)
  }

  const topFunctions = Array.from(byFunction.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(([id, stats]) => ({
      nodeId: id,
      executions: stats.total,
      successRate: ((stats.success / stats.total) * 100).toFixed(1) + '%',
      avgDurationMs: Math.round(stats.avgMs)
    }))

  const problemFunctions = Array.from(byFunction.entries())
    .filter(([, stats]) => (stats.success / stats.total) < 0.8)
    .map(([id, stats]) => ({
      nodeId: id,
      failureRate: (((stats.total - stats.success) / stats.total) * 100).toFixed(1) + '%',
      failures: stats.total - stats.success
    }))

  return NextResponse.json({
    period,
    totalExecutions,
    successRate: totalExecutions > 0
      ? ((successCount / totalExecutions) * 100).toFixed(1) + '%'
      : '0%',
    topFunctions,
    problemFunctions
  })
}

function getDateFromPeriod(period: string): Date {
  const now = new Date()
  const days = parseInt(period.replace('d', '')) || 7
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}
```

**شكل Dashboard في الواجهة:**
```
┌─────────────────────────────────────────────────┐
│  📊 Function Analytics (آخر 7 أيام)            │
├──────────┬──────────┬──────────┬────────────────┤
│  1,234   │  94.2%   │  1.8 ث  │   12 تنبيه    │
│  تنفيذ   │  نجاح   │  متوسط  │               │
├─────────────────────────────────────────────────┤
│  🏆 الأكثر استخداماً:                          │
│  1. calc-profits    342 تنفيذ  97.1% نجاح      │
│  2. export-pdf      289 تنفيذ  95.5% نجاح      │
│  3. web-search      156 تنفيذ  91.0% نجاح      │
├─────────────────────────────────────────────────┤
│  ⚠️ تحتاج انتباه:                              │
│  • send-telegram   فشل 12 مرة (80% نجاح)       │
│  • web-fetch       بطيء: 8.3 ثانية متوسط       │
└─────────────────────────────────────────────────┘
```

#### 3.2 Alerting — التنبيهات التلقائية

```typescript
// src/domains/zoon-os/functions/alerting.ts

export async function checkAndAlert(nodeId: string, result: HandlerResult) {
  if (result.success) return

  // عدّ الفشل المتكرر في آخر ساعة
  const recentFailures = await (prisma as any).function_execution_logs.count({
    where: {
      node_id: nodeId,
      status: 'error',
      created_at: { gte: new Date(Date.now() - 3600000) }
    }
  })

  // تنبيه إذا فشلت أكثر من 5 مرات في الساعة
  if (recentFailures >= 5) {
    await sendAdminAlert({
      type: 'function_repeated_failure',
      nodeId,
      failureCount: recentFailures,
      lastError: result.error,
      message: `⚠️ تنبيه: ${nodeId} فشلت ${recentFailures} مرة في الساعة الأخيرة`
    })
  }
}

async function sendAdminAlert(alert: Record<string, unknown>) {
  // إرسال للـ admin عبر تليجرام أو داخل النظام
  const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID
  if (adminChatId) {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: adminChatId, text: alert.message })
    })
  }
}
```

---

### 🟢 المرحلة الرابعة — v3.0 المستقبل

#### 4.1 Conditional Pipelines — المنطق الشرطي

**متى تحتاجه:**
عندما يريد المدير أن يفعل النظام شيئاً مختلفاً بناءً على نتيجة خطوة سابقة.

**مثال:**
```
احسب الأرباح:
  إذا الربح > 10,000 → أرسل تقرير "ممتاز" باللون الأخضر
  إذا الربح < 0     → أرسل تنبيه "خسارة!" باللون الأحمر
  وإلا              → أرسل تقرير عادي
```

**التصميم:**
```typescript
export interface PipelineStep {
  nodeId: string
  params: Record<string, unknown>
  retryOnFailure?: number
  rollbackHandler?: string
  condition?: {
    field: string                         // 'prev.profit'
    operator: '>' | '<' | '==' | '!=' | '>=' | '<='
    value: unknown
  }
  onSuccess?: PipelineStep[]             // خطوات إذا نجحت ← branching
  onFailure?: PipelineStep[]             // خطوات إذا فشلت
}

// مثال pipeline شرطي:
const conditionalPipeline: PipelineStep[] = [
  {
    nodeId: 'calc-profits',
    params: { startDate: '2026-03-01', endDate: '2026-03-31' },
    onSuccess: [
      {
        nodeId: 'send-telegram',
        condition: { field: 'step_0.profit', operator: '>', value: 10000 },
        params: { message: '🎉 شهر ممتاز! الأرباح: {{step_0.profit}} ج.م' }
      },
      {
        nodeId: 'send-telegram',
        condition: { field: 'step_0.profit', operator: '<', value: 0 },
        params: { message: '⚠️ تنبيه خسارة! راجع التقرير فوراً.' }
      }
    ]
  }
]
```

**ملاحظة للفريق:** لا تبدأ بهذا قبل أن تكون الـ Pipelines الخطية مستقرة في الإنتاج لمدة شهر على الأقل.

---

### ملخص الأولويات

```
┌────┬──────────────────────────────┬──────────┬────────────┐
│ #  │ التحسين                      │ الأولوية │ الجهد      │
├────┼──────────────────────────────┼──────────┼────────────┤
│ 1  │ Retry Logic                  │ 🔴 حرج  │ يوم واحد  │
│ 2  │ RBAC بسيط                   │ 🔴 حرج  │ 3 أيام    │
│ 3  │ Rollback Strategy            │ 🟠 مهم  │ يومان     │
│ 4  │ Integration Tests            │ 🟠 مهم  │ 3 أيام    │
│ 5  │ Rate Limiting                │ 🟠 مهم  │ يوم واحد  │
│ 6  │ Monitoring Dashboard         │ 🟡 مفيد │ أسبوع     │
│ 7  │ Alerting                     │ 🟡 مفيد │ يومان     │
│ 8  │ Conditional Pipelines        │ 🟢 مستقبل│ أسبوعان  │
│ 9  │ Auto-Documentation           │ 🟢 مستقبل│ أسبوع    │
└────┴──────────────────────────────┴──────────┴────────────┘

إجمالي للوصول لـ Production: ~3 أسابيع عمل فعلي
```

---

---

## 17. File Management — إدارة الملفات كـ Skill Module

> **ملاحظة:** هذا الـ Module غير مطبَّق بعد في المشروع — هذا القسم دليل التطبيق الكامل للفريق.

### 17.1 الفكرة

الوكيل الذكي في معظم الأنظمة (بما فيها Claude نفسه) يملك القدرة على قراءة الملفات وكتابتها وتعديلها. في Zoon OS، هذه القدرة تُبنى كـ **Skill Module** عادي تماماً مثل باقي الـ Modules، لكن مع طبقة أمان إضافية لمنع الوصول لملفات النظام الحساسة.

```
بدون File Management:
الوكيل يولّد تقريراً نصياً → يختفي بعد الرد

مع File Management:
الوكيل يولّد تقريراً → يحفظه .md → يعدّله لاحقاً
→ يحوّله PDF → يرسله تليجرام
```

### 17.2 مبدأ الأمان — SAFE_BASE_DIR

```
⚠️ القاعدة الذهبية: الوكيل يكتب في مجلد واحد فقط

✅ مسموح:
   /docs/generated/report.md
   /docs/generated/2026/march-report.md

❌ ممنوع تماماً (Path Traversal):
   /etc/passwd
   /src/domains/...
   .env
   ../../sensitive-file.txt
```

### 17.3 هيكل الملفات الجديد

```
src/
└── domains/
    └── zoon-os/
        └── functions/
            ├── handlers/
            │   ├── financial-handlers.ts    ← موجود
            │   ├── search-handlers.ts       ← موجود
            │   ├── ai-handlers.ts           ← موجود
            │   └── file-handlers.ts         ← ✨ جديد
            └── registry/
                ├── index.ts                 ← يحتاج تحديث
                └── file-nodes.ts            ← ✨ جديد

docs/
└── generated/                              ← ✨ مجلد آمن جديد
    └── .gitkeep
```

### 17.4 تسجيل الـ Nodes — file-nodes.ts

**الملف:** `src/domains/zoon-os/functions/registry/file-nodes.ts`

```typescript
import { FunctionNode } from './index'

export const FILE_NODES: Record<string, FunctionNode> = {

  'file-read': {
    id: 'file-read',
    label: 'قراءة ملف',
    description: 'يقرأ محتوى ملف من مجلد التقارير المولّدة. يدعم .md و .txt و .json',
    category: 'files',
    icon: '📖',
    params: [
      {
        key: 'filePath',
        label: 'مسار الملف',
        type: 'text',
        required: true,
        description: 'مثال: report.md أو 2026/march.md'
      }
    ],
    outputs: [
      { key: 'content', type: 'string', description: 'محتوى الملف كاملاً' },
      { key: 'lines', type: 'number', description: 'عدد الأسطر' },
      { key: 'sizeKb', type: 'number', description: 'حجم الملف بالكيلوبايت' }
    ],
    handler: 'fileReadHandler'
  },

  'file-write': {
    id: 'file-write',
    label: 'كتابة ملف',
    description: 'ينشئ ملفاً جديداً أو يكتب فوق ملف موجود. يدعم .md و .txt و .json',
    category: 'files',
    icon: '✏️',
    params: [
      {
        key: 'filePath',
        label: 'مسار الملف',
        type: 'text',
        required: true,
        description: 'مثال: reports/march-2026.md'
      },
      {
        key: 'content',
        label: 'المحتوى',
        type: 'text',
        required: true
      },
      {
        key: 'mode',
        label: 'طريقة الكتابة',
        type: 'select',
        required: false,
        options: ['overwrite', 'append', 'prepend'],
        default: 'overwrite',
        description: 'overwrite=استبدال كامل | append=إضافة للنهاية | prepend=إضافة للبداية'
      }
    ],
    outputs: [
      { key: 'success', type: 'boolean', description: 'هل نجحت الكتابة؟' },
      { key: 'filePath', type: 'string', description: 'المسار الكامل للملف' }
    ],
    handler: 'fileWriteHandler'
  },

  'file-patch': {
    id: 'file-patch',
    label: 'تعديل جزء من ملف',
    description: 'يبحث عن نص محدد في الملف ويستبدله بنص جديد. مثالي لتحديث أقسام المستندات.',
    category: 'files',
    icon: '🔧',
    params: [
      {
        key: 'filePath',
        label: 'مسار الملف',
        type: 'text',
        required: true
      },
      {
        key: 'oldText',
        label: 'النص المراد تعديله',
        type: 'text',
        required: true,
        description: 'يجب أن يكون فريداً في الملف'
      },
      {
        key: 'newText',
        label: 'النص الجديد',
        type: 'text',
        required: true
      }
    ],
    outputs: [
      { key: 'replaced', type: 'boolean', description: 'هل وُجد النص وتم تعديله؟' },
      { key: 'filePath', type: 'string', description: 'مسار الملف المعدَّل' }
    ],
    handler: 'filePatchHandler'
  },

  'file-delete': {
    id: 'file-delete',
    label: 'حذف ملف',
    description: 'يحذف ملفاً من مجلد التقارير.',
    category: 'files',
    icon: '🗑️',
    isHITL: true,                          // ← حذف يحتاج موافقة دائماً
    params: [
      {
        key: 'filePath',
        label: 'مسار الملف',
        type: 'text',
        required: true
      }
    ],
    outputs: [
      { key: 'deleted', type: 'boolean', description: 'هل تم الحذف؟' }
    ],
    handler: 'fileDeleteHandler'
  },

  'file-list': {
    id: 'file-list',
    label: 'قائمة الملفات',
    description: 'يعرض قائمة الملفات الموجودة في مجلد التقارير.',
    category: 'files',
    icon: '📁',
    params: [
      {
        key: 'subFolder',
        label: 'مجلد فرعي (اختياري)',
        type: 'text',
        required: false,
        description: 'اتركه فارغاً لعرض كل الملفات'
      },
      {
        key: 'extension',
        label: 'نوع الملف',
        type: 'select',
        required: false,
        options: ['all', '.md', '.txt', '.json', '.pdf'],
        default: 'all'
      }
    ],
    outputs: [
      { key: 'files', type: 'array', description: 'قائمة الملفات مع معلوماتها' },
      { key: 'count', type: 'number', description: 'عدد الملفات' }
    ],
    handler: 'fileListHandler'
  },

  'file-to-storage': {
    id: 'file-to-storage',
    label: 'رفع ملف لـ Storage',
    description: 'يرفع ملفاً محلياً إلى Supabase Storage ويعيد رابطاً عاماً.',
    category: 'files',
    icon: '☁️',
    params: [
      {
        key: 'filePath',
        label: 'مسار الملف المحلي',
        type: 'text',
        required: true
      },
      {
        key: 'bucket',
        label: 'اسم الـ Bucket',
        type: 'text',
        required: false,
        default: 'zoon-reports'
      }
    ],
    outputs: [
      { key: 'publicUrl', type: 'string', description: 'رابط الملف العام' },
      { key: 'fileName', type: 'string', description: 'اسم الملف في Storage' }
    ],
    handler: 'fileToStorageHandler'
  }
}
```

### 17.5 الـ Handlers — file-handlers.ts

**الملف:** `src/domains/zoon-os/functions/handlers/file-handlers.ts`

```typescript
import { promises as fs } from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { HandlerResult } from './financial-handlers'

// ===== إعداد المجلد الآمن =====
const SAFE_BASE_DIR = path.join(process.cwd(), 'docs', 'generated')

/**
 * التحقق من أن المسار داخل المجلد الآمن فقط
 * يمنع Path Traversal مثل: ../../etc/passwd
 */
function resolveSafePath(filePath: string): string {
  // تنظيف المسار من أي محاولات اختراق
  const cleaned = filePath.replace(/\.\./g, '').replace(/^\//, '')
  const resolved = path.resolve(SAFE_BASE_DIR, cleaned)

  if (!resolved.startsWith(SAFE_BASE_DIR)) {
    throw new Error(`مسار غير مسموح به: ${filePath}`)
  }
  return resolved
}

// ===== قراءة ملف =====
export async function fileReadHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  try {
    const safePath = resolveSafePath(params.filePath as string)
    const content = await fs.readFile(safePath, 'utf-8')
    const stats = await fs.stat(safePath)

    return {
      success: true,
      data: {
        content,
        lines: content.split('\n').length,
        sizeKb: (stats.size / 1024).toFixed(2)
      },
      summary: `📖 تم قراءة: ${params.filePath} (${content.length} حرف، ${content.split('\n').length} سطر)`
    }
  } catch (error) {
    return {
      success: false,
      error: `فشل القراءة: ${(error as Error).message}`
    }
  }
}

// ===== كتابة ملف =====
export async function fileWriteHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  try {
    const safePath = resolveSafePath(params.filePath as string)
    const { content, mode = 'overwrite' } = params

    // إنشاء المجلدات الوسيطة إذا لم توجد
    await fs.mkdir(path.dirname(safePath), { recursive: true })

    if (mode === 'append') {
      await fs.appendFile(safePath, '\n' + String(content), 'utf-8')
    } else if (mode === 'prepend') {
      const existing = await fs.readFile(safePath, 'utf-8').catch(() => '')
      await fs.writeFile(safePath, String(content) + '\n' + existing, 'utf-8')
    } else {
      // overwrite — الافتراضي
      await fs.writeFile(safePath, String(content), 'utf-8')
    }

    return {
      success: true,
      data: { filePath: params.filePath, mode },
      summary: `✏️ تم ${mode === 'append' ? 'إضافة محتوى لـ' : mode === 'prepend' ? 'إضافة محتوى لبداية' : 'كتابة'} الملف: ${params.filePath}`
    }
  } catch (error) {
    return {
      success: false,
      error: `فشل الكتابة: ${(error as Error).message}`
    }
  }
}

// ===== تعديل جزء من ملف =====
export async function filePatchHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  try {
    const safePath = resolveSafePath(params.filePath as string)
    const { oldText, newText } = params

    const content = await fs.readFile(safePath, 'utf-8')

    if (!content.includes(oldText as string)) {
      return {
        success: true,
        data: { replaced: false, filePath: params.filePath },
        summary: `⚠️ النص المراد تعديله غير موجود في: ${params.filePath}`
      }
    }

    // استبدال أول تطابق فقط
    const updated = content.replace(oldText as string, newText as string)
    await fs.writeFile(safePath, updated, 'utf-8')

    return {
      success: true,
      data: { replaced: true, filePath: params.filePath },
      summary: `🔧 تم تعديل الملف: ${params.filePath}`
    }
  } catch (error) {
    return {
      success: false,
      error: `فشل التعديل: ${(error as Error).message}`
    }
  }
}

// ===== حذف ملف =====
export async function fileDeleteHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  try {
    const safePath = resolveSafePath(params.filePath as string)
    await fs.unlink(safePath)

    return {
      success: true,
      data: { deleted: true, filePath: params.filePath },
      summary: `🗑️ تم حذف الملف: ${params.filePath}`
    }
  } catch (error) {
    return {
      success: false,
      error: `فشل الحذف: ${(error as Error).message}`
    }
  }
}

// ===== قائمة الملفات =====
export async function fileListHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  try {
    const subFolder = params.subFolder as string | undefined
    const extension = params.extension as string | undefined
    const targetDir = subFolder
      ? resolveSafePath(subFolder)
      : SAFE_BASE_DIR

    await fs.mkdir(targetDir, { recursive: true })
    const entries = await fs.readdir(targetDir, { withFileTypes: true })

    const files = await Promise.all(
      entries
        .filter(e => e.isFile())
        .filter(e => !extension || extension === 'all' || e.name.endsWith(extension))
        .map(async e => {
          const stats = await fs.stat(path.join(targetDir, e.name))
          return {
            name: e.name,
            sizeKb: (stats.size / 1024).toFixed(2),
            lastModified: stats.mtime.toISOString()
          }
        })
    )

    return {
      success: true,
      data: { files, count: files.length },
      summary: `📁 وُجد ${files.length} ملف${subFolder ? ` في ${subFolder}` : ''}`
    }
  } catch (error) {
    return {
      success: false,
      error: `فشل قراءة المجلد: ${(error as Error).message}`
    }
  }
}

// ===== رفع لـ Supabase Storage =====
export async function fileToStorageHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  try {
    const safePath = resolveSafePath(params.filePath as string)
    const bucket = (params.bucket as string) ?? 'zoon-reports'
    const fileName = path.basename(safePath)

    const fileBuffer = await fs.readFile(safePath)
    const mimeType = getMimeType(fileName)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    const { error } = await supabase.storage
      .from(bucket)
      .upload(`generated/${fileName}`, fileBuffer, {
        contentType: mimeType,
        upsert: true
      })

    if (error) throw new Error(error.message)

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(`generated/${fileName}`)

    return {
      success: true,
      data: { publicUrl, fileName, bucket },
      summary: `☁️ تم رفع ${fileName} إلى Storage`
    }
  } catch (error) {
    return {
      success: false,
      error: `فشل الرفع: ${(error as Error).message}`
    }
  }
}

// ===== مساعد: تحديد نوع الملف =====
function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  const types: Record<string, string> = {
    '.md':   'text/markdown',
    '.txt':  'text/plain',
    '.json': 'application/json',
    '.pdf':  'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
  return types[ext] ?? 'application/octet-stream'
}
```

### 17.6 تحديث Registry و Pipeline Engine

**أضف في `registry/index.ts`:**
```typescript
import { FILE_NODES } from './file-nodes'

export const FUNCTION_NODES: Record<string, FunctionNode> = {
  // ... الموجود
  ...FILE_NODES    // ← أضف هذا السطر
}
```

**أضف في `pipeline/pipeline-engine.ts`:**
```typescript
import * as fileHandlers from '../handlers/file-handlers'

const HANDLER_MAP = {
  // ... الموجود
  fileReadHandler:      fileHandlers.fileReadHandler,
  fileWriteHandler:     fileHandlers.fileWriteHandler,
  filePatchHandler:     fileHandlers.filePatchHandler,
  fileDeleteHandler:    fileHandlers.fileDeleteHandler,
  fileListHandler:      fileHandlers.fileListHandler,
  fileToStorageHandler: fileHandlers.fileToStorageHandler,
}
```

### 17.7 Skill Module في قاعدة البيانات

```sql
INSERT INTO ai_skill_modules (name, label, description, icon, category)
VALUES (
  'fileManagement',
  'إدارة الملفات',
  'قراءة وكتابة وتعديل ملفات التقارير والمستندات المولّدة تلقائياً. الوكيل يستطيع إنشاء مستندات .md وتحديثها ورفعها للـ Storage.',
  '📁',
  'files'
);

-- ثم أضف الـ Functions تحته:
INSERT INTO ai_skill_functions
  (skill_module_id, function_name, label, description, type, endpoint, input_schema, sort_order)
VALUES
  ('<module_id>', 'fileRead',      'قراءة ملف',          'يقرأ محتوى ملف .md أو .txt',          'internal', '/api/internal/run-function', '{"filePath": {"type": "string"}}', 1),
  ('<module_id>', 'fileWrite',     'كتابة ملف',          'ينشئ أو يكتب فوق ملف',                 'internal', '/api/internal/run-function', '{"filePath": {"type": "string"}, "content": {"type": "string"}, "mode": {"type": "string"}}', 2),
  ('<module_id>', 'filePatch',     'تعديل جزء من ملف',  'يستبدل نصاً محدداً داخل ملف',          'internal', '/api/internal/run-function', '{"filePath": {"type": "string"}, "oldText": {"type": "string"}, "newText": {"type": "string"}}', 3),
  ('<module_id>', 'fileDelete',    'حذف ملف',            'يحذف ملفاً — يحتاج موافقة المدير',     'hitl',     '/api/internal/run-function', '{"filePath": {"type": "string"}}', 4),
  ('<module_id>', 'fileList',      'قائمة الملفات',      'يعرض الملفات المتاحة',                  'internal', '/api/internal/run-function', '{"subFolder": {"type": "string"}, "extension": {"type": "string"}}', 5),
  ('<module_id>', 'fileToStorage', 'رفع لـ Storage',     'يرفع ملفاً لـ Supabase Storage',        'internal', '/api/internal/run-function', '{"filePath": {"type": "string"}, "bucket": {"type": "string"}}', 6);
```

### 17.8 السيناريوهات العملية

#### السيناريو 1: وكيل يكتب تقريراً ويحفظه
```json
{
  "mode": "pipeline",
  "steps": [
    {
      "nodeId": "calc-profits",
      "params": { "startDate": "2026-03-01", "endDate": "2026-03-31" }
    },
    {
      "nodeId": "file-write",
      "params": {
        "filePath": "reports/march-2026.md",
        "content": "# تقرير مارس 2026\n\nالإيرادات: {{prev.data.revenue}}\nالأرباح: {{prev.data.profit}}\nهامش الربح: {{prev.data.margin}}",
        "mode": "overwrite"
      }
    },
    {
      "nodeId": "file-to-storage",
      "params": {
        "filePath": "reports/march-2026.md",
        "bucket": "zoon-reports"
      }
    },
    {
      "nodeId": "send-telegram",
      "params": {
        "message": "📊 تقرير مارس جاهز",
        "fileUrl": "{{prev.data.publicUrl}}"
      }
    }
  ]
}
```

#### السيناريو 2: تحديث مستند موجود
```json
{
  "mode": "pipeline",
  "steps": [
    {
      "nodeId": "file-read",
      "params": { "filePath": "docs/weekly-summary.md" }
    },
    {
      "nodeId": "file-patch",
      "params": {
        "filePath": "docs/weekly-summary.md",
        "oldText": "## آخر تحديث: ...",
        "newText": "## آخر تحديث: 2026-03-12"
      }
    }
  ]
}
```

#### السيناريو 3: أرشفة التقارير القديمة
```json
{
  "mode": "pipeline",
  "steps": [
    {
      "nodeId": "file-list",
      "params": { "subFolder": "reports", "extension": ".md" }
    },
    {
      "nodeId": "file-to-storage",
      "params": { "filePath": "reports/{{prev.data.files[0].name}}" }
    }
  ]
}
```

### 17.9 Checklist التطبيق

```
للمطور — خطوات التطبيق بالترتيب:

□ 1. إنشاء المجلد: mkdir -p docs/generated && touch docs/generated/.gitkeep
□ 2. إضافة docs/generated/ في .gitignore (الملفات المولّدة لا تُرفع)
□ 3. نسخ file-handlers.ts في handlers/
□ 4. نسخ file-nodes.ts في registry/
□ 5. إضافة ...FILE_NODES في registry/index.ts
□ 6. إضافة fileHandlers في HANDLER_MAP في pipeline-engine.ts
□ 7. تشغيل SQL في Supabase لإضافة الـ Skill Module
□ 8. اختبار: POST /api/internal/run-function { nodeId: 'file-write', params: {...} }
□ 9. اختبار Pipeline كامل (write → read → patch → storage)
□ 10. التحقق أن Path Traversal محمي
```

### 17.10 اختبارات الوحدة

```typescript
// tests/functions/file-handlers.test.ts
import { fileWriteHandler, fileReadHandler, filePatchHandler } from
  '@/domains/zoon-os/functions/handlers/file-handlers'

describe('File Handlers', () => {

  it('يكتب ملف ويقرأه', async () => {
    const content = '# تقرير اختبار\nهذا اختبار'

    const writeResult = await fileWriteHandler({
      filePath: 'test/test-report.md',
      content,
      mode: 'overwrite'
    })
    expect(writeResult.success).toBe(true)

    const readResult = await fileReadHandler({ filePath: 'test/test-report.md' })
    expect(readResult.success).toBe(true)
    expect((readResult.data as any).content).toBe(content)
  })

  it('يعدّل جزءاً من ملف', async () => {
    await fileWriteHandler({
      filePath: 'test/patch-test.md',
      content: '# عنوان\n## قسم قديم\nمحتوى',
      mode: 'overwrite'
    })

    const result = await filePatchHandler({
      filePath: 'test/patch-test.md',
      oldText: '## قسم قديم',
      newText: '## قسم جديد محدّث'
    })

    expect(result.success).toBe(true)
    expect((result.data as any).replaced).toBe(true)

    const readResult = await fileReadHandler({ filePath: 'test/patch-test.md' })
    expect((readResult.data as any).content).toContain('قسم جديد محدّث')
  })

  it('يرفض مسار خارج SAFE_BASE_DIR', async () => {
    const result = await fileReadHandler({ filePath: '../../.env' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('مسار غير مسموح')
  })

  it('يعيد replaced=false إذا النص غير موجود', async () => {
    await fileWriteHandler({
      filePath: 'test/no-match.md',
      content: 'محتوى عادي',
      mode: 'overwrite'
    })

    const result = await filePatchHandler({
      filePath: 'test/no-match.md',
      oldText: 'نص غير موجود',
      newText: 'نص جديد'
    })

    expect(result.success).toBe(true)
    expect((result.data as any).replaced).toBe(false)
  })
})
```

---

## 📌 القواعد الذهبية للمطورين (النسخة النهائية)

> **القاعدة 1:** كل Handler يجب أن يعيد `HandlerResult` — لا `throw` مباشرة للمستخدم.

> **القاعدة 2:** كل Function لها `summary` نصي — الوكيل يستخدمه لإخبار المدير بالنتيجة.

> **القاعدة 3:** Functions نوع `isHITL: true` تنتظر موافقة المدير قبل التنفيذ.

> **القاعدة 4:** استخدم `{{prev.fieldName}}` لتمرير البيانات بين خطوات الـ Pipeline.

> **القاعدة 5:** كل Function جديدة = 4 خطوات فقط (install + handler + registry + handler_map).

> **القاعدة 6:** كل Skill Module يجمع Functions من **نفس المجال** فقط.

> **القاعدة 7:** اسم الـ tool للوكيل = `moduleName__functionName`.

> **القاعدة 8:** File Handlers تكتب في `SAFE_BASE_DIR` فقط — أي مسار خارجه يُرفض فوراً.

> **القاعدة 9:** Pipeline محفوظة = Skill من الدرجة الأولى — الوكيل يراها بنفس مستوى Core Nodes.

> **القاعدة 10:** المطور يصنع الأدوات (Core Nodes)، المدير يصنع المنتجات (Pipelines → Skills).

---

## 18. Workflow Builder — من Pipeline إلى Skill تلقائياً

> **السياق:** هذا القسم يوثّق قرارًا معماريًا مهمًا اقترحه فريق الواجهة: Pipeline المحفوظة يجب أن **تتحول تلقائياً إلى Skill** يراها الوكيل كمهارة من الدرجة الأولى — بنفس مستوى Core Nodes المبرمجة.

---

### 18.1 الفلسفة الكاملة للنظام

```
┌─────────────────────────────────────────────────────────────┐
│                    طبقتا البناء                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  الطبقة 1 — المطور (مرة واحدة للأبد)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │export-pdf│  │calc-prof │  │send-tele │  │file-read │   │
│  │ Handler  │  │ Handler  │  │ Handler  │  │ Handler  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│       ↑              ↑              ↑              ↑        │
│       └──────────────┴──────────────┴──────────────┘        │
│                    Core Nodes Registry                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  الطبقة 2 — المدير (من الواجهة، بدون كود)                 │
│                                                             │
│  Workflow Builder:                                          │
│  calc-profits → export-pdf → send-telegram                 │
│         ↓ يحفظ ويسمّي                                      │
│  "تقرير الأرباح الشهري"                                    │
│         ↓ تلقائياً                                         │
│  ✨ Skill جديدة في ai_skill_modules                        │
│         ↓ فوراً                                            │
│  الوكيل يعرفها ويستطيع تشغيلها بالكلام                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 18.2 الفرق بين الخيارين

```
❌ الخيار القديم (قبل هذا القرار):
   Pipeline محفوظة → جدول function_pipelines
   الوكيل يبحث في جدول منفصل
   تجربة مختلفة عن الـ Skills العادية

✅ الخيار الجديد (المعتمد):
   Pipeline محفوظة → تُسجَّل تلقائياً في ai_skill_modules
   الوكيل يراها بنفس مستوى Core Nodes
   المدير يبني 100 "مهارة" جديدة بدون مطور
```

### 18.3 آلية التحويل — Pipeline → Skill

```typescript
// src/domains/zoon-os/functions/pipeline/pipeline-to-skill.ts

import { createClient } from '@supabase/supabase-js'
import { PipelineStep } from './pipeline-engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export interface SavedPipeline {
  name: string              // 'monthlyProfitReport'
  label: string             // 'تقرير الأرباح الشهري'
  description: string       // 'يحسب الأرباح ويصدّرها PDF ويرسلها تليجرام'
  icon?: string             // '📊'
  steps: PipelineStep[]
  inputParams?: PipelineInputParam[]   // مدخلات يطلبها الوكيل من المدير
  isSchedulable?: boolean              // هل يمكن جدولتها كـ Cron؟
}

export interface PipelineInputParam {
  key: string          // 'startDate'
  label: string        // 'تاريخ البداية'
  type: 'date' | 'text' | 'number' | 'select'
  required: boolean
  default?: unknown
  options?: string[]   // للـ select
}

/**
 * يحفظ Pipeline ويحوّلها تلقائياً إلى Skill
 * هذه هي الدالة الرئيسية التي تستدعيها واجهة Workflow Builder
 */
export async function savePipelineAsSkill(
  pipeline: SavedPipeline,
  createdBy: string
): Promise<{ skillId: string; pipelineId: string }> {

  // ===== 1. حفظ الـ Pipeline في جدولها =====
  const { data: savedPipeline, error: pipelineError } = await supabase
    .from('function_pipelines')
    .insert({
      name: pipeline.name,
      label: pipeline.label,
      description: pipeline.description,
      steps: JSON.stringify(pipeline.steps),
      input_params: JSON.stringify(pipeline.inputParams ?? []),
      is_schedulable: pipeline.isSchedulable ?? false,
      created_by: createdBy,
      is_active: true
    })
    .select()
    .single()

  if (pipelineError || !savedPipeline) {
    throw new Error(`فشل حفظ Pipeline: ${pipelineError?.message}`)
  }

  // ===== 2. تحويلها تلقائياً إلى Skill Module =====
  const { data: skillModule, error: skillError } = await supabase
    .from('ai_skill_modules')
    .insert({
      name: pipeline.name,
      label: pipeline.label,
      description: buildSkillDescription(pipeline),
      icon: pipeline.icon ?? inferIcon(pipeline.steps),
      category: 'pipeline',          // ← فئة خاصة للـ Pipelines
      source: 'workflow_builder',    // ← يميزها عن Core Nodes
      pipeline_id: savedPipeline.id, // ← ربط مباشر
      is_active: true
    })
    .select()
    .single()

  if (skillError || !skillModule) {
    throw new Error(`فشل تحويل Pipeline إلى Skill: ${skillError?.message}`)
  }

  // ===== 3. إنشاء Function واحدة "execute" تحت الـ Skill =====
  await supabase.from('ai_skill_functions').insert({
    skill_module_id: skillModule.id,
    function_name: 'execute',
    label: `تشغيل: ${pipeline.label}`,
    description: pipeline.description,
    type: 'pipeline',               // ← نوع جديد خاص بالـ Pipelines
    endpoint: `/api/internal/run-pipeline/${savedPipeline.id}`,
    input_schema: buildInputSchema(pipeline.inputParams ?? []),
    is_active: true,
    sort_order: 1
  })

  console.log(`✅ Pipeline "${pipeline.label}" أصبحت Skill جاهزة للوكيل`)

  return {
    skillId: skillModule.id,
    pipelineId: savedPipeline.id
  }
}

/**
 * بناء وصف Skill من Pipeline بشكل تلقائي
 */
function buildSkillDescription(pipeline: SavedPipeline): string {
  const stepLabels = pipeline.steps
    .map(s => s.nodeId.replace(/-/g, ' '))
    .join(' ← ')

  return `${pipeline.description}\n\nالخطوات: ${stepLabels}`
}

/**
 * استنتاج الأيقونة تلقائياً من نوع الـ steps
 */
function inferIcon(steps: PipelineStep[]): string {
  const nodeIds = steps.map(s => s.nodeId).join(',')
  if (nodeIds.includes('export-pdf'))    return '📄'
  if (nodeIds.includes('send-telegram')) return '📨'
  if (nodeIds.includes('calc-profits'))  return '💰'
  if (nodeIds.includes('web-search'))    return '🔍'
  if (nodeIds.includes('file'))          return '📁'
  return '⚡'
}

/**
 * تحويل inputParams إلى JSON Schema
 */
function buildInputSchema(params: PipelineInputParam[]): Record<string, unknown> {
  const schema: Record<string, unknown> = {}
  for (const param of params) {
    schema[param.key] = {
      type: param.type === 'date' ? 'string' : param.type,
      label: param.label,
      required: param.required,
      ...(param.default !== undefined && { default: param.default }),
      ...(param.options && { enum: param.options })
    }
  }
  return schema
}
```

### 18.4 API تشغيل Pipeline المحفوظة

```typescript
// app/api/internal/run-pipeline/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runPipeline } from '@/domains/zoon-os/functions/pipeline/pipeline-engine'
import { createPipelineContext } from '@/domains/zoon-os/functions/tracing/pipeline-context'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userParams, userId, triggeredBy = 'agent' } = await req.json()

  // جلب الـ Pipeline من DB
  const { data: pipeline } = await supabase
    .from('function_pipelines')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!pipeline) {
    return NextResponse.json({ error: 'Pipeline غير موجودة' }, { status: 404 })
  }

  // دمج مدخلات المستخدم مع الـ steps
  const steps = JSON.parse(pipeline.steps)
  const resolvedSteps = injectUserParams(steps, userParams ?? {})

  // تشغيل Pipeline
  const context = createPipelineContext(userId ?? 'agent', triggeredBy, params.id)
  const result = await runPipeline(resolvedSteps, context)

  return NextResponse.json({
    success: result.success,
    traceId: result.traceId,
    summary: buildExecutionSummary(result),
    steps: result.steps
  })
}

/**
 * يحقن مدخلات المستخدم في الـ params
 * مثال: { startDate: '2026-03-01' } → يستبدل {{input.startDate}} في الـ steps
 */
function injectUserParams(
  steps: any[],
  userParams: Record<string, unknown>
): any[] {
  return steps.map(step => ({
    ...step,
    params: Object.fromEntries(
      Object.entries(step.params).map(([key, value]) => {
        if (typeof value === 'string' && value.startsWith('{{input.')) {
          const paramKey = value.slice(8, -2)  // استخراج اسم الـ param
          return [key, userParams[paramKey] ?? value]
        }
        return [key, value]
      })
    )
  }))
}

function buildExecutionSummary(result: any): string {
  const successCount = result.steps.filter((s: any) => s.success).length
  const total = result.steps.length
  return result.success
    ? `✅ اكتملت جميع الخطوات (${total}/${total})`
    : `⚠️ اكتملت ${successCount} من ${total} خطوات`
}
```

### 18.5 تحديث System Prompt — الوكيل يرى Pipeline كـ Skill

```typescript
// تحديث في load-skill-modules.ts

export async function loadSkillModulesAsTools() {
  const { data: modules } = await supabase
    .from('ai_skill_modules')
    .select(`
      id, name, label, description, source, pipeline_id,
      ai_skill_functions (
        function_name, label, description,
        type, endpoint, input_schema, is_active
      )
    `)
    .eq('is_active', true)
    .order('source')   // ← Core Nodes أولاً ثم Pipelines

  // ... نفس المنطق الموجود
}

export function buildModulesDescription(modules: any[]): string {
  const coreModules = modules.filter(m => m.source !== 'workflow_builder')
  const pipelineModules = modules.filter(m => m.source === 'workflow_builder')

  let description = ''

  if (coreModules.length > 0) {
    description += `## المهارات الأساسية (Core)\n`
    description += coreModules.map(formatModule).join('\n\n')
  }

  if (pipelineModules.length > 0) {
    description += `\n\n## مهارات المدير (Workflows)\n`
    description += `> هذه مهارات أنشأها المدير من Workflow Builder\n\n`
    description += pipelineModules.map(formatPipelineModule).join('\n\n')
  }

  return description
}

function formatModule(module: any): string {
  const fns = module.ai_skill_functions
    .filter((f: any) => f.is_active)
    .map((f: any) => `    • ${module.name}__${f.function_name}: ${f.description}`)
    .join('\n')
  return `**${module.label}** (${module.name})\n${fns}`
}

function formatPipelineModule(module: any): string {
  return `**${module.label}** ← workflow مخصص\n    • ${module.name}__execute: ${module.description}`
}
```

**شكل System Prompt بعد التحديث:**
```
## المهارات الأساسية (Core)

**التقارير المالية** (financialReports)
    • financialReports__calcProfits: يحسب الأرباح
    • financialReports__exportReport: يصدّر تقريراً

**إدارة الملفات** (fileManagement)
    • fileManagement__fileRead: يقرأ ملف
    • fileManagement__fileWrite: يكتب ملف

## مهارات المدير (Workflows)
> هذه مهارات أنشأها المدير من Workflow Builder

**تقرير الأرباح الشهري** ← workflow مخصص
    • monthlyProfitReport__execute: يحسب الأرباح ويصدّرها PDF ويرسلها تليجرام

**تقرير المناديب الأسبوعي** ← workflow مخصص
    • weeklyDriverReport__execute: يجمع أداء المناديب ويرسل ملخصاً
```

### 18.6 Schema التحديثات المطلوبة

```sql
-- ===== تحديث جدول function_pipelines =====
ALTER TABLE function_pipelines
ADD COLUMN IF NOT EXISTS label         TEXT,
ADD COLUMN IF NOT EXISTS input_params  JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS is_schedulable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by    TEXT;

-- ===== تحديث جدول ai_skill_modules =====
ALTER TABLE ai_skill_modules
ADD COLUMN IF NOT EXISTS source      TEXT DEFAULT 'code'
  CHECK (source IN ('code', 'workflow_builder')),
ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES function_pipelines(id);

-- ===== تحديث جدول ai_skill_functions — نوع جديد =====
ALTER TABLE ai_skill_functions
DROP CONSTRAINT IF EXISTS ai_skill_functions_type_check;

ALTER TABLE ai_skill_functions
ADD CONSTRAINT ai_skill_functions_type_check
  CHECK (type IN ('internal', 'webhook', 'hitl', 'pipeline'));

-- ===== Index للبحث السريع =====
CREATE INDEX IF NOT EXISTS idx_skill_modules_source
  ON ai_skill_modules(source);

CREATE INDEX IF NOT EXISTS idx_skill_modules_pipeline
  ON ai_skill_modules(pipeline_id);
```

### 18.7 واجهة Workflow Builder — التصميم المقترح

```
┌─────────────────────────────────────────────────────────────┐
│  ⚡ Workflow Builder                          [حفظ كـ Skill]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  اسم الـ Workflow: [تقرير الأرباح الشهري        ]          │
│  الوصف:           [يحسب ويصدّر ويرسل تلقائياً  ]          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📦 المهارات المتاحة          🔗 الـ Workflow        │   │
│  │                                                     │   │
│  │  💰 calc-profits    ──────►  [1] calc-profits       │   │
│  │  📄 export-pdf              ↓                       │   │
│  │  📨 send-telegram   ──────► [2] export-pdf          │   │
│  │  🔍 web-search              ↓                       │   │
│  │  📖 file-read       ──────► [3] send-telegram       │   │
│  │  ✏️ file-write                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  المدخلات المطلوبة:                                        │
│  + إضافة مدخل   [startDate: تاريخ البداية ▼] [حذف]        │
│                 [endDate:   تاريخ النهاية  ▼] [حذف]        │
│                                                             │
│  [🧪 تجربة]  [💾 حفظ كـ Skill — سيظهر للوكيل فوراً]      │
└─────────────────────────────────────────────────────────────┘
```

### 18.8 مثال: الوكيل يشغّل Workflow بالكلام

```
المدير: "أرسل تقرير الأرباح لمارس"

الوكيل يرى في System Prompt:
  monthlyProfitReport__execute: يحسب الأرباح ويصدّرها PDF ويرسلها تليجرام

الوكيل يستدعي:
  POST /api/internal/run-pipeline/<id>
  { userParams: { startDate: '2026-03-01', endDate: '2026-03-31' } }

النتيجة:
  ✅ حساب الأرباح اكتمل
  ✅ PDF جاهز في Storage
  ✅ رسالة تليجرام أُرسلت

الوكيل يرد:
  "تم إرسال تقرير أرباح مارس ✅
   الإيرادات: 45,200 ج.م | الأرباح: 12,800 ج.م
   الملف: [رابط PDF]"
```

### 18.9 مقارنة قبل/بعد هذا القرار

```
┌────────────────────────┬──────────────────────┬──────────────────────────┐
│                        │ قبل (Pipeline فقط)   │ بعد (Pipeline → Skill)   │
├────────────────────────┼──────────────────────┼──────────────────────────┤
│ الوكيل يراها؟          │ ⚠️ بطريقة مختلفة    │ ✅ كـ Skill عادية        │
│ تظهر في System Prompt? │ ❌                   │ ✅ تلقائياً              │
│ المدير يبني بدون كود؟  │ ✅                   │ ✅                       │
│ قابلة للجدولة؟         │ ⚠️ معقدة             │ ✅ is_schedulable         │
│ تحتاج مطور؟           │ ⚠️ للتسجيل           │ ❌ تلقائي 100%           │
│ الوكيل يفهم السياق؟   │ ⚠️ جزئياً            │ ✅ وصف كامل              │
└────────────────────────┴──────────────────────┴──────────────────────────┘
```

### 18.10 Checklist التطبيق

```
للمطور — خطوات التطبيق بالترتيب:

□ 1. تشغيل SQL لتحديث الجداول (ALTER TABLE commands)
□ 2. نسخ pipeline-to-skill.ts في مجلد pipeline/
□ 3. إنشاء app/api/internal/run-pipeline/[id]/route.ts
□ 4. تحديث load-skill-modules.ts ليفصل Core عن Workflows
□ 5. تحديث buildModulesDescription() لعرض القسمين
□ 6. بناء واجهة Workflow Builder (drag & drop)
□ 7. اختبار: بناء Pipeline من الواجهة → تحقق ظهورها للوكيل
□ 8. اختبار: الوكيل يشغّل الـ Workflow بالكلام
□ 9. اختبار: مدخلات المستخدم {{input.param}} تعمل صح
□ 10. اختبار: حذف Skill يحذف Pipeline المرتبطة (Cascade)
```

---

*آخر تحديث: مارس 2026 | Zoon OS Function System v2.0 — Workflow Builder Edition*
