import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// استخدام Supabase مباشرة لتجنب مشاكل Prisma Schema
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: جلب جميع المشغلات المجدولة
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('scheduled_triggers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching triggers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error: any) {
    console.error('Error fetching triggers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: إضافة مشغل جديد
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      task_name,
      description,
      trigger_type,
      cron_expression,
      condition_query,
      condition_operator,
      condition_value,
      prompt_template,
    } = body;

    // بناء الكائن بناءً على الأعمدة الموجودة فعلاً
    const insertData: Record<string, any> = {
      task_name,
      description: description || null,
      cron_expression: cron_expression || null,
      prompt_template,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('scheduled_triggers')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating trigger:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating trigger:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
