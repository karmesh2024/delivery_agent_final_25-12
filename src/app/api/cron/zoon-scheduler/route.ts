import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { PrismaClient } from '@prisma/client';

// استيراد المهارات التي يمكن أن ينفذها الوكيل في الخلفية
import { telegramTool } from '@/domains/zoon-os/skills/telegramTool';
import { publishToRoomTool } from '@/domains/zoon-os/skills/publishToRoomTool';
import { getEnrichedSystemContext } from '@/domains/zoon-os/context/system-context';

// ✅ الاستخدام الصحيح لـ cron-parser v5: CronExpressionParser.parse() هي الـ static method
import { CronExpressionParser } from 'cron-parser';

export const maxDuration = 60; // 60 ثانية حد أقصى للتنفيذ

import prisma from '@/lib/db';
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

/**
 * 🕧 مُشغل المهام المجدولة (Background Worker Endpoint)
 * يتم استدعاؤه عن طريق Vercel Cron أو أداة جدولة خارجية مرة كل فترة.
 * يقوم بالبحث عن المهام المفعلة، يُطابق وقتها، وينفذها ذاتياً في الخلفية.
 */
export async function GET(req: Request) {
  
  // ✅ [أمان] التحقق من CRON_SECRET في Production
  // في التطوير لا يشترط، لكن في Production أي شخص سيعرف الـ URL يستطيع تشغيل كل المهام!
  if (process.env.NODE_ENV === 'production') {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('[Zoon Cron] ⛔ محاولة وصول غير مصرح بها للمُجدول!');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    console.log('[Zoon Cron] ⏰ جاري التحقق من المهام المجدولة (Scheduled Triggers)...');

    // 1. جلب جميع المهام النشطة من قاعدة البيانات
    const allActiveTasks = await (prisma as any).scheduled_triggers.findMany({
      where: { is_active: true }
    });

    if (allActiveTasks.length === 0) {
      console.log('[Zoon Cron] 💤 لا توجد مهام نشطة حالياً في الداتابيز.');
      return NextResponse.json({ message: 'No active scheduled tasks found.' });
    }

    // 2. ✅ فلترة المهام لمعرفة التي حان موعدها
    const now = new Date();
    const activeTasks: any[] = [];

    for (const task of allActiveTasks) {
      if (task.trigger_type === 'cron' || !task.trigger_type) {
        // فحص الـ Cron
        try {
          const interval = CronExpressionParser.parse(task.cron_expression || '0 9 * * *');
          const prevExecutionTime = interval.prev().toDate().getTime();
          const msPassed = now.getTime() - prevExecutionTime;
          if (msPassed >= 0 && msPassed < (2 * 60 * 1000)) {
            activeTasks.push(task);
          }
        } catch (err) {
          console.error(`[Zoon Cron] ❌ Cron غير صالح لـ "${task.task_name}"`);
        }
      } else if (task.trigger_type === 'condition' && task.condition_query) {
        // ✅ فحص الشرط عن طريق تنفيذ SQL القادم من الداتابيز
        try {
          const result: any[] = await prisma.$queryRawUnsafe(task.condition_query);
          const firstValue = result[0] ? Object.values(result[0])[0] : 0;
          const numericValue = Number(firstValue);
          const targetValue = Number(task.condition_value);

          let triggered = false;
          switch (task.condition_operator) {
            case '>': triggered = numericValue > targetValue; break;
            case '<': triggered = numericValue < targetValue; break;
            case '=': triggered = numericValue == targetValue; break;
            case '!=': triggered = numericValue != targetValue; break;
          }

          if (triggered) {
            // لتجنب تكرار التشغيل، نفحص آخر وقت تشغيل (مثلاً نمنع التشغيل أكثر من مرة كل ساعة لنفس الشرط)
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            if (!task.last_run_at || new Date(task.last_run_at) < oneHourAgo) {
              activeTasks.push(task);
            }
          }
        } catch (err) {
          console.error(`[Zoon Cron] ❌ فشل تنفيذ استعلام الشرط لـ "${task.task_name}":`, err);
        }
      }
    }

    if (activeTasks.length === 0) {
      console.log(`[Zoon Cron] 💤 لا شيء للقيام به حالياً. (${now.toLocaleString('ar-EG')})`);
      return NextResponse.json({ message: 'No tasks triggered.' });
    }

    console.log(`[Zoon Cron] 🚀 ${activeTasks.length} مهمة(مهام) سيتم تنفيذها الآن...`);

    // 3. جلب حالة النظام الحية لإرفاقها للوكيل
    const systemEnrichment = await getEnrichedSystemContext();

    const executionResults = [];

    // 4. تشغيل الوكيل لكل مهمة بشكل منفصل
    for (const task of activeTasks) {
      console.log(`[Zoon Cron] ▶️ تنفيذ: "${task.task_name}"`);

      const systemPrompt = `
        أنت Zoon OS Agent. تعمل الآن في الخلفية كموظف آلي (Background Worker).
        مهمتك الحالية: ${task.task_name}.
        ${task.description ? `وصف المهمة: ${task.description}` : ''}
        
        بيانات النظام الحالية:
        ${systemEnrichment}
        
        تعليمات:
        - نفذ المطلوب مباشرة باستخدام الأدوات المتاحة.
        - لا تطلب تأكيداً، أنت تعمل تلقائياً.
        - إذا فشل أداء مهمة، سجّل الخطأ وعُد بتلخيص ما حدث.
      `;

      try {
        // ✅ generateText بدلاً من streamText للـ Background Tasks (لا احتياج للـ Streaming)
        // ملاحظة: maxSteps غير مدعوم في generateText في هذا الإصدار من AI SDK.
        // للتحكم في دورات الأداة، استخدم tools بحذر أو قم بالترقية عند توفره.
        const result = await generateText({
          model: google('gemini-2.5-flash'),
          system: systemPrompt,
          prompt: task.prompt_template,
          tools: {
            telegram: telegramTool,
            publishToRoom: publishToRoomTool,
          }
        });

        // تحديث وقت آخر تشغيل للمهمة
        await (prisma as any).scheduled_triggers.update({
          where: { id: task.id },
          data: { last_run_at: new Date() }
        });

        console.log(`[Zoon Cron] ✅ "${task.task_name}" — اكتملت بنجاح.`);
        executionResults.push({
          task: task.task_name,
          status: 'success',
          agent_thought: result.text
        });

      } catch (taskError: any) {
        // ✅ سجّل الخطأ لكن لا توقف بقية المهام
        console.error(`[Zoon Cron] ❌ فشل في تنفيذ "${task.task_name}":`, taskError.message);
        executionResults.push({
          task: task.task_name,
          status: 'error',
          error: taskError.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم إتمام فحص المهام المجدولة بنجاح. نُفِّذ ${activeTasks.length} مهمة.`,
      results: executionResults
    });

  } catch (error: any) {
    console.error('[Zoon Cron] ❌ خطأ فادح في معالج المهام المجدولة:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
