import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// دالة مساعدة لإنشاء كود تسليم فريد (6 أحرف كبيرة)
function generateDeliveryCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const agentId = params.agentId;

  if (!agentId) {
    return NextResponse.json({ error: 'معرف المندوب مطلوب' }, { status: 400 });
  }

  try {
    // إنشاء عميل Supabase باستخدام مفتاح دور الخدمة
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'تكوين الخادم غير كامل. بيانات اعتماد Supabase مفقودة.' },
        { status: 500 }
      );
    }
    
    // إنشاء عميل Supabase باستخدام مفتاح دور الخدمة للوصول الإداري
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });
    
    // توليد كود تسليم جديد
    const newDeliveryCode = generateDeliveryCode();
    
    // تحديث المندوب في قاعدة البيانات
    const { data, error } = await supabase
      .from('delivery_boys')
      .update({ 
        delivery_code: newDeliveryCode,
        delivery_code_status: 'pending', // إعادة تعيين حالة الكود إلى 'معلق'
        delivery_code_attempts: 0, // إعادة تعيين عدد المحاولات
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId)
      .select('delivery_code')
      .single();
    
    if (error) {
      console.error('خطأ أثناء تحديث كود التسليم:', error);
      return NextResponse.json({ error: 'فشل في تحديث كود التسليم' }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'لم يتم العثور على المندوب' }, { status: 404 });
    }
    
    // إرجاع الكود الجديد
    return NextResponse.json({ 
      success: true, 
      delivery_code: data.delivery_code,
      message: 'تم إعادة توليد كود التسليم بنجاح'
    });
    
  } catch (error) {
    console.error('خطأ غير متوقع:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة الطلب' }, { status: 500 });
  }
} 