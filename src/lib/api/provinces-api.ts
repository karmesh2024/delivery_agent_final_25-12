import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface Province {
  id: string;
  name_ar: string;
  name_en?: string;
  code: string;
  country_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  regions_count?: number;
}

export interface Region {
  id: string;
  name_ar: string;
  name_en?: string;
  code: string;
  province_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  cities_count?: number;
}

export interface City {
  id: string;
  name_ar: string;
  name_en?: string;
  code: string;
  region_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemporaryPermission {
  id: string;
  admin_id: string;
  permission_id: string;
  scope_type: 'province' | 'region' | 'city' | 'warehouse' | 'global';
  scope_id?: string;
  granted_by: string;
  granted_at: string;
  expires_at: string;
  is_active: boolean;
  reason: string;
  created_at: string;
  updated_at: string;
  admin_name?: string;
  permission_name?: string;
  scope_name?: string;
  granted_by_name?: string;
  days_remaining?: number;
}

export interface PermissionRequest {
  id: string;
  requester_id: string;
  permission_id: string;
  scope_type: 'province' | 'region' | 'city' | 'warehouse' | 'global';
  scope_id?: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requested_at: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  requester_name?: string;
  permission_name?: string;
  scope_name?: string;
}

export interface Approval {
  id: string;
  request_id: string;
  approver_id: string;
  level: number;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  approver_name?: string;
}

// Provinces API
export const provincesApi = {
  // Get all provinces
  async getProvinces(): Promise<Province[]> {
    const { data, error } = await supabase
      .from('provinces')
      .select(`
        *,
        regions_count:regions(count)
      `)
      .eq('is_active', true)
      .order('name_ar');

    if (error) throw error;
    return data || [];
  },

  // Get province by ID
  async getProvince(id: string): Promise<Province | null> {
    const { data, error } = await supabase
      .from('provinces')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create province
  async createProvince(province: Omit<Province, 'id' | 'created_at' | 'updated_at'>): Promise<Province> {
    const { data, error } = await supabase
      .from('provinces')
      .insert(province)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update province
  async updateProvince(id: string, updates: Partial<Province>): Promise<Province> {
    const { data, error } = await supabase
      .from('provinces')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete province
  async deleteProvince(id: string): Promise<void> {
    const { error } = await supabase
      .from('provinces')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Regions API
export const regionsApi = {
  // Get regions by province
  async getRegionsByProvince(provinceId: string): Promise<Region[]> {
    const { data, error } = await supabase
      .from('regions')
      .select(`
        *,
        cities_count:cities(count)
      `)
      .eq('province_id', provinceId)
      .eq('is_active', true)
      .order('name_ar');

    if (error) throw error;
    return data || [];
  },

  // Get region by ID
  async getRegion(id: string): Promise<Region | null> {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create region
  async createRegion(region: Omit<Region, 'id' | 'created_at' | 'updated_at'>): Promise<Region> {
    const { data, error } = await supabase
      .from('regions')
      .insert(region)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update region
  async updateRegion(id: string, updates: Partial<Region>): Promise<Region> {
    const { data, error } = await supabase
      .from('regions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete region
  async deleteRegion(id: string): Promise<void> {
    const { error } = await supabase
      .from('regions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Cities API
export const citiesApi = {
  // Get cities by region
  async getCitiesByRegion(regionId: string): Promise<City[]> {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('region_id', regionId)
      .eq('is_active', true)
      .order('name_ar');

    if (error) throw error;
    return data || [];
  },

  // Get city by ID
  async getCity(id: string): Promise<City | null> {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create city
  async createCity(city: Omit<City, 'id' | 'created_at' | 'updated_at'>): Promise<City> {
    const { data, error } = await supabase
      .from('cities')
      .insert(city)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update city
  async updateCity(id: string, updates: Partial<City>): Promise<City> {
    const { data, error } = await supabase
      .from('cities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete city
  async deleteCity(id: string): Promise<void> {
    const { error } = await supabase
      .from('cities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Temporary Permissions API
export const temporaryPermissionsApi = {
  // Get all temporary permissions
  async getTemporaryPermissions(): Promise<TemporaryPermission[]> {
    const { data, error } = await supabase
      .from('temporary_permissions')
      .select(`
        *,
        admin_name:admins(name),
        permission_name:permissions(name),
        granted_by_name:admins!granted_by(name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get temporary permissions by admin
  async getTemporaryPermissionsByAdmin(adminId: string): Promise<TemporaryPermission[]> {
    const { data, error } = await supabase
      .from('temporary_permissions')
      .select(`
        *,
        admin_name:admins(name),
        permission_name:permissions(name),
        granted_by_name:admins!granted_by(name)
      `)
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Grant temporary permission
  async grantTemporaryPermission(permission: Omit<TemporaryPermission, 'id' | 'created_at' | 'updated_at'>): Promise<TemporaryPermission> {
    const { data, error } = await supabase
      .from('temporary_permissions')
      .insert(permission)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update temporary permission
  async updateTemporaryPermission(id: string, updates: Partial<TemporaryPermission>): Promise<TemporaryPermission> {
    const { data, error } = await supabase
      .from('temporary_permissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Revoke temporary permission
  async revokeTemporaryPermission(id: string): Promise<void> {
    const { error } = await supabase
      .from('temporary_permissions')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Cleanup expired permissions
  async cleanupExpiredPermissions(): Promise<number> {
    const { data, error } = await supabase.rpc('cleanup_expired_permissions');
    if (error) throw error;
    return data || 0;
  }
};

// Permission Requests API
export const permissionRequestsApi = {
  // Get all permission requests
  async getPermissionRequests(): Promise<PermissionRequest[]> {
    const { data, error } = await supabase
      .from('permission_requests')
      .select(`
        *,
        requester_name:admins(name),
        permission_name:permissions(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get permission requests by requester
  async getPermissionRequestsByRequester(requesterId: string): Promise<PermissionRequest[]> {
    const { data, error } = await supabase
      .from('permission_requests')
      .select(`
        *,
        requester_name:admins(name),
        permission_name:permissions(name)
      `)
      .eq('requester_id', requesterId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create permission request
  async createPermissionRequest(request: Omit<PermissionRequest, 'id' | 'created_at' | 'updated_at'>): Promise<PermissionRequest> {
    const { data, error } = await supabase
      .from('permission_requests')
      .insert(request)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update permission request
  async updatePermissionRequest(id: string, updates: Partial<PermissionRequest>): Promise<PermissionRequest> {
    const { data, error } = await supabase
      .from('permission_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Approvals API
export const approvalsApi = {
  // Get approvals by request
  async getApprovalsByRequest(requestId: string): Promise<Approval[]> {
    const { data, error } = await supabase
      .from('approvals')
      .select(`
        *,
        approver_name:admins(name)
      `)
      .eq('request_id', requestId)
      .order('level');

    if (error) throw error;
    return data || [];
  },

  // Get pending approvals for approver
  async getPendingApprovalsForApprover(approverId: string): Promise<Approval[]> {
    const { data, error } = await supabase
      .from('approvals')
      .select(`
        *,
        approver_name:admins(name),
        permission_request:permission_requests(*)
      `)
      .eq('approver_id', approverId)
      .eq('status', 'pending')
      .order('created_at');

    if (error) throw error;
    return data || [];
  },

  // Approve request
  async approveRequest(requestId: string, approverId: string, comments?: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('approve_request', {
      request_id: requestId,
      approver_id: approverId,
      comments: comments || null
    });

    if (error) throw error;
    return data;
  },

  // Reject request
  async rejectRequest(requestId: string, approverId: string, comments: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('reject_request', {
      request_id: requestId,
      approver_id: approverId,
      comments
    });

    if (error) throw error;
    return data;
  }
};

// Notifications API
export const notificationsApi = {
  // Get notifications for user
  async getNotifications(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('advanced_notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('advanced_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('advanced_notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('advanced_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  }
};

