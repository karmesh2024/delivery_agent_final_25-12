/**
 * Store Orders API Service
 * خدمة API لطلبات المتاجر
 */

import { supabase } from '@/lib/supabase';
import { StoreOrder, StoreOrderItem, StoreOrdersFilters } from '../types';

export const storeOrdersApi = {
  /**
   * جلب جميع طلبات المتاجر
   */
  async getAllOrders(filters?: StoreOrdersFilters): Promise<StoreOrder[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      let query = supabase
        .from('store_orders')
        .select(`
          *,
          shop:store_shops(
            id,
            name_ar,
            name_en
          )
        `)
        .order('created_at', { ascending: false });

      // تطبيق الفلاتر
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        if (filters.shop_id) {
          query = query.eq('shop_id', filters.shop_id);
        }

        if (filters.customer_id) {
          query = query.eq('customer_id', filters.customer_id);
        }

        if (filters.payment_status) {
          query = query.eq('payment_status', filters.payment_status);
        }

        if (filters.start_date) {
          query = query.gte('created_at', filters.start_date);
        }

        if (filters.end_date) {
          query = query.lte('created_at', filters.end_date);
        }

        if (filters.min_amount) {
          query = query.gte('final_amount', filters.min_amount);
        }

        if (filters.max_amount) {
          query = query.lte('final_amount', filters.max_amount);
        }

        if (filters.search) {
          query = query.ilike('order_number', `%${filters.search}%`);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // جلب بيانات الوكلاء بشكل منفصل
      const orders = (data || []) as any[];
      const customerIds = orders
        .map((order) => order.customer_id)
        .filter((id): id is string => id !== null && id !== undefined);

      let agentsMap = new Map<string, any>();

      if (customerIds.length > 0) {
        try {
          const { data: agentsData, error: agentsError } = await supabase
            .from('agents')
            .select(`
              id,
              full_name,
              phone,
              email,
              details:agent_details(
                latitude,
                longitude
              )
            `)
            .in('id', customerIds);

          if (!agentsError && agentsData) {
            agentsData.forEach((agent: any) => {
              if (agent?.details) {
                agent.location = agent.details.latitude && agent.details.longitude
                  ? {
                      lat: parseFloat(String(agent.details.latitude)),
                      lng: parseFloat(String(agent.details.longitude)),
                    }
                  : undefined;
                delete agent.details;
              }
              agentsMap.set(agent.id, agent);
            });
          }
        } catch (agentsError) {
          console.warn('Error fetching agents data:', agentsError);
          // نستمر بدون بيانات الوكلاء
        }
      }

      // دمج بيانات الوكلاء مع الطلبات
      const ordersWithAgents = orders.map((order) => {
        if (order.customer_id && agentsMap.has(order.customer_id)) {
          order.agent = agentsMap.get(order.customer_id);
        }
        return order;
      });

      return ordersWithAgents as StoreOrder[];
    } catch (error) {
      console.error('Error fetching store orders:', error);
      throw error;
    }
  },

  /**
   * جلب طلب محدد حسب ID
   */
  async getOrderById(orderId: string): Promise<StoreOrder | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await supabase
        .from('store_orders')
        .select(`
          *,
          shop:store_shops(
            id,
            name_ar,
            name_en
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        throw error;
      }

      // جلب بيانات الوكيل بشكل منفصل إذا كان customer_id موجود
      const order = data as any;
      if (order?.customer_id) {
        try {
          const { data: agentData, error: agentError } = await supabase
            .from('agents')
            .select(`
              id,
              full_name,
              phone,
              email,
              details:agent_details(
                latitude,
                longitude
              )
            `)
            .eq('id', order.customer_id)
            .single();

          if (!agentError && agentData) {
            if (agentData.details) {
              agentData.location = agentData.details.latitude && agentData.details.longitude
                ? {
                    lat: parseFloat(String(agentData.details.latitude)),
                    lng: parseFloat(String(agentData.details.longitude)),
                  }
                : undefined;
              delete agentData.details;
            }
            order.agent = agentData;
          }
        } catch (agentError) {
          console.warn('Error fetching agent data:', agentError);
          // نستمر بدون بيانات الوكيل
        }
      }

      return order as StoreOrder;
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      throw error;
    }
  },

  /**
   * جلب عناصر الطلب
   */
  async getOrderItems(orderId: string): Promise<StoreOrderItem[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await supabase
        .from('store_order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []) as StoreOrderItem[];
    } catch (error) {
      console.error('Error fetching order items:', error);
      throw error;
    }
  },

  /**
   * تحديث حالة الطلب
   */
  async updateOrderStatus(
    orderId: string,
    status: StoreOrder['status']
  ): Promise<StoreOrder> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await supabase
        .from('store_orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select(`
          *,
          shop:store_shops(
            id,
            name_ar,
            name_en
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      // جلب بيانات الوكيل بشكل منفصل إذا كان customer_id موجود
      const order = data as any;
      if (order?.customer_id) {
        try {
          const { data: agentData, error: agentError } = await supabase
            .from('agents')
            .select(`
              id,
              full_name,
              phone,
              email,
              details:agent_details(
                latitude,
                longitude
              )
            `)
            .eq('id', order.customer_id)
            .single();

          if (!agentError && agentData) {
            if (agentData.details) {
              agentData.location = agentData.details.latitude && agentData.details.longitude
                ? {
                    lat: parseFloat(String(agentData.details.latitude)),
                    lng: parseFloat(String(agentData.details.longitude)),
                  }
                : undefined;
              delete agentData.details;
            }
            order.agent = agentData;
          }
        } catch (agentError) {
          console.warn('Error fetching agent data:', agentError);
          // نستمر بدون بيانات الوكيل
        }
      }

      return order as StoreOrder;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  /**
   * تحديث حالة الدفع
   */
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: StoreOrder['payment_status']
  ): Promise<StoreOrder> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await supabase
        .from('store_orders')
        .update({
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select(`
          *,
          shop:store_shops(
            id,
            name_ar,
            name_en
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      // جلب بيانات الوكيل بشكل منفصل إذا كان customer_id موجود
      const order = data as any;
      if (order?.customer_id) {
        try {
          const { data: agentData, error: agentError } = await supabase
            .from('agents')
            .select(`
              id,
              full_name,
              phone,
              email,
              details:agent_details(
                latitude,
                longitude
              )
            `)
            .eq('id', order.customer_id)
            .single();

          if (!agentError && agentData) {
            if (agentData.details) {
              agentData.location = agentData.details.latitude && agentData.details.longitude
                ? {
                    lat: parseFloat(String(agentData.details.latitude)),
                    lng: parseFloat(String(agentData.details.longitude)),
                  }
                : undefined;
              delete agentData.details;
            }
            order.agent = agentData;
          }
        } catch (agentError) {
          console.warn('Error fetching agent data:', agentError);
          // نستمر بدون بيانات الوكيل
        }
      }

      return order as StoreOrder;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  /**
   * جلب طلبات الوكلاء المعتمدين
   */
  async getAgentOrders(filters?: StoreOrdersFilters): Promise<StoreOrder[]> {
    // في الوقت الحالي، نعتبر أن customer_id يشير إلى الوكيل
    // يمكن تحسين هذا لاحقاً بإضافة جدول منفصل للوكلاء
    return this.getAllOrders(filters);
  },

  /**
   * جلب طلبات المستخدمين العاديين
   */
  async getUserOrders(filters?: StoreOrdersFilters): Promise<StoreOrder[]> {
    // يمكن إضافة منطق للتمييز بين الوكلاء والمستخدمين لاحقاً
    return this.getAllOrders(filters);
  },
};

