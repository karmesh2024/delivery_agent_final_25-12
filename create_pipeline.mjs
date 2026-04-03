import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // جلب الـ Pipeline بالاسم
    const existingPipeline = await prisma.function_pipelines.findFirst({
      where: { name: 'financial-calc-agent-profit' }
    });

    if (existingPipeline) {
      const pipeline = await prisma.function_pipelines.update({
        where: { id: existingPipeline.id },
        data: {
          name: 'financial-calc-agent-profit',
          description: 'حساب أرباح الوكيل',
          is_active: true,
          nodes: [
            {
              nodeId: 'financial-calc-agent-profit',
              params: { period: '{{input.period}}' }, // يتم حقن المتغير من المستخدم
            }
          ]
        }
      });
      console.log('✅ تم تحديث الـ Pipeline بنجاح! ID:', pipeline.id);
    } else {
      console.log('❌ لم يتم العثور على الـ Pipeline');
    }
  } catch (error) {
    console.error('❌ حدث خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
