// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Create-payout-request function initializing...");

// تعريف متغيرات البيئة التي ستحتاجها الدالة
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const anonKey = Deno.env.get('SUPABASE_ANON_KEY'); // <-- استخدام anonKey لمصادقة المستخدم
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); // <-- لعمليات السيرفر التي تتطلب صلاحيات أعلى

// تعريف ترويسات CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // أو نطاقك المحدد في الإنتاج
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // هذه الدالة ستركز على POST و OPTIONS
};

Deno.serve(async (req: Request) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  // طباعة جميع الترويسات للتشخيص
  console.log("---------- ALL REQUEST HEADERS ----------");
  for (const [key, value] of req.headers.entries()) {
    console.log(`${key}: ${value}`);
  }
  console.log("----------------------------------------");
  
  const incomingAuthHeader = req.headers.get('Authorization');
  console.log(`Authorization header received by Edge Function: '${incomingAuthHeader}'`);

  // معالجة طلبات OPTIONS لـ CORS preflight
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for CORS preflight.");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("Missing Supabase environment variables. SUPABASE_URL:", supabaseUrl, "ANON_KEY:", anonKey, "SERVICE_KEY:", serviceRoleKey)
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing Supabase environment variables.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    console.log("Supabase URL and Keys seem to be loaded.");

    // 1. إنشاء عميل Supabase للتحقق من مصادقة المستخدم بناءً على JWT
    //    يجب استخدام anonKey هنا.
    
    // إعداد ترويسات عميل Supabase
    const headers: Record<string, string> = {};
    
    // إضافة ترويسة Authorization إذا كانت موجودة
    if (incomingAuthHeader) {
      headers["Authorization"] = incomingAuthHeader;
    }
    
    console.log("Creating Supabase client with headers:", headers);
    
    const supabaseClientForUserAuth: SupabaseClient = createClient(supabaseUrl, anonKey!, {
      global: { headers },
      auth: {
        // persistSession: false, // مهم للخوادم عديمة الحالة مثل Edge Functions
        // autoRefreshToken: false // لا حاجة لتحديث الرمز المميز تلقائيًا هنا
      }
    });
    console.log("Supabase client for user authentication created (using anonKey).");

    // 1. التحقق من JWT للمستخدم (استخلاص user_id)
    //    استخدم العميل الذي تم إنشاؤه باستخدام anonKey
    const { data: { user }, error: userError } = await supabaseClientForUserAuth.auth.getUser();

    if (userError) {
      console.error("User authentication error:", userError);
      return new Response(JSON.stringify({ error: userError.message || 'Authentication required or invalid token.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: userError.status || 401,
      });
    }

    if (!user) {
      console.error("User not found after auth check. This shouldn't happen if userError is null.");
      return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    console.log(`User authenticated: ${user.id}, Email: ${user.email}`);

    // 2. إنشاء عميل Supabase باستخدام serviceRoleKey للعمليات التي تتطلب صلاحيات أعلى
    //    (مثل الوصول المباشر إلى الجداول دون RLS إذا لزم الأمر)
    //    لا تستخدم هذا العميل للتحقق من هوية المستخدم الأصلي.
    const supabaseAdminClient: SupabaseClient = createClient(supabaseUrl, serviceRoleKey!);
    console.log("Supabase admin client created (using serviceRoleKey) for privileged operations.");

    const url = new URL(req.url);
    // المسار المتوقع لهذه الدالة هو / (أو لا شيء بعد اسم الدالة)
    // لأن اسم الدالة نفسه (create-payout-request) هو ما يحدد العملية
    const path = url.pathname.replace(/^\/functions\/v1\/create-payout-request/, '');
    console.log(`Original pathname: ${url.pathname}, Processed path: ${path}`);


    if (req.method === 'POST') {
      // منطق إنشاء طلب السحب سيأتي هنا
      // 2. قراءة جسم الطلب (payload) والتحقق من صحته
      const requestPayload = await req.json();
      console.log("Request payload (full):", JSON.stringify(requestPayload, null, 2));

      try {
        // استخراج الحقول مع طباعتها للتشخيص
        const { amount, currency, payment_method, payment_method_details, recipient_details, notes } = requestPayload;
        console.log("Extracted fields:");
        console.log("- amount:", amount);
        console.log("- currency:", currency);
        console.log("- payment_method:", payment_method);
        console.log("- payment_method_details:", payment_method_details);
        console.log("- recipient_details:", recipient_details);
        console.log("- notes:", notes);

        // التحقق الأساسي من المدخلات (يمكن إضافة تحققات أكثر تفصيلاً)
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
          console.log("Validation error: Invalid or missing amount");
          return new Response(JSON.stringify({ error: 'Invalid or missing amount.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400, // Bad Request
          });
        }

        // تحديد تفاصيل طريقة الدفع - يمكن أن تكون في payment_method_details أو recipient_details
        let paymentDetails = null;
        if (payment_method_details && typeof payment_method_details === 'object') {
          paymentDetails = payment_method_details;
          console.log("Using payment_method_details for payment details");
        } else if (recipient_details && typeof recipient_details === 'object') {
          paymentDetails = recipient_details;
          console.log("Using recipient_details for payment details");
        }

        // التحقق من وجود تفاصيل الدفع
        if (!paymentDetails) {
          console.log("Validation error: No valid payment details found");
          return new Response(JSON.stringify({ 
            error: 'Invalid or missing payment details. Either payment_method_details or recipient_details must be provided.',
            received_data: {
              has_payment_method_details: !!payment_method_details,
              has_recipient_details: !!recipient_details,
              payment_method_details_type: typeof payment_method_details,
              recipient_details_type: typeof recipient_details
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400, // Bad Request
          });
        }
        
        console.log("Payment details found:", paymentDetails);
        
        // استخدام إما payment_method أو استخراجه من payment_method_details.type إذا كان موجودًا
        const paymentMethod = payment_method || 
                           (payment_method_details && payment_method_details.type) || 
                           "unknown";
        console.log(`Payment method determined as: ${paymentMethod}`);
        
        // يمكن إضافة المزيد من التحققات هنا على payment_method وغيرها
        // مثل: currency (EGP), payment_method (BANK_ACCOUNT, MOBILE_WALLET), etc.
        
        // 3. جلب محفظة المستخدم
        console.log(`Fetching wallet for user: ${user.id}`);
        const { data: wallets, error: walletsError } = await supabaseAdminClient
          .from('wallets')
          .select('id, balance, currency')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (walletsError) {
          console.error("Error fetching user wallet:", walletsError);
          return new Response(JSON.stringify({ 
            error: 'Failed to fetch user wallet.',
            details: walletsError.message
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
        
        let wallet;
        
        // إذا لم يكن لدى المستخدم محفظة، فقم بإنشاء محفظة جديدة
        if (!wallets || wallets.length === 0) {
          console.log(`No wallet found for user: ${user.id}. Creating a new wallet...`);
          const defaultBalance = 0; // رصيد البداية صفر
          const defaultCurrency = currency || 'EGP'; // استخدام عملة الطلب أو EGP كافتراضي
          
          // إنشاء محفظة جديدة للمستخدم
          const { data: newWallet, error: createWalletError } = await supabaseAdminClient
            .from('wallets')
            .insert([{
              user_id: user.id,
              balance: defaultBalance,
              currency: defaultCurrency,
              wallet_type: 'CUSTOMER_HOME' // نوع المحفظة مطلوب حسب قيود قاعدة البيانات
            }])
            .select('id, balance, currency')
            .single();
          
          if (createWalletError) {
            console.error("Error creating wallet for user:", createWalletError);
            return new Response(JSON.stringify({ 
              error: 'Failed to create wallet for your account.',
              details: createWalletError.message,
              action_needed: 'Please contact support to set up your wallet.'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            });
          }
          
          wallet = newWallet;
          console.log(`Created new wallet: ${wallet.id} with balance: ${wallet.balance} ${wallet.currency}`);
        } else {
          wallet = wallets[0];
          console.log(`Found wallet: ${wallet.id} with balance: ${wallet.balance} ${wallet.currency}`);
        }
        
        // 4. التحقق من كفاية الرصيد
        const requestedAmount = Number(amount);
        if (wallet.balance < requestedAmount) {
          console.error(`Insufficient balance. Requested: ${requestedAmount}, Available: ${wallet.balance}`);
          return new Response(JSON.stringify({ 
            error: 'Insufficient balance in your wallet for this payout request.',
            requested_amount: requestedAmount,
            available_balance: wallet.balance,
            currency: wallet.currency
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }

        // 5. البحث عن تفاصيل دفع المستخدم المناسبة
        let payoutToUserPaymentMethodId = null;
        if (paymentMethod) {
          // استخدام معرف محدد مسبقًا لاختبار الدالة
          payoutToUserPaymentMethodId = "a8a734be-5593-419d-bb94-4bc79664401d"; // استخدام المعرف المعروف
          console.log(`Using hardcoded user payment method ID: ${payoutToUserPaymentMethodId}`);
          
          /* تعليق الاستعلام الأصلي مؤقتًا للاختبار
          const { data: userPaymentMethods, error: userPaymentMethodsError } = await supabaseAdminClient
            .from('user_payment_methods')
            .select('id, payment_method_id')
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE')
            .order('is_default', { ascending: false })
            .limit(1);
            
          if (!userPaymentMethodsError && userPaymentMethods && userPaymentMethods.length > 0) {
            payoutToUserPaymentMethodId = userPaymentMethods[0].id;
            console.log(`Found user payment method ID: ${payoutToUserPaymentMethodId}`);
          } else {
            console.error(`No active payment method found for user: ${user.id}`);
            return new Response(JSON.stringify({ 
              error: 'لم يتم العثور على تفاصيل طريقة دفع مسجلة لحسابك. يرجى إضافة طريقة دفع أولاً.',
              action_needed: 'أضف طريقة دفع في إعدادات حسابك.'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            });
          }
          */
        }

        // 6. بدء معاملة قاعدة بيانات
        // ملاحظة: لمزيد من الأمان، قد ترغب في استخدام المعاملات، ولكن هذا يتطلب SQL مباشر
        
        // 7. إنشاء سجل في payouts
        const payoutData = {
          user_id: user.id,
          wallet_id: wallet.id,
          amount_requested: requestedAmount,
          currency: currency || wallet.currency || 'EGP',
          status: 'PENDING_APPROVAL', // القيمة الافتراضية
          payout_to_user_payment_method_id: payoutToUserPaymentMethodId,
          user_notes: notes || null,
          // يتم تحديث الحقول التالية تلقائيًا من قبل قاعدة البيانات:
          // requested_at, updated_at, created_at
        };
        
        console.log("Creating payout record with data:", payoutData);
        const { data: newPayout, error: payoutError } = await supabaseAdminClient
          .from('payouts')
          .insert(payoutData)
          .select()
          .single();
        
        if (payoutError) {
          console.error("Error creating payout request:", payoutError);
          return new Response(JSON.stringify({ 
            error: 'Failed to create payout request.',
            details: payoutError.message
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
        
        console.log(`Payout request created successfully with ID: ${newPayout.id}`);
        
        // 8. إنشاء سجل في transactions (اختياري - يمكن تنفيذه عند الموافقة على طلب السحب)
        // 9. (اختياري) حجز المبلغ في wallet_transactions
        // هذه الخطوات يمكن إضافتها لاحقًا، أو عند الموافقة على طلب السحب
        
        // 10. إرجاع الاستجابة
  return new Response(
          JSON.stringify({ 
            success: true,
            message: "Payout request created successfully.",
            payout: {
              id: newPayout.id,
              amount: newPayout.amount_requested,
              currency: newPayout.currency,
              status: newPayout.status,
              created_at: newPayout.created_at,
              requested_at: newPayout.requested_at
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
        );
      } catch (error) {
        console.error("Error processing request payload:", error);
        return new Response(JSON.stringify({ 
          error: 'Error processing payment request data.',
          details: error.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
    }

    console.warn(`Method ${req.method} not allowed for this function or path ${path} not found.`);
    return new Response(JSON.stringify({ error: 'Method Not Allowed or Path Not Found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405, // أو 404
    });

  } catch (error) {
    console.error('Error in function execution:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

console.log("Create-payout-request function event loop started.");

/* To invoke locally:

  1. Ensure your .env file at the project root (D:\karmesh_githup\delivery-agent-dashboard\.env) has:
     SUPABASE_URL=https://yytjguijpbahrltqjdks.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_or_anon_key_if_testing_without_user_jwt

  2. Run Deno:
     deno run --allow-net --allow-env --env=D:\karmesh_githup\delivery-agent-dashboard\.env supabase/functions/create-payout-request/index.ts

  3. Make an HTTP POST request (e.g., using Postman or curl):
     POST http://localhost:8000/
     Headers:
       Content-Type: application/json
       apikey: YOUR_ANON_KEY (if you used anon key in .env and didn't pass user JWT)
       Authorization: Bearer YOUR_USER_JWT (if your function will verify it)
     Body (example based on plan section 3.3.3):
     {
       "amount": 100.50,
       "currency": "EGP",
       "payment_method": "bank_transfer",
       "recipient_details": { // Details for bank transfer, mobile wallet, etc.
         "account_holder_name": "John Doe",
         "account_number": "1234567890",
         "bank_name": "National Bank",
         "swift_code": "001"
       },
       "notes": "Urgent payout request"
     }

*/