import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool, generateText, jsonSchema } from 'ai';
import { cn } from '@/lib/utils';
import EventEmitter from 'events';

// زيادة سقف المستمعين لتجنب التحذيرات أثناء معالجة الذاكرة والأدوات
if (typeof process !== 'undefined') {
  EventEmitter.defaultMaxListeners = 50;
}

// استيراد الأدوات (Skills)
import { memoryTool } from '@/domains/zoon-os/skills/memoryTool';
import { searchNewsTool } from '@/domains/zoon-os/skills/searchNewsTool';
import { alexDialectTool } from '@/domains/zoon-os/skills/alexDialectTool';
import { telegramTool } from '@/domains/zoon-os/skills/telegramTool';
import { publishToRoomTool } from '@/domains/zoon-os/skills/publishToRoomTool';

// استيراد المعالجات (Handlers)
import { 
  HANDLERS,
  webSearchHandler, 
  deepResearchHandler, 
  imageOCRHandler, 
  webFetchHandler,
  searchNewsHandler,
  alexDialectHandler,
  telegramHandler,
  publishToRoomHandler,
  saveMemoryHandler
} from '@/domains/zoon-os/functions/handlers';

import { constructWakeUpContext, getEnrichedSystemContext } from '@/domains/zoon-os/memory/wake-up-service';
import { spatialSearch } from '@/domains/zoon-os/memory/palace-search';
import { getTargetContext } from '@/domains/zoon-os/memory/hybrid-router';
import { generateEmbedding } from '@/domains/zoon-os/memory/embeddings';
import { autoSaveInsights, summarizeConversation, logAgentAction, detectAndSavePersonalFacts, extractAndSaveGraphRelations } from '@/domains/zoon-os/memory/auto-save';
import { GraphService } from '@/domains/zoon-os/memory/graph-service';
import { getActiveSystemPrompt } from '@/domains/zoon-os/context/prompt-manager';
import { getProactiveContext } from '@/domains/zoon-os/episodic/proactiveService';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/db';

// أدوات Zoon الديناميكية
import { fetchToolDefinitions, createDynamicTool } from '@/domains/zoon-os/tools/tool-registry';
import { applyFastGuards } from '@/domains/zoon-os/routing/intent-guard';

export const maxDuration = 60;

// تهيئة عميل Supabase (بصلاحيات الخدمة لجلب السياق الإداري)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// إعداد مقدمي الخدمة
const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// إعداد Ollama المحلي (يجب أن يكون Ollama مشغلاً على جهازك)
const ollamaProvider = createOpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama', // قيمة وهمية لأن Ollama لا يتطلب مفتاحاً محلياً
});



/**
 * استخراج النص من رسالة بأي تنسيق (content string / parts array / object)
 */
function extractTextFromMessage(m: any): string {
  // 1. إذا كان content نصاً مباشراً
  if (typeof m.content === 'string' && m.content.trim()) {
    return m.content;
  }
  // 2. إذا كان يحتوي على parts (تنسيق @ai-sdk/react v3+)
  if (Array.isArray(m.parts)) {
    return m.parts
      .filter((p: any) => p.type === 'text' || typeof p.text === 'string')
      .map((p: any) => p.text || '')
      .join('\n')
      .trim();
  }
  // 3. إذا كان content مصفوفة
  if (Array.isArray(m.content)) {
    return m.content
      .map((p: any) => p.text || (typeof p === 'string' ? p : ''))
      .join('\n')
      .trim();
  }
  // 4. إذا كان content كائناً
  if (typeof m.content === 'object' && m.content !== null) {
    return m.content.text || m.content.content || JSON.stringify(m.content);
  }
  return '';
}

function convertToModelMessages(messages: any[]) {
  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant' || m.role === 'system')
    .map(m => ({
      role: m.role,
      content: extractTextFromMessage(m) || '...'
    }))
    .filter(m => m.content.trim() !== '');
}

async function executeToolSafely(name: string, fn: () => Promise<any>) {
  try {
    return await fn();
  } catch (error: any) {
    console.error(`❌ [Tool Error: ${name}]:`, error);
    return { success: false, error: error.message };
  }
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: any[] } = await req.json();
    const origin = new URL(req.url).origin;
    
    // ① جلب هوية المستخدم الديناميكية من الـ Headers (المُعدّة في Middleware)
    const USER_ID = req.headers.get('x-user-id');
    const USER_EMAIL = req.headers.get('x-user-email');

    if (!USER_ID) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // ② جلب السياق المؤسسي (Team & Role) عبر الـ RPC الجديد
    // نستخدم supabaseClient الموجود في auto-save أو نُنشئ واحداً هنا
    const { data: userCtx } = await supabase.rpc('get_user_context', { p_user_id: USER_ID });
    
    const TEAM_ID = userCtx?.team_id || null;
    const USER_ROLE = userCtx?.role || 'solo';
    const PERMISSIONS = userCtx?.permissions || {};

    // استخراج آخر رسالة للمستخدم
    const lastMsg = [...messages].reverse().find(m => m.role === 'user');
    const lastUserMessage = lastMsg ? extractTextFromMessage(lastMsg) : '';
    
    console.log(`📩 [Zoon] User: ${USER_EMAIL || USER_ID} | Role: ${USER_ROLE} | Team: ${TEAM_ID}`);
    
    const modelMessages = convertToModelMessages(messages);
    
    // 🚀 حفظ الحقائق (خلف الكواليس)
    if (lastUserMessage) {
      detectAndSavePersonalFacts(USER_ID, lastUserMessage).catch(() => {});
    }

    // 1️⃣ بناء السياق (Memory Palace v4.0)
    const [wakeUpFacts, systemEnrichment, targetContext, activePrompt, proactiveContext] = await Promise.all([
      constructWakeUpContext(USER_ID, TEAM_ID),
      getEnrichedSystemContext(),
      getTargetContext(lastUserMessage),
      getActiveSystemPrompt(),
      getProactiveContext(USER_ID)
    ]);

    // 🕵️ ميزة Sovereign Tool Routing (ADR v1.0)
    // 1. جلب تعريفات الأدوات من قاعدة البيانات
    const toolDefs = await fetchToolDefinitions(TEAM_ID);
    
    // 2. بناء الأدوات ديناميكياً
    const availableTools: Record<string, any> = {};
    for (const def of toolDefs) {
      let handler: any = null;
      if (def.handler_key === 'webSearchHandler') {
        const category = def.name.includes('image') ? 'images' : 'general';
        handler = async (args: any) => (await webSearchHandler({ ...args, userId: USER_ID, category })).data;
      } else if (def.handler_key === 'memoryTool') {
        handler = async (args: any) => (await memoryTool.execute!({ ...args, userId: USER_ID }, { 
          toolCallId: 'dynamic', 
          messages: []
        }));
      } else if (def.handler_key === 'searchNewsHandler') {
        handler = async (args: any) => (await searchNewsTool.execute!(args, { toolCallId: 'dynamic', messages: [] }));
      } else if (def.handler_key === 'deepResearchHandler') {
        handler = async (args: any) => (await deepResearchHandler({ ...args, userId: USER_ID })).data;
      }
      
      if (handler) {
        availableTools[def.name] = createDynamicTool(def, handler);
      }
    }

    // إضافة الأدوات المساعدة الدائمة
    availableTools.alexDialect = alexDialectTool;
    if (toolDefs.some(t => t.requires_permission === 'can_communication')) availableTools.telegram = telegramTool;
    if (toolDefs.some(t => t.requires_permission === 'can_publish')) availableTools.publishToRoom = publishToRoomTool;

    // 3. تطبيق نظام الحراسة السريعة (Layer 1) لمنع التشتت
    const filteredTools = applyFastGuards(lastUserMessage, availableTools, toolDefs);

    // استخراج الكيانات للشبكة المعرفية
    const potentialEntities = lastUserMessage.split(/[\s،,]+/).filter(word => word.length > 2);
    const graphFactsSet = new Set<string>();
    await Promise.all(potentialEntities.slice(0, 5).map(async (entity) => {
      const connections = await GraphService.getEntityConnections(USER_ID, entity);
      connections.forEach(c => graphFactsSet.add(`${c.subject} -> ${c.predicate} -> ${c.object}`));
    }));

    const memoryContext = (wakeUpFacts || graphFactsSet.size > 0 || proactiveContext) ? `
### 🟢 ذاكرة المستخدم المتاحة (حقائق وسياق مجدول):
${proactiveContext ? `${proactiveContext}\n` : ''}${wakeUpFacts ? `* حقائق: ${wakeUpFacts}\n` : ''}${Array.from(graphFactsSet).length > 0 ? `* روابط اجتماعية: ${Array.from(graphFactsSet).join(' | ')}` : ''}` : '';

    const systemPrompt = `${activePrompt}
${systemEnrichment}
${memoryContext}
🚨 دستور الهوية والضمائر:
- أنت "Zoon OS"، المساعد الذكي لممدوح.
- عندما يسألك ممدوح عن "بناتي"، "أهلي"، أو "عائلتي"، أجب دائماً بـ "بناتك عُمرك" أو "عائلتك الكريمة". 
- لا تقل أبداً "بناتي" أو "أنا ممدوح". أنت لست بشراً.
- الأسماء (لمار وريتال) هم بنات ممدوح. أجب بـ: "بناتك هم لمار وريتال".
- توقف عن استخدام ضمير المتكلم للأشياء التي تخص ممدوح. أجب دائماً بالعربية الرصينة.`;

    // 2️⃣ اختيار المحرك (Chain Logic) - الأولوية للمحلي في بيئة الاختبار
    // نعتبر أي رسالة قد تحتاج قوة إذا كان هناك أدوات نشطة غير الذاكرة
    const needsPower = Object.keys(filteredTools).length > 1;
    const MODEL_CHAIN = needsPower 
      ? ['ollama:qwen2.5:7b', 'gemini-2.5-flash'] 
      : ['ollama:qwen2.5:7b', 'gemini-2.5-flash']; 

    // الاختيار: إذا كان المستخدم في فريق، الرؤى تُعتبر رؤى فريق (Hybrid)
    const currentScope: 'personal' | 'team' = TEAM_ID ? 'team' : 'personal';

    let lastError: any = null;
    for (const modelName of MODEL_CHAIN) {
      try {
        const isOllama = modelName.startsWith('ollama:');
        const provider = isOllama ? ollamaProvider : googleProvider;
        const actualModel = isOllama ? modelName.replace('ollama:', '') : modelName;

        const result = streamText({
          model: provider(actualModel),
          messages: modelMessages,
          system: systemPrompt,
          tools: filteredTools,
          toolChoice: 'auto',
          maxSteps: 5,
          onFinish: async ({ text, usage }: { text: string; usage: any }) => {
            if (!text) return;
            console.log(`✅ [AI Chain] ${modelName} finished.`);
            
            // تنفيذ العمليات الخلفية بدون تعطيل الرد
            setImmediate(async () => {
              try {
                const summary = await summarizeConversation([...messages, { role: 'assistant', content: text }]);
                const targetCtx = { wing: targetContext.wing || 'GENERAL', room: targetContext.room || 'HISTORY' };
                
                const thoughtChain = {
                  timestamp: new Date().toISOString(),
                  query: lastUserMessage,
                  wing: targetCtx.wing,
                  room: targetCtx.room,
                  modelUsed: modelName,
                  scope: currentScope,
                  memoriesUsed: [], // IDs are merged in the formatted string, not tracked separately yet
                  response_summary: text?.slice(0, 300) ?? null,
                  was_answered: typeof text === 'string' && text.length > 20,
                  memories_count: wakeUpFacts ? wakeUpFacts.split('\\n').filter(l => l.includes('•')).length : 0,
                  query_category: categorizeQuery(lastUserMessage)
                };

                await autoSaveInsights(USER_ID, summary, targetCtx, TEAM_ID, currentScope, thoughtChain);
                await extractAndSaveGraphRelations(USER_ID, [...messages, { role: 'assistant', content: text }], TEAM_ID, currentScope);
                await logAgentAction({
                  userId: USER_ID,
                  actionType: 'decision',
                  input: { query: lastUserMessage },
                  output: { summary },
                  thoughtChain,
                  modelUsed: modelName,
                  tokensUsed: usage?.totalTokens
                });
              } catch (e) {
                console.error('❌ [Background Error]:', e);
              }
            });
          }
        } as any);

        const responseData = result.toUIMessageStreamResponse();
        responseData.headers.set('x-zoon-model', modelName);
        return responseData;

      } catch (err: any) {
        lastError = err;
        console.warn(`⚠️ [AI Chain] Skip ${modelName}: ${err.message}`);
        continue; 
      }
    }

    throw lastError || new Error('All AI engines failed.');
  } catch (error: any) {
    console.error('❌ Zoon API Error:', error);
    return new Response(JSON.stringify({ error: error?.message }), { status: 500 });
  }
}

// ======================================
// دالة تصنيف النوايا والمواضيع
// ======================================
function categorizeQuery(query: string): string {
  if (!query) return 'general';
  const personal = ['بنات', 'أولاد', 'عائلة', 'زوج', 'اسمي', 'أنا', 'ابن', 'بنت'];
  const business = ['مبيعات', 'تقرير', 'عملاء', 'طلبات', 'إيراد', 'ربح', 'فاتور'];
  const technical = ['كود', 'خطأ', 'error', 'bug', 'قاعدة', 'API', 'server'];
  if (personal.some(k => query.includes(k))) return 'personal';
  if (business.some(k => query.includes(k))) return 'business';
  if (technical.some(k => query.includes(k))) return 'technical';
  return 'general';
}
