import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { verifyToken } from "../_shared/auth.ts";

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
    // التحقق من التوكن
    const user = await verifyToken(req, supabaseUrl, supabaseKey);

    // إرجاع بيانات المستخدم
    const response: TokenResponse = {
      valid: true,
        user: {
          id: user.id,
          email: user.email,
        role: user.role,
        department_id: user.department_id,
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
    const statusCode = error.statusCode || 401;
    const response: TokenResponse = {
      valid: false,
      message: error.message || 'Authentication failed'
    };
    
    return new Response(
      JSON.stringify(response),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 