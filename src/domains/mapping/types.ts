/**
 * types.ts - أنواع البيانات الخاصة بنطاق الخرائط
 */

// أنواع مواقع التوصيل
export interface DeliveryLocation {
  id: string;
  lat: number;
  lng: number;
  address: string;
  label?: string;
  type: 'pickup' | 'delivery';
  status?: 'pending' | 'in_progress' | 'delivered' | 'canceled';
} 