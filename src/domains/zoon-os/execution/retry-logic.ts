export interface RetryConfig {
  maxAttempts: number        // عدد المحاولات القصوى
  initialDelayMs: number     // الانتظار قبل المحاولة الثانية (ms)
  backoffMultiplier: number  // مضاعف الانتظار بين كل محاولة
  maxDelayMs: number         // سقف الانتظار (لا يتجاوزه)
}

export const RETRY_PRESETS = {
  // للعمليات السريعة (APIs داخلية)
  FAST: {
    maxAttempts: 3,
    initialDelayMs: 500,
    backoffMultiplier: 2,
    maxDelayMs: 2000
  } as RetryConfig,

  // للعمليات العادية (Webhooks خارجية مثلاً)
  STANDARD: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    backoffMultiplier: 2,
    maxDelayMs: 8000
  } as RetryConfig,

  // للعمليات الحساسة التي نود تكرارها بحرص أو تقارير ثقيلة
  CAREFUL: {
    maxAttempts: 2,
    initialDelayMs: 2000,
    backoffMultiplier: 1.5,
    maxDelayMs: 5000
  } as RetryConfig,

  // لا إعادة محاولة (مثلاً لـ HITL tools أو عمليات التعديل الخطرة)
  NO_RETRY: {
    maxAttempts: 1,
    initialDelayMs: 0,
    backoffMultiplier: 1,
    maxDelayMs: 0
  } as RetryConfig
}

export type RetryResult<T> =
  | { success: true; data: T; attempts: number }
  | { success: false; error: string; attempts: number; statusCode?: number }

/**
 * تنفيذ دالة (Promise) مع إعادة محاولة متكررة و Exponential Backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = RETRY_PRESETS.STANDARD,
  toolName: string
): Promise<RetryResult<T>> {
  let lastError: Error = new Error('Unknown error during retry')
  let lastStatusCode: number | undefined
  let delay = config.initialDelayMs

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const data = await fn()
      // إذا نجح بعد المحاولة الأولى نُسجّل الملاحظة
      if (attempt > 1) {
        console.info(`[Zoon Retry] ✅ ${toolName}: نجحت العملية في المحاولة: ${attempt}`)
      }
      return { success: true, data, attempts: attempt }

    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err))

      // محاولة استخراج رمز الحالة إذا كان مدمجاً في الخطأ بأي شكل (لو تم إلقاؤه مع المرموز)
      if (err && 'statusCode' in err) {
        lastStatusCode = err.statusCode
      } else if (err && err.response && err.response.status) {
        lastStatusCode = err.response.status
      }

      const isLastAttempt = attempt === config.maxAttempts
      
      console.warn(
        `[Zoon Retry] ⚠️ ${toolName}: محاولة ${attempt}/${config.maxAttempts} فشلت` +
        (isLastAttempt ? ' (هذه كانت المحاولة الأخيرة)' : ` (انتظار ${delay}ms قبل المحاولة التالية)، السبب: ${lastError.message}`)
      )

      if (!isLastAttempt) {
        await sleep(delay)
        // زيادة وقت الانتظار بحد أقصى مسموح
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs)
      }
    }
  }

  return {
    success: false,
    error: lastError.message,
    attempts: config.maxAttempts,
    statusCode: lastStatusCode
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
