import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { permissionsApi } from '@/services/permissionsApi'
import { PermissionData } from '@/domains/admins/types'

// Types
export interface TemporaryPermission {
  id: string
  admin_id: string
  permission_id: string
  scope_type: 'province' | 'region' | 'city' | 'warehouse' | 'global'
  scope_id?: string
  granted_by?: string
  granted_at: Date
  expires_at: Date
  is_active: boolean
  reason?: string
  created_at: Date
  updated_at: Date
  admin?: {
    id: string
    full_name?: string
    email: string
  }
  permission?: {
    id: string
    name?: string
    code: string
  }
  granted_by_admin?: {
    id: string
    full_name?: string
    email: string
  }
}

export interface PermissionRequest {
  id: string
  requester_id: string
  permission_id: string
  scope_type: 'province' | 'region' | 'city' | 'warehouse' | 'global'
  scope_id?: string
  reason: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  requested_at: Date
  expires_at?: Date
  created_at: Date
  updated_at: Date
  requester?: {
    id: string
    full_name?: string
    email: string
  }
  permission?: {
    id: string
    name?: string
    code: string
  }
  approvals?: Approval[]
}

export interface Approval {
  id: string
  request_id: string
  approver_id?: string
  level: number
  status: 'pending' | 'approved' | 'rejected'
  comments?: string
  approved_at?: Date
  created_at: Date
  updated_at: Date
  approver?: {
    id: string
    full_name?: string
    email: string
  }
}

export interface AdvancedNotification {
  id: string
  recipient_id: string
  type: 'permission_request' | 'approval_needed' | 'permission_granted' | 'permission_expired' | 'approval_approved' | 'approval_rejected'
  title: string
  message: string
  data?: any
  is_read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  expires_at?: Date
  created_at: Date
}

interface PermissionsState {
  temporaryPermissions: TemporaryPermission[]
  permissionRequests: PermissionRequest[]
  approvals: Approval[]
  notifications: AdvancedNotification[]
  availablePermissions: PermissionData[] // إضافة الصلاحيات المتاحة
  loading: boolean
  error: string | null
  stats: {
    activePermissions: number
    pendingRequests: number
    unreadNotifications: number
  }
}

const initialState: PermissionsState = {
  temporaryPermissions: [],
  permissionRequests: [],
  approvals: [],
  notifications: [],
  availablePermissions: [], // إضافة الصلاحيات المتاحة
  loading: false,
  error: null,
  stats: {
    activePermissions: 0,
    pendingRequests: 0,
    unreadNotifications: 0
  }
}

// Async Thunks
export const fetchTemporaryPermissions = createAsyncThunk(
  'permissions/fetchTemporaryPermissions',
  async (adminId?: string) => {
    const url = adminId ? `/api/permissions/temporary?admin_id=${adminId}&active_only=true` : '/api/permissions/temporary?active_only=true'
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch temporary permissions')
    }
    const permissions = await response.json()
    return permissions
  }
)

export const fetchPermissionRequests = createAsyncThunk(
  'permissions/fetchPermissionRequests',
  async (requesterId?: string) => {
    const url = requesterId ? `/api/permissions/requests?requester_id=${requesterId}` : '/api/permissions/requests'
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch permission requests')
    }
    const requests = await response.json()
    return requests
  }
)

export const fetchNotifications = createAsyncThunk(
  'permissions/fetchNotifications',
  async (recipientId: string) => {
    const response = await fetch(`/api/notifications?recipient_id=${recipientId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch notifications')
    }
    const notifications = await response.json()
    return notifications
  }
)

export const fetchStats = createAsyncThunk(
  'permissions/fetchStats',
  async (adminId: string) => {
    const [permissionsResponse, requestsResponse, notificationsResponse] = await Promise.all([
      fetch(`/api/permissions/temporary?admin_id=${adminId}&active_only=true`),
      fetch(`/api/permissions/requests?requester_id=${adminId}&status=pending`),
      fetch(`/api/notifications?recipient_id=${adminId}&unread_only=true`)
    ])
    
    const [permissions, requests, notifications] = await Promise.all([
      permissionsResponse.json(),
      requestsResponse.json(),
      notificationsResponse.json()
    ])
    
    return {
      activePermissions: permissions.length,
      pendingRequests: requests.length,
      unreadNotifications: notifications.length
    }
  }
)

export const createPermissionRequest = createAsyncThunk(
  'permissions/createPermissionRequest',
  async (requestData: {
    requester_id: string
    permission_id: string
    scope_type: 'province' | 'region' | 'city' | 'warehouse' | 'global'
    scope_id?: string
    reason: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    expires_at?: Date
  }) => {
    const response = await fetch('/api/permissions/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })
    if (!response.ok) {
      throw new Error('Failed to create permission request')
    }
    const request = await response.json()
    return request
  }
)

export const approveRequest = createAsyncThunk(
  'permissions/approveRequest',
  async ({ requestId, approverId, comments }: {
    requestId: string
    approverId: string
    comments?: string
  }) => {
    // TODO: Implement approval API endpoint
    console.log('Approving request:', { requestId, approverId, comments })
    return { requestId, approverId }
  }
)

export const rejectRequest = createAsyncThunk(
  'permissions/rejectRequest',
  async ({ requestId, approverId, comments }: {
    requestId: string
    approverId: string
    comments: string
  }) => {
    // TODO: Implement rejection API endpoint
    console.log('Rejecting request:', { requestId, approverId, comments })
    return { requestId, approverId }
  }
)

// Async thunk to fetch available permissions
export const fetchAvailablePermissions = createAsyncThunk<PermissionData[], void, { rejectValue: string }>(
  'permissions/fetchAvailable',
  async (_, { rejectWithValue }) => {
    try {
      const response = await permissionsApi.getAvailablePermissions();
      if (response.error) {
        throw response.error; 
      }
      return response.data || []; 
    } catch (error: unknown) {
        let message = error instanceof Error ? error.message : 'Failed to fetch available permissions';
        if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
             message = error.message;
        }
        console.error("fetchAvailablePermissions error:", error);
        return rejectWithValue(message);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'permissions/markNotificationAsRead',
  async (notificationId: string) => {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    })
    if (!response.ok) {
      throw new Error('Failed to mark notification as read')
    }
    return notificationId
  }
)

// Slice
const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateStats: (state, action: PayloadAction<Partial<typeof initialState.stats>>) => {
      state.stats = { ...state.stats, ...action.payload }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Temporary Permissions
      .addCase(fetchTemporaryPermissions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTemporaryPermissions.fulfilled, (state, action) => {
        state.loading = false
        state.temporaryPermissions = action.payload
      })
      .addCase(fetchTemporaryPermissions.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch temporary permissions'
      })
      
      // Fetch Permission Requests
      .addCase(fetchPermissionRequests.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPermissionRequests.fulfilled, (state, action) => {
        state.loading = false
        state.permissionRequests = action.payload
      })
      .addCase(fetchPermissionRequests.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch permission requests'
      })
      
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false
        state.notifications = action.payload
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch notifications'
      })
      
      // Fetch Stats
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
      
      // Create Permission Request
      .addCase(createPermissionRequest.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createPermissionRequest.fulfilled, (state, action) => {
        state.loading = false
        state.permissionRequests.unshift(action.payload)
      })
      .addCase(createPermissionRequest.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create permission request'
      })
      
      // Approve Request
      .addCase(approveRequest.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(approveRequest.fulfilled, (state, action) => {
        state.loading = false
        // Update the request status in the list
        const requestIndex = state.permissionRequests.findIndex(r => r.id === action.payload.requestId)
        if (requestIndex !== -1) {
          state.permissionRequests[requestIndex].status = 'approved'
        }
      })
      .addCase(approveRequest.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to approve request'
      })
      
      // Reject Request
      .addCase(rejectRequest.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(rejectRequest.fulfilled, (state, action) => {
        state.loading = false
        // Update the request status in the list
        const requestIndex = state.permissionRequests.findIndex(r => r.id === action.payload.requestId)
        if (requestIndex !== -1) {
          state.permissionRequests[requestIndex].status = 'rejected'
        }
      })
      .addCase(rejectRequest.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to reject request'
      })
      
      // Mark Notification as Read
      // Fetch Available Permissions
      .addCase(fetchAvailablePermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailablePermissions.fulfilled, (state, action: PayloadAction<PermissionData[]>) => {
        state.loading = false;
        state.availablePermissions = action.payload;
      })
      .addCase(fetchAvailablePermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notificationIndex = state.notifications.findIndex(n => n.id === action.payload)
        if (notificationIndex !== -1) {
          state.notifications[notificationIndex].is_read = true
        }
        state.stats.unreadNotifications = Math.max(0, state.stats.unreadNotifications - 1)
      })
  }
})

export const { clearError, updateStats } = permissionsSlice.actions
export default permissionsSlice.reducer
