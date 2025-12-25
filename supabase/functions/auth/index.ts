import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  UserRole, 
  ROLE_HIERARCHY, 
  hasRoleAccess,
  verifyToken,
  isValidUserRole,
  UserInfo,
  AuthError
} from '../_shared/auth.ts';

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
// interface UserInfo {
//   id: string;
//   email: string;
//   role: UserRole;
//   department_id?: string;
//   metadata?: Record<string, unknown>;
// }

// خطأ المصادقة
// class AuthError extends Error {
//   statusCode: number;

//   constructor(message: string, statusCode = 401) {
//     super(message);
//     this.name = 'AuthError';
//     this.statusCode = statusCode;
//   }
// }

// التحقق من التوكن وإرجاع معلومات المستخدم
// async function verifyToken(
//   req: Request,
//   supabaseUrl: string,
//   supabaseKey: string,
//   requiredRoles?: UserRole[]
// ): Promise<UserInfo> {
  // ... (logic removed as it's now imported) ...
// }

// التحقق من صحة نوع الدور
// function isValidUserRole(role: string): boolean {
//   return role in ROLE_HIERARCHY; // ROLE_HIERARCHY is already imported
// }

// تعريف واجهة الاستجابة
interface TokenResponse {
  valid: boolean;
  user?: Record<string, unknown>;
  message?: string;
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
        valid: false, 
        message: 'Server configuration error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // التحقق من التوكن باستخدام الدالة المستوردة
    const user: UserInfo = await verifyToken(req, supabaseUrl, supabaseKey);
    
    // إرجاع بيانات المستخدم
    const response: TokenResponse = {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        role_level: ROLE_HIERARCHY[user.role] || 0
      }
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    // إرجاع خطأ المصادقة
    let errorMessage = 'Authentication failed';
    let statusCode = 401;

    if (error instanceof AuthError) {
      errorMessage = error.message;
      statusCode = error.statusCode;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      // statusCode remains 401 for generic errors or you can decide differently
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    // For truly unknown errors, a generic message is already set.

    const responseData: TokenResponse = {
      valid: false,
      message: errorMessage
    };

    return new Response(
      JSON.stringify(responseData),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 