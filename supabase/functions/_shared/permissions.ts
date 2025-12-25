import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { UserInfo, UserRole } from './auth.ts';

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// أنواع الصلاحيات المالية
export enum FinancialPermission {
  VIEW = 'view',
  ALLOCATE = 'allocate',
  TRANSFER = 'transfer',
  WITHDRAW = 'withdraw',
  DEPOSIT = 'deposit',
  MANAGE = 'manage', // إدارة كاملة (تتضمن كل الصلاحيات)
}

// واجهة الخطأ للصلاحيات
export class PermissionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 403) {
    super(message);
    this.name = 'PermissionError';
    this.statusCode = statusCode;
  }
}

/**
 * التحقق من صلاحية المستخدم
 * @param userId معرف المستخدم
 * @param permission الصلاحية المطلوبة
 * @returns صحيح إذا كان المستخدم يملك الصلاحية
 */
export async function checkPermission(userId: string, permission: string): Promise<boolean> {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
  
  const { data, error } = await supabaseAdmin
    .from('admins')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) return false;
  
  // التحقق من الصلاحية المباشرة
  if (data.permissions && data.permissions[permission] === true) return true;
  
  // التحقق من صلاحيات الدور
  const { data: rolePermissions } = await supabaseAdmin
    .rpc('check_admin_permission_enhanced', {
      admin_id: data.id,
      permission_code: permission
    });
  
  return !!rolePermissions;
}

/**
 * التحقق من صلاحية المستخدم على محفظة معينة
 * @param supabase عميل Supabase
 * @param userId معرف المستخدم
 * @param walletId معرف المحفظة
 * @param permission نوع الصلاحية المطلوبة
 * @returns صحيح إذا كان المستخدم يملك الصلاحية
 */
export async function checkWalletPermission(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  walletId: string,
  permission: FinancialPermission
): Promise<boolean> {
  // التحقق من وجود صلاحية مباشرة
  const { data: directPermission, error: permissionError } = await supabase
    .from('wallet_permissions')
    .select('*')
    .eq('user_id', userId)
    .eq('wallet_id', walletId)
    .single();

  if (directPermission) {
    // التحقق من الصلاحية المطلوبة
    if (directPermission.permission_type === FinancialPermission.MANAGE) {
      return true; // صلاحية الإدارة تتضمن كل الصلاحيات
    }
    if (directPermission.permission_type === permission) {
      return true;
    }
  }

  // التحقق من معلومات المستخدم ودوره
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, department_id')
    .eq('id', userId)
    .single();

  if (userError || !userData) {
    return false;
  }

  // التحقق من نوع المحفظة (نظام أم قسم)
  const { data: systemWallet } = await supabase
    .from('system_wallets')
    .select('id, wallet_type')
    .eq('id', walletId)
    .single();
  
  if (systemWallet) {
    // صلاحيات محافظ النظام
    if (userData.role === UserRole.SUPER_ADMIN) {
      return true; // المدير العام لديه كل الصلاحيات على محافظ النظام
    }
    
    if (userData.role === UserRole.FINANCE_MANAGER && 
        (permission === FinancialPermission.VIEW || permission === FinancialPermission.ALLOCATE)) {
      return true; // مدير المالية يمكنه العرض وتخصيص الميزانيات
    }
    
    return false;
  }
  
  // التحقق من محافظ الأقسام
  const { data: deptWallet } = await supabase
    .from('department_wallets')
    .select('id, department_id')
    .eq('id', walletId)
    .single();

  if (deptWallet) {
    // المدير العام ومدير المالية لديهم صلاحية العرض على كل المحافظ
    if ((userData.role === UserRole.SUPER_ADMIN || userData.role === UserRole.FINANCE_MANAGER) && 
        permission === FinancialPermission.VIEW) {
      return true;
    }
    
    // مدير القسم لديه صلاحيات على محفظة قسمه
    if (userData.role === UserRole.DEPARTMENT_MANAGER && 
        userData.department_id === deptWallet.department_id) {
      if (permission === FinancialPermission.VIEW || 
          permission === FinancialPermission.TRANSFER ||
          permission === FinancialPermission.ALLOCATE) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * التحقق من صلاحية المستخدم لتخصيص ميزانية للقسم
 */
export async function checkBudgetAllocationPermission(
  supabase: ReturnType<typeof createClient>,
  user: UserInfo,
  departmentId: string,
  amount: number
): Promise<void> {
  // فقط المدير العام ومدير المالية يمكنهم تخصيص الميزانيات
  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.FINANCE_MANAGER) {
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