/**
 * Transaction Wrapper
 * 
 * دالة لحماية العمليات المعقدة وضمان التراجع عند الفشل
 * مع تسجيل تلقائي في Audit Log
 */

import { supabase } from '@/lib/supabase';
import { auditService, AuditLogEntry } from '@/services/auditService';

export interface TransactionOptions {
  maxRetries?: number;
  timeoutMs?: number;
  auditEntry?: AuditLogEntry;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * تنفيذ عملية داخل Transaction مع تسجيل تلقائي
 * 
 * @param operation العملية المراد تنفيذها
 * @param options خيارات الـ Transaction
 * @returns نتيجة العملية
 * 
 * @example
 * ```typescript
 * const result = await withTransaction(
 *   async () => {
 *     // عملياتك هنا
 *     return someResult;
 *   },
 *   {
 *     auditEntry: {
 *       entityType: 'product',
 *       entityId: productId,
 *       operation: 'update',
 *       sourceTable: 'waste_data_admin'
 *     },
 *     maxRetries: 3
 *   }
 * );
 * ```
 */
export async function withTransaction<T>(
  operation: () => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    timeoutMs = 30000,
    auditEntry,
    onRetry
  } = options;

  let auditId: string | null = null;
  const startTime = Date.now();

  // بدء تسجيل العملية
  if (auditEntry) {
    try {
      auditId = await auditService.startOperation(auditEntry);
    } catch (error) {
      console.error('Failed to start audit log:', error);
      // نكمل العملية حتى لو فشل التسجيل
    }
  }

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // تنفيذ العملية مع timeout
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
        )
      ]);

      // تسجيل النجاح
      const executionTime = Date.now() - startTime;
      if (auditId) {
        await auditService.logSuccess(auditId, {
          executionTimeMs: executionTime,
          response: { attempt, success: true, result }
        });
      }

      return result;

    } catch (error) {
      lastError = error as Error;
      console.error(`Transaction attempt ${attempt}/${maxRetries} failed:`, error);

      // استدعاء callback عند إعادة المحاولة
      if (onRetry && attempt < maxRetries) {
        onRetry(attempt, lastError);
      }

      // إذا كانت آخر محاولة، نسجل الفشل
      if (attempt === maxRetries) {
        const executionTime = Date.now() - startTime;
        if (auditId) {
          await auditService.logFailure(auditId, lastError, executionTime);
        }
        throw lastError;
      }

      // انتظار قبل المحاولة التالية (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Transaction failed');
}

/**
 * تنفيذ عمليات متعددة في transaction واحدة (متسلسلة)
 * 
 * @param operations قائمة العمليات المراد تنفيذها
 * @param options خيارات الـ Transaction
 * @returns نتائج جميع العمليات
 */
export async function withBatchTransaction<T>(
  operations: Array<() => Promise<T>>,
  options: TransactionOptions = {}
): Promise<T[]> {
  return withTransaction(
    async () => {
      const results: T[] = [];
      for (const op of operations) {
        results.push(await op());
      }
      return results;
    },
    options
  );
}

/**
 * تنفيذ عمليات متوازية في transaction واحدة
 * ⚠️ استخدم بحذر - قد لا تدعم قاعدة البيانات transactions متوازية
 * 
 * @param operations قائمة العمليات المراد تنفيذها
 * @param options خيارات الـ Transaction
 * @returns نتائج جميع العمليات
 */
export async function withParallelTransaction<T>(
  operations: Array<() => Promise<T>>,
  options: TransactionOptions = {}
): Promise<T[]> {
  return withTransaction(
    async () => {
      return Promise.all(operations.map(op => op()));
    },
    options
  );
}
