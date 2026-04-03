import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT: تحديث مهارة مع وظائفها
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    
    // تحديث المهارة الأساسية
    const updatedSkill = await prisma.ai_skills.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        input_schema: data.input_schema,
        webhook_url: data.webhook_url,
        is_active: data.is_active,
        category: data.category,
        icon: data.icon,
        updated_at: new Date(),
      },
    });

    // إذا تم إرسال وظائف، نقوم بحذف القديمة وإنشاء الجديدة (Replace Strategy)
    if (data.functions !== undefined) {
      // حذف الوظائف القديمة
      await prisma.ai_skill_functions.deleteMany({
        where: { skill_id: id }
      });

      // إنشاء الوظائف الجديدة
      if (data.functions && data.functions.length > 0) {
        await prisma.ai_skill_functions.createMany({
          data: data.functions.map((fn: any, idx: number) => ({
            skill_id: id,
            name: fn.name,
            label: fn.label,
            description: fn.description || '',
            type: fn.type || 'internal',
            endpoint: fn.endpoint || null,
            input_schema: fn.input_schema || {},
            is_active: fn.is_active ?? true,
            sort_order: idx + 1,
          }))
        });
      }
    }

    // جلب المهارة المحدثة مع وظائفها
    const result = await prisma.ai_skills.findUnique({
      where: { id },
      include: { ai_skill_functions: { orderBy: { sort_order: 'asc' } } }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating AI skill:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: حذف مهارة (الوظائف تُحذف تلقائياً بسبب ON DELETE CASCADE)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.ai_skills.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, message: 'Skill deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting AI skill:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
