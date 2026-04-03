import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: جلب كل المهارات مع وظائفها
export async function GET() {
  try {
    const skills = await prisma.ai_skills.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        ai_skill_functions: {
          orderBy: { sort_order: 'asc' }
        }
      }
    });
    return NextResponse.json(skills);
  } catch (error: any) {
    console.error('Error fetching AI skills:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: إنشاء مهارة جديدة (مع وظائفها إن وجدت)
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!data.name || !data.description || !data.type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newSkill = await prisma.ai_skills.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        input_schema: data.input_schema || {},
        webhook_url: data.webhook_url || null,
        is_active: data.is_active ?? true,
        category: data.category || 'general',
        icon: data.icon || '⚡',
        source: data.source || 'code',
        // إنشاء الوظائف التابعة إن وجدت
        ...(data.functions && data.functions.length > 0 ? {
          ai_skill_functions: {
            create: data.functions.map((fn: any, idx: number) => ({
              name: fn.name,
              label: fn.label,
              description: fn.description || '',
              type: fn.type || 'internal',
              endpoint: fn.endpoint || null,
              input_schema: fn.input_schema || {},
              is_active: fn.is_active ?? true,
              sort_order: idx + 1,
            }))
          }
        } : {})
      },
      include: {
        ai_skill_functions: { orderBy: { sort_order: 'asc' } }
      }
    });

    return NextResponse.json(newSkill, { status: 201 });
  } catch (error: any) {
    console.error('Error creating AI skill:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
