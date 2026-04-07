import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: جلب سجلات التنفيذ
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const status = searchParams.get('status');

  try {
    let query = supabase
      .from('tool_execution_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      // الجدول قد لا يكون موجوداً بعد — نُعيد مصفوفة فارغة بدلاً من خطأ
      console.warn('tool_execution_logs fetch warning:', error.message);
      return NextResponse.json([]);
    }

    return NextResponse.json(data ?? []);
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    return NextResponse.json([]);
  }
}
