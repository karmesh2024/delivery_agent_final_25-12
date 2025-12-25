/**
 * واجهة برمجة التطبيق للتعامل مع دوال Edge Functions
 */

// استيراد الإعدادات البيئية
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * واجهة إنشاء مسؤول جديد
 */
export interface CreateAdminEdgeData {
  email: string;
  password: string;
  full_name: string;
  username?: string;
  role_id: string;
  department_id?: string;
  initial_balance?: number;
}

/**
 * واجهة استجابة إنشاء مسؤول
 */
export interface CreateAdminResponse {
  success: boolean;
  message: string;
  admin_id?: string;
  user_id?: string;
  wallet_id?: string;
  email?: string;
  role?: string;
}

/**
 * دوال API للتعامل مع Edge Functions
 */
export const edgeFunctionsApi = {
  /**
   * إنشاء مسؤول جديد باستخدام دالة create-admin
   * @param adminData بيانات المسؤول الجديد
   * @returns نتيجة عملية إنشاء المسؤول
   */
  createAdmin: async (adminData: CreateAdminEdgeData): Promise<CreateAdminResponse> => {
    try {
      console.log('[edgeFunctionsApi.createAdmin] Attempting to create admin with data:', JSON.stringify({
        ...adminData,
        password: '******', // عدم طباعة كلمة المرور في السجلات
      }, null, 2));
      
      // Log información detallada sobre el role_id para depuración
      console.log(`[edgeFunctionsApi.createAdmin] Role ID type: ${typeof adminData.role_id}`);
      console.log(`[edgeFunctionsApi.createAdmin] Role ID value: "${adminData.role_id}"`);
      console.log(`[edgeFunctionsApi.createAdmin] Role ID length: ${adminData.role_id?.length || 0}`);
      
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('[edgeFunctionsApi.createAdmin] Supabase configuration is missing!');
        throw new Error('Supabase configuration is missing');
      }

      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/create-admin`;
      console.log('[edgeFunctionsApi.createAdmin] Calling Edge Function URL:', edgeFunctionUrl);
      
      const startTime = new Date().getTime();
      
      try {
        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(adminData),
        });
        
        const endTime = new Date().getTime();
        const requestTime = endTime - startTime;
        
        console.log(`[edgeFunctionsApi.createAdmin] Response status: ${response.status} (took ${requestTime}ms)`);
        
        // محاولة استخراج الرسالة النصية عند حدوث خطأ
        if (!response.ok) {
          let errorMessage = `Error ${response.status}`;
          
          try {
            const errorData = await response.json();
            console.error('[edgeFunctionsApi.createAdmin] Error response:', errorData);
            
            // تحسين رسالة الخطأ
            if (response.status === 409) {
              errorMessage = errorData.message || 'البريد الإلكتروني موجود بالفعل';
            } else if (response.status === 422) {
              // تعامل خاص مع أخطاء التحقق من البيانات
              if (errorData?.message?.includes('email') || 
                  errorData?.message?.includes('already been registered') ||
                  errorData?.message?.includes('مسجل بالفعل') ||
                  errorData?.message?.includes('البريد الإلكتروني موجود')) {
                errorMessage = errorData.message || 'البريد الإلكتروني مسجل بالفعل في النظام';
              } else {
                errorMessage = errorData.message || 'خطأ في البيانات المدخلة';
              }
            } else if (response.status === 500) {
              // تعامل مع أخطاء الخادم
              if (errorData?.message?.includes('تعذر حذف سجل الأدمن') ||
                  errorData?.message?.includes('unique constraint') ||
                  errorData?.message?.includes('duplicate key')) {
                errorMessage = 'حدثت مشكلة في معالجة البريد الإلكتروني. يرجى استخدام بريد إلكتروني آخر.';
              } else {
                errorMessage = errorData.message || 'حدث خطأ في الخادم أثناء معالجة الطلب';
              }
            } else {
              errorMessage = errorData.message || errorData.error || `Error: ${response.status}`;
            }
          } catch (parseError) {
            console.error('[edgeFunctionsApi.createAdmin] Could not parse error response:', parseError);
            
            try {
              // محاولة الحصول على النص الخام
              const errorText = await response.text();
              console.error('[edgeFunctionsApi.createAdmin] Raw error response:', errorText);
              errorMessage = errorText || `Error: ${response.status}`;
            } catch (textError) {
              console.error('[edgeFunctionsApi.createAdmin] Could not get error text:', textError);
            }
          }
          
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('[edgeFunctionsApi.createAdmin] Success response:', result);
        return {
          success: true,
          message: result.message || 'تم إنشاء المسؤول بنجاح',
          admin_id: result.admin_id,
          user_id: result.user_id,
          wallet_id: result.wallet_id,
          email: result.email || adminData.email,
          role: result.role
        };
      } catch (fetchError) {
        console.error('[edgeFunctionsApi.createAdmin] Fetch error:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('[edgeFunctionsApi.createAdmin] Error in createAdmin edge function:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'حدث خطأ غير معروف أثناء إنشاء المسؤول',
      };
    }
  },
  
  /**
   * جلب دور المسؤول بواسطة المعرف
   * @param roleId معرف الدور
   * @returns اسم الدور ومعرفه
   */
  getRoleById: async (roleId: string): Promise<{ id: string; name: string; code: string } | null> => {
    try {
      // استخدام API داخلي لجلب معلومات الدور
      const response = await fetch(`/api/roles/${roleId}`);
      if (!response.ok) {
        throw new Error(`Error fetching role: ${response.status}`);
      }
      
      const result = await response.json();
      return result.role || null;
    } catch (error) {
      console.error('Error in getRoleById:', error);
      return null;
    }
  },
  
  /**
   * التحقق من صحة الوصول إلى دالة Edge Function
   * @returns حالة الاتصال
   */
  checkConnection: async (): Promise<{ success: boolean; message: string }> => {
    try {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration is missing');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/auth`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Connection failed: ${response.status}`);
      }

      return { success: true, message: 'الاتصال بدوال الحافة ناجح' };
    } catch (error) {
      console.error('Error checking connection:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'فشل الاتصال بدوال الحافة',
      };
    }
  },
}; 