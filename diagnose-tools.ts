import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function diagnose() {
  console.log('🔍 === تشخيص مشكلة عدم ظهور المهارات المالية ===\n');

  // 1. فحص الـ System Prompt النشط
  console.log('📝 1. الـ System Prompt النشط:');
  try {
    const prompt = await (prisma as any).system_prompts.findFirst({ where: { is_active: true } });
    if (prompt) {
      console.log(`   الاسم: ${prompt.name || 'غير محدد'}`);
      console.log(`   المحتوى (أول 500 حرف):\n   "${prompt.content?.substring(0, 500)}"\n`);
    } else {
      console.log('   ❌ لا يوجد prompt نشط\n');
    }
  } catch (e: any) {
    console.log(`   ⚠️ خطأ: ${e.message}\n`);
  }

  // 2. فحص المهارات النشطة
  console.log('🧩 2. المهارات النشطة:');
  try {
    const skills = await (prisma as any).ai_skills.findMany({
      where: { is_active: true },
      include: { ai_skill_functions: { where: { is_active: true } } }
    });
    for (const s of skills) {
      const fns = s.ai_skill_functions?.map((f: any) => f.name).join(', ') || 'لا توجد وظائف';
      console.log(`   ✅ ${s.name} (${s.category}) → وظائف: [${fns}]`);
    }
  } catch (e: any) {
    console.log(`   ⚠️ خطأ: ${e.message}`);
  }

  // 3. محاكاة بناء الأدوات
  console.log('\n🔧 3. محاكاة الأدوات التي سيتم إرسالها للـ AI:');
  const hardcodedTools = ['saveMemory', 'searchNews', 'alexDialect', 'telegram', 'publishToRoom'];
  console.log(`   أدوات ثابتة: [${hardcodedTools.join(', ')}]`);
  
  try {
    const skills = await (prisma as any).ai_skills.findMany({
      where: { is_active: true },
      include: { ai_skill_functions: { where: { is_active: true } } }
    });
    const dynamicToolNames: string[] = [];
    for (const skill of skills) {
      const fns = skill.ai_skill_functions || [];
      if (fns.length === 0) {
        dynamicToolNames.push(skill.name);
      } else {
        for (const fn of fns) {
          const name = fn.name === 'execute' ? skill.name : `${skill.name}_${fn.name}`;
          dynamicToolNames.push(name);
        }
      }
    }
    console.log(`   أدوات ديناميكية: [${dynamicToolNames.join(', ')}]`);
    console.log(`   ✅ الإجمالي: ${hardcodedTools.length + dynamicToolNames.length} أداة`);
  } catch (e: any) {
    console.log(`   ⚠️ خطأ: ${e.message}`);
  }

  await prisma.$disconnect();
}

diagnose();
