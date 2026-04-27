import { supabase } from "./base";
import { Agent, Trip } from "../../types";
import { apiLogger, logger } from "../logger-safe";

// وظائف متعلقة بمندوبي التوصيل
export async function getAgents(): Promise<Agent[]> {
  const { data, error } = await supabase!
    .from("delivery_boys")
    .select(
      "id, full_name, online_status, is_available, status, profile_image_url, rating, total_deliveries, phone, last_location_update, updated_at, current_latitude, current_longitude, preferred_vehicle, badge_level, delivery_code, delivery_code_status, referral_code",
    )
    .order("full_name");

  if (error) {
    return [];
  }

  return data.map((deliveryBoy: any) => {
    let agentStatus: "online" | "offline" | "busy" =
      deliveryBoy.online_status || "offline";

    if (!deliveryBoy.online_status && deliveryBoy.is_available) {
      agentStatus = deliveryBoy.status === "active" ? "online" : "offline";
    }

    return {
      id: deliveryBoy.id,
      name: deliveryBoy.full_name,
      full_name: deliveryBoy.full_name,
      status: agentStatus,
      avatar_url: deliveryBoy.profile_image_url || "",
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
      current_trip_id: null,
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

    return data || [];
  } catch (e) {
    console.error("استثناء أثناء جلب بيانات المندوبين:", e);
    return [];
  }
}

export async function updateAgentStatus(
  agentId: string,
  status: string,
): Promise<Agent | null> {
  const is_available = status === "online";
  const db_status = status === "offline" ? "inactive" : "active";

  logger.debug(`تحديث حالة المندوب ${agentId} إلى: ${status}`);

  const { data, error } = await supabase!
    .from("delivery_boys")
    .update({
      online_status: status,
      is_available,
      status: db_status,
      status_changed_at: new Date().toISOString(),
      status_reason: "تم التحديث من لوحة التحكم",
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

  const deliveryBoy = data[0];
  const agentStatus = deliveryBoy.online_status ||
    (deliveryBoy.is_available ? "online" : "offline");

  return {
    id: deliveryBoy.id,
    name: deliveryBoy.full_name,
    full_name: deliveryBoy.full_name,
    status: agentStatus,
    avatar_url: deliveryBoy.profile_image_url || "",
    rating: parseFloat(deliveryBoy.rating) || 0,
    total_deliveries: deliveryBoy.total_deliveries || 0,
    phone: deliveryBoy.phone,
    last_active: deliveryBoy.last_location_update || deliveryBoy.updated_at,
    license_photo_url: deliveryBoy.license_photo_url,
    status_reason: deliveryBoy.status_reason,
    status_changed_at: deliveryBoy.status_changed_at,
  };
}

export async function getDeliveryBoyById(id: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("delivery_boys")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    apiLogger.error(`Error fetching delivery boy by id ${id}:`, { error });
    return null;
  }

  return data;
}
export async function createDeliveryBoy(payload: any) {
  try {
    const response = await fetch('/api/delivery-boys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'فشل إنشاء المندوب');
    }

    const data = await response.json();
    // إرجاع هيكل البيانات المتوقع من قبل المكون FullAddAgentForm
    return {
      id: data.id,
      delivery_code: data.delivery_code, // تأكد من أن الـ API يرجع هذا أو سيكون متاحاً لاحقاً
      data: {
        user: { id: data.id },
        delivery_boy: { id: data.id, delivery_code: data.delivery_code }
      }
    };
  } catch (error) {
    console.error('Error in createDeliveryBoy wrapper:', error);
    throw error;
  }
}
