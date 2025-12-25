import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { permissionsApi } from '@/services/permissionsApi';
import { 
  AdminPermissions,
  Role,
  PermissionData,
  RoleBasicData
} from '@/domains/admins/types';

/**
 * Permissions State using centralized types
 */
interface PermissionsState {
  availablePermissions: PermissionData[];
  roles: Role[];
  loading: boolean;
  error: string | null;
}

/**
 * Initial State
 */
const initialState: PermissionsState = {
  availablePermissions: [],
  roles: [],
  loading: false,
  error: null,
};

/**
 * Async thunk to fetch available permissions.
 */
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

/**
 * Async thunk to fetch available roles.
 */
export const fetchRoles = createAsyncThunk<Role[], void, { rejectValue: string }>(
  'permissions/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await permissionsApi.getRoles(); 
      if (response.error) {
        throw response.error;
      }
      return response.data || []; 
    } catch (error: unknown) {
        let message = error instanceof Error ? error.message : 'Failed to fetch roles';
         if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
             message = error.message;
        }
        console.error("fetchRoles error:", error);
        return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk to add a new role (Refactored).
 */
export const addRole = createAsyncThunk<Role, { roleData: RoleBasicData, permissionIds: string[] }, { rejectValue: string }>(
  'permissions/addRole',
  async ({ roleData, permissionIds }, { rejectWithValue }) => {
    try {
        // 1. Add the basic role data
        console.log('[addRole Thunk] Calling permissionsApi.addRole...'); // Log before API call
        const addRoleResponse = await permissionsApi.addRole(roleData);
        
        // --- Modification Start: Check for error directly --- 
        if (addRoleResponse.error) {
            console.error('[addRole Thunk] Error from permissionsApi.addRole:', addRoleResponse.error);
            // Use the error message from the response for rejection
            return rejectWithValue(addRoleResponse.error.message || 'Failed to add role data');
        }
        // --- Modification End ---

        // Check if data is missing even if no error reported (belt and suspenders)
        if (!addRoleResponse.data || !addRoleResponse.data.id) {
            console.error('[addRole Thunk] Role data or ID missing after addRole call, even without error.');
            return rejectWithValue('Failed to add role: Missing data after API call.');
        }

        const newRole = addRoleResponse.data;
        console.log('[addRole Thunk] Role added successfully (ID:', newRole.id, '). Syncing permissions...');

        // 2. Sync permissions for the newly created role
        const syncPermissionsResponse = await permissionsApi.syncRolePermissions(newRole.id, permissionIds);
        
        // --- Modification Start: Check for error directly --- 
        if (syncPermissionsResponse.error) {
            console.error("[addRole Thunk] Error from permissionsApi.syncRolePermissions:", syncPermissionsResponse.error);
            // Even though role created, reject because sync failed. 
            // Consider more nuanced error handling if partial success is acceptable.
            return rejectWithValue(syncPermissionsResponse.error.message || 'Failed to sync permissions after adding role');
        }
        // --- Modification End ---
        
        console.log('[addRole Thunk] Permissions synced successfully for role:', newRole.id);

        // 3. Return the complete role data (including the ID)
        return newRole;

    } catch (error: unknown) { // Catch only truly unexpected errors (e.g., network issues, code errors here)
        const message = error instanceof Error ? error.message : 'Unexpected error during addRole thunk execution';
        console.error("[addRole Thunk] Unexpected error caught:", error);
        return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk to update a role (Refactored).
 */
export const updateRole = createAsyncThunk<Role, { roleId: string, roleData: Partial<RoleBasicData>, permissionIds: string[] }, { rejectValue: string }>(
  'permissions/updateRole',
  async ({ roleId, roleData, permissionIds }, { rejectWithValue }) => {
    try {
       // 1. Update basic role data and sync permissions concurrently
        const [updateRoleResponse, syncPermissionsResponse] = await Promise.all([
            permissionsApi.updateRole(roleId, roleData),
            permissionsApi.syncRolePermissions(roleId, permissionIds)
        ]);

        // Check response from updateRole
        if (updateRoleResponse.error) {
            // If there was an error from the API call itself, throw it
            throw updateRoleResponse.error;
        }
        // If there was no error and updateRoleResponse.data is null, reject. 
        // Otherwise, proceed with the data (which might be from fallback getRoleById)
        if (!updateRoleResponse.data) {
            return rejectWithValue('Role update API call succeeded but returned no data (role might not exist).');
        }

        // Check response from syncRolePermissions
        if (syncPermissionsResponse.error) {
            // Log the error and reject the thunk to ensure user knows permissions weren't saved
            console.error("Failed to sync permissions during role update:", syncPermissionsResponse.error);
            const errorMessage = typeof syncPermissionsResponse.error === 'object' && syncPermissionsResponse.error !== null && 'message' in syncPermissionsResponse.error
              ? (syncPermissionsResponse.error as { message: string }).message
              : 'Failed to sync permissions';
            return rejectWithValue(`فشل حفظ الصلاحيات: ${errorMessage}`);
        }

        // Return the updated role data. This data should now be reliable, 
        // coming either directly from the update or from the subsequent fetch.
        return updateRoleResponse.data;

    } catch (error) {
        let message = error instanceof Error ? error.message : 'Failed to update role or sync permissions';
        if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
            message = error.message;
        }
        console.error("updateRole thunk error:", error);
        return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk to delete a role.
 */
export const deleteRole = createAsyncThunk<string, string, { rejectValue: string }>(
  'permissions/deleteRole',
  async (roleId, { rejectWithValue }) => {
    try {
      const response = await permissionsApi.deleteRole(roleId);
      if (response.error) {
        throw response.error;
      }
      return roleId; 
    } catch (error: unknown) {
       let message = error instanceof Error ? error.message : 'Failed to delete role';
        if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
             message = error.message;
        }
        console.error("deleteRole error:", error);
        return rejectWithValue(message);
    }
  }
);

/**
 * Permissions Slice Definition
 */
const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
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
    
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action: PayloadAction<Role[]>) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
    
    builder
      .addCase(addRole.pending, (state) => {
        state.loading = true;
      })
      .addCase(addRole.fulfilled, (state, action: PayloadAction<Role>) => {
        state.loading = false;
        const exists = state.roles.some(role => role.id === action.payload.id);
        if (!exists) {
          state.roles.push(action.payload);
        } else {
            console.warn(`Role with id ${action.payload.id} already exists in state.`);
             const index = state.roles.findIndex(role => role.id === action.payload.id);
            if (index !== -1) {
                state.roles[index] = action.payload;
            }
        }
      })
      .addCase(addRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
    
    builder
      .addCase(updateRole.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateRole.fulfilled, (state, action: PayloadAction<Role>) => {
        state.loading = false;
        const index = state.roles.findIndex(role => role.id === action.payload.id);
        if (index !== -1) {
            state.roles[index] = { ...state.roles[index], ...action.payload };
        } else {
            console.warn(`Updated role with id ${action.payload.id} not found in state.`);
        }
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
    
    builder
      .addCase(deleteRole.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteRole.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.roles = state.roles.filter(role => role.id !== action.payload);
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { 
  clearError, 
} = permissionsSlice.actions;

export default permissionsSlice.reducer;