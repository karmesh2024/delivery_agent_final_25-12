import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// تعريف الهيدرز للـ CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// دالة للتعامل مع طلبات OPTIONS
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  return null;
}

// واجهة بيانات المستخدم الجديد
interface NewAdminData {
  email: string;
  password: string;
  full_name: string;
  role_id: string;
  department_id?: string;
  initial_balance?: number;
  username?: string; // إضافة اسم المستخدم الاختياري
}

// واجهة استجابة إنشاء المستخدم
interface CreateAdminResponse {
  admin_id: string;
  user_id: string;
  wallet_id?: string | null;
  email: string; // البريد الإلكتروني الأصلي الذي أدخله المستخدم
  auth_email: string; // البريد الإلكتروني المستخدم في نظام المصادقة (الفريد)
  role: string;
  full_name?: string;
  username?: string;
  success: boolean;
  message: string;
}

// الأدوار الافتراضية للاستخدام في حالة عدم وجود أدوار في قاعدة البيانات
const DEFAULT_ROLES = [
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'مدير مساعد',
    code: 'manager'
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'مشرف',
    code: 'supervisor'
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'دعم فني وخدمة عملاء',
    code: 'support'
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    name: 'مراقب - صلاحيات عرض فقط',
    code: 'viewer'
  },
  {
    id: '6786b241-8c2f-49b5-9947-6377fb5348fe',
    name: 'رئيس مجلس الإدارة',
    code: 'admin'
  },
  {
    id: 'b98dc2ff-d97d-4f5a-a7bb-c9b864268c4c',
    name: 'مدير النظام',
    code: 'super_admin'
  },
  {
    id: 'c03d006e-f7fd-4def-89cd-c610c744255f',
    name: 'مدير المبيعات',
    code: 'sales_manager'
  }
];

// دالة لتوليد بريد إلكتروني فريد
function generateUniqueEmail(originalEmail: string): string {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000);
  const [localPart, domain] = originalEmail.toLowerCase().trim().split('@');
  return `${localPart}_${timestamp}_${randomNum}@${domain}`;
}

// دالة للتحقق من صحة البيانات
function validateInputData(data: NewAdminData): { isValid: boolean; message?: string } {
  const { email, password, full_name, role_id } = data;
  if (!email || !password || !full_name || !role_id) {
    return { isValid: false, message: 'Missing required fields: email, password, full_name, role_id' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: 'Invalid email format' };
  }
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  return { isValid: true };
}

// دالة لإنشاء المحفظة
async function createAdminWallet(supabase: SupabaseClient, adminId: string, initialBalance: number): Promise<string | null> {
  try {
    const { data: existingWallet } = await supabase
      .from('admin_wallets')
      .select('id')
      .eq('admin_id', adminId)
      .maybeSingle(); // استخدام maybeSingle لتجنب الخطأ إذا لم يتم العثور على محفظة

    if (existingWallet) {
      console.log(`[create-admin] Wallet already exists for admin ${adminId} (ID: ${existingWallet.id}), skipping creation.`);
      return existingWallet.id;
    }

    const { data: walletData, error: walletError } = await supabase
      .from('admin_wallets')
      .insert({
        admin_id: adminId,
        wallet_type: 'main',
        balance: initialBalance || 0,
        currency: 'SAR',
        is_active: true
      })
      .select('id')
      .single();

    if (walletError) {
      console.error('Failed to create wallet:', walletError);
      return null;
    }
    return walletData?.id || null;
  } catch (error) {
    console.error('Error creating wallet:', error);
    return null;
  }
}

// دالة للتحقق من وجود المستخدم في نظام المصادقة أو جدول المسؤولين
async function checkExistingUser(supabase: SupabaseClient, email: string): Promise<{existsInAuth: boolean, existsInAdmins: boolean, adminUserId?: string}> {
  try {
    // التحقق من جدول admins أولاً
    const { data: adminRecord } = await supabase
      .from('admins')
      .select('user_id')
      .ilike('email', email)
      .maybeSingle();

    if (adminRecord) {
      return { existsInAuth: true, existsInAdmins: true, adminUserId: adminRecord.user_id }; // نفترض أنه إذا كان موجودًا في admins، فهو موجود في auth
    }

    // التحقق من نظام المصادقة (باستخدام original_email إذا كان متاحًا)
    const { data } = await supabase.auth.admin.listUsers();
    const authUser = data.users.find(u => 
      u.email === email || 
      (u.user_metadata && u.user_metadata.original_email === email)
    );
    
    return { existsInAuth: !!authUser, existsInAdmins: false };

  } catch (error) {
    console.error('Error checking existing user:', error);
    return { existsInAuth: false, existsInAdmins: false }; // في حالة الخطأ، نفترض أنه غير موجود لتجنب حظر الإنشاء بشكل خاطئ
  }
}

serve(async (req: Request) => {
  try {
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    const supabaseAdminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseAdminKey || !supabaseUrl) {
      console.error('Missing environment variables');
      return new Response(JSON.stringify({ success: false, message: 'Server configuration error' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAdminKey, 
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let requestData: NewAdminData;
    try {
      requestData = await req.json();
    } catch (error) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid JSON data' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    console.log(`[create-admin] Processing request for: ${requestData.email}`);
    const validation = validateInputData(requestData);
    if (!validation.isValid) {
      return new Response(JSON.stringify({ success: false, message: validation.message }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    const { email, password, full_name, role_id, department_id, initial_balance, username } = requestData;
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`[create-admin] Normalized email: ${normalizedEmail}`);

    // التحقق الشامل من وجود المستخدم
    const { existsInAuth, existsInAdmins } = await checkExistingUser(supabase, normalizedEmail);
    if (existsInAdmins) {
      return new Response(JSON.stringify({ success: false, message: 'Email already exists in admins table' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 });
    }
    if (existsInAuth) {
      return new Response(JSON.stringify({ success: false, message: 'Email already exists in authentication system' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 });
    }

    // const uniqueAuthEmail = generateUniqueEmail(normalizedEmail);
    // console.log(`[create-admin] Generated unique auth email: ${uniqueAuthEmail}`);
    // الآن سنستخدم البريد الإلكتروني الأصلي مباشرة للمصادقة
    console.log(`[create-admin] Using original normalized email for auth: ${normalizedEmail}`);

    let roleInfo = DEFAULT_ROLES.find((r) => r.id === role_id);
    if (!roleInfo) {
      const { data: dbRole, error: roleError } = await supabase.from('roles').select('id, name, code').eq('id', role_id).single();
      if (roleError || !dbRole) {
        return new Response(JSON.stringify({ success: false, message: `Role not found: ${roleError?.message || 'Unknown error'}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }
      roleInfo = dbRole;
    }

    if (department_id) {
      const { data: dept, error: deptError } = await supabase.from('departments').select('id').eq('id', department_id).single();
      if (deptError || !dept) {
        return new Response(JSON.stringify({ success: false, message: `Department not found: ${deptError?.message || 'Unknown error'}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      }
    }

    // البيانات الوصفية التي سيتم استخدامها بواسطة الـ trigger
    const userMetadata = {
      full_name,
      role_id, // تمرير role_id ليستخدمه الـ trigger
      original_email: normalizedEmail, // البريد الأصلي
      username: username || normalizedEmail.split('@')[0], // اسم المستخدم أو الجزء المحلي من البريد
      department_id: department_id, // تمرير department_id إذا كان موجودًا
    };

    // إنشاء المستخدم في نظام المصادقة
    const { data: authUserData, error: signUpError } = await supabase.auth.admin.createUser({
      email: normalizedEmail, // <--- استخدام البريد الأصلي هنا
      password,
      email_confirm: true, // تأكيد البريد تلقائيًا لأن هذا يتم من الخادم
      user_metadata: userMetadata
    });

    if (signUpError || !authUserData?.user) {
      console.error('[create-admin] Sign up error:', signUpError);
      return new Response(JSON.stringify({ success: false, message: `Failed to create user in auth: ${signUpError?.message || 'Unknown error'}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }

    const auth_user_id = authUserData.user.id;
    // console.log(`[create-admin] User created in auth. ID: ${auth_user_id}, Auth Email: ${uniqueAuthEmail}. Waiting for trigger (10s)...`);
    console.log(`[create-admin] User created in auth. ID: ${auth_user_id}, Auth Email: ${normalizedEmail}. Waiting for trigger (10s)...`);

    // --- لا تقم بإدراج سجل في admins هنا، اعتمد على الـ trigger ---
    // انتظر قليلاً للسماح للـ trigger بالعمل (يمكن تحسين هذا بآلية أكثر قوة)
    await new Promise((resolve)=>setTimeout(resolve, 10000)); // انتظار لمدة 10 ثوانٍ

    // جلب سجل المسؤول الذي تم إنشاؤه بواسطة الـ trigger
    // الـ trigger يستخدم البريد الإلكتروني الفريد (uniqueAuthEmail) عند الإدراج في admins
    // لذا يجب البحث باستخدام هذا البريد أو user_id
    console.log(`[create-admin] Finished waiting. Attempting to fetch admin record for user_id: ${auth_user_id}`);
    const { data: createdAdmin, error: adminFetchError } = await supabase.from('admins').select('id, user_id, email, role_id, created_at, full_name, username') // تأكد من جلب username أيضًا
    .eq('user_id', auth_user_id) // البحث باستخدام user_id هو الأكثر موثوقية
    .maybeSingle();

    console.log('[create-admin] Fetched admin record (or null):', JSON.stringify(createdAdmin));
    console.log('[create-admin] Admin fetch error (if any):', JSON.stringify(adminFetchError));

    if (adminFetchError || !createdAdmin) {
      console.error(`[create-admin] CRITICAL: Failed to fetch admin record OR record is null for user_id: ${auth_user_id}. Deleting auth user. Fetch Error: ${JSON.stringify(adminFetchError)}`);
      // في هذه الحالة، يجب التفكير في حذف المستخدم من المصادقة كـ rollback
      await supabase.auth.admin.deleteUser(auth_user_id);
      return new Response(JSON.stringify({
          success: false,
        message: `Admin record not found after creation: ${adminFetchError?.message || 'Trigger may have failed or record was null'}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
      });
    }

    console.log(`[create-admin] SUCCESS: Fetched admin record. ID: ${createdAdmin.id}, Email from DB: ${createdAdmin.email}, FullName: ${createdAdmin.full_name}, CreatedAt: ${createdAdmin.created_at}`);

    let wallet_id = null;
    if (initial_balance !== undefined && initial_balance >= 0) {
      wallet_id = await createAdminWallet(supabase, createdAdmin.id, initial_balance);
    }

    const response: CreateAdminResponse = {
        success: true,
      message: 'Admin created successfully via trigger',
      admin_id: createdAdmin.id,
      user_id: auth_user_id,
        wallet_id,
      email: normalizedEmail, // البريد الأصلي
      auth_email: normalizedEmail, // بريد المصادقة هو نفسه البريد الأصلي الآن
      role: roleInfo.code,
      full_name: createdAdmin.full_name, // الاسم الكامل من السجل الذي تم جلبه
      username: createdAdmin.username //  اسم المستخدم من السجل الذي تم جلبه
    };

    console.log('[create-admin] Success:', response);
    return new Response(JSON.stringify(response), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 });

  } catch (error) {
    console.error('[create-admin] Unexpected error:', error);
    return new Response(JSON.stringify({ success: false, message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
}); 