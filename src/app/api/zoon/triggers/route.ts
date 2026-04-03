import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: جلب جميع المشغلات المجدولة
export async function GET() {
  try {
    const triggers = await prisma.scheduled_triggers.findMany({
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json(triggers);
  } catch (error: any) {
    console.error('Error fetching triggers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: إضافة مشغل جديد
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task_name, description, cron_expression, prompt_template } = body;

    const newTrigger = await prisma.scheduled_triggers.create({
      data: {
        task_name,
        description,
        cron_expression,
        prompt_template,
        is_active: true
      }
    });

    return NextResponse.json(newTrigger);
  } catch (error: any) {
    console.error('Error creating trigger:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
