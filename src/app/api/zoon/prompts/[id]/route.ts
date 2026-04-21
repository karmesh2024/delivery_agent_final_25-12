import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DELETE: حذف نسخة معينة من البرومبت
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // التحقق من أن النسخة ليست مفعلة قبل الحذف
    const { data: prompt, error: fetchError } = await supabase
      .from('system_prompts')
      .select('id, is_active')
      .eq('id', id)
      .single();

    if (fetchError || !prompt) {
      return NextResponse.json({ error: 'النسخة غير موجودة' }, { status: 404 });
    }

    if ((prompt as any).is_active) {
      return NextResponse.json(
        { error: 'لا يمكن حذف النسخة المفعلة حالياً' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('system_prompts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم حذف النسخة بنجاح' });
  } catch (error: any) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: تعديل محتوى نسخة معينة من البرومبت
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const body = await req.json();
    const { content, note } = body;

    if (!content) {
      return NextResponse.json({ error: 'المحتوى مطلوب' }, { status: 400 });
    }

    const { error } = await supabase
      .from('system_prompts')
      .update({ content, note })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم تحديث النسخة بنجاح' });
  } catch (error: any) {
    console.error('Error updating prompt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
