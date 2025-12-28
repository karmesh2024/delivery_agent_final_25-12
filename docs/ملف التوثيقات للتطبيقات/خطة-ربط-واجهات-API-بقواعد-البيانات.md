# خطة تنفيذية لربط واجهات API بقواعد البيانات المشتركة

## مقدمة

تهدف هذه الوثيقة إلى توفير خطة تنفيذية عملية لربط واجهات API في لوحة التحكم (Delivery-Agent-Dashboard) بقواعد البيانات المشتركة لكل من تطبيق العميل وتطبيق مندوب التوصيل. تركز هذه الخطة على النطاقات التي تم تحويلها بالفعل إلى نمط DDD مع Redux، وتوضح الخطوات اللازمة لتطوير طبقة وسيطة موحدة للتعامل مع قواعد البيانات المشتركة.

## الوضع الحالي لواجهات API في المشروع

### النطاقات المحولة بالكامل إلى Redux

1. **نطاق الطلبات (Orders)**
   - API: `src/domains/orders/api/ordersApi.ts`
   - Redux: `src/domains/orders/store/ordersSlice.ts`
   - حالة التحويل: مكتمل

2. **نطاق المندوبين (Agents)**
   - API: `src/domains/agents/api/agentsApi.ts`
   - Redux: `src/domains/agents/store/agentsSlice.ts`
   - حالة التحويل: مكتمل

3. **نطاق الخرائط (Mapping)**
   - API: `src/domains/mapping/api/mappingApi.ts`
   - Redux: `src/domains/mapping/store/mappingSlice.ts`
   - حالة التحويل: مكتمل

### النطاقات قيد التحويل

1. **نطاق الرحلات (Trips)**
   - Redux: `src/domains/trips/store/tripsSlice.ts` (جزئي)
   - حالة التحويل: جزئي

2. **نطاق الإعدادات (Settings)**
   - Redux: `src/domains/settings/store/settingsSlice.ts` (جزئي)
   - حالة التحويل: جزئي

### النطاقات غير المحولة بعد

1. **نطاق الرسائل (Messages)**
2. **نطاق التحليلات (Analytics)**
3. **نطاق الدعم (Support)**

## خطة ربط واجهات API بقواعد البيانات

### المرحلة 1: تطوير طبقة وسيطة موحدة للتعامل مع قواعد البيانات

#### 1.1 إنشاء هيكل الملفات

```
src/
├── lib/
│   ├── database/
│   │   ├── index.ts                 # نقطة الدخول الرئيسية
│   │   ├── types.ts                 # أنواع البيانات المشتركة
│   │   ├── converters/              # محولات البيانات
│   │   │   ├── index.ts
│   │   │   ├── customerConverter.ts
│   │   │   ├── agentConverter.ts
│   │   │   ├── orderConverter.ts
│   │   │   └── ...
│   │   ├── repositories/           # مستودعات البيانات
│   │   │   ├── index.ts
│   │   │   ├── customerRepository.ts
│   │   │   ├── agentRepository.ts
│   │   │   ├── orderRepository.ts
│   │   │   └── ...
│   │   └── utils/                  # دوال مساعدة
│   │       ├── index.ts
│   │       ├── queries.ts
│   │       ├── filters.ts
│   │       └── ...
```

#### 1.2 تنفيذ طبقة المستودعات

##### 1.2.1 تنفيذ مستودع الطلبات

```typescript
// src/lib/database/repositories/orderRepository.ts

import { supabase } from '@/lib/supabase';
import { Order, OrderFilter } from '@/lib/database/types';
import { orderConverter } from '@/lib/database/converters';

export const orderRepository = {
  /**
   * جلب جميع الطلبات مع إمكانية التصفية
   */
  getAll: async (filters?: OrderFilter): Promise<Order[]> => {
    let query = supabase
      .from('customer_orders')
      .select(`
        *,
        delivery_orders(*),
        new_profiles!customer_orders_profile_id_fkey(full_name, phone_number),
        delivery_boys!delivery_orders_delivery_boy_id_fkey(id, full_name, phone_number)
      `);
    
    // تطبيق التصفية على الاستعلام
    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.date_range) {
        query = query.gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end);
      }
      
      if (filters.customer_id) {
        query = query.eq('profile_id', filters.customer_id);
      }
      
      if (filters.delivery_boy_id) {
        query = query.eq('delivery_orders.delivery_boy_id', filters.delivery_boy_id);
      }
    }
    
    // ترتيب النتائج
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
    
    return data?.map(order => orderConverter.fromDB(order)) || [];
  },
  
  /**
   * جلب طلب واحد بواسطة المعرف
   */
  getById: async (id: string): Promise<Order> => {
    const { data, error } = await supabase
      .from('customer_orders')
      .select(`
        *,
        delivery_orders(*),
        new_profiles!customer_orders_profile_id_fkey(full_name, phone_number),
        delivery_boys!delivery_orders_delivery_boy_id_fkey(id, full_name, phone_number),
        invoice_details(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching order ${id}:`, error);
      throw error;
    }
    
    return orderConverter.fromDB(data);
  },
  
  /**
   * جلب تاريخ حالة الطلب
   */
  getOrderStatusHistory: async (orderId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('delivery_status_history')
      .select('*')
      .eq('delivery_order_id', orderId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error(`Error fetching order status history:`, error);
      throw error;
    }
    
    return data || [];
  },
  
  /**
   * جلب نقاط تتبع الطلب
   */
  getOrderTrackingPoints: async (orderId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('order_tracking')
      .select('*')
      .eq('order_id', orderId)
      .order('timestamp', { ascending: true });
    
    if (error) {
      console.error(`Error fetching order tracking points:`, error);
      throw error;
    }
    
    return data || [];
  },
  
  /**
   * تحديث حالة الطلب
   */
  updateOrderStatus: async (orderId: string, status: string, notes?: string): Promise<void> => {
    // تحديث في جدول customer_orders
    const { error: customerOrderError } = await supabase
      .from('customer_orders')
      .update({ status })
      .eq('id', orderId);
    
    if (customerOrderError) {
      console.error(`Error updating customer order status:`, customerOrderError);
      throw customerOrderError;
    }
    
    // تحديث في جدول delivery_orders
    const { error: deliveryOrderError } = await supabase
      .from('delivery_orders')
      .update({ status })
      .eq('customer_order_id', orderId);
    
    if (deliveryOrderError) {
      console.error(`Error updating delivery order status:`, deliveryOrderError);
      throw deliveryOrderError;
    }
    
    // إضافة سجل في تاريخ الحالة
    const deliveryOrderData = await supabase
      .from('delivery_orders')
      .select('id')
      .eq('customer_order_id', orderId)
      .single();
    
    if (deliveryOrderData.error) {
      console.error(`Error fetching delivery order id:`, deliveryOrderData.error);
      throw deliveryOrderData.error;
    }
    
    const { error: historyError } = await supabase
      .from('delivery_status_history')
      .insert({
        delivery_order_id: deliveryOrderData.data.id,
        status,
        notes
      });
    
    if (historyError) {
      console.error(`Error inserting status history:`, historyError);
      throw historyError;
    }
  },
  
  /**
   * تخصيص الطلب لمندوب
   */
  assignOrderToAgent: async (orderId: string, agentId: string): Promise<void> => {
    const { error } = await supabase
      .from('delivery_orders')
      .update({ delivery_boy_id: agentId, status: 'assigned' })
      .eq('customer_order_id', orderId);
    
    if (error) {
      console.error(`Error assigning order to agent:`, error);
      throw error;
    }
    
    // تحديث حالة الطلب في customer_orders
    await orderRepository.updateOrderStatus(orderId, 'assigned', `Assigned to agent ${agentId}`);
  }
};
```

##### 1.2.2 تنفيذ مستودع المندوبين

```typescript
// src/lib/database/repositories/agentRepository.ts

import { supabase } from '@/lib/supabase';
import { Agent, AgentFilter } from '@/lib/database/types';
import { agentConverter } from '@/lib/database/converters';

export const agentRepository = {
  /**
   * جلب جميع المندوبين مع إمكانية التصفية
   */
  getAll: async (filters?: AgentFilter): Promise<Agent[]> => {
    let query = supabase
      .from('delivery_boys')
      .select(`
        *,
        delivery_documents(*)
      `);
    
    // تطبيق التصفية على الاستعلام
    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.online_status) {
        query = query.eq('online_status', filters.online_status);
      }
      
      if (filters.is_available !== undefined) {
        query = query.eq('is_available', filters.is_available);
      }
      
      if (filters.vehicle_type) {
        query = query.eq('preferred_vehicle', filters.vehicle_type);
      }
    }
    
    // ترتيب النتائج
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
    
    return data?.map(agent => agentConverter.fromDB(agent)) || [];
  },
  
  /**
   * جلب مندوب واحد بواسطة المعرف
   */
  getById: async (id: string): Promise<Agent> => {
    const { data, error } = await supabase
      .from('delivery_boys')
      .select(`
        *,
        delivery_documents(*),
        delivery_zones(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching agent ${id}:`, error);
      throw error;
    }
    
    return agentConverter.fromDB(data);
  },
  
  /**
   * جلب طلبات المندوب
   */
  getAgentOrders: async (agentId: string, status?: string): Promise<any[]> => {
    let query = supabase
      .from('delivery_orders')
      .select(`
        *,
        customer_orders(*)
      `)
      .eq('delivery_boy_id', agentId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error fetching agent orders:`, error);
      throw error;
    }
    
    return data || [];
  },
  
  /**
   * جلب إحصائيات أداء المندوب
   */
  getAgentPerformance: async (agentId: string): Promise<any> => {
    // إحصائيات يومية
    const { data: dailyStats, error: dailyError } = await supabase
      .from('delivery_boy_daily_performance')
      .select('*')
      .eq('delivery_boy_id', agentId)
      .order('date', { ascending: false })
      .limit(30);
    
    if (dailyError) {
      console.error(`Error fetching agent daily stats:`, dailyError);
      throw dailyError;
    }
    
    // إحصائيات شهرية
    const { data: monthlyStats, error: monthlyError } = await supabase
      .from('delivery_performance_stats')
      .select('*')
      .eq('delivery_boy_id', agentId)
      .order('month', { ascending: false })
      .limit(12);
    
    if (monthlyError) {
      console.error(`Error fetching agent monthly stats:`, monthlyError);
      throw monthlyError;
    }
    
    return {
      daily: dailyStats || [],
      monthly: monthlyStats || []
    };
  },
  
  /**
   * جلب المندوبين المتاحين في منطقة معينة
   */
  getAvailableAgentsInArea: async (latitude: number, longitude: number, radius: number = 5): Promise<Agent[]> => {
    // استخدام دالة PostgreSQL لحساب المسافة
    const { data, error } = await supabase.rpc('find_nearby_delivery_boys', {
      lat: latitude,
      lng: longitude,
      radius_km: radius
    });
    
    if (error) {
      console.error(`Error fetching nearby agents:`, error);
      throw error;
    }
    
    return data?.map(agent => agentConverter.fromDB(agent)) || [];
  },
  
  /**
   * تحديث حالة المندوب
   */
  updateAgentStatus: async (agentId: string, status: string): Promise<void> => {
    const { error } = await supabase
      .from('delivery_boys')
      .update({ status })
      .eq('id', agentId);
    
    if (error) {
      console.error(`Error updating agent status:`, error);
      throw error;
    }
  },
  
  /**
   * تحديث حالة توفر المندوب
   */
  updateAgentAvailability: async (agentId: string, isAvailable: boolean): Promise<void> => {
    const { error } = await supabase
      .from('delivery_boys')
      .update({ 
        is_available: isAvailable,
        online_status: isAvailable ? 'online' : 'offline'
      })
      .eq('id', agentId);
    
    if (error) {
      console.error(`Error updating agent availability:`, error);
      throw error;
    }
  }
};
```

##### 1.2.3 تنفيذ مستودع العملاء

```typescript
// src/lib/database/repositories/customerRepository.ts

import { supabase } from '@/lib/supabase';
import { Customer, CustomerFilter } from '@/lib/database/types';
import { customerConverter } from '@/lib/database/converters';

export const customerRepository = {
  /**
   * جلب جميع العملاء مع إمكانية التصفية
   */
  getAll: async (filters?: CustomerFilter): Promise<Customer[]> => {
    let query = supabase
      .from('customers')
      .select(`
        *,
        new_profiles(*)
      `);
    
    // تطبيق التصفية على الاستعلام
    if (filters) {
      if (filters.status) {
        query = query.eq('customer_status', filters.status);
      }
      
      if (filters.type) {
        query = query.eq('customer_type', filters.type);
      }
      
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
    }
    
    // ترتيب النتائج
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
    
    return data?.map(customer => customerConverter.fromDB(customer)) || [];
  },
  
  /**
   * جلب عميل واحد بواسطة المعرف
   */
  getById: async (id: string): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        new_profiles(*),
        customer_addresses(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching customer ${id}:`, error);
      throw error;
    }
    
    return customerConverter.fromDB(data);
  },
  
  /**
   * جلب طلبات العميل
   */
  getCustomerOrders: async (customerId: string, status?: string): Promise<any[]> => {
    let query = supabase
      .from('customer_orders')
      .select(`
        *,
        delivery_orders(*)
      `)
      .eq('profile_id', customerId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error fetching customer orders:`, error);
      throw error;
    }
    
    return data || [];
  },
  
  /**
   * جلب عناوين العميل
   */
  getCustomerAddresses: async (customerId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('profile_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Error fetching customer addresses:`, error);
      throw error;
    }
    
    return data || [];
  },
  
  /**
   * تحديث حالة العميل
   */
  updateCustomerStatus: async (customerId: string, status: string): Promise<void> => {
    const { error } = await supabase
      .from('customers')
      .update({ customer_status: status })
      .eq('id', customerId);
    
    if (error) {
      console.error(`Error updating customer status:`, error);
      throw error;
    }
  }
};
```

##### 1.2.4 تنفيذ مستودع جمع المخلفات

```typescript
// src/lib/database/repositories/wasteRepository.ts

import { supabase } from '@/lib/supabase';
import { WasteCategory, WasteCollection, WasteFilter } from '@/lib/database/types';
import { wasteCategoryConverter, wasteCollectionConverter } from '@/lib/database/converters';

export const wasteRepository = {
  /**
   * جلب جميع فئات المخلفات
   */
  getAllCategories: async (): Promise<WasteCategory[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        subcategories(*)
      `)
      .order('name');
    
    if (error) {
      console.error('Error fetching waste categories:', error);
      throw error;
    }
    
    return data?.map(category => wasteCategoryConverter.fromDB(category)) || [];
  },
  
  /**
   * جلب جميع جلسات جمع المخلفات مع إمكانية التصفية
   */
  getAllCollections: async (filters?: WasteFilter): Promise<WasteCollection[]> => {
    let query = supabase
      .from('waste_collection_sessions')
      .select(`
        *,
        waste_collection_items(*),
        waste_invoices(*),
        delivery_boys!waste_collection_sessions_delivery_boy_id_fkey(id, full_name, phone_number),
        customers!waste_collection_sessions_customer_id_fkey(id, full_name, phone_number)
      `);
    
    // تطبيق التصفية على الاستعلام
    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.date_range) {
        query = query.gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end);
      }
      
      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      
      if (filters.delivery_boy_id) {
        query = query.eq('delivery_boy_id', filters.delivery_boy_id);
      }
    }
    
    // ترتيب النتائج
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching waste collections:', error);
      throw error;
    }
    
    return data?.map(collection => wasteCollectionConverter.fromDB(collection)) || [];
  },
  
  /**
   * جلب جلسة جمع مخلفات واحدة بواسطة المعرف
   */
  getCollectionById: async (id: string): Promise<WasteCollection> => {
    const { data, error } = await supabase
      .from('waste_collection_sessions')
      .select(`
        *,
        waste_collection_items(*),
        waste_invoices(*),
        delivery_boys!waste_collection_sessions_delivery_boy_id_fkey(id, full_name, phone_number),
        customers!waste_collection_sessions_customer_id_fkey(id, full_name, phone_number)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching waste collection ${id}:`, error);
      throw error;
    }
    
    return wasteCollectionConverter.fromDB(data);
  },
  
  /**
   * جلب إحصائيات جمع المخلفات
   */
  getWasteStats: async (filters?: WasteFilter): Promise<any> => {
    // إجمالي الوزن حسب الفئة
    let categoryQuery = supabase.rpc('get_waste_by_category', {});
    
    if (filters?.date_range) {
      categoryQuery = supabase.rpc('get_waste_by_category_date_range', {
        start_date: filters.date_range.start,
        end_date: filters.date_range.end
      });
    }
    
    const { data: categoryData, error: categoryError } = await categoryQuery;
    
    if (categoryError) {
      console.error(`Error fetching waste by category:`, categoryError);
      throw categoryError;
    }
    
    // إجمالي الوزن حسب المنطقة
    let areaQuery = supabase.rpc('get_waste_by_area', {});
    
    if (filters?.date_range) {
      areaQuery = supabase.rpc('get_waste_by_area_date_range', {
        start_date: filters.date_range.start,
        end_date: filters.date_range.end
      });
    }
    
    const { data: areaData, error: areaError } = await areaQuery;
    
    if (areaError) {
      console.error(`Error fetching waste by area:`, areaError);
      throw areaError;
    }
    
    // المجموع الكلي
    let totalQuery = supabase.rpc('get_total_waste_collected', {});
    
    if (filters?.date_range) {
      totalQuery = supabase.rpc('get_total_waste_collected_date_range', {
        start_date: filters.date_range.start,
        end_date: filters.date_range.end
      });
    }
    
    const { data: totalData, error: totalError } = await totalQuery;
    
    if (totalError) {
      console.error(`Error fetching total waste:`, totalError);
      throw totalError;
    }
    
    return {
      by_category: categoryData || [],
      by_area: areaData || [],
      total: totalData?.[0]?.total || 0
    };
  }
};
```

##### 1.2.5 إنشاء محولات لتوحيد صيغة البيانات

```typescript
// src/lib/database/converters/orderConverter.ts

import { Order } from '@/lib/database/types';

export const orderConverter = {
  fromDB: (dbData: any): Order => {
    if (!dbData) return null;
    
    // استخراج بيانات الطلب الأساسية
    const order: Order = {
      id: dbData.id,
      orderNumber: dbData.delivery_orders?.[0]?.order_number || '',
      customerName: dbData.new_profiles?.full_name || '',
      customerPhone: dbData.new_profiles?.phone_number || '',
      status: dbData.status,
      paymentMethod: dbData.payment_method,
      priority: dbData.priority,
      pickupAddress: dbData.pickup_address,
      pickupLocation: {
        latitude: dbData.pickup_location?.coordinates?.[1] || 0,
        longitude: dbData.pickup_location?.coordinates?.[0] || 0
      },
      expectedTotal: parseFloat(dbData.expected_total) || 0,
      actualTotal: parseFloat(dbData.actual_total) || 0,
      categoryName: dbData.category_name || '',
      subcategoryName: dbData.subcategory_name || '',
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at,
      
      // بيانات التوصيل
      deliveryId: dbData.delivery_orders?.[0]?.id,
      deliveryBoyId: dbData.delivery_orders?.[0]?.delivery_boy_id,
      deliveryBoyName: dbData.delivery_boys?.full_name || '',
      deliveryPickupTime: dbData.delivery_orders?.[0]?.actual_pickup_time,
      deliveryTime: dbData.delivery_orders?.[0]?.actual_delivery_time,
      notes: dbData.delivery_orders?.[0]?.notes || '',
      
      // بيانات الفاتورة
      invoiceDetails: dbData.invoice_details || []
    };
    
    return order;
  },
  
  toDB: (order: Order): any => {
    // تحويل البيانات للصيغة المناسبة لقاعدة البيانات
    return {
      id: order.id,
      profile_id: order.customerId,
      payment_method: order.paymentMethod,
      priority: order.priority,
      pickup_address: order.pickupAddress,
      pickup_location: `POINT(${order.pickupLocation.longitude} ${order.pickupLocation.latitude})`,
      expected_total: order.expectedTotal,
      actual_total: order.actualTotal,
      status: order.status,
      category_name: order.categoryName,
      subcategory_name: order.subcategoryName
    };
  }
};

// تنفيذ محولات أخرى بنفس الطريقة...
```

#### 1.3 تنفيذ نقطة الدخول الرئيسية

```typescript
// src/lib/database/index.ts

import { orderRepository } from './repositories/orderRepository';
import { agentRepository } from './repositories/agentRepository';
import { customerRepository } from './repositories/customerRepository';
import { wasteRepository } from './repositories/wasteRepository';

export const database = {
  orders: orderRepository,
  agents: agentRepository,
  customers: customerRepository,
  waste: wasteRepository
};

export * from './types';
```

### المرحلة 2: تحديث واجهات API الحالية لاستخدام طبقة البيانات الجديدة

#### 2.1 تحديث واجهة API الطلبات

```typescript
// src/domains/orders/api/ordersApi.ts

import { database } from '@/lib/database';
import { Order, OrderFilter } from '@/lib/database/types';

export const ordersApi = {
  /**
   * جلب جميع الطلبات
   */
  getDeliveryOrders: async (filters?: OrderFilter): Promise<Order[]> => {
    try {
      return await database.orders.getAll(filters);
    } catch (error) {
      console.error('Error in ordersApi.getDeliveryOrders:', error);
      throw error;
    }
  },
  
  /**
   * جلب طلب واحد بواسطة المعرف
   */
  getOrderById: async (id: string): Promise<Order> => {
    try {
      return await database.orders.getById(id);
    } catch (error) {
      console.error(`Error in ordersApi.getOrderById(${id}):`, error);
      throw error;
    }
  },
  
  /**
   * جلب تاريخ حالة الطلب
   */
  getOrderStatusHistory: async (orderId: string): Promise<any[]> => {
    try {
      return await database.orders.getOrderStatusHistory(orderId);
    } catch (error) {
      console.error(`Error in ordersApi.getOrderStatusHistory:`, error);
      throw error;
    }
  },
  
  /**
   * جلب نقاط تتبع الطلب
   */
  getOrderTrackingPoints: async (orderId: string): Promise<any[]> => {
    try {
      return await database.orders.getOrderTrackingPoints(orderId);
    } catch (error) {
      console.error(`Error in ordersApi.getOrderTrackingPoints:`, error);
      throw error;
    }
  },
  
  /**
   * تحديث حالة الطلب
   */
  updateOrderStatus: async (orderId: string, status: string, notes?: string): Promise<void> => {
    try {
      await database.orders.updateOrderStatus(orderId, status, notes);
    } catch (error) {
      console.error(`Error in ordersApi.updateOrderStatus:`, error);
      throw error;
    }
  },
  
  /**
   * تخصيص الطلب لمندوب
   */
  assignOrderToAgent: async (orderId: string, agentId: string): Promise<void> => {
    try {
      await database.orders.assignOrderToAgent(orderId, agentId);
    } catch (error) {
      console.error(`Error in ordersApi.assignOrderToAgent:`, error);
      throw error;
    }
  }
};
```

#### 2.2 تحديث واجهة API المندوبين

```typescript
// src/domains/agents/api/agentsApi.ts

import { database } from '@/lib/database';
import { Agent, AgentFilter } from '@/lib/database/types';

export const agentsApi = {
  /**
   * جلب جميع المندوبين
   */
  getAgents: async (filters?: AgentFilter): Promise<Agent[]> => {
    try {
      return await database.agents.getAll(filters);
    } catch (error) {
      console.error('Error in agentsApi.getAgents:', error);
      throw error;
    }
  },
  
  /**
   * جلب مندوب واحد بواسطة المعرف
   */
  getAgentById: async (id: string): Promise<Agent> => {
    try {
      return await database.agents.getById(id);
    } catch (error) {
      console.error(`Error in agentsApi.getAgentById(${id}):`, error);
      throw error;
    }
  },
  
  /**
   * جلب طلبات المندوب
   */
  getAgentOrders: async (agentId: string, status?: string): Promise<any[]> => {
    try {
      return await database.agents.getAgentOrders(agentId, status);
    } catch (error) {
      console.error(`Error in agentsApi.getAgentOrders:`, error);
      throw error;
    }
  },
  
  /**
   * جلب إحصائيات أداء المندوب
   */
  getAgentPerformance: async (agentId: string): Promise<any> => {
    try {
      return await database.agents.getAgentPerformance(agentId);
    } catch (error) {
      console.error(`Error in agentsApi.getAgentPerformance:`, error);
      throw error;
    }
  },
  
  /**
   * جلب المندوبين المتاحين في منطقة معينة
   */
  getAvailableAgentsInArea: async (latitude: number, longitude: number, radius: number = 5): Promise<Agent[]> => {
    try {
      return await database.agents.getAvailableAgentsInArea(latitude, longitude, radius);
    } catch (error) {
      console.error(`Error in agentsApi.getAvailableAgentsInArea:`, error);
      throw error;
    }
  },
  
  /**
   * تحديث حالة المندوب
   */
  updateAgentStatus: async (agentId: string, status: string): Promise<void> => {
    try {
      await database.agents.updateAgentStatus(agentId, status);
    } catch (error) {
      console.error(`Error in agentsApi.updateAgentStatus:`, error);
      throw error;
    }
  },
  
  /**
   * تحديث حالة توفر المندوب
   */
  updateAgentAvailability: async (agentId: string, isAvailable: boolean): Promise<void> => {
    try {
      await database.agents.updateAgentAvailability(agentId, isAvailable);
    } catch (error) {
      console.error(`Error in agentsApi.updateAgentAvailability:`, error);
      throw error;
    }
  }
};
```

#### 2.3 تحديث واجهة API الخرائط

```typescript
// src/domains/mapping/api/mappingApi.ts

import { database } from '@/lib/database';
import { Agent } from '@/lib/database/types';

export const mappingApi = {
  /**
   * جلب نقاط تتبع الطلب
   */
  getTrackingPointsByOrderId: async (orderId: string): Promise<any[]> => {
    try {
      return await database.orders.getOrderTrackingPoints(orderId);
    } catch (error) {
      console.error(`Error in mappingApi.getTrackingPointsByOrderId:`, error);
      throw error;
    }
  },
  
  /**
   * جلب المندوبين النشطين مع مواقعهم
   */
  getActiveAgentsWithLocations: async (): Promise<Agent[]> => {
    try {
      const agents = await database.agents.getAll({ 
        online_status: 'online',
        is_available: true
      });
      
      return agents.filter(agent => 
        agent.currentLatitude !== null && 
        agent.currentLongitude !== null
      );
    } catch (error) {
      console.error(`Error in mappingApi.getActiveAgentsWithLocations:`, error);
      throw error;
    }
  },
  
  /**
   * جلب المندوبين في منطقة معينة
   */
  getAgentsInArea: async (latitude: number, longitude: number, radius: number = 5): Promise<Agent[]> => {
    try {
      return await database.agents.getAvailableAgentsInArea(latitude, longitude, radius);
    } catch (error) {
      console.error(`Error in mappingApi.getAgentsInArea:`, error);
      throw error;
    }
  },
  
  /**
   * جلب العناوين في منطقة معينة
   */
  getAddressesInArea: async (latitude: number, longitude: number, radius: number = 5): Promise<any[]> => {
    try {
      // استدعاء دالة PostgreSQL للبحث عن العناوين في منطقة معينة
      const { data, error } = await supabase.rpc('find_addresses_within_radius', {
        lat: latitude,
        lng: longitude,
        radius_km: radius
      });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error in mappingApi.getAddressesInArea:`, error);
      throw error;
    }
  }
};
```

### المرحلة 3: إنشاء واجهات API جديدة للنطاقات غير المحولة

#### 3.1 إنشاء واجهة API العملاء

```typescript
// src/domains/customers/api/customersApi.ts

import { database } from '@/lib/database';
import { Customer, CustomerFilter } from '@/lib/database/types';

export const customersApi = {
  /**
   * جلب جميع العملاء
   */
  getCustomers: async (filters?: CustomerFilter): Promise<Customer[]> => {
    try {
      return await database.customers.getAll(filters);
    } catch (error) {
      console.error('Error in customersApi.getCustomers:', error);
      throw error;
    }
  },
  
  /**
   * جلب عميل واحد بواسطة المعرف
   */
  getCustomerById: async (id: string): Promise<Customer> => {
    try {
      return await database.customers.getById(id);
    } catch (error) {
      console.error(`Error in customersApi.getCustomerById(${id}):`, error);
      throw error;
    }
  },
  
  /**
   * جلب طلبات العميل
   */
  getCustomerOrders: async (customerId: string, status?: string): Promise<any[]> => {
    try {
      return await database.customers.getCustomerOrders(customerId, status);
    } catch (error) {
      console.error(`Error in customersApi.getCustomerOrders:`, error);
      throw error;
    }
  },
  
  /**
   * جلب عناوين العميل
   */
  getCustomerAddresses: async (customerId: string): Promise<any[]> => {
    try {
      return await database.customers.getCustomerAddresses(customerId);
    } catch (error) {
      console.error(`Error in customersApi.getCustomerAddresses:`, error);
      throw error;
    }
  },
  
  /**
   * تحديث حالة العميل
   */
  updateCustomerStatus: async (customerId: string, status: string): Promise<void> => {
    try {
      await database.customers.updateCustomerStatus(customerId, status);
    } catch (error) {
      console.error(`Error in customersApi.updateCustomerStatus:`, error);
      throw error;
    }
  }
};
```

#### 3.2 إنشاء واجهة API جمع المخلفات

```typescript
// src/domains/waste/api/wasteApi.ts

import { database } from '@/lib/database';
import { WasteCategory, WasteCollection, WasteFilter } from '@/lib/database/types';

export const wasteApi = {
  /**
   * جلب جميع فئات المخلفات
   */
  getCategories: async (): Promise<WasteCategory[]> => {
    try {
      return await database.waste.getAllCategories();
    } catch (error) {
      console.error('Error in wasteApi.getCategories:', error);
      throw error;
    }
  },
  
  /**
   * جلب جميع جلسات جمع المخلفات
   */
  getCollections: async (filters?: WasteFilter): Promise<WasteCollection[]> => {
    try {
      return await database.waste.getAllCollections(filters);
    } catch (error) {
      console.error('Error in wasteApi.getCollections:', error);
      throw error;
    }
  },
  
  /**
   * جلب جلسة جمع مخلفات واحدة بواسطة المعرف
   */
  getCollectionById: async (id: string): Promise<WasteCollection> => {
    try {
      return await database.waste.getCollectionById(id);
    } catch (error) {
      console.error(`Error in wasteApi.getCollectionById(${id}):`, error);
      throw error;
    }
  },
  
  /**
   * جلب إحصائيات جمع المخلفات
   */
  getWasteStats: async (filters?: WasteFilter): Promise<any> => {
    try {
      return await database.waste.getWasteStats(filters);
    } catch (error) {
      console.error('Error in wasteApi.getWasteStats:', error);
      throw error;
    }
  }
};
```

### المرحلة 4: إنشاء شرائح Redux للنطاقات الجديدة

#### 4.1 إنشاء شريحة العملاء

```typescript
// src/domains/customers/store/customersSlice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { customersApi } from '../api/customersApi';
import { Customer, CustomerFilter } from '@/lib/database/types';

// Async Thunks
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (filters?: CustomerFilter) => {
    return await customersApi.getCustomers(filters);
  }
);

export const fetchCustomerById = createAsyncThunk(
  'customers/fetchCustomerById',
  async (id: string) => {
    return await customersApi.getCustomerById(id);
  }
);

export const fetchCustomerOrders = createAsyncThunk(
  'customers/fetchCustomerOrders',
  async ({ id, status }: { id: string, status?: string }) => {
    return await customersApi.getCustomerOrders(id, status);
  }
);

export const fetchCustomerAddresses = createAsyncThunk(
  'customers/fetchCustomerAddresses',
  async (id: string) => {
    return await customersApi.getCustomerAddresses(id);
  }
);

export const updateCustomerStatus = createAsyncThunk(
  'customers/updateCustomerStatus',
  async ({ id, status }: { id: string, status: string }) => {
    await customersApi.updateCustomerStatus(id, status);
    return { id, status };
  }
);

// Slice
interface CustomersState {
  items: Customer[];
  selectedCustomer: Customer | null;
  customerOrders: any[];
  customerAddresses: any[];
  loading: boolean;
  error: string | null;
}

const initialState: CustomersState = {
  items: [],
  selectedCustomer: null,
  customerOrders: [],
  customerAddresses: [],
  loading: false,
  error: null
};

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    resetCustomerState: (state) => {
      state.selectedCustomer = null;
      state.customerOrders = [];
      state.customerAddresses = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchCustomers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'حدث خطأ أثناء جلب العملاء';
      })
      
      // fetchCustomerById
      .addCase(fetchCustomerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCustomer = action.payload;
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'حدث خطأ أثناء جلب بيانات العميل';
      })
      
      // fetchCustomerOrders
      .addCase(fetchCustomerOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.customerOrders = action.payload;
      })
      .addCase(fetchCustomerOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'حدث خطأ أثناء جلب طلبات العميل';
      })
      
      // fetchCustomerAddresses
      .addCase(fetchCustomerAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.customerAddresses = action.payload;
      })
      .addCase(fetchCustomerAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'حدث خطأ أثناء جلب عناوين العميل';
      })
      
      // updateCustomerStatus
      .addCase(updateCustomerStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomerStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (state.selectedCustomer && state.selectedCustomer.id === action.payload.id) {
          state.selectedCustomer.status = action.payload.status;
        }
        state.items = state.items.map(customer => 
          customer.id === action.payload.id 
            ? { ...customer, status: action.payload.status } 
            : customer
        );
      })
      .addCase(updateCustomerStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'حدث خطأ أثناء تحديث حالة العميل';
      });
  }
});

export const { resetCustomerState } = customersSlice.actions;
export default customersSlice.reducer;
```

#### 4.2 إنشاء شريحة جمع المخلفات

```typescript
// src/domains/waste/store/wasteSlice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { wasteApi } from '../api/wasteApi';
import { WasteCategory, WasteCollection, WasteFilter } from '@/lib/database/types';

// Async Thunks
export const fetchCategories = createAsyncThunk(
  'waste/fetchCategories',
  async () => {
    return await wasteApi.getCategories();
  }
);

export const fetchCollections = createAsyncThunk(
  'waste/fetchCollections',
  async (filters?: WasteFilter) => {
    return await wasteApi.getCollections(filters);
  }
);

export const fetchCollectionById = createAsyncThunk(
  'waste/fetchCollectionById',
  async (id: string) => {
    return await wasteApi.getCollectionById(id);
  }
);

export const fetchWasteStats = createAsyncThunk(
  'waste/fetchWasteStats',
  async (filters?: WasteFilter) => {
    return await wasteApi.getWasteStats(filters);
  }
);

// Slice
interface WasteState {
  categories: WasteCategory[];
  collections: WasteCollection[];
  selectedCollection: WasteCollection | null;
  stats: any;
  loading: boolean;
  error: string | null;
}

const initialState: WasteState = {
  categories: [],
  collections: [],
  selectedCollection: null,
  stats: null,
  loading: false,
  error: null
};

const wasteSlice = createSlice({
  name: 'waste',
  initialState,
  reducers: {
    resetWasteState: (state) => {
      state.selectedCollection = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchCategories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'حدث خطأ أثناء جلب فئات المخلفات';
      })
      
      // fetchCollections
      .addCase(fetchCollections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCollections.fulfilled, (state, action) => {
        state.loading = false;
        state.collections = action.payload;
      })
      .addCase(fetchCollections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'حدث خطأ أثناء جلب جلسات جمع المخلفات';
      })
      
      // fetchCollectionById
      .addCase(fetchCollectionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCollectionById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCollection = action.payload;
      })
      .addCase(fetchCollectionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'حدث خطأ أثناء جلب جلسة جمع المخلفات';
      })
      
      // fetchWasteStats
      .addCase(fetchWasteStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWasteStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchWasteStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'حدث خطأ أثناء جلب إحصائيات المخلفات';
      });
  }
});

export const { resetWasteState } = wasteSlice.actions;
export default wasteSlice.reducer;
```

### المرحلة 5: تحديث متجر Redux المركزي

```typescript
// src/store/index.ts

import { configureStore } from '@reduxjs/toolkit';
import ordersReducer from '@/domains/orders/store/ordersSlice';
import agentsReducer from '@/domains/agents/store/agentsSlice';
import mappingReducer from '@/domains/mapping/store/mappingSlice';
import customersReducer from '@/domains/customers/store/customersSlice';
import wasteReducer from '@/domains/waste/store/wasteSlice';
import settingsReducer from '@/domains/settings/store/settingsSlice';
import tripsReducer from '@/domains/trips/store/tripsSlice';
import analyticsReducer from '@/domains/analytics/store/analyticsSlice';
import messagesReducer from '@/domains/messages/store/messagesSlice';
import supportReducer from '@/domains/support/store/supportSlice';

export const store = configureStore({
  reducer: {
    // النطاقات المحولة بالكامل
    orders: ordersReducer,
    agents: agentsReducer,
    mapping: mappingReducer,
    
    // النطاقات الجديدة
    customers: customersReducer,
    waste: wasteReducer,
    
    // النطاقات قيد التحويل
    settings: settingsReducer,
    trips: tripsReducer,
    
    // النطاقات غير المحولة بعد
    analytics: analyticsReducer,
    messages: messagesReducer,
    support: supportReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## توصيات تنفيذية

### 1. ترتيب تنفيذ المهام

1. **إنشاء طبقة البيانات المشتركة**: البدء بتطوير مكتبة البيانات المشتركة وتحديد الأنواع والمحولات
2. **تحديث واجهات API الحالية**: تعديل النطاقات المحولة بالفعل لاستخدام طبقة البيانات الجديدة
3. **تطوير واجهات API جديدة**: إنشاء واجهات API للنطاقات التي لم تُحول بعد
4. **إنشاء شرائح Redux جديدة**: تطوير شرائح Redux للنطاقات الجديدة
5. **تكامل الواجهات المرئية**: تحديث المكونات المرئية لاستخدام البيانات من Redux

### 2. اعتبارات مهمة

1. **تجربة أولا ثم التكامل**: اختبار كل وظيفة جديدة في بيئة تطوير منفصلة قبل دمجها
2. **التحويل التدريجي**: البدء بنطاق واحد واختباره بشكل كامل قبل الانتقال للنطاق التالي
3. **توثيق التغييرات**: توثيق جميع التغييرات والتحسينات بشكل مستمر
4. **تغطية الاختبارات**: كتابة اختبارات وحدة لضمان عمل الواجهات الجديدة بشكل صحيح
5. **مراقبة الأداء**: مراقبة أداء الاستعلامات وتحسينها إذا لزم الأمر

### 3. نصائح لتسريع عملية التنفيذ

1. **استخدام أدوات توليد الكود**: استخدام أدوات مثل Plop.js لتوليد الملفات المتكررة
2. **تنفيذ نماذج أولية**: تطوير نماذج أولية سريعة للتأكد من صحة التصميم
3. **مراجعة الكود المستمرة**: مراجعة الكود بشكل مستمر لضمان الجودة والاتساق
4. **استخدام TypeScript بفعالية**: الاستفادة من ميزات TypeScript للكشف المبكر عن الأخطاء

## الخاتمة

هذه الخطة التنفيذية توفر إطاراً عملياً لربط واجهات API في لوحة التحكم بقواعد البيانات المشتركة لكل من تطبيق العميل وتطبيق مندوب التوصيل. من خلال اتباع هذه الخطة، يمكن تحقيق الأهداف التالية:

1. **توحيد الوصول للبيانات**: إنشاء طبقة وسيطة موحدة للتعامل مع قواعد البيانات المشتركة
2. **تبسيط التطوير المستقبلي**: تسهيل تطوير ميزات جديدة باستخدام البنية الجديدة
3. **تحسين الأداء**: تحسين أداء الاستعلامات وتقليل التكرار في الكود
4. **تعزيز القدرة على الصيانة**: تحسين قابلية الكود للصيانة وتقليل الأخطاء
5. **تحقيق التكامل الشامل**: توفير رؤية موحدة وشاملة لبيانات التطبيقين في لوحة التحكم

تنفيذ هذه الخطة سيسهم بشكل كبير في إنشاء لوحة تحكم متكاملة قادرة على إدارة ومراقبة كل من تطبيق العميل وتطبيق مندوب التوصيل بكفاءة وفعالية.