import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// أنواع المستخدمين في النظام (دمج بين النوعين المستخدمين في النظام)
export type UserRole = 
  // الأدوار من AdminRole في التطبيق
  | 'super_admin' 
  | 'admin' 
  | 'manager' 
  | 'supervisor' 
  | 'support' 
  | 'viewer'
  // الأدوار الإضافية من النظام الأصلي
  | 'finance_manager'
  | 'department_manager'
  | 'delivery_agent';

// التسلسل الهرمي للأدوار (من الأعلى إلى الأدنى)
export const ROLE_HIERARCHY = {
  'super_admin': 100,
  'admin': 90,
  'finance_manager': 80,
  'department_manager': 70,
  'manager': 60,
  'supervisor': 50,
  'support': 40,
  'delivery_agent': 30,
  'viewer': 10
};

// واجهة معلومات المستخدم
export interface UserInfo {
  id: string;
  email: string;
  role: UserRole;
  department_id?: string;
  metadata?: Record<string, unknown>;
}

// خطأ المصادقة
export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

/**
 * التحقق من JWT والحصول على بيانات المستخدم
 * @param req الطلب المستلم
 * @param supabaseUrl عنوان URL للمصادقة
 * @param supabaseKey مفتاح المصادقة
 * @param requiredRoles صلاحيات مطلوبة (اختياري)
 * @returns بيانات المستخدم
 */
export async function verifyToken(
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
    // استخدام as UserRole مع التحقق من صحة القيمة
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
export function isValidUserRole(role: string): boolean {
  return role in ROLE_HIERARCHY;
}

/**
 * الحصول على بيانات المسؤول من معرف المستخدم
 * @param userId معرف المستخدم
 * @returns بيانات المسؤول أو null في حالة الفشل
 */
export async function getAdminByUserId(userId: string) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return { admin: null, error: error || new Error("Admin not found") };
    }

    return { admin: data, error: null };
  } catch (error) {
    return { admin: null, error };
  }
}

/**
 * التحقق من مستوى الدور وصلاحيته للوصول
 * @param userRole دور المستخدم
 * @param minimumRole الحد الأدنى للدور المطلوب
 * @returns هل المستخدم لديه الصلاحية
 */
export function hasRoleAccess(userRole: UserRole, minimumRole: UserRole): boolean {
  const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;
  const minimumRoleLevel = ROLE_HIERARCHY[minimumRole] || 0;
  return userRoleLevel >= minimumRoleLevel;
}

/**
 * تسجيل عملية في سجل التدقيق
 * @param supabase عميل Supabase
 * @param userId معرف المستخدم
 * @param action العملية
 * @param resourceType نوع الكيان
 * @param resourceId معرف الكيان
 * @param details تفاصيل إضافية
 */
export async function createAuditLog(
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