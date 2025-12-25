export type Coordinate = [number, number]; // [lng, lat]

// Assuming other types like GeoJSONPoint, GeoJSONPolygon, etc., are already defined and exported here.
// Make sure to keep existing type definitions.

export interface GeoJSONPoint {
  type: "Point";
  coordinates: Coordinate; // lng, lat
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: Coordinate[][]; // Array of linear rings, first is exterior.
}

export interface GeographicZoneFormData {
  name: string;
  description?: string;
  is_active: boolean;
  city?: string;
  country?: string;
  // area_polygon: GeoJSONPolygon; // Removed
  // center_point: GeoJSONPoint; // Removed
}

export interface GeographicZone extends GeographicZoneFormData {
  id: string;
  area_polygon: GeoJSONPolygon;
  center_point: GeoJSONPoint;
  created_at: string;
  updated_at: string;
}

// This type might be what comes directly from an API call if it differs slightly
export interface ApiGeographicZone extends Omit<GeographicZone, 'id' | 'created_at' | 'updated_at'> {
  id: string; // or number, depending on your API
  created_at?: string; // Optional if not always present
  updated_at?: string; // Optional if not always present
} 