# Zoon OS — Advanced Reliability Guide
### دليل الموثوقية المتقدمة v1.0
#### من Beta إلى Production بدون فقدان بيانات أو أخطاء صامتة

> **العلاقة بالمستند الأساسي:** هذا المستند يكمل `zoon-os-function-system.md`. المستند الأساسي يشرح **كيف يعمل النظام**، هذا المستند يشرح **كيف يصمد النظام** تحت الضغط وعند الفشل.

> **متى تقرأ هذا المستند؟** عندما تكون جاهزاً للانتقال من Beta إلى Staging/Production — أي بعد اكتمال المرحلتين الأولى والثانية من `Production Roadmap` (القسم 16 في المستند الأساسي).

---

## 📋 فهرس المحتويات

1. [المشكلات الثلاث الحقيقية](#1-المشكلات-الثلاث-الحقيقية)
2. [Idempotency Keys — منع التكرار](#2-idempotency-keys--منع-التكرار)
3. [Dead Letter Queue — لا بيانات تضيع](#3-dead-letter-queue--لا-بيانات-تضيع)
4. [Distributed Tracing — تتبع كل خطوة](#4-distributed-tracing--تتبع-كل-خطوة)
5. [Pipeline Versioning — إدارة الإصدارات](#5-pipeline-versioning--إدارة-الإصدارات)
6. [تحسينات Rate Limiting و Alerting](#6-تحسينات-rate-limiting-و-alerting)
7. [قاعدة البيانات — Schema الكامل](#7-قاعدة-البيانات--schema-الكامل)
8. [دمج كل شيء في Pipeline Engine](#8-دمج-كل-شيء-في-pipeline-engine)
9. [خطة التطبيق الأسبوعية](#9-خطة-التطبيق-الأسبوعية)
10. [مقارنة مع الأنظمة التجارية](#10-مقارنة-مع-الأنظمة-التجارية)

---

## 1. المشكلات الثلاث الحقيقية

قبل أي كود، فهم المشكلة هو الأهم:

### المشكلة 1: التكرار غير المقصود
```
السيناريو:
Pipeline تشغّل send-telegram ✅
الشبكة تنقطع قبل تسجيل النجاح ❌
النظام يُعيد المحاولة
→ send-telegram تُرسل مرة ثانية!
→ المدير يرى تقريرين متطابقين في التليجرام

الخطر: فقدان الثقة بالنظام
الحل: Idempotency Keys
```

### المشكلة 2: الفشل الصامت
```
السيناريو:
Pipeline تقرير شهري فشلت بعد 3 محاولات
النظام يتوقف بصمت
لا أحد يعرف أن التقرير لم يُرسل
المدير يتخذ قرارات بناءً على بيانات مفقودة

الخطر: قرارات خاطئة بسبب بيانات مفقودة
الحل: Dead Letter Queue
```

### المشكلة 3: التشخيص المستحيل
```
السيناريو:
Pipeline من 5 خطوات فشلت في الخطوة 3
المطور يبحث في logs متفرقة
يضيع ساعات ليفهم ماذا حدث بالضبط

الخطر: وقت طويل لإصلاح الأخطاء
الحل: Distributed Tracing
```

---

## 2. Idempotency Keys — منع التكرار

### 2.1 الفكرة

```
Idempotency = تنفيذ العملية مرات عديدة يُنتج نفس النتيجة

مثال:
إرسال تليجرام بـ key="report-march-2026"
→ المرة الأولى: يُرسل ✅
→ المرة الثانية: يتجاهل (تم من قبل) ✅
→ النتيجة: رسالة واحدة فقط دائماً
```

### 2.2 تحديث PipelineStep

```typescript
// في pipeline/pipeline-engine.ts

export interface PipelineStep {
  nodeId: string
  params: Record<string, unknown>
  inputFrom?: number
  retryOnFailure?: number
  retryDelayMs?: number
  rollbackHandler?: string
  idempotencyKey?: string    // ← جديد: مفتاح فريد للخطوة
}
```

### 2.3 منطق التحقق

```typescript
// src/domains/zoon-os/functions/idempotency/idempotency-store.ts

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export interface IdempotencyRecord {
  key: string
  nodeId: string
  result: unknown
  createdAt: string
}

/**
 * هل تم تنفيذ هذه العملية من قبل؟
 * يحفظ النتيجة لمدة 24 ساعة
 */
export async function checkIdempotency(
  key: string
): Promise<{ executed: boolean; result?: unknown }> {
  try {
    const { data } = await supabase
      .from('idempotency_records')
      .select('result, created_at')
      .eq('key', key)
      .eq('status', 'success')
      .single()

    if (!data) return { executed: false }

    // التحقق أن السجل لم يتجاوز 24 ساعة
    const age = Date.now() - new Date(data.created_at).getTime()
    const maxAge = 24 * 60 * 60 * 1000  // 24 ساعة

    if (age > maxAge) {
      // السجل قديم — يُسمح بإعادة التنفيذ
      await supabase.from('idempotency_records').delete().eq('key', key)
      return { executed: false }
    }

    return { executed: true, result: data.result }
  } catch {
    // عند الشك — نفّذ (أفضل من تخطي عملية مهمة)
    return { executed: false }
  }
}

/**
 * تسجيل نجاح العملية
 */
export async function markAsExecuted(
  key: string,
  nodeId: string,
  result: unknown
): Promise<void> {
  await supabase.from('idempotency_records').upsert({
    key,
    node_id: nodeId,
    result: JSON.stringify(result),
    status: 'success',
    created_at: new Date().toISOString()
  })
}
```

### 2.4 دمجه في Pipeline Engine

```typescript
// في runPipeline — داخل حلقة الخطوات:

for (let i = 0; i < steps.length; i++) {
  const step = steps[i]

  // ===== فحص Idempotency =====
  if (step.idempotencyKey) {
    const { executed, result: cachedResult } = await checkIdempotency(step.idempotencyKey)

    if (executed) {
      console.log(`[Pipeline] ⏭️ تخطي ${step.nodeId} — تم تنفيذه من قبل (key: ${step.idempotencyKey})`)
      results.push({
        nodeId: step.nodeId,
        success: true,
        data: cachedResult,
        summary: 'تم تنفيذه من قبل — تم التخطي',
        durationMs: 0,
        skipped: true
      })
      previousOutput = cachedResult
      continue
    }
  }

  // ... تنفيذ الخطوة الاعتيادي

  // ===== تسجيل النجاح في Idempotency Store =====
  if (result.success && step.idempotencyKey) {
    await markAsExecuted(step.idempotencyKey, step.nodeId, result.data)
  }
}
```

### 2.5 مثال استخدام عملي

```json
{
  "mode": "pipeline",
  "steps": [
    {
      "nodeId": "calc-profits",
      "params": { "startDate": "2026-03-01", "endDate": "2026-03-31" },
      "idempotencyKey": "calc-profits-march-2026"
    },
    {
      "nodeId": "export-pdf",
      "params": { "data": "{{prev.data}}", "template": "financial" },
      "idempotencyKey": "export-pdf-march-2026",
      "rollbackHandler": "deleteUploadedFile"
    },
    {
      "nodeId": "send-telegram",
      "params": { "message": "تقرير مارس ✅", "fileUrl": "{{prev.data.fileUrl}}" },
      "idempotencyKey": "send-telegram-march-2026",
      "retryOnFailure": 3
    }
  ]
}
```

```
إذا فشل send-telegram وأُعيد تشغيل الـ Pipeline:
→ calc-profits: تم من قبل ← يُتخطى ✅
→ export-pdf:   تم من قبل ← يُتخطى ✅
→ send-telegram: لم يتم   ← يُنفَّذ ✅

النتيجة: لا حسابات مكررة، لا ملفات مكررة، فقط الإرسال
```

---

## 3. Dead Letter Queue — لا بيانات تضيع

### 3.1 الفكرة

```
DLQ = صندوق "الفاشلين نهائياً"

عندما تفشل Pipeline بعد كل المحاولات:
بدون DLQ: البيانات تختفي بصمت 💀
مع DLQ:   البيانات تُحفظ + Admin يُنبَّه + يمكن إعادة المحاولة يدوياً ✅
```

### 3.2 الكود

```typescript
// src/domains/zoon-os/functions/dlq/dead-letter-queue.ts

import { createClient } from '@supabase/supabase-js'
import { PipelineStep, PipelineResult } from '../pipeline/pipeline-engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export interface DLQEntry {
  id?: string
  traceId: string
  pipelineId?: string
  steps: PipelineStep[]
  partialResults: PipelineResult['steps']
  failedAtStep: number
  errorMessage: string
  retryCount: number
  status: 'pending' | 'retrying' | 'resolved' | 'abandoned'
  createdAt?: string
  resolvedAt?: string
  resolvedBy?: string       // من أعاد المحاولة يدوياً
}

/**
 * إرسال Pipeline فاشلة إلى DLQ
 */
export async function sendToDLQ(entry: Omit<DLQEntry, 'id' | 'createdAt'>): Promise<void> {
  const { error } = await supabase.from('pipeline_dead_letter_queue').insert({
    trace_id: entry.traceId,
    pipeline_id: entry.pipelineId,
    steps: JSON.stringify(entry.steps),
    partial_results: JSON.stringify(entry.partialResults),
    failed_at_step: entry.failedAtStep,
    error_message: entry.errorMessage,
    retry_count: entry.retryCount,
    status: 'pending',
    created_at: new Date().toISOString()
  })

  if (error) {
    console.error('[DLQ] ❌ فشل حفظ الـ Pipeline في DLQ:', error)
    return
  }

  console.log(`[DLQ] 📥 تم حفظ Pipeline فاشلة في DLQ (trace: ${entry.traceId})`)

  // تنبيه Admin فوراً
  await notifyAdminAboutDLQ(entry)
}

/**
 * إعادة محاولة Pipeline من DLQ
 * يُستدعى من لوحة التحكم عند الضغط على "إعادة المحاولة"
 */
export async function retryFromDLQ(dlqId: string, userId: string): Promise<boolean> {
  // جلب الـ Pipeline من DLQ
  const { data: dlqEntry } = await supabase
    .from('pipeline_dead_letter_queue')
    .select('*')
    .eq('id', dlqId)
    .single()

  if (!dlqEntry) return false

  // تحديث الحالة
  await supabase
    .from('pipeline_dead_letter_queue')
    .update({ status: 'retrying', retry_count: dlqEntry.retry_count + 1 })
    .eq('id', dlqId)

  try {
    // إعادة تشغيل Pipeline من حيث توقفت
    const { runPipeline } = await import('../pipeline/pipeline-engine')
    const steps = JSON.parse(dlqEntry.steps) as PipelineStep[]

    // البدء من الخطوة الفاشلة
    const remainingSteps = steps.slice(dlqEntry.failed_at_step)
    const result = await runPipeline(remainingSteps)

    if (result.success) {
      // نجحت — أغلق الـ DLQ entry
      await supabase
        .from('pipeline_dead_letter_queue')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: userId
        })
        .eq('id', dlqId)
    }

    return result.success
  } catch (error) {
    await supabase
      .from('pipeline_dead_letter_queue')
      .update({ status: 'pending' })
      .eq('id', dlqId)
    return false
  }
}

/**
 * تنبيه Admin عند وصول Pipeline للـ DLQ
 */
async function notifyAdminAboutDLQ(entry: Omit<DLQEntry, 'id' | 'createdAt'>): Promise<void> {
  const message = `
🚨 *تنبيه: Pipeline فشلت نهائياً*

🔍 Trace ID: \`${entry.traceId}\`
📍 فشلت في الخطوة: ${entry.failedAtStep + 1}
❌ الخطأ: ${entry.errorMessage}
🔄 عدد المحاولات: ${entry.retryCount}

الرجاء مراجعة لوحة التحكم → Dead Letter Queue
  `.trim()

  const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID
  if (adminChatId) {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: message,
          parse_mode: 'Markdown'
        })
      }
    )
  }
}
```

### 3.3 API لإدارة DLQ من الواجهة

```typescript
// app/api/internal/dlq/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { retryFromDLQ } from '@/domains/zoon-os/functions/dlq/dead-letter-queue'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// GET: جلب قائمة الـ DLQ
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pending'

  const { data } = await supabase
    .from('pipeline_dead_letter_queue')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ entries: data ?? [], count: data?.length ?? 0 })
}

// POST: إعادة محاولة من DLQ
export async function POST(req: NextRequest) {
  const { dlqId, userId, action } = await req.json()

  if (action === 'retry') {
    const success = await retryFromDLQ(dlqId, userId)
    return NextResponse.json({ success })
  }

  if (action === 'abandon') {
    await supabase
      .from('pipeline_dead_letter_queue')
      .update({ status: 'abandoned', resolved_by: userId, resolved_at: new Date().toISOString() })
      .eq('id', dlqId)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'action غير معروف' }, { status: 400 })
}
```

### 3.4 شكل قسم DLQ في لوحة التحكم

```
┌─────────────────────────────────────────────────────────┐
│  💀 Dead Letter Queue (3 Pipelines فاشلة)              │
├──────────┬────────────────┬──────────┬──────────────────┤
│ الوقت   │ Pipeline       │ الخطوة   │ الخطأ            │
├──────────┼────────────────┼──────────┼──────────────────┤
│ 11:30 ص │ تقرير مارس    │ خطوة 3  │ Telegram timeout │
│ 09:15 ص │ عمولات فبراير │ خطوة 2  │ Storage error    │
│ أمس     │ تقرير أسبوعي  │ خطوة 1  │ DB connection    │
├──────────┴────────────────┴──────────┴──────────────────┤
│  [↩️ إعادة محاولة]  [🗑️ تجاهل]  [🔍 تفاصيل]          │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Distributed Tracing — تتبع كل خطوة

### 4.1 الفكرة

```
بدون Tracing:
"Pipeline فشلت" ← أين؟ متى؟ لماذا؟ 🤷

مع Tracing:
trace_id = "abc-123-xyz"
SELECT * FROM logs WHERE trace_id = 'abc-123-xyz'
→ ترى كل خطوة بالترتيب في ثوانٍ ✅
```

### 4.2 Pipeline Context

```typescript
// src/domains/zoon-os/functions/tracing/pipeline-context.ts

import { randomUUID } from 'crypto'

export interface PipelineContext {
  traceId: string          // UUID فريد لكل تشغيل Pipeline
  pipelineId?: string      // إذا كانت Pipeline محفوظة في DB
  userId: string
  triggeredBy: 'agent' | 'manual' | 'cron' | 'webhook' | 'dlq-retry'
  startTime: number
  metadata?: Record<string, unknown>
}

/**
 * إنشاء Context جديد لكل تشغيل Pipeline
 */
export function createPipelineContext(
  userId: string,
  triggeredBy: PipelineContext['triggeredBy'],
  pipelineId?: string
): PipelineContext {
  return {
    traceId: randomUUID(),
    pipelineId,
    userId,
    triggeredBy,
    startTime: Date.now(),
    metadata: {}
  }
}
```

### 4.3 Structured Logging

```typescript
// src/domains/zoon-os/functions/tracing/logger.ts

import { createClient } from '@supabase/supabase-js'
import { PipelineContext } from './pipeline-context'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface TraceLog {
  traceId: string
  level: LogLevel
  nodeId?: string
  stepIndex?: number
  message: string
  data?: unknown
  durationMs?: number
  timestamp: string
}

/**
 * Logger مرتبط بـ Trace ID
 */
export class PipelineLogger {
  private logs: TraceLog[] = []

  constructor(private context: PipelineContext) {}

  info(message: string, nodeId?: string, stepIndex?: number, data?: unknown) {
    this.log('info', message, nodeId, stepIndex, data)
  }

  warn(message: string, nodeId?: string, stepIndex?: number, data?: unknown) {
    this.log('warn', message, nodeId, stepIndex, data)
  }

  error(message: string, nodeId?: string, stepIndex?: number, data?: unknown) {
    this.log('error', message, nodeId, stepIndex, data)
  }

  private log(
    level: LogLevel,
    message: string,
    nodeId?: string,
    stepIndex?: number,
    data?: unknown
  ) {
    const entry: TraceLog = {
      traceId: this.context.traceId,
      level,
      nodeId,
      stepIndex,
      message,
      data,
      timestamp: new Date().toISOString()
    }

    this.logs.push(entry)

    // طباعة في Console مع Trace ID
    const prefix = `[${this.context.traceId.slice(0, 8)}]`
    const step = stepIndex !== undefined ? ` [خطوة ${stepIndex + 1}]` : ''
    const node = nodeId ? ` [${nodeId}]` : ''
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      `${prefix}${step}${node} ${message}`
    )
  }

  /**
   * حفظ كل الـ logs في DB دفعة واحدة عند انتهاء الـ Pipeline
   */
  async flush(): Promise<void> {
    if (this.logs.length === 0) return

    await supabase.from('pipeline_trace_logs').insert(
      this.logs.map(log => ({
        trace_id: log.traceId,
        level: log.level,
        node_id: log.nodeId,
        step_index: log.stepIndex,
        message: log.message,
        data: log.data ? JSON.stringify(log.data) : null,
        duration_ms: log.durationMs,
        created_at: log.timestamp
      }))
    )
  }

  getLogs(): TraceLog[] {
    return this.logs
  }
}
```

### 4.4 تحديث Pipeline Engine ليستخدم Tracing

```typescript
// تحديث توقيع runPipeline:
export async function runPipeline(
  steps: PipelineStep[],
  context: PipelineContext       // ← جديد
): Promise<PipelineResult> {

  const logger = new PipelineLogger(context)
  logger.info(`بدء تشغيل Pipeline — ${steps.length} خطوات`, undefined, undefined, {
    triggeredBy: context.triggeredBy,
    userId: context.userId
  })

  // ... داخل حلقة الخطوات:
  logger.info(`بدء تنفيذ`, step.nodeId, i)
  // بعد التنفيذ:
  logger.info(`انتهى في ${durationMs}ms`, step.nodeId, i, { success: result.success })
  // عند الفشل:
  logger.error(`فشل: ${result.error}`, step.nodeId, i)

  // في النهاية — حفظ كل الـ logs
  await logger.flush()

  return {
    ...pipelineResult,
    traceId: context.traceId    // ← أضف traceId للنتيجة
  }
}
```

### 4.5 API للبحث في الـ Traces

```typescript
// app/api/internal/traces/route.ts

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const traceId = searchParams.get('traceId')
  const nodeId = searchParams.get('nodeId')
  const level = searchParams.get('level')
  const since = searchParams.get('since') ?? '1h'

  let query = supabase
    .from('pipeline_trace_logs')
    .select('*')
    .order('created_at', { ascending: true })

  if (traceId) query = query.eq('trace_id', traceId)
  if (nodeId) query = query.eq('node_id', nodeId)
  if (level) query = query.eq('level', level)

  const sinceDate = new Date(Date.now() - parseDuration(since))
  query = query.gte('created_at', sinceDate.toISOString())

  const { data } = await query.limit(500)

  return NextResponse.json({
    logs: data ?? [],
    summary: buildTraceSummary(data ?? [])
  })
}

function buildTraceSummary(logs: any[]) {
  const steps = [...new Set(logs.map(l => l.node_id).filter(Boolean))]
  const errors = logs.filter(l => l.level === 'error')
  const totalDuration = logs.reduce((s, l) => s + (l.duration_ms ?? 0), 0)

  return {
    stepsExecuted: steps.length,
    errorsCount: errors.length,
    totalDurationMs: totalDuration,
    firstError: errors[0]?.message
  }
}

function parseDuration(duration: string): number {
  const units: Record<string, number> = {
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000
  }
  const match = duration.match(/^(\d+)([mhd])$/)
  if (!match) return 60 * 60 * 1000  // افتراضي: ساعة
  return parseInt(match[1]) * (units[match[2]] ?? 3600000)
}
```

### 4.6 مثال: تشخيص مشكلة في دقيقتين

```sql
-- خطوة 1: ابحث عن trace_id من الـ Execution Log
SELECT trace_id, created_at, status
FROM function_execution_logs
WHERE status = 'error'
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;

-- خطوة 2: تتبع كل خطوات الـ Pipeline
SELECT step_index, node_id, level, message, duration_ms, created_at
FROM pipeline_trace_logs
WHERE trace_id = 'abc-123-xyz-...'
ORDER BY created_at ASC;

-- النتيجة: ترى كل خطوة بالترتيب والوقت والخطأ
-- بدل ساعات بحث → دقيقتان
```

---

## 5. Pipeline Versioning — إدارة الإصدارات

### 5.1 متى تحتاجه؟

```
الحاجة تظهر عند:
- تعديل Pipeline وهي مُجدولة للتشغيل
- إرجاع Pipeline لإصدار سابق
- فهم لماذا كانت النتائج مختلفة الأسبوع الماضي
```

### 5.2 Schema

```sql
-- إصدارات الـ Pipelines
CREATE TABLE pipeline_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id     UUID NOT NULL REFERENCES function_pipelines(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL,
  steps           JSONB NOT NULL,
  change_summary  TEXT,              -- "أُضيفت خطوة send-telegram"
  created_by      TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE(pipeline_id, version_number)
);

-- سجل التنفيذ مرتبط بإصدار محدد
ALTER TABLE pipeline_execution_logs
ADD COLUMN version_number INTEGER DEFAULT 1;

-- Trigger: إنشاء نسخة تلقائياً عند تعديل Pipeline
CREATE OR REPLACE FUNCTION create_pipeline_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM pipeline_versions
  WHERE pipeline_id = NEW.id;

  INSERT INTO pipeline_versions (pipeline_id, version_number, steps, created_by)
  VALUES (NEW.id, next_version, NEW.nodes, 'system');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_version_pipeline
AFTER UPDATE OF nodes ON function_pipelines
FOR EACH ROW EXECUTE FUNCTION create_pipeline_version();
```

### 5.3 استرجاع إصدار سابق

```typescript
// app/api/internal/pipelines/[id]/restore/route.ts

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { versionNumber } = await req.json()

  const { data: version } = await supabase
    .from('pipeline_versions')
    .select('steps')
    .eq('pipeline_id', params.id)
    .eq('version_number', versionNumber)
    .single()

  if (!version) {
    return NextResponse.json({ error: 'الإصدار غير موجود' }, { status: 404 })
  }

  // استعادة الإصدار القديم
  await supabase
    .from('function_pipelines')
    .update({ nodes: version.steps })
    .eq('id', params.id)

  return NextResponse.json({ success: true, restoredVersion: versionNumber })
}
```

---

## 6. تحسينات Rate Limiting و Alerting

### 6.1 Exponential Backoff للـ Retry

```typescript
// في pipeline-engine.ts — بدلاً من الانتظار الثابت:

for (let attempt = 1; attempt <= step.retryOnFailure; attempt++) {
  // Exponential Backoff: 1s → 2s → 4s → 8s
  const baseDelay = step.retryDelayMs ?? 1000
  const backoffDelay = baseDelay * Math.pow(2, attempt - 1)
  const jitter = Math.random() * 500  // ± 500ms عشوائي

  await new Promise(r => setTimeout(r, backoffDelay + jitter))

  result = await handler(resolvedParams)
  if (result.success) break
}
```

### 6.2 Role-Based Rate Limits

```typescript
// src/domains/zoon-os/functions/rate-limiter.ts — تحديث

const ROLE_MULTIPLIERS: Record<string, number> = {
  'admin':   2.0,    // ضعف الحد المعتاد
  'manager': 1.0,    // الحد الافتراضي
  'viewer':  0.5     // نصف الحد
}

export async function checkRateLimit(
  userId: string,
  nodeId: string,
  userRole: string = 'manager'
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const baseLimit = RATE_LIMITS[nodeId] ?? RATE_LIMITS.default
  const limit = Math.floor(baseLimit * (ROLE_MULTIPLIERS[userRole] ?? 1.0))

  // ... باقي منطق Rate Limiting
  return { allowed, remaining, resetIn: windowMs - (now - windowStart) }
}
```

### 6.3 Alert Levels مع Cooldown

```typescript
// src/domains/zoon-os/functions/alerting.ts — تحديث

enum AlertLevel {
  INFO     = 'info',      // 3-5 فشل في الساعة
  WARNING  = 'warning',   // 5-10 فشل في الساعة
  CRITICAL = 'critical'   // 10+ فشل في الساعة
}

// منع إغراق الـ Admin بالتنبيهات
const ALERT_COOLDOWN_MS = 30 * 60 * 1000  // 30 دقيقة
const lastAlertTime = new Map<string, number>()

function shouldSendAlert(nodeId: string): boolean {
  const last = lastAlertTime.get(nodeId) ?? 0
  if (Date.now() - last < ALERT_COOLDOWN_MS) return false
  lastAlertTime.set(nodeId, Date.now())
  return true
}

function getAlertLevel(failureCount: number): AlertLevel {
  if (failureCount >= 10) return AlertLevel.CRITICAL
  if (failureCount >= 5)  return AlertLevel.WARNING
  return AlertLevel.INFO
}

export async function checkAndAlert(
  nodeId: string,
  error: string,
  traceId: string
): Promise<void> {
  const recentFailures = await countRecentFailures(nodeId, 3600000)  // آخر ساعة

  if (recentFailures < 3) return  // لا تنبيه للأخطاء العرضية

  if (!shouldSendAlert(nodeId)) return  // Cooldown نشط

  const level = getAlertLevel(recentFailures)
  const emoji = level === AlertLevel.CRITICAL ? '🚨' : level === AlertLevel.WARNING ? '⚠️' : 'ℹ️'

  await sendAdminAlert({
    level,
    message: `${emoji} [${level.toUpperCase()}] ${nodeId} فشلت ${recentFailures} مرة في الساعة الأخيرة`,
    nodeId,
    failureCount: recentFailures,
    lastError: error,
    traceId
  })
}
```

---

## 7. قاعدة البيانات — Schema الكامل

```sql
-- ===== 1. Idempotency Records =====
CREATE TABLE idempotency_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL UNIQUE,
  node_id     TEXT NOT NULL,
  result      JSONB,
  status      TEXT DEFAULT 'success',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- تنظيف تلقائي بعد 24 ساعة
CREATE INDEX idx_idempotency_key ON idempotency_records(key);
CREATE INDEX idx_idempotency_created ON idempotency_records(created_at);

-- ===== 2. Dead Letter Queue =====
CREATE TABLE pipeline_dead_letter_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id        UUID NOT NULL,
  pipeline_id     UUID REFERENCES function_pipelines(id),
  steps           JSONB NOT NULL,
  partial_results JSONB DEFAULT '[]',
  failed_at_step  INTEGER NOT NULL,
  error_message   TEXT NOT NULL,
  retry_count     INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending', 'retrying', 'resolved', 'abandoned')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  resolved_at     TIMESTAMPTZ,
  resolved_by     TEXT
);

CREATE INDEX idx_dlq_status ON pipeline_dead_letter_queue(status);
CREATE INDEX idx_dlq_trace ON pipeline_dead_letter_queue(trace_id);

-- ===== 3. Pipeline Trace Logs =====
CREATE TABLE pipeline_trace_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id    UUID NOT NULL,
  level       TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  node_id     TEXT,
  step_index  INTEGER,
  message     TEXT NOT NULL,
  data        JSONB,
  duration_ms INTEGER,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trace_logs_trace_id ON pipeline_trace_logs(trace_id);
CREATE INDEX idx_trace_logs_level ON pipeline_trace_logs(level);
CREATE INDEX idx_trace_logs_created ON pipeline_trace_logs(created_at);

-- ===== 4. Pipeline Versions =====
CREATE TABLE pipeline_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id     UUID NOT NULL REFERENCES function_pipelines(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL,
  steps           JSONB NOT NULL,
  change_summary  TEXT,
  created_by      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE(pipeline_id, version_number)
);

-- ===== 5. تحديث جدول Idempotency =====
ALTER TABLE function_execution_logs
ADD COLUMN IF NOT EXISTS trace_id UUID,
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE INDEX idx_fn_logs_trace ON function_execution_logs(trace_id);
CREATE INDEX idx_fn_logs_idempotency ON function_execution_logs(idempotency_key);

-- ===== 6. تنظيف تلقائي (Cron Job يومي) =====
-- شغّل هذا كـ Supabase Scheduled Function يومياً:
DELETE FROM idempotency_records WHERE created_at < NOW() - INTERVAL '24 hours';
DELETE FROM pipeline_trace_logs WHERE created_at < NOW() - INTERVAL '30 days' AND level != 'error';
DELETE FROM pipeline_trace_logs WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## 8. دمج كل شيء في Pipeline Engine

```typescript
// src/domains/zoon-os/functions/pipeline/pipeline-engine.ts
// النسخة المحدّثة مع كل مميزات Advanced Reliability

import { checkIdempotency, markAsExecuted } from '../idempotency/idempotency-store'
import { sendToDLQ } from '../dlq/dead-letter-queue'
import { createPipelineContext, PipelineContext } from '../tracing/pipeline-context'
import { PipelineLogger } from '../tracing/logger'
import { checkRateLimit } from '../rate-limiter'
import { checkAndAlert } from '../alerting'

export async function runPipeline(
  steps: PipelineStep[],
  contextInput?: Partial<PipelineContext>
): Promise<PipelineResult & { traceId: string }> {

  // إنشاء Context
  const context = createPipelineContext(
    contextInput?.userId ?? 'system',
    contextInput?.triggeredBy ?? 'agent',
    contextInput?.pipelineId
  )
  const logger = new PipelineLogger(context)
  const startTime = Date.now()
  const results: PipelineResult['steps'] = []
  let previousOutput: unknown = null

  logger.info(`🚀 بدء Pipeline — ${steps.length} خطوات`)

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const stepStart = Date.now()

    // ===== 1. فحص Rate Limit =====
    const { allowed, remaining } = await checkRateLimit(
      context.userId,
      step.nodeId,
      contextInput?.metadata?.userRole as string
    )
    if (!allowed) {
      const error = `تجاوزت الحد المسموح لـ ${step.nodeId}`
      logger.warn(error, step.nodeId, i)
      results.push({ nodeId: step.nodeId, success: false, error, durationMs: 0 })
      break
    }

    // ===== 2. فحص Idempotency =====
    if (step.idempotencyKey) {
      const { executed, result: cachedResult } = await checkIdempotency(step.idempotencyKey)
      if (executed) {
        logger.info(`⏭️ تخطي — تم تنفيذه من قبل`, step.nodeId, i)
        results.push({
          nodeId: step.nodeId, success: true,
          data: cachedResult, summary: 'تم التخطي (Idempotent)',
          durationMs: 0
        })
        previousOutput = cachedResult
        continue
      }
    }

    // ===== 3. حل الـ params =====
    const resolvedParams = resolveParams(step.params, previousOutput, results)

    // ===== 4. تشغيل Handler مع Retry =====
    const node = getFunctionNode(step.nodeId)
    if (!node) {
      const error = `Function غير موجودة: ${step.nodeId}`
      logger.error(error, step.nodeId, i)
      results.push({ nodeId: step.nodeId, success: false, error, durationMs: 0 })
      break
    }

    const handler = HANDLER_MAP[node.handler]
    let result = await handler(resolvedParams)

    // Retry مع Exponential Backoff
    if (!result.success && step.retryOnFailure) {
      for (let attempt = 1; attempt <= step.retryOnFailure; attempt++) {
        const delay = (step.retryDelayMs ?? 1000) * Math.pow(2, attempt - 1)
        logger.warn(`⟳ محاولة ${attempt}/${step.retryOnFailure} بعد ${delay}ms`, step.nodeId, i)
        await new Promise(r => setTimeout(r, delay))
        result = await handler(resolvedParams)
        if (result.success) break
      }
    }

    const durationMs = Date.now() - stepStart

    // ===== 5. تسجيل النتيجة =====
    results.push({
      nodeId: step.nodeId,
      success: result.success,
      data: result.data,
      summary: result.summary,
      error: result.error,
      durationMs
    })

    logger.info(
      result.success ? `✅ نجح في ${durationMs}ms` : `❌ فشل: ${result.error}`,
      step.nodeId, i
    )

    if (result.success) {
      // حفظ في Idempotency Store
      if (step.idempotencyKey) {
        await markAsExecuted(step.idempotencyKey, step.nodeId, result.data)
      }
      previousOutput = result.data
    } else {
      // تنبيه عند الفشل
      await checkAndAlert(step.nodeId, result.error ?? 'خطأ غير معروف', context.traceId)

      // Rollback للخطوات السابقة
      if (step.rollbackHandler) {
        await executeRollback(results, steps)
      }

      break
    }
  }

  // ===== 6. فحص النتيجة النهائية =====
  const allSuccess = results.length === steps.length && results.every(r => r.success)

  if (!allSuccess) {
    const failedStep = results.findIndex(r => !r.success)
    // إرسال للـ DLQ إذا كانت Pipeline مُجدولة أو مهمة
    if (contextInput?.pipelineId) {
      await sendToDLQ({
        traceId: context.traceId,
        pipelineId: contextInput.pipelineId,
        steps,
        partialResults: results,
        failedAtStep: failedStep,
        errorMessage: results[failedStep]?.error ?? 'خطأ غير معروف',
        retryCount: 0,
        status: 'pending'
      })
    }
  }

  // ===== 7. حفظ الـ Trace Logs =====
  await logger.flush()

  return {
    success: allSuccess,
    steps: results,
    finalOutput: previousOutput,
    totalDurationMs: Date.now() - startTime,
    traceId: context.traceId
  }
}
```

---

## 9. خطة التطبيق الأسبوعية

```
الأسبوع 1 — الأساسيات (من المستند الأساسي):
  يوم 1:   Retry Logic + Exponential Backoff
  أيام 2-4: RBAC + Permissions

الأسبوع 2 — Reliability Layer (هذا المستند):
  يوم 1:   Idempotency Keys (Schema + Store + دمج في Engine)
  يوم 2:   Dead Letter Queue (Schema + API + واجهة)
  يومان 3-4: Distributed Tracing (Context + Logger + API)
  يوم 5:   Integration Tests للـ 3 مميزات

الأسبوع 3 — تحسينات:
  يومان 1-2: Pipeline Versioning
  يوم 3:    Alert Levels + Cooldown
  يومان 4-5: Monitoring Dashboard (من المستند الأساسي)

الأسبوع 4 — اختبار وإطلاق:
  أيام 1-3: E2E Tests + Load Testing
  يومان 4-5: Deploy + مراقبة أولى

إجمالي: 4 أسابيع → Production-Grade System ✅
```

---

## 10. مقارنة مع الأنظمة التجارية

```
┌──────────────────────┬──────────┬────────────────┬─────────────┬────────┐
│ الميزة               │ Zoon v2  │ AWS Step Func. │ Temporal.io │ Zapier │
├──────────────────────┼──────────┼────────────────┼─────────────┼────────┤
│ Retry Logic          │    ✅    │       ✅       │     ✅      │   ✅   │
│ Rollback             │    ✅    │    ⚠️ محدود    │     ✅      │   ❌   │
│ Idempotency          │    ✅    │       ✅       │     ✅      │   ❌   │
│ Dead Letter Queue    │    ✅    │       ✅       │     ✅      │   ❌   │
│ Distributed Tracing  │    ✅    │       ✅       │     ✅      │   ⚠️   │
│ RBAC                 │    ✅    │       ✅       │     ⚠️      │   ✅   │
│ Rate Limiting        │    ✅    │       ✅       │     ❌      │   ✅   │
│ Pipeline Versioning  │    ✅    │       ✅       │     ✅      │   ❌   │
│ Conditional Logic    │  🟢 v3   │       ✅       │     ✅      │   ✅   │
│ دعم العربية          │    ✅    │       ❌       │     ❌      │   ❌   │
│ التكلفة              │  مجاني   │      $$$       │     $$$     │   $$   │
│ Self-hosted          │    ✅    │       ❌       │     ✅      │   ❌   │
└──────────────────────┴──────────┴────────────────┴─────────────┴────────┘

النتيجة: Zoon OS v2 + Advanced Reliability = منافس حقيقي للأنظمة التجارية
         بتكلفة صفر وتخصيص كامل للسياق العربي
```

---

## 📌 القواعد الذهبية — Advanced Reliability

> **القاعدة 1:** كل Pipeline مهمة تحتاج `idempotencyKey` — خاصةً الـ messaging وexport.

> **القاعدة 2:** كل Pipeline مُجدولة تحتاج `pipelineId` حتى تصل للـ DLQ عند الفشل.

> **القاعدة 3:** كل تشغيل Pipeline له `traceId` فريد — لا تشخص مشكلة بدونه.

> **القاعدة 4:** الـ DLQ ليس نهاية — هو نقطة استئناف يدوي.

> **القاعدة 5:** Alert Cooldown = 30 دقيقة — لا تُغرق Admin بالتنبيهات.

> **القاعدة 6:** Pipeline Versioning يحمي من تغييرات تكسر الجدولة النشطة.

---

*آخر تحديث: مارس 2026 | Zoon OS Advanced Reliability Guide v1.0*
*يُقرأ مع: `zoon-os-function-system.md` (المستند الأساسي)*
