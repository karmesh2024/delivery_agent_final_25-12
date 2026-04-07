import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: جلب كل المهارات مع وظائفها
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('ai_skills')
      .select(`
        *,
        ai_skill_functions (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching AI skills:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ترتيب الوظائف حسب sort_order
    const skills = (data ?? []).map((skill: any) => ({
      ...skill,
      ai_skill_functions: (skill.ai_skill_functions || []).sort(
        (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    }));

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

    // 1. إنشاء المهارة الأساسية
    const { data: newSkill, error: skillError } = await supabase
      .from('ai_skills')
      .insert({
        name: data.name,
        description: data.description,
        type: data.type,
        input_schema: data.input_schema || {},
        webhook_url: data.webhook_url || null,
        is_active: data.is_active ?? true,
        category: data.category || 'general',
        icon: data.icon || '⚡',
        source: data.source || 'code',
      })
      .select()
      .single();

    if (skillError) {
      console.error('Error creating AI skill:', skillError);
      return NextResponse.json({ error: skillError.message }, { status: 500 });
    }

    // 2. إنشاء الوظائف التابعة إن وجدت
    if (data.functions && data.functions.length > 0) {
      const functions = data.functions.map((fn: any, idx: number) => ({
        skill_id: (newSkill as any).id,
        name: fn.name,
        label: fn.label,
        description: fn.description || '',
        type: fn.type || 'internal',
        endpoint: fn.endpoint || null,
        input_schema: fn.input_schema || {},
        is_active: fn.is_active ?? true,
        sort_order: idx + 1,
      }));

      const { error: fnError } = await supabase
        .from('ai_skill_functions')
        .insert(functions);

      if (fnError) {
        console.error('Error creating skill functions:', fnError);
      }
    }

    // 3. جلب المهارة كاملة مع وظائفها
    const { data: result } = await supabase
      .from('ai_skills')
      .select('*, ai_skill_functions(*)')
      .eq('id', (newSkill as any).id)
      .single();

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating AI skill:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
