/**
 * Orchestrator Node v2.0
 * تصنيف النية بالكلمات المفتاحية — فوري بدون LLM
 */

import { ZoonState } from "../../types/state";

// أنماط الكلمات المفتاحية لكل نية
const INTENT_PATTERNS: Record<string, RegExp> = {
  accounting: /مبيعات|مالي|ربح|أرباح|فواتير|فاتورة|إيرادات|مصروفات|حسابات|محاسبة|إجمالي|صافي|دفع|تحصيل|sales|profit|revenue|invoice|payment|financial/i,
  inventory: /مخزون|مخازن|مخلفات|منتجات|بلاستيك|ورق|حديد|كمية|وزن|طن|كيلو|رصيد|متاح|stock|inventory|warehouse|product|waste/i,
  reports: /تقرير|تقارير|إحصائ|ملخص|report|summary|statistics|dashboard/i,
};

/**
 * تصنيف النية بتحليل الكلمات المفتاحية — 0ms بدون أي LLM
 */
function classifyIntent(message: string): { intent: string; confidence: number } {
  const scores: Record<string, number> = {};

  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    const matches = message.match(pattern);
    scores[intent] = matches ? matches.length : 0;
  }

  // العثور على أعلى نتيجة
  const topIntent = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

  if (topIntent && topIntent[1] > 0) {
    // إذا كان "تقرير مالي" → accounting أولوية أعلى
    if (scores.reports > 0 && scores.accounting > 0) {
      return { intent: "accounting", confidence: 0.9 };
    }
    if (scores.reports > 0 && scores.inventory > 0) {
      return { intent: "inventory", confidence: 0.9 };
    }
    return { intent: topIntent[0], confidence: 0.85 };
  }

  return { intent: "general", confidence: 0.5 };
}

export async function orchestratorNode(state: ZoonState): Promise<Partial<ZoonState>> {
  console.log(`[Swarm Orchestrator] 🔍 Analyzing intent for user: ${state.userId}`);
  const startTime = Date.now();

  const userMessage = state.userInput || "";
  const { intent: detectedIntent, confidence } = classifyIntent(userMessage);

  console.log(`[Swarm Orchestrator] ✅ Intent: "${detectedIntent}" (confidence: ${confidence}) in ${Date.now() - startTime}ms`);

  return {
    activeAgent: "orchestrator",
    intent: detectedIntent,
    intentConfidence: confidence,
    iterationCount: state.iterationCount + 1,
    trace: [
      {
        timestamp: new Date().toISOString(),
        agent: "orchestrator",
        action: `Intent classified as: ${detectedIntent}`,
        output: { detectedIntent, confidence, durationMs: Date.now() - startTime }
      }
    ]
  };
}

