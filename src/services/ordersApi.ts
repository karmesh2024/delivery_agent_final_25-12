import { supabase } from '@/lib/supabase';
import { DeliveryOrder, OrderDetailItem } from '@/types';

/**
 * واجهة بيانات المندوب المُرجعة من API
 */
interface AgentData {
  id: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  username?: string;
  status?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

/**
 * واجهة API موحدة للتعامل مع بيانات الطلبات
 * تعمل كطبقة وسيطة بين الكود وقاعدة البيانات
 */
export const ordersApi = {
  /**
   * جلب جميع الطلبات
   * @returns وعد يحتوي على مصفوفة من الطلبات
   */
  getAll: async (): Promise<DeliveryOrder[]> => {
    try {
      if (!supabase) throw new Error('اتصال Supabase غير متوفر');
      
      // 1. Fetch basic orders from delivery_orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('delivery_orders')
        .select('*'); // Select basic columns
      
      if (ordersError) throw ordersError;
      if (!ordersData) return [];

      // 2. Fetch order details from order_details table
      const orderIds = ordersData.map(order => order.id);
      const orderDetailsMap: Record<string, OrderDetailItem[]> = {};
      
      if (orderIds.length > 0) {
          const { data: orderDetailsData, error: orderDetailsError } = await supabase
            .from('order_details') // Fetch from the correct table
            .select('*')
            .in('delivery_order_id', orderIds); // Filter by order IDs

          if (orderDetailsError) {
            console.error('Orders API Error - Fetching order_details:', orderDetailsError);
            // Decide if you want to throw or return orders without details
          } else if (orderDetailsData) {
            // Organize details by order_id
            orderDetailsData.forEach(detail => {
              if (detail.delivery_order_id) {
                if (!orderDetailsMap[detail.delivery_order_id]) {
                  orderDetailsMap[detail.delivery_order_id] = [];
                }
                orderDetailsMap[detail.delivery_order_id].push(detail);
              }
            });
          }
      }

      // 3. Combine orders with their details
      const combinedOrders = ordersData.map(order => ({
        ...order,
        order_details: orderDetailsMap[order.id] || [], // Add details to each order
      }));
      
      console.log('Orders API - Fetched and combined orders:', combinedOrders?.length);
      return combinedOrders || []; // Return the combined data
    } catch (error) {
      console.error('Orders API Error - getAll:', error);
      throw error;
    }
  },
  
  /**
   * جلب طلب محدد بواسطة المعرف
   * @param id معرف الطلب
   * @returns وعد يحتوي على الطلب أو null
   */
  getById: async (id: string): Promise<DeliveryOrder | null> => {
    try {
      if (!supabase) throw new Error('اتصال Supabase غير متوفر');
      
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Orders API Error - getById:', error);
      throw error;
    }
  },
  
  /**
   * تحديث حالة طلب محدد
   * @param id معرف الطلب
   * @param status الحالة الجديدة للطلب
   * @returns وعد يحتوي على الطلب المحدث
   */
  updateStatus: async (id: string, status: string): Promise<DeliveryOrder | null> => {
    try {
      if (!supabase) throw new Error('اتصال Supabase غير متوفر');
      
      const { data, error } = await supabase
        .from('delivery_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Orders API Error - updateStatus:', error);
      throw error;
    }
  },
  
  /**
   * تعيين مندوب لطلب محدد
   * @param orderId معرف الطلب
   * @param agentId معرف المندوب
   * @returns وعد يحتوي على الطلب المحدث
   */
  assignAgent: async (orderId: string, agentId: string): Promise<DeliveryOrder | null> => {
    try {
      if (!supabase) throw new Error('اتصال Supabase غير متوفر');
      
      const { data, error } = await supabase
        .from('delivery_orders')
        .update({
          delivery_boy_id: agentId,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Orders API Error - assignAgent:', error);
      throw error;
    }
  },
  
  /**
   * جلب بيانات مندوب محدد بواسطة المعرف
   * ملاحظة: سيتم نقل هذه الوظيفة إلى agentsApi في المستقبل.
   * @param agentId معرف المندوب
   * @returns وعد يحتوي على بيانات المندوب أو null
   */
  getAgentById: async (agentId: string): Promise<AgentData | null> => {
    try {
      if (!supabase) throw new Error('اتصال Supabase غير متوفر');
      
      console.log("جلب بيانات المندوب للمعرف:", agentId);
      
      // استعلام أكثر شمولية لجلب بيانات المندوب
      // يجلب من delivery_boys وأيضاً يبحث عن آخر موقع معروف
      const { data, error } = await supabase
        .from('delivery_boys')
        .select('*')
        .eq('id', agentId)
        .single();
      
      if (error) {
        console.error('Orders API Error - getAgentById:', error);
        return null;
      }
      
      if (!data) {
        console.error('لم يتم العثور على بيانات المندوب للمعرف:', agentId);
        return null;
      }
      
      console.log("تم العثور على بيانات المندوب:", data);
      
      // تحويل البيانات إلى الشكل المتوقع مع استخراج الحقول المهمة
      const transformedData: AgentData = {
        id: data.id,
        name: data.username || data.full_name || 'مندوب التوصيل', // استخدام username إذا كان موجوداً
        phone: data.phone,
        avatar_url: data.profile_image_url,
        username: data.username || data.full_name,
        status: data.status || 'busy',
      };
      
      // إضافة معلومات الموقع إذا كانت متوفرة
      if (data.current_latitude && data.current_longitude) {
        transformedData.location = {
          lat: parseFloat(data.current_latitude),
          lng: parseFloat(data.current_longitude)
        };
      }
      
      console.log("بيانات المندوب المحولة:", transformedData);
      return transformedData;
    } catch (error) {
      console.error('Orders API Error - getAgentById:', error);
      return null;
    }
  }
};