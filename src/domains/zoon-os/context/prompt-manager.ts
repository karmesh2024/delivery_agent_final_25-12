import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_PROMPT = `أنت زوون الهجين (Zoon OS). رد بالعربية الفصحى بذكاء وبطريقة ودودة.`;

/**
 * جلب السيستم برومبت النشط من قاعدة البيانات (مثل V4 الظاهر في لوحة التحكم)
 */
export async function getActiveSystemPrompt(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('system_prompts')
      .select('content, version')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('[PromptManager] No active prompt found in DB, using fallback default');
      return DEFAULT_PROMPT;
    }

    console.log(`[PromptManager] ✅ Successfully loaded active prompt Version: V${data.version}`);
    return data.content;
  } catch (e: any) {
    console.error('[PromptManager] Critical Error fetching prompt:', e.message);
    return DEFAULT_PROMPT;
  }
}
