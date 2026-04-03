// src/domains/zoon-os/functions/pipeline/pipeline-engine.ts

import { HANDLERS } from '../handlers'
import { getFunctionNode } from '../registry'
import { PipelineContext } from '../tracing/pipeline-context'
import { PipelineLogger } from '../tracing/logger'
import { HandlerResult } from '../handlers/file-handlers'

export interface PipelineStep {
  nodeId: string
  params: Record<string, unknown>
  inputFrom?: number           // اختياري: أخذ المدخلات من خطوة سابقة محددة
  retryOnFailure?: number      // عدد محاولات إعادة التشغيل
  idempotencyKey?: string      // مفتاح لمنع التكرار (للمستقبل)
}

export interface StepResult {
  nodeId: string
  success: boolean
  data?: any
  summary?: string
  durationMs: number
  error?: string
  skipped?: boolean
}

export interface PipelineResult {
  success: boolean
  traceId: string
  steps: StepResult[]
  totalDurationMs: number
  error?: string
  finalData?: any
}

/**
 * المحرك الأساسي لتشغيل سلسلة من الوظائف (Pipeline Engine)
 */
export async function runPipeline(
  steps: PipelineStep[],
  context: PipelineContext
): Promise<PipelineResult> {
  const logger = new PipelineLogger(context)
  const startTime = Date.now()
  const results: StepResult[] = []
  let previousOutput: any = null

  logger.info(`🚀 بدء تشغيل الـ Pipeline: ${steps.length} خطوات`)

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const stepStartTime = Date.now()
      
      logger.info(`실 الخطوة ${i + 1}: بدء ${step.nodeId}`, step.nodeId, i)

      // 1. جلب تعريف العقدة
      const node = getFunctionNode(step.nodeId)
      if (!node) {
        throw new Error(`العقدة ${step.nodeId} غير موجودة في السجل`)
      }

      // 2. معالجة البارامترات (استبدال المتغيرات {{prev.data}})
      const processedParams = processParams(step.params, previousOutput, results)

      // 3. جلب الـ Handler
      const handler = HANDLERS[node.handler as any]
      if (!handler) {
        throw new Error(`الـ Handler [${node.handler}] غير معرف للعقدة ${step.nodeId}`)
      }

      // 4. التنفيذ مع دعم إعادة المحاولة
      let attempt = 0
      let lastResult: HandlerResult | null = null
      const maxAttempts = (step.retryOnFailure || 0) + 1

      while (attempt < maxAttempts) {
        try {
          lastResult = await handler(processedParams)
          if (lastResult?.success) break
          
          attempt++
          if (attempt < maxAttempts) {
            logger.warn(`⚠️ فشلت المحاولة ${attempt} لـ ${step.nodeId}. إعادة المحاولة...`, step.nodeId, i)
            await new Promise(r => setTimeout(r, 1000)) // تأخير بسيط
          }
        } catch (err: any) {
          lastResult = { success: false, error: err.message }
          attempt++
        }
      }

      const durationMs = Date.now() - stepStartTime
      
      // 5. تسجيل النتيجة
      const stepResult: StepResult = {
        nodeId: step.nodeId,
        success: lastResult?.success ?? false,
        data: lastResult?.data,
        summary: lastResult?.summary,
        error: lastResult?.error,
        durationMs
      }

      results.push(stepResult)

      if (!stepResult.success) {
        logger.error(`❌ فشلت الخطوة ${i + 1} (${step.nodeId}): ${stepResult.error}`, step.nodeId, i)
        
        // وقف الـ Pipeline عند الفشل
        await logger.flush()
        return {
          success: false,
          traceId: context.traceId,
          steps: results,
          totalDurationMs: Date.now() - startTime,
          error: `Pipeline فشلت عند الخطوة ${step.nodeId}: ${stepResult.error}`
        }
      }

      logger.info(`✅ نجحت الخطوة ${i + 1}: ${stepResult.summary || 'تم بنجاح'} (${durationMs}ms)`, step.nodeId, i)
      previousOutput = stepResult.data
    }

    // النهاية الناجحة
    const totalDurationMs = Date.now() - startTime
    logger.info(`✨ اكتملت الـ Pipeline بنجاح في ${totalDurationMs}ms`)
    await logger.flush()

    return {
      success: true,
      traceId: context.traceId,
      steps: results,
      totalDurationMs,
      finalData: results[results.length - 1]?.data
    }

  } catch (error: any) {
    logger.error(`🚨 خطأ غير متوقع في المحرك: ${error.message}`)
    await logger.flush()
    return {
      success: false,
      traceId: context.traceId,
      steps: results,
      totalDurationMs: Date.now() - startTime,
      error: error.message
    }
  }
}

/**
 * دالة مساعدة لاستبدال المتغيرات في البارامترات
 */
function processParams(
  params: Record<string, unknown>,
  prevOutput: any,
  allResults: StepResult[]
): Record<string, unknown> {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // دعم {{prev.data}}
      if (value.includes('{{prev.data}}')) {
        result[key] = prevOutput
      } 
      // دعم {{steps[0].data}}
      else if (value.match(/{{steps\[(\d+)\]\.data}}/)) {
        const match = value.match(/{{steps\[(\d+)\]\.data}}/)
        const index = parseInt(match![1])
        result[key] = allResults[index]?.data
      }
      else {
        result[key] = value
      }
    } else {
      result[key] = value
    }
  }

  return result
}
