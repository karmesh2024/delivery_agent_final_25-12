import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import {
  Agent,
  AgentStatus,
  DeliveryBoy,
  DeliveryOrder,
  GeoPoint,
  Order,
  OrderStats,
  Trip,
} from "../types";
import { v4 as uuidv4 } from "uuid";
import { add } from "date-fns";
import {
  GeographicZone,
  GeographicZoneFormData,
  GeoJSONPoint,
  GeoJSONPolygon,
} from "../domains/settings/types";
import { apiLogger, cleanForLog, logger } from "./logger-safe";

// تعريف نوع Database البسيط
type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
};

// تعريف أنواع GeoJSON للتعامل مع البيانات الجغرافية
// interface GeoJSONPosition { // Removed duplicate definition
//   type: string;
//   coordinates: number[];
// }

// interface GeoJSONPoint { // Removed duplicate definition
//   type: "Point";
//   coordinates: [number, number]; // [longitude, latitude]
// }

// interface GeoJSONPolygon { // Removed duplicate definition
//   type: "Polygon";
//   coordinates: number[][][]; // Array of linear rings (first is outer, rest are holes)
// }

// تعريف نوع البيانات لمندوب التوصيل

// تهيئة عميل Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ إصلاح أمني: إزالة طباعة معلومات حساسة
// console.log('معلومات اتصال Supabase:');
// console.log('URL:', supabaseUrl ? 'موجود' : 'غير موجود');
// console.log('ANON_KEY:', supabaseAnonKey ? 'موجود' : 'غير موجود');

// التحقق من وجود بيانات الاعتماد لإنشاء عميل حقيقي
// const hasCredentials = supabaseUrl !== '' && supabaseAnonKey !== ''; // No longer needed as we use non-null assertion operator
// console.log('hasCredentials (صحيح/خطأ):', hasCredentials);

let supabaseInstance: SupabaseClient<Database> | null = null;

// Check if credentials are provided. If not, createBrowserClient will throw an error.
// It's better to let it throw than to initialize with empty strings.
if (supabaseUrl && supabaseAnonKey) {
  // استخدم createBrowserClient لتهيئة العميل الذي سيتعامل مع الكوكيز تلقائياً
  supabaseInstance = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
  );
} else {
  logger.error("Supabase URL or Anon Key not found. Client not initialized.");
}

export const supabase = supabaseInstance;

// ✅ إصلاح أمني: آمن لتهيئة Service Role
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
let supabaseServiceRoleInstance: SupabaseClient<Database> | null = null;

// Check if running in a server environment
const isServer = typeof window === "undefined";

if (isServer) {
  // Server-side: Service Role Key SHOULD be available
  if (supabaseUrl && supabaseServiceRoleKey) {
    supabaseServiceRoleInstance = createClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey,
    );
    // ✅ إصلاح أمني: إزالة الطباعة
    // console.log('Supabase service role client initialized (server).');
  } else {
    // ✅ إصلاح أمني: تقليل تفاصيل الخطأ
    logger.error("Service role client initialization failed");
  }
} else {
  // Client-side: Service Role Key should NOT be available.
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    // ✅ إصلاح أمني: إزالة التحذير المفصل
    logger.error("Security violation: Service role key exposed to client");
  }
}

export const supabaseServiceRole = supabaseServiceRoleInstance;

// دالة لإنشاء كلمة مرور عشوائية
function generateRandomPassword(): string {
  const length = 16;
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}

// دالة لإنشاء بريد إلكتروني مؤقت
function generateTemporaryEmail(name: string, phone: string): string {
  // تنظيف الاسم وإزالة المسافات والأحرف الخاصة
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/gi, "");
  // استخدام اسم النطاق مؤقت
  return `${cleanName}.${phone.replace(/[^0-9]/g, "")}@delivery-temp.com`;
}

// وظائف متعلقة بمندوبي التوصيل
export async function getAgents(): Promise<Agent[]> {
  // استخدام جدول delivery_boys بدلاً من agents
  const { data, error } = await supabase!
    .from("delivery_boys")
    .select(
      "id, full_name, online_status, is_available, status, profile_image_url, rating, total_deliveries, phone, last_location_update, updated_at, current_latitude, current_longitude, preferred_vehicle, badge_level, delivery_code, delivery_code_status, referral_code",
    )
    .order("full_name");

  // ✅ إصلاح إنتاجي: إزالة console.log المفرط
  if (error) {
    // console.error('خطأ في جلب بيانات المندوبين:', error);  // إزالة للـ production
    return [];
  }

  // تحويل بيانات delivery_boys إلى نموذج Agent مع مراعاة هيكل البيانات الفعلي
  return data.map((deliveryBoy) => {
    // استخدام حقل online_status مباشرة، مع التوافق الخلفي
    let agentStatus: "online" | "offline" | "busy" =
      deliveryBoy.online_status || "offline";

    // فقط للتوافق الخلفي إذا لم يكن حقل online_status موجوداً
    if (!deliveryBoy.online_status && deliveryBoy.is_available) {
      agentStatus = deliveryBoy.status === "active" ? "online" : "offline";
    }

    return {
      id: deliveryBoy.id,
      name: deliveryBoy.full_name,
      status: agentStatus,
      avatar_url: deliveryBoy.profile_image_url || "", // استخدام صورة الملف الشخصي إن وجدت
      rating: parseFloat(deliveryBoy.rating) || 0,
      total_deliveries: deliveryBoy.total_deliveries || 0,
      phone: deliveryBoy.phone,
      last_active: deliveryBoy.last_location_update || deliveryBoy.updated_at,
      location: deliveryBoy.current_latitude && deliveryBoy.current_longitude
        ? {
          lat: parseFloat(deliveryBoy.current_latitude),
          lng: parseFloat(deliveryBoy.current_longitude),
        }
        : undefined,
      preferred_vehicle: deliveryBoy.preferred_vehicle,
      badge_level: deliveryBoy.badge_level || 0,
      current_trip_id: null, // سيتم تحديثه بناءً على الطلبات النشطة
      // إضافة المزيد من المعلومات من البيانات الفعلية
      delivery_code: deliveryBoy.delivery_code,
      delivery_code_status: deliveryBoy.delivery_code_status,
      referral_code: deliveryBoy.referral_code,
    };
  });
}

export async function getDeliveryBoys() {
  try {
    const { data, error } = await supabase!
      .from("delivery_boys")
      .select(
        "id, full_name, online_status, is_available, status, profile_image_url, rating, total_deliveries, phone, email, current_latitude, current_longitude, last_location_update, created_at, updated_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      apiLogger.error("خطأ في جلب بيانات مندوبي التوصيل:", { error });
      return [];
    }

    // تحقق من نجاح جلب البيانات
    logger.debug(`تم جلب ${data?.length || 0} مندوب من قاعدة البيانات`);

    return data || [];
  } catch (e) {
    console.error("استثناء أثناء جلب بيانات المندوبين:", e);
    return [];
  }
}

export async function getAgentTrips(): Promise<Trip[]> {
  // استخدام delivery_orders للحصول على بيانات الرحلات
  const { data, error } = await supabase!
    .from("delivery_orders")
    .select(`
      *,
      delivery_boys!delivery_orders_delivery_boy_id_fkey(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    apiLogger.error("خطأ في جلب بيانات الرحلات:", { error });
    return [];
  }

  // تحويل delivery_orders إلى نموذج Trip
  return data.map((order) => {
    const deliveryBoy = order.delivery_boys;

    return {
      id: order.id,
      agent_id: order.delivery_boy_id || "",
      status: mapDeliveryStatusToTripStatus(order.status),
      start_location: {
        lat: 0, // يمكن استخراج هذه البيانات من pickup_location
        lng: 0,
        address: order.pickup_address,
      },
      end_location: {
        lat: 0, // يمكن استخراج هذه البيانات من delivery_location
        lng: 0,
        address: order.delivery_address,
      },
      distance: order.estimated_distance || 0,
      duration: order.estimated_time || 0,
      created_at: order.created_at || new Date().toISOString(),
      updated_at: order.updated_at || new Date().toISOString(),
      cost: order.expected_total_amount || 0,
      customer_name: order.customer_name || "",
      customer_phone: order.customer_phone || "",
      agent: deliveryBoy
        ? {
          id: deliveryBoy.id,
          name: deliveryBoy.full_name,
          status: deliveryBoy.online_status ||
            (deliveryBoy.is_available ? "online" : "offline"),
          avatar_url: deliveryBoy.profile_image_url || "",
          rating: deliveryBoy.rating,
        }
        : undefined,
    };
  });
}

// تحويل حالة التوصيل إلى حالة الرحلة
function mapDeliveryStatusToTripStatus(
  status: string | null,
): "assigned" | "in_progress" | "completed" | "canceled" {
  switch (status) {
    case "assigned":
      return "assigned";
    case "in_progress":
      return "in_progress";
    case "completed":
      return "completed";
    case "canceled":
      return "canceled";
    default:
      return "assigned";
  }
}

export async function updateAgentStatus(
  agentId: string,
  status: string,
): Promise<Agent | null> {
  // تحديث حالة المندوب في delivery_boys باستخدام الحقول الجديدة
  const is_available = status === "online";
  const db_status = status === "offline" ? "inactive" : "active";

  logger.debug(`تحديث حالة المندوب ${agentId} إلى: ${status}`);

  const { data, error } = await supabase!
    .from("delivery_boys")
    .update({
      online_status: status, // تحديث الحقل الجديد
      is_available,
      status: db_status,
      status_changed_at: new Date().toISOString(), // تسجيل وقت تغيير الحالة
      status_reason: "تم التحديث من لوحة التحكم", // سبب التغيير
    })
    .eq("id", agentId)
    .select();

  if (error) {
    apiLogger.error("خطأ في تحديث حالة المندوب:", { error });
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  // تحويل البيانات المستردة إلى نموذج Agent
  const deliveryBoy = data[0];

  // استخدام الحقل الجديد مباشرة مع التوافق الخلفي
  const agentStatus = deliveryBoy.online_status ||
    (deliveryBoy.is_available ? "online" : "offline");

  return {
    id: deliveryBoy.id,
    name: deliveryBoy.full_name,
    status: agentStatus,
    avatar_url: deliveryBoy.profile_image_url || "",
    rating: deliveryBoy.rating,
    total_deliveries: deliveryBoy.total_deliveries,
    phone: deliveryBoy.phone,
    last_active: deliveryBoy.last_location_update,
    // إضافة الحقول الجديدة
    license_photo_url: deliveryBoy.license_photo_url,
    status_reason: deliveryBoy.status_reason,
    status_changed_at: deliveryBoy.status_changed_at,
  };
}

// وظائف متعلقة بالطلبات
export async function getOrders(status?: string): Promise<Order[]> {
  // استخدام delivery_orders للحصول على بيانات الطلبات
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

  if (error) {
    apiLogger.error("خطأ في جلب بيانات الطلبات:", { error });
    return [];
  }

  // الحصول على تفاصيل الطلبات
  const orderIds = data.map((order) => order.id);
  const { data: orderDetailsData, error: orderDetailsError } = await supabase!
    .from("order_details")
    .select("*")
    .in("delivery_order_id", orderIds);

  if (orderDetailsError) {
    apiLogger.error("خطأ في جلب تفاصيل الطلبات:", { error: orderDetailsError });
  }

  // تنظيم تفاصيل الطلبات حسب order_id
  type OrderDetailItem = {
    id: string;
    product_name: string;
    quantity: number;
    price: number;
    delivery_order_id?: string;
  };

  const orderDetailsMap: Record<string, OrderDetailItem[]> = {};
  if (orderDetailsData) {
    orderDetailsData.forEach((detail) => {
      if (detail.delivery_order_id) {
        if (!orderDetailsMap[detail.delivery_order_id]) {
          orderDetailsMap[detail.delivery_order_id] = [];
        }
        orderDetailsMap[detail.delivery_order_id].push(detail);
      }
    });
  }

  // تحويل delivery_orders إلى نموذج Order
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
      agent: deliveryBoy
        ? {
          id: deliveryBoy.id,
          name: deliveryBoy.full_name,
          status: deliveryBoy.online_status ||
            (deliveryBoy.is_available ? "online" : "offline"),
          avatar_url: deliveryBoy.profile_image_url || "",
          rating: deliveryBoy.rating,
          license_photo_url: deliveryBoy.license_photo_url,
          status_reason: deliveryBoy.status_reason,
          status_changed_at: deliveryBoy.status_changed_at,
        }
        : undefined,
      delivery_time: order.estimated_time,
    };
  });
}

// وظيفة للحصول على طلبات التوصيل
export async function getDeliveryOrders(
  status?: string,
): Promise<DeliveryOrder[]> {
  try {
    let ordersQuery = supabase!
      .from("delivery_orders")
      .select(
        "id, delivery_boy_id, status, order_number, pickup_address, delivery_address, customer_name, customer_phone, expected_total_amount, estimated_distance, estimated_time, created_at, updated_at, pickup_location, delivery_location",
      )
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      ordersQuery = ordersQuery.eq(
        "status",
        mapOrderStatusToDeliveryStatus(status),
      );
    }

    const { data: ordersData, error: ordersError } = await ordersQuery;

    if (ordersError) {
      apiLogger.error("خطأ في جلب بيانات طلبات التوصيل:", {
        error: ordersError,
      });
      return [];
    }

    if (!ordersData || ordersData.length === 0) {
      logger.debug("لم يتم العثور على طلبات");
      return [];
    }

    logger.debug(`تم العثور على ${ordersData.length} طلب`);

    // Get unique delivery_boy_ids to fetch user data
    const deliveryBoyIds = ordersData
      .filter((order) => order.delivery_boy_id)
      .map((order) => order.delivery_boy_id);

    // Skip delivery boy fetching if no IDs found
    type DeliveryBoyInfo = {
      id: string;
      full_name?: string;
      online_status?: string;
      is_available?: boolean;
      profile_image_url?: string;
      phone?: string;
      current_latitude?: string;
      current_longitude?: string;
      last_location_update?: string;
      status?: string;
      rating?: string | number;
      total_deliveries?: number;
      license_photo_url?: string;
      status_reason?: string;
      status_changed_at?: string;
    };

    const deliveryBoyMap: Record<string, DeliveryBoyInfo> = {};

    if (deliveryBoyIds.length > 0) {
      logger.debug(`جاري جلب بيانات ${deliveryBoyIds.length} مندوب توصيل`);

      try {
        // First try to get delivery boys from delivery_boys table
        const { data: deliveryBoysData, error: deliveryBoysError } =
          await supabase!
            .from("delivery_boys")
            .select("*")
            .in("id", deliveryBoyIds);

        if (deliveryBoysError) {
          apiLogger.error(
            "خطأ في جلب بيانات المندوبين من جدول delivery_boys:",
            { error: deliveryBoysError },
          );
        } else if (deliveryBoysData && deliveryBoysData.length > 0) {
          // Create a map of delivery boy data by ID
          deliveryBoysData.forEach((boy) => {
            deliveryBoyMap[boy.id] = boy;
          });
          logger.debug(
            `تم جلب بيانات ${deliveryBoysData.length} مندوب توصيل من delivery_boys`,
          );
        }

        // If not enough data found, try to get from auth.users as fallback
        if (Object.keys(deliveryBoyMap).length < deliveryBoyIds.length) {
          const missingIds = deliveryBoyIds.filter((id) => !deliveryBoyMap[id]);
          logger.debug(
            `محاولة جلب بيانات ${missingIds.length} مندوب من auth.users`,
          );

          const { data: usersData, error: usersError } = await supabase!
            .from("auth.users")
            .select("id, email, phone, raw_user_meta_data")
            .in("id", missingIds);

          if (usersError) {
            apiLogger.error("خطأ في جلب بيانات المندوبين من auth.users:", {
              error: usersError,
            });
          } else if (usersData) {
            // Add to the map
            usersData.forEach((user) => {
              deliveryBoyMap[user.id] = user;
            });
            logger.debug(
              `تم جلب بيانات ${usersData.length} مندوب توصيل من auth.users`,
            );
          }
        }

        // For any remaining missing agents, try to get status from order_tracking table
        const stillMissingIds = deliveryBoyIds.filter((id) =>
          !deliveryBoyMap[id]
        );
        if (stillMissingIds.length > 0) {
          logger.debug(
            `محاولة جلب حالة ${stillMissingIds.length} مندوب من order_tracking`,
          );

          // Fetch all latest tracking data for still missing IDs in one go
          const { data: trackingData, error: trackingError } = await supabase!
            .from("order_tracking")
            .select("delivery_boy_id, status, latitude, longitude, timestamp")
            .in("delivery_boy_id", stillMissingIds)
            .order("timestamp", { ascending: false }); // Note: This order might not give the *latest* for each distinct delivery_boy_id across multiple rows if not grouped/distincted properly.

          if (trackingError) {
            apiLogger.error("خطأ في جلب بيانات التتبع من order_tracking:", {
              error: trackingError,
            });
          } else if (trackingData && trackingData.length > 0) {
            // Process data to get the latest entry for each delivery_boy_id
            const latestTracking: Record<string, typeof trackingData[0]> = {};
            trackingData.forEach((entry) => {
              if (!latestTracking[entry.delivery_boy_id]) {
                latestTracking[entry.delivery_boy_id] = entry; // Assuming ordered by timestamp desc, first is latest
              }
            });

            for (const id of stillMissingIds) {
              const entry = latestTracking[id];
              if (entry) {
                deliveryBoyMap[id] = {
                  id: id,
                  full_name: "مندوب التوصيل", // Default name
                  online_status: entry.status || "busy", // Use new status field
                  current_latitude: entry.latitude,
                  current_longitude: entry.longitude,
                  last_location_update: entry.timestamp,
                };
                logger.debug(
                  `تم استخراج حالة المندوب ${id} من order_tracking: ${
                    entry.status || "busy"
                  }`,
                );
              }
            }
          }
        }
      } catch (agentError) {
        apiLogger.error("خطأ في جلب بيانات المندوبين:", { error: agentError });
      }
    }

    // Get order details
    const orderIds = ordersData.map((order) => order.id);
    const { data: orderDetailsData, error: orderDetailsError } = await supabase!
      .from("order_details")
      .select("*")
      .in("delivery_order_id", orderIds);

    if (orderDetailsError) {
      apiLogger.error("خطأ في جلب تفاصيل الطلبات:", {
        error: orderDetailsError,
      });
    }

    // Organize order details by order_id
    type OrderDetailItem = {
      id: string;
      delivery_order_id?: string;
      product_name?: string;
      quantity?: number;
      price?: number;
      created_at?: string;
      updated_at?: string;
    };

    const orderDetailsMap: Record<string, OrderDetailItem[]> = {};
    if (orderDetailsData) {
      orderDetailsData.forEach((detail) => {
        if (detail.delivery_order_id) {
          if (!orderDetailsMap[detail.delivery_order_id]) {
            orderDetailsMap[detail.delivery_order_id] = [];
          }
          orderDetailsMap[detail.delivery_order_id].push(detail);
        }
      });
    }

    // Log raw data from database for debugging
    // logger.debug('Raw order data from database:', { count: ordersData.length });

    // Transform and process orders with improved status mapping
    interface OrderData {
      id: string;
      delivery_boy_id?: string;
      status?: string;
      order_number?: string;
      pickup_address?: string;
      delivery_address?: string;
      customer_name?: string;
      customer_phone?: string;
      expected_total_amount?: number;
      estimated_distance?: number;
      estimated_time?: number;
      created_at?: string;
      updated_at?: string;
      pickup_location?: string | GeoPoint | { lat: number; lng: number };
      delivery_location?: string | GeoPoint | { lat: number; lng: number };
      order_details?: {
        id: string;
        delivery_order_id?: string;
        product_name?: string;
        quantity?: number;
        price?: number;
        created_at?: string;
        updated_at?: string;
      }[];
      agent?: {
        id: string;
        name: string;
        status: string;
        avatar_url: string;
        phone: string;
        location?: { lat: number; lng: number };
      };
    }

    const transformedOrders = ordersData.map((order: OrderData) => {
      // Save original status for debugging
      const originalStatus = order.status;

      // Make a copy of the order
      const transformedOrder = { ...order };

      // Update status using improved mapping
      if (transformedOrder.status) {
        transformedOrder.status = mapStatusWithImprovedMapping(
          transformedOrder.status,
        );
        // logger.debug(`Status mapping: ${originalStatus} -> ${transformedOrder.status}`);
      } else {
        logger.warn("Order has no status:", { id: order.id });
        transformedOrder.status = "pending"; // Default to pending if no status
      }

      // Add order details if available
      transformedOrder.order_details = orderDetailsMap[transformedOrder.id] ||
        [];

      // Add delivery boy information if available
      if (
        transformedOrder.delivery_boy_id &&
        deliveryBoyMap[transformedOrder.delivery_boy_id]
      ) {
        const boyData = deliveryBoyMap[transformedOrder.delivery_boy_id];
        transformedOrder.agent = {
          id: boyData.id,
          name: boyData.full_name || "مندوب التوصيل",
          status: boyData.online_status || "busy",
          avatar_url: boyData.profile_image_url || "",
          phone: boyData.phone || "",
          location: boyData.current_latitude && boyData.current_longitude
            ? {
              lat: parseFloat(boyData.current_latitude),
              lng: parseFloat(boyData.current_longitude),
            }
            : undefined,
        };
      }

      // Ensure pickup_location and delivery_location are valid GeoPoint objects
      transformedOrder.pickup_location = transformedOrder.pickup_location || {
        lat: 0,
        lng: 0,
      };

      transformedOrder.delivery_location = transformedOrder.delivery_location ||
        {
          lat: 0,
          lng: 0,
        };

      // Ensure order_number is a string to satisfy DeliveryOrder type
      transformedOrder.order_number = transformedOrder.order_number || ""; // Added default value

      return transformedOrder as DeliveryOrder; // Explicitly cast to DeliveryOrder
    });

    // Log detailed information for debugging
    logger.debug(`تم جلب ${ordersData.length || 0} طلب من قاعدة البيانات`);
    // logger.debug('الطلبات بعد التحويل:', { count: transformedOrders.length });
    // logger.debug('حالات الطلبات المستخرجة:', transformedOrders.map((o) => o.status));

    // Validate that orders exist for each status category
    const statuses = {
      pending: transformedOrders.filter((o) => o.status === "pending").length,
      assigned: transformedOrders.filter((o) => o.status === "assigned").length,
      in_progress: transformedOrders.filter((o) =>
        o.status === "in_progress"
      ).length,
      completed: transformedOrders.filter((o) =>
        o.status === "completed"
      ).length,
      canceled: transformedOrders.filter((o) => o.status === "canceled").length,
    };
    logger.debug("عدد الطلبات حسب الحالة:", statuses);

    return transformedOrders;
  } catch (error) {
    apiLogger.error("استثناء أثناء جلب طلبات التوصيل:", { error });
    return [];
  }
}

// Helper function to map statuses with improved mapping
function mapStatusWithImprovedMapping(status: string): string {
  switch (status.toLowerCase()) {
    case "scheduled":
    case "assigned":
      return "assigned";
    case "pickedup":
    case "inreceipt":
      return "in_progress";
    case "completed":
    case "delivered":
      return "completed";
    case "cancelled":
    case "canceled":
      return "canceled";
    case "pending":
      return "pending";
    case "confirmed":
      return "confirmed";
    default:
      return "pending";
  }
}

/*

pending, confirmed, pickedUp, inReceipt, completed, cancelled, scheduled, returned

*/

// تحويل حالة الطلب من نظام التوصيل إلى حالات نظام الإدارة
function mapDeliveryStatusToOrderStatus(
  status: string | null,
): "pending" | "in_progress" | "delivered" | "canceled" | "confirmed" {
  if (!status) return "pending";

  switch (status.toLowerCase()) {
    case "pending":
      return "pending";
    case "confirmed":
      return "confirmed";
    case "scheduled":
    case "assigned":
      return "pending";
    case "pickedup":
    case "inreceipt":
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

// تحويل حالة الطلب إلى حالة التوصيل
function mapOrderStatusToDeliveryStatus(status: string): string {
  switch (status) {
    case "pending":
      return "pending";
    case "in_progress":
      return "in_progress";
    case "delivered":
      return "completed";
    case "canceled":
      return "canceled";
    default:
      return "pending";
  }
}

export async function getOrderStats(): Promise<OrderStats> {
  // توفير قيم افتراضية آمنة
  const defaultStats: OrderStats = {
    avg_delivery_time: 0,
    pending: 0,
    total: 0,
    in_progress: 0,
    delivered: 0,
    canceled: 0,
    excellent_trips: 0,
  };

  if (!supabase) {
    console.warn("Supabase client is not available. Returning default stats.");
    return defaultStats;
  }

  try {
    const stats = { ...defaultStats };

    // 1. إجمالي الطلبات (باستخدام GET و count)
    try {
      const { count: totalCount, error: totalError } = await supabase
        .from("delivery_orders")
        .select("id", { count: "exact", head: false });

      if (totalError) {
        console.error("Error fetching total order count:", totalError);
      } else {
        stats.total = totalCount ?? 0;
      }
    } catch (e) {
      console.error("Supabase call failed for total orders:", e);
    }

    // 2. الطلبات المعلقة (pending)
    try {
      const { count: pendingCount, error: pendingError } = await supabase
        .from("delivery_orders")
        .select("id", { count: "exact", head: false })
        .eq("status", "pending");

      if (pendingError) {
        console.error("Error fetching pending order count:", pendingError);
      } else {
        stats.pending = pendingCount ?? 0;
      }
    } catch (e) {
      console.error("Supabase call failed for pending orders:", e);
    }

    // 3. الطلبات قيد التنفيذ (in_progress) - الآن تستخدم "inReceipt"
    try {
      const { count: inProgressCount, error: inProgressError } = await supabase
        .from("delivery_orders")
        .select("id", { count: "exact", head: false })
        .eq("status", "inReceipt");

      if (inProgressError) {
        console.error(
          "Error fetching in-progress order count:",
          inProgressError,
        );
      } else {
        stats.in_progress = inProgressCount ?? 0;
      }
    } catch (e) {
      console.error(
        "Supabase call failed for in-progress orders (using inReceipt):",
        e,
      );
    }

    // 4. الطلبات المسلمة (completed)
    try {
      const { count: deliveredCount, error: deliveredError } = await supabase
        .from("delivery_orders")
        .select("id", { count: "exact", head: false })
        .eq("status", "completed");

      if (deliveredError) {
        console.error("Error fetching delivered order count:", deliveredError);
      } else {
        stats.delivered = deliveredCount ?? 0;
      }
    } catch (e) {
      console.error("Supabase call failed for delivered orders:", e);
    }

    // 5. الطلبات الملغاة (canceled/cancelled)
    // يجب التعامل مع كلتا القيمتين إذا كانتا موجودتين ومستخدمتين
    let canceledTotal = 0;
    try {
      const { count: canceledCount1, error: canceledError1 } = await supabase
        .from("delivery_orders")
        .select("id", { count: "exact", head: false })
        .eq("status", "canceled");
      if (canceledError1) {
        console.error('Error fetching "canceled" order count:', canceledError1);
      } else canceledTotal += canceledCount1 ?? 0;

      const { count: canceledCount2, error: canceledError2 } = await supabase
        .from("delivery_orders")
        .select("id", { count: "exact", head: false })
        .eq("status", "cancelled");
      if (canceledError2) {
        console.error(
          'Error fetching "cancelled" order count:',
          canceledError2,
        );
      } else canceledTotal += canceledCount2 ?? 0;

      stats.canceled = canceledTotal;
    } catch (e) {
      console.error("Supabase call failed for canceled orders:", e);
    }

    // يمكنك إضافة حسابات أخرى مثل avg_delivery_time و excellent_trips إذا لزم الأمر
    // ...

    return stats;
  } catch (error) {
    console.error("An unexpected error occurred in getOrderStats:", error);
    return defaultStats; // إرجاع القيم الافتراضية في حالة حدوث خطأ غير متوقع
  }
}

// وظائف جديدة للتعامل مع جلسات جمع النفايات
export async function getWasteCollectionSessions() {
  const { data, error } = await supabase!
    .from("waste_collection_sessions")
    .select(`
      *,
      delivery_orders!waste_collection_sessions_delivery_order_id_fkey(*),
      delivery_boys!waste_collection_sessions_delivery_boy_id_fkey(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("خطأ في جلب بيانات جلسات جمع النفايات:", error);
    return [];
  }

  return data || [];
}

export async function getWasteCollectionItems(sessionId: string) {
  const { data, error } = await supabase!
    .from("waste_collection_items")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("خطأ في جلب بيانات عناصر جمع النفايات:", error);
    return [];
  }

  return data || [];
}

export async function getWasteInvoices() {
  const { data, error } = await supabase!
    .from("waste_invoices")
    .select(`
      *,
      waste_collection_sessions!waste_invoices_session_id_fkey(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("خطأ في جلب بيانات فواتير النفايات:", error);
    return [];
  }

  return data || [];
}

// وظيفة لتتبع مواقع المندوبين
export async function getAgentLocations() {
  const { data, error } = await supabase!
    .from("delivery_boys")
    .select("id, current_latitude, current_longitude, last_location_update")
    .not("current_latitude", "is", null)
    .not("current_longitude", "is", null);

  if (error) {
    console.error("خطأ في جلب بيانات مواقع المندوبين:", error);
    return [];
  }

  return data.map((location) => ({
    id: location.id,
    agent_id: location.id,
    latitude: location.current_latitude || 0,
    longitude: location.current_longitude || 0,
    timestamp: location.last_location_update || new Date().toISOString(),
  }));
}

// وظيفة لتتبع مسار طلب محدد
export async function getOrderTracking(orderId: string) {
  const { data, error } = await supabase!
    .from("order_tracking")
    .select("*")
    .eq("order_id", orderId)
    .order("timestamp", { ascending: true });

  if (error) {
    console.error("خطأ في جلب بيانات تتبع الطلب:", error);
    return [];
  }

  return data || [];
}

// دالة للحصول على نقاط تتبع طلب معين باستخدام الدالة الجديدة في قاعدة البيانات
export async function getOrderTrackingPoints(
  orderId: string,
): Promise<{ latitude: number; longitude: number; timestamp: string }[]> {
  const { data, error } = await supabase!.rpc("get_order_tracking_points", {
    order_id_param: orderId,
  });

  if (error) {
    console.error("خطأ في جلب نقاط تتبع الطلب:", error);
    return [];
  }

  console.log(`تم جلب ${data?.length || 0} نقطة تتبع للطلب ${orderId}`);

  return data || [];
}

// دالة للحصول على المندوبين النشطين مع معلومات الموقع والطلب الحالي
export async function getActiveAgents(): Promise<Agent[]> {
  const { data, error } = await supabase!
    .from("active_delivery_boys_view")
    .select("*");

  if (error) {
    console.error("خطأ في جلب بيانات المندوبين النشطين:", error);
    return [];
  }

  console.log(`تم جلب ${data.length} مندوب نشط من قاعدة البيانات`);

  return data.map((agent) => ({
    id: agent.id,
    name: agent.full_name,
    status: agent.online_status || "offline",
    avatar_url: agent.profile_image_url || "",
    rating: parseFloat(agent.rating) || 0,
    total_deliveries: agent.total_deliveries || 0,
    phone: agent.phone,
    last_active: agent.last_location_update || agent.updated_at,
    location: agent.current_latitude && agent.current_longitude
      ? {
        lat: parseFloat(agent.current_latitude),
        lng: parseFloat(agent.current_longitude),
      }
      : undefined,
    preferred_vehicle: agent.preferred_vehicle,
    badge_level: agent.badge_level || 0,
    license_number: agent.license_number,
    license_photo_url: agent.license_photo_url,
    status_reason: agent.status_reason,
    status_changed_at: agent.status_changed_at,
    current_order_id: agent.current_order_id,
    current_order_number: agent.current_order_number,
    current_order_status: agent.current_order_status,
  }));
}

// دالة للحصول على تفاصيل طلب معين
export async function getOrderDetails(
  orderId: string,
): Promise<DeliveryOrder | null> {
  const { data, error } = await supabase!
    .from("delivery_orders")
    .select(`
      *,
      delivery_boys!delivery_orders_delivery_boy_id_fkey(
        id, full_name, phone, profile_image_url, 
        preferred_vehicle, online_status, current_latitude, current_longitude
      )
    `)
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("خطأ في جلب تفاصيل الطلب:", error);
    return null;
  }

  return data;
}

// دالة مساعدة لإنشاء UUID في حالة عدم توفر crypto.randomUUID()
function generateUUID(): string {
  // التحقق مما إذا كان crypto.randomUUID متوفرًا
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // تنفيذ بديل إذا لم تكن الدالة متوفرة
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// دالة لإنشاء حساب مستخدم جديد
async function createUserAccount(userData: {
  email?: string;
  phone: string;
  password?: string;
  full_name: string;
}): Promise<{ id: string } | null> {
  try {
    // إنشاء كلمة مرور عشوائية إذا لم يتم توفيرها
    const password = userData.password || generateRandomPassword();

    console.log("جاري إنشاء حساب مستخدم جديد");
    console.log("تم إخفاء البيانات الحساسة من العرض");

    // استخدام API لإنشاء مستخدم جديد
    const { data, error } = await supabase!.auth.admin.createUser({
      email: userData.email,
      phone: userData.phone,
      password: password,
      email_confirm: true, // تأكيد البريد الإلكتروني تلقائياً
      user_metadata: {
        full_name: userData.full_name,
        is_delivery_boy: true,
        role: "delivery_boy",
      },
    });

    if (error) {
      console.error("خطأ أثناء إنشاء حساب المستخدم:", error);
      return null;
    }

    if (!data.user) {
      console.error("لم يتم إنشاء المستخدم");
      return null;
    }

    console.log("تم إنشاء حساب مستخدم جديد بنجاح:", data.user.id);

    // إنشاء رسالة SMS للإرسال (في المستقبل)
    const smsMessage = `
      مرحبا ${userData.full_name}، 
      تم إنشاء حساب لك في تطبيق التوصيل.
      رقم الهاتف: ${userData.phone}
      كلمة المرور المؤقتة: ${password}
      يرجى تغيير كلمة المرور عند أول تسجيل دخول.
    `;

    console.log("رسالة SMS للإرسال:", smsMessage);

    // في المستقبل، يمكن إضافة كود لإرسال SMS هنا

    return { id: data.user.id };
  } catch (e) {
    console.error("استثناء أثناء إنشاء حساب المستخدم:", e);
    return null;
  }
}

// Define a more specific result type for createDeliveryBoy
export interface CreateDeliveryBoyResult extends DeliveryBoy {
  delivery_code?: string;
  // tempPassword is no longer needed as password is set by admin
}

export async function createDeliveryBoy(deliveryBoyData: {
  full_name: string;
  phone: string;
  email?: string;
  date_of_birth?: string; // تاريخ الميلاد
  national_id?: string; // رقم الهوية
  license_number?: string; // رقم الرخصة
  preferred_vehicle?: "tricycle" | "pickup_truck" | "light_truck";
  preferred_language?: string; // اللغة المفضلة
  preferred_zones?: string[]; // المناطق المفضلة
  notes?: string; // ملاحظات
  status?: "active" | "inactive" | "suspended";
  online_status?: "online" | "offline" | "busy";
  password?: string; // Add password here
}): Promise<CreateDeliveryBoyResult | null> { // Update return type
  if (!supabase) {
    console.error(
      "Supabase client is not initialized. Cannot create delivery boy.",
    );
    return null;
  }

  console.log("Calling API to create delivery boy with data:", deliveryBoyData);

  try {
    const response = await fetch("/api/agents/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deliveryBoyData), // Pass all data including password
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API error when creating delivery boy:", errorData);
      throw new Error(
        errorData.message ||
          `Failed to create delivery boy via API: ${response.statusText}`,
      );
    }

    const result = await response.json();
    console.log("API response for create delivery boy:", result);

    // The API should return an object that matches CreateDeliveryBoyResult structure
    // including delivery_boy object and delivery_code.
    // Example structure from API: { data: { delivery_boy: { id: '...', delivery_code: '...' }, user: { ... } } }
    if (result.data && result.data.delivery_boy) {
      return {
        ...result.data.delivery_boy, // Spread the delivery_boy object
        id: result.data.delivery_boy.id, // Ensure id is correctly mapped
        // delivery_code should be part of result.data.delivery_boy from the API
      } as CreateDeliveryBoyResult;
    } else if (result.delivery_boy) { // Fallback if API returns flatter structure
      return result.delivery_boy as CreateDeliveryBoyResult;
    } else {
      console.error("Unexpected API response structure:", result);
      throw new Error(
        "API response did not contain expected delivery_boy data.",
      );
    }
  } catch (error) {
    console.error("Error in createDeliveryBoy function (calling API):", error);
    // Consider how to propagate the error message to the UI
    // For now, returning null, but specific error handling might be better.
    // throw error; // Or re-throw to be caught by the calling component
    return null;
  }
}

// دالة لإنشاء كود تسليم فريد
function generateDeliveryCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// دالة لإنشاء كود إحالة
function generateReferralCode(name: string): string {
  const namePart = name.substring(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${namePart}${randomPart}`;
}

// وظيفة لرفع مستند للمندوب
export async function uploadDeliveryDocument(documentData: {
  delivery_id: string;
  document_type: string;
  document_url: string;
  verification_status?: string;
  expiry_date?: string; // إضافة تاريخ انتهاء الصلاحية
  notes?: string; // ملاحظات إضافية
}): Promise<
  {
    id: string;
    delivery_id: string;
    document_type: string;
    document_url: string;
    verification_status: string;
    uploaded_at: string;
    expiry_date?: string; // إضافة تاريخ انتهاء الصلاحية للنتيجة
    notes?: string;
  } | null
> {
  try {
    const { data, error } = await supabase!
      .from("delivery_documents")
      .insert([
        {
          delivery_id: documentData.delivery_id,
          document_type: documentData.document_type,
          document_url: documentData.document_url,
          verification_status: documentData.verification_status || "pending",
          expiry_date: documentData.expiry_date, // إضافة تاريخ انتهاء الصلاحية
          notes: documentData.notes, // إضافة ملاحظات
          uploaded_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("خطأ أثناء رفع مستند المندوب:", error);
      return null;
    }

    console.log("تم رفع مستند المندوب بنجاح:", data);
    return data;
  } catch (e) {
    console.error("استثناء أثناء رفع المستند:", e);
    return null;
  }
}

// Update the uploadFile function
export async function uploadFile(
  bucket: string,
  file: File,
  folderPath: string = "",
  customFileName?: string,
): Promise<{
  path: string | null;
  error: Error | null;
}> {
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    if (!supabase) {
      throw new Error("Supabase client is not initialized");
    }

    const fileName = customFileName ||
      `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    console.log("uploadFile: Bucket:", bucket);
    console.log("uploadFile: folderPath:", folderPath);
    console.log("uploadFile: fileName:", fileName);
    console.log("uploadFile: Constructed filePath before upload:", filePath);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true,
      });

    if (error) throw error;

    console.log("uploadFile: Supabase returned data.path:", data?.path);

    return {
      path: data?.path || null,
      error: null,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      path: null,
      error: error as Error,
    };
  }
}

export function getPublicImageUrl(
  bucketName: string,
  filePath: string,
): string | null {
  if (!supabase) {
    console.error("Supabase client is not initialized.");
    return null;
  }

  // Clean the filePath by removing any leading 'documents/' if it exists.
  // This makes the function robust against incorrect paths stored in the DB.
  let cleanedFilePath = filePath;
  if (cleanedFilePath.startsWith("documents/")) {
    cleanedFilePath = cleanedFilePath.substring("documents/".length);
  }

  console.log("getPublicImageUrl: Original filePath:", filePath);
  console.log("getPublicImageUrl: Cleaned filePath:", cleanedFilePath);

  const { data } = supabase.storage.from(bucketName).getPublicUrl(
    cleanedFilePath,
  );
  console.log("getPublicImageUrl: Public URL:", data.publicUrl);
  return data.publicUrl || null;
}

// وظيفة لإضافة منطقة عمل جديدة للمندوب
export async function addDeliveryZone(zoneData: {
  delivery_id: string;
  zone_name: string;
  is_active?: boolean;
  geographic_zone_id?: string; // إضافة معرف المنطقة الجغرافية
  is_primary?: boolean; // <<<<<< تعديل: إضافة هذا السطر
}): Promise<
  {
    id: string;
    delivery_id: string;
    zone_name: string;
    is_active: boolean;
    geographic_zone_id?: string; // إضافة معرف المنطقة الجغرافية
    is_primary: boolean; // <<<<<< تعديل: إضافة هذا السطر
    created_at: string;
  } | null
> {
  try {
    const { data, error } = await supabase!
      .from("delivery_zones")
      .insert([{
        delivery_id: zoneData.delivery_id,
        zone_name: zoneData.zone_name,
        is_active: zoneData.is_active !== undefined ? zoneData.is_active : true,
        geographic_zone_id: zoneData.geographic_zone_id, // إضافة معرف المنطقة الجغرافية
        is_primary: zoneData.is_primary !== undefined
          ? zoneData.is_primary
          : false, // <<<<<< تعديل: إضافة هذا السطر (القيمة الافتراضية false إذا لم تُمرر)
        created_at: new Date().toISOString(),
      }])
      .select("*") // select('*') سيجلب العمود الجديد is_primary تلقائيًا
      .single();

    if (error) {
      console.error("خطأ أثناء إضافة منطقة عمل:", error);
      return null;
    }

    console.log("تم إضافة منطقة عمل جديدة بنجاح:", data);
    // data هنا يجب أن يتضمن is_primary بسبب select('*')
    return data as { // <<<<<< تعديل: تأكيد النوع للبيانات المرجعة
      id: string;
      delivery_id: string;
      zone_name: string;
      is_active: boolean;
      geographic_zone_id?: string;
      is_primary: boolean;
      created_at: string;
    };
  } catch (e) {
    console.error("استثناء أثناء إضافة منطقة عمل:", e);
    return null;
  }
}

// وظيفة للحصول على مناطق عمل المندوب
export async function getDeliveryZones(deliveryId: string): Promise<{
  id: string;
  delivery_id: string;
  zone_name: string;
  is_active: boolean;
  geographic_zone_id?: string; // إضافة معرف المنطقة الجغرافية
  is_primary: boolean; // <<<<<< تعديل: إضافة هذا السطر
  created_at: string;
}[]> {
  try {
    const { data, error } = await supabase!
      .from("delivery_zones")
      .select("*") // select('*') سيجلب is_primary
      .eq("delivery_id", deliveryId);

    if (error) {
      console.error("خطأ أثناء جلب مناطق عمل المندوب:", error);
      return [];
    }

    // data هنا يجب أن يتضمن is_primary لكل عنصر
    return (data || []) as { // <<<<<< تعديل: تأكيد النوع للبيانات المرجعة
      id: string;
      delivery_id: string;
      zone_name: string;
      is_active: boolean;
      geographic_zone_id?: string;
      is_primary: boolean;
      created_at: string;
    }[];
  } catch (e) {
    console.error("استثناء أثناء جلب مناطق عمل المندوب:", e);
    return [];
  }
}

// وظيفة لتحديث حالة منطقة عمل
export async function updateDeliveryZoneStatus(
  zoneId: string,
  isActive: boolean,
): Promise<boolean> {
  try {
    const { error } = await supabase!
      .from("delivery_zones")
      .update({ is_active: isActive })
      .eq("id", zoneId);

    if (error) {
      console.error("خطأ أثناء تحديث حالة منطقة العمل:", error);
      return false;
    }

    return true;
  } catch (e) {
    console.error("استثناء أثناء تحديث حالة منطقة العمل:", e);
    return false;
  }
}

// وظيفة لحذف منطقة عمل
export async function deleteDeliveryZone(zoneId: string): Promise<boolean> {
  try {
    const { error } = await supabase!
      .from("delivery_zones")
      .delete()
      .eq("id", zoneId);

    if (error) {
      console.error("خطأ أثناء حذف منطقة العمل:", error);
      return false;
    }

    return true;
  } catch (e) {
    console.error("استثناء أثناء حذف منطقة العمل:", e);
    return false;
  }
}

// وظيفة لتحديث حالة منطقة العمل (أساسية/ثانوية)
export async function updateDeliveryZonePrimary(
  zoneId: string,
  isPrimary: boolean,
): Promise<boolean> {
  try {
    const { error } = await supabase!
      .from("delivery_zones")
      .update({ is_primary: isPrimary })
      .eq("id", zoneId);

    if (error) {
      console.error("خطأ أثناء تحديث حالة أساسية/ثانوية لمنطقة العمل:", error);
      return false;
    }

    return true;
  } catch (e) {
    console.error("استثناء أثناء تحديث حالة أساسية/ثانوية لمنطقة العمل:", e);
    return false;
  }
}

// وظيفة للحصول على منطقة جغرافية بالمعرف
export async function getGeographicZoneById(zoneId: string): Promise<
  {
    id: string;
    name: string;
    area_polygon: GeoJSONPolygon;
    center_point: GeoJSONPoint;
    description: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  } | null
> {
  try {
    // استخدام نقطة النهاية API بدلاً من الاتصال المباشر بقاعدة البيانات
    const response = await fetch(`/api/settings/geographic-zones?id=${zoneId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    } else if (!Array.isArray(data)) {
      return data;
    }

    return null;
  } catch (e) {
    console.error("استثناء أثناء جلب منطقة جغرافية:", e);
    return null;
  }
}

// وظيفة للحصول على مندوب توصيل بواسطة المعرف
export async function getDeliveryBoyById(id: string): Promise<
  {
    id: string;
    full_name?: string;
    phone?: string;
    email?: string;
    status?: string;
    national_id?: string;
    delivery_code?: string;
    avatar_url?: string;
  } | null
> {
  try {
    console.log("جاري جلب بيانات المندوب بالمعرف:", id);

    // البحث في جدول delivery_boys أولاً
    const { data: deliveryBoy, error } = await supabase!
      .from("delivery_boys")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("خطأ في استرداد بيانات المندوب من delivery_boys:", error);

      // محاولة البحث في جدول new_profiles_delivery
      const { data: profileData, error: profileError } = await supabase!
        .from("new_profiles_delivery")
        .select("id, full_name, user_id")
        .eq("id", id)
        .single();

      if (profileError) {
        console.error(
          "خطأ في استرداد بيانات المندوب من new_profiles_delivery:",
          profileError,
        );
        return null;
      }

      if (profileData) {
        return {
          id: profileData.id,
          full_name: profileData.full_name,
        };
      }

      return null;
    }

    console.log("تم استرداد بيانات المندوب بنجاح:", deliveryBoy);
    return deliveryBoy;
  } catch (e) {
    console.error("خطأ غير متوقع أثناء جلب بيانات المندوب:", e);
    return null;
  }
}

// =============================
// وظائف إدارة المناطق الجغرافية
// =============================

// جلب جميع المناطق الجغرافية
export async function getGeographicZones(
  city?: string,
  country?: string,
): Promise<GeographicZone[]> {
  if (!supabase) {
    console.error("Supabase client is not initialized.");
    return [];
  }

  let query = supabase
    .from("geographic_zones")
    .select(
      "id, name, description, is_active, area_polygon, center_point, created_at, updated_at, city, country",
    );

  if (city) {
    query = query.eq("city", city);
  }
  if (country) {
    query = query.eq("country", country);
  }

  const { data, error } = await query;

  if (error) {
    console.error("خطأ في جلب المناطق الجغرافية:", error);
    return [];
  }

  return data.map((zone): GeographicZone => ({
    id: zone.id,
    name: zone.name,
    description: zone.description || "",
    is_active: zone.is_active,
    area_polygon: typeof zone.area_polygon === "string"
      ? JSON.parse(zone.area_polygon)
      : zone.area_polygon as GeoJSONPolygon,
    center_point: typeof zone.center_point === "string"
      ? JSON.parse(zone.center_point)
      : zone.center_point as GeoJSONPoint,
    created_at: zone.created_at,
    updated_at: zone.updated_at,
    city: zone.city || null,
    country: zone.country || null,
  })) || [];
}

// إضافة منطقة جغرافية جديدة
export async function addGeographicZone(
  zoneData: GeographicZoneFormData,
  areaPolygon: GeoJSONPolygon,
  centerPoint: GeoJSONPoint,
): Promise<GeographicZone | null> {
  try {
    if (!supabase) {
      throw new Error("Supabase client is not initialized.");
    }

    let cityName = null;
    if (zoneData.city) {
      // Assuming zoneData.city is the ID, fetch the name from CountryCityBoundary
      const { data: cityData, error: cityError } = await supabase
        .from("CountryCityBoundary")
        .select("city_name")
        .eq("id", zoneData.city)
        .maybeSingle();

      if (cityError) {
        console.error("Error fetching city name for ID:", cityError);
        throw new Error("Failed to retrieve city name for provided ID.");
      }
      if (cityData) {
        cityName = cityData.city_name;
      } else {
        console.warn(
          `City with ID ${zoneData.city} not found. Saving ID directly.`,
        );
        cityName = zoneData.city; // Fallback to ID if name not found
      }
    }

    let countryName = null;
    if (zoneData.country) {
      const { data: countryData, error: countryError } = await supabase
        .from("CountryCityBoundary")
        .select("country_name")
        .eq("id", zoneData.country)
        .is("city_name", null)
        .maybeSingle();

      if (countryError) {
        console.error("Error fetching country name for ID:", countryError);
        throw new Error("Failed to retrieve country name for provided ID.");
      }
      if (countryData) {
        countryName = countryData.country_name;
      } else {
        console.warn(
          `Country with ID ${zoneData.country} not found. Saving ID directly.`,
        );
        countryName = zoneData.country; // Fallback to ID if name not found
      }
    }

    const { data, error } = await supabase
      .from("geographic_zones")
      .insert({
        name: zoneData.name,
        description: zoneData.description,
        area_polygon: areaPolygon,
        center_point: centerPoint,
        is_active: zoneData.is_active,
        city: cityName, // Use the fetched city name
        country: countryName, // Use the fetched country name
        // Add other fields as necessary from GeographicZoneFormData
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error adding geographic zone:", error);
      throw new Error(error.message);
    }

    return data as GeographicZone;
  } catch (error) {
    console.error("Unexpected error in addGeographicZone:", error);
    return null;
  }
}

// تحديث منطقة جغرافية
export async function updateGeographicZone(
  zoneId: string,
  zoneData: Partial<GeographicZoneFormData>,
  areaPolygon?: GeoJSONPolygon,
  centerPoint?: GeoJSONPoint,
): Promise<boolean> {
  try {
    if (!supabase) {
      throw new Error("Supabase client is not initialized.");
    }

    const updatePayload: { [key: string]: unknown } = {
      name: zoneData.name,
      description: zoneData.description,
      is_active: zoneData.is_active,
    };

    if (areaPolygon) {
      updatePayload.area_polygon = areaPolygon;
    }
    if (centerPoint) {
      updatePayload.center_point = centerPoint;
    }

    if (zoneData.city !== undefined) {
      let cityName = null;
      if (zoneData.city) {
        const { data: cityData, error: cityError } = await supabase
          .from("CountryCityBoundary")
          .select("city_name")
          .eq("id", zoneData.city)
          .maybeSingle();

        if (cityError) {
          console.error(
            "Error fetching city name for ID during update:",
            cityError,
          );
          throw new Error(
            "Failed to retrieve city name for provided ID during update.",
          );
        }
        if (cityData) {
          cityName = cityData.city_name;
        } else {
          console.warn(
            `City with ID ${zoneData.city} not found during update. Saving ID directly.`,
          );
          cityName = zoneData.city; // Fallback to ID if name not found
        }
      }
      updatePayload.city = cityName; // Use the fetched city name
    }

    if (zoneData.country !== undefined) {
      let countryName = null;
      if (zoneData.country) {
        const { data: countryData, error: countryError } = await supabase
          .from("CountryCityBoundary")
          .select("country_name")
          .eq("id", zoneData.country)
          .is("city_name", null)
          .maybeSingle();

        if (countryError) {
          console.error(
            "Error fetching country name for ID during update:",
            countryError,
          );
          throw new Error(
            "Failed to retrieve country name for provided ID during update.",
          );
        }
        if (countryData) {
          countryName = countryData.country_name;
        } else {
          console.warn(
            `Country with ID ${zoneData.country} not found during update. Saving ID directly.`,
          );
          countryName = zoneData.country; // Fallback to ID if name not found
        }
      }
      updatePayload.country = countryName; // Use the fetched country name
    }

    const { error } = await supabase
      .from("geographic_zones")
      .update(updatePayload)
      .eq("id", zoneId);

    if (error) {
      console.error("Error updating geographic zone:", error);
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.error("Unexpected error in updateGeographicZone:", error);
    return false;
  }
}

// حذف منطقة جغرافية
export async function deleteGeographicZone(zoneId: string): Promise<boolean> {
  const client = supabase!;
  const { error } = await client
    .from("geographic_zones")
    .delete()
    .eq("id", zoneId);

  if (error) {
    console.error("Error deleting geographic zone:", error);
    return false;
  }
  return true;
}
