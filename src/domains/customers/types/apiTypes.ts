// أنواع للبيانات القادمة من Supabase API

export interface SupabaseCustomerRecord {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone_number: string;
  customer_type: string;
  organization_name: string | null;
  contact_person: string | null;
  customer_status: string;
  wallet_id: string | null;
  preferred_language: string;
  total_orders: number;
  total_spent: number | string;
  loyalty_points: number;
  first_order_date: string | null;
  last_order_date: string | null;
  phone_verification_code: string | null;
  phone_verification_expires_at: string | null;
  phone_verification_attempts: number | null;
  is_available: boolean;
  last_location_update: string | null;
  voice_notes: Record<string, unknown>;
  rating: number | string;
  referral_code: string | null;
  notes: string | null;
  addresses: string | null;
  current_location: unknown | null;
  created_at: string;
  updated_at: string;
  default_address_id: string | null;
}

export interface SupabaseAddressRecord {
  id: string;
  profile_id: string;
  address_type: string;
  address_line: string;
  city: string | null;
  area: string | null;
  building_number: string | null;
  floor_number: string | null;
  apartment_number: string | null;
  additional_directions: string | null;
  landmark: string | null;
  latitude: number;
  longitude: number;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  street_address: string | null;
  geom: unknown | null;
}

export interface SupabasePhoneRecord {
  id: string;
  profile_id: string;
  phone_number: string;
  is_primary: boolean;
  is_verified: boolean;
  phone_verification_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseNewProfileRecord {
  id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  avatar_url: string | null;
  preferred_language: string;
  bio: string | null;
  date_of_birth: string | null;
  gender: string | null;
  notification_preferences: Record<string, unknown>;
  social_links: Record<string, unknown>;
  statistics: {
    rating: number;
    total_spent: number;
    total_orders: number;
    loyalty_points: number;
    last_order_date: string | null;
    first_order_date: string | null;
  };
  points: number;
  status: string;
  isaddresscomplete: boolean;
  created_at: string;
  updated_at: string;
  addresses: Record<string, unknown> | null;
  phone_numbers: Record<string, unknown> | null;
  profile_status: string;
  default_address_id: string | null;
}

export interface SupabaseCustomerOrderRecord {
  id: string;
  payment_method: string;
  priority: string;
  pickup_address: string;
  pickup_location: unknown;
  expected_total: number | string;
  actual_total: number | string;
  is_fully_verified: boolean;
  created_at: string;
  updated_at: string;
  earned_points: number | string;
  customer_id: string;
  profile_id: string;
  order_details: Record<string, unknown>;
  category_name: string;
  subcategory_name: string;
  status: string;
} 