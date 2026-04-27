/**
 * Zoon OS Swarm Graph v1.0 - Updated
 * ربط الوكلاء وبناء مسار العمل العملي
 */

import { StateGraph, END, START } from "@langchain/langgraph";
import { ZoonState, AgentType } from "../types/state";
import { orchestratorNode } from "./nodes/orchestrator";
import { accountingAgent } from "./nodes/accounting-agent";
import { inventoryAgent } from "./nodes/inventory-agent";
import { reflectionGateNode } from "./nodes/reflection-gate";
import { parallelExecutorNode } from "./nodes/parallel-executor";

// 1. تعريف القنوات
const graphChannels = {
  userId: { value: (x: string, y: string) => y ?? x },
  sessionId: { value: (x: string, y: string) => y ?? x },
  teamId: { value: (x: string, y: string) => y ?? x },
  userInput: { value: (x: string, y: string) => y ?? x },
  intent: { value: (x: string, y: string) => y ?? x },
  intentConfidence: { value: (x: number, y: number) => y ?? x },
  activeAgent: { value: (x: AgentType, y: AgentType) => y ?? x },
  agentOutputs: { value: (x: any, y: any) => ({ ...x, ...y }) },
  iterationCount: { value: (x: number, y: number) => (y ?? x) },
  maxIterations: { value: (x: number, y: number) => y ?? x },
  startedAt: { value: (x: string, y: string) => y ?? x },
  errorState: { value: (x: any, y: any) => y ?? x },
  pendingApproval: { value: (x: boolean, y: boolean) => y ?? x },
  pendingAction: { value: (x: any, y: any) => y ?? x },
  trace: { value: (x: any[], y: any[]) => [...(x ?? []), ...(y ?? [])] }
};

// 2. تهيئة الـ Graph
const workflow = new StateGraph<ZoonState>({
  channels: graphChannels as any
});

// 3. إضافة العقد (Nodes)
workflow.addNode("orchestrator", orchestratorNode as any);
workflow.addNode("accounting", accountingAgent as any);
workflow.addNode("inventory", inventoryAgent as any);
workflow.addNode("parallel_executor", parallelExecutorNode as any);
workflow.addNode("reflection", reflectionGateNode as any);

/**
 * دالة التوجيه الذكي
 */
function routeByIntent(state: ZoonState): string {
  if (state.iterationCount >= state.maxIterations) return "end";
  
  const target = (state.intent || "").toLowerCase();
  
  // إذا كان الطلب يتضمن "تقرير" أو كلمات تشمل المجالين -> توازي
  const needsParallel = target.includes("تقرير") || target.includes("report") || 
                       ((target.includes("accounting") || target.includes("حسابات")) && 
                        (target.includes("inventory") || target.includes("مخازن")));

  if (needsParallel) return "parallel";
  if (target.includes("accounting") || target.includes("حسابات")) return "accounting";
  if (target.includes("inventory") || target.includes("مخازن")) return "inventory"; 
  
  return "end";
}

/**
 * دالة التحقق من المراجعة - تقرر الاستمرار أو التوقف للتدخل البشري
 */
function checkReviewStatus(state: ZoonState): string {
  // إذا طلب المراجع تدخلاً بشرياً أو موافقة، نتوقف فوراً لنعرض الخيارات للمستخدم
  if (state.pendingApproval) {
    return "stop_for_approval";
  }
  return "approved";
}

// 4. بناء العلاقات (Edges)
workflow.addEdge(START, "orchestrator" as any);

workflow.addConditionalEdges(
  "orchestrator" as any,
  routeByIntent,
  {
    accounting: "accounting" as any,
    inventory: "inventory" as any,
    parallel: "parallel_executor" as any,
    end: END
  }
);

// توجيه الوكلاء للمراجعة
workflow.addEdge("accounting" as any, "reflection" as any);
workflow.addEdge("inventory" as any, "reflection" as any);
workflow.addEdge("parallel_executor" as any, "reflection" as any);

// قرار ما بعد المراجعة
workflow.addConditionalEdges(
  "reflection" as any,
  checkReviewStatus,
  {
    approved: END,
    stop_for_approval: END
  }
);

// 5. تصدير الـ Graph جاهزاً للتنفيذ
export const swarmGraph = workflow.compile();
