# Zoon Hybrid OS — دليل المطور الشامل

### Developer Implementation Guide v1.0

> **الهدف من هذا المستند:** شرح تفصيلي لمعمارية Zoon OS وكيفية تطوير وتوسيع
> النظام، موجه للمطورين الذين يعملون على المشروع.

---

## 📋 فهرس المحتويات

1. [نظرة عامة على المعمارية](#1-نظرة-عامة-على-المعمارية)
2. [هيكل المجلدات](#2-هيكل-المجلدات)
3. [المرحلة الأولى — Tool Execution Layer](#3-المرحلة-الأولى--tool-execution-layer)
   - [Error Handler](#31-error-handler)
   - [Retry Logic](#32-retry-logic)
   - [Tool Executor](#33-tool-executor--المحرك-المركزي)
4. [Auto Router](#4-auto-router)
5. [Agent Memory](#5-agent-memory)
6. [المرحلة الثانية — Incoming Webhooks](#6-المرحلة-الثانية--incoming-webhooks)
7. [المرحلة الثالثة — Scheduled Triggers](#7-المرحلة-الثالثة--scheduled-triggers)
8. [تحديث Route الرئيسي](#8-تحديث-route-الرئيسي)
9. [قاعدة البيانات — Supabase Schema](#9-قاعدة-البيانات--supabase-schema)
10. [Skills Categories System](#10-skills-categories-system)
11. [خطة التنفيذ الأسبوعية](#11-خطة-التنفيذ-الأسبوعية)
12. [معايير الجودة والاختبار](#12-معايير-الجودة-والاختبار)

---

## 1. نظرة عامة على المعمارية

```
┌──────────────────────────────────────────────────────────┐
│                  طبقة المستخدم (UI Layer)                 │
│         ZoonChat • Skill Builder • Redux Store            │
├──────────────────────────────────────────────────────────┤
│               طبقة التوجيه (Auto Router)                  │
│         يصنف الطلب قبل أن يصل إلى LLM                    │
├──────────────────────────────────────────────────────────┤
│              طبقة الوكيل (Zoon OS Core)                   │
│      Gemini 2.5 Flash • Dynamic Skills • HITL             │
├──────────────────────────────────────────────────────────┤
│            طبقة التنفيذ (Execution Layer)                  │
│    Tool Executor • Retry Logic • Error Handler            │
├──────────────────────────────────────────────────────────┤
│            طبقة الأحداث (Event Layer) ← جديد             │
│         Incoming Webhooks • Scheduled Triggers            │
├──────────────────────────────────────────────────────────┤
│           طبقة البيانات (Data & State Layer)              │
│    Supabase • Agent Memory • Execution Logs               │
└──────────────────────────────────────────────────────────┘
```

### المبادئ الأساسية للنظام

| المبدأ                   | التطبيق                                              |
| ------------------------ | ---------------------------------------------------- |
| **Reactive → Proactive** | النظام يرد على المستخدم ويبادر بالتنبيه أيضاً         |
| **Fail Gracefully**      | كل فشل يُعالج بأسلوب مهذب ومفهوم للمستخدم             |
| **Human-In-The-Loop**    | العمليات الحساسة تتوقف دائماً للموافقة البشرية        |
| **Arabic First**         | ردود الوكيل وأخطاؤه بالعربية دائماً                   |
| **Dynamic Skills**       | إضافة مهارات جديدة من قاعدة البيانات دون تعديل الكود |

---

## 2. هيكل المجلدات

```
src/
└── domains/
    └── zoon-os/
        ├── skills/                    ← المهارات الثابتة (Hardcoded)
        │   ├── index.ts               ← تصدير جميع Skills
        │   ├── searchNewsTool.ts
        │   ├── telegramTool.ts
        │   ├── publishToRoomTool.ts
        │   └── alexDialectTool.ts
        │
        ├── execution/                 ← 🆕 طبقة التنفيذ الآمن
        │   ├── error-handler.ts       ← تصنيف ومعالجة الأخطاء
        │   ├── retry-logic.ts         ← منطق إعادة المحاولة
        │   └── tool-executor.ts       ← المحرك المركزي
        │
        ├── router/                    ← 🆕 Auto Router
        │   └── auto-router.ts
        │
        ├── memory/                    ← 🆕 ذاكرة الوكيل
        │   └── context-store.ts
        │
        ├── webhooks/                  ← 🆕 المرحلة الثانية
        │   └── webhook-processor.ts
        │
        ├── triggers/                  ← 🆕 المرحلة الثالثة
        │   └── scheduler.ts
        │
        └── route.ts                   ← القلب النابض — يربط كل الطبقات

app/
└── api/
    ├── zoon/
    │   └── route.ts                   ← يستدعي domains/zoon-os/route.ts
    └── webhooks/
        └── [userId]/
            └── route.ts               ← 🆕 استقبال Webhooks الخارجية
```

---

## 3. المرحلة الأولى — Tool Execution Layer

### 3.1 Error Handler

**الملف:** `src/domains/zoon-os/execution/error-handler.ts`

**الغرض:** تصنيف أي خطأ يأتي من Tool أو Webhook خارجي وتحويله إلى رسالة مفهومة
للوكيل والمستخدم.

```typescript
// src/domains/zoon-os/execution/error-handler.ts

export type ZoonErrorType =
    | "NETWORK_ERROR" // فشل الاتصال بالشبكة
    | "TIMEOUT" // انتهت مهلة الاستجابة
    | "AUTH_ERROR" // خطأ في الصلاحيات (401/403)
    | "NOT_FOUND" // المورد غير موجود (404)
    | "SERVER_ERROR" // خطأ في السيرفر الخارجي (5xx)
    | "VALIDATION_ERROR" // بيانات إدخال غير صحيحة
    | "UNKNOWN"; // خطأ غير مصنف

export interface ZoonError {
    type: ZoonErrorType;
    message: string; // رسالة للمستخدم بالعربية
    technicalDetail: string; // للـ logs التقنية فقط
    retryable: boolean; // هل تستحق إعادة المحاولة؟
    suggestion?: string; // ماذا يقترح الوكيل للمستخدم
    statusCode?: number; // HTTP status إن وُجد
}

/**
 * تصنيف الخطأ بناءً على HTTP status أو نوع الخطأ
 * يُستدعى من tool-executor.ts فقط
 */
export function classifyError(error: unknown, statusCode?: number): ZoonError {
    const msg = error instanceof Error ? error.message : String(error);

    // --- تصنيف حسب HTTP Status Code ---
    if (statusCode) {
        if (statusCode === 401 || statusCode === 403) {
            return {
                type: "AUTH_ERROR",
                message: "لا توجد صلاحية للوصول لهذه الخدمة",
                technicalDetail: msg,
                retryable: false,
                suggestion: "تحقق من إعدادات الاتصال في لوحة التحكم",
                statusCode,
            };
        }
        if (statusCode === 404) {
            return {
                type: "NOT_FOUND",
                message: "المورد المطلوب غير موجود",
                technicalDetail: msg,
                retryable: false,
                statusCode,
            };
        }
        if (statusCode === 422) {
            return {
                type: "VALIDATION_ERROR",
                message: "البيانات المُرسلة غير صحيحة أو ناقصة",
                technicalDetail: msg,
                retryable: false,
                suggestion: "تأكد من صحة البيانات المطلوبة",
                statusCode,
            };
        }
        if (statusCode >= 500) {
            return {
                type: "SERVER_ERROR",
                message: "الخدمة الخارجية تواجه مشكلة مؤقتة",
                technicalDetail: msg,
                retryable: true, // ← سيُعيد المحاولة تلقائياً
                suggestion: "سأحاول مرة أخرى تلقائياً",
                statusCode,
            };
        }
    }

    // --- تصنيف حسب نوع الخطأ ---
    if (msg === "TIMEOUT" || msg.includes("timeout")) {
        return {
            type: "TIMEOUT",
            message: "انتهت مهلة الاستجابة من الخدمة",
            technicalDetail: msg,
            retryable: true,
            suggestion: "سأحاول مجدداً، قد تكون الخدمة بطيئة مؤقتاً",
        };
    }

    if (
        msg.includes("fetch") ||
        msg.includes("network") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("ENOTFOUND")
    ) {
        return {
            type: "NETWORK_ERROR",
            message: "تعذر الاتصال بالخدمة",
            technicalDetail: msg,
            retryable: true,
            suggestion: "تحقق من اتصال الإنترنت أو حاول لاحقاً",
        };
    }

    return {
        type: "UNKNOWN",
        message: "حدث خطأ غير متوقع",
        technicalDetail: msg,
        retryable: false,
        suggestion: "إذا تكرر الخطأ، تواصل مع الدعم الفني",
    };
}

/**
 * تحويل ZoonError إلى نص يفهمه الوكيل ويعرضه للمستخدم
 */
export function errorToAgentMessage(
    error: ZoonError,
    toolName: string,
): string {
    let message = `⚠️ فشل تنفيذ "${toolName}": ${error.message}`;
    if (error.suggestion) message += `\n💡 ${error.suggestion}`;
    return message;
}
```

---

### 3.2 Retry Logic

**الملف:** `src/domains/zoon-os/execution/retry-logic.ts`

**الغرض:** إعادة محاولة تنفيذ أي دالة عند الفشل مع Exponential Backoff.

```typescript
// src/domains/zoon-os/execution/retry-logic.ts

export interface RetryConfig {
    maxAttempts: number; // عدد المحاولات القصوى
    initialDelayMs: number; // الانتظار قبل المحاولة الثانية (ms)
    backoffMultiplier: number; // مضاعف الانتظار بين كل محاولة
    maxDelayMs: number; // سقف الانتظار (لا يتجاوزه)
}

export const RETRY_PRESETS = {
    // للعمليات السريعة (APIs داخلية)
    FAST: {
        maxAttempts: 3,
        initialDelayMs: 500,
        backoffMultiplier: 2,
        maxDelayMs: 2000,
    } as RetryConfig,

    // للعمليات العادية (Webhooks خارجية)
    STANDARD: {
        maxAttempts: 3,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 8000,
    } as RetryConfig,

    // للعمليات الحساسة (تقارير، نشر)
    CAREFUL: {
        maxAttempts: 2,
        initialDelayMs: 2000,
        backoffMultiplier: 1.5,
        maxDelayMs: 5000,
    } as RetryConfig,

    // لا إعادة محاولة (HITL tools)
    NO_RETRY: {
        maxAttempts: 1,
        initialDelayMs: 0,
        backoffMultiplier: 1,
        maxDelayMs: 0,
    } as RetryConfig,
};

export type RetryResult<T> =
    | { success: true; data: T; attempts: number }
    | { success: false; error: string; attempts: number; statusCode?: number };

/**
 * تنفيذ دالة مع إعادة المحاولة عند الفشل
 *
 * @example
 * const result = await withRetry(
 *   () => fetchWeatherAPI(city),
 *   RETRY_PRESETS.STANDARD,
 *   'weatherTool'
 * )
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = RETRY_PRESETS.STANDARD,
    toolName: string,
): Promise<RetryResult<T>> {
    let lastError: Error = new Error("Unknown error");
    let lastStatusCode: number | undefined;
    let delay = config.initialDelayMs;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
        try {
            const data = await fn();
            if (attempt > 1) {
                console.info(
                    `[Zoon Retry] ✅ ${toolName} نجحت في المحاولة ${attempt}`,
                );
            }
            return { success: true, data, attempts: attempt };
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));

            // استخرج status code إن وُجد في الخطأ
            if ("statusCode" in lastError) {
                lastStatusCode =
                    (lastError as Error & { statusCode: number }).statusCode;
            }

            const isLastAttempt = attempt === config.maxAttempts;
            console.warn(
                `[Zoon Retry] ⚠️ ${toolName} — محاولة ${attempt}/${config.maxAttempts} فشلت` +
                    (isLastAttempt ? " (نهائي)" : ` — الانتظار ${delay}ms`),
            );

            if (!isLastAttempt) {
                await sleep(delay);
                // زيادة وقت الانتظار مع ضبط سقف أعلى
                delay = Math.min(
                    delay * config.backoffMultiplier,
                    config.maxDelayMs,
                );
            }
        }
    }

    return {
        success: false,
        error: lastError.message,
        attempts: config.maxAttempts,
        statusCode: lastStatusCode,
    };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
```

---

### 3.3 Tool Executor — المحرك المركزي

**الملف:** `src/domains/zoon-os/execution/tool-executor.ts`

**الغرض:** طبقة واحدة تلف كل Skills قبل تمريرها للوكيل — تضيف Timeout + Retry +
Error Classification + Logging.

```typescript
// src/domains/zoon-os/execution/tool-executor.ts

import { RETRY_PRESETS, RetryConfig, withRetry } from "./retry-logic";
import { classifyError, errorToAgentMessage, ZoonError } from "./error-handler";

export interface ToolExecutionResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: ZoonError;
    agentMessage?: string; // الرسالة التي يعرضها الوكيل للمستخدم
    executionTimeMs: number;
    attempts: number;
    toolName: string;
}

export interface ToolExecutorOptions {
    retryConfig?: RetryConfig;
    timeoutMs?: number; // افتراضي: 15000ms
    isHITL?: boolean; // إذا كانت HITL tool لا نُعيد المحاولة
    logToDb?: boolean; // حفظ سجل في قاعدة البيانات
}

/**
 * المحرك المركزي لتنفيذ أي Tool بأمان
 *
 * استخدامه في كل execute function داخل Skills:
 *
 * @example
 * execute: async (params) => {
 *   return executeToolSafely(
 *     'searchNewsTool',
 *     () => fetchNews(params.query),
 *     { retryConfig: RETRY_PRESETS.STANDARD }
 *   )
 * }
 */
export async function executeToolSafely<T>(
    toolName: string,
    fn: () => Promise<T>,
    options: ToolExecutorOptions = {},
): Promise<ToolExecutionResult<T>> {
    const startTime = Date.now();

    const {
        timeoutMs = 15_000,
        isHITL = false,
        retryConfig = isHITL ? RETRY_PRESETS.NO_RETRY : RETRY_PRESETS.STANDARD,
        logToDb = false,
    } = options;

    // إضافة Timeout لأي دالة
    const withTimeout = (): Promise<T> => {
        const timeoutError = new Error("TIMEOUT");
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(timeoutError), timeoutMs)
        );
        return Promise.race([fn(), timeoutPromise]);
    };

    // تشغيل مع Retry
    const result = await withRetry(withTimeout, retryConfig, toolName);
    const executionTimeMs = Date.now() - startTime;

    if (result.success) {
        // سجّل النجاح إذا طُلب
        if (logToDb) {
            await logExecution(
                toolName,
                "success",
                executionTimeMs,
                result.attempts,
            );
        }

        return {
            success: true,
            data: result.data,
            executionTimeMs,
            attempts: result.attempts,
            toolName,
        };
    }

    // تصنيف الخطأ
    const error = classifyError(result.error, result.statusCode);
    const agentMessage = errorToAgentMessage(error, toolName);

    // سجّل الفشل دائماً
    console.error(
        `[Zoon Executor] ❌ ${toolName} فشل نهائياً | ` +
            `النوع: ${error.type} | الوقت: ${executionTimeMs}ms | ` +
            `التفاصيل: ${error.technicalDetail}`,
    );

    if (logToDb) {
        await logExecution(
            toolName,
            "error",
            executionTimeMs,
            result.attempts,
            error,
        );
    }

    return {
        success: false,
        error,
        agentMessage,
        executionTimeMs,
        attempts: result.attempts,
        toolName,
    };
}

// ---- مساعد: حفظ سجل التنفيذ في Supabase ----
async function logExecution(
    toolName: string,
    status: "success" | "error",
    durationMs: number,
    attempts: number,
    error?: ZoonError,
) {
    try {
        // TODO: استبدل بـ Supabase client الخاص بالمشروع
        // await supabase.from('tool_execution_logs').insert({
        //   tool_name: toolName,
        //   status,
        //   duration_ms: durationMs,
        //   attempts,
        //   error_type: error?.type,
        //   error_detail: error?.technicalDetail,
        //   created_at: new Date().toISOString()
        // })
        console.debug(
            `[Log] ${toolName} | ${status} | ${durationMs}ms | attempts: ${attempts}`,
        );
    } catch {
        // لا نريد أن يفشل السجل ويؤثر على الـ Tool
        console.warn("[Zoon Log] فشل حفظ سجل التنفيذ");
    }
}
```

---

### كيفية استخدام Tool Executor في الـ Skills الموجودة

قبل التحديث، كانت الـ Skills تنفذ مباشرة:

```typescript
// ❌ قبل — بدون حماية
execute: (async ({ query }) => {
    const res = await fetch(`https://news-api.com?q=${query}`);
    return res.json(); // إذا فشل fetch، الوكيل ينهار
});
```

بعد التحديث، تصبح:

```typescript
// ✅ بعد — محمي بالكامل
import { executeToolSafely } from "../execution/tool-executor";
import { RETRY_PRESETS } from "../execution/retry-logic";

execute: (async ({ query }) => {
    const result = await executeToolSafely(
        "searchNewsTool",
        () => fetch(`https://news-api.com?q=${query}`).then((r) => r.json()),
        { retryConfig: RETRY_PRESETS.STANDARD, timeoutMs: 10_000 },
    );

    if (!result.success) {
        // الوكيل يتلقى رسالة مفهومة بدلاً من exception
        return { error: result.agentMessage };
    }

    return result.data;
});
```

---

## 4. Auto Router

**الملف:** `src/domains/zoon-os/router/auto-router.ts`

**الغرض:** تصنيف طلب المستخدم وتحميل فقط الـ Skills المناسبة، مما يوفر tokens
ويسرّع الاستجابة.

```
المستخدم يكتب: "أرسل تنبيه للمنديب رقم 5"
          ↓
     Auto Router
          ↓
  يكتشف: فئة 'delivery'
          ↓
  يحمّل فقط: [getDeliveryStatusTool, reassignOrderTool, telegramTool]
          ↓
  يُمرّر للـ LLM مع 3 tools فقط بدلاً من 20
```

```typescript
// src/domains/zoon-os/router/auto-router.ts

// خريطة الكلمات المفتاحية لكل فئة
const CATEGORY_KEYWORDS = {
    news: ["خبر", "أخبار", "نشر", "إعلان", "اعلان", "اعلن", "أعلن"],
    delivery: [
        "مندوب",
        "طلب",
        "تسليم",
        "توصيل",
        "متأخر",
        "تأخر",
        "أسند",
        "سائق",
    ],
    reports: ["تقرير", "إحصاء", "احصاء", "ملخص", "أداء", "تحليل", "إجمالي"],
    messaging: ["رسالة", "أرسل", "ارسل", "تنبيه", "تليجرام", "غرفة", "نادي"],
    system: ["مهارة", "أداة", "إعداد", "تفعيل", "إضافة", "بناء"],
} as const;

export type SkillCategory = keyof typeof CATEGORY_KEYWORDS | "general";

// خريطة الفئة ← الـ Skills المناسبة لها
export const CATEGORY_SKILLS: Record<string, string[]> = {
    news: [
        "searchNewsTool",
        "alexDialectTool",
        "publishToRoomTool",
        "telegramTool",
    ],
    delivery: ["getDeliveryStatusTool", "reassignOrderTool", "telegramTool"],
    reports: ["generateReportTool", "getAnalyticsTool", "telegramTool"],
    messaging: ["telegramTool", "publishToRoomTool"],
    system: ["skillBuilderTool"],
    general: [], // يحمّل كل الـ Skills (fallback)
};

export interface RouterResult {
    category: SkillCategory;
    confidence: number; // 0 إلى 1
    suggestedSkills: string[];
    reasoning: string; // للـ debugging
}

export function autoRoute(userMessage: string): RouterResult {
    const msg = userMessage;

    const scores: Partial<Record<SkillCategory, number>> = {};

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        const matches = keywords.filter((kw) => msg.includes(kw));
        if (matches.length > 0) {
            scores[category as SkillCategory] = matches.length;
        }
    }

    // إذا لم يُصنَّف شيء، أعد general
    const entries = Object.entries(scores);
    if (entries.length === 0) {
        return {
            category: "general",
            confidence: 0,
            suggestedSkills: [],
            reasoning: "لم يُكتشف تطابق — تحميل كل الـ Skills",
        };
    }

    // اختر الفئة الأعلى نقاطاً
    const [topCategory, topScore] = entries.sort(([, a], [, b]) => b - a)[0];
    const confidence = Math.min(topScore / 3, 1); // normalize: 3+ matches = confidence 1.0

    return {
        category: topCategory as SkillCategory,
        confidence,
        suggestedSkills: CATEGORY_SKILLS[topCategory] ?? [],
        reasoning: `تطابق ${topScore} كلمة مفتاحية في فئة "${topCategory}"`,
    };
}
```

---

## 5. Agent Memory

**الملف:** `src/domains/zoon-os/memory/context-store.ts`

**الغرض:** حفظ واسترجاع سياق المستخدم عبر الجلسات — يجعل الوكيل يتذكر التفضيلات
والمهام السابقة.

```typescript
// src/domains/zoon-os/memory/context-store.ts
import { createClient } from "@supabase/supabase-js";

// أنواع الذاكرة
export type MemoryType =
    | "preference" // تفضيل دائم: "يفضل التقارير صباحاً"
    | "task" // مهمة جارية: "كان يعمل على تقرير الأمس"
    | "conversation"; // ملخص محادثة: "طلب الأسبوع الماضي X"

export interface MemoryEntry {
    type: MemoryType;
    summary: string; // نص قصير للوكيل
    metadata?: Record<string, unknown>; // بيانات إضافية
    expiresAt?: Date; // تنتهي صلاحيتها متى؟
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
);

/**
 * حفظ معلومة في ذاكرة المستخدم
 */
export async function saveMemory(
    userId: string,
    entry: MemoryEntry,
): Promise<void> {
    await supabase.from("agent_memory").insert({
        user_id: userId,
        memory_type: entry.type,
        summary: entry.summary,
        metadata: entry.metadata ?? {},
        expires_at: entry.expiresAt?.toISOString() ?? null,
    });
}

/**
 * استرجاع الذاكرة الحديثة وتحويلها لنص يُحقن في System Prompt
 */
export async function getMemoryContext(
    userId: string,
    limit = 10,
): Promise<string> {
    const { data, error } = await supabase
        .from("agent_memory")
        .select("memory_type, summary, created_at")
        .eq("user_id", userId)
        .or("expires_at.is.null,expires_at.gt.now()")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error || !data?.length) return "";

    const memories = data.map((m) => `- [${m.memory_type}] ${m.summary}`).join(
        "\n",
    );

    return `\n## ذاكرة المستخدم (استخدمها للسياق):\n${memories}\n`;
}

/**
 * حذف الذاكرة المنتهية الصلاحية — يُستدعى من Cron Job
 */
export async function cleanExpiredMemory(): Promise<void> {
    await supabase
        .from("agent_memory")
        .delete()
        .lt("expires_at", new Date().toISOString());
}
```

### 5.1 الإثراء السياقي (Context Enrichment)

**الملف:** `src/domains/zoon-os/context/system-context.ts`

**الغرض:** تغذية وكيل Zoon ببيانات حية وحديثة حول حالة النظام المعمول به حالياً
مع كل استدعاء، ليكون متصلاً باللحظة الحالية.

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getEnrichedSystemContext(): Promise<string> {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // بداية اليوم

        // جلب عدد طلبات اليوم كإحصائية سريعة
        const ordersCount = await prisma.delivery_orders.count({
            where: { created_at: { gte: today } },
        });

        // جلب إجمالي المبيعات
        const totalRevenue = await prisma.delivery_orders.aggregate({
            _sum: { actual_total_amount: true },
            where: {
                created_at: { gte: today },
                status: { in: ["completed"] },
            },
        });

        const revenueAmount =
            totalRevenue._sum?.actual_total_amount?.toString() || "0";
        const currentTime = new Date().toLocaleString("ar-EG", {
            timeZone: "Africa/Cairo",
        });

        return `
    <system_status>
    حالة النظام الحية الآن:
    - الوقت والتاريخ: ${currentTime}
    - عدد الطلبات التي تم إنشاؤها اليوم: ${ordersCount} طلب
    - إجمالي المبيعات المكتملة اليوم: ${revenueAmount} ج.م
    </system_status>
    `;
    } catch (error) {
        return `<system_status>الوقت الحالي: ${
            new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })
        } | حالة قاعدة البيانات: تتأخر قليلاً في الاستجابة.</system_status>`;
    }
}
```

---

## 6. المرحلة الثانية — Incoming Webhooks

**الملف:** `app/api/webhooks/[userId]/route.ts`

**الغرض:** كل مستخدم لديه endpoint خاص يستقبل أحداثاً من الأنظمة الخارجية ويُطلق
الوكيل تلقائياً.

```
نظام المناديب يكتشف تأخر مندوب
          ↓
POST /api/webhooks/{userId}/delivery-alert
          ↓
Webhook Processor يتلقى الحدث
          ↓
يستدعي Zoon Agent تلقائياً مع السياق
          ↓
الوكيل يُرسل تنبيه للمندوب + يُبلّغ المدير في الشات
```

```typescript
// app/api/webhooks/[userId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { processWebhookEvent } from "@/domains/zoon-os/webhooks/webhook-processor";
import { verifyWebhookSignature } from "@/domains/zoon-os/webhooks/security";

export async function POST(
    req: NextRequest,
    { params }: { params: { userId: string } },
) {
    const { userId } = params;
    const body = await req.json();

    // 1. التحقق من صحة الطلب (HMAC signature)
    const signature = req.headers.get("x-webhook-signature");
    const isValid = await verifyWebhookSignature(body, signature, userId);
    if (!isValid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    processWebhookEvent(userId, body).catch(console.error);

    return NextResponse.json({ received: true }, { status: 200 });
}
```

### 6.1 الـ Webhooks الداخلية (Internal Functions)

عندما ترغب بأن يقوم الوكيل بالوصول لبيانات خاصة من الداتابيز بصورة ديناميكية، لا
تضع الكود بداخل السورس كود الأساسي ولا تستخدم Webhook خارجي بعيد، قم ببناء
`Internal Endpoint`. هذا يجعل כל شيء يعمل عبر الـ Webhook ويجمع كل العمليات في
مسار موحد ويفتح المجال للوحة التحكم (الواجهة) لربط المهارات.

```typescript
// مثال: app/api/internal/delayed-drivers/route.ts

// في الواجهة: يضع المدير هذا الرابط في URL المهارة
// "https://your-domain.com/api/internal/delayed-drivers"

export async function POST(req: Request) {
    const { minutesThreshold } = await req.json();
    // قراءة مباشرة من Prisma
    const drivers = await prisma.delivery_boys.findMany({
        where: {/* شروط التأخير */},
    });
    return Response.json({ drivers });
}
```

بهذه الطريقة، كل المهارات تظل "Webhooks"، سواء داخلية (تقرأ الداتابيز فوراً) أو
خارجية (أنظمة ثالثة).

### 6.2 الدالة `triggerZoonAgent` (قلب المرحلة الثانية)

**الملف:** `src/domains/zoon-os/webhooks/trigger-agent.ts`

هذه الدالة هي الحلقة المفقودة في عملية المرحلة الثانية. تستدعي وكيل Zoon في
الخلفية عبر HTTP Call داخلي بدون فتح واجهة مستخدم.

```typescript
// src/domains/zoon-os/webhooks/trigger-agent.ts

export async function triggerZoonAgent(
    userId: string,
    prompt: string,
): Promise<void> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    try {
        const response = await fetch(`${appUrl}/api/zoon`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // 'x-internal-key': process.env.INTERNAL_API_KEY!  (يُضاف لاحقاً للحماية)
            },
            body: JSON.stringify({
                userId,
                messages: [{ role: "user", content: prompt }],
                isBackground: true, // علامة: لا يحتاج stream للواجهة
            }),
        });

        if (!response.ok) {
            console.error(
                "[triggerZoonAgent] ❌ فشل الاتصال بوكيل Zoon:",
                await response.text(),
            );
        } else {
            console.info(
                "[triggerZoonAgent] ✅ تم استدعاء وكيل Zoon بنجاح في الخلفية",
            );
        }
    } catch (error) {
        console.error(
            "[triggerZoonAgent] ❌ حدث خطأ أثناء استدعاء وكيل Zoon:",
            error,
        );
    }
}
```

```typescript
// src/domains/zoon-os/webhooks/webhook-processor.ts

export interface WebhookPayload {
    event: string; // نوع الحدث: 'delivery.delayed', 'order.failed'
    data: Record<string, unknown>;
    timestamp: string;
}

export async function processWebhookEvent(
    userId: string,
    payload: WebhookPayload,
): Promise<void> {
    console.info(`[Webhook] مستخدم ${userId} | الحدث: ${payload.event}`);

    // بناء رسالة سياقية للوكيل
    const agentPrompt = buildPromptFromEvent(payload);

    // استدعاء Zoon Agent مع الحدث
    await triggerZoonAgent(userId, agentPrompt);
}

function buildPromptFromEvent(payload: WebhookPayload): string {
    const eventMessages: Record<
        string,
        (data: Record<string, unknown>) => string
    > = {
        "delivery.delayed": (d) =>
            `تنبيه تلقائي: المندوب رقم ${d.driverId} متوقف منذ ${d.minutesStopped} دقيقة في ${d.location}. راجع الوضع وأرسل تنبيهاً مناسباً.`,
        "order.failed": (d) =>
            `تنبيه تلقائي: فشل تسليم الطلب رقم ${d.orderId}. السبب: ${d.reason}. اقترح الحل المناسب.`,
    };

    const builder = eventMessages[payload.event];
    return builder
        ? builder(payload.data)
        : `حدث جديد: ${payload.event} — البيانات: ${
            JSON.stringify(payload.data)
        }`;
}
```

---

## 7. المرحلة الثالثة — Zoon Triggers (المشغلات)

**الغرض:** تشغيل الوكيل تلقائياً بناءً على شروط أو جداول زمنية أو أحداث، ليكون
استباقياً.

يوجد 3 أنواع رئيسية من المشغلات، تُدار كلها عن طريق لوحة التحكم:

1. **Scheduled Triggers (المجدولة):** تعمل بناءً على وقت معين
   (`cron expression`).
   - _مثال:_ "كل يوم 8 صباحاً أرسل تقرير". ✅ (تم بناؤه عبر `zoon-scheduler`).
2. **Event Triggers (الحدثية):** تعمل عندما يصل إشعار/Webhook.
   - _مثال:_ "المندوب تأخر". ✅ (تم بناؤه عبر `processWebhookEvent`).
3. **Condition Triggers (الشرطية):** أقوى الأنواع، الوكيل يراقب الداتابيز ويفعل
   إجراء إذا تحقق الشرط.
   - _مثال:_ "إذا تجاوزت الطلبات 100 طلب، احتفل في جروب التليجرام".

للتعامل مع الـ Condition Triggers مستقبلاً في قاعدة البيانات:

```sql
ALTER TABLE scheduled_triggers ADD COLUMN trigger_type TEXT
  DEFAULT 'scheduled' CHECK (trigger_type IN ('scheduled', 'condition'));

ALTER TABLE scheduled_triggers ADD COLUMN condition_query TEXT;
ALTER TABLE scheduled_triggers ADD COLUMN condition_operator TEXT; -- '>', '<', '='
ALTER TABLE scheduled_triggers ADD COLUMN condition_value INTEGER;
```

**الملف:** `src/app/api/cron/zoon-scheduler/route.ts`

هذا المسار مدعوم بالفلترة الكاملة ويجلب فقط المهام التي حان وقتها.

```typescript
// src/app/api/cron/zoon-scheduler/route.ts
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { PrismaClient } from "@prisma/client";
import { telegramTool } from "@/domains/zoon-os/skills/telegramTool";
import { publishToRoomTool } from "@/domains/zoon-os/skills/publishToRoomTool";
import { getEnrichedSystemContext } from "@/domains/zoon-os/context/system-context";
import parseExpression from "cron-parser"; // npm install cron-parser

export const maxDuration = 60;
const prisma = new PrismaClient();
const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

export async function GET(req: Request) {
    try {
        // 1. جلب المهام النشطة من قاعدة البيانات
        const allActiveTasks = await (prisma as any).scheduled_triggers
            .findMany({
                where: { is_active: true },
            });

        if (allActiveTasks.length === 0) {
            return NextResponse.json({
                message: "No active scheduled tasks found.",
            });
        }

        // 2. ✅ فلترة المهام لمعرفة التي حان موعدها (Cron Matching)
        const now = new Date();
        const activeTasks = allActiveTasks.filter((task: any) => {
            try {
                const interval = (parseExpression as any).parseExpression
                    ? (parseExpression as any).parseExpression(
                        task.cron_expression,
                    )
                    : (parseExpression as any)(task.cron_expression);
                const prevExecutionTime = interval.prev().toDate().getTime();
                // إذا مر أقل من دقيقتين على الموعد المجدول → نفّذ
                return (now.getTime() - prevExecutionTime) < (2 * 60 * 1000) &&
                    (now.getTime() - prevExecutionTime) >= 0;
            } catch {
                return false; // تجاهل cron غير الصالح
            }
        });

        if (activeTasks.length === 0) {
            return NextResponse.json({
                message: "No tasks to run at this time.",
            });
        }

        // 3. جلب بيانات النظام الحية وتشغيل الوكيل
        const systemEnrichment = await getEnrichedSystemContext();
        const executionResults = [];

        for (const task of activeTasks) {
            try {
                const result = await generateText({
                    model: google("gemini-2.5-flash-lite"),
                    system:
                        `أنت Zoon OS Agent Background Worker. مهمتك: ${task.task_name}. ${systemEnrichment}`,
                    prompt: task.prompt_template,
                    tools: {
                        telegram: telegramTool,
                        publishToRoom: publishToRoomTool,
                    },
                });
                await (prisma as any).scheduled_triggers.update({
                    where: { id: task.id },
                    data: { last_run_at: new Date() },
                });
                executionResults.push({
                    task: task.task_name,
                    status: "success",
                    agent_thought: result.text,
                });
            } catch (taskError: any) {
                executionResults.push({
                    task: task.task_name,
                    status: "error",
                    error: taskError.message,
                });
            }
        }

        return NextResponse.json({ success: true, results: executionResults });
    } catch (error: any) {
        return NextResponse.json({
            error: error?.message || "Internal Server Error",
        }, { status: 500 });
    }
}
```

طريقة إضافة مهمة جديدة للجدول من Supabase:

```sql
INSERT INTO public.scheduled_triggers (task_name, description, cron_expression, prompt_template, is_active)
VALUES (
  'التقرير اليومي للمبيعات', 
  'مهمة لجمع عدد الطلبات وإجمالي المبيعات، وإرسالها عبر التليجرام والغرفة.',
  '0 22 * * *', 
  'قُم بكتابة تقرير موجز واحترافي موجه للإدارة عن أرباح اليوم وعدد الطلبات. ثم أرسله عبر publishToRoom و telegram.', 
  true
);
```

---

## 8. تحديث Route الرئيسي

**الملف:** `app/api/zoon/route.ts`

هذا هو الملف الذي يربط كل الطبقات معاً:

```typescript
// app/api/zoon/route.ts

import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { autoRoute } from "@/domains/zoon-os/router/auto-router";
import {
    getMemoryContext,
    saveMemory,
} from "@/domains/zoon-os/memory/context-store";
import {
    filterSkillsByCategory,
    loadAllSkills,
} from "@/domains/zoon-os/skills";
import { loadDynamicSkills } from "@/domains/zoon-os/skills/dynamic-loader";

export async function POST(req: Request) {
    const { messages, userId } = await req.json();
    const lastMessage = messages.at(-1)?.content ?? "";

    // 1. Auto Router — تصنيف الطلب
    const route = autoRoute(lastMessage);
    console.info(
        `[Route] الفئة: ${route.category} | الثقة: ${route.confidence}`,
    );

    // 2. تحميل الذاكرة والـ Skills بالتوازي
    const [memoryContext, staticSkills, dynamicSkills] = await Promise.all([
        getMemoryContext(userId),
        loadAllSkills(),
        loadDynamicSkills(), // من Supabase
    ]);

    // 3. تصفية الـ Skills حسب الفئة (توفير tokens)
    const relevantSkills = route.category !== "general"
        ? filterSkillsByCategory(
            [...staticSkills, ...dynamicSkills],
            route.suggestedSkills,
        )
        : [...staticSkills, ...dynamicSkills];

    // 4. بناء System Prompt مع الذاكرة
    const systemPrompt = buildSystemPrompt(memoryContext);

    // 5. تشغيل الوكيل
    const result = await streamText({
        model: google("gemini-2.5-flash-preview-04-17"),
        system: systemPrompt,
        tools: relevantSkills,
        messages,
        maxSteps: 5, // الحد الأقصى لـ Tool calls في رد واحد
        onFinish: async ({ text }) => {
            // حفظ ملخص المحادثة في الذاكرة
            if (text.length > 100) {
                await saveMemory(userId, {
                    type: "conversation",
                    summary: text.slice(0, 200) + "...",
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // أسبوع
                });
            }
        },
    });

    return result.toDataStreamResponse();
}

function buildSystemPrompt(memoryContext: string): string {
    return `أنت Zoon، مساعد ذكي متخصص في إدارة منصة التوصيل.
تتحدث بالعربية دائماً. عند الفشل، أخبر المستخدم بأسلوب مهذب ومقترح للحل.
للعمليات الحساسة (نشر، إرسال رسائل)، اعرض المسودة واطلب التأكيد.
${memoryContext}`;
}
```

---

## 9. قاعدة البيانات — Supabase Schema

```sql
-- ذاكرة الوكيل
CREATE TABLE agent_memory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('preference', 'task', 'conversation')),
  summary     TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_memory_user_id ON agent_memory(user_id);
CREATE INDEX idx_memory_expires ON agent_memory(expires_at) WHERE expires_at IS NOT NULL;

-- سجل تنفيذ الأدوات (للـ Audit والـ Debugging)
CREATE TABLE tool_execution_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name     TEXT NOT NULL,
  user_id       TEXT,
  status        TEXT NOT NULL CHECK (status IN ('success', 'error')),
  duration_ms   INTEGER NOT NULL,
  attempts      INTEGER DEFAULT 1,
  error_type    TEXT,
  error_detail  TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_logs_tool_name ON tool_execution_logs(tool_name);
CREATE INDEX idx_logs_created ON tool_execution_logs(created_at);

-- إعدادات الـ Webhooks لكل مستخدم
CREATE TABLE user_webhooks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  trigger_name  TEXT NOT NULL,        -- 'delivery.delayed', 'order.failed'
  secret_key    TEXT NOT NULL,        -- للتحقق من HMAC
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, trigger_name)
);

-- الـ Scheduled Triggers لكل مستخدم
CREATE TABLE scheduled_triggers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  name          TEXT NOT NULL,        -- 'daily-report'
  cron_expr     TEXT NOT NULL,        -- '0 8 * * *'
  prompt        TEXT NOT NULL,        -- الأمر المُرسل للوكيل
  is_active     BOOLEAN DEFAULT true,
  last_run_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- إدارة الـ System Prompts (التحكم بشخصية النظام مع الاحتفاظ بالنسخ - Versioning)
CREATE TABLE system_prompts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version     INTEGER NOT NULL,
  content     TEXT NOT NULL,
  is_active   BOOLEAN DEFAULT false,
  created_by  TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- دالة (Trigger Function) لضمان أن نسخة واحدة فقط من الـ Prompt تكون الفعالة
CREATE OR REPLACE FUNCTION ensure_single_active_prompt()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE system_prompts SET is_active = false
    WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_active_prompt
BEFORE INSERT OR UPDATE ON system_prompts
FOR EACH ROW EXECUTE FUNCTION ensure_single_active_prompt();
```

---

## 10. Skills Categories System

تنظيم الـ Skills في فئات مرئية للمستخدمين (مثل Skywork):

```typescript
// src/domains/zoon-os/skills/categories.ts

export const SKILL_CATEGORIES_UI = [
    {
        id: "delivery",
        label: "إدارة المناديب",
        icon: "🚴",
        skills: [
            "getDeliveryStatusTool",
            "reassignOrderTool",
            "trackDriverTool",
        ],
    },
    {
        id: "news",
        label: "الأخبار والمحتوى",
        icon: "📰",
        skills: ["searchNewsTool", "alexDialectTool", "publishToRoomTool"],
    },
    {
        id: "messaging",
        label: "الرسائل والتنبيهات",
        icon: "💬",
        skills: ["telegramTool", "publishToRoomTool"],
    },
    {
        id: "reports",
        label: "التقارير والتحليل",
        icon: "📊",
        skills: ["generateReportTool", "getAnalyticsTool"],
    },
    {
        id: "system",
        label: "إعدادات النظام",
        icon: "⚙️",
        skills: ["skillBuilderTool"],
        adminOnly: true, // تظهر فقط للمديرين
    },
];
```

---

## 11. خطة التنفيذ الأسبوعية

```
الأسبوع 1 — الأساس (المرحلة 1)
├── اليوم 1-2:  error-handler.ts + retry-logic.ts + اختبارات وحدة
├── اليوم 3:    tool-executor.ts + لفّ الـ Skills الموجودة
├── اليوم 4:    auto-router.ts + تحديث route.ts
└── اليوم 5-7:  agent_memory schema + context-store.ts + اختبار شامل

الأسبوع 2 — الاستباقية (المرحلة 2)
├── اليوم 1-2:  Webhook endpoint + security (HMAC)
├── اليوم 3-4:  webhook-processor.ts + ربط بالوكيل
└── اليوم 5-7:  اختبار سيناريو المنديب المتأخر كاملاً

الأسبوع 3 — الأتمتة (المرحلة 3)
├── اليوم 1-2:  Vercel Cron Jobs + التقرير اليومي
├── اليوم 3-4:  Scheduled Triggers من قاعدة البيانات
└── اليوم 5-7:  واجهة إدارة الـ Triggers للمدير

الأسبوع 4 — الصقل
├── Skills Categories UI (مثل Skywork)
├── Execution Logs Dashboard
└── اختبارات End-to-End كاملة
```

---

## 12. معايير الجودة والاختبار

### اختبار Error Handler

```typescript
// tests/error-handler.test.ts
import { classifyError } from "../execution/error-handler";

describe("classifyError", () => {
    it("يصنف 401 كـ AUTH_ERROR غير قابل للإعادة", () => {
        const err = classifyError(new Error("Unauthorized"), 401);
        expect(err.type).toBe("AUTH_ERROR");
        expect(err.retryable).toBe(false);
    });

    it("يصنف 500 كـ SERVER_ERROR قابل للإعادة", () => {
        const err = classifyError(new Error("Internal Server Error"), 500);
        expect(err.type).toBe("SERVER_ERROR");
        expect(err.retryable).toBe(true);
    });

    it("يصنف TIMEOUT بشكل صحيح", () => {
        const err = classifyError(new Error("TIMEOUT"));
        expect(err.type).toBe("TIMEOUT");
        expect(err.retryable).toBe(true);
    });
});
```

### اختبار Auto Router

```typescript
// tests/auto-router.test.ts
import { autoRoute } from "../router/auto-router";

describe("autoRoute", () => {
    it("يصنف رسائل المناديب بثقة عالية", () => {
        const result = autoRoute("المندوب رقم 5 متأخر في التسليم");
        expect(result.category).toBe("delivery");
        expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("يرجع general عند عدم التطابق", () => {
        const result = autoRoute("مرحباً كيف حالك");
        expect(result.category).toBe("general");
    });
});
```

### Checklist قبل كل Deployment

- [ ] كل Tool جديدة ملفوفة بـ `executeToolSafely`
- [ ] HITL Tools لا تملك `execute` function مباشرة
- [ ] كل Webhook endpoint يتحقق من HMAC Signature
- [ ] الـ Cron endpoint يتحقق من `CRON_SECRET`
- [ ] `agent_memory` يحتوي `expires_at` لتجنب تراكم البيانات
- [ ] `tool_execution_logs` لا تحتوي بيانات حساسة (passwords, tokens)

---

## 13. خريطة لوحة تحكم Zoon OS (الواجهة الجديدة)

تم تحويل جميع إعدادات النظام من الكود إلى واجهة رسومية موحدة تحت مسار `/admin/ai-settings`.

### 🔗 الروابط السريعة للمديرين:
*   **مركز التحكم:** [`/admin/ai-settings`](file:///src/app/admin/ai-settings/page.tsx)
*   **إدارة المهارات:** [`/admin/ai-settings/skills`](file:///src/app/admin/ai-settings/skills/page.tsx)
*   **إدارة المشغلات:** [`/admin/ai-settings/triggers`](file:///src/app/admin/ai-settings/triggers/page.tsx)
*   **تحرير الشخصية:** [`/admin/ai-settings/prompts`](file:///src/app/admin/ai-settings/prompts/page.tsx)
*   **سجلات التنفيذ:** [`/admin/ai-settings/logs`](file:///src/app/admin/ai-settings/logs/page.tsx)

### 🛠️ كيفية الإدارة من الواجهة:

1.  **إضافة مهارة جديدة:** اذهب إلى "مكتبة المهارات"، أدخل رابط الـ Webhook وقم بتعريف الـ JSON Schema. سيقوم الوكيل بالتعرف عليها فوراً واستخدامها عند الحاجة.
2.  **تغيير توجيهات الوكيل:** استخدم "تحرير الشخصية". يمكنك كتابة نسخة جديدة وحفظها، ثم تفعيلها بضغطة زر. النظام يحتفظ بكل النسخ السابقة للرجوع إليها.
3.  **جدولة تقرير تليجرام:** اذهب إلى "مشغلات المهام"، أضف تعبير Cron (مثل `0 9 * * *`) واكتب البرومبت (مثلاً: "ادرس مبيعات الأمس وأرسل ملخصاً لغرفة الإدارة").
4.  **تتبع الأداء:** من "سجلات التنفيذ"، يمكنك رؤية كل أداة استدعاها الوكيل، كم استغرقت من الوقت، وهل نجحت أم فشلت مع عرض تفاصيل الخطأ التقني.

---

> **تنبيه أمني:** تأكد من إضافة `CRON_SECRET` و `INTERNAL_API_KEY` في ملف `.env` الخاص ببيئة الإنتاج لحماية هذه المسارات.

---

_آخر تحديث: مارس 2026 | Zoon OS v1.1 Control Center Update_
