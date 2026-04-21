// src/domains/zoon-os/tools/tool-registry.ts
// نظام سجل الأدوات السيادي لـ Zoon OS - Sovereign Tool Registry v1.0

import { tool, jsonSchema } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ToolDefinition {
  id: string;
  name: string;
  display_name: string;
  description: string;
  handler_key: string;
  input_schema: any;
  is_active: boolean;
  requires_permission: string | null;
  always_available: boolean;
  block_when: string[] | null;
}

/**
 * جلب تعريفات الأدوات من قاعدة البيانات
 */
export async function fetchToolDefinitions(
  teamId?: string | null
): Promise<ToolDefinition[]> {
  try {
    const { data: tools, error } = await supabase
      .from('agent_tools')
      .select('*')
      .eq('is_active', true)
      .or(`team_id.is.null${teamId ? `,team_id.eq.${teamId}` : ''}`);

    if (error) throw error;
    return tools || [];
  } catch (error: any) {
    console.error('[ToolRegistry] Error fetching definitions:', error.message);
    return [];
  }
}

/**
 * تحويل التعريف الدينياميكي إلى أداة تنفيذية (AI SDK Tool)
 */
export function createDynamicTool(
  def: ToolDefinition, 
  handler: (args: any) => Promise<any>
) {
  return tool({
    description: def.description,
    inputSchema: jsonSchema(def.input_schema),
    execute: async (args: any) => {
      try {
        const response = await handler(args);
        return response?.data || response;
      } catch (error: any) {
        console.error(`[Tool Execution Error: ${def.name}]`, error.message);
        return { success: false, error: error.message };
      }
    },
  });
}
