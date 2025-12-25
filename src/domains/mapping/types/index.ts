import { Agent } from "@/types";

/**
 * موقع التسليم - يمثل نقطة على الخريطة لتسليم أو استلام طلب
 */
export interface DeliveryLocation {
  id: string;
  lat: number;
  lng: number;
  status: 'pending' | 'in_progress' | 'delivered' | 'canceled';
  address?: string;
  type: 'pickup' | 'delivery';
  label: string;
}

/**
 * نقطة تتبع - تمثل موقع المندوب في لحظة معينة
 */
export interface TrackingPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

/**
 * خصائص مكون الخريطة - تحدد البيانات والسلوك المطلوب للخريطة
 */
export interface MapComponentProps {
  agents?: Agent[];
  locations?: DeliveryLocation[];
  className?: string;
  onLocationClick?: (location: DeliveryLocation) => void;
  onAgentClick?: (agent: Agent) => void;
}