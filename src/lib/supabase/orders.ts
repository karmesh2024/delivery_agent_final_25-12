import { supabase } from "./base";
import { Order, DeliveryOrder, OrderStats, Agent, GeoPoint } from "../../types";
import { apiLogger, logger } from "../logger-safe";

// وظيفة للحصول على إحصائيات الطلبات
export async function getOrderStats(): Promise<OrderStats> {
  const defaultStats: OrderStats = {
    avg_delivery_time: 0,
    pending: 0,
    total: 0,
    in_progress: 0,
    delivered: 0,
    canceled: 0,
    excellent_trips: 0,
  };

  if (!supabase) return defaultStats;

  try {
    const stats = { ...defaultStats };

    // جلب الإحصائيات الفردية
    const { count: total } = await supabase.from("delivery_orders").select("id", { count: "exact", head: true });
    const { count: pending } = await supabase.from("delivery_orders").select("id", { count: "exact", head: true }).eq("status", "pending");
    const { count: inReceipt } = await supabase.from("delivery_orders").select("id", { count: "exact", head: true }).eq("status", "inReceipt");
    const { count: completed } = await supabase.from("delivery_orders").select("id", { count: "exact", head: true }).eq("status", "completed");
    const { count: canceled1 } = await supabase.from("delivery_orders").select("id", { count: "exact", head: true }).eq("status", "canceled");
    const { count: canceled2 } = await supabase.from("delivery_orders").select("id", { count: "exact", head: true }).eq("status", "cancelled");

    stats.total = total || 0;
    stats.pending = pending || 0;
    stats.in_progress = inReceipt || 0;
    stats.delivered = completed || 0;
    stats.canceled = (canceled1 || 0) + (canceled2 || 0);

    return stats;
  } catch (error) {
    apiLogger.error("An unexpected error occurred in getOrderStats:", { error });
    return defaultStats;
  }
}

// وظائف متعلقة بالطلبات
export async function getOrders(status?: string): Promise<Order[]> {
  let query = supabase!
    .from("delivery_orders")
    .select(`
      *,
      delivery_boys!delivery_orders_delivery_boy_id_fkey(*)
    `)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", mapOrderStatusToDeliveryStatus(status));
  }

  const { data, error } = await query;

  if (error || !data) {
    apiLogger.error("خطأ في جلب بيانات الطلبات:", { error });
    return [];
  }

  const orderIds = data.map((order) => order.id);
  const { data: orderDetailsData } = await supabase!
    .from("order_details")
    .select("*")
    .in("delivery_order_id", orderIds);

  const orderDetailsMap: Record<string, any[]> = {};
  if (orderDetailsData) {
    orderDetailsData.forEach((detail) => {
      if (detail.delivery_order_id) {
        if (!orderDetailsMap[detail.delivery_order_id]) orderDetailsMap[detail.delivery_order_id] = [];
        orderDetailsMap[detail.delivery_order_id].push(detail);
      }
    });
  }

  return data.map((order) => {
    const deliveryBoy = order.delivery_boys;
    const orderDetails = orderDetailsMap[order.id] || [];

    return {
      id: order.id,
      status: mapDeliveryStatusToOrderStatus(order.status),
      created_at: order.created_at || new Date().toISOString(),
      updated_at: order.updated_at || new Date().toISOString(),
      customer_name: order.customer_name || "",
      customer_address: order.pickup_address,
      customer_phone: order.customer_phone || "",
      items: orderDetails.map((detail) => ({
        id: detail.id,
        name: detail.product_name,
        quantity: detail.quantity,
        price: detail.price,
      })),
      total: order.expected_total_amount || 0,
      agent_id: order.delivery_boy_id,
      agent: deliveryBoy ? {
        id: deliveryBoy.id,
        name: deliveryBoy.full_name,
        status: deliveryBoy.online_status || (deliveryBoy.is_available ? "online" : "offline"),
        avatar_url: deliveryBoy.profile_image_url || "",
        rating: deliveryBoy.rating,
      } : undefined,
      delivery_time: order.estimated_time,
    } as Order;
  });
}

// تحويل حالة الطلب من نظام التوصيل للمدير
export function mapDeliveryStatusToOrderStatus(status: string | null): any {
  if (!status) return "pending";
  switch (status.toLowerCase()) {
    case "pending": return "pending";
    case "confirmed": return "confirmed";
    case "scheduled":
    case "assigned": return "pending";
    case "pickedup":
    case "inreceipt":
    case "in_progress": return "in_progress";
    case "completed":
    case "delivered": return "delivered";
    case "cancelled":
    case "canceled": return "canceled";
    default: return "pending";
  }
}

export function mapOrderStatusToDeliveryStatus(status: string): string {
  switch (status) {
    case "pending": return "pending";
    case "in_progress": return "in_progress";
    case "delivered": return "completed";
    case "canceled": return "canceled";
    default: return "pending";
  }
}

export async function getWasteCollectionSessions() {
  const { data, error } = await supabase!
    .from("waste_collection_sessions")
    .select(`*, delivery_orders(*), delivery_boys(*)`)
    .order("created_at", { ascending: false });

  if (error) {
    apiLogger.error("خطأ في جلب بيانات جلسات جمع النفايات:", error);
    return [];
  }
  return data || [];
}

export async function getOrderTracking(orderId: string) {
  const { data, error } = await supabase!
    .from("order_tracking")
    .select("*")
    .eq("order_id", orderId)
    .order("timestamp", { ascending: true });

  if (error) return [];
  return data || [];
}

export async function getOrderDetails(orderId: string): Promise<DeliveryOrder | null> {
  const { data, error } = await supabase!
    .from("delivery_orders")
    .select(`*, delivery_boys(*)`)
    .eq("id", orderId)
    .single();

  if (error) return null;
  return data;
}
