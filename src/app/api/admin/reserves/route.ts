import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/reserves
 * الحصول على الاحتياطيات المالية الحالية
 */
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

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // جلب آخر سجل من financial_reserves
    const { data, error } = await supabase
      .from('financial_reserves')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      // إذا لم يوجد سجل، إنشاء واحد جديد
      if (error.code === 'PGRST116') {
        // تشغيل Function لحساب الاحتياطيات
        const { data: calculatedData, error: calcError } = await supabase
          .rpc('calculate_daily_reserves');
        
        if (calcError) {
          console.error('Error calculating reserves:', calcError);
          return NextResponse.json(
            { error: 'فشل حساب الاحتياطيات', details: calcError.message },
            { status: 500 }
          );
        }
        
        // جلب السجل الجديد
        const { data: newData, error: newError } = await supabase
          .from('financial_reserves')
          .select('*')
          .order('date', { ascending: false })
          .limit(1)
          .single();
        
        if (newError) {
          return NextResponse.json(
            { error: 'فشل جلب الاحتياطيات', details: newError.message },
            { status: 500 }
          );
        }
        
        return NextResponse.json(newData);
      }
      
      return NextResponse.json(
        { error: 'فشل جلب الاحتياطيات', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in GET /api/admin/reserves:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/reserves/calculate
 * تشغيل حساب الاحتياطيات يدوياً
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action !== 'calculate') {
      return NextResponse.json(
        { error: 'إجراء غير صحيح. استخدم ?action=calculate' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseClient();
    
    // تشغيل Function
    const { data, error } = await supabase.rpc('calculate_daily_reserves');
    
    if (error) {
      console.error('Error calculating reserves:', error);
      return NextResponse.json(
        { error: 'فشل حساب الاحتياطيات', details: error.message },
        { status: 500 }
      );
    }
    
    // جلب السجل الجديد
    const { data: reservesData, error: reservesError } = await supabase
      .from('financial_reserves')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single();
    
    if (reservesError) {
      return NextResponse.json(
        { error: 'تم الحساب لكن فشل جلب النتائج', details: reservesError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'تم حساب الاحتياطيات بنجاح',
      data: reservesData
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/reserves:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم', details: error.message },
      { status: 500 }
    );
  }
}
