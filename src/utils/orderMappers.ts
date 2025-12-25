import { DeliveryOrder, Order, OrderItem, OrderStatus } from "@/types";

/**
 * تحويل كائن DeliveryOrder من قاعدة البيانات إلى كائن Order
 * للاستخدام في واجهة المستخدم
 *
 * @param deliveryOrder كائن الطلب من قاعدة البيانات
 * @returns كائن طلب محول للواجهة
 */
export function mapDeliveryOrderToOrder(deliveryOrder: DeliveryOrder): Order {
  // تحويل حالة الطلب من نظام التوصيل إلى حالات نظام الإدارة
  function mapDeliveryStatusToOrderStatus(
    status: string | undefined,
  ): OrderStatus {
    if (!status) return "pending";

    switch (status.toLowerCase()) {
      case "pending":
        return "pending";
      case "confirmed":
        return "confirmed";
      case "assigned":
        return "assigned";
      case "in_progress":
        return "in_progress";
      case "completed":
      case "delivered":
        return "delivered";
      case "cancelled":
      case "canceled":
        return "canceled";
      default:
        return "pending";
    }
  }

  // إنشاء كائن Order مع تعيين الخصائص المطلوبة
  const order: Order = {
    id: deliveryOrder.id,
    status: mapDeliveryStatusToOrderStatus(deliveryOrder.status),
    created_at: deliveryOrder.created_at,
    updated_at: deliveryOrder.updated_at,
    customer_name: deliveryOrder.customer_name || "العميل",
    customer_address: deliveryOrder.pickup_address || "",
    customer_phone: deliveryOrder.customer_phone || "",
    order_details: deliveryOrder.order_details || null,
    total_amount: deliveryOrder.expected_total_amount || 0,
    agent_id: deliveryOrder.delivery_boy_id
      ? deliveryOrder.delivery_boy_id
      : null,
    delivery_time: deliveryOrder.estimated_time,
    delivery_location: deliveryOrder.delivery_location,
    delivery_address: deliveryOrder.delivery_address || "",
    pickup_address: deliveryOrder.pickup_address || "",
    rating: 0,
  };

  // console.log("Mapped Order:", JSON.stringify(order, null, 2)); // Optional: Log mapped object

  return order;
}

/**
 * تحويل كائن Order من واجهة المستخدم إلى كائن DeliveryOrder
 * لحفظه في قاعدة البيانات
 *
 * @param order كائن الطلب من واجهة المستخدم
 * @returns كائن طلب محول لقاعدة البيانات
 */
export function mapOrderToDeliveryOrder(order: Order): DeliveryOrder {
  // تحويل حالة الطلب من نظام الإدارة إلى حالات نظام التوصيل
  function mapOrderStatusToDeliveryStatus(status: string): string {
    switch (status) {
      case "pending":
        return "pending";
      case "confirmed":
        return "confirmed";
      case "in_progress":
        return "in_progress";
      case "delivered":
        return "delivered";
      case "canceled":
        return "canceled";
      default:
        return "pending";
    }
  }

  // إنشاء كائن DeliveryOrder مع القيم المطلوبة فقط
  const deliveryOrder: DeliveryOrder = {
    id: order.id,
    order_number: order.id.substring(0, 8).toUpperCase(), // إنشاء رقم طلب من المعرف
    status: mapOrderStatusToDeliveryStatus(order.status),
    created_at: order.created_at,
    updated_at: order.updated_at,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone ?? "",
    pickup_location: "", // قيمة افتراضية مطلوبة
    pickup_address: order.pickup_address ?? "",
    delivery_address: order.delivery_address ?? "",
    expected_total_amount: order.total_amount ?? undefined,
    order_details: order.order_details ?? undefined,
    delivery_location: order.delivery_location ?? "",
    delivery_boy_id: order.agent_id ?? undefined,
    estimated_time: order.delivery_time ?? undefined,
  };

  // إذا كان وقت التسليم محدداً، أضفه
  if (order.delivery_time) {
    deliveryOrder.estimated_time = order.delivery_time;
  }

  return deliveryOrder;
}

/**
 * وظيفة مساعدة للتحقق من وجود خاصية rating في كائن Order
 * هذه الوظيفة تستخدم لفلترة الطلبات حسب التقييم
 *
 * @param order كائن الطلب للفحص
 * @returns قيمة التقييم أو 0 إذا لم تكن موجودة
 */
export function getOrderRating(order: Order): number {
  return order.rating || 0;
}
