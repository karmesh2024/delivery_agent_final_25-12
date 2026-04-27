import { ZoonState } from '../../types/state';
import { accountingAgent } from './accounting-agent';
import { inventoryAgent } from './inventory-agent';

const AGENT_TIMEOUT_MS = 25_000; // مهلة 25 ثانية لكل وكيل

/**
 * وظيفة لتشغيل الوعد (Promise) مع مهلة زمنية
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`الوكيل استغرق وقتاً طويلاً (أكثر من ${ms/1000} ثوانٍ)`)), ms)
    ),
  ]);
}

/**
 * وكيل التنفيذ المتوازي (Parallel Executor)
 * يقوم بتشغيل وكيل المحاسبة والمخازن معاً لتقليل زمن الاستجابة
 */
export async function parallelExecutorNode(
  state: ZoonState
): Promise<Partial<ZoonState>> {
  console.log('[Parallel Executor] ⚡ Running agents in parallel (Accounting + Inventory)...');
  const startTime = Date.now();

  // تشغيل الوكلاء بالتوازي
  const results = await Promise.allSettled([
    withTimeout(accountingAgent(state), AGENT_TIMEOUT_MS),
    withTimeout(inventoryAgent(state), AGENT_TIMEOUT_MS),
  ]);

  const mergedOutputs = { ...state.agentOutputs };
  const errors: string[] = [];
  const traceSteps: any[] = [];

  results.forEach((result, index) => {
    const agentName = index === 0 ? 'accounting' : 'inventory';
    
    if (result.status === 'fulfilled') {
      // دمج مخرجات الوكيل بنجاح
      Object.assign(mergedOutputs, result.value.agentOutputs);
      if (result.value.trace && result.value.trace.length > 0) {
        traceSteps.push(result.value.trace[0]);
      }
    } else {
      // تسجيل الخطأ في حال فشل أحد الوكلاء دون إيقاف الآخر
      console.error(`[Parallel Executor] ❌ ${agentName} failed:`, result.reason);
      errors.push(`${agentName}: ${result.reason?.message}`);
      
      // تسجيل خطوة تتبع للفشل
      traceSteps.push({
        timestamp: new Date().toISOString(),
        agent: agentName,
        action: 'parallel_execution_failed',
        output: { error: result.reason?.message }
      });
    }
  });

  return {
    activeAgent: 'orchestrator', // نعود للمنسق للتقييم النهائي أو الـ reflection
    agentOutputs: mergedOutputs,
    trace: [
      ...traceSteps,
      {
        timestamp: new Date().toISOString(),
        agent: 'orchestrator',
        action: `Parallel execution completed in ${Date.now() - startTime}ms`,
        output: { successCount: results.filter(r => r.status === 'fulfilled').length, errors: errors.length > 0 ? errors : null }
      }
    ],
    ...(errors.length > 0 && {
      errorState: {
        lastError: errors.join(' | '),
        errorCount: (state.errorState?.errorCount ?? 0) + errors.length,
        recoveryAttempted: false,
      },
    }),
  };
}
