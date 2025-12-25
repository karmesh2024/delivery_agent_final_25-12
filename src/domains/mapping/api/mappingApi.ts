/**
 * Mapping and Tracking API
 * واجهة موحدة للتعامل مع خدمات الخرائط والتتبع
 * 
 * @version 1.0.0
 * @module domains/mapping/api
 */

import { supabase } from '@/lib/supabase';

// نقطة تتبع للمندوب
interface TrackingPoint {
  id?: string;
  order_id: string;
  delivery_boy_id: string;
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  altitude?: number;
  accuracy?: number;
  battery_level?: number;
}

// سجل نقاط التتبع مع تفاصيل إضافية
interface TrackingPointWithDetails extends TrackingPoint {
  order?: {
    id: string;
    order_number: string;
    status: string;
  };
  agent?: {
    id: string;
    name: string;
    phone: string;
    avatar_url?: string;
    status: string;
  };
}

// معلومات المندوب على الخريطة
interface MapAgent {
  id: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  status: string;
  location?: {
    lat: number;
    lng: number;
    timestamp?: string;
    speed?: number;
    heading?: number;
  };
}

// واجهة API للخرائط والتتبع
export const mappingApi = {
  // جلب نقاط التتبع لطلب محدد
  async getTrackingPointsByOrderId(orderId: string): Promise<TrackingPointWithDetails[]> {
    try {
      console.log(`جلب نقاط التتبع للطلب: ${orderId}`);
      
      if (!supabase) {
        console.error('عميل Supabase غير متاح. لا يمكن جلب نقاط التتبع للطلب.');
        return [];
      }
      
      const { data, error } = await supabase!
        .from('tracking_points_with_details')
        .select(`*`)
        .eq('order_id', orderId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error(`خطأ في جلب نقاط التتبع للطلب ${orderId}:`, error);
        return [];
      }

      console.log(`تم جلب نقاط التتبع من tracking_points_with_details: ${data?.length}`);
      return data || [];
    } catch (error) {
      console.error(`استثناء في جلب نقاط التتبع للطلب ${orderId}:`, error);
      return [];
    }
  },

  // جلب نقاط التتبع لمندوب محدد
  async getTrackingPointsByAgentId(agentId: string, limit: number = 100): Promise<TrackingPointWithDetails[]> {
    try {
      if (!supabase) {
        console.error('عميل Supabase غير متاح. لا يمكن جلب نقاط التتبع للمندوب.');
        return [];
      }
      
      const { data, error } = await supabase!
        .from('tracking_points_with_details')
        .select(`*`)
        .eq('delivery_boy_id', agentId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error(`خطأ في جلب نقاط التتبع للمندوب ${agentId}:`, error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error(`استثناء في جلب نقاط التتبع للمندوب ${agentId}:`, error);
      return [];
    }
  },

  // جلب أحدث نقطة تتبع لمندوب محدد
  async getLatestTrackingPointForAgent(agentId: string): Promise<TrackingPoint | null> {
    try {
      if (!supabase) {
        console.error('عميل Supabase غير متاح. لا يمكن جلب آخر نقطة تتبع للمندوب.');
        return null;
      }
      
      const { data, error } = await supabase!
        .from('tracking_points')
        .select(`*`)
        .eq('delivery_boy_id', agentId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error(`خطأ في جلب آخر نقطة تتبع للمندوب ${agentId}:`, error);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`استثناء في جلب آخر نقطة تتبع للمندوب ${agentId}:`, error);
      return null;
    }
  },

  // جلب المندوبين مع مواقعهم الحالية
  async getActiveAgentsWithLocations(): Promise<MapAgent[]> {
    try {
      if (!supabase) {
        console.error('عميل Supabase غير متاح. لا يمكن جلب المندوبين النشطين مع المواقع.');
        return [];
      }
      
      // استخدام view مخصص يجمع آخر موقع لكل مندوب
      const { data, error } = await supabase!
        .from('active_delivery_boys_with_locations')
        .select(`*`);

      if (error) {
        console.error("خطأ في جلب المندوبين النشطين مع المواقع:", error);
        return [];
      }

      // تحويل البيانات إلى الصيغة المطلوبة
      return data.map(agent => ({
        id: agent.id,
        name: agent.name,
        phone: agent.phone,
        avatar_url: agent.avatar_url,
        status: agent.status,
        location: agent.lat && agent.lng ? {
          lat: agent.lat,
          lng: agent.lng,
          timestamp: agent.location_timestamp,
          speed: agent.speed,
          heading: agent.heading
        } : undefined
      }));
    } catch (error) {
      console.error("استثناء في جلب المندوبين النشطين مع المواقع:", error);
      return [];
    }
  },

  // إضافة نقطة تتبع جديدة
  async addTrackingPoint(trackingPoint: TrackingPoint): Promise<{ success: boolean, id?: string, error?: string }> {
    try {
      if (!supabase) {
        console.error('عميل Supabase غير متاح. لا يمكن إضافة نقطة تتبع.');
        return { success: false, error: 'عميل Supabase غير متاح' };
      }
      
      const { data, error } = await supabase!
        .from('tracking_points')
        .insert([trackingPoint])
        .select();

      if (error) {
        console.error("خطأ في إضافة نقطة تتبع:", error);
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        id: data?.[0]?.id 
      };
    } catch (error) {
      console.error("استثناء في إضافة نقطة تتبع:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'خطأ غير معروف' 
      };
    }
  },

  // تحويل عنوان نصي إلى إحداثيات
  async geocodeAddress(address: string): Promise<{ lat: number, lng: number } | null> {
    try {
      // هذه الوظيفة تحتاج إلى استخدام خدمة خارجية مثل Google Maps Geocoding API
      // في بيئة الإنتاج، يجب استخدام خدمة على الخادم لتجنب كشف مفاتيح API

      // للأغراض التجريبية، نعيد إحداثيات ثابتة
      console.warn('وظيفة geocodeAddress غير مكتملة وتعيد إحداثيات ثابتة');
      
      // استخراج إحداثيات من العنوان باستخدام تعبير منتظم (لأغراض توضيحية فقط)
      const latLngRegex = /(\d+\.\d+),\s*(\d+\.\d+)/;
      const match = address.match(latLngRegex);
      
      if (match && match.length >= 3) {
        // إذا كان العنوان يحتوي على إحداثيات، استخرجها
        return {
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2])
        };
      }
      
      // لتنفيذ حقيقي، استخدم:
      // const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`);
      // const data = await response.json();
      // if (data.results && data.results.length > 0) {
      //   return {
      //     lat: data.results[0].geometry.location.lat,
      //     lng: data.results[0].geometry.location.lng
      //   };
      // }
      
      return null;
    } catch (error) {
      console.error("خطأ في تحويل العنوان إلى إحداثيات:", error);
      return null;
    }
  },

  // تحويل إحداثيات إلى عنوان نصي
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      // هذه الوظيفة تحتاج إلى استخدام خدمة خارجية مثل Google Maps Geocoding API
      // للأغراض التجريبية، نعيد عنوان ثابت
      console.warn('وظيفة reverseGeocode غير مكتملة وتعيد عنوان ثابت');
      
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      
      // لتنفيذ حقيقي، استخدم:
      // const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`);
      // const data = await response.json();
      // if (data.results && data.results.length > 0) {
      //   return data.results[0].formatted_address;
      // }
      
      // return null;
    } catch (error) {
      console.error("خطأ في تحويل الإحداثيات إلى عنوان:", error);
      return null;
    }
  },

  // حساب المسافة بين نقطتين (بالكيلومتر)
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * 
      Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng / 2) * 
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // المسافة بالكيلومتر
    return distance;
  },

  // تحويل الدرجات إلى راديان
  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
};

import { DeliveryOrder } from "@/types";
import { Trip } from "@/types";

/**
 * تحويل طلب التوصيل إلى رحلة (مهمة توصيل)
 * يحول كائن DeliveryOrder إلى نوع Trip المستخدم في واجهة المستخدم
 */
export const mapDeliveryOrderToTrip = (order: DeliveryOrder): Trip => {
  // استخراج إحداثيات الالتقاط
  let pickupLat = 0;
  let pickupLng = 0;
  // التحقق من نوع pickup_location واستخراج الإحداثيات
  if (order.pickup_location) {
    if (typeof order.pickup_location === 'object' && 'lat' in order.pickup_location && 'lng' in order.pickup_location) {
      pickupLat = order.pickup_location.lat;
      pickupLng = order.pickup_location.lng;
    }
  }

  // استخراج إحداثيات التسليم
  let deliveryLat = 0;
  let deliveryLng = 0;
  // التحقق من نوع delivery_location واستخراج الإحداثيات
  if (order.delivery_location) {
    if (typeof order.delivery_location === 'object' && 'lat' in order.delivery_location && 'lng' in order.delivery_location) {
      deliveryLat = order.delivery_location.lat;
      deliveryLng = order.delivery_location.lng;
    }
  }

  // وظيفة مساعدة لتحويل حالة الطلب إلى حالة الرحلة
  const convertOrderStatusToTripStatus = (orderStatus?: string): 'assigned' | 'in_progress' | 'completed' | 'canceled' => {
    switch(orderStatus) {
      case 'scheduled':
      case 'pending':
      case 'confirmed':
        return 'assigned';
      case 'pickedUp':
      case 'inReceipt':
      case 'in_progress':
        return 'in_progress';
      case 'completed':
      case 'delivered':
        return 'completed';
      case 'cancelled':
      case 'canceled':
      case 'returned':
        return 'canceled';
      default:
        return 'assigned'; // القيمة الافتراضية إذا كانت الحالة غير محددة أو غير معروفة
    }
  };

  return {
    id: order.id,
    agent_id: order.delivery_boy_id || '',
    status: convertOrderStatusToTripStatus(order.status),
    start_location: {
      lat: pickupLat,
      lng: pickupLng,
      address: order.pickup_address || 'موقع غير معروف'
    },
    end_location: {
      lat: deliveryLat,
      lng: deliveryLng,
      address: order.delivery_address || 'موقع غير معروف'
    },
    distance: order.estimated_distance || 0,
    duration: order.estimated_time || 0,
    created_at: order.created_at || new Date().toISOString(),
    updated_at: order.updated_at || new Date().toISOString(),
    cost: order.expected_total_amount || 0,
    customer_name: order.customer_name || '',
    customer_phone: order.customer_phone || ''
  };
};

export type { TrackingPoint, TrackingPointWithDetails, MapAgent };