import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT: تحديث مهارة مع وظائفها
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();

    // 1. تحديث المهارة الأساسية
    const { error: updateError } = await supabase
      .from('ai_skills')
      .update({
        name: data.name,
        description: data.description,
        type: data.type,
        input_schema: data.input_schema,
        webhook_url: data.webhook_url,
        is_active: data.is_active,
        category: data.category,
        icon: data.icon,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating AI skill:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 2. Replace strategy للوظائف: حذف القديمة وإنشاء الجديدة
    if (data.functions !== undefined) {
      await supabase
        .from('ai_skill_functions')
        .delete()
        .eq('skill_id', id);

      if (data.functions && data.functions.length > 0) {
        const functions = data.functions.map((fn: any, idx: number) => ({
          skill_id: id,
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
          console.error('Error updating skill functions:', fnError);
        }
      }
    }

    // 3. جلب المهارة المحدثة مع وظائفها
    const { data: result, error: fetchError } = await supabase
      .from('ai_skills')
      .select('*, ai_skill_functions(*)')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

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

    const { error } = await supabase
      .from('ai_skills')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting AI skill:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Skill deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting AI skill:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
