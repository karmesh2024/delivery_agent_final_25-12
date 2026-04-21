import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 🧠 بناء سياق "الإيقاظ" — يُحقن في System Prompt في كل طلب
 * يُعطي الأولوية للحقائق الشخصية (FACT) ثم الرؤى (INSIGHT)
 */
export async function constructWakeUpContext(
  userId: string,
  teamId: string | null = null
): Promise<string> {
  // استعلامات منفصلة - أوضح وأكثر استقراراً
  const [personalFacts, teamFacts, personalRelations, teamRelations, personalInsights, teamInsights] = await Promise.all([
    // 1. الحقائق الشخصية
    supabase.from('agent_memory').select('content').eq('user_id', userId).eq('is_active', true).eq('hall_id', 'FACT').order('created_at', { ascending: false }).limit(10),

    // 2. حقائق الفريق
    teamId ? supabase.from('agent_memory').select('content').eq('team_id', teamId).eq('scope', 'team').eq('is_active', true).order('created_at', { ascending: false }).limit(10) : Promise.resolve({ data: [] }),

    // 3. روابط شخصية (Graph)
    supabase.from('zoon_knowledge_graph').select('subject, predicate, object').eq('user_id', userId).order('confidence', { ascending: false }).limit(15),

    // 4. روابط الفريق (Graph)
    teamId ? supabase.from('zoon_knowledge_graph').select('subject, predicate, object').eq('team_id', teamId).eq('scope', 'team').order('confidence', { ascending: false }).limit(10) : Promise.resolve({ data: [] }),

    // 5. رؤى شخصية (Insights)
    supabase.from('agent_memory').select('content').eq('user_id', userId).eq('is_active', true).eq('memory_type', 'INSIGHT').order('created_at', { ascending: false }).limit(5),

    // 6. رؤى الفريق (Insights)
    teamId ? supabase.from('agent_memory').select('content').eq('team_id', teamId).eq('scope', 'team').eq('is_active', true).eq('memory_type', 'INSIGHT').order('created_at', { ascending: false }).limit(5) : Promise.resolve({ data: [] })
  ]);

  const parts: string[] = [];

  // تجميع الحقائق
  const allFacts = [
    ...(personalFacts.data || []).map(f => `• [شخصي] ${f.content}`),
    ...(teamFacts.data || []).map(f => `• [فريق] ${f.content}`)
  ];
  if (allFacts.length > 0) parts.push(`[حقائق وتفضيلات]:\n${allFacts.join('\n')}`);

  // تجميع الرؤى (Insights)
  const allInsights = [
    ...(personalInsights.data || []).map(i => `• [شخصي] ${i.content}`),
    ...(teamInsights.data || []).map(i => `• [فريق] ${i.content}`)
  ];
  if (allInsights.length > 0) parts.push(`[سياق المحادثات الأخيرة]:\n${allInsights.join('\n')}`);

  // تجميع العلاقات
  const allRelations = [
    ...(personalRelations.data || []).map(r => `• [شخصي] ${r.subject} ${r.predicate} ${r.object}`),
    ...(teamRelations.data || []).map(r => `• [فريق] ${r.subject} ${r.predicate} ${r.object}`)
  ];
  if (allRelations.length > 0) parts.push(`[شبكة العلاقات والروابط]:\n${allRelations.join('\n')}`);

  return parts.join('\n\n');
}

export async function getEnrichedSystemContext(): Promise<string> {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return `[سياق النظام]: الوقت الحالي هو ${timeStr}، الموافق ${dateStr}.`;
}
