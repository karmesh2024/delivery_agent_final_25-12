import { withRetry, RETRY_PRESETS, RetryConfig } from './retry-logic'
import { classifyError, errorToAgentMessage, ZoonError } from './error-handler'

export interface ToolExecutionResult<T = unknown> {
  success: boolean
  data?: T
  error?: ZoonError
  agentMessage?: string   // رسالة الخطأ المصاغة للوكيل لتمريرها للمستخدم
  executionTimeMs: number
  attempts: number
  toolName: string
}

export interface ToolExecutorOptions {
  retryConfig?: RetryConfig
  timeoutMs?: number       // المدة المسموحة قبل القطع (مثلا 15000 م.ثانية)
  isHITL?: boolean         // لو كان يتطلب أولوية بشرية، لا نكرّر الطلب
  logToDb?: boolean        // خيار تشغيل التسجيل لاحقاً في DB Audit
}

/**
 * دالة التفاف أساسية (Wrapper) لكل أدوات AI SDK `execute`
 * 
 * تحمي من التوقف المفاجئ، تُدبر أمر الإعادة عند الفشل،
 * تُصنّف الخطأ (Error Typing)، وتجبر المهلة الزمنية (Timeout)
 */
export async function executeToolSafely<T>(
  toolName: string,
  fn: () => Promise<T>,
  options: ToolExecutorOptions = {}
): Promise<ToolExecutionResult<T>> {
  const startTime = Date.now()

  const {
    timeoutMs = 15_000,
    isHITL = false,
    retryConfig = isHITL ? RETRY_PRESETS.NO_RETRY : RETRY_PRESETS.STANDARD,
    logToDb = false
  } = options

  // محاصرة الدالة بتوقيت قسري (Timeout Promise)
  const withTimeout = (): Promise<T> => {
    const timeoutError = new Error('TIMEOUT')
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(timeoutError), timeoutMs)
    )
    return Promise.race([fn(), timeoutPromise])
  }

  // تمرير الدالة (بما فيها مهلة الإيقاف) لمنطق الإعادة
  const result = await withRetry(withTimeout, retryConfig, toolName)
  const executionTimeMs = Date.now() - startTime

  // -- حالة النجاح
  if (result.success) {
    if (logToDb) {
      logExecution(toolName, 'success', executionTimeMs, result.attempts).catch(console.error)
    }

    return {
      success: true,
      data: result.data,
      executionTimeMs,
      attempts: result.attempts,
      toolName
    }
  }

  // -- حالة الفشل (نفدت المحاولات أو خطأ مميت)
  const error = classifyError(result.error, result.statusCode)
  const agentMessage = errorToAgentMessage(error, toolName)

  console.error(
    `[Zoon Executor] ❌ ${toolName} فشل نهائي! | ` +
    `نوع: ${error.type} | زمن: ${executionTimeMs}ms | ` +
    `تفاصيل: ${error.technicalDetail}`
  )

  if (logToDb) {
    logExecution(toolName, 'error', executionTimeMs, result.attempts, error).catch(console.error)
  }

  return {
    success: false,
    error,
    agentMessage,
    executionTimeMs,
    attempts: result.attempts,
    toolName
  }
}

// دالة مساعدة لتسجيل تحليلات استخدام الأدوات
async function logExecution(
  toolName: string,
  status: 'success' | 'error',
  durationMs: number,
  attempts: number,
  error?: ZoonError
) {
  try {
    // يمكن هنا لاحقاً ربطها بجدول tool_execution_logs 
    console.debug(`[Zoon DB Audit] => Tool: ${toolName} | Status: ${status} | Time: ${durationMs}ms | Attempts: ${attempts}`)
  } catch (e) {
    console.warn('[Zoon Audit] فشل تسجيل حركة تشغيل الأداة', e)
  }
}
