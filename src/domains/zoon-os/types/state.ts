/**
 * Zoon OS Swarm State Definitions v1.0
 * هذا الملف هو المرجع الموحد لحالة الوكلاء عبر النظام
 */

export type AgentType = 
  | "orchestrator"
  | "accounting"
  | "inventory"
  | "reports"
  | "notifications"
  | "qa_reflector"; // الوكيل الناقد

export interface AgentOutput {
  agentId: AgentType;
  result: any;
  confidence: number;
  tokensUsed: number;
  duration: number; // بالملي ثانية
  error?: string;
  timestamp: string;
}

export interface TraceStep {
  timestamp: string;
  agent: AgentType;
  action: string;
  input?: any;
  output?: any;
}

export interface PendingAction {
  type: string;
  critique?: string;
  originalOutput?: any;
  options: string[];
}

export interface ZoonState {
  // معرّفات السياق الأساسية
  userId: string;
  teamId: string | null;
  sessionId: string;
  userInput: string; // الرسالة الأصلية من المستخدم
  
  // النية والتوجيه
  intent: string;
  intentConfidence: number;
  activeAgent: AgentType;
  
  // مخرجات الوكلاء (مخزنة بمفتاح نوع الوكيل)
  agentOutputs: Partial<Record<AgentType, AgentOutput>>;
  
  // بروتوكول HITL (Human-In-The-Loop)
  pendingApproval: boolean;
  pendingAction?: PendingAction;
  
  // ضمانات الأمان والتحكم
  iterationCount: number;
  maxIterations: number;
  
  // التتبع (Audit Trail)
  trace: TraceStep[];
  
  // إدارة الأخطاء والتعافي
  errorState?: {
    lastError: string;
    errorCount: number;
    failedAgent?: AgentType;
    recoveryAttempted: boolean;
  };

  // توقيتات
  startedAt: string;
  completedAt?: string;
}
