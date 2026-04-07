import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH: تفعيل نسخة محددة من البرومبت
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // 1. إلغاء تفعيل جميع النسخ أولاً
    const { error: deactivateError } = await supabase
      .from('system_prompts')
      .update({ is_active: false })
      .eq('is_active', true);

    if (deactivateError) throw deactivateError;

    // 2. تفعيل النسخة المطلوبة
    const { error: activateError } = await supabase
      .from('system_prompts')
      .update({ is_active: true })
      .eq('id', id);

    if (activateError) throw activateError;

    return NextResponse.json({ success: true, message: 'تم تفعيل النسخة بنجاح' });
  } catch (error: any) {
    console.error('Error activating prompt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
