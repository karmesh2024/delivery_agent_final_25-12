import { supabase } from "./base";
import { GeographicZone, GeoJSONPolygon, GeoJSONPoint } from "../../types";
import { apiLogger } from "../logger-safe";

export interface GeographicZoneFormData {
  name: string;
  description: string;
  is_active: boolean;
  city?: string;
  country?: string;
}

export async function getGeographicZones(city?: string, country?: string): Promise<GeographicZone[]> {
  if (!supabase) return [];

  let query = supabase
    .from("geographic_zones")
    .select("id, name, description, is_active, area_polygon, center_point, created_at, updated_at, city, country");

  if (city) query = query.eq("city", city);
  if (country) query = query.eq("country", country);

  const { data, error } = await query;
  if (error) {
    apiLogger.error("خطأ في جلب المناطق الجغرافية:", error);
    return [];
  }

  return data.map((zone): GeographicZone => ({
    id: zone.id,
    name: zone.name,
    description: zone.description || "",
    is_active: zone.is_active,
    area_polygon: typeof zone.area_polygon === "string" ? JSON.parse(zone.area_polygon) : zone.area_polygon as GeoJSONPolygon,
    center_point: typeof zone.center_point === "string" ? JSON.parse(zone.center_point) : zone.center_point as GeoJSONPoint,
    created_at: zone.created_at,
    updated_at: zone.updated_at,
  })) || [];
}

export async function addGeographicZone(
  zoneData: GeographicZoneFormData,
  areaPolygon: GeoJSONPolygon,
  centerPoint: GeoJSONPoint,
): Promise<GeographicZone | null> {
  try {
    const { data, error } = await supabase!
      .from("geographic_zones")
      .insert({
        name: zoneData.name,
        description: zoneData.description,
        area_polygon: areaPolygon,
        center_point: centerPoint,
        is_active: zoneData.is_active,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data as GeographicZone;
  } catch (error) {
    apiLogger.error("Error adding geographic zone:", error);
    return null;
  }
}

export async function deleteGeographicZone(zoneId: string): Promise<boolean> {
  const { error } = await supabase!
    .from("geographic_zones")
    .delete()
    .eq("id", zoneId);

  if (error) {
    apiLogger.error("Error deleting geographic zone:", error);
    return false;
  }
  return true;
}

export async function getGeographicZoneById(zoneId: string) {
  const response = await fetch(`/api/settings/geographic-zones?id=${zoneId}`);
  if (!response.ok) return null;
  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}
