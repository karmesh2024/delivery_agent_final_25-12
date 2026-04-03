import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH: تفعيل نسخة محددة من البرومبت
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // استخدام transaction لضمان أن نسخة واحدة فقط تكون مفعلة
    await prisma.$transaction([
      // 1. إلغاء تفعيل الجميع
      prisma.system_prompts.updateMany({
        where: { is_active: true },
        data: { is_active: false }
      }),
      // 2. تفعيل النسخة المطلوبة
      prisma.system_prompts.update({
        where: { id },
        data: { is_active: true }
      })
    ]);

    return NextResponse.json({ success: true, message: 'تم تفعيل النسخة بنجاح' });
  } catch (error: any) {
    console.error('Error activating prompt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
