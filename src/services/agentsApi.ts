import { supabase } from '@/lib/supabase';
import { Agent, DeliveryBoy } from '@/types';
import crypto from 'crypto';

// تعريف نوع لبيانات الموقع الأخير للمندوب
interface AgentLocation {
  delivery_boy_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
  [key: string]: unknown;
}

// تعريف نوع الحمولة لإنشاء مندوب توصيل جديد
export interface CreateAgentPayload {
  phone: string;
  password?: string;
  email?: string;
  full_name: string;
  preferred_vehicle?: 'tricycle' | 'pickup_truck' | 'light_truck';
  license_number?: string;
  national_id?: string;
  initial_balance?: number;
  currency?: string;
}

// دالة مساعدة لتوليد كلمة مرور عشوائية إذا لم يتم توفيرها
const generateRandomPassword = (length = 12) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  const charactersLength = characters.length;

  // Use cryptographically strong random bytes
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    result += characters.charAt(randomBytes[i] % charactersLength);
  }
  return result;
};

// This is the function you added manually, it needs to be part of the agentsApi object
const updateDetails = async (agentId: string, updateData: Partial<Agent>): Promise<Agent> => {
  // console.log(`[agentsApi.updateDetails] Updating agent ${agentId} with:`, updateData); // Removed sensitive log
  try {
    const response = await fetch(`/api/agents/${agentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      let errorData;
      let responseTextForError = ''; // Variable to store raw response text
      try {
        responseTextForError = await response.text();
        errorData = JSON.parse(responseTextForError);
      } catch (e) {
        console.error('[agentsApi.updateDetails] Failed to parse error response as JSON or read its text.', e);
        // console.error('[agentsApi.updateDetails] Raw error response text (if available):', responseTextForError || 'Response text was not readable.'); // Removed sensitive log
      }

      const serverErrorMessage = errorData?.error || (response.statusText !== '' ? response.statusText : `Request failed with status code ${response.status}`);
      const serverErrorDetails = errorData?.details;
      const fullErrorMessage = serverErrorDetails ? `${serverErrorMessage} - Details: ${serverErrorDetails}` : serverErrorMessage;

      console.error(`[agentsApi.updateDetails] Error: ${fullErrorMessage}`, {
        status: response.status,
        statusText: response.statusText,
        // parsedErrorData: errorData, // Removed potentially sensitive parsed error data
        // rawResponse: responseTextForError, // Removed potentially sensitive raw response text
      });
      throw new Error(fullErrorMessage);
    }

    const data: Agent = await response.json();
    // console.log('[agentsApi.updateDetails] Agent updated successfully, response data:', data); // Removed sensitive log
    return data;
  } catch (error) {
    const typedError = error as Error;
    console.error(`[agentsApi.updateDetails] An exception occurred: ${typedError.message}`, error);
    throw error;
  }
};

/**
 * واجهة API موحدة للتعامل مع بيانات المندوبين
 * تعمل كطبقة وسيطة بين الكود وقاعدة البيانات
 */
export const agentsApi = {
  /**
   * جلب جميع المندوبين
   * @returns وعد يحتوي على مصفوفة من المندوبين
   */
  getAll: async (): Promise<Agent[]> => {
    try {
      if (!supabase) {
        throw new Error('لم يتم تهيئة اتصال Supabase');
      }
      
      const { data, error } = await supabase
        .from('delivery_boys')
        .select('*');
      
      if (error) throw error;
      
      // تحويل البيانات لتتناسب مع النموذج المستخدم في التطبيق
      const agents = data?.map(agent => {
        // تحقق من وجود إحداثيات وتحويلها بشكل صحيح
        let location = null;
        
        if (agent.current_latitude || agent.current_longitude) {
          // محاولة تحويل الإحداثيات إلى أرقام
          const lat = agent.current_latitude ? parseFloat(String(agent.current_latitude)) : 0;
          const lng = agent.current_longitude ? parseFloat(String(agent.current_longitude)) : 0;
          
          // إنشاء كائن الموقع فقط إذا كان أحد الإحداثيات على الأقل غير صفري
          if (lat !== 0 || lng !== 0) {
            location = { lat, lng };
          }
        }
        
        return {
          ...agent,
          name: agent.full_name || null, // تحويل full_name إلى name
          location: location
        };
      }) || [];
      
      // إضافة سجلات تصحيح لفحص البيانات بعد التحويل
      // console.log('Agents API - Fetched agents:', data?.length); // Removed informational log
      // console.log('Agents API - Agents with valid location:', agents.filter(a => a.location).length); // Removed informational log
      
      return agents;
    } catch (error) {
      console.error('Agents API Error - getAll:', error);
      throw error;
    }
  },
  
  /**
   * جلب جميع المندوبين النشطين
   * @returns وعد يحتوي على مصفوفة من المندوبين النشطين
   */
  getActive: async (): Promise<Agent[]> => {
    try {
      if (!supabase) {
        throw new Error('لم يتم تهيئة اتصال Supabase');
      }
      
      const { data, error } = await supabase
        .from('active_delivery_boys_view')
        .select('*');
      
      if (error) throw error;
      // console.log('Agents API - Fetched active agents:', data?.length); // Removed informational log
      
      // تحويل البيانات لتتناسب مع النموذج المستخدم في التطبيق
      const agents = data?.map(agent => ({
        ...agent,
        name: agent.full_name || null, // تحويل full_name إلى name
        location: agent.current_latitude && agent.current_longitude ? {
          lat: parseFloat(agent.current_latitude),
          lng: parseFloat(agent.current_longitude)
        } : null
      })) || [];
      
      return agents;
    } catch (error) {
      console.error('Agents API Error - getActive:', error);
      throw error;
    }
  },
  
  /**
   * جلب مندوب محدد بواسطة المعرف
   * @param id معرف المندوب
   * @returns وعد يحتوي على المندوب أو null
   */
  getById: async (id: string): Promise<Agent | null> => {
    try {
      if (!supabase) {
        throw new Error('لم يتم تهيئة اتصال Supabase');
      }
      
      const { data, error } = await supabase
        .from('delivery_boys')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        // تحويل البيانات لتتناسب مع النموذج المستخدم في التطبيق
        return {
          ...data,
          name: data.full_name || null, // تحويل full_name إلى name
          location: data.current_latitude && data.current_longitude ? {
            lat: parseFloat(data.current_latitude),
            lng: parseFloat(data.current_longitude)
          } : null
        };
      }
      
      return null;
    } catch (error) {
      console.error('Agents API Error - getById:', error);
      throw error;
    }
  },
  
  /**
   * تحديث حالة مندوب محدد
   * @param id معرف المندوب
   * @param status الحالة الجديدة للمندوب
   * @returns وعد يحتوي على المندوب المحدث
   */
  updateStatus: async (id: string, status: string): Promise<Agent | null> => {
    try {
      if (!supabase) {
        throw new Error('لم يتم تهيئة اتصال Supabase');
      }
      
      const { data, error } = await supabase
        .from('delivery_boys')
        .update({ status: status })
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      
      if (data) {
        return { 
          ...data,
          name: data.full_name || null,
          location: data.current_latitude && data.current_longitude ? {
            lat: parseFloat(data.current_latitude),
            lng: parseFloat(data.current_longitude)
          } : null
        };
      }
      return null;
    } catch (error) {
      console.error('Agents API Error - updateStatus:', error);
      throw error;
    }
  },

  updateDetails: updateDetails, // إضافة دالة updateDetails هنا

  /**
   * إنشاء مندوب توصيل جديد.
   * يتضمن إنشاء مستخدم في `auth.users` وإدراج البيانات في `delivery_boys` و `wallets`.
   * @param payload البيانات الخاصة بمندوب التوصيل الجديد.
   * @returns معرف مندوب التوصيل الذي تم إنشاؤه حديثًا أو خطأ.
   */
  create: async (payload: CreateAgentPayload): Promise<{ agentId: string | null; error: string | null }> => {
    if (!supabase) {
      console.error('Supabase client is not initialized.');
      return { agentId: null, error: 'Supabase client is not initialized.' };
    }

    try {
      // 1. إنشاء مستخدم في Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        phone: payload.phone,
        password: payload.password || generateRandomPassword(), // استخدام الدالة المساعدة
        email: payload.email || undefined, // يمكن أن يكون البريد الإلكتروني اختياريًا
      });

      if (authError || !authData.user) {
        console.error('Error creating auth user for delivery boy:', authError?.message);
        return { agentId: null, error: authError?.message || 'فشل إنشاء مستخدم المصادقة لمندوب التوصيل.' };
      }

      const newDeliveryBoyId = authData.user.id;

      // 2. الإدراج في جدول public.delivery_boys
      const deliveryBoyData: Partial<DeliveryBoy> = {
        id: newDeliveryBoyId,
        phone: payload.phone,
        full_name: payload.full_name,
        email: payload.email || null,
        preferred_vehicle: payload.preferred_vehicle || null,
        license_number: payload.license_number || null,
        national_id: payload.national_id || null,
        status: 'active', // حالة افتراضية
        total_deliveries: 0,
        total_earnings: 0,
        rating: 0,
        is_available: true,
      };

      const { error: deliveryBoyError } = await supabase
        .from('delivery_boys')
        .insert([deliveryBoyData]);

      if (deliveryBoyError) {
        console.error('Error inserting into delivery_boys table:', deliveryBoyError.message);
        // التراجع عن إنشاء مستخدم المصادقة
        await supabase.auth.admin.deleteUser(newDeliveryBoyId);
        return { agentId: null, error: deliveryBoyError.message };
      }

      // 3. إنشاء محفظة في public.wallets
      const { error: walletError } = await supabase
        .from('wallets')
        .insert([{
          user_id: newDeliveryBoyId,
          balance: payload.initial_balance ?? 0.0,
          currency: payload.currency ?? 'SAR', // العملة الافتراضية
          wallet_type: 'DELIVERY_BOY_WALLET', // نوع المحفظة لمندوبي التوصيل
        }]);

      if (walletError) {
        console.error('Error creating wallet for delivery boy:', walletError.message);
        // التراجع عن delivery_boys ومستخدم المصادقة
        await supabase.from('delivery_boys').delete().eq('id', newDeliveryBoyId);
        await supabase.auth.admin.deleteUser(newDeliveryBoyId);
        return { agentId: null, error: walletError.message };
      }

      return { agentId: newDeliveryBoyId, error: null };

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع.';
      console.error('Unexpected error during delivery boy creation:', errorMessage);
      return { agentId: null, error: errorMessage };
    }
  },

  // TODO: إضافة وظائف deleteAgent أو deleteDeliveryBoy لاحقًا
};