/**
 * Reflection Gate Node v2.0
 * المراجع الذكي - مراجعة برمجية سريعة + دعم HITL
 */

import { ZoonState, AgentType } from "../../types/state";

export async function reflectionGateNode(state: ZoonState): Promise<Partial<ZoonState>> {
  const FINANCIAL_AGENTS: AgentType[] = ["accounting", "inventory"];
  
  if (!FINANCIAL_AGENTS.includes(state.activeAgent)) {
    return { pendingApproval: false };
  }

  const agentOutput = state.agentOutputs[state.activeAgent];
  if (!agentOutput || !agentOutput.result) return { pendingApproval: false };

  console.log(`[Reflection Gate] 🧐 Rule-based Review for: ${state.activeAgent}`);
  const startTime = Date.now();

  // منطق مراجعة برمجية سريع (قواعد الأمان)
  const result = agentOutput.result;
  let isApproved = true;
  let critique = "";

  // 1. قواعد وكيل المحاسبة
  if (state.activeAgent === "accounting") {
    if (result.totalProfit < 0) {
      isApproved = false;
      critique = "⚠️ تم اكتشاف صافي ربح سالب. يرجى مراجعة العمليات المالية.";
    }
    if (result.totalSell === 0 && result.sessionCount > 0) {
      isApproved = false;
      critique = "⚠️ توجد عمليات مسجلة ولكن إجمالي المبيعات صفر. قد يكون هناك خطأ في الربط.";
    }
  }

  // 2. قواعد وكيل المخازن
  if (state.activeAgent === "inventory") {
    if (result.totalWasteWeight === 0 && result.productCount === 0) {
      isApproved = false;
      critique = "⚠️ تقرير المخزون يظهر صفر كيلوجرام وصفر منتجات. يرجى التأكد من مزامنة المخازن.";
    }
  }

  // إذا نجح في القواعد البرمجية، نعتبره مقبولاً فوراً
  if (isApproved) {
    console.log(`[Reflection Gate] ✅ Output Approved (Rules) in ${Date.now() - startTime}ms`);
    return {
      pendingApproval: false,
      trace: [
        {
          timestamp: new Date().toISOString(),
          agent: "qa_reflector",
          action: "output_approved_by_rules",
          output: { durationMs: Date.now() - startTime }
        }
      ]
    };
  }

  // إذا فشل، نفعّل بروتوكول HITL (انتظار موافقة المستخدم)
  console.warn(`[Reflection Gate] ❌ Output Flagged for HITL: ${critique}`);
  return {
    pendingApproval: true,
    pendingAction: {
      type: "human_approval_required",
      critique: critique,
      originalOutput: result,
      options: ["اعتماد على أي حال", "إعادة فحص البيانات", "تجاهل"]
    },
    trace: [
      {
        timestamp: new Date().toISOString(),
        agent: "qa_reflector",
        action: "hitl_triggered",
        output: { critique }
      }
    ]
  };
}

