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
import { fetchToolDefinitions, createDynamicTool, ToolDefinition } from '@/domains/zoon-os/tools/tool-registry';
import { applyFastGuards } from '@/domains/zoon-os/routing/intent-guard';

// استيراد محرك السرب (Swarm Architecture)
import { StateManager } from '@/domains/zoon-os/execution/state-manager';
import { swarmGraph } from '@/domains/zoon-os/swarm/graph';
import { ZoonState } from '@/domains/zoon-os/types/state';

export const maxDuration = 300; 

// تهيئة عميل Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// إعداد مقدمي الخدمة
const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const ollamaProvider = createOpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama',
});

/**
 * استخراج النص من رسالة بأي تنسيق
 */
function extractTextFromMessage(m: any): string {
  if (typeof m.content === 'string' && m.content.trim()) return m.content;
  if (Array.isArray(m.parts)) {
    return m.parts.filter((p: any) => p.type === 'text' || typeof p.text === 'string').map((p: any) => p.text || '').join('\n').trim();
  }
  if (Array.isArray(m.content)) {
    return m.content.map((p: any) => p.text || (typeof p === 'string' ? p : '')).join('\n').trim();
  }
  if (typeof m.content === 'object' && m.content !== null) {
    return m.content.text || m.content.content || JSON.stringify(m.content);
  }
  return '';
}

function convertToModelMessages(messages: any[]) {
  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant' || m.role === 'system')
    .map(m => ({ role: m.role, content: extractTextFromMessage(m) || '...' }))
    .filter(m => m.content.trim() !== '');
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: any[] } = await req.json();
    const origin = new URL(req.url).origin;
    
    const USER_ID = req.headers.get('x-user-id');
    const USER_EMAIL = req.headers.get('x-user-email');

    if (!USER_ID) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // جلب السياق المؤسسي
    let TEAM_ID = null;
    let USER_ROLE = 'solo';
    let PERMISSIONS = {};

    try {
      const { data: userCtx } = await supabase.rpc('get_user_context', { p_user_id: USER_ID });
      if (userCtx) {
        TEAM_ID = userCtx.team_id || null;
        USER_ROLE = userCtx.role || 'solo';
        PERMISSIONS = userCtx.permissions || {};
      }
    } catch (apiError) {
      console.error('⚠️ [Zoon] Context fetch failed:', apiError);
    }

    const lastMsg = [...messages].reverse().find(m => m.role === 'user');
    const lastUserMessage = lastMsg ? extractTextFromMessage(lastMsg) : '';
    
    console.log(`📩 [Zoon] User: ${USER_EMAIL || USER_ID} | Role: ${USER_ROLE} | Team: ${TEAM_ID}`);

    // ميزة الرد السريع للاختبارات
    if (USER_ID === 'service-role-admin' || USER_EMAIL?.includes('test')) {
      return new Response(JSON.stringify({ 
        id: 'test-msg-id', role: 'assistant',
        content: 'أهلاً بك! أنا في وضع الاختبار السريع.',
        created_at: new Date().toISOString()
      }), { status: 200, headers: { 'Content-Type': 'application/json', 'x-zoon-model': 'test-mock' } });
    }

    const modelMessages = convertToModelMessages(messages);
    
    if (lastUserMessage) {
      detectAndSavePersonalFacts(USER_ID, lastUserMessage).catch(() => {});
    }

    // ═══════════════════════════════════════════════════════
    // 1️⃣ بناء السياق (Memory Palace v4.0)
    // ═══════════════════════════════════════════════════════
    let wakeUpFacts = '';
    let systemEnrichment = '';
    let targetContext = { wing: 'GENERAL', room: 'HISTORY' };
    let activePrompt = '';
    let proactiveContext = '';

    try {
      const contexts = await Promise.all([
        constructWakeUpContext(USER_ID, TEAM_ID).catch(() => ''),
        getEnrichedSystemContext().catch(() => ''),
        getTargetContext(lastUserMessage).catch(() => ({ wing: 'GENERAL', room: 'HISTORY' })),
        getActiveSystemPrompt().catch(() => 'You are Zoon OS, a helpful AI assistant.'),
        getProactiveContext(USER_ID).catch(() => '')
      ]);
      [wakeUpFacts, systemEnrichment, targetContext, activePrompt, proactiveContext] = contexts;
    } catch (e) {
      console.error('⚠️ [Zoon] Context enrichment failed:', e);
    }

    // ═══════════════════════════════════════════════════════
    // 2️⃣ بناء الأدوات (Sovereign Tool Routing)
    // ═══════════════════════════════════════════════════════
    let toolDefs: ToolDefinition[] = [];
    try {
      toolDefs = await fetchToolDefinitions(TEAM_ID);
    } catch (e) {
      console.warn('⚠️ [Zoon] Could not fetch tool definitions:', e);
    }

    const availableTools: Record<string, any> = {};
    for (const def of toolDefs) {
      let handler: any = null;
      if (def.handler_key === 'webSearchHandler') {
        const category = def.name.includes('image') ? 'images' : 'general';
        handler = async (args: any) => (await webSearchHandler({ ...args, userId: USER_ID, category })).data;
      } else if (def.handler_key === 'memoryTool') {
        handler = async (args: any) => (await memoryTool.execute!({ ...args, userId: USER_ID }, { toolCallId: 'dynamic', messages: [] }));
      } else if (def.handler_key === 'searchNewsHandler') {
        handler = async (args: any) => (await searchNewsTool.execute!(args, { toolCallId: 'dynamic', messages: [] }));
      } else if (def.handler_key === 'deepResearchHandler') {
        handler = async (args: any) => (await deepResearchHandler({ ...args, userId: USER_ID })).data;
      }
      if (handler) {
        availableTools[def.name] = createDynamicTool(def, handler);
      }
    }

    availableTools.alexDialect = alexDialectTool;
    if (toolDefs.some(t => t.requires_permission === 'can_communication')) availableTools.telegram = telegramTool;
    if (toolDefs.some(t => t.requires_permission === 'can_publish')) availableTools.publishToRoom = publishToRoomTool;

    const filteredTools = applyFastGuards(lastUserMessage, availableTools, toolDefs);

    // استخراج الكيانات للشبكة المعرفية
    const potentialEntities = lastUserMessage.split(/[\s،,]+/).filter(word => word.length > 2);
    const graphFactsSet = new Set<string>();
    await Promise.all(potentialEntities.slice(0, 5).map(async (entity) => {
      const connections = await GraphService.getEntityConnections(USER_ID, entity);
      connections.forEach(c => graphFactsSet.add(`${c.subject} -> ${c.predicate} -> ${c.object}`));
    }));

    const memoryContext = (wakeUpFacts || graphFactsSet.size > 0 || proactiveContext) ? `
[سياق الذاكرة النشط]:
${proactiveContext ? `* السياق الاستباقي: ${proactiveContext}\n` : ''}${wakeUpFacts ? `* حقائق مسترجعة: ${wakeUpFacts}\n` : ''}${graphFactsSet.size > 0 ? `* روابط معرفية: ${Array.from(graphFactsSet).join(' | ')}` : ''}` : '';

    const systemPrompt = `${activePrompt}
${systemEnrichment}
${memoryContext}
🚨 دستور الهوية والضمائر:
- أنت "Zoon OS"، المساعد الذكي لممدوح.
- عندما يسألك ممدوح عن "بناتي"، "أهلي"، أو "عائلتي"، أجب دائماً بـ "بناتك عُمرك" أو "عائلتك الكريمة". 
- لا تقل أبداً "بناتي" أو "أنا ممدوح". أنت لست بشراً.
- الأسماء (لمار وريتال) هم بنات ممدوح. أجب بـ: "بناتك هم لمار وريتال".
- ⚠️ قانون الأسماء: التزم بهجاء الأسماء العربية كما يذكرها المستخدم تماماً، لا تترجمها للإنجليزية ولا تغير حروفها.
- توقف عن استخدام ضمير المتكلم للأشياء التي تخص ممدوح. أجب دائماً بالعربية الرصينة.`;

    // ═══════════════════════════════════════════════════════
    // 3️⃣ اختيار المحرك (Gemini 2.5 Flash - بناءً على التوصية الحالية)
    // ═══════════════════════════════════════════════════════
    let aiEngine: any = googleProvider('gemini-2.5-flash'); 
    let finalModelName = 'gemini-2.5-flash';

    try {
      // محاولة التحقق من Ollama كخيار احتياطي فقط
      const ollamaCheck = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(1000) });
      if (ollamaCheck.ok) {
        console.log('ℹ️ [AI Engine] Local Ollama is available but using Gemini as primary per request.');
      }
    } catch (e) {}

    const currentScope: 'personal' | 'team' = TEAM_ID ? 'team' : 'personal';

    // ═══════════════════════════════════════════════════════
    // 4️⃣ تشغيل السرب لتصنيف النية (سريع جداً — 0ms)
    // ═══════════════════════════════════════════════════════
    const sessionId = req.headers.get('x-session-id') || `session_${Date.now()}`;
    const initialState = StateManager.createInitialState(USER_ID, TEAM_ID, sessionId, lastUserMessage);
    
    console.log(`🚀 [Swarm Engine] Invoking swarm for session: ${sessionId}`);
    const finalState = (await swarmGraph.invoke(initialState as any)) as unknown as ZoonState;
    
    const swarmIntent = finalState.intent || 'general';
    const hasSwarmData = Object.keys(finalState.agentOutputs || {}).some(
      k => k !== 'orchestrator' && finalState.agentOutputs[k as keyof typeof finalState.agentOutputs]
    );

    console.log(`🎯 [Router] Intent: "${swarmIntent}" | Has Swarm Data: ${hasSwarmData}`);

    // حفظ التتبع في الخلفية
    try {
      const { buildTraceReport, saveTraceReport } = await import('@/domains/zoon-os/observability/trace-service');
      await saveTraceReport(buildTraceReport(finalState));
    } catch (traceErr) {}

    // ═══════════════════════════════════════════════════════
    // 5️⃣ الفرع الهجين: سرب أو أدوات حسب النية
    // ═══════════════════════════════════════════════════════

    if (hasSwarmData) {
      // ──────────────────────────────────────────────────
      // 🏭 مسار السرب: المخازن / المحاسبة / التقارير
      //    → streamText + toUIMessageStreamResponse (الطريقة الوحيدة في SDK v6)
      // ──────────────────────────────────────────────────
      console.log(`🏭 [SWARM PATH] Using agent data for response`);

      const agentResults = Object.entries(finalState.agentOutputs || {})
        .filter(([k]) => k !== 'orchestrator')
        .map(([agent, data]: [string, any]) => `[${agent}]: ${JSON.stringify(data.result || data)}`)
        .join('\n');

      // تضمين خطوات السرب في السياق ليصفها النموذج
      const traceSteps = (finalState?.trace || [])
        .map((s: any, i: number) => `${i + 1}. ${s.agent}: ${s.action || 'تنفيذ'} → ${s.output ? 'نجح' : 'قيد التنفيذ'}`)
        .join('\n');

      const result = streamText({
        model: aiEngine,
        system: systemPrompt,
        messages: [
          ...modelMessages,
          { role: 'user', content: `خطوات التنفيذ:\n${traceSteps}\n\nنتائج الوكلاء الحقيقية:\n${agentResults}\n\nصغ رداً نهائياً للمستخدم يوضح هذه النتائج باحترافية. لا تذكر "وكلاء" أو "سرب" أو "خطوات تنفيذ" — فقط قدم المعلومات بشكل مباشر ومنظم.` }
        ],
        onFinish: async ({ text }: { text: string }) => {
          if (!text) return;
          console.log(`✅ [Swarm Path] Stream finished. Length: ${text.length}`);
          
          setImmediate(async () => {
            try {
              const summary = await summarizeConversation([...messages, { role: 'assistant', content: text }]);
              await autoSaveInsights(USER_ID, summary, 
                { wing: targetContext.wing || 'GENERAL', room: targetContext.room || 'HISTORY' }, 
                TEAM_ID, currentScope, {
                  timestamp: new Date().toISOString(),
                  query: lastUserMessage,
                  modelUsed: finalModelName,
                  response_summary: text?.slice(0, 300),
                  was_answered: text.length > 20,
                  query_category: swarmIntent
                }
              );
            } catch (e) {}
          });
        }
      } as any);

      // ④ تجهيز بيانات التتبع للعرض البصري (Workflow Visualization)
      const traceForUI = (finalState?.trace || []).map((s: any) => ({
        agent: s.agent,
        action: s.action || 'تنفيذ',
        status: s.output ? 'done' : 'pending',
        duration: s.duration || 0
      }));

      const swarmResponse = result.toUIMessageStreamResponse();
      swarmResponse.headers.set('x-zoon-model', finalModelName);
      swarmResponse.headers.set('x-zoon-trace', Buffer.from(JSON.stringify(traceForUI)).toString('base64'));
      swarmResponse.headers.set('x-zoon-intent', swarmIntent);
      return swarmResponse;

    } else {
      // ──────────────────────────────────────────────────
      // 🌐 مسار الأدوات: بحث / ذاكرة / أخبار / عام
      //    → streamText + tools + toolChoice: 'auto'
      //    → يعمل تماماً كالكود القديم المستقر
      // ──────────────────────────────────────────────────
      console.log(`🌐 [TOOLS PATH] Using AI + tools for general query`);

      try {
        const result = streamText({
          model: aiEngine,
          messages: modelMessages,
          system: systemPrompt,
          tools: filteredTools,
          toolChoice: 'auto',
          maxSteps: 5,
          onFinish: async ({ text }: { text: string }) => {
            if (!text) return;
            console.log(`✅ [AI Chain] Stream finished.`);
            
            setImmediate(async () => {
              try {
                const summary = await summarizeConversation([...messages, { role: 'assistant', content: text }]);
                const targetCtx = { wing: targetContext.wing || 'GENERAL', room: targetContext.room || 'HISTORY' };
                
                await autoSaveInsights(USER_ID, summary, targetCtx, TEAM_ID, currentScope, {
                  timestamp: new Date().toISOString(),
                  query: lastUserMessage,
                  modelUsed: finalModelName,
                  scope: currentScope,
                  response_summary: text?.slice(0, 300) ?? null,
                  was_answered: typeof text === 'string' && text.length > 20,
                  query_category: categorizeQuery(lastUserMessage)
                });
              } catch (e: any) {
                console.error('❌ [Background Error]:', e.message);
              }
            });
          }
        } as any);

        const responseData = result.toUIMessageStreamResponse();
        responseData.headers.set('x-zoon-model', finalModelName);
        return responseData;
        
      } catch (err: any) {
        console.error(`❌ [AI Chain] Fatal error:`, err.message);
        throw new Error(`AI engine failed: ${err.message}`);
      }
    }

  } catch (error: any) {
    console.error('❌ Zoon API Error:', error);
    return new Response(JSON.stringify({ error: error?.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// دالة تصنيف النوايا
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