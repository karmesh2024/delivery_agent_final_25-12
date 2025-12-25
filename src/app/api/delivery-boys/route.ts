import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { v4 as uuidv4 } from 'uuid';
import { agentsApi } from "@/services/agentsApi";

// تكوين Supabase للسيرفر
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// إنشاء عميل Supabase مع مفتاح الخدمة (له صلاحيات أعلى)
const supabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey
);

// دالة مساعدة لإنشاء كود تسليم فريد
function generateDeliveryCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// دالة مساعدة لإنشاء كود إحالة
function generateReferralCode(name: string): string {
  const namePart = name.substring(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${namePart}${randomPart}`;
}

// معالجة طلب POST لإنشاء مندوب توصيل جديد
export async function POST(request: Request) {
  try {
    // استخراج بيانات المندوب من طلب API
    const deliveryBoyData = await request.json();
    console.log('بيانات المندوب المستلمة:', deliveryBoyData);

    // تنسيق رقم الهاتف
    let formattedPhone = deliveryBoyData.phone;
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+20' + formattedPhone.substring(1);
      } else {
        formattedPhone = '+20' + formattedPhone;
      }
    }

    // التحقق من تنسيق تاريخ الميلاد وتحويله
    let formattedDateOfBirth = null;
    if (deliveryBoyData.date_of_birth) {
      try {
        const dateObj = new Date(deliveryBoyData.date_of_birth);
        const currentDate = new Date();
        
        if (!isNaN(dateObj.getTime()) && dateObj <= currentDate) {
          formattedDateOfBirth = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
        } else if (dateObj > currentDate) {
          return NextResponse.json(
            { error: 'تاريخ الميلاد لا يمكن أن يكون في المستقبل' },
            { status: 400 }
          );
        }
      } catch (e) {
        return NextResponse.json(
          { error: 'تنسيق تاريخ الميلاد غير صالح' },
          { status: 400 }
        );
      }
    }

    // التحقق من عدم وجود مندوب بنفس رقم الهاتف
    const { data: existingAgentWithPhone, error: checkPhoneError } = await supabase
      .from('delivery_boys')
      .select('id')
      .eq('phone', formattedPhone)
      .maybeSingle();

    if (checkPhoneError) {
      console.error('خطأ أثناء التحقق من رقم الهاتف:', checkPhoneError);
      return NextResponse.json(
        { error: 'حدث خطأ أثناء التحقق من رقم الهاتف' },
        { status: 500 }
      );
    }

    if (existingAgentWithPhone) {
      return NextResponse.json(
        { error: 'يوجد مندوب بنفس رقم الهاتف بالفعل' },
        { status: 409 }
      );
    }

    // التحقق من عدم وجود مندوب بنفس البريد الإلكتروني
    if (deliveryBoyData.email) {
      const { data: existingAgentWithEmail, error: checkEmailError } = await supabase
        .from('delivery_boys')
        .select('id')
        .eq('email', deliveryBoyData.email)
        .maybeSingle();

      if (checkEmailError) {
        console.error('خطأ أثناء التحقق من البريد الإلكتروني:', checkEmailError);
        return NextResponse.json(
          { error: 'حدث خطأ أثناء التحقق من البريد الإلكتروني' },
          { status: 500 }
        );
      }

      if (existingAgentWithEmail) {
        return NextResponse.json(
          { error: 'يوجد مندوب بنفس البريد الإلكتروني بالفعل' },
          { status: 409 }
        );
      }
    }

    // إنشاء معرف UUID جديد
    const newDeliveryBoyId = uuidv4();
    console.log('تم إنشاء معرف جديد (UUID):', newDeliveryBoyId);

    // إنشاء كود تسليم وكود إحالة
    const deliveryCode = generateDeliveryCode();
    const referralCode = generateReferralCode(deliveryBoyData.full_name);

    // تحويل منطقة العمل المفضلة إلى تنسيق JSON إذا كانت موجودة
    let preferred_zones_string = null;
    if (deliveryBoyData.preferred_zones && deliveryBoyData.preferred_zones.length > 0) {
      preferred_zones_string = JSON.stringify(deliveryBoyData.preferred_zones);
    }

    // الطريقة 1: استخدام وظيفة RPC المخصصة باستخدام المعاملات المطلوبة
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('admin_create_delivery_boy', {
          p_user_id: newDeliveryBoyId,
          p_full_name: deliveryBoyData.full_name,
          p_phone: formattedPhone,
          p_email: deliveryBoyData.email || null,
          p_delivery_code: deliveryCode,
          p_referral_code: referralCode,
          p_national_id: deliveryBoyData.national_id || '000000000',
          p_preferred_vehicle: deliveryBoyData.preferred_vehicle || 'tricycle',
          p_preferred_language: deliveryBoyData.preferred_language || 'ar'
        });

      if (rpcError) {
        throw rpcError;
      }

      console.log('تم إنشاء المندوب بنجاح باستخدام RPC:', rpcData);
      return NextResponse.json(rpcData);
    } catch (rpcException) {
      console.error('فشل استدعاء وظيفة RPC:', rpcException);
      
      // الطريقة 2: استخدام SQL مخصص لإدراج المندوب مع تجاوز قيد المفتاح الخارجي
      try {
        // إنشاء استعلام SQL مخصص يستخدم تجاوز القيود
        const { data, error } = await supabase.rpc('insert_delivery_boy_bypass_fk', {
          id: newDeliveryBoyId,
          full_name: deliveryBoyData.full_name,
          phone: formattedPhone,
          email: (deliveryBoyData.email || '') as string,
          date_of_birth: (formattedDateOfBirth || '') as string,
          national_id: (deliveryBoyData.national_id || '') as string,
          license_number: (deliveryBoyData.license_number || '') as string,
          preferred_vehicle: (deliveryBoyData.preferred_vehicle || 'tricycle') as string,
          preferred_language: (deliveryBoyData.preferred_language || 'ar') as string,
          notes: (deliveryBoyData.notes || '') as string,
          status: (deliveryBoyData.status || 'inactive') as string,
          is_available: false,
          delivery_code: deliveryCode,
          referral_code: referralCode,
          online_status: (deliveryBoyData.online_status || 'offline') as string,
          preferred_zones: (preferred_zones_string || '') as string,
        });

        if (error) {
          throw error;
        }

        console.log('تم إنشاء المندوب بنجاح باستخدام SQL مخصص:', data);
        return NextResponse.json(data);
      } catch (sqlError) {
        console.error('فشل الإدراج باستخدام SQL مخصص:', sqlError);
        
        // الطريقة 3: محاولة أخيرة - استخدام استعلام SQL مباشر
        try {
          const timestamp = new Date().toISOString();
          
          // استعلام SQL مباشر باستخدام مفتاح الخدمة وتجاوز القيود
          const { data, error } = await supabase.from('delivery_boys_insecure').insert([{
            id: newDeliveryBoyId,
            full_name: deliveryBoyData.full_name,
            phone: formattedPhone,
            email: (deliveryBoyData.email || '') as string,
            date_of_birth: (formattedDateOfBirth || '') as string,
            national_id: (deliveryBoyData.national_id || '') as string,
            license_number: (deliveryBoyData.license_number || '') as string,
            preferred_vehicle: (deliveryBoyData.preferred_vehicle || 'tricycle') as string,
            preferred_language: (deliveryBoyData.preferred_language || 'ar') as string,
            notes: (deliveryBoyData.notes || '') as string,
            status: (deliveryBoyData.status || 'inactive') as string,
            is_available: false,
            phone_verification_status: 'pending',
            total_deliveries: 0,
            total_earnings: 0,
            rating: 0,
            created_at: timestamp,
            updated_at: timestamp,
            delivery_code: deliveryCode,
            referral_code: referralCode,
            online_status: (deliveryBoyData.online_status || 'offline') as string,
            preferred_zones: (preferred_zones_string || '') as string,
          }]).select();

          if (error) {
            throw error;
          }

          console.log('تم إنشاء المندوب بنجاح باستخدام الإدراج المباشر:', data);
          return NextResponse.json(data[0]);
        } catch (directInsertError) {
          console.error('فشل جميع طرق الإدراج:', directInsertError);
          return NextResponse.json(
            { error: 'فشلت جميع محاولات إنشاء مندوب التوصيل' },
            { status: 500 }
          );
        }
      }
    }
  } catch (e) {
    console.error('استثناء غير متوقع:', e);
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء إنشاء مندوب التوصيل' },
      { status: 500 }
    );
  }
} 