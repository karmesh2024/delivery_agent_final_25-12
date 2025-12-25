export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      actions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      admin_activity_log: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_documents: {
        Row: {
          admin_id: string
          created_at: string
          document_type: string
          document_url: string
          id: string
          notes: string | null
          updated_at: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string
          document_type: string
          document_url: string
          id?: string
          notes?: string | null
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string
          document_type?: string
          document_url?: string
          id?: string
          notes?: string | null
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_documents_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_group_members: {
        Row: {
          admin_id: string
          created_at: string
          group_id: string
          id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          group_id: string
          id?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          group_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_group_members_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "admin_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_groups: {
        Row: {
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_groups_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          is_used: boolean
          role_id: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          is_used?: boolean
          role_id?: string | null
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          is_used?: boolean
          role_id?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_invitations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_permissions_overrides: {
        Row: {
          admin_id: string
          created_at: string
          expires_at: string | null
          granted_by_admin_id: string | null
          id: string
          is_granted: boolean
          permission_id: string
          reason: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string
          expires_at?: string | null
          granted_by_admin_id?: string | null
          id?: string
          is_granted?: boolean
          permission_id: string
          reason?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string
          expires_at?: string | null
          granted_by_admin_id?: string | null
          id?: string
          is_granted?: boolean
          permission_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_permissions_overrides_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_permissions_overrides_granted_by_admin_id_fkey"
            columns: ["granted_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_permissions_overrides_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_system_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          reference_id: string | null
          reference_type: string | null
          status: string
          transaction_type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_wallet_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "admin_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_wallets: {
        Row: {
          admin_id: string
          balance: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          updated_at: string
          wallet_type: string
        }
        Insert: {
          admin_id: string
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          wallet_type?: string
        }
        Update: {
          admin_id?: string
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          wallet_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_wallets_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string
          department_id: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          job_title: string | null
          last_login: string | null
          manager_id: string | null
          permissions: Json | null
          phone: string | null
          profile_image_url: string | null
          role_id: string | null
          updated_at: string
          user_id: string | null
          username: string | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          last_login?: string | null
          manager_id?: string | null
          permissions?: Json | null
          phone?: string | null
          profile_image_url?: string | null
          role_id?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          last_login?: string | null
          manager_id?: string | null
          permissions?: Json | null
          phone?: string | null
          profile_image_url?: string | null
          role_id?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admins_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admins_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admins_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_collection_items: {
        Row: {
          collection_id: string
          created_at: string | null
          id: string
          price_per_unit: number | null
          quantity: number | null
          total_price: number | null
          unit: string | null
          updated_at: string | null
          waste_type: string
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          id?: string
          price_per_unit?: number | null
          quantity?: number | null
          total_price?: number | null
          unit?: string | null
          updated_at?: string | null
          waste_type: string
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          id?: string
          price_per_unit?: number | null
          quantity?: number | null
          total_price?: number | null
          unit?: string | null
          updated_at?: string | null
          waste_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_item_collection"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "agent_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_collections: {
        Row: {
          agent_id: string
          collection_date: string | null
          created_at: string | null
          id: string
          known_customer_id: string | null
          notes: string | null
          status: string | null
          total_weight: number | null
          unknown_customer_name: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          collection_date?: string | null
          created_at?: string | null
          id?: string
          known_customer_id?: string | null
          notes?: string | null
          status?: string | null
          total_weight?: number | null
          unknown_customer_name?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          collection_date?: string | null
          created_at?: string | null
          id?: string
          known_customer_id?: string | null
          notes?: string | null
          status?: string | null
          total_weight?: number | null
          unknown_customer_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_collection_agent"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_collection_known_customer"
            columns: ["known_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_details: {
        Row: {
          agent_type: string | null
          approved: boolean | null
          area_covered: string | null
          commission_rate: number | null
          created_at: string | null
          documents: Json | null
          id: string
          payment_method: string | null
          region: string | null
          storage_location: string | null
          updated_at: string | null
        }
        Insert: {
          agent_type?: string | null
          approved?: boolean | null
          area_covered?: string | null
          commission_rate?: number | null
          created_at?: string | null
          documents?: Json | null
          id: string
          payment_method?: string | null
          region?: string | null
          storage_location?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_type?: string | null
          approved?: boolean | null
          area_covered?: string | null
          commission_rate?: number | null
          created_at?: string | null
          documents?: Json | null
          id?: string
          payment_method?: string | null
          region?: string | null
          storage_location?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_agent_id"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_documents: {
        Row: {
          agent_id: string
          document_type: string
          document_url: string
          expiry_date: string | null
          id: string
          last_updated: string
          rejection_reason: string | null
          review_notes: string | null
          reviewer_id: string | null
          uploaded_at: string
          verification_status: string
        }
        Insert: {
          agent_id: string
          document_type: string
          document_url: string
          expiry_date?: string | null
          id?: string
          last_updated?: string
          rejection_reason?: string | null
          review_notes?: string | null
          reviewer_id?: string | null
          uploaded_at?: string
          verification_status?: string
        }
        Update: {
          agent_id?: string
          document_type?: string
          document_url?: string
          expiry_date?: string | null
          id?: string
          last_updated?: string
          rejection_reason?: string | null
          review_notes?: string | null
          reviewer_id?: string | null
          uploaded_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_documents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_profiles: {
        Row: {
          avatar_url: string | null
          billing_address: string | null
          created_at: string | null
          full_name: string | null
          id: string
          payment_info: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          billing_address?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          payment_info?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          billing_address?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          payment_info?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_agent_profiles_agent_id"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          commission_rate: number | null
          commission_type: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          profile_image_id: string | null
          updated_at: string | null
          wallet_id: string | null
        }
        Insert: {
          commission_rate?: number | null
          commission_type?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          profile_image_id?: string | null
          updated_at?: string | null
          wallet_id?: string | null
        }
        Update: {
          commission_rate?: number | null
          commission_type?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          profile_image_id?: string | null
          updated_at?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_profile_image_id_fkey"
            columns: ["profile_image_id"]
            isOneToOne: false
            referencedRelation: "agent_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agent_wallet"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_dashboard: {
        Row: {
          active_agents: number | null
          average_collection_efficiency: number | null
          average_delivery_time: number | null
          canceled_orders: number | null
          completed_orders: number | null
          created_at: string | null
          date: string
          id: string
          stats_by_area: Json | null
          stats_by_waste_type: Json | null
          total_orders: number | null
          total_revenue: number | null
          total_waste_collected: number | null
          updated_at: string | null
        }
        Insert: {
          active_agents?: number | null
          average_collection_efficiency?: number | null
          average_delivery_time?: number | null
          canceled_orders?: number | null
          completed_orders?: number | null
          created_at?: string | null
          date: string
          id?: string
          stats_by_area?: Json | null
          stats_by_waste_type?: Json | null
          total_orders?: number | null
          total_revenue?: number | null
          total_waste_collected?: number | null
          updated_at?: string | null
        }
        Update: {
          active_agents?: number | null
          average_collection_efficiency?: number | null
          average_delivery_time?: number | null
          canceled_orders?: number | null
          completed_orders?: number | null
          created_at?: string | null
          date?: string
          id?: string
          stats_by_area?: Json | null
          stats_by_waste_type?: Json | null
          total_orders?: number | null
          total_revenue?: number | null
          total_waste_collected?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      approval_workflows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          resource_type: string
          steps: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          resource_type: string
          steps: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          resource_type?: string
          steps?: Json
        }
        Relationships: []
      }
      approved_agent_zones: {
        Row: {
          agent_id: string | null
          created_at: string | null
          geographic_zone_id: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          zone_name: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          geographic_zone_id?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          zone_name: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          geographic_zone_id?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          zone_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "approved_agent_zones_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approved_agent_zones_geographic_zone_id_fkey"
            columns: ["geographic_zone_id"]
            isOneToOne: false
            referencedRelation: "geographic_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          address: string | null
          approved: boolean | null
          business_subtype:
            | Database["public"]["Enums"]["business_subtype_enum"]
            | null
          business_type: string | null
          commercial_registration_number: string | null
          company_name: string
          contact_person_name: string | null
          contact_phone: string | null
          created_at: string | null
          documents: Json | null
          id: string
          payment_method: string | null
          special_pricing: Json | null
          tax_number: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          approved?: boolean | null
          business_subtype?:
            | Database["public"]["Enums"]["business_subtype_enum"]
            | null
          business_type?: string | null
          commercial_registration_number?: string | null
          company_name: string
          contact_person_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          documents?: Json | null
          id: string
          payment_method?: string | null
          special_pricing?: Json | null
          tax_number?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          approved?: boolean | null
          business_subtype?:
            | Database["public"]["Enums"]["business_subtype_enum"]
            | null
          business_type?: string | null
          commercial_registration_number?: string | null
          company_name?: string
          contact_person_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          documents?: Json | null
          id?: string
          payment_method?: string | null
          special_pricing?: Json | null
          tax_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_business_customer"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      complaints: {
        Row: {
          client_id: string
          complaint_status: string | null
          complaint_text: string
          created_at: string | null
          id: number
          order_id: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          complaint_status?: string | null
          complaint_text: string
          created_at?: string | null
          id?: number
          order_id: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          complaint_status?: string | null
          complaint_text?: string
          created_at?: string | null
          id?: number
          order_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          admin_id: string | null
          conversation_id: string
          created_at: string | null
          customer_id: string | null
          delivery_boy_id: string | null
          id: string
          is_active: boolean | null
          is_muted: boolean | null
          joined_at: string | null
          last_read_time: string | null
          participant_type: string
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          conversation_id: string
          created_at?: string | null
          customer_id?: string | null
          delivery_boy_id?: string | null
          id?: string
          is_active?: boolean | null
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_time?: string | null
          participant_type: string
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          conversation_id?: string
          created_at?: string | null
          customer_id?: string | null
          delivery_boy_id?: string | null
          id?: string
          is_active?: boolean | null
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_time?: string | null
          participant_type?: string
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "active_delivery_boys_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          conversation_type: string
          created_at: string | null
          created_by: string
          created_by_type: string
          delivery_order_id: string | null
          id: string
          is_active: boolean | null
          last_message: string | null
          last_message_time: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          conversation_type?: string
          created_at?: string | null
          created_by: string
          created_by_type: string
          delivery_order_id?: string | null
          id?: string
          is_active?: boolean | null
          last_message?: string | null
          last_message_time?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          conversation_type?: string
          created_at?: string | null
          created_by?: string
          created_by_type?: string
          delivery_order_id?: string | null
          id?: string
          is_active?: boolean | null
          last_message?: string | null
          last_message_time?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_delivery_order_id_fkey"
            columns: ["delivery_order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          additional_directions: string | null
          address_line: string
          address_type: Database["public"]["Enums"]["address_type_enum"] | null
          apartment_number: string | null
          area: string | null
          building_number: string | null
          city: string | null
          created_at: string | null
          floor_number: string | null
          geom: unknown | null
          id: string
          is_default: boolean | null
          is_verified: boolean | null
          landmark: string | null
          latitude: number
          longitude: number
          profile_id: string | null
          street_address: string | null
          updated_at: string | null
        }
        Insert: {
          additional_directions?: string | null
          address_line: string
          address_type?: Database["public"]["Enums"]["address_type_enum"] | null
          apartment_number?: string | null
          area?: string | null
          building_number?: string | null
          city?: string | null
          created_at?: string | null
          floor_number?: string | null
          geom?: unknown | null
          id?: string
          is_default?: boolean | null
          is_verified?: boolean | null
          landmark?: string | null
          latitude: number
          longitude: number
          profile_id?: string | null
          street_address?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_directions?: string | null
          address_line?: string
          address_type?: Database["public"]["Enums"]["address_type_enum"] | null
          apartment_number?: string | null
          area?: string | null
          building_number?: string | null
          city?: string | null
          created_at?: string | null
          floor_number?: string | null
          geom?: unknown | null
          id?: string
          is_default?: boolean | null
          is_verified?: boolean | null
          landmark?: string | null
          latitude?: number
          longitude?: number
          profile_id?: string | null
          street_address?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "new_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_interactions: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string
          id: string
          is_read: boolean | null
          latitude: number | null
          location: unknown | null
          longitude: number | null
          message: string | null
          metadata: Json | null
          notification_channel: string | null
          order_id: string
          read_at: string | null
          scheduled_delivery_time: string | null
          scheduled_pickup_time: string | null
          status_from: string | null
          status_to: string | null
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          id?: string
          is_read?: boolean | null
          latitude?: number | null
          location?: unknown | null
          longitude?: number | null
          message?: string | null
          metadata?: Json | null
          notification_channel?: string | null
          order_id: string
          read_at?: string | null
          scheduled_delivery_time?: string | null
          scheduled_pickup_time?: string | null
          status_from?: string | null
          status_to?: string | null
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          id?: string
          is_read?: boolean | null
          latitude?: number | null
          location?: unknown | null
          longitude?: number | null
          message?: string | null
          metadata?: Json | null
          notification_channel?: string | null
          order_id?: string
          read_at?: string | null
          scheduled_delivery_time?: string | null
          scheduled_pickup_time?: string | null
          status_from?: string | null
          status_to?: string | null
          type?: Database["public"]["Enums"]["interaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "customer_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_delivery_boys_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "delivery_boys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "new_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_orders: {
        Row: {
          actual_total: number | null
          category_name: string | null
          created_at: string | null
          customer_id: string | null
          earned_points: number | null
          expected_total: number | null
          id: string
          is_fully_verified: boolean | null
          order_details: Json | null
          payment_amount: number | null
          payment_currency: string | null
          payment_metadata: Json | null
          payment_method:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          payment_method_id: string | null
          payment_status:
            | Database["public"]["Enums"]["order_payment_status_enum"]
            | null
          pickup_address: string
          pickup_location: unknown
          priority: Database["public"]["Enums"]["order_priority_enum"] | null
          profile_id: string | null
          status: Database["public"]["Enums"]["delivery_status_enum"] | null
          subcategory_name: string | null
          updated_at: string | null
          wallet_transaction_id: string | null
        }
        Insert: {
          actual_total?: number | null
          category_name?: string | null
          created_at?: string | null
          customer_id?: string | null
          earned_points?: number | null
          expected_total?: number | null
          id?: string
          is_fully_verified?: boolean | null
          order_details?: Json | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_metadata?: Json | null
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          payment_method_id?: string | null
          payment_status?:
            | Database["public"]["Enums"]["order_payment_status_enum"]
            | null
          pickup_address: string
          pickup_location: unknown
          priority?: Database["public"]["Enums"]["order_priority_enum"] | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status_enum"] | null
          subcategory_name?: string | null
          updated_at?: string | null
          wallet_transaction_id?: string | null
        }
        Update: {
          actual_total?: number | null
          category_name?: string | null
          created_at?: string | null
          customer_id?: string | null
          earned_points?: number | null
          expected_total?: number | null
          id?: string
          is_fully_verified?: boolean | null
          order_details?: Json | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_metadata?: Json | null
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          payment_method_id?: string | null
          payment_status?:
            | Database["public"]["Enums"]["order_payment_status_enum"]
            | null
          pickup_address?: string
          pickup_location?: unknown
          priority?: Database["public"]["Enums"]["order_priority_enum"] | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status_enum"] | null
          subcategory_name?: string | null
          updated_at?: string | null
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_orders_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "new_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_orders_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_phones: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          phone_number: string
          phone_verification_status:
            | Database["public"]["Enums"]["verification_status_enum"]
            | null
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          phone_number: string
          phone_verification_status?:
            | Database["public"]["Enums"]["verification_status_enum"]
            | null
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          phone_number?: string
          phone_verification_status?:
            | Database["public"]["Enums"]["verification_status_enum"]
            | null
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profile"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "new_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          addresses: string | null
          contact_person: string | null
          created_at: string | null
          current_location: unknown | null
          customer_status: Database["public"]["Enums"]["customer_status"] | null
          customer_type:
            | Database["public"]["Enums"]["customer_type_enum"]
            | null
          default_address_id: string | null
          email: string | null
          first_order_date: string | null
          full_name: string
          id: string
          is_available: boolean | null
          last_location_update: string | null
          last_order_date: string | null
          loyalty_points: number | null
          notes: string | null
          organization_name: string | null
          phone_number: string
          phone_verification_attempts: number | null
          phone_verification_code: string | null
          phone_verification_expires_at: string | null
          preferred_language: string | null
          rating: number | null
          referral_code: string | null
          tags: string[] | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string | null
          voice_notes: Json | null
          wallet_id: string | null
        }
        Insert: {
          addresses?: string | null
          contact_person?: string | null
          created_at?: string | null
          current_location?: unknown | null
          customer_status?:
            | Database["public"]["Enums"]["customer_status"]
            | null
          customer_type?:
            | Database["public"]["Enums"]["customer_type_enum"]
            | null
          default_address_id?: string | null
          email?: string | null
          first_order_date?: string | null
          full_name: string
          id: string
          is_available?: boolean | null
          last_location_update?: string | null
          last_order_date?: string | null
          loyalty_points?: number | null
          notes?: string | null
          organization_name?: string | null
          phone_number: string
          phone_verification_attempts?: number | null
          phone_verification_code?: string | null
          phone_verification_expires_at?: string | null
          preferred_language?: string | null
          rating?: number | null
          referral_code?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
          voice_notes?: Json | null
          wallet_id?: string | null
        }
        Update: {
          addresses?: string | null
          contact_person?: string | null
          created_at?: string | null
          current_location?: unknown | null
          customer_status?:
            | Database["public"]["Enums"]["customer_status"]
            | null
          customer_type?:
            | Database["public"]["Enums"]["customer_type_enum"]
            | null
          default_address_id?: string | null
          email?: string | null
          first_order_date?: string | null
          full_name?: string
          id?: string
          is_available?: boolean | null
          last_location_update?: string | null
          last_order_date?: string | null
          loyalty_points?: number | null
          notes?: string | null
          organization_name?: string | null
          phone_number?: string
          phone_verification_attempts?: number | null
          phone_verification_code?: string | null
          phone_verification_expires_at?: string | null
          preferred_language?: string | null
          rating?: number | null
          referral_code?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
          voice_notes?: Json | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_default_address_id_fkey"
            columns: ["default_address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_default_address"
            columns: ["default_address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      data_scopes: {
        Row: {
          admin_id: string | null
          condition: Json
          created_at: string
          created_by: string | null
          description: string | null
          group_id: string | null
          id: string
          is_active: boolean
          name: string
          resource_id: string
          role_id: string | null
        }
        Insert: {
          admin_id?: string | null
          condition: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          resource_id: string
          role_id?: string | null
        }
        Update: {
          admin_id?: string | null
          condition?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          resource_id?: string
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_scopes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_scopes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_scopes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "admin_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_scopes_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_scopes_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      delegated_permissions: {
        Row: {
          created_at: string
          end_date: string
          from_admin_id: string
          id: string
          is_active: boolean
          permission_id: string
          reason: string | null
          start_date: string
          to_admin_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          from_admin_id: string
          id?: string
          is_active?: boolean
          permission_id: string
          reason?: string | null
          start_date: string
          to_admin_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          from_admin_id?: string
          id?: string
          is_active?: boolean
          permission_id?: string
          reason?: string | null
          start_date?: string
          to_admin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delegated_permissions_from_admin_id_fkey"
            columns: ["from_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegated_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegated_permissions_to_admin_id_fkey"
            columns: ["to_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_boy_daily_performance: {
        Row: {
          average_rating: number | null
          created_at: string | null
          date: string
          delivery_boy_id: string
          id: string
          online_hours: number | null
          orders_canceled: number | null
          orders_completed: number | null
          total_distance: number | null
          total_earnings: number | null
          waste_weight_collected: number | null
        }
        Insert: {
          average_rating?: number | null
          created_at?: string | null
          date: string
          delivery_boy_id: string
          id?: string
          online_hours?: number | null
          orders_canceled?: number | null
          orders_completed?: number | null
          total_distance?: number | null
          total_earnings?: number | null
          waste_weight_collected?: number | null
        }
        Update: {
          average_rating?: number | null
          created_at?: string | null
          date?: string
          delivery_boy_id?: string
          id?: string
          online_hours?: number | null
          orders_canceled?: number | null
          orders_completed?: number | null
          total_distance?: number | null
          total_earnings?: number | null
          waste_weight_collected?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_boy_daily_performance_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "active_delivery_boys_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_boy_daily_performance_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_boy_order_history: {
        Row: {
          customer_rating: number | null
          delivery_boy_id: string | null
          delivery_distance: number | null
          delivery_location: string | null
          id: string
          order_date: string
          order_id: string | null
          order_status: string | null
          total_amount: number | null
        }
        Insert: {
          customer_rating?: number | null
          delivery_boy_id?: string | null
          delivery_distance?: number | null
          delivery_location?: string | null
          id: string
          order_date: string
          order_id?: string | null
          order_status?: string | null
          total_amount?: number | null
        }
        Update: {
          customer_rating?: number | null
          delivery_boy_id?: string | null
          delivery_distance?: number | null
          delivery_location?: string | null
          id?: string
          order_date?: string
          order_id?: string | null
          order_status?: string | null
          total_amount?: number | null
        }
        Relationships: []
      }
      delivery_boys: {
        Row: {
          average_response_time: number | null
          badge_level: number | null
          canceled_orders_count: number | null
          completed_orders_count: number | null
          created_at: string | null
          current_latitude: number | null
          current_longitude: number | null
          date_of_birth: string | null
          delivery_code: string | null
          delivery_code_attempts: number | null
          delivery_code_expires_at: string | null
          delivery_code_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          device_info: Json | null
          email: string | null
          full_name: string
          id: string
          identity_documents: Json | null
          is_available: boolean | null
          last_location_update: string | null
          last_login: string | null
          last_performance_review: string | null
          license_number: string | null
          license_photo_url: string | null
          national_id: string | null
          notes: string | null
          online_status:
            | Database["public"]["Enums"]["delivery_boy_online_status"]
            | null
          owner_id: string | null
          password_hash: string | null
          phone: string
          phone_verification_attempts: number | null
          phone_verification_code: string | null
          phone_verification_expires_at: string | null
          phone_verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          preferred_language: string | null
          preferred_vehicle: Database["public"]["Enums"]["vehicle_type"] | null
          preferred_zones: Json | null
          profile_image_url: string | null
          rating: number | null
          referral_code: string | null
          status: Database["public"]["Enums"]["delivery_boy_status"] | null
          status_changed_at: string | null
          status_reason: string | null
          total_deliveries: number | null
          total_earnings: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          average_response_time?: number | null
          badge_level?: number | null
          canceled_orders_count?: number | null
          completed_orders_count?: number | null
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          date_of_birth?: string | null
          delivery_code?: string | null
          delivery_code_attempts?: number | null
          delivery_code_expires_at?: string | null
          delivery_code_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          device_info?: Json | null
          email?: string | null
          full_name: string
          id: string
          identity_documents?: Json | null
          is_available?: boolean | null
          last_location_update?: string | null
          last_login?: string | null
          last_performance_review?: string | null
          license_number?: string | null
          license_photo_url?: string | null
          national_id?: string | null
          notes?: string | null
          online_status?:
            | Database["public"]["Enums"]["delivery_boy_online_status"]
            | null
          owner_id?: string | null
          password_hash?: string | null
          phone: string
          phone_verification_attempts?: number | null
          phone_verification_code?: string | null
          phone_verification_expires_at?: string | null
          phone_verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          preferred_language?: string | null
          preferred_vehicle?: Database["public"]["Enums"]["vehicle_type"] | null
          preferred_zones?: Json | null
          profile_image_url?: string | null
          rating?: number | null
          referral_code?: string | null
          status?: Database["public"]["Enums"]["delivery_boy_status"] | null
          status_changed_at?: string | null
          status_reason?: string | null
          total_deliveries?: number | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          average_response_time?: number | null
          badge_level?: number | null
          canceled_orders_count?: number | null
          completed_orders_count?: number | null
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          date_of_birth?: string | null
          delivery_code?: string | null
          delivery_code_attempts?: number | null
          delivery_code_expires_at?: string | null
          delivery_code_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          device_info?: Json | null
          email?: string | null
          full_name?: string
          id?: string
          identity_documents?: Json | null
          is_available?: boolean | null
          last_location_update?: string | null
          last_login?: string | null
          last_performance_review?: string | null
          license_number?: string | null
          license_photo_url?: string | null
          national_id?: string | null
          notes?: string | null
          online_status?:
            | Database["public"]["Enums"]["delivery_boy_online_status"]
            | null
          owner_id?: string | null
          password_hash?: string | null
          phone?: string
          phone_verification_attempts?: number | null
          phone_verification_code?: string | null
          phone_verification_expires_at?: string | null
          phone_verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          preferred_language?: string | null
          preferred_vehicle?: Database["public"]["Enums"]["vehicle_type"] | null
          preferred_zones?: Json | null
          profile_image_url?: string | null
          rating?: number | null
          referral_code?: string | null
          status?: Database["public"]["Enums"]["delivery_boy_status"] | null
          status_changed_at?: string | null
          status_reason?: string | null
          total_deliveries?: number | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      delivery_boys_insecure: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          delivery_code: string | null
          email: string | null
          full_name: string
          id: string
          is_available: boolean | null
          license_number: string | null
          national_id: string | null
          notes: string | null
          online_status: string | null
          phone: string
          phone_verification_status: string | null
          preferred_language: string | null
          preferred_vehicle: string | null
          preferred_zones: string | null
          rating: number | null
          referral_code: string | null
          status: string | null
          total_deliveries: number | null
          total_earnings: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          delivery_code?: string | null
          email?: string | null
          full_name: string
          id: string
          is_available?: boolean | null
          license_number?: string | null
          national_id?: string | null
          notes?: string | null
          online_status?: string | null
          phone: string
          phone_verification_status?: string | null
          preferred_language?: string | null
          preferred_vehicle?: string | null
          preferred_zones?: string | null
          rating?: number | null
          referral_code?: string | null
          status?: string | null
          total_deliveries?: number | null
          total_earnings?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          delivery_code?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_available?: boolean | null
          license_number?: string | null
          national_id?: string | null
          notes?: string | null
          online_status?: string | null
          phone?: string
          phone_verification_status?: string | null
          preferred_language?: string | null
          preferred_vehicle?: string | null
          preferred_zones?: string | null
          rating?: number | null
          referral_code?: string | null
          status?: string | null
          total_deliveries?: number | null
          total_earnings?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      delivery_documents: {
        Row: {
          delivery_id: string | null
          document_type: string
          document_url: string
          expiry_date: string | null
          id: string
          last_updated: string | null
          notes: string | null
          rejection_reason: string | null
          review_notes: string | null
          reviewer_id: string | null
          uploaded_at: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          delivery_id?: string | null
          document_type: string
          document_url: string
          expiry_date?: string | null
          id?: string
          last_updated?: string | null
          notes?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewer_id?: string | null
          uploaded_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          delivery_id?: string | null
          document_type?: string
          document_url?: string
          expiry_date?: string | null
          id?: string
          last_updated?: string | null
          notes?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewer_id?: string | null
          uploaded_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_documents_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "new_profiles_delivery"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_earnings: {
        Row: {
          amount: number
          bonus_amount: number | null
          created_at: string | null
          delivery_id: string | null
          earning_type: string | null
          id: string
          order_id: string
          paid_at: string | null
          status: string | null
        }
        Insert: {
          amount: number
          bonus_amount?: number | null
          created_at?: string | null
          delivery_id?: string | null
          earning_type?: string | null
          id?: string
          order_id: string
          paid_at?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          bonus_amount?: number | null
          created_at?: string | null
          delivery_id?: string | null
          earning_type?: string | null
          id?: string
          order_id?: string
          paid_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_earnings_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "new_profiles_delivery"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_locations: {
        Row: {
          delivery_id: string | null
          id: string
          latitude: number
          longitude: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          delivery_id?: string | null
          id?: string
          latitude: number
          longitude: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          delivery_id?: string | null
          id?: string
          latitude?: number
          longitude?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_locations_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "new_profiles_delivery"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_orders: {
        Row: {
          actual_delivery_time: string | null
          actual_pickup_time: string | null
          actual_total_amount: number | null
          analytics_data: Json | null
          category_name: string | null
          created_at: string | null
          customer_feedback: string | null
          customer_name: string | null
          customer_order_id: string | null
          customer_phone: string | null
          customer_waiting_time: number | null
          delivery_boy_id: string | null
          delivery_location: unknown | null
          delivery_route: Json | null
          estimated_distance: number | null
          estimated_time: number | null
          expected_total_amount: number | null
          id: string
          notes: string | null
          order_id: string | null
          order_number: string
          order_processing_time: number | null
          pickup_address: string
          pickup_location: unknown
          priority: Database["public"]["Enums"]["order_priority_enum"] | null
          status: Database["public"]["Enums"]["delivery_status_enum"] | null
          subcategory_name: string | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type_enum"]
          voice_notes: Json | null
        }
        Insert: {
          actual_delivery_time?: string | null
          actual_pickup_time?: string | null
          actual_total_amount?: number | null
          analytics_data?: Json | null
          category_name?: string | null
          created_at?: string | null
          customer_feedback?: string | null
          customer_name?: string | null
          customer_order_id?: string | null
          customer_phone?: string | null
          customer_waiting_time?: number | null
          delivery_boy_id?: string | null
          delivery_location?: unknown | null
          delivery_route?: Json | null
          estimated_distance?: number | null
          estimated_time?: number | null
          expected_total_amount?: number | null
          id?: string
          notes?: string | null
          order_id?: string | null
          order_number: string
          order_processing_time?: number | null
          pickup_address: string
          pickup_location: unknown
          priority?: Database["public"]["Enums"]["order_priority_enum"] | null
          status?: Database["public"]["Enums"]["delivery_status_enum"] | null
          subcategory_name?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type_enum"]
          voice_notes?: Json | null
        }
        Update: {
          actual_delivery_time?: string | null
          actual_pickup_time?: string | null
          actual_total_amount?: number | null
          analytics_data?: Json | null
          category_name?: string | null
          created_at?: string | null
          customer_feedback?: string | null
          customer_name?: string | null
          customer_order_id?: string | null
          customer_phone?: string | null
          customer_waiting_time?: number | null
          delivery_boy_id?: string | null
          delivery_location?: unknown | null
          delivery_route?: Json | null
          estimated_distance?: number | null
          estimated_time?: number | null
          expected_total_amount?: number | null
          id?: string
          notes?: string | null
          order_id?: string | null
          order_number?: string
          order_processing_time?: number | null
          pickup_address?: string
          pickup_location?: unknown
          priority?: Database["public"]["Enums"]["order_priority_enum"] | null
          status?: Database["public"]["Enums"]["delivery_status_enum"] | null
          subcategory_name?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type_enum"]
          voice_notes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_orders_customer_order_id_fkey"
            columns: ["customer_order_id"]
            isOneToOne: false
            referencedRelation: "customer_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_performance_stats: {
        Row: {
          average_delivery_time: number | null
          completed_orders: number | null
          delivery_boy_id: string | null
          id: string
          month: string
          total_distance: number | null
          total_orders: number | null
        }
        Insert: {
          average_delivery_time?: number | null
          completed_orders?: number | null
          delivery_boy_id?: string | null
          id?: string
          month: string
          total_distance?: number | null
          total_orders?: number | null
        }
        Update: {
          average_delivery_time?: number | null
          completed_orders?: number | null
          delivery_boy_id?: string | null
          id?: string
          month?: string
          total_distance?: number | null
          total_orders?: number | null
        }
        Relationships: []
      }
      delivery_ratings: {
        Row: {
          comment: string | null
          created_at: string | null
          customer_id: string
          delivery_id: string | null
          id: string
          order_id: string
          rating: number | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          customer_id: string
          delivery_id?: string | null
          id?: string
          order_id: string
          rating?: number | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string
          delivery_id?: string | null
          id?: string
          order_id?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_ratings_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "new_profiles_delivery"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_status_history: {
        Row: {
          created_at: string | null
          delivery_order_id: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["delivery_status_enum"]
        }
        Insert: {
          created_at?: string | null
          delivery_order_id?: string | null
          id?: string
          notes?: string | null
          status: Database["public"]["Enums"]["delivery_status_enum"]
        }
        Update: {
          created_at?: string | null
          delivery_order_id?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["delivery_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "delivery_status_history_delivery_order_id_fkey"
            columns: ["delivery_order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_vehicles: {
        Row: {
          assigned_agent_id: string | null
          capacity: number | null
          created_at: string | null
          fuel_efficiency: number | null
          id: string
          last_maintenance_date: string | null
          location: unknown | null
          maintenance_status: string | null
          next_maintenance_date: string | null
          registration_number: string
          status: string | null
          updated_at: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          assigned_agent_id?: string | null
          capacity?: number | null
          created_at?: string | null
          fuel_efficiency?: number | null
          id?: string
          last_maintenance_date?: string | null
          location?: unknown | null
          maintenance_status?: string | null
          next_maintenance_date?: string | null
          registration_number: string
          status?: string | null
          updated_at?: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          assigned_agent_id?: string | null
          capacity?: number | null
          created_at?: string | null
          fuel_efficiency?: number | null
          id?: string
          last_maintenance_date?: string | null
          location?: unknown | null
          maintenance_status?: string | null
          next_maintenance_date?: string | null
          registration_number?: string
          status?: string | null
          updated_at?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: [
          {
            foreignKeyName: "delivery_vehicles_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "active_delivery_boys_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_vehicles_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          created_at: string | null
          delivery_id: string
          geographic_zone_id: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          zone_name: string
        }
        Insert: {
          created_at?: string | null
          delivery_id: string
          geographic_zone_id?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          zone_name: string
        }
        Update: {
          created_at?: string | null
          delivery_id?: string
          geographic_zone_id?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          zone_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_geographic_zone_id_fkey"
            columns: ["geographic_zone_id"]
            isOneToOne: false
            referencedRelation: "geographic_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      department_wallets: {
        Row: {
          balance: number
          budget_limit: number | null
          budget_period: string | null
          created_at: string
          currency: string
          department_id: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          wallet_type: string
        }
        Insert: {
          balance?: number
          budget_limit?: number | null
          budget_period?: string | null
          created_at?: string
          currency?: string
          department_id: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          wallet_type?: string
        }
        Update: {
          balance?: number
          budget_limit?: number | null
          budget_period?: string | null
          created_at?: string
          currency?: string
          department_id?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          wallet_type?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          destination_wallet_id: string | null
          destination_wallet_type: string | null
          id: string
          notes: string | null
          reference_id: string | null
          reference_type: string | null
          requires_approval: boolean
          source_wallet_id: string | null
          source_wallet_type: string | null
          status: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          destination_wallet_id?: string | null
          destination_wallet_type?: string | null
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          requires_approval?: boolean
          source_wallet_id?: string | null
          source_wallet_type?: string | null
          status?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          destination_wallet_id?: string | null
          destination_wallet_type?: string | null
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          requires_approval?: boolean
          source_wallet_id?: string | null
          source_wallet_type?: string | null
          status?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      geographic_zones: {
        Row: {
          active_status: boolean | null
          agent_coverage: number | null
          area_polygon: unknown | null
          center_point: unknown | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          population_density: number | null
          updated_at: string | null
          waste_generation_rate: number | null
        }
        Insert: {
          active_status?: boolean | null
          agent_coverage?: number | null
          area_polygon?: unknown | null
          center_point?: unknown | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          population_density?: number | null
          updated_at?: string | null
          waste_generation_rate?: number | null
        }
        Update: {
          active_status?: boolean | null
          agent_coverage?: number | null
          area_polygon?: unknown | null
          center_point?: unknown | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          population_density?: number | null
          updated_at?: string | null
          waste_generation_rate?: number | null
        }
        Relationships: []
      }
      group_permissions: {
        Row: {
          created_at: string
          created_by: string | null
          group_id: string
          id: string
          permission_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          group_id: string
          id?: string
          permission_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          group_id?: string
          id?: string
          permission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "admin_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_details: {
        Row: {
          actual_quantity: number | null
          actual_total: number | null
          created_at: string | null
          customer_order_id: string
          expected_quantity: number
          expected_total: number | null
          id: string
          is_verified: boolean | null
          points: number | null
          product_name: string
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          actual_quantity?: number | null
          actual_total?: number | null
          created_at?: string | null
          customer_order_id: string
          expected_quantity: number
          expected_total?: number | null
          id?: string
          is_verified?: boolean | null
          points?: number | null
          product_name: string
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          actual_quantity?: number | null
          actual_total?: number | null
          created_at?: string | null
          customer_order_id?: string
          expected_quantity?: number
          expected_total?: number | null
          id?: string
          is_verified?: boolean | null
          points?: number | null
          product_name?: string
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_details_customer_order_id_fkey"
            columns: ["customer_order_id"]
            isOneToOne: false
            referencedRelation: "customer_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          message_type: string | null
          metadata: Json | null
          reply_to_id: string | null
          sender_admin_id: string | null
          sender_customer_id: string | null
          sender_delivery_boy_id: string | null
          sender_type: string
          sent_at: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          reply_to_id?: string | null
          sender_admin_id?: string | null
          sender_customer_id?: string | null
          sender_delivery_boy_id?: string | null
          sender_type: string
          sent_at?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          reply_to_id?: string | null
          sender_admin_id?: string | null
          sender_customer_id?: string | null
          sender_delivery_boy_id?: string | null
          sender_type?: string
          sent_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_customer_id_fkey"
            columns: ["sender_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_delivery_boy_id_fkey"
            columns: ["sender_delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "active_delivery_boys_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_delivery_boy_id_fkey"
            columns: ["sender_delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys"
            referencedColumns: ["id"]
          },
        ]
      }
      new_profiles: {
        Row: {
          addresses: Json | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          default_address_id: string | null
          email: string | null
          full_name: string
          gender: string | null
          id: string
          isaddresscomplete: boolean | null
          notification_preferences: Json | null
          phone_number: string
          phone_numbers: Json | null
          points: number | null
          preferred_language: string | null
          profile_status:
            | Database["public"]["Enums"]["profile_status_enum"]
            | null
          social_links: Json | null
          statistics: Json | null
          status: Database["public"]["Enums"]["profile_status_enum"] | null
          updated_at: string | null
        }
        Insert: {
          addresses?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          default_address_id?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          isaddresscomplete?: boolean | null
          notification_preferences?: Json | null
          phone_number: string
          phone_numbers?: Json | null
          points?: number | null
          preferred_language?: string | null
          profile_status?:
            | Database["public"]["Enums"]["profile_status_enum"]
            | null
          social_links?: Json | null
          statistics?: Json | null
          status?: Database["public"]["Enums"]["profile_status_enum"] | null
          updated_at?: string | null
        }
        Update: {
          addresses?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          default_address_id?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          isaddresscomplete?: boolean | null
          notification_preferences?: Json | null
          phone_number?: string
          phone_numbers?: Json | null
          points?: number | null
          preferred_language?: string | null
          profile_status?:
            | Database["public"]["Enums"]["profile_status_enum"]
            | null
          social_links?: Json | null
          statistics?: Json | null
          status?: Database["public"]["Enums"]["profile_status_enum"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "new_profiles_default_address_id_fkey"
            columns: ["default_address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "new_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      new_profiles_delivery: {
        Row: {
          created_at: string | null
          delivery_code: string | null
          delivery_code_attempts: number | null
          delivery_code_expires_at: string | null
          delivery_code_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          email: string | null
          full_name: string
          id: string
          is_available: boolean | null
          last_login: string | null
          license_number: string | null
          national_id: string
          owner_id: string | null
          phone: string
          phone_verification_attempts: number | null
          phone_verification_code: string | null
          phone_verification_expires_at: string | null
          phone_verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          preferred_language: string | null
          preferred_vehicle: Database["public"]["Enums"]["vehicle_type"]
          profile_image_url: string | null
          rating: number | null
          referral_code: string | null
          status: Database["public"]["Enums"]["delivery_boy_status"] | null
          total_deliveries: number | null
          total_earnings: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_code?: string | null
          delivery_code_attempts?: number | null
          delivery_code_expires_at?: string | null
          delivery_code_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          email?: string | null
          full_name: string
          id: string
          is_available?: boolean | null
          last_login?: string | null
          license_number?: string | null
          national_id: string
          owner_id?: string | null
          phone: string
          phone_verification_attempts?: number | null
          phone_verification_code?: string | null
          phone_verification_expires_at?: string | null
          phone_verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          preferred_language?: string | null
          preferred_vehicle: Database["public"]["Enums"]["vehicle_type"]
          profile_image_url?: string | null
          rating?: number | null
          referral_code?: string | null
          status?: Database["public"]["Enums"]["delivery_boy_status"] | null
          total_deliveries?: number | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_code?: string | null
          delivery_code_attempts?: number | null
          delivery_code_expires_at?: string | null
          delivery_code_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          email?: string | null
          full_name?: string
          id?: string
          is_available?: boolean | null
          last_login?: string | null
          license_number?: string | null
          national_id?: string
          owner_id?: string | null
          phone?: string
          phone_verification_attempts?: number | null
          phone_verification_code?: string | null
          phone_verification_expires_at?: string | null
          phone_verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          preferred_language?: string | null
          preferred_vehicle?: Database["public"]["Enums"]["vehicle_type"]
          profile_image_url?: string | null
          rating?: number | null
          referral_code?: string | null
          status?: Database["public"]["Enums"]["delivery_boy_status"] | null
          total_deliveries?: number | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      onboarding_data: {
        Row: {
          body: string
          created_at: string
          id: number
          image_url: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: number
          image_url: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: number
          image_url?: string
          title?: string
        }
        Relationships: []
      }
      order_details: {
        Row: {
          category_name: string | null
          created_at: string
          delivery_order_id: string | null
          earned_points: number | null
          id: string
          notes: string | null
          order_id: string | null
          price: number
          product_name: string
          quantity: number
          subcategory_name: string | null
          updated_at: string
        }
        Insert: {
          category_name?: string | null
          created_at?: string
          delivery_order_id?: string | null
          earned_points?: number | null
          id?: string
          notes?: string | null
          order_id?: string | null
          price: number
          product_name: string
          quantity: number
          subcategory_name?: string | null
          updated_at?: string
        }
        Update: {
          category_name?: string | null
          created_at?: string
          delivery_order_id?: string | null
          earned_points?: number | null
          id?: string
          notes?: string | null
          order_id?: string | null
          price?: number
          product_name?: string
          quantity?: number
          subcategory_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_details_customer"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "customer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_details_delivery"
            columns: ["delivery_order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_schedule: {
        Row: {
          actual_delivery_time: string | null
          actual_pickup_time: string | null
          created_at: string | null
          customer_notified: boolean | null
          delivery_reminder_sent: boolean | null
          id: string
          metadata: Json | null
          notes: string | null
          order_id: string
          pickup_reminder_sent: boolean | null
          scheduled_delivery_time: string | null
          scheduled_pickup_time: string
          status: Database["public"]["Enums"]["schedule_status"] | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery_time?: string | null
          actual_pickup_time?: string | null
          created_at?: string | null
          customer_notified?: boolean | null
          delivery_reminder_sent?: boolean | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_id: string
          pickup_reminder_sent?: boolean | null
          scheduled_delivery_time?: string | null
          scheduled_pickup_time: string
          status?: Database["public"]["Enums"]["schedule_status"] | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery_time?: string | null
          actual_pickup_time?: string | null
          created_at?: string | null
          customer_notified?: boolean | null
          delivery_reminder_sent?: boolean | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_id?: string
          pickup_reminder_sent?: boolean | null
          scheduled_delivery_time?: string | null
          scheduled_pickup_time?: string
          status?: Database["public"]["Enums"]["schedule_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_schedule_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_tracking: {
        Row: {
          active_status:
            | Database["public"]["Enums"]["delivery_boy_status"]
            | null
          available_for_orders: boolean | null
          delivery_boy_id: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          order_id: string
          speed: number | null
          status:
            | Database["public"]["Enums"]["delivery_boy_online_status"]
            | null
          timestamp: string | null
        }
        Insert: {
          active_status?:
            | Database["public"]["Enums"]["delivery_boy_status"]
            | null
          available_for_orders?: boolean | null
          delivery_boy_id: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          order_id: string
          speed?: number | null
          status?:
            | Database["public"]["Enums"]["delivery_boy_online_status"]
            | null
          timestamp?: string | null
        }
        Update: {
          active_status?:
            | Database["public"]["Enums"]["delivery_boy_status"]
            | null
          available_for_orders?: boolean | null
          delivery_boy_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          order_id?: string
          speed?: number | null
          status?:
            | Database["public"]["Enums"]["delivery_boy_online_status"]
            | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_tracking_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "active_delivery_boys_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_tracking_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          code: string
          created_at: string
          description: string | null
          details_schema: Json | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          requires_user_details: boolean
          type: Database["public"]["Enums"]["payment_method_type_enum"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          details_schema?: Json | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          requires_user_details?: boolean
          type: Database["public"]["Enums"]["payment_method_type_enum"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          details_schema?: Json | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          requires_user_details?: boolean
          type?: Database["public"]["Enums"]["payment_method_type_enum"]
          updated_at?: string
        }
        Relationships: []
      }
      payment_qr_codes: {
        Row: {
          amount: number
          created_at: string
          creator_id: string
          currency: string
          expires_at: string
          id: string
          metadata: Json | null
          order_id: string | null
          recipient_id: string
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_id: string | null
          updated_at: string
          verification_code: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          creator_id: string
          currency?: string
          expires_at: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          recipient_id: string
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_id?: string | null
          updated_at?: string
          verification_code?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          creator_id?: string
          currency?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          recipient_id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_id?: string | null
          updated_at?: string
          verification_code?: string | null
        }
        Relationships: []
      }
      payment_settlements: {
        Row: {
          amount_settled: number
          created_at: string | null
          id: number
          representative_id: string
          settlement_date: string | null
          updated_at: string | null
        }
        Insert: {
          amount_settled: number
          created_at?: string | null
          id?: number
          representative_id: string
          settlement_date?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_settled?: number
          created_at?: string | null
          id?: number
          representative_id?: string
          settlement_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          admin_approver_id: string | null
          admin_notes: string | null
          amount_approved: number | null
          amount_requested: number
          created_at: string
          currency: string
          id: string
          payout_to_user_payment_method_id: string
          processed_at: string | null
          related_transaction_id: string | null
          requested_at: string
          status: Database["public"]["Enums"]["payout_status_enum"]
          transaction_reference: string | null
          updated_at: string
          user_id: string
          user_notes: string | null
          wallet_id: string
          wallet_transaction_id: string | null
        }
        Insert: {
          admin_approver_id?: string | null
          admin_notes?: string | null
          amount_approved?: number | null
          amount_requested: number
          created_at?: string
          currency?: string
          id?: string
          payout_to_user_payment_method_id: string
          processed_at?: string | null
          related_transaction_id?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status_enum"]
          transaction_reference?: string | null
          updated_at?: string
          user_id: string
          user_notes?: string | null
          wallet_id: string
          wallet_transaction_id?: string | null
        }
        Update: {
          admin_approver_id?: string | null
          admin_notes?: string | null
          amount_approved?: number | null
          amount_requested?: number
          created_at?: string
          currency?: string
          id?: string
          payout_to_user_payment_method_id?: string
          processed_at?: string | null
          related_transaction_id?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status_enum"]
          transaction_reference?: string | null
          updated_at?: string
          user_id?: string
          user_notes?: string | null
          wallet_id?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_payouts_related_transaction_id"
            columns: ["related_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "payouts_payout_to_user_payment_method_id_fkey"
            columns: ["payout_to_user_payment_method_id"]
            isOneToOne: false
            referencedRelation: "user_payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_audit_log: {
        Row: {
          action_type: string
          changed_at: string
          changed_by: string | null
          entity_id: string
          entity_type: string
          id: string
          new_value: Json | null
          old_value: Json | null
          permission_id: string
        }
        Insert: {
          action_type: string
          changed_at?: string
          changed_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          permission_id: string
        }
        Update: {
          action_type?: string
          changed_at?: string
          changed_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          permission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_audit_log_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_scopes: {
        Row: {
          created_at: string
          id: string
          name: string
          scope_type: string
          scope_value: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          scope_type: string
          scope_value?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          scope_type?: string
          scope_value?: Json | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action_id: string
          code: string
          created_at: string
          description: string | null
          id: string
          name: string | null
          resource_id: string
          updated_at: string | null
        }
        Insert: {
          action_id: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          resource_id: string
          updated_at?: string | null
        }
        Update: {
          action_id?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          resource_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permissions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permissions_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_requests: {
        Row: {
          agent_id: string
          created_at: string | null
          driver_id: string | null
          id: string
          notes: string | null
          requested_at: string | null
          scheduled_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          requested_at?: string | null
          scheduled_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          requested_at?: string | null
          scheduled_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pickup_agent"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pickup_driver"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "active_delivery_boys_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pickup_driver"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          level: number
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          level?: number
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          level?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      scoped_permissions: {
        Row: {
          admin_id: string | null
          created_at: string
          group_id: string | null
          id: string
          permission_id: string
          role_id: string | null
          scope_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          permission_id: string
          role_id?: string | null
          scope_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          permission_id?: string
          role_id?: string | null
          scope_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoped_permissions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoped_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "admin_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoped_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoped_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoped_permissions_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "permission_scopes"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          points_per_kg: number | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          points_per_kg?: number | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          points_per_kg?: number | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      system_notifications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          target_role: string | null
          target_user_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          target_role?: string | null
          target_user_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          target_role?: string | null
          target_user_id?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      system_wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          wallet_type: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          wallet_type: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          wallet_type?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          currency: string
          description: string | null
          initiated_by_user_id: string | null
          initiator_type: string | null
          order_id: string | null
          payment_method: string | null
          payout_request_id: string | null
          provider_transaction_id: string | null
          status: string
          transaction_id: string
          type: Database["public"]["Enums"]["transaction_type_enum"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          initiated_by_user_id?: string | null
          initiator_type?: string | null
          order_id?: string | null
          payment_method?: string | null
          payout_request_id?: string | null
          provider_transaction_id?: string | null
          status?: string
          transaction_id?: string
          type: Database["public"]["Enums"]["transaction_type_enum"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          initiated_by_user_id?: string | null
          initiator_type?: string | null
          order_id?: string | null
          payment_method?: string | null
          payout_request_id?: string | null
          provider_transaction_id?: string | null
          status?: string
          transaction_id?: string
          type?: Database["public"]["Enums"]["transaction_type_enum"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_transactions_payout_request_id"
            columns: ["payout_request_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_login_history: {
        Row: {
          created_at: string | null
          device_info: Json | null
          id: string
          ip_address: string | null
          login_time: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          login_time?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          login_time?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_login_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_payment_methods: {
        Row: {
          created_at: string
          details: Json
          id: string
          is_default: boolean
          payment_method_id: string
          status: Database["public"]["Enums"]["item_status_enum"]
          updated_at: string
          user_id: string
          verification_notes: string | null
        }
        Insert: {
          created_at?: string
          details: Json
          id?: string
          is_default?: boolean
          payment_method_id: string
          status?: Database["public"]["Enums"]["item_status_enum"]
          updated_at?: string
          user_id: string
          verification_notes?: string | null
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          is_default?: boolean
          payment_method_id?: string
          status?: Database["public"]["Enums"]["item_status_enum"]
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_payment_methods_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department_id: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          role: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          role?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          role?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_maintenance_log: {
        Row: {
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          maintenance_type: string
          next_maintenance_date: string | null
          notes: string | null
          performed_at: string
          performed_by: string | null
          vehicle_id: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          maintenance_type: string
          next_maintenance_date?: string | null
          notes?: string | null
          performed_at: string
          performed_by?: string | null
          vehicle_id?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          maintenance_type?: string
          next_maintenance_date?: string | null
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenance_log_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "delivery_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_permissions: {
        Row: {
          admin_id: string | null
          can_approve: boolean
          can_deposit: boolean
          can_transfer: boolean
          can_view: boolean
          can_withdraw: boolean
          created_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          role_id: string | null
          transaction_limit: number | null
          updated_at: string
          valid_from: string
          valid_until: string | null
          wallet_id: string
          wallet_type: string
        }
        Insert: {
          admin_id?: string | null
          can_approve?: boolean
          can_deposit?: boolean
          can_transfer?: boolean
          can_view?: boolean
          can_withdraw?: boolean
          created_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          role_id?: string | null
          transaction_limit?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
          wallet_id: string
          wallet_type: string
        }
        Update: {
          admin_id?: string | null
          can_approve?: boolean
          can_deposit?: boolean
          can_transfer?: boolean
          can_view?: boolean
          can_withdraw?: boolean
          created_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          role_id?: string | null
          transaction_limit?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
          wallet_id?: string
          wallet_type?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          balance_before: number | null
          created_at: string
          currency: string
          description: string | null
          external_transaction_id: string | null
          id: string
          initiated_by_user_id: string | null
          metadata: Json | null
          related_order_id: string | null
          related_payout_id: string | null
          related_user_payment_method_id: string | null
          source_general_transaction_id: string | null
          status: Database["public"]["Enums"]["transaction_status_enum"]
          transaction_type: Database["public"]["Enums"]["transaction_type_enum"]
          updated_at: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          external_transaction_id?: string | null
          id?: string
          initiated_by_user_id?: string | null
          metadata?: Json | null
          related_order_id?: string | null
          related_payout_id?: string | null
          related_user_payment_method_id?: string | null
          source_general_transaction_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status_enum"]
          transaction_type: Database["public"]["Enums"]["transaction_type_enum"]
          updated_at?: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          external_transaction_id?: string | null
          id?: string
          initiated_by_user_id?: string | null
          metadata?: Json | null
          related_order_id?: string | null
          related_payout_id?: string | null
          related_user_payment_method_id?: string | null
          source_general_transaction_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status_enum"]
          transaction_type?: Database["public"]["Enums"]["transaction_type_enum"]
          updated_at?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_wallet_transactions_source_general_transaction"
            columns: ["source_general_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          cash_on_hand: number | null
          collected_materials_value: number | null
          created_at: string
          currency: string
          id: string
          status: Database["public"]["Enums"]["item_status_enum"]
          updated_at: string
          user_id: string | null
          wallet_type: Database["public"]["Enums"]["wallet_type_enum"]
        }
        Insert: {
          balance?: number
          cash_on_hand?: number | null
          collected_materials_value?: number | null
          created_at?: string
          currency?: string
          id?: string
          status?: Database["public"]["Enums"]["item_status_enum"]
          updated_at?: string
          user_id?: string | null
          wallet_type: Database["public"]["Enums"]["wallet_type_enum"]
        }
        Update: {
          balance?: number
          cash_on_hand?: number | null
          collected_materials_value?: number | null
          created_at?: string
          currency?: string
          id?: string
          status?: Database["public"]["Enums"]["item_status_enum"]
          updated_at?: string
          user_id?: string | null
          wallet_type?: Database["public"]["Enums"]["wallet_type_enum"]
        }
        Relationships: []
      }
      waste_collection_items: {
        Row: {
          actual_weight: number
          category_id: string
          created_at: string
          earned_points: number | null
          id: string
          measurement_photo_url: string | null
          name: string
          session_id: string
          subcategory_id: string | null
          total_price: number
          unit_price: number
          updated_at: string
          waste_data_id: string
        }
        Insert: {
          actual_weight: number
          category_id: string
          created_at?: string
          earned_points?: number | null
          id?: string
          measurement_photo_url?: string | null
          name: string
          session_id: string
          subcategory_id?: string | null
          total_price: number
          unit_price: number
          updated_at?: string
          waste_data_id: string
        }
        Update: {
          actual_weight?: number
          category_id?: string
          created_at?: string
          earned_points?: number | null
          id?: string
          measurement_photo_url?: string | null
          name?: string
          session_id?: string
          subcategory_id?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string
          waste_data_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waste_collection_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_collection_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "waste_collection_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_collection_items_waste_data_id_fkey"
            columns: ["waste_data_id"]
            isOneToOne: false
            referencedRelation: "waste_data_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_collection_sessions: {
        Row: {
          collection_efficiency: number | null
          collection_notes: string | null
          completed_at: string | null
          created_at: string
          customer_approval_status:
            | Database["public"]["Enums"]["customer_approval_status_enum"]
            | null
          customer_approval_timestamp: string | null
          customer_comment: string | null
          customer_id: string
          delivery_boy_id: string
          delivery_order_id: string
          id: string
          location_lat: number | null
          location_lng: number | null
          payment_method: string | null
          payment_status: string | null
          photos: Json | null
          quality_score: number | null
          signature_url: string | null
          started_at: string | null
          status: string
          total_amount: number | null
          total_points: number | null
          total_weight: number | null
          updated_at: string
        }
        Insert: {
          collection_efficiency?: number | null
          collection_notes?: string | null
          completed_at?: string | null
          created_at?: string
          customer_approval_status?:
            | Database["public"]["Enums"]["customer_approval_status_enum"]
            | null
          customer_approval_timestamp?: string | null
          customer_comment?: string | null
          customer_id: string
          delivery_boy_id: string
          delivery_order_id: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          payment_method?: string | null
          payment_status?: string | null
          photos?: Json | null
          quality_score?: number | null
          signature_url?: string | null
          started_at?: string | null
          status?: string
          total_amount?: number | null
          total_points?: number | null
          total_weight?: number | null
          updated_at?: string
        }
        Update: {
          collection_efficiency?: number | null
          collection_notes?: string | null
          completed_at?: string | null
          created_at?: string
          customer_approval_status?:
            | Database["public"]["Enums"]["customer_approval_status_enum"]
            | null
          customer_approval_timestamp?: string | null
          customer_comment?: string | null
          customer_id?: string
          delivery_boy_id?: string
          delivery_order_id?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          payment_method?: string | null
          payment_status?: string | null
          photos?: Json | null
          quality_score?: number | null
          signature_url?: string | null
          started_at?: string | null
          status?: string
          total_amount?: number | null
          total_points?: number | null
          total_weight?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waste_collection_sessions_delivery_order_id_fkey"
            columns: ["delivery_order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_data_admin: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          initial_points: number
          name: string
          points: number
          price: number
          quantity: number
          subcategory_id: string | null
          updated_at: string | null
          weight: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          initial_points: number
          name: string
          points: number
          price: number
          quantity: number
          subcategory_id?: string | null
          updated_at?: string | null
          weight: number
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          initial_points?: number
          name?: string
          points?: number
          price?: number
          quantity?: number
          subcategory_id?: string | null
          updated_at?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "waste_data_admin_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_data_admin_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_invoices: {
        Row: {
          created_at: string
          created_by: string | null
          customer_approval_status:
            | Database["public"]["Enums"]["customer_approval_status_enum"]
            | null
          customer_approval_timestamp: string | null
          customer_comment: string | null
          id: string
          invoice_number: string
          items: Json | null
          offline_code: string | null
          order_id: string | null
          qr_code_url: string | null
          session_id: string
          status: string
          subtotal: number
          tax: number | null
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_approval_status?:
            | Database["public"]["Enums"]["customer_approval_status_enum"]
            | null
          customer_approval_timestamp?: string | null
          customer_comment?: string | null
          id?: string
          invoice_number: string
          items?: Json | null
          offline_code?: string | null
          order_id?: string | null
          qr_code_url?: string | null
          session_id: string
          status?: string
          subtotal: number
          tax?: number | null
          total: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_approval_status?:
            | Database["public"]["Enums"]["customer_approval_status_enum"]
            | null
          customer_approval_timestamp?: string | null
          customer_comment?: string | null
          id?: string
          invoice_number?: string
          items?: Json | null
          offline_code?: string | null
          order_id?: string | null
          qr_code_url?: string | null
          session_id?: string
          status?: string
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waste_invoices_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "waste_collection_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_recycling: {
        Row: {
          created_at: string | null
          id: number
          image_url: string
          name: string
          points: number
          price: number
          quantity: number | null
          updated_at: string | null
          weight: number
        }
        Insert: {
          created_at?: string | null
          id?: never
          image_url: string
          name: string
          points: number
          price: number
          quantity?: number | null
          updated_at?: string | null
          weight: number
        }
        Update: {
          created_at?: string | null
          id?: never
          image_url?: string
          name?: string
          points?: number
          price?: number
          quantity?: number | null
          updated_at?: string | null
          weight?: number
        }
        Relationships: []
      }
      waste_weights: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_per_kg: number
          waste_type: Database["public"]["Enums"]["waste_type"]
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_per_kg: number
          waste_type: Database["public"]["Enums"]["waste_type"]
          weight: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_per_kg?: number
          waste_type?: Database["public"]["Enums"]["waste_type"]
          weight?: number
        }
        Relationships: []
      }
    }
    Views: {
      active_delivery_boys_view: {
        Row: {
          badge_level: number | null
          current_latitude: number | null
          current_longitude: number | null
          current_order_id: string | null
          current_order_number: string | null
          current_order_status:
            | Database["public"]["Enums"]["delivery_status_enum"]
            | null
          email: string | null
          full_name: string | null
          id: string | null
          is_available: boolean | null
          last_location_update: string | null
          license_number: string | null
          online_status:
            | Database["public"]["Enums"]["delivery_boy_online_status"]
            | null
          phone: string | null
          preferred_vehicle: Database["public"]["Enums"]["vehicle_type"] | null
          profile_image_url: string | null
          rating: number | null
          status: Database["public"]["Enums"]["delivery_boy_status"] | null
          total_deliveries: number | null
          total_earnings: number | null
        }
        Insert: {
          badge_level?: number | null
          current_latitude?: number | null
          current_longitude?: number | null
          current_order_id?: never
          current_order_number?: never
          current_order_status?: never
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_available?: boolean | null
          last_location_update?: string | null
          license_number?: string | null
          online_status?:
            | Database["public"]["Enums"]["delivery_boy_online_status"]
            | null
          phone?: string | null
          preferred_vehicle?: Database["public"]["Enums"]["vehicle_type"] | null
          profile_image_url?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["delivery_boy_status"] | null
          total_deliveries?: number | null
          total_earnings?: number | null
        }
        Update: {
          badge_level?: number | null
          current_latitude?: number | null
          current_longitude?: number | null
          current_order_id?: never
          current_order_number?: never
          current_order_status?: never
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_available?: boolean | null
          last_location_update?: string | null
          license_number?: string | null
          online_status?:
            | Database["public"]["Enums"]["delivery_boy_online_status"]
            | null
          phone?: string | null
          preferred_vehicle?: Database["public"]["Enums"]["vehicle_type"] | null
          profile_image_url?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["delivery_boy_status"] | null
          total_deliveries?: number | null
          total_earnings?: number | null
        }
        Relationships: []
      }
      tracking_points_with_details: {
        Row: {
          customer_name: string | null
          customer_order_id: string | null
          customer_phone: string | null
          delivery_boy_id: string | null
          delivery_boy_name: string | null
          delivery_boy_phone: string | null
          delivery_location: unknown | null
          estimated_distance: number | null
          estimated_time: number | null
          heading: number | null
          id: string | null
          latitude: number | null
          longitude: number | null
          order_id: string | null
          order_number: string | null
          order_status:
            | Database["public"]["Enums"]["delivery_status_enum"]
            | null
          pickup_location: unknown | null
          speed: number | null
          timestamp: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_orders_customer_order_id_fkey"
            columns: ["customer_order_id"]
            isOneToOne: false
            referencedRelation: "customer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_tracking_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "active_delivery_boys_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_tracking_delivery_boy_id_fkey"
            columns: ["delivery_boy_id"]
            isOneToOne: false
            referencedRelation: "delivery_boys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      acquire_advisory_lock: {
        Args: { lock_id: number }
        Returns: boolean
      }
      acquire_advisory_lock_timeout: {
        Args: { lock_id: number; timeout_ms?: number }
        Returns: boolean
      }
      add_admin_permission_override: {
        Args: {
          p_admin_id: string
          p_permission_code: string
          p_is_granted: boolean
          p_reason: string
          p_granted_by_admin_id: string
          p_expires_at?: string
        }
        Returns: string
      }
      add_new_address: {
        Args: {
          p_customer_id: string
          p_latitude: number
          p_longitude: number
          p_address_line: string
          p_city?: string
          p_area?: string
          p_building_number?: string
          p_floor_number?: string
          p_apartment_number?: string
          p_landmark?: string
          p_address_type?: Database["public"]["Enums"]["address_type_enum"]
          p_is_default?: boolean
        }
        Returns: string
      }
      admin_create_delivery_boy: {
        Args:
          | {
              p_user_id: string
              p_full_name: string
              p_phone: string
              p_email: string
              p_delivery_code: string
              p_referral_code: string
              p_national_id?: string
              p_preferred_vehicle?: Database["public"]["Enums"]["vehicle_type"]
              p_preferred_language?: string
              p_date_of_birth?: string
              p_license_number?: string
              p_owner_id?: string
            }
          | {
              p_user_id: string
              p_full_name: string
              p_phone: string
              p_email: string
              p_password: string
              p_delivery_code: string
              p_referral_code: string
              p_national_id?: string
              p_preferred_vehicle?: Database["public"]["Enums"]["vehicle_type"]
              p_preferred_language?: string
              p_date_of_birth?: string
              p_license_number?: string
              p_owner_id?: string
            }
        Returns: Json
      }
      admin_create_delivery_boy_v2: {
        Args: {
          p_user_id: string
          p_full_name: string
          p_phone: string
          p_email: string
          p_delivery_code: string
          p_referral_code: string
          p_national_id?: string
          p_preferred_vehicle?: Database["public"]["Enums"]["vehicle_type"]
          p_preferred_language?: string
          p_date_of_birth?: string
          p_license_number?: string
          p_owner_id?: string
        }
        Returns: Json
      }
      admin_create_delivery_boy_v3: {
        Args: {
          p_user_id: string
          p_full_name: string
          p_phone: string
          p_email: string
          p_delivery_code: string
          p_referral_code: string
          p_national_id?: string
          p_preferred_vehicle?: string
          p_preferred_language?: string
          p_date_of_birth?: string
          p_license_number?: string
          p_owner_id?: string
        }
        Returns: Json
      }
      admin_get_delivery_boy: {
        Args: { params: Json }
        Returns: Json
      }
      admin_search_delivery_boys_by_phone: {
        Args: { params: Json }
        Returns: Json
      }
      allocate_department_budget: {
        Args:
          | {
              p_department_id: string
              p_amount: number
              p_description: string
              p_allocated_by: string
            }
          | {
              p_system_wallet_id: string
              p_department_wallet_id: string
              p_amount: number
              p_description: string
              p_admin_id: string
            }
        Returns: string
      }
      apply_complex_data_scopes: {
        Args: {
          p_admin_id: string
          p_resource_code: string
          p_base_query: string
        }
        Returns: string
      }
      apply_data_scopes: {
        Args: {
          p_admin_id: string
          p_resource_code: string
          p_base_query: string
        }
        Returns: string
      }
      apply_data_scopes_enhanced: {
        Args: {
          p_admin_id: string
          p_resource_code: string
          p_base_query: string
        }
        Returns: string
      }
      approve_payout_request_transaction: {
        Args: {
          p_request_id: string
          p_admin_id: string
          p_amount_approved: number
          p_admin_notes: string
          p_wallet_id: string
          p_wallet_balance_change: number
          p_transaction_type: string
          p_transaction_currency: string
          p_transaction_details: Json
        }
        Returns: {
          payout_id: string
          wallet_id: string
          transaction_id: string
          status: string
        }[]
      }
      calculate_delivery_stats: {
        Args: { p_order_id: string }
        Returns: {
          total_distance_km: number
          duration_minutes: number
          avg_speed_kmh: number
        }[]
      }
      calculate_distance: {
        Args: { lat1: number; lon1: number; lat2: number; lon2: number }
        Returns: number
      }
      check_admin_permission_enhanced: {
        Args: { p_admin_id: string; permission_code: string }
        Returns: boolean
      }
      check_admin_prerequisites: {
        Args: {
          p_user_id: string
          p_email: string
          p_role_id: string
          p_department_id?: string
        }
        Returns: {
          can_create: boolean
          message: string
        }[]
      }
      check_permission_with_scope: {
        Args: {
          p_admin_id: string
          p_permission_code: string
          p_scope_type: string
          p_scope_value: Json
        }
        Returns: boolean
      }
      check_trigger_execution: {
        Args: { user_id: string }
        Returns: Json
      }
      check_wallet_permission: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      cleanup_advisory_locks: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_overrides: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      complete_order: {
        Args: { order_id: string; notes?: string }
        Returns: Json
      }
      copy_delivery_boy_to_main_tables: {
        Args: { delivery_boy_id: string }
        Returns: Json
      }
      create_admin_transaction: {
        Args: {
          p_user_id: string
          p_email: string
          p_full_name: string
          p_role_id: string
          p_department_id?: string
          p_initial_balance?: number
        }
        Returns: {
          admin_id: string
          wallet_id: string
          success: boolean
          message: string
        }[]
      }
      create_conversation_for_order: {
        Args: {
          p_delivery_order_id: string
          p_created_by_id: string
          p_created_by_type: string
        }
        Returns: string
      }
      create_data_scope: {
        Args: {
          p_name: string
          p_resource_code: string
          p_condition: Json
          p_admin_id?: string
          p_role_id?: string
          p_group_id?: string
          p_created_by?: string
        }
        Returns: string
      }
      create_data_scope_enhanced: {
        Args: {
          p_name: string
          p_resource_code: string
          p_conditions: Json[]
          p_admin_id?: string
          p_role_id?: string
          p_group_id?: string
          p_created_by?: string
          p_description?: string
        }
        Returns: string
      }
      create_payment_qr: {
        Args: {
          p_creator_id: string
          p_recipient_id: string
          p_amount: number
          p_order_id: string
        }
        Returns: string
      }
      create_permission: {
        Args: {
          p_requesting_user_id: string
          p_code: string
          p_description: string
          p_resource_id: string
          p_action_id: string
        }
        Returns: {
          action_id: string
          code: string
          created_at: string
          description: string | null
          id: string
          name: string | null
          resource_id: string
          updated_at: string | null
        }[]
      }
      create_role: {
        Args: {
          p_name: string
          p_code: string
          p_description: string
          p_level: number
          p_is_active?: boolean
          p_is_system?: boolean
        }
        Returns: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          level: number
          name: string
          updated_at: string
        }[]
      }
      delete_permission: {
        Args: { p_requesting_user_id: string; p_permission_id: string }
        Returns: undefined
      }
      delete_user_completely: {
        Args: { user_id_to_delete: string }
        Returns: boolean
      }
      direct_insert_delivery_boy: {
        Args: {
          p_user_id: string
          p_full_name: string
          p_phone: string
          p_email: string
          p_delivery_code: string
          p_referral_code: string
          p_national_id?: string
          p_preferred_vehicle?: string
          p_preferred_language?: string
        }
        Returns: {
          average_response_time: number | null
          badge_level: number | null
          canceled_orders_count: number | null
          completed_orders_count: number | null
          created_at: string | null
          current_latitude: number | null
          current_longitude: number | null
          date_of_birth: string | null
          delivery_code: string | null
          delivery_code_attempts: number | null
          delivery_code_expires_at: string | null
          delivery_code_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          device_info: Json | null
          email: string | null
          full_name: string
          id: string
          identity_documents: Json | null
          is_available: boolean | null
          last_location_update: string | null
          last_login: string | null
          last_performance_review: string | null
          license_number: string | null
          license_photo_url: string | null
          national_id: string | null
          notes: string | null
          online_status:
            | Database["public"]["Enums"]["delivery_boy_online_status"]
            | null
          owner_id: string | null
          password_hash: string | null
          phone: string
          phone_verification_attempts: number | null
          phone_verification_code: string | null
          phone_verification_expires_at: string | null
          phone_verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          preferred_language: string | null
          preferred_vehicle: Database["public"]["Enums"]["vehicle_type"] | null
          preferred_zones: Json | null
          profile_image_url: string | null
          rating: number | null
          referral_code: string | null
          status: Database["public"]["Enums"]["delivery_boy_status"] | null
          status_changed_at: string | null
          status_reason: string | null
          total_deliveries: number | null
          total_earnings: number | null
          updated_at: string | null
          user_id: string | null
        }[]
      }
      direct_search_by_phone: {
        Args: { p_phone: string }
        Returns: {
          average_response_time: number | null
          badge_level: number | null
          canceled_orders_count: number | null
          completed_orders_count: number | null
          created_at: string | null
          current_latitude: number | null
          current_longitude: number | null
          date_of_birth: string | null
          delivery_code: string | null
          delivery_code_attempts: number | null
          delivery_code_expires_at: string | null
          delivery_code_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          device_info: Json | null
          email: string | null
          full_name: string
          id: string
          identity_documents: Json | null
          is_available: boolean | null
          last_location_update: string | null
          last_login: string | null
          last_performance_review: string | null
          license_number: string | null
          license_photo_url: string | null
          national_id: string | null
          notes: string | null
          online_status:
            | Database["public"]["Enums"]["delivery_boy_online_status"]
            | null
          owner_id: string | null
          password_hash: string | null
          phone: string
          phone_verification_attempts: number | null
          phone_verification_code: string | null
          phone_verification_expires_at: string | null
          phone_verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          preferred_language: string | null
          preferred_vehicle: Database["public"]["Enums"]["vehicle_type"] | null
          preferred_zones: Json | null
          profile_image_url: string | null
          rating: number | null
          referral_code: string | null
          status: Database["public"]["Enums"]["delivery_boy_status"] | null
          status_changed_at: string | null
          status_reason: string | null
          total_deliveries: number | null
          total_earnings: number | null
          updated_at: string | null
          user_id: string | null
        }[]
      }
      direct_update_order_to_completed: {
        Args:
          | { order_id: number; notes?: string }
          | { order_id: string; notes?: string }
        Returns: boolean
      }
      execute_sql: {
        Args: { query: string }
        Returns: Json
      }
      find_addresses_within_radius: {
        Args: {
          p_latitude: number
          p_longitude: number
          p_radius_meters: number
        }
        Returns: {
          address_id: string
          address_line: string
          distance_meters: number
          customer_id: string
        }[]
      }
      find_delivery_boy_by_code: {
        Args: { code_param: string }
        Returns: {
          average_response_time: number | null
          badge_level: number | null
          canceled_orders_count: number | null
          completed_orders_count: number | null
          created_at: string | null
          current_latitude: number | null
          current_longitude: number | null
          date_of_birth: string | null
          delivery_code: string | null
          delivery_code_attempts: number | null
          delivery_code_expires_at: string | null
          delivery_code_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          device_info: Json | null
          email: string | null
          full_name: string
          id: string
          identity_documents: Json | null
          is_available: boolean | null
          last_location_update: string | null
          last_login: string | null
          last_performance_review: string | null
          license_number: string | null
          license_photo_url: string | null
          national_id: string | null
          notes: string | null
          online_status:
            | Database["public"]["Enums"]["delivery_boy_online_status"]
            | null
          owner_id: string | null
          password_hash: string | null
          phone: string
          phone_verification_attempts: number | null
          phone_verification_code: string | null
          phone_verification_expires_at: string | null
          phone_verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          preferred_language: string | null
          preferred_vehicle: Database["public"]["Enums"]["vehicle_type"] | null
          preferred_zones: Json | null
          profile_image_url: string | null
          rating: number | null
          referral_code: string | null
          status: Database["public"]["Enums"]["delivery_boy_status"] | null
          status_changed_at: string | null
          status_reason: string | null
          total_deliveries: number | null
          total_earnings: number | null
          updated_at: string | null
          user_id: string | null
        }[]
      }
      find_nearby_customers: {
        Args: {
          p_latitude: number
          p_longitude: number
          p_radius_meters: number
        }
        Returns: {
          customer_id: string
          distance_meters: number
          address_type: string
          address_line: string
        }[]
      }
      find_online_inactive_delivery_boys: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          full_name: string
          phone: string
          online_status: Database["public"]["Enums"]["delivery_boy_online_status"]
          status: Database["public"]["Enums"]["delivery_boy_status"]
          is_available: boolean
          last_location_update: string
          last_login: string
        }[]
      }
      generate_phone_verification_code: {
        Args: { phone_param: string }
        Returns: Json
      }
      generate_verification_code: {
        Args: { phone_param: string }
        Returns: {
          verification_code: string
          expires_at: string
          attempts_remaining: number
        }[]
      }
      get_admin_transactions_paged: {
        Args: {
          page_num: number
          page_size: number
          date_from_filter?: string
          date_to_filter?: string
          user_id_filter?: string
          type_filter?: string
          status_filter?: string
          search_query?: string
          sort_by_column?: string
          sort_direction?: string
        }
        Returns: {
          display_id: string
          created_at: string
          type_label: string
          amount: number
          currency: string
          status_label: string
          user_identifier: string
          balance_before: number
          balance_after: number
          transaction_description: string
          source_table: string
          general_transaction_ref: string
          total_records: number
        }[]
      }
      get_delivery_boy_performance: {
        Args: {
          p_delivery_boy_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          date: string
          orders_completed: number
          orders_canceled: number
          total_distance: number
          total_earnings: number
          waste_weight_collected: number
          average_rating: number
          online_hours: number
        }[]
      }
      get_effective_order_status: {
        Args: { order_id: string }
        Returns: string
      }
      get_invoice_by_id: {
        Args: { p_invoice_id: string }
        Returns: Json
      }
      get_invoice_by_session_id: {
        Args: { p_session_id: string }
        Returns: Json
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_nearby_available_delivery_boys: {
        Args: { lat: number; lng: number; distance_km?: number }
        Returns: {
          id: string
          full_name: string
          phone: string
          online_status: string
          current_latitude: number
          current_longitude: number
          distance_meters: number
          last_location_update: string
          preferred_vehicle: string
        }[]
      }
      get_order_tracking_points: {
        Args: { order_id_param: string }
        Returns: {
          tracking_id: string
          latitude: number
          longitude: number
          speed: number
          heading: number
          tracking_timestamp: string
          delivery_boy_id: string
          delivery_boy_name: string
        }[]
      }
      get_profile_info: {
        Args: { profile_id: string }
        Returns: Json
      }
      get_user_details_by_id: {
        Args: { user_id_to_fetch: string }
        Returns: {
          id: string
          email: string
          phone: string
          full_name: string
        }[]
      }
      get_waste_type_stats: {
        Args: { p_start_date: string; p_end_date: string }
        Returns: {
          waste_type: string
          total_weight: number
          total_orders: number
          total_revenue: number
          average_weight_per_order: number
        }[]
      }
      handle_customer_user_creation: {
        Args: { user_data: Record<string, unknown> }
        Returns: undefined
      }
      insert_delivery_boy_bypass_fk: {
        Args: {
          id: string
          full_name: string
          phone: string
          email: string
          date_of_birth: string
          national_id: string
          license_number: string
          preferred_vehicle: string
          preferred_language: string
          notes: string
          status: string
          is_available: boolean
          delivery_code: string
          referral_code: string
          online_status: string
          preferred_zones: string
        }
        Returns: Json
      }
      insert_invoice_bypass_security: {
        Args: {
          p_session_id: string
          p_invoice_number: string
          p_subtotal: number
          p_tax: number
          p_total: number
          p_status: string
          p_offline_code: string
          p_created_by: string
        }
        Returns: string
      }
      insert_tracking_location: {
        Args:
          | {
              p_order_id: string
              p_delivery_boy_id: string
              p_latitude: number
              p_longitude: number
              p_speed?: number
              p_heading?: number
            }
          | {
              p_order_id: string
              p_delivery_boy_id: string
              p_latitude: number
              p_longitude: number
              p_speed?: number
              p_heading?: number
              p_status?: Database["public"]["Enums"]["delivery_boy_online_status"]
              p_active_status?: Database["public"]["Enums"]["delivery_boy_status"]
              p_available_for_orders?: boolean
            }
        Returns: Json
      }
      insert_waste_invoice: {
        Args: {
          p_session_id: string
          p_invoice_number: string
          p_subtotal: number
          p_tax: number
          p_total: number
          p_status: string
          p_offline_code: string
          p_created_by: string
        }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_valid_phone: {
        Args: { phone: string }
        Returns: boolean
      }
      log_admin_activity: {
        Args: {
          admin_id: string
          action_type: string
          target_type: string
          target_id: string
          details: Json
          ip_address?: string
          user_agent?: string
        }
        Returns: string
      }
      mark_messages_as_read: {
        Args: {
          p_conversation_id: string
          p_participant_type: string
          p_participant_id: string
        }
        Returns: undefined
      }
      parse_data_scope_condition: {
        Args: { condition: Json }
        Returns: string
      }
      process_wallet_transaction: {
        Args: {
          p_wallet_id: string
          p_amount: number
          p_transaction_type: Database["public"]["Enums"]["transaction_type_enum"]
          p_description?: string
          p_related_order_id?: string
          p_related_user_payment_method_id?: string
          p_related_payout_id?: string
          p_external_transaction_id?: string
          p_initiated_by_user_id?: string
          p_metadata?: Json
        }
        Returns: {
          amount: number
          balance_after: number | null
          balance_before: number | null
          created_at: string
          currency: string
          description: string | null
          external_transaction_id: string | null
          id: string
          initiated_by_user_id: string | null
          metadata: Json | null
          related_order_id: string | null
          related_payout_id: string | null
          related_user_payment_method_id: string | null
          source_general_transaction_id: string | null
          status: Database["public"]["Enums"]["transaction_status_enum"]
          transaction_type: Database["public"]["Enums"]["transaction_type_enum"]
          updated_at: string
          wallet_id: string
        }
      }
      release_advisory_lock: {
        Args: { lock_id: number }
        Returns: boolean
      }
      send_customer_notification: {
        Args: {
          p_order_id: string
          p_type: Database["public"]["Enums"]["interaction_type"]
          p_message: string
        }
        Returns: string
      }
      send_invoice_to_customer: {
        Args: { p_invoice_id: string }
        Returns: boolean
      }
      setup_permissions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      simple_create_delivery_boy: {
        Args: { data: Json }
        Returns: Json
      }
      simple_search_by_phone: {
        Args: { data: Json }
        Returns: Json
      }
      smart_assign_order: {
        Args: { p_order_id: string }
        Returns: string
      }
      update_customer_location: {
        Args: {
          p_profile_id: string
          p_address_id?: string
          p_lat?: number
          p_lng?: number
        }
        Returns: boolean
      }
      update_customer_statistics: {
        Args: { p_customer_id: string; p_order_amount: number }
        Returns: undefined
      }
      update_delivery_boy_availability: {
        Args: { user_id: string; available: boolean }
        Returns: undefined
      }
      update_delivery_boy_location: {
        Args: { user_id: string; lat: number; lng: number }
        Returns: undefined
      }
      update_delivery_boy_location_on_login: {
        Args: {
          p_delivery_boy_id: string
          p_latitude: number
          p_longitude: number
          p_device_info?: Json
          p_active_status?: Database["public"]["Enums"]["delivery_boy_status"]
          p_available_for_orders?: boolean
        }
        Returns: boolean
      }
      update_delivery_boy_on_order_pickup: {
        Args: {
          p_order_id: string
          p_delivery_boy_id: string
          p_latitude: number
          p_longitude: number
        }
        Returns: boolean
      }
      update_invoice_approval_status: {
        Args: { p_invoice_id: string; p_status: string; p_comment?: string }
        Returns: Json
      }
      update_permission: {
        Args: {
          p_requesting_user_id: string
          p_permission_id: string
          p_code?: string
          p_description?: string
          p_resource_id?: string
          p_action_id?: string
        }
        Returns: {
          action_id: string
          code: string
          created_at: string
          description: string | null
          id: string
          name: string | null
          resource_id: string
          updated_at: string | null
        }[]
      }
      update_profile_points: {
        Args: { profile_id: string; points_to_add: number }
        Returns: undefined
      }
      upload_delivery_document: {
        Args: {
          p_delivery_id: string
          p_document_type: string
          p_document_url: string
          p_expiry_date?: string
          p_notes?: string
        }
        Returns: Json
      }
      verify_qr_payment: {
        Args: { p_qr_id: string; p_verification_code: string }
        Returns: boolean
      }
    }
    Enums: {
      address_type_enum: "home" | "work" | "other"
      approval_status: "pending" | "under_review" | "approved" | "rejected"
      availability_status: "available" | "unavailable" | "on_duty" | "off_duty"
      business_subtype_enum:
        | "restaurant"
        | "cafe"
        | "retail_shop"
        | "supermarket"
        | "bakery"
        | "clinic"
        | "other"
      customer_approval_status_enum:
        | "pending"
        | "under_review"
        | "approved"
        | "rejected"
      customer_order_status_enum:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
      customer_status: "active" | "inactive" | "suspended" | "blocked"
      customer_type_enum: "household" | "agent" | "business" | "other"
      delivery_boy_online_status: "online" | "offline" | "busy"
      delivery_boy_status: "active" | "busy" | "inactive" | "suspended"
      delivery_code_status: "pending" | "verified" | "expired"
      delivery_status_enum:
        | "pending"
        | "confirmed"
        | "pickedUp"
        | "inReceipt"
        | "completed"
        | "cancelled"
        | "scheduled"
        | "returned"
        | "canceled"
      interaction_type:
        | "status_update"
        | "schedule_notification"
        | "pickup_notification"
        | "delivery_notification"
        | "delay_notification"
        | "location_update"
        | "message"
        | "call_log"
        | "feedback_request"
        | "other"
      item_status_enum:
        | "ACTIVE"
        | "INACTIVE"
        | "PENDING_VERIFICATION"
        | "VERIFIED"
        | "REJECTED"
        | "FROZEN"
        | "SUSPENDED"
        | "CLOSED"
      order_payment_status_enum:
        | "PENDING_PAYMENT"
        | "PAID"
        | "PAYMENT_FAILED"
        | "REFUNDED"
        | "PARTIALLY_PAID"
        | "CASH_ON_DELIVERY"
      order_priority_enum: "low" | "normal" | "high" | "urgent"
      order_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      payment_method_enum: "cash" | "wallet" | "credit_card" | "online_payment"
      payment_method_type_enum:
        | "MOBILE_MONEY"
        | "BANK_TRANSFER"
        | "BANK_DEPOSIT"
        | "CASH"
        | "ONLINE_GATEWAY"
        | "WALLET"
      payout_status_enum:
        | "PENDING_APPROVAL"
        | "APPROVED"
        | "REJECTED"
        | "PROCESSING"
        | "COMPLETED"
        | "FAILED"
      profile_status_enum: "active" | "inactive" | "pending" | "suspended"
      schedule_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "delayed"
        | "cancelled"
      tracking_status: "active" | "paused" | "completed" | "cancelled"
      transaction_status:
        | "pending"
        | "completed"
        | "failed"
        | "cancelled"
        | "verification_pending"
        | "verified"
      transaction_status_enum:
        | "PENDING"
        | "COMPLETED"
        | "FAILED"
        | "CANCELLED"
        | "REQUIRES_ACTION"
        | "PROCESSING"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "purchase"
        | "refund"
        | "exchange"
        | "qr_payment"
      transaction_type_enum:
        | "DEPOSIT"
        | "WITHDRAWAL"
        | "ORDER_PAYMENT"
        | "ORDER_REFUND"
        | "DELIVERY_PAYMENT_COLLECTION"
        | "PAYOUT_TO_USER"
        | "TRANSFER_IN"
        | "TRANSFER_OUT"
        | "ADMIN_CREDIT_ADJUSTMENT"
        | "ADMIN_DEBIT_ADJUSTMENT"
        | "SERVICE_FEE_COLLECTION"
        | "AGENT_COMMISSION"
        | "PAYOUT_APPROVED"
        | "PAYMENT"
        | "PAYOUT_REJECTED"
      user_type: "household" | "distributor" | "business" | "other"
      user_type_enum: "household" | "business" | "distributor"
      vehicle_type: "tricycle" | "pickup_truck" | "light_truck"
      verification_status: "pending" | "verified" | "expired" | "max_attempts"
      verification_status_enum: "pending" | "verified" | "failed"
      wallet_type_enum:
        | "CUSTOMER_HOME"
        | "DELIVERY_BOY"
        | "AGENT"
        | "COMPANY"
        | "SYSTEM_FLOAT"
        | "SYSTEM_REVENUE"
        | "SYSTEM_FEES"
        | "AGENT_WALLET"
      waste_type:
        | "plastic"
        | "paper"
        | "metal"
        | "glass"
        | "organic"
        | "electronic"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      address_type_enum: ["home", "work", "other"],
      approval_status: ["pending", "under_review", "approved", "rejected"],
      availability_status: ["available", "unavailable", "on_duty", "off_duty"],
      business_subtype_enum: [
        "restaurant",
        "cafe",
        "retail_shop",
        "supermarket",
        "bakery",
        "clinic",
        "other",
      ],
      customer_approval_status_enum: [
        "pending",
        "under_review",
        "approved",
        "rejected",
      ],
      customer_order_status_enum: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
      ],
      customer_status: ["active", "inactive", "suspended", "blocked"],
      customer_type_enum: ["household", "agent", "business", "other"],
      delivery_boy_online_status: ["online", "offline", "busy"],
      delivery_boy_status: ["active", "busy", "inactive", "suspended"],
      delivery_code_status: ["pending", "verified", "expired"],
      delivery_status_enum: [
        "pending",
        "confirmed",
        "pickedUp",
        "inReceipt",
        "completed",
        "cancelled",
        "scheduled",
        "returned",
        "canceled",
      ],
      interaction_type: [
        "status_update",
        "schedule_notification",
        "pickup_notification",
        "delivery_notification",
        "delay_notification",
        "location_update",
        "message",
        "call_log",
        "feedback_request",
        "other",
      ],
      item_status_enum: [
        "ACTIVE",
        "INACTIVE",
        "PENDING_VERIFICATION",
        "VERIFIED",
        "REJECTED",
        "FROZEN",
        "SUSPENDED",
        "CLOSED",
      ],
      order_payment_status_enum: [
        "PENDING_PAYMENT",
        "PAID",
        "PAYMENT_FAILED",
        "REFUNDED",
        "PARTIALLY_PAID",
        "CASH_ON_DELIVERY",
      ],
      order_priority_enum: ["low", "normal", "high", "urgent"],
      order_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      payment_method_enum: ["cash", "wallet", "credit_card", "online_payment"],
      payment_method_type_enum: [
        "MOBILE_MONEY",
        "BANK_TRANSFER",
        "BANK_DEPOSIT",
        "CASH",
        "ONLINE_GATEWAY",
        "WALLET",
      ],
      payout_status_enum: [
        "PENDING_APPROVAL",
        "APPROVED",
        "REJECTED",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
      ],
      profile_status_enum: ["active", "inactive", "pending", "suspended"],
      schedule_status: [
        "scheduled",
        "in_progress",
        "completed",
        "delayed",
        "cancelled",
      ],
      tracking_status: ["active", "paused", "completed", "cancelled"],
      transaction_status: [
        "pending",
        "completed",
        "failed",
        "cancelled",
        "verification_pending",
        "verified",
      ],
      transaction_status_enum: [
        "PENDING",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
        "REQUIRES_ACTION",
        "PROCESSING",
      ],
      transaction_type: [
        "deposit",
        "withdrawal",
        "purchase",
        "refund",
        "exchange",
        "qr_payment",
      ],
      transaction_type_enum: [
        "DEPOSIT",
        "WITHDRAWAL",
        "ORDER_PAYMENT",
        "ORDER_REFUND",
        "DELIVERY_PAYMENT_COLLECTION",
        "PAYOUT_TO_USER",
        "TRANSFER_IN",
        "TRANSFER_OUT",
        "ADMIN_CREDIT_ADJUSTMENT",
        "ADMIN_DEBIT_ADJUSTMENT",
        "SERVICE_FEE_COLLECTION",
        "AGENT_COMMISSION",
        "PAYOUT_APPROVED",
        "PAYMENT",
        "PAYOUT_REJECTED",
      ],
      user_type: ["household", "distributor", "business", "other"],
      user_type_enum: ["household", "business", "distributor"],
      vehicle_type: ["tricycle", "pickup_truck", "light_truck"],
      verification_status: ["pending", "verified", "expired", "max_attempts"],
      verification_status_enum: ["pending", "verified", "failed"],
      wallet_type_enum: [
        "CUSTOMER_HOME",
        "DELIVERY_BOY",
        "AGENT",
        "COMPANY",
        "SYSTEM_FLOAT",
        "SYSTEM_REVENUE",
        "SYSTEM_FEES",
        "AGENT_WALLET",
      ],
      waste_type: [
        "plastic",
        "paper",
        "metal",
        "glass",
        "organic",
        "electronic",
      ],
    },
  },
} as const
