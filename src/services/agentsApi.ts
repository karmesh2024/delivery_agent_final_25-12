import { supabase } from '@/lib/supabase';
import { Agent, DeliveryBoy } from '@/types';
import crypto from 'crypto';

// تعريف نوع لبيانات الموقع الأخير للمندوب
export interface CreateAgentPayload {
  phone: string;
  password?: string;
  email?: string;
  full_name: string;
  preferred_vehicle?: 'tricycle' | 'pickup_truck' | 'light_truck';
  license_number?: string;
  national_id?: string;
  initial_balance?: number;
  currency?: string;
}

const generateRandomPassword = (length = 12) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  const charactersLength = characters.length;
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += characters.charAt(randomBytes[i] % charactersLength);
  }
  return result;
};

const updateDetails = async (agentId: string, updateData: Partial<Agent>): Promise<Agent> => {
  try {
    const response = await fetch(`/api/agents/${agentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      let errorData;
      try {
        const text = await response.text();
        errorData = JSON.parse(text);
      } catch (e) {
        console.error('[agentsApi.updateDetails] Failed to parse error response.');
      }
      const fullErrorMessage = errorData?.error || `Request failed: ${response.status}`;
      throw new Error(fullErrorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error(`[agentsApi.updateDetails] Error:`, error);
    throw error;
  }
};

export const agentsApi = {
  getAll: async (): Promise<Agent[]> => {
    try {
      if (!supabase) throw new Error('Supabase not initialized');
      const { data, error } = await supabase
        .from('delivery_boys')
        .select('id, full_name, email, phone, status, online_status, current_latitude, current_longitude, profile_image_url, rating, total_deliveries, delivery_code, referral_code, preferred_vehicle');
      
      if (error) throw error;
      
      return data?.map(agent => {
        let location = undefined;
        if (agent.current_latitude && agent.current_longitude) {
          location = { 
            lat: parseFloat(String(agent.current_latitude)), 
            lng: parseFloat(String(agent.current_longitude)) 
          };
        }
        return {
          ...agent,
          name: agent.full_name || undefined,
          location
        };
      }) || [];
    } catch (error) {
      console.error('Agents API Error - getAll:', error);
      throw error;
    }
  },
  
  getActive: async (): Promise<Agent[]> => {
    try {
      if (!supabase) throw new Error('Supabase not initialized');
      const { data, error } = await supabase
        .from('active_delivery_boys_view')
        .select('id, full_name, email, phone, status, online_status, current_latitude, current_longitude, profile_image_url, rating, total_deliveries');
      
      if (error) throw error;
      
      return data?.map(agent => ({
        ...agent,
        name: agent.full_name || undefined,
        location: agent.current_latitude && agent.current_longitude ? {
          lat: parseFloat(agent.current_latitude),
          lng: parseFloat(agent.current_longitude)
        } : undefined
      })) || [];
    } catch (error) {
      console.error('Agents API Error - getActive:', error);
      throw error;
    }
  },
  
  getById: async (id: string): Promise<Agent | null> => {
    try {
      if (!supabase) throw new Error('Supabase not initialized');
      const { data, error } = await supabase
        .from('delivery_boys')
        .select('id, full_name, email, phone, status, online_status, current_latitude, current_longitude, profile_image_url, rating, total_deliveries, delivery_code, referral_code, preferred_vehicle, license_number, national_id')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (data) {
        return {
          ...data,
          name: data.full_name || undefined,
          location: data.current_latitude && data.current_longitude ? {
            lat: parseFloat(data.current_latitude),
            lng: parseFloat(data.current_longitude)
          } : undefined
        };
      }
      return null;
    } catch (error) {
      console.error('Agents API Error - getById:', error);
      throw error;
    }
  },
  
  updateStatus: async (id: string, status: string): Promise<Agent | null> => {
    try {
      if (!supabase) throw new Error('Supabase not initialized');
      const { data, error } = await supabase
        .from('delivery_boys')
        .update({ status: status })
        .eq('id', id)
        .select('id, full_name, email, phone, status, online_status, current_latitude, current_longitude, profile_image_url, rating, total_deliveries')
        .single();
      
      if (error) throw error;
      if (data) {
        return { 
          ...data,
          name: data.full_name || undefined,
          location: data.current_latitude && data.current_longitude ? {
            lat: parseFloat(data.current_latitude),
            lng: parseFloat(data.current_longitude)
          } : undefined
        };
      }
      return null;
    } catch (error) {
      console.error('Agents API Error - updateStatus:', error);
      throw error;
    }
  },

  updateDetails,

  create: async (payload: CreateAgentPayload): Promise<{ agentId: string | null; error: string | null }> => {
    try {
      const response = await fetch('/api/delivery-boys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { agentId: null, error: errorData.error || 'فشل إنشاء المندوب' };
      }

      const data = await response.json();
      return { agentId: data.id, error: null };
    } catch (err: unknown) {
      return { agentId: null, error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع' };
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل حذف المندوب');
      }
    } catch (error) {
      console.error('Agents API Error - delete:', error);
      throw error;
    }
  },
};