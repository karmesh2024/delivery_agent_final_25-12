import { prisma } from '@/lib/prisma';
import { PipelineStep } from './pipeline-engine';

export interface SavedPipeline {
  name: string;              // 'monthly_profit_report'
  label: string;             // 'تقرير الأرباح الشهري'
  description: string;       // 'يحسب الأرباح ويصدّرها PDF ويرسلها تليجرام'
  icon?: string;             // '📊'
  steps: PipelineStep[];
  inputParams?: PipelineInputParam[];   // مدخلات يطلبها الوكيل من المدير
  isSchedulable?: boolean;              // هل يمكن جدولتها كـ Cron؟
}

export interface PipelineInputParam {
  key: string;          // 'startDate'
  label: string;        // 'تاريخ البداية'
  type: 'date' | 'text' | 'number' | 'select';
  required: boolean;
  default?: unknown;
  options?: string[];   // للـ select
}

/**
 * يحفظ Pipeline ويحوّلها تلقائياً إلى Skill
 * هذه هي الدالة الرئيسية التي تستدعيها واجهة Workflow Builder
 */
export async function savePipelineAsSkill(
  pipeline: SavedPipeline,
  createdBy: string
): Promise<{ skillId: string; pipelineId: string }> {

  return await (prisma as any).$transaction(async (tx: any) => {
    // ===== 1. البحث عن مهارة موجودة بنفس الاسم لضمان التحديث الصحيح =====
    const existingSkill = await tx.ai_skills.findUnique({
      where: { name: pipeline.name }
    });

    let savedPipeline;
    if (existingSkill && existingSkill.pipeline_id) {
       // تحديث البايبلاين المرتبط بالمهارة الموجودة
       savedPipeline = await tx.function_pipelines.update({
         where: { id: existingSkill.pipeline_id },
         data: {
           description: pipeline.description,
           nodes: pipeline.steps,
           updated_at: new Date()
         }
       });
    } else {
       // إنشاء بايبلاين جديد (أو تحديث في حال وجدنا بايبلاين بنفس الاسم كـ fallback)
       // ملاحظة: بما أن name ليس unique، سنقوم بالبحث عنه أولاً لتجنب التكرار الزائد
       const oldPipeline = await tx.function_pipelines.findFirst({
         where: { name: pipeline.name }
       });

       if (oldPipeline) {
         savedPipeline = await tx.function_pipelines.update({
           where: { id: oldPipeline.id },
           data: {
             description: pipeline.description,
             nodes: pipeline.steps,
             updated_at: new Date()
           }
         });
       } else {
         savedPipeline = await tx.function_pipelines.create({
           data: {
             name: pipeline.name,
             description: pipeline.description,
             nodes: pipeline.steps,
             created_by: createdBy,
             is_active: true
           }
         });
       }
    }

    // ===== 2. تحديث أو إنشاء الـ Skill Module =====
    const skillModule = await tx.ai_skills.upsert({
      where: { name: pipeline.name },
      update: {
        description: buildSkillDescription(pipeline),
        icon: pipeline.icon ?? inferIcon(pipeline.steps),
        pipeline_id: savedPipeline.id,
        updated_at: new Date()
      },
      create: {
        name: pipeline.name,
        description: buildSkillDescription(pipeline),
        icon: pipeline.icon ?? inferIcon(pipeline.steps),
        category: 'workflow',          
        source: 'workflow_builder',    
        pipeline_id: savedPipeline.id, 
        is_active: true,
        type: 'pipeline'
      }
    });

    // ===== 3. تنظيف الوظائف القديمة وإنشاء وظيفة "execute" =====
    await tx.ai_skill_functions.deleteMany({
      where: { skill_id: skillModule.id }
    });

    await tx.ai_skill_functions.create({
      data: {
        skill_id: skillModule.id,
        name: 'execute',
        label: `تشغيل: ${pipeline.label}`,
        description: pipeline.description,
        type: 'pipeline',               
        endpoint: `/api/internal/run-pipeline/${savedPipeline.id}`,
        input_schema: buildInputSchema(pipeline.inputParams ?? []),
        is_active: true,
        sort_order: 1
      }
    });

    console.log(`✅ تم تحديث/إنشاء المسار "${pipeline.label}" بنجاح`);

    return {
      skillId: skillModule.id,
      pipelineId: savedPipeline.id
    };
  });
}

/**
 * بناء وصف Skill من Pipeline بشكل تلقائي
 */
function buildSkillDescription(pipeline: SavedPipeline): string {
  const stepLabels = pipeline.steps
    .map(s => s.nodeId.replace(/-/g, ' '))
    .join(' ← ');

  return `${pipeline.description}\n\nالخطوات: ${stepLabels}`;
}

/**
 * استنتاج الأيقونة تلقائياً من نوع الـ steps
 */
function inferIcon(steps: PipelineStep[]): string {
  const nodeIds = steps.map(s => s.nodeId).join(',');
  if (nodeIds.includes('export-pdf'))    return '📄';
  if (nodeIds.includes('send-telegram')) return '📨';
  if (nodeIds.includes('calc-profits'))  return '💰';
  if (nodeIds.includes('web-search'))    return '🔍';
  if (nodeIds.includes('file'))          return '📁';
  return '⚡';
}

/**
 * تحويل inputParams إلى JSON Schema
 */
function buildInputSchema(params: PipelineInputParam[]): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const param of params) {
    properties[param.key] = {
      type: param.type === 'date' ? 'string' : param.type,
      title: param.label,
      description: `قيمة لـ ${param.label}`,
      ...(param.default !== undefined && { default: param.default }),
      ...(param.options && { enum: param.options })
    };
    if (param.required) required.push(param.key);
  }

  return {
    type: 'object',
    properties,
    required
  };
}
