/**
 * Zoon OS State Manager v1.0
 * مسؤول عن حفظ واسترجاع حالة السرب من قاعدة البيانات
 */

import { createClient } from '@supabase/supabase-js';
import { ZoonState, AgentType } from '../types/state';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class StateManager {
  /**
   * حفظ الحالة الحالية في Supabase
   */
  static async saveState(state: ZoonState): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('zoon_states')
        .upsert({
          session_id: state.sessionId,
          user_id: state.userId,
          team_id: state.teamId,
          active_agent: state.activeAgent,
          state_json: state,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'session_id'
        });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('[StateManager] Failed to save state:', err);
      return { success: false, error: err };
    }
  }

  /**
   * استرجاع حالة سابقة بناءً على معرف الجلسة
   */
  static async loadState(sessionId: string): Promise<ZoonState | null> {
    try {
      const { data, error } = await supabase
        .from('zoon_states')
        .select('state_json')
        .eq('session_id', sessionId)
        .single();

      if (error || !data) return null;
      return data.state_json as ZoonState;
    } catch (err) {
      console.error('[StateManager] Failed to load state:', err);
      return null;
    }
  }

  /**
   * تهيئة حالة جديدة لجلسة جديدة
   */
  static createInitialState(userId: string, teamId: string | null, sessionId: string, userInput: string): ZoonState {
    return {
      userId,
      teamId,
      sessionId,
      userInput,
      intent: 'unknown',
      intentConfidence: 0,
      activeAgent: 'orchestrator',
      agentOutputs: {},
      pendingApproval: false,
      iterationCount: 0,
      maxIterations: 10,
      trace: [],
      startedAt: new Date().toISOString()
    };
  }

  /**
   * تحديث جزء من الحالة وحفظها مباشرة
   */
  static async updateAndSave(
    state: ZoonState, 
    updates: Partial<ZoonState>
  ): Promise<ZoonState> {
    const newState = { ...state, ...updates };
    await this.saveState(newState);
    return newState;
  }
}
