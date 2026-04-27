import { supabase } from "./base";
import { apiLogger } from "../logger-safe";

export interface DeliveryZoneData {
  delivery_id: string;
  zone_name: string;
  is_active: boolean;
  geographic_zone_id: string;
  is_primary: boolean;
}

export async function getDeliveryZones(agentId: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*")
    .eq("delivery_id", agentId)
    .order("created_at", { ascending: false });

  if (error) {
    apiLogger.error("Error fetching delivery zones:", { error });
    return [];
  }

  return data || [];
}

export async function addDeliveryZone(zoneData: DeliveryZoneData) {
  try {
    const { data, error } = await supabase!
      .from("delivery_zones")
      .insert(zoneData)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    apiLogger.error("Error adding delivery zone:", { error: error as any });
    return null;
  }
}

export async function updateDeliveryZoneStatus(zoneId: string, is_active: boolean): Promise<boolean> {
  const { error } = await supabase!
    .from("delivery_zones")
    .update({ is_active })
    .eq("id", zoneId);

  if (error) {
    apiLogger.error("Error updating delivery zone status:", { error });
    return false;
  }
  return true;
}

export async function updateDeliveryZonePrimary(zoneId: string, is_primary: boolean): Promise<boolean> {
  const { error } = await supabase!
    .from("delivery_zones")
    .update({ is_primary })
    .eq("id", zoneId);

  if (error) {
    apiLogger.error("Error updating delivery zone primary status:", { error });
    return false;
  }
  return true;
}

export async function deleteDeliveryZone(zoneId: string): Promise<boolean> {
  const { error } = await supabase!
    .from("delivery_zones")
    .delete()
    .eq("id", zoneId);

  if (error) {
    apiLogger.error("Error deleting delivery zone:", { error });
    return false;
  }
  return true;
}
