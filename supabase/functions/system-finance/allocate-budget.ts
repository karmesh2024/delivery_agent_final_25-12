import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { verifyToken, UserRole, createAuditLog } from "../_shared/auth.ts";
import { checkBudgetAllocationPermission, PermissionError } from "../_shared/permissions.ts";

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
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

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
    if (req.method !== "POST") {
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

    // التحقق من التوكن والصلاحيات
    const user = await verifyToken(
      req, 
      supabaseUrl, 
      supabaseKey, 
      [UserRole.SUPER_ADMIN, UserRole.FINANCE_MANAGER]
    );

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
    
    const statusCode = error instanceof PermissionError ? error.statusCode : 500;
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