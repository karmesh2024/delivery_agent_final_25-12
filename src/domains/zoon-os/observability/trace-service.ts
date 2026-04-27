import { ZoonState, TraceStep } from '../types/state';
import { supabase } from '@/lib/supabase';

export interface TraceReport {
  sessionId: string;
  userId: string;
  totalSteps: number;
  agentsInvoked: string[];
  totalDurationMs: number | null;
  wasApproved: boolean;
  hadErrors: boolean;
  steps: TraceStep[];
}

/**
 * بناء تقرير التتبع من حالة السرب النهائية
 */
export function buildTraceReport(state: ZoonState): TraceReport {
  const startTime = state.startedAt ? new Date(state.startedAt).getTime() : null;
  const endTime = Date.now();

  return {
    sessionId: state.sessionId,
    userId: state.userId,
    totalSteps: state.trace.length,
    agentsInvoked: [...new Set(state.trace.map(t => t.agent))],
    totalDurationMs: startTime ? endTime - startTime : null,
    wasApproved: !state.pendingApproval,
    hadErrors: !!state.errorState,
    steps: state.trace,
  };
}

/**
 * حفظ تقرير التتبع في Supabase
 */
export async function saveTraceReport(report: TraceReport): Promise<void> {
  try {
    const { error } = await supabase!
      .from('zoon_traces')
      .insert({
        session_id:     report.sessionId,
        user_id:        report.userId,
        total_steps:    report.totalSteps,
        agents_invoked: report.agentsInvoked,
        duration_ms:    report.totalDurationMs,
        was_approved:   report.wasApproved,
        had_errors:     report.hadErrors,
        steps_json:     report.steps,
        created_at:     new Date().toISOString(),
      });

    if (error) throw error;
    console.log(`[Trace Service] ✅ Trace saved for session: ${report.sessionId}`);
  } catch (err) {
    console.error('[Trace Service] ❌ Failed to save trace:', err);
  }
}
