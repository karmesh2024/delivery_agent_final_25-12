import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: جلب جميع نسخ السيستم برومبت
export async function GET() {
  try {
    const prompts = await prisma.system_prompts.findMany({
      orderBy: { version: 'desc' }
    });
    return NextResponse.json(prompts);
  } catch (error: any) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: إضافة نسخة جديدة من البرومبت
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, note, created_by } = body;

    // جلب رقم آخر نسخة
    const lastPrompt = await prisma.system_prompts.findFirst({
      orderBy: { version: 'desc' }
    });
    const nextVersion = (lastPrompt?.version || 0) + 1;

    const newPrompt = await prisma.system_prompts.create({
      data: {
        version: nextVersion,
        content,
        note,
        created_by,
        is_active: false // النسخة الجديدة لا تكون مفعلة تلقائياً للامان
      }
    });

    return NextResponse.json(newPrompt);
  } catch (error: any) {
    console.error('Error creating prompt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
