import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE: حذف نسخة معينة من البرومبت
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // التحقق من أن النسخة ليست مفعلة قبل الحذف
    const prompt = await prisma.system_prompts.findUnique({
      where: { id }
    });

    if (!prompt) {
      return NextResponse.json({ error: 'النسخة غير موجودة' }, { status: 404 });
    }

    if (prompt.is_active) {
      return NextResponse.json({ error: 'لا يمكن حذف النسخة المفعلة حالياً' }, { status: 400 });
    }

    await prisma.system_prompts.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'تم حذف النسخة بنجاح' });
  } catch (error: any) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
