export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // الجداول الأصلية من التطبيق الحالي
      agents: {
        Row: {
          id: string
          status: 'online' | 'offline' | 'busy'
          rating: number | null
          total_deliveries: number | null
          current_trip_id: string | null
          last_location: Json | null
          last_active: string | null
          fcm_token: string | null
          verified: boolean | null
        }
        Insert: {
          id: string
          status?: 'online' | 'offline' | 'busy'
          rating?: number | null
          total_deliveries?: number | null
          current_trip_id?: string | null
          last_location?: Json | null
          last_active?: string | null
          fcm_token?: string | null
          verified?: boolean | null
        }
        Update: {
          id?: string
          status?: 'online' | 'offline' | 'busy'
          rating?: number | null
          total_deliveries?: number | null
          current_trip_id?: string | null
          last_location?: Json | null
          last_active?: string | null
          fcm_token?: string | null
          verified?: boolean | null
        }
      }
      
      // جداول توصيل النفايات الجديدة
      delivery_boys: {
        Row: {
          id: string
          phone: string
          email: string | null
          full_name: string
          date_of_birth: string | null
          national_id: string | null
          preferred_vehicle: string | null
          license_number: string | null
          phone_verification_code: string | null
          phone_verification_status: string | null
          phone_verification_expires_at: string | null
          phone_verification_attempts: number | null
          delivery_code: string | null
          delivery_code_status: string | null
          delivery_code_expires_at: string | null
          delivery_code_attempts: number | null
          status: string | null
          total_deliveries: number | null
          total_earnings: number | null
          rating: number | null
          current_latitude: number | null
          current_longitude: number | null
          is_available: boolean | null
          last_location_update: string | null
          referral_code: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          last_login: string | null
        }
        Insert: {
          id: string
          phone: string
          email?: string | null
          full_name: string
          date_of_birth?: string | null
          national_id?: string | null
          preferred_vehicle?: string | null
          license_number?: string | null
          phone_verification_code?: string | null
          phone_verification_status?: string | null
          phone_verification_expires_at?: string | null
          phone_verification_attempts?: number | null
          delivery_code?: string | null
          delivery_code_status?: string | null
          delivery_code_expires_at?: string | null
          delivery_code_attempts?: number | null
          status?: string | null
          total_deliveries?: number | null
          total_earnings?: number | null
          rating?: number | null
          current_latitude?: number | null
          current_longitude?: number | null
          is_available?: boolean | null
          last_location_update?: string | null
          referral_code?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_login?: string | null
        }
        Update: {
          id?: string
          phone?: string
          email?: string | null
          full_name?: string
          date_of_birth?: string | null
          national_id?: string | null
          preferred_vehicle?: string | null
          license_number?: string | null
          phone_verification_code?: string | null
          phone_verification_status?: string | null
          phone_verification_expires_at?: string | null
          phone_verification_attempts?: number | null
          delivery_code?: string | null
          delivery_code_status?: string | null
          delivery_code_expires_at?: string | null
          delivery_code_attempts?: number | null
          status?: string | null
          total_deliveries?: number | null
          total_earnings?: number | null
          rating?: number | null
          current_latitude?: number | null
          current_longitude?: number | null
          is_available?: boolean | null
          last_location_update?: string | null
          referral_code?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_login?: string | null
        }
      }
      
      delivery_orders: {
        Row: {
          id: string
          delivery_boy_id: string | null
          customer_order_id: string | null
          order_number: string
          pickup_location: unknown // geometry type
          delivery_location: unknown // geometry type
          pickup_address: string
          delivery_address: string
          customer_name: string | null
          customer_phone: string | null
          estimated_distance: number | null
          estimated_time: number | null
          expected_total_amount: number | null
          actual_total_amount: number | null
          is_verified: boolean | null
          actual_pickup_time: string | null
          actual_delivery_time: string | null
          notes: string | null
          voice_notes: Json | null
          created_at: string | null
          updated_at: string | null
          order_id: string | null
          user_type: string | null
          status: string | null
          is_priority: boolean | null
          category_name: string | null
          subcategory_name: string | null
        }
        Insert: {
          id?: string
          delivery_boy_id?: string | null
          customer_order_id?: string | null
          order_number: string
          pickup_location: unknown // geometry type
          delivery_location: unknown // geometry type
          pickup_address: string
          delivery_address: string
          customer_name?: string | null
          customer_phone?: string | null
          estimated_distance?: number | null
          estimated_time?: number | null
          expected_total_amount?: number | null
          actual_total_amount?: number | null
          is_verified?: boolean | null
          actual_pickup_time?: string | null
          actual_delivery_time?: string | null
          notes?: string | null
          voice_notes?: Json | null
          created_at?: string | null
          updated_at?: string | null
          order_id?: string | null
          user_type?: string | null
          status?: string | null
          is_priority?: boolean | null
          category_name?: string | null
          subcategory_name?: string | null
        }
        Update: {
          id?: string
          delivery_boy_id?: string | null
          customer_order_id?: string | null
          order_number?: string
          pickup_location?: unknown // geometry type
          delivery_location?: unknown // geometry type
          pickup_address?: string
          delivery_address?: string
          customer_name?: string | null
          customer_phone?: string | null
          estimated_distance?: number | null
          estimated_time?: number | null
          expected_total_amount?: number | null
          actual_total_amount?: number | null
          is_verified?: boolean | null
          actual_pickup_time?: string | null
          actual_delivery_time?: string | null
          notes?: string | null
          voice_notes?: Json | null
          created_at?: string | null
          updated_at?: string | null
          order_id?: string | null
          user_type?: string | null
          status?: string | null
          is_priority?: boolean | null
          category_name?: string | null
          subcategory_name?: string | null
        }
      }
      
      customer_orders: {
        Row: {
          id: string
          payment_method: string | null
          status: string | null
          priority: string | null
          pickup_address: string
          pickup_location: unknown // geometry type
          expected_total: number | null
          actual_total: number | null
          is_fully_verified: boolean | null
          created_at: string | null
          updated_at: string | null
          earned_points: number | null
          customer_id: string | null
          profile_id: string | null
          order_details: Json | null
          category_name: string | null
          subcategory_name: string | null
        }
        Insert: {
          id?: string
          payment_method?: string | null
          status?: string | null
          priority?: string | null
          pickup_address: string
          pickup_location: unknown // geometry type
          expected_total?: number | null
          actual_total?: number | null
          is_fully_verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          earned_points?: number | null
          customer_id?: string | null
          profile_id?: string | null
          order_details?: Json | null
          category_name?: string | null
          subcategory_name?: string | null
        }
        Update: {
          id?: string
          payment_method?: string | null
          status?: string | null
          priority?: string | null
          pickup_address?: string
          pickup_location?: unknown // geometry type
          expected_total?: number | null
          actual_total?: number | null
          is_fully_verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          earned_points?: number | null
          customer_id?: string | null
          profile_id?: string | null
          order_details?: Json | null
          category_name?: string | null
          subcategory_name?: string | null
        }
      }
      
      order_details: {
        Row: {
          id: string
          order_id: string | null
          product_name: string
          quantity: number
          price: number
          earned_points: number | null
          notes: string | null
          created_at: string
          updated_at: string
          delivery_order_id: string | null
          category_name: string | null
          subcategory_name: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_name: string
          quantity: number
          price: number
          earned_points?: number | null
          notes?: string | null
          created_at: string
          updated_at: string
          delivery_order_id?: string | null
          category_name?: string | null
          subcategory_name?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          product_name?: string
          quantity?: number
          price?: number
          earned_points?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          delivery_order_id?: string | null
          category_name?: string | null
          subcategory_name?: string | null
        }
      }
      
      waste_collection_sessions: {
        Row: {
          id: string
          delivery_order_id: string
          delivery_boy_id: string
          customer_id: string
          status: string
          total_weight: number | null
          total_amount: number | null
          total_points: number | null
          started_at: string | null
          completed_at: string | null
          location_lat: number | null
          location_lng: number | null
          payment_method: string | null
          payment_status: string | null
          signature_url: string | null
          created_at: string
          updated_at: string
          customer_approval_status: string | null
          customer_approval_timestamp: string | null
          customer_comment: string | null
        }
        Insert: {
          id?: string
          delivery_order_id: string
          delivery_boy_id: string
          customer_id: string
          status?: string
          total_weight?: number | null
          total_amount?: number | null
          total_points?: number | null
          started_at?: string | null
          completed_at?: string | null
          location_lat?: number | null
          location_lng?: number | null
          payment_method?: string | null
          payment_status?: string | null
          signature_url?: string | null
          created_at?: string
          updated_at?: string
          customer_approval_status?: string | null
          customer_approval_timestamp?: string | null
          customer_comment?: string | null
        }
        Update: {
          id?: string
          delivery_order_id?: string
          delivery_boy_id?: string
          customer_id?: string
          status?: string
          total_weight?: number | null
          total_amount?: number | null
          total_points?: number | null
          started_at?: string | null
          completed_at?: string | null
          location_lat?: number | null
          location_lng?: number | null
          payment_method?: string | null
          payment_status?: string | null
          signature_url?: string | null
          created_at?: string
          updated_at?: string
          customer_approval_status?: string | null
          customer_approval_timestamp?: string | null
          customer_comment?: string | null
        }
      }
      
      waste_collection_items: {
        Row: {
          id: string
          session_id: string
          waste_data_id: string
          category_id: string
          subcategory_id: string | null
          name: string
          actual_weight: number
          unit_price: number
          total_price: number
          earned_points: number | null
          measurement_photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          waste_data_id: string
          category_id: string
          subcategory_id?: string | null
          name: string
          actual_weight: number
          unit_price: number
          total_price: number
          earned_points?: number | null
          measurement_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          waste_data_id?: string
          category_id?: string
          subcategory_id?: string | null
          name?: string
          actual_weight?: number
          unit_price?: number
          total_price?: number
          earned_points?: number | null
          measurement_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      waste_invoices: {
        Row: {
          id: string
          session_id: string
          invoice_number: string
          subtotal: number
          tax: number | null
          total: number
          status: string
          qr_code_url: string | null
          offline_code: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          order_id: string | null
          customer_approval_status: string | null
          customer_approval_timestamp: string | null
          customer_comment: string | null
          items: Json | null
        }
        Insert: {
          id?: string
          session_id: string
          invoice_number: string
          subtotal: number
          tax?: number | null
          total: number
          status?: string
          qr_code_url?: string | null
          offline_code?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          order_id?: string | null
          customer_approval_status?: string | null
          customer_approval_timestamp?: string | null
          customer_comment?: string | null
          items?: Json | null
        }
        Update: {
          id?: string
          session_id?: string
          invoice_number?: string
          subtotal?: number
          tax?: number | null
          total?: number
          status?: string
          qr_code_url?: string | null
          offline_code?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          order_id?: string | null
          customer_approval_status?: string | null
          customer_approval_timestamp?: string | null
          customer_comment?: string | null
          items?: Json | null
        }
      }
      
      // جداول أخرى من قاعدة بيانات توصيل النفايات
      order_tracking: {
        Row: {
          id: string
          order_id: string
          delivery_boy_id: string
          location: unknown | null // geometry type
          latitude: number
          longitude: number
          speed: number | null
          heading: number | null
          elevation: number | null
          status: string | null
          timestamp: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          order_id: string
          delivery_boy_id: string
          location?: unknown | null // geometry type
          latitude: number
          longitude: number
          speed?: number | null
          heading?: number | null
          elevation?: number | null
          status?: string | null
          timestamp?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          order_id?: string
          delivery_boy_id?: string
          location?: unknown | null // geometry type
          latitude?: number
          longitude?: number
          speed?: number | null
          heading?: number | null
          elevation?: number | null
          status?: string | null
          timestamp?: string | null
          metadata?: Json | null
        }
      }
    }
    
    Views: {
      [_ in never]: never
    }
    
    Functions: {
      update_agent_status: {
        Args: {
          agent_id: string
          new_status: string
        }
        Returns: {
          id: string
          status: string
          rating: number | null
          total_deliveries: number | null
          current_trip_id: string | null
          last_location: Json | null
          last_active: string | null
          fcm_token: string | null
          verified: boolean | null
        }
      }
      get_order_stats: {
        Args: Record<string, never>
        Returns: {
          avg_delivery_time: number
          pending: number
          total: number
          in_progress: number
          delivered: number
          canceled: number
          excellent_trips: number
        }
      }
    }
    
    Enums: {
      vehicle_type: 'motorcycle' | 'car' | 'bicycle' | 'truck'
      verification_status: 'pending' | 'verified' | 'rejected'
      delivery_boy_status: 'active' | 'inactive' | 'suspended' | 'off_duty'
      delivery_status_enum: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'canceled'
      user_type_enum: 'household' | 'business'
      customer_approval_status_enum: 'pending' | 'approved' | 'rejected'
    }
  }
}