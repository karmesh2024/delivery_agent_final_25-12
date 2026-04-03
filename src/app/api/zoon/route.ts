import { streamText, generateText, convertToModelMessages, UIMessage, tool, jsonSchema } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { PrismaClient } from '@prisma/client';

// استيراد المهارات الأساسية
import { searchNewsTool } from '@/domains/zoon-os/skills/searchNewsTool';
import { alexDialectTool } from '@/domains/zoon-os/skills/alexDialectTool';
import { telegramTool } from '@/domains/zoon-os/skills/telegramTool';
import { publishToRoomTool } from '@/domains/zoon-os/skills/publishToRoomTool';
import { autoRouteRequest } from '@/domains/zoon-os/routing/auto-router';
import { memoryTool } from '@/domains/zoon-os/skills/memoryTool';
import { MemoryManager } from '@/domains/zoon-os/memory/memory-manager';
import { getEnrichedSystemContext } from '@/domains/zoon-os/context/system-context';
import { 
  webSearchHandler,  
  deepResearchHandler,
  imageOCRHandler,
  webFetchHandler,
  searchNewsHandler,
  alexDialectHandler,
  telegramHandler,
  publishToRoomHandler,
  saveMemoryHandler,
  HANDLERS
} from '@/domains/zoon-os/functions/handlers';
import { executeToolSafely } from '@/domains/zoon-os/execution/tool-executor';

export const maxDuration = 60;

// إعداد مقدمي الخدمة
const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const groqProvider = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});   

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const origin = new URL(req.url).origin;
    const USER_ID = 'admin-user-id';

    const lastUserMessage = (messages[messages.length - 1] as any)?.content?.toString() || '';
    const modelMessages = await convertToModelMessages(messages);
    
    // 1️⃣ بناء السياق
    const [userMemories, systemEnrichment] = await Promise.all([
      MemoryManager.retrieveMemories(USER_ID),
      getEnrichedSystemContext()
    ]);

    const memoryContext = userMemories.length > 0 
      ? `\n<memory>\nأنت تتذكر هذا عن المستخدم:\n${userMemories.map((m, i) => `${i + 1}. ${m.content}`).join('\n')}\n</memory>\n`
      : '';

    // 2️⃣ جلب المهارات
    let dynamicSkillsDb: any[] = [];
    try {
      dynamicSkillsDb = await (prisma as any).ai_skills.findMany({
        where: { is_active: true },
        include: { ai_skill_functions: { where: { is_active: true } } }
      });
    } catch (e) {}

    const dynamicTools: Record<string, any> = {};
    const dynamicToolNames: string[] = [];

    for (const skill of dynamicSkillsDb) {
      for (const fn of (skill.ai_skill_functions || [])) {
        const toolName = fn.name === 'execute' ? skill.name : `${skill.name}_${fn.name}`;
        dynamicToolNames.push(toolName);
        dynamicTools[toolName] = tool({
          description: fn.description || skill.description,
          inputSchema: jsonSchema(fn.input_schema as any) as any,
          execute: async (args: any) => {
            return await executeToolSafely(toolName, async () => {
              console.log(`[Tool Debug] ${toolName}:`, {
                fn_name: fn.name,
                fn_type: fn.type,
                fn_endpoint: fn.endpoint
              });

              const LOCAL_HANDLERS: Record<string, any> = {
                'web-search':       webSearchHandler,
                'deep-research':    deepResearchHandler,
                'image-ocr':        imageOCRHandler,
                'web-fetch':        webFetchHandler,
                'searchNews':       searchNewsHandler,
                'alexDialect':      alexDialectHandler,
                'telegram':         telegramHandler,
                'publishToRoom':    publishToRoomHandler,
                'saveMemory':       saveMemoryHandler,
              };

              const handler = LOCAL_HANDLERS[fn.name] 
                || LOCAL_HANDLERS[fn.endpoint] 
                || (HANDLERS as any)?.[fn.name] 
                || (HANDLERS as any)?.[fn.endpoint];

              if (!handler) {
                if (fn.endpoint && fn.type === 'webhook') {
                  const url = fn.endpoint.startsWith('http') 
                    ? fn.endpoint 
                    : `${origin}${fn.endpoint}`;
                  const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...args, userId: USER_ID })
                  });
                  return await res.json();
                }
                throw new Error(`Handler [${fn.name || fn.endpoint}] not found`);
              }

              const result = await handler({ ...args, userId: USER_ID });
              if (!result.success) throw new Error(result.error || 'Handler failed');
              return result.data ?? result;
            });
          }
        });
      }
    }

    // 3️⃣ تجميع الأدوات
    const allTools: Record<string, any> = {
      saveMemory: memoryTool,
      searchNews: searchNewsTool,
      alexDialect: alexDialectTool,
      telegram: telegramTool,
      publishToRoom: publishToRoomTool,
      web_search: tool({
        description: 'البحث السريع في الويب',
        inputSchema: jsonSchema({ type: 'object', properties: { query: { type: 'string' }, category: { type: 'string' } }, required: ['query'] }),
        execute: async (args: any) => (await webSearchHandler({ ...(args || {}), userId: USER_ID })).data
      }),
      deep_research: tool({
        description: 'بحث عميق وتحليل مفصّل من مصادر متعددة',
        inputSchema: jsonSchema({ type: 'object', properties: { query: { type: 'string' }, maxPages: { type: 'number' } }, required: ['query'] }),
        execute: async (args: any) => (await deepResearchHandler({ ...(args || {}), userId: USER_ID })).data
      }),
      image_search: tool({
        description: 'للبحث المصور في الإنترنت. استخدمها للبحث عن صور.',
        inputSchema: jsonSchema({ type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }),
        execute: async (args: any) => (await webSearchHandler({ ...(args || {}), category: 'images', userId: USER_ID })).data
      }),
      image_ocr: tool({
        description: 'تحليل الصور لمعالجة الرؤية واستخراج نصوص.',
        inputSchema: jsonSchema({ type: 'object', properties: { imageUrl: { type: 'string' }, prompt: { type: 'string' } }, required: ['imageUrl'] }),
        execute: async (args: any) => (await imageOCRHandler({ ...(args || {}), userId: USER_ID })).data
      }),
      web_fetch: tool({
        description: 'قراءة محتوى صفحة ويب أو رابط خارجي محدد',
        inputSchema: jsonSchema({ type: 'object', properties: { url: { type: 'string' }, usePlaywright: { type: 'boolean' } }, required: ['url'] }),
        execute: async (args: any) => (await webFetchHandler({ ...(args || {}), userId: USER_ID })).data
      }),
      ...dynamicTools
    };

    const { toolsToInclude } = autoRouteRequest(lastUserMessage, dynamicToolNames);
    const finalTools: Record<string, any> = {};
    
    // حقن الأدوات الذكي وحظر أدوات البحث العادية كلياً عند طلب صور
    const needsImages = /صوره|صور|أرني|ارني|وريني|هات|جيب|image|photo|pictures|img|ocr/i.test(lastUserMessage);
    let enabledNames = [...toolsToInclude];
    if (needsImages) {
      enabledNames.push('image_search', 'image_ocr');
    }

    enabledNames.forEach(name => { 
      const lowerName = name.toLowerCase();
      // حظر صارم جداً لأي أداة بحث نصي عند طلب صور لضمان استخدام أداة الصور والتحليل
      if (needsImages && (
          lowerName.includes('search') || 
          lowerName.includes('research') || 
          lowerName.includes('fetch')
      ) && !lowerName.includes('image_search')) {
        return; 
      }
      if (allTools[name]) finalTools[name] = allTools[name]; 
    });

    if (!needsImages && !finalTools.web_search && allTools.web_search) finalTools.web_search = allTools.web_search;
    if (!finalTools.saveMemory && allTools.saveMemory) finalTools.saveMemory = allTools.saveMemory;

    // 🔒 قفل الأمان المطور (Zoon v2.5): حظر أدوات البحث "العالمية" فقط عند طلب صور
    if (needsImages) {
      Object.keys(finalTools).forEach(key => {
        const lowerKey = key.toLowerCase();
        const isUserSkill = dynamicToolNames.includes(key);
        // لا نحذف الأداة إلا إذا كانت أداة بحث عالمية وليست مهارة خاصة بالمستخدم
        if (
          !isUserSkill && 
          (lowerKey.includes('search') || lowerKey.includes('research') || lowerKey.includes('fetch')) && 
          !lowerKey.includes('image_search')
        ) {
          delete finalTools[key];
        }
      });
    }

    // 🛡️ تذكير أخير للموديل في حال حاول الالتفاف
    const activeToolsList = Object.keys(finalTools).join(', ');
    const systemPrompt = `أنت زوون الهجين (Zoon OS). رد بالعربية الفصحى بذكاء وبطريقة ودودة.
${systemEnrichment}
${memoryContext}
الأدوات النشطة حالياً: ${activeToolsList}
` + (needsImages ? `⚠️ تنبيه حاسم: المستخدم طلب صوراً، يجب عليك استخدام أداة image_search فقط وتجاهل أي شيء آخر.` : "") + `

🚨 أوامر حاسمة جداً (CRITICAL):
1. عند استخدامك أدوات البحث أو الصور، **يجب** أن تستجيب بنص تفصيلي يشرح النتائج فور الانتهاء، إياك وأن تصمت أو تعيد النتيجة فارغة.
2. لكل موقع أو رابط مصدر تذكره، **يجب** استخدامه بتنسيق الماركدوان التالى: [اسم الموقع](الرابط)، ليظهر للمستخدم زر الحفظ.
3. صِغ الرد بطريقة بشرية ودودة، مع ذكر المصادر التي استعنت بها.
4. إذا كان الطلب لصور، فاستخدم 'image_search' فقط.
5. لعرض الصور، **يجب** استخدام التنسيق التالي لكل صورة: ![وصف الصورة](رابط_الصورة)
   بدون ذلك لن يرى المستخدم الصور أبداً!`;

    // 🚀 سلسلة التبديل المحدثة بناءً على مستندات الإيقاف (Deprecation)
    const MODEL_CHAIN = [
      'gemini-2.5-flash-lite',           // الأفضل لعام 2026: 15 RPM / 1000 يومياً
      'gemini-2.5-flash',                // جيد جداً: 10 RPM / 250 يومياً
      'groq:llama-3.3-70b-versatile',    // البديل المجاني غير المحدود تقريباً
      'gemini-2.5-pro',                  // للمهام المعقدة: 5 RPM / 100 يومياً
      'groq:llama-3.1-8b-instant'        // احتياطي سريع ومستقر
    ];

    let lastError: any = null;
    for (const modelName of MODEL_CHAIN) {
      try {
        console.log(`🤖 [AI Chain] Attempting: ${modelName}`);
        const isGroq = modelName.startsWith('groq:');
        const provider = isGroq ? groqProvider : googleProvider;
        const actualModel = isGroq ? modelName.replace('groq:', '') : modelName;

        // 🛡️ فحص الجاهزية لدعم الأدوات (Tool-Support Probe)
        try {
          await generateText({
            model: provider(actualModel),
            prompt: 'test_tools',
            tools: { ping: { description: 'ping', parameters: jsonSchema({ type: 'object', properties: {} }) } },
            toolChoice: 'auto',
            maxSteps: 1, 
            abortSignal: AbortSignal.timeout(5000), 
          } as any);
        } catch (e: any) {
          const msg = e.message?.toLowerCase() || '';
          console.warn(`⚠️ [AI Chain] ${modelName} pre-check failed: ${e.message}`);
          // ارمِ الخطأ للتخطي في حالات: الخطأ 400، 404، عدم التوافر، المهلة (Timeout)، أو الحصص
          if (msg.includes('400') || msg.includes('404') || msg.includes('not found') || msg.includes('instruction') || msg.includes('tool') || msg.includes('429') || msg.includes('timeout') || msg.includes('abort')) {
             throw e; 
          }
        }

        const streamOptions: any = {
          model: provider(actualModel),
          messages: modelMessages,
          system: systemPrompt,
          maxSteps: 7, 
          maxRetries: 0, 
          abortSignal: AbortSignal.timeout(59000),
          onFinish: ({ text }: any) => {
            if (!text) {
              console.warn(`⚠️ [AI Chain] ${modelName} finished with EMPTY text!`);
            } else {
              console.log(`✅ [AI Chain] ${modelName} generated ${text.length} chars.`);
            }
          }
        };

        if (Object.keys(finalTools).length > 0) {
          streamOptions.tools = finalTools;
          streamOptions.toolChoice = 'auto';
        }

        const result = streamText(streamOptions);
        const response = result.toUIMessageStreamResponse();
        
        response.headers.set('x-zoon-model', modelName);
        console.log(`✅ [AI Chain] Success with: ${modelName}`);
        return response;

      } catch (err: any) {
        lastError = err;
        console.error(`⚠️ [AI Chain] Skip ${modelName} due to error: ${err.message}`);
        continue; // الانتقال للموديل التالي
      }
    }

    throw lastError || new Error('All AI engines are currently unavailable.');
  } catch (error: any) {
    console.error('❌ Zoon API Error:', error);
    return new Response(JSON.stringify({ error: error?.message }), { status: 500 });
  }
}
