import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function registerFinancialSkill() {
  console.log('🚀 تسجيل مهارة الإدارة المالية في Zoon OS...');

  try {
    // 1. إنشاء المهارة الرئيسية
    const skill = await (prisma as any).ai_skills.upsert({
      where: { name: 'financialManager' },
      update: { is_active: true },
      create: {
        name: 'financialManager',
        description: 'إدارة العمليات المالية، حساب أرباح المناديب، جرد المستحقات، وتحليل صافي ربح الوكيل.',
        category: 'financial',
        source: 'code',
        type: 'function',
        is_active: true,
        input_schema: { type: 'object', properties: {} } 
      }
    });

    console.log(`✅ تم إنشاء/تحديث المهارة: ${skill.name}`);

    // 2. تسجيل وظيفة حساب الأرباح
    await (prisma as any).ai_skill_functions.upsert({
      where: { skill_id_name: { skill_id: skill.id, name: 'calcEarnings' } },
      update: { is_active: true },
      create: {
        skill_id: skill.id,
        name: 'calcEarnings',
        label: 'حساب مستحقات مندوب',
        description: 'حساب أرباح مندوب محدد خلال فترة زمنية.',
        type: 'webhook', 
        endpoint: '/api/internal/run-pipeline/financial-calc-earnings',
        input_schema: {
          type: 'object',
          properties: {
            driverId: { type: 'string', description: 'ID المندوب' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' }
          },
          required: ['driverId']
        }
      }
    });

    // 3. تسجيل وظيفة حساب ربح الوكيل
    await (prisma as any).ai_skill_functions.upsert({
      where: { skill_id_name: { skill_id: skill.id, name: 'calcAgentProfit' } },
      update: { is_active: true },
      create: {
        skill_id: skill.id,
        name: 'calcAgentProfit',
        label: 'حساب ربح الوكيل',
        description: 'حساب صافي ربح الوكيل عن فترة (اليوم، الأسبوع، الشهر).',
        type: 'webhook',
        endpoint: '/api/internal/run-pipeline/financial-calc-agent-profit',
        input_schema: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['today', 'this_week', 'this_month'], default: 'today' }
          }
        }
      }
    });

    console.log('✨ كل وظائف الإدارة المالية تم تسجيلها بنجاح!');
  } catch (error) {
    console.error('❌ فشل تسجيل المهارة:', error);
  } finally {
    await prisma.$disconnect();
  }
}

registerFinancialSkill();
