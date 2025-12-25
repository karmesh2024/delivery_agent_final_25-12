import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { UserRole, ROLE_HIERARCHY, hasRoleAccess } from '../_shared/auth.ts';

// تعريف الهيدرز للـ CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// دالة للتعامل مع طلبات OPTIONS
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

// واجهة معلومات المستخدم
interface UserInfo {
  id: string;
  email: string;
  role: UserRole;
  department_id?: string;
  metadata?: Record<string, unknown>;
}

// خطأ المصادقة
class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

// خطأ الصلاحيات
class PermissionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 403) {
    super(message);
    this.name = 'PermissionError';
    this.statusCode = statusCode;
  }
}

// التحقق من التوكن وإرجاع معلومات المستخدم
async function verifyToken(
  req: Request,
  supabaseUrl: string,
  supabaseKey: string,
  requiredRoles?: UserRole[]
): Promise<UserInfo> {
  // استخراج التوكن من الهيدر
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new AuthError('Missing Authorization header');
  }

  // التحقق من صيغة التوكن
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    throw new AuthError('Invalid token format');
  }

  // إنشاء عميل Supabase
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // التحقق من صلاحية التوكن
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new AuthError('Invalid or expired token');
  }

  // استخراج معلومات المستخدم من جدول admins
  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select(`
      id, 
      email, 
      department_id, 
      role_id,
      roles:role_id (name)
    `)
    .eq('user_id', user.id)
    .single();

  if (adminError || !adminData) {
    // محاولة ثانية من جدول users (للتوافق مع النظام القديم)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, department_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      throw new AuthError('User not found in admins or users table');
    }

    // التحقق من الصلاحيات إذا كانت مطلوبة
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = userData.role as UserRole;
      if (!requiredRoles.includes(userRole)) {
        throw new AuthError('Insufficient permissions', 403);
      }
    }

    return userData as UserInfo;
  }

  // تحويل بيانات المستخدم من جدول admins إلى الشكل المطلوب
  // استخراج اسم الدور من العلاقة المرجعية
  let roleName: UserRole = 'viewer'; // القيمة الافتراضية هي أدنى مستوى من الصلاحيات
  if (adminData.roles && typeof adminData.roles === 'object' && adminData.roles !== null) {
    const roleFromDB = (adminData.roles as { name: string }).name;
    // التحقق من أن الدور هو قيمة صالحة من UserRole
    if (isValidUserRole(roleFromDB)) {
      roleName = roleFromDB as UserRole;
    }
  }

  const userInfo: UserInfo = {
    id: adminData.id,
    email: adminData.email,
    role: roleName,
    department_id: adminData.department_id,
  };

  // التحقق من الصلاحيات إذا كانت مطلوبة
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(userInfo.role)) {
      throw new AuthError('Insufficient permissions', 403);
    }
  }

  return userInfo;
}

/**
 * التحقق من صحة نوع الدور
 * @param role اسم الدور للتحقق
 * @returns هل الدور صالح
 */
function isValidUserRole(role: string): boolean {
  return role in ROLE_HIERARCHY;
}

// دالة لإنشاء سجل في جدول سجلات التدقيق
async function createAuditLog(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: Record<string, unknown>
) {
  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to create audit log:', error);
  }
}

// التحقق من صلاحية المستخدم لتخصيص ميزانية للقسم
async function checkBudgetAllocationPermission(
  supabase: ReturnType<typeof createClient>,
  user: UserInfo,
  departmentId: string,
  amount: number
): Promise<void> {
  // فقط المدير العام ومدير المالية يمكنهم تخصيص الميزانيات
  const requiredRoles: UserRole[] = ['super_admin', 'admin', 'finance_manager'];
  const hasPermission = requiredRoles.some(role => hasRoleAccess(user.role, role));
  
  if (!hasPermission) {
    throw new PermissionError('ليس لديك صلاحية تخصيص الميزانيات');
  }

  // التحقق من وجود رصيد كافي في الخزينة الرئيسية
  const { data: treasury } = await supabase
    .from('system_wallets')
    .select('balance')
    .eq('wallet_type', 'main_treasury')
    .single();

  if (!treasury || treasury.balance < amount) {
    throw new PermissionError('لا يوجد رصيد كافي في الخزينة الرئيسية');
  }

  // التحقق من وجود القسم
  const { data: department } = await supabase
    .from('departments')
    .select('id')
    .eq('id', departmentId)
    .single();

  if (!department) {
    throw new PermissionError('القسم غير موجود');
  }
}

// واجهة طلب تخصيص الميزانية
interface AllocationRequest {
  department_id: string;
  amount: number;
  description: string;
}

// معالج الطلبات
serve(async (req: Request) => {
  // التعامل مع طلبات CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // الحصول على عناوين البيئة
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Server configuration error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // إنشاء عميل Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // التحقق من الطريقة
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Method not allowed' 
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // التحقق من التوكن (بدون تحديد أدوار محددة، سنتحقق من الصلاحيات في دالة checkBudgetAllocationPermission)
    const user = await verifyToken(req, supabaseUrl, supabaseKey);

    // استخراج بيانات الطلب
    const { department_id, amount, description }: AllocationRequest = await req.json();

    // التحقق من البيانات المطلوبة
    if (!department_id || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid request data' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // التحقق من صلاحيات المستخدم
    await checkBudgetAllocationPermission(supabase, user, department_id, amount);

    // تنفيذ عملية تخصيص الميزانية باستخدام دالة SQL
    const { data: result, error: allocationError } = await supabase.rpc(
      'allocate_department_budget',
      {
        p_department_id: department_id,
        p_amount: amount,
        p_description: description || 'تخصيص ميزانية للقسم',
        p_allocated_by: user.id
      }
    );

    if (allocationError) {
      throw new Error(`فشل في تخصيص الميزانية: ${allocationError.message}`);
    }

    // إنشاء سجل تدقيق للعملية
    await createAuditLog(
      supabase,
      user.id,
      'allocate_budget',
      'department',
      department_id,
      {
        amount,
        description,
        transaction_id: result.transaction_id
      }
    );

    // إرجاع نتيجة العملية
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        message: 'تم تخصيص الميزانية بنجاح' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    // معالجة الأخطاء
    console.error('Error in allocate-budget:', error);
    
    const statusCode = error instanceof PermissionError || error instanceof AuthError ? error.statusCode : 500;
    const errorMessage = error.message || 'حدث خطأ أثناء تخصيص الميزانية';

    return new Response(
      JSON.stringify({ 
        success: false, 
        message: errorMessage 
      }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 