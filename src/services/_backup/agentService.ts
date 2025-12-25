import { supabase } from '@/lib/supabase';
import { NewAgentPayload, CoreAgent, AgentDetails, AgentProfile, Wallet, DeliveryBoy } from '@/types'; // استيراد أنواعك المعرفة حديثًا ومندوب التوصيل

// تعريف نوع مندوب التوصيل أكثر تفصيلاً لجلب البيانات وعرضها
export interface DeliveryAgentWithDetails extends DeliveryBoy {
  wallet: Wallet | null;
}

// واجهة مساعدة للبيانات الخام التي تم إرجاعها من استعلام Supabase Select
interface SupabaseDeliveryAgentResponse extends DeliveryBoy {
  wallet: Wallet[]; // Supabase returns 1-to-1 relations as arrays when using (*)
}

export const agentService = {
  /**
   * يجلب قائمة بمندوبي التوصيل مع محافظهم.
   * @returns مصفوفة من DeliveryAgentWithDetails أو خطأ.
   */
  getDeliveryAgents: async (): Promise<{ agents: DeliveryAgentWithDetails[] | null; error: string | null }> => {
    // التحقق من وجود عميل Supabase
    if (!supabase) {
      console.error('Supabase client is not initialized.');
      return { agents: null, error: 'Supabase client is not initialized.' };
    }

    try {
      const { data: agentsData, error: agentsError } = await supabase
        .from('delivery_boys') // من جدول delivery_boys
        .select(`
          *, // كل أعمدة جدول delivery_boys
          wallet:wallets(id, user_id, balance, currency, wallet_type) // ربط مع wallets، اختيار حقول محددة
        `);

      if (agentsError) {
        console.error('Error fetching delivery agents:', agentsError.message);
        return { agents: null, error: agentsError.message };
      }

      if (!agentsData) {
        return { agents: [], error: null };
      }

      // تحويل البيانات إلى النوع الصحيح هنا
      const deliveryAgents: DeliveryAgentWithDetails[] = (agentsData as unknown as SupabaseDeliveryAgentResponse[]).map((agent: SupabaseDeliveryAgentResponse) => ({
        ...agent,
        wallet: agent.wallet.length > 0 ? agent.wallet[0] : null,
      }));

      return { agents: deliveryAgents, error: null };

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع.';
      console.error('Unexpected error fetching delivery agents:', errorMessage);
      return { agents: null, error: errorMessage };
    }
  },

  // TODO: إضافة وظائف createDeliveryAgent, updateDeliveryAgent, deleteDeliveryAgent لاحقًا
}; 