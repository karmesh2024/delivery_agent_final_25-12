import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from './embeddings';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { GraphService } from './graph-service';

const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const ollamaProvider = createOpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama',
});


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);



// =============================
// 🔵 استخراج الحقائق الشخصية فوراً من رسالة المستخدم
// =============================

const PERSONAL_FACT_PATTERNS = [
  // الأسرة والأبناء
  { regex: /(?:اسم|أسماء)\s+(?:بنات|أبناء|أولاد|ابن|ابنة|بنت)(?:ي|ك)?\s+(?:هم?\s+)?(.+)/i, type: 'FAMILY', prefix: 'أبناء المستخدم:' },
  { regex: /(?:بنات|أبناء|أولاد)(?:ي|ك)?\s+(?:هم?\s+|اسمهم\s+)?(.+)/i, type: 'FAMILY', prefix: 'أبناء المستخدم:' },
  { regex: /عندي\s+(?:بنات|أبناء|أولاد)\s+(?:اسمهم\s+)?(.+)/i, type: 'FAMILY', prefix: 'أبناء المستخدم:' },
  // الاسم
  { regex: /(?:اسمي|أنا)\s+([^\s،,]+(?:\s+[^\s،,]+){0,2})/i, type: 'IDENTITY', prefix: 'اسم المستخدم:' },
  // التفضيلات
  { regex: /أ(?:حب|فضل|ريد)\s+(?:دائماً?\s+)?(.+)/i, type: 'PREFERENCE', prefix: 'تفضيل المستخدم:' },
  { regex: /لا\s+أ(?:حب|ريد|فضل)\s+(.+)/i, type: 'PREFERENCE', prefix: 'يكره المستخدم:' },
  // العمل والمسمى
  { regex: /(?:أنا|اسمي)\s+(?:مدير|مهندس|دكتور|أستاذ|مدير)\s+(.+)/i, type: 'IDENTITY', prefix: 'مسمى المستخدم الوظيفي:' },
];

/**
 * 🚀 الحفظ الفوري للحقائق المكتشفة
 * يتضمن ميزة "كشف التعارض": إبطال الحقائق القديمة إذا تعارضت مع الجديدة في نفس النطاق
 */
export async function detectAndSavePersonalFacts(
  userId: string,
  userMessage: string,
  teamId: string | null = null,
  scope: 'personal' | 'team' = 'personal'
): Promise<void> {
  const facts: { content: string; type: string; prefix: string }[] = [];

  for (const pattern of PERSONAL_FACT_PATTERNS) {
    const match = userMessage.match(pattern.regex);
    if (match && match[1]) {
      facts.push({
        content: `${pattern.prefix} ${match[1].trim()}`,
        type: pattern.type,
        prefix: pattern.prefix
      });
    }
  }

  if (facts.length === 0) return;

  await Promise.all(facts.map(async (fact) => {
    try {
      const embedding = await generateEmbedding(fact.content);
      
      const singletonTypes = ['IDENTITY', 'WORK', 'SCHEDULE']; 
      const isSingleton = singletonTypes.includes(fact.type) || fact.prefix.includes('اسم');

      if (isSingleton) {
        // إبطال التعارض في نفس النطاق (User أو Team)
        let deactivateQuery = supabase
          .from('agent_memory')
          .update({ is_active: false })
          .eq('hall_id', 'FACT')
          .eq('room_id', fact.type)
          .eq('scope', scope)
          .like('content', `${fact.prefix}%`);

        if (scope === 'team' && teamId) {
          deactivateQuery = deactivateQuery.eq('team_id', teamId);
        } else {
          deactivateQuery = deactivateQuery.eq('user_id', userId);
        }
        
        await deactivateQuery;
      }

      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6);

      const { save, reason } = await shouldSaveMemory(fact.content, userId, 'FACT', embedding);
      if (!save) {
        console.log(`[Memory Gatekeeper] Skipped FACT: ${reason} — "${fact.content.slice(0, 50)}"`);
        return;
      }

      const { error } = await supabase
        .from('agent_memory')
        .insert({
          user_id: userId,
          team_id: teamId,
          scope,
          content: fact.content,
          wing_id: scope === 'team' ? 'TEAM' : 'USER',
          room_id: fact.type,
          hall_id: 'FACT',
          embedding,
          memory_type: 'FACT',
          is_active: true,
          confidence: 1.0,
          metadata: { 
            created_via: 'auto-save-v4-sovereign',
            valid_until: expiryDate.toISOString() 
          }
        });

      if (!error) console.log(`✅ [Memory] ${scope} fact saved: "${fact.content}"`);
    } catch (e) {
      console.error(`❌ [FactSave Exception]:`, e);
    }
  }));
}

// =============================
// 🟢 تلخيص المحادثة واستخراج الرؤى (Insights)
// =============================

export async function summarizeConversation(messages: any[]): Promise<string> {
  const textToSummarize = messages.slice(-10).map(m => {
    let content = m.content;
    if (Array.isArray(content)) {
      content = content.map((part: any) => part.text || '').join('\n');
    } else if (typeof content === 'object' && content !== null) {
      content = content.text || content.content || JSON.stringify(content);
    }
    return `${m.role}: ${content || ''}`;
  }).join('\n');
  
  const summaryPrompt = `قم بتحليل وتلخيص المحادثة بأسلوب مهني ومختصر:
المطلوب: المواضيع، القرارات، والتفضيلات.
اللغة: العربية الفصحى.

المحادثة:
${textToSummarize}`;

  let summary = '';
  try {
    // ⚠️ منع الموديلات المحلية الصغيرة للتلخيص منعاً للهلوسة (P2 Fix)
    // الاعتماد فقط على النماذج الموثوقة كـ Gemini Flash
    const { text } = await generateText({ 
      model: googleProvider('gemini-2.5-flash'), 
      prompt: summaryPrompt,
      temperature: 0.1 
    });
    summary = text;

    // Reject if significantly longer than the original (indicates hallucination)
    // Relaxed threshold: only reject if it's vastly longer (e.g., 4x) or exceeds a reasonable absolute limit
    if (summary.length > textToSummarize.length * 4 && summary.length > 500) {
        console.warn('⚠️ [AutoSave] Insight length too long, likely hallucination. Rejecting.');
        return 'محادثة عامة (تم رفض التلخيص)';
    }
  } catch (e: any) { 
    console.error('❌ [AutoSave] Gemini Summarization Failed:', e?.message || e);
    
    // Fallback to Ollama if Gemini completely fails (and user has local Ollama setup)
    if (process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL) {
      try {
        console.log('🔄 [AutoSave] Attempting Ollama qwen3.5:4b fallback for summarization...');
        const { text } = await generateText({ 
          model: ollamaProvider('qwen3.5:4b'), 
          prompt: summaryPrompt,
          temperature: 0.1
        });
        
        if (text && text.length <= textToSummarize.length * 2) {
          return text.trim();
        }
      } catch (ollamaErr) {
        console.error('❌ [AutoSave] Ollama Fallback Failed too');
      }
    }
    
    return 'فشل التلخيص'; 
  }
  
  return summary.trim();
}

// =============================
// 🔵 الحفظ التلقائي للرؤى بعد نهاية المحادثة
// =============================

export async function autoSaveInsights(
  userId: string, 
  content: string, 
  context: { wing: string; room: string },
  teamId: string | null = null,
  scope: 'personal' | 'team' = 'personal',
  thoughtChain?: any
): Promise<void> {
  // ⛔ منع حفظ رسائل الفشل كذكريات دلالية
  if (content === 'فشل التلخيص' || content === 'محادثة عامة (تم رفض التلخيص)' || !content.trim()) {
    console.warn(`⚠️ [AutoSave] Aborted saving INSIGHT due to failure message: "${content}"`);
    return;
  }

  try {
    const embedding = await generateEmbedding(content);

    const { save, reason } = await shouldSaveMemory(content, userId, 'INSIGHT', embedding);
    if (!save) {
      console.log(`[Memory Gatekeeper] Skipped INSIGHT: ${reason} — "${content.slice(0, 50)}"`);
      return;
    }

    const { error } = await supabase
      .from('agent_memory')
      .insert({
        user_id: userId,
        team_id: teamId || null,
        scope: scope || 'personal',
        content,
        wing_id: context.wing,
        room_id: context.room,
        hall_id: 'INSIGHT',
        memory_type: 'INSIGHT',
        embedding,
        thought_chain: thoughtChain ?? null,
        is_active: true,
        confidence: 0.9
      });

    if (error) {
      console.error('❌ [AutoSave] SQL Error:', error.message);
    } else {
      console.log(`✅ [Memory] Saved to [${scope}] ${context.wing}/${context.room}`);
    }
  } catch (e: any) {
    console.error('❌ [AutoSave] Exception:', e.message);
  }
}

// =============================
// 🟠 تسجيل عمليات الوكيل في سجل المساءلة
// =============================

export async function logAgentAction(data: {
  userId: string;
  teamId?: string | null;
  actionType: 'tool_call' | 'memory_save' | 'decision';
  toolName?: string;
  input?: any;
  output?: any;
  thoughtChain?: any;
  modelUsed?: string;
  tokensUsed?: number;
}) {
  try {
    await supabase
      .from('zoon_action_log')
      .insert({
        user_id: data.userId,
        team_id: data.teamId,
        action_type: data.actionType,
        tool_name: data.toolName,
        input: data.input,
        output: data.output,
        thought_chain: data.thoughtChain,
        model_used: data.modelUsed,
        tokens_used: data.tokensUsed
      });
  } catch (e) {}
}

/**
 * 🕸️ استخراج العلاقات للشبكة المعرفية
 */
export async function extractAndSaveGraphRelations(
  userId: string, 
  messages: any[],
  teamId: string | null = null,
  scope: 'personal' | 'team' = 'personal'
) {
  try {
    const chatHistory = messages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');
    
    const { text } = await generateText({
      model: ollamaProvider('qwen3.5:4b'),
      prompt: `استخرج العلاقات بصيغة JSON: [{"subject": "...", "predicate": "...", "object": "..."}]
المحادثة: ${chatHistory}`
    });

    const cleanJsonText = text.replace(/```json|```/g, '').trim();
    const relations = JSON.parse(cleanJsonText);

    if (Array.isArray(relations)) {
      await Promise.all(relations.map(rel => {
        if (!rel.subject || !rel.predicate || !rel.object) return Promise.resolve();

        return GraphService.upsertRelation(userId, {
          subject: rel.subject,
          predicate: rel.predicate,
          object: rel.object,
          team_id: teamId,
          scope: scope,
          confidence: 0.9,
          metadata: { updated_at: new Date().toISOString() }
        });
      }));
    }
  } catch (e: any) {
    console.warn('⚠️ [Graph Extraction Failed]:', e.message);
  }
}

// =============================
// 🛡️ طبقة حماية الذاكرة — كشف التعارض والتكرار (Gatekeeper)
// =============================
async function shouldSaveMemory(
  content: string,
  userId: string,
  memoryType: string,
  embedding: number[]
): Promise<{ save: boolean; reason: string }> {
  try {
    const { data: similar } = await supabase.rpc('search_similar_memories', {
      query_embedding: embedding,
      user_id_param: userId,
      similarity_threshold: 0.92,
      limit_param: 3
    });

    if (!similar || similar.length === 0) {
      return { save: true, reason: 'new_memory' };
    }

    // تكرار متطابق
    if (similar[0].similarity > 0.97) {
      return { save: false, reason: 'duplicate' };
    }

    // نفس النوع وتشابه عالي جداً = تحديث القديم
    if (similar[0].memory_type === memoryType && similar[0].similarity > 0.92) {
      await supabase
        .from('agent_memory')
        .update({ 
          content,
          updated_at: new Date().toISOString(),
          confidence: 1.0
        })
        .eq('id', similar[0].id);
      
      return { save: false, reason: 'updated_existing' };
    }

    return { save: true, reason: 'different_enough' };
    
  } catch (e) {
    console.warn('⚠️ [Gatekeeper Error]', e);
    return { save: true, reason: 'gatekeeper_error' };
  }
}
