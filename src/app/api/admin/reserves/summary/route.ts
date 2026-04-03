import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

/**
 * GET /api/admin/reserves/summary
 * الحصول على ملخص الاحتياطيات المالية لآخر 30 يوم
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // استخدام Function get_financial_reserves_summary
    const { data, error } = await supabase.rpc('get_financial_reserves_summary');
    
    if (error) {
      console.error('Error getting reserves summary:', error);
      return NextResponse.json(
        { error: 'فشل جلب ملخص الاحتياطيات', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error in GET /api/admin/reserves/summary:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم', details: error.message },
      { status: 500 }
    );
  }
}
