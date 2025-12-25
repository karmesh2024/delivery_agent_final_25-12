/**
 * أنواع البيانات لنطاق الرحلات
 */

import { Json } from "@/lib/database.types";

// ملاحظة: سيتم إنشاء جدول الرحلات في المستقبل في قاعدة البيانات

// نوع حالة الرحلة
export type TripStatus = 
  | 'scheduled'  // مجدولة
  | 'in_progress' // قيد التنفيذ
  | 'completed'   // مكتملة
  | 'cancelled';  // ملغاة

// نوع أولوية الرحلة
export type TripPriority = 
  | 'low'     // منخفضة
  | 'medium'  // متوسطة
  | 'high';   // عالية

// نموذج الرحلة في التطبيق
export interface Trip {
  id: string;
  title: string;
  description: string;
  agentId: string;
  agentName?: string;
  status: TripStatus;
  priority: TripPriority;
  startTime: string;
  endTime?: string;
  startLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  endLocation?: {
    address: string;
    lat: number;
    lng: number;
  };
  distance?: number;
  duration?: number;
  orderIds: string[];
  vehicleId?: string;
  vehicleType?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// نموذج لإنشاء رحلة جديدة
export interface TripCreationData {
  title: string;
  description: string;
  agentId: string;
  status: TripStatus;
  priority: TripPriority;
  startTime: string;
  endTime?: string;
  startLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  endLocation?: {
    address: string;
    lat: number;
    lng: number;
  };
  orderIds: string[];
  vehicleId?: string;
  notes?: string;
}

// فلاتر الرحلات
export interface TripFilters {
  status?: TripStatus;
  agentId?: string;
  priority?: TripPriority;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

// حالة نطاق الرحلات في Redux
export interface TripsState {
  trips: Trip[];
  selectedTrip: Trip | null;
  filters: TripFilters;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  error: string | null;
  totalCount: number;
  page: number;
  limit: number;
}

// إحصائيات الرحلات
export interface TripStats {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalDistance: number;
  totalDuration: number;
}

// نوع أحداث الرحلة
export interface TripEvent {
  id: string;
  tripId: string;
  eventType: 'status_change' | 'location_update' | 'note_added' | 'agent_changed';
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// نوع مسار الرحلة
export interface TripRoute {
  tripId: string;
  waypoints: Array<{
    lat: number;
    lng: number;
    timestamp: string;
    address?: string;
  }>;
  polyline?: string;
}