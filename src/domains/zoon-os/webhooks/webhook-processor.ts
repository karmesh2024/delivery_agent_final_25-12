import { generateText, tool, jsonSchema } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { PrismaClient } from '@prisma/client';

// استيراد المهارات الثابتة
import { searchNewsTool } from '../skills/searchNewsTool';
import { telegramTool } from '../skills/telegramTool';
import { publishToRoomTool } from '../skills/publishToRoomTool';

import { triggerZoonAgent } from './trigger-agent';

export interface WebhookPayload {
  event: string;             // مثال: 'delivery.delayed', 'alert.stock'
  data: Record<string, any>; // بيانات الحدث
  timestamp: string;
}

const prisma = new PrismaClient();
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

/**
 * معالج الـ Webhook الرئيسي - يتلقى الحدث ويوقظ الوكيل (Zoon Agent) للتعامل معه استباقياً
 */
export async function processWebhookEvent(
  userId: string,
  payload: WebhookPayload
): Promise<void> {
  console.info(`[Zoon Webhook Processor] 🔔 مستخدم ${userId} | تلقى حدث: ${payload.event}`);

  // بناء توجيه مُنظم للوكيل بناءً على الحدث الوارد
  const agentPrompt = buildPromptFromEvent(payload);

  // تشغيل الوكيل المستقل في الخلفية
  await triggerAutonomousAgent(userId, agentPrompt);
}

/**
 * استخراج صياغة واضحة للوكيل استناداً إلى نوع الحدث الوارد
 */
function buildPromptFromEvent(payload: WebhookPayload): string {
  // يمكن توسيع هذه القائمة حسب الأحداث المتوقعة من النظام
  const eventMessages: Record<string, (data: Record<string, any>) => string> = {
    'delivery.delayed': (d) =>
      `تنبيه استباقي: المندوب [${d.driverName} - ID: ${d.driverId}] متوقف في مكانه أو متأخر عن التسليم منذ ${d.minutesDelayed} دقيقة. 
      موقعه الحالي: ${d.location || 'غير معروف'}. 
      رقم الطلب: ${d.orderId}.
      المطلوب: قم بإرسال رسالة تليجرام للمندوب للاستفسار عن سبب التأخير، وصغ رسالة مناسبة كإشعار للمدير تخبره أنك تصرفت.`,
      
    'order.failed': (d) =>
      `تنبيه استباقي: فشل تسليم الطلب رقم ${d.orderId} للعميل ${d.customerName}. 
      السبب المسجل: ${d.reason}. 
      المطلوب: قم بتحليل المشكلة واقترح حلاً فورياً، وجهّز رسالة للإدارة.`,

    'system.alert': (d) =>
      `تنبيه نظام خطير: ${d.message}. 
      المستوى: ${d.severity}.
      المطلوب: النشر فوراً في غرفة الإدارة للتحذير.`,
  };

  const builder = eventMessages[payload.event];
  
  if (builder) {
    return builder(payload.data);
  }

  // Fallback لأي حدث غير مسجل
  return `ورد تنبيه استباقي من النظام نوعه: "${payload.event}". 
    تفاصيل البيانات: ${JSON.stringify(payload.data)}. 
    يرجى تقييم الموقف واتخاذ الإجراء المناسب إن لزم الأمر عبر الأدوات المتاحة لك.`;
}

/**
 * تشغيل الوكيل (Agent) بشكل خلفي لا يحتاج إلى واجهة شات (Autonomous)
 * يتم استخدام generateText للتعامل المباشر مع المهارات بدون تدفق (Streaming)
 */
async function triggerAutonomousAgent(userId: string, prompt: string) {
  try {
    console.log(`[Zoon Autonomous] 🤖 بدء التفكير المستقل لمعالجة الحدث...`);

    // جلب المهارات الديناميكية النشطة إن وجدت
    const dynamicSkillsDb = await prisma.ai_skills.findMany({ where: { is_active: true } });
    const dynamicTools: Record<string, any> = {};
    
    // (اختصار لتسريع العمل، يمكن إضافة معالج Tool Executor هنا كما في route الرئيسي)
    for (const skill of dynamicSkillsDb) {
      if (skill.type === 'hitl') {
        dynamicTools[skill.name] = tool({
          description: skill.description,
          inputSchema: jsonSchema(skill.input_schema as any) as any,
        });
      }
    }

    const systemPrompt = `
      أنت Zoon، وكيل استباقي يعمل في الخلفية لمراقبة العمليات (Autonomous Agent).
      أنت لا تتحدث مع المستخدم الآن بشكل مباشر، بل تتلقى "أحداث (Events)" من النظام وتتخذ الإجراءات.
      1. استخدم الأدوات المتاحة لمعالجة الحدث.
      2. إذا احتجت تنبيه الإدارة، يمكنك تجهيز رسائل عبر telegramTool أو publishToRoomTool.
      3. كن موجزاً، وردودك هنا ستُسجل في السجلات ولن تظهر مباشرة في الشات إلا إذا قمت بالنشر.
    `;

    const { text, toolCalls } = await generateText({
      model: google('gemini-2.5-flash'), // نستخدم نموذج Flash العادي بدلاً من Lite لتجنب استنفاد الحصة المجانية
      system: systemPrompt,
      prompt: prompt,
      tools: {
        searchNews: searchNewsTool,
        telegram: telegramTool,
        publishToRoom: publishToRoomTool,
        ...dynamicTools,
      },
      // ملاحظة: maxSteps متاح فقط في streamText وليس generateText في هذا الإصدار
    });

    console.log(`[Zoon Autonomous] 🏁 اكتمل التفكير المستقل.`);
    console.log(`[Zoon Autonomous] 💡 نتيجة الوكيل: ${text}`);
    if (toolCalls && toolCalls.length > 0) {
      console.log(`[Zoon Autonomous] 🛠️ الأدوات التي تم تجهيزها/تشغيلها:`, toolCalls.map(t => t.toolName).join(', '));
    }

    // هنا يمكن إضافة كود لـ:
    // 1. حفظ النص (text) في قاعدة البيانات كتنبيه جديد يظهر للمدير عندما يفتح الشات
    // 2. إطلاق Notification حقيقي في نظام الإشعارات
    
  } catch (error: any) {
    console.error(`[Zoon Autonomous] 💥 فشل الوكيل المستقل في التعامل مع الحدث:`, error.message);
  }
}
