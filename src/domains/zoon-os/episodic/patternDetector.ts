import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface QueryPattern {
  query: string;
  repeatCount: number;
  category: string;
  commonDayOfWeek?: number;
  suggestion?: string;
}

export async function detectUserPatterns(userId: string): Promise<QueryPattern[]> {
  const { data: patterns, error } = await supabase
    .from('zoon_query_patterns')
    .select('*')
    .eq('user_id', userId)
    .gte('repeat_count', 3) // تكرر 3 مرات أو أكثر
    .order('repeat_count', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ [PatternDetector] Error fetching patterns:', error.message);
    return [];
  }

  return (patterns ?? []).map(p => ({
    query: p.query,
    repeatCount: p.repeat_count,
    category: p.category,
    commonDayOfWeek: p.common_day_of_week,
    suggestion: buildSuggestion(p)
  }));
}

function buildSuggestion(pattern: any): string {
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  
  if (pattern.common_day_of_week !== null && pattern.common_day_of_week !== undefined) {
    const day = days[pattern.common_day_of_week];
    return `يسأل عن "${pattern.query}" عادة يوم ${day} — يمكن تجهيز الرد مسبقاً.`;
  }
  
  return `سؤال متكرر ${pattern.repeat_count} مرات — يستحق تعيين اختصار له.`;
}
