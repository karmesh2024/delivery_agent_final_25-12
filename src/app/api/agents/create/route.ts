import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// الدالة المسؤولة عن إنشاء كلمة مرور عشوائية
function generateRandomPassword(): string {
  const length = 8;
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%";
  let password = "";
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

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

// دالة لإنشاء بريد إلكتروني مؤقت
function generateTemporaryEmail(name: string, phone: string): string {
  // تنظيف الاسم وإزالة المسافات والأحرف الخاصة
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/gi, '');
  // استخدام اسم النطاق مؤقت
  return `${cleanName}.${phone.replace(/[^0-9]/g, '')}@delivery-temp.com`;
}

// دالة مساعدة لتنسيق رقم الهاتف إلى تنسيق دولي
function formatPhoneNumber(phone: string): string {
  // إزالة المسافات والرموز الخاصة
  let formattedPhone = phone.replace(/\s+|-|\(|\)/g, '');
  
  // إذا كان الرقم لا يبدأ بـ +، نضيف مفتاح مصر
  if (!formattedPhone.startsWith('+')) {
    // إذا كان يبدأ بـ 0، نحذفه ونضيف +20
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+20' + formattedPhone.substring(1);
    } else {
      // إذا لم يبدأ بـ 0، نضيف +20 مباشرة
      formattedPhone = '+20' + formattedPhone;
    }
  }
  
  return formattedPhone;
}

export async function POST(request: NextRequest) {
  try {
    // طباعة متغيرات البيئة للتشخيص
    console.log('==== تشخيص متغيرات البيئة ====');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'موجود' : 'غير موجود');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'موجود' : 'غير موجود');
    
    // التحقق من أن القيم ليست فارغة
    console.log('URL فارغ؟:', process.env.NEXT_PUBLIC_SUPABASE_URL === '');
    console.log('SERVICE_KEY فارغ؟:', process.env.SUPABASE_SERVICE_ROLE_KEY === '');
    console.log('طول URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.length);
    console.log('طول SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
    console.log('============================');
    
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
    
    // استلام بيانات المندوب من الطلب
    const deliveryBoyData = await request.json();
    
    // التحقق من البيانات المطلوبة
    if (!deliveryBoyData.full_name || !deliveryBoyData.phone || !deliveryBoyData.password) {
      return NextResponse.json(
        { error: 'البيانات غير مكتملة. الاسم الكامل ورقم الهاتف وكلمة المرور مطلوبان.' },
        { status: 400 }
      );
    }
    
    // تنسيق رقم الهاتف
    const formattedPhone = formatPhoneNumber(deliveryBoyData.phone);
    console.log('رقم الهاتف الأصلي:', deliveryBoyData.phone);
    console.log('رقم الهاتف المنسق:', formattedPhone);
    
    // تنفيذ استعلام SQL مباشر للتحقق من عدم وجود مندوب بنفس رقم الهاتف
    const { data: existingAgents, error: checkError } = await supabase.rpc(
      'simple_search_by_phone',
      { 
        data: { 
          phone: formattedPhone 
        }
      }
    );
    
    if (checkError) {
      console.error('خطأ أثناء التحقق من رقم الهاتف:', checkError);
      // نتجاهل الخطأ ونستمر
    } else if (existingAgents && existingAgents.length > 0) {
      return NextResponse.json(
        { error: 'يوجد مندوب بنفس رقم الهاتف بالفعل' },
        { status: 409 }
      );
    }
    
    // إنشاء كلمة مرور عشوائية -> This is now provided by the admin
    // const password = generateRandomPassword();
    const adminDefinedPassword = deliveryBoyData.password; // Use admin-defined password
    
    // التأكد من وجود بريد إلكتروني (ضروري للتسجيل في Supabase)
    const email = deliveryBoyData.email || generateTemporaryEmail(deliveryBoyData.full_name, formattedPhone);
    
    // إنشاء رمز إحالة ورمز تسليم
    const deliveryCode = generateDeliveryCode();
    const referralCode = generateReferralCode(deliveryBoyData.full_name);
    
    // إعداد البيانات الوصفية للمستخدم
    const userMetadata = {
      full_name: deliveryBoyData.full_name,
      phone: formattedPhone,
      type: 'delivery',
      is_delivery_boy: true,
      user_type: 'delivery_boy',
      date_of_birth: deliveryBoyData.date_of_birth || null,
      national_id: deliveryBoyData.national_id || '000000000', // توفير قيمة افتراضية
      preferred_vehicle: deliveryBoyData.preferred_vehicle || 'tricycle',
      preferred_language: deliveryBoyData.preferred_language || 'ar',
      license_number: deliveryBoyData.license_number || null,
      notes: deliveryBoyData.notes || null,
      delivery_code: deliveryCode,
      referral_code: referralCode,
      avatar_url: deliveryBoyData.avatar_url || null
    };
    
    // إنشاء المستخدم في supabase
    console.log('إنشاء المستخدم...');
    
    // التحقق من وجود بريد إلكتروني مسبقًا
    if (email) {
      const { data: existingUsers, error: emailCheckError } = await supabase
        .from('users') // Consider 'auth.users' for explicitness
        .select('id, email', { count: 'exact' }) // إضافة count exact
        .eq('email', email)
        .limit(1); // limit(1) جيد هنا، أو استخدم maybeSingle()
      
      if (emailCheckError) {
        console.error('خطأ أثناء التحقق من البريد الإلكتروني:', emailCheckError);
        return NextResponse.json(
          { error: 'خطأ داخلي أثناء التحقق من البريد الإلكتروني.', details: emailCheckError.message },
          { status: 500 }
        );
      }
      
      if (existingUsers && existingUsers.length > 0) {
        console.log('يوجد مستخدم بنفس البريد الإلكتروني بالفعل:', email);
        return NextResponse.json(
          { error: 'البريد الإلكتروني مستخدم بالفعل. الرجاء استخدام بريد إلكتروني آخر أو التأكد من صحة البيانات المدخلة.' },
          { status: 409 }
        );
      }
    }
    
    // التحقق من الرقم القومي المكرر
    if (deliveryBoyData.national_id) {
      const { data: existingAgentByNationalId, error: nationalIdCheckError } = await supabase
        .from('delivery_boys')
        .select('id', { count: 'exact' })
        .eq('national_id', deliveryBoyData.national_id)
        .maybeSingle(); 

      if (nationalIdCheckError) {
        console.error('خطأ أثناء التحقق من الرقم القومي:', nationalIdCheckError);
        return NextResponse.json(
          { error: 'خطأ داخلي أثناء التحقق من الرقم القومي.', details: nationalIdCheckError.message },
          { status: 500 }
        );
      }
      if (existingAgentByNationalId) { 
        return NextResponse.json(
          { error: 'يوجد مندوب بنفس الرقم القومي بالفعل.' },
          { status: 409 }
        );
      }
    }
    
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: adminDefinedPassword, // Use admin-defined password
      email_confirm: true,
      phone: formattedPhone,
      phone_confirm: true,
      user_metadata: userMetadata
    });
    
    if (userError) {
      console.error('خطأ أثناء إنشاء المستخدم:', userError);
      
      if (userError.message?.includes('User already registered') || userError.message?.includes('email_exists')) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني مستخدم بالفعل. الرجاء استخدام بريد إلكتروني آخر.' },
          { status: 409 }
        );
      } else if (userError.message?.includes('phone_exists') || userError.status === 422 || userError.code === 'phone_exists') {
        // تعامل مع حالة أن رقم الهاتف مستخدم بالفعل - استند إلى المعلومات في السجل
        console.error('رقم الهاتف مستخدم بالفعل:', formattedPhone);
        return NextResponse.json(
          { 
            error: 'رقم الهاتف مستخدم بالفعل. الرجاء استخدام رقم هاتف آخر.', 
            field: 'phone',
            details: 'تم رفض إنشاء الحساب من قبل Supabase لأن رقم الهاتف مسجل مسبقًا.'
          },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'خطأ أثناء إنشاء حساب المستخدم', details: userError.message }, // إرسال رسالة الخطأ فقط
        { status: 500 }
      );
    }
    
    if (!userData.user) {
      return NextResponse.json(
        { error: 'فشل في إنشاء المستخدم لسبب غير معروف' },
        { status: 500 }
      );
    }
    
    // إنشاء سجل المندوب باستخدام الوظيفة المباشرة
    console.log('استدعاء دالة admin_create_delivery_boy في قاعدة البيانات...');
    
    // إعداد المعلمات لاستدعاء RPC بشكل صحيح
    const rpcParams = {
      p_user_id: userData.user.id,
      p_full_name: deliveryBoyData.full_name,
      p_phone: formattedPhone,
      p_email: email, 
      p_delivery_code: deliveryCode,
      p_referral_code: referralCode,
      p_national_id: deliveryBoyData.national_id || null, 
      p_preferred_vehicle: deliveryBoyData.preferred_vehicle || null,
      p_preferred_language: deliveryBoyData.preferred_language || null,
      p_date_of_birth: deliveryBoyData.date_of_birth || null,
      p_license_number: deliveryBoyData.license_number || null,
      p_owner_id: userData.user.id // افتراضيًا، المالك هو نفس المستخدم. عدل هذا إذا كان منطق عملك مختلفًا.
    };

    console.log('البيانات المصححة المرسلة للوظيفة admin_create_delivery_boy:', rpcParams);
    
    try {
      // استدعاء وظيفة admin_create_delivery_boy_v3 مع المعلمات المصححة
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'admin_create_delivery_boy_v3',
        rpcParams
      );
      
      if (rpcError) {
        console.error('خطأ أثناء استدعاء RPC admin_create_delivery_boy_v3. Full rpcError object:', JSON.stringify(rpcError, null, 2));
        console.error('rpcError.message:', rpcError?.message);
        console.error('rpcError.details:', rpcError?.details);
        console.error('rpcError.hint:', rpcError?.hint);
        console.error('rpcError.code:', rpcError?.code);
        
        // لا تحاول الإدراج المباشر كآلية استرجاع مبدئيًا بعد الآن، لأن RPC هو الطريقة المعتمدة
        // إذا فشل RPC، يجب التعامل مع الخطأ مباشرة وحذف المستخدم الذي تم إنشاؤه.
        
        await supabase.auth.admin.deleteUser(userData.user.id);
        console.log(`تم حذف المستخدم ${userData.user.id} من auth.users بسبب فشل RPC.`);
        return NextResponse.json(
          { 
            error: 'فشل إنشاء سجل المندوب عبر RPC.', 
            // Construct a more informative details object for the client
            details: {
                message: rpcError?.message || 'No message provided by rpcError',
                details: rpcError?.details || 'No details provided by rpcError',
                hint: rpcError?.hint || 'No hint provided by rpcError',
                code: rpcError?.code || 'No code provided by rpcError',
                fullErrorString: JSON.stringify(rpcError) // Stringify the full error for client debugging
            }
          },
          { status: 500 }
        );

      } // نهاية معالجة خطأ RPC
      
      // تعامل مع سيناريوهات الفشل التي ترجعها الدالة بنجاح ولكن مع رمز خطأ
      if (rpcResult && rpcResult.success === false) {
        // حذف المستخدم الذي تم إنشاؤه لأن إنشاء المندوب فشل
        await supabase.auth.admin.deleteUser(userData.user.id);
        console.log(`تم حذف المستخدم ${userData.user.id} من auth.users بسبب فشل إنشاء المندوب.`);
        
        // إعادة رسالة الخطأ المحددة من وظيفة قاعدة البيانات
        const httpStatus = rpcResult.field ? 409 : 500; // استخدم 409 لأخطاء التكرار
        return NextResponse.json(
          { error: rpcResult.error, details: rpcResult.details || null, field: rpcResult.field || null },
          { status: httpStatus }
        );
      }
      
      // إذا نجح استدعاء RPC
      console.log('تم إنشاء سجل المندوب بنجاح عبر RPC admin_create_delivery_boy_v3:', rpcResult);
      
      // تأكد من أن الاستجابة تتضمن delivery_code مباشرة داخل كائن delivery_boy
      if (rpcResult && rpcResult.delivery_boy && rpcResult.delivery_boy.id) {
          const finalDeliveryBoyRecord = rpcResult.delivery_boy;

          return NextResponse.json({
              message: "تم إنشاء المندوب بنجاح",
              data: {
                  user: userData.user, // Contains user ID, email etc. from auth.users
                  delivery_boy: finalDeliveryBoyRecord, // Contains ID, delivery_code, and other details from delivery_boys table
                  warning: rpcResult.warning || null // إضافة أي تحذيرات إن وجدت
              }
          }, { status: 201 });
      } else {
          // This case should ideally not be reached if RPC call is successful and returns data
          console.error("Failed to get delivery_boy record from RPC or record is malformed", rpcResult);
          // Attempt to delete the created auth user to avoid orphaned users if delivery_boy creation failed
          if (userData.user && userData.user.id) {
              await supabase.auth.admin.deleteUser(userData.user.id);
              console.log(`Orphaned auth user ${userData.user.id} deleted due to delivery_boy creation failure.`);
          }
          return NextResponse.json(
              { error: 'فشل في تسجيل بيانات المندوب بعد إنشاء الحساب. تم التراجع عن إنشاء المستخدم.' },
              { status: 500 }
          );
      }
    } catch (error) { // هذا الـ catch سيلتقط أخطاء غير متوقعة أخرى أثناء محاولة الـ RPC
      console.error('خطأ غير متوقع أثناء استدعاء admin_create_delivery_boy_v3 RPC أو معالجة نتيجته:', error);
      // محاولة حذف المستخدم الذي تم إنشاؤه إذا لم يتم حذفه بعد
      try {
        await supabase.auth.admin.deleteUser(userData.user.id);
        console.log(`تم حذف المستخدم ${userData.user.id} من auth.users بسبب خطأ غير متوقع.`);
      } catch (deleteError) {
        console.error('فشل حذف المستخدم بعد خطأ غير متوقع:', deleteError);
      }
      return NextResponse.json(
        { 
          error: 'خطأ أثناء استدعاء وظيفة قاعدة البيانات أو معالجة نتيجتها', 
          //  إرسال رسالة الخطأ إذا كان كائن خطأ، أو تحويله لسلسلة إذا كان شيئا آخر
          details: error instanceof Error ? error.message : String(error) 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('خطأ غير متوقع في معالج POST:', error);
    return NextResponse.json(
      { 
        error: 'حدث خطأ أثناء معالجة الطلب', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}