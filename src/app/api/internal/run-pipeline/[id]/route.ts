import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runPipeline } from '@/domains/zoon-os/functions/pipeline/pipeline-engine';
import { createPipelineContext } from '@/domains/zoon-os/functions/tracing/pipeline-context';

export async function POST(
  req: NextRequest,
  routeContext: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // الأسلوب الجديد في Next.js: الـ params قد تكون Promise ويجب انتظارها
    const resolvedParams = await routeContext.params;
    const idParam = resolvedParams.id;

    const body = await req.json();
    const { userParams, userId, triggeredBy = 'agent' } = body;

    // 1. جلب الـ Pipeline من قاعدة البيانات
    // التحقق أولاً إذا كان المُدخل UUID صالح لكي لا يفشل Prisma عند البحث في حقل ID
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam);
    
    const pipeline = await (prisma as any).function_pipelines.findFirst({
      where: {
        OR: [
          ...(isValidUUID ? [{ id: idParam }] : []),
          { name: idParam }
        ]
      }
    });

    if (!pipeline) {
      return new Response(JSON.stringify({ error: 'Pipeline not found' }), { status: 404 });
    }

    // 2. دمج مدخلات المستخدم (User Params) في الخطوات
    const rawSteps = typeof pipeline.nodes === 'string' ? JSON.parse(pipeline.nodes) : pipeline.nodes;
    const resolvedSteps = injectUserParams(rawSteps, userParams ?? {});

    // 3. إنشاء سياق التتبع (Context)
    const context = createPipelineContext(userId ?? 'system', triggeredBy, pipeline.id);

    // 4. تشغيل الـ Pipeline عبر المحرك
    const result = await runPipeline(resolvedSteps, context);

    return NextResponse.json({
      success: result.success,
      traceId: result.traceId,
      summary: buildExecutionSummary(result),
      steps: result.steps,
      finalData: result.finalData
    });

  } catch (error: any) {
    console.error('❌ خطأ أثناء تشغيل الـ Pipeline المحفوظة:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'حدث خطأ داخلي أثناء التشغيل' 
    }, { status: 500 });
  }
}

/**
 * دالة لحقن المتغيرات القادمة من المستخدم في بارامترات الخطوات
 * تبحث عن أي قيمة نصية تتبع نمط {{input.variableName}}
 */
function injectUserParams(
  steps: any[],
  userParams: Record<string, any>
): any[] {
  return steps.map(step => ({
    ...step,
    params: iterateAndReplace(step.params, userParams)
  }));
}

function iterateAndReplace(obj: any, userParams: Record<string, any>): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => iterateAndReplace(item, userParams));
  }

  const newObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.includes('{{input.')) {
      // استخراج المفتاح، مثلاً من {{input.startDate}} نحصل على startDate
      const replacedValue = value.replace(/\{\{input\.([^}]+)\}\}/g, (_, paramKey) => {
        return userParams[paramKey] !== undefined ? String(userParams[paramKey]) : `{{input.${paramKey}}}`;
      });
      newObj[key] = replacedValue;
    } else if (typeof value === 'object') {
      newObj[key] = iterateAndReplace(value, userParams);
    } else {
      newObj[key] = value;
    }
  }
  return newObj;
}

function buildExecutionSummary(result: any): string {
  const successCount = result.steps.filter((s: any) => s.success).length;
  const total = result.steps.length;
  return result.success
    ? `✅ اكتملت جميع الخطوات بنجاح (${total}/${total})`
    : `⚠️ فشلت العملية: اكتملت ${successCount} من أصل ${total} خطوات`;
}
