import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey
);

function generateDeliveryCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateReferralCode(name: string): string {
  const namePart = name.substring(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${namePart}${randomPart}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, phone, email, password, license_number, national_id, preferred_vehicle } = body;

    if (!full_name || !phone) {
      return NextResponse.json({ error: 'الاسم ورقم الهاتف مطلوبان' }, { status: 400 });
    }

    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.startsWith('0') ? '+20' + formattedPhone.substring(1) : '+20' + formattedPhone;
    }

    // 1. Check if user exists to avoid auth error if profile is missing but auth exists
    const { data: existingProfiles } = await supabase
      .from('delivery_boys')
      .select('id')
      .eq('phone', formattedPhone)
      .maybeSingle();

    if (existingProfiles) {
      return NextResponse.json({ error: 'رقم الهاتف مسجل بالفعل' }, { status: 409 });
    }

    // 2. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      phone: formattedPhone,
      email: email || undefined,
      password: password || Math.random().toString(36).slice(-12),
      phone_confirm: true,
      email_confirm: !!email,
      user_metadata: { full_name, role: 'delivery_boy' }
    });

    if (authError || !authData.user) {
      console.error('Auth creation error:', authError);
      return NextResponse.json({ 
        error: 'فشل إنشاء حساب المصادقة للمندوب', 
        details: authError?.message 
      }, { status: 400 });
    }

    const userId = authData.user.id;
    const deliveryCode = generateDeliveryCode();
    const referralCode = generateReferralCode(full_name);

    try {
      // 3. Create Profile
      const { error: profileError } = await supabase
        .from('delivery_boys')
        .insert([{
          id: userId,
          full_name,
          phone: formattedPhone,
          email: email || null,
          delivery_code: deliveryCode,
          referral_code: referralCode,
          license_number: license_number || null,
          national_id: national_id || null,
          preferred_vehicle: preferred_vehicle || 'tricycle',
          status: 'active',
          online_status: 'offline',
          is_available: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (profileError) throw profileError;

      // 4. Create Wallet
      await supabase
        .from('wallets')
        .insert([{
          user_id: userId,
          balance: 0,
          currency: 'SAR',
          wallet_type: 'AGENT' // Adjusted to match DB enum based on lint errors
        }]);

      return NextResponse.json({ 
        success: true, 
        id: userId, 
        message: 'تم إنشاء المندوب بنجاح' 
      });

    } catch (dbError: any) {
      console.error('Database insertion error:', dbError);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ 
        error: 'فشل إكمال ملف بيانات المندوب', 
        details: dbError.message 
      }, { status: 500 });
    }

  } catch (e: any) {
    console.error('Unexpected exception:', e);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}