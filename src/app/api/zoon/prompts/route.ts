import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: جلب جميع نسخ السيستم برومبت
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('system_prompts')
      .select('*')
      .order('version', { ascending: false });

    if (error) {
      console.error('Error fetching prompts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
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
    const { data: lastPrompt } = await supabase
      .from('system_prompts')
      .select('version')
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = ((lastPrompt as any)?.version || 0) + 1;

    const { data, error } = await supabase
      .from('system_prompts')
      .insert({
        version: nextVersion,
        content,
        note: note || null,
        created_by: created_by || null,
        is_active: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating prompt:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating prompt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
