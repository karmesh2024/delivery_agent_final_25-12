import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase'; // Corrected Supabase client import path
import {
    Admin, // Use Admin type from index.ts
    AdminPermissions,
    PermissionData,
    PermissionsListResponse,
    Role,
    RoleBasicData,
    RolesListResponse
} from '@/domains/admins/types/index';

// إضافة النظام الأمني الجديد
import { logger, authLogger, apiLogger, cleanForLog, validationLogger } from '@/lib/logger-safe';
import { validateEnvironment } from '@/lib/environment';

// فحص البيئة
validateEnvironment();

// Re-export PermissionData so it can be imported alongside the api object
export type { PermissionData };
// ExtendedPermissions needed for deprecated functions if kept
// import { ExtendedPermissions } from '../types/permissions';

// Removed all local duplicate interface definitions

// Define the type for raw permission data fetched from Supabase based on the *corrected* select query
type RawPermissionFromDb = {
    id: string;
    code: string;
    description: string | null;
    resource_id: string | null;
    // Corrected: Expect object or array of objects from join
    resources: { name: string } | { name: string }[] | null;
    action_id?: string | null;
    // Corrected: Expect object or array of objects from join
    actions: { name: string } | { name: string }[] | null;
    // Removed group fields
    // group_id: string | null;
    // permission_groups: { name: string }[] | null;
    created_at: string;
    updated_at: string | null;
};

// Basic types for helper functions (define more completely or import if available elsewhere)
interface Resource { id: string; name: string; code: string; is_active: boolean; description?: string | null; created_at?: string; updated_at?: string | null; }
interface Action { id: string; name: string; code: string; description?: string | null; created_at?: string; }
interface AdminGroup { id: string; name: string; description?: string | null; department_id?: string | null; created_at?: string; updated_at?: string | null; }

// Custom error type for API responses when Supabase client fails
interface CustomApiError {
    message: string;
    details: string;
    hint: string;
    code: string;
}

// Helper to create consistent error object when Supabase client is not available
// Returns an object that fits the { data: null, error: PostgrestError | CustomApiError } structure
const createSupabaseNotAvailableErrorObject = (): { data: null; error: CustomApiError } => ({
    data: null,
    error: {
        message: 'Supabase client not available', 
        details:'Client is likely not initialized correctly.',
        hint:'Check Supabase initialization in your project.',
        code:'CLIENT_INIT_ERROR',
    }
});

/**
 * API for managing permissions and roles, primarily using the role-based system.
 */
export const permissionsApi = {
    /**
     * Fetches all available permissions with their associated resource, action, and group names.
     */
    async getAvailablePermissions(): Promise<{ data: PermissionData[] | null; error: PostgrestError | CustomApiError | null }> {
        if (!supabase) return createSupabaseNotAvailableErrorObject();
        try {
            const { data: rawPermissions, error } = await supabase
                .from('permissions')
                .select(`
                    id,
                    code,
                    description,
                    resource_id,
                    resources ( name ), 
                    action_id, 
                    actions ( name ),
                    created_at,
                    updated_at
                `);

            if (error) {
                apiLogger.error('permissionsApi.getAvailablePermissions', `Database error: ${cleanForLog({ code: error.code, message: error.message })}`);
                return { data: null, error };
            }

            if (!rawPermissions) {
                return { data: [], error: null };
            }

            // Cast to RawPermissionFromDb[], explicitly type 'p' in map
            const mappedData: PermissionData[] = (rawPermissions as RawPermissionFromDb[]).map((p: RawPermissionFromDb): PermissionData => ({
                id: p.id,
                code: p.code,
                description: p.description,
                resource_id: p.resource_id,
                // Corrected: Join resources directly
                resource_name: Array.isArray(p.resources) ? p.resources[0]?.name : p.resources?.name, 
                action_id: p.action_id ?? null, 
                // Corrected: Join actions directly
                action_name: Array.isArray(p.actions) ? p.actions[0]?.name : p.actions?.name, 
                // Removed group_id and group_name as they don't exist in the base permissions table per schema
                // group_id: p.group_id,
                // group_name: p.permission_groups?.[0]?.name ?? undefined, 
                created_at: p.created_at,
                updated_at: p.updated_at,
            }));

            return { data: mappedData, error: null };

        } catch (err) {
            apiLogger.error('permissionsApi.getAvailablePermissions', `Client-side error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            // Ensure catch block also returns compatible error structure
            const apiError: CustomApiError = err instanceof Error ?
                { message: err.message, details: 'Client-side processing error', hint: '', code: 'CLIENT_ERROR' }
                : { message: 'An unknown error occurred', details: '', hint: '', code: 'UNKNOWN' };
            return { data: null, error: apiError };
        }
    },

    /**
     * Fetches all roles.
     */
    async getRoles(): Promise<{ data: Role[] | null; error: PostgrestError | CustomApiError | null }> {
        if (!supabase) return createSupabaseNotAvailableErrorObject();
        try {
            // Fetch roles and their associated permission codes using a join
            const { data, error } = await supabase
                .from('roles')
                .select(`
                    id,
                    name,
                    description,
                    level,
                    is_system,
                    is_active,
                    created_at,
                    updated_at,
                    code,
                    role_permissions ( 
                        permissions ( code )
                    )
                `);

            if (error) {
                apiLogger.error('permissionsApi.getRoles', `Database error: ${cleanForLog({ code: error.code, message: error.message })}`);
                return { data: null, error };
            }

            // *** DEBUGGING: Log the raw data from Supabase ***
            // console.log("[permissionsApi.getRoles] Raw data from Supabase:", JSON.stringify(data, null, 2));
            // *** END DEBUGGING ***

            // Define a more specific type for the join result based on observation & linter feedback
            type RolePermissionJoin = {
                permissions: { code: string } | Array<{ code: string }> | null;
            };

            // Map the data to include a simple array of permission codes
            const mappedData = data?.map(role => {
                
                // Process role_permissions, accessing the CODE from the permissions object or array
                const permissionCodes = (role.role_permissions as RolePermissionJoin[] | undefined)?.map( // Use the defined type
                    (rp: RolePermissionJoin) => { // Use the defined type
                        const permissionsData = rp?.permissions;
                        if (Array.isArray(permissionsData)) {
                            // Handle case where permissions is an array (take the first element's code if exists)
                            return permissionsData[0]?.code; 
                        } else if (typeof permissionsData === 'object' && permissionsData !== null) {
                            // Handle case where permissions is an object
                            return permissionsData.code;
                        }
                        return null; // Return null if permissions is missing or not in expected format
                    }
                ).filter((code): code is string => Boolean(code)) || []; // Filter out null/undefined codes

                return {
                    ...role,
                    permissionCodes: permissionCodes, // Now contains codes, not IDs
                    role_permissions: undefined, // Remove the original join data
                };
            }) || null;


            // Ensure the returned type matches what the slice expects.
            // Might need to adjust the Role type in types/index.ts to include permissionCodes: string[]
            return { data: mappedData as Role[] | null, error };

        } catch (err) {
            apiLogger.error('permissionsApi.getRoles', `Client-side error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            const apiError: CustomApiError = err instanceof Error ?
                { message: err.message, details: 'Client-side processing error', hint: '', code: 'CLIENT_ERROR' }
                : { message: 'An unknown error occurred', details: '', hint: '', code: 'UNKNOWN' };
            return { data: null, error: apiError };
        }
    },

    /**
     * Fetches a specific role by its ID.
     */
    async getRoleById(roleId: string): Promise<{ data: Role | null; error: PostgrestError | CustomApiError | null }> {
        if (!supabase) return createSupabaseNotAvailableErrorObject();
        try {
            if (!roleId) {
                validationLogger.error('roleId', 'missing');
                return { data: null, error: { message: 'Role ID is required', details: '', hint: '', code: 'VALIDATION' } };
            }
            const { data, error } = await supabase
                .from('roles')
                .select('*')
                .eq('id', roleId)
                .maybeSingle<Role>();

            if (error) {
                apiLogger.error('permissionsApi.getRoleById', `Database error: ${cleanForLog({ code: error.code, message: error.message })}`);
            }

            return { data, error };

        } catch (err) {
            apiLogger.error('permissionsApi.getRoleById', `Client-side error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            const apiError: CustomApiError = err instanceof Error ?
                { message: err.message, details: 'Client-side exception', hint: '', code: 'CLIENT_ERROR' }
                : { message: 'An unknown error occurred', details: '', hint: '', code: 'UNKNOWN' };
            return { data: null, error: apiError };
        }
    },

    /**
     * Adds a new role (basic info only).
     */
    async addRole(roleData: RoleBasicData): Promise<{ data: Role | null; error: PostgrestError | CustomApiError | null }> {
        if (!supabase) return createSupabaseNotAvailableErrorObject();
        
        try {
            // استخدام الوظيفة المخصصة create_role بدلاً من الإدخال المباشر
            const { data, error } = await supabase.rpc('create_role', {
                p_name: roleData.name,
                p_code: roleData.code,
                p_description: roleData.description,
                p_level: roleData.level,
                p_is_active: roleData.is_active ?? true,
                p_is_system: false
            }).single();

            if (error) {
                apiLogger.error('permissionsApi.addRole', `Database error: ${cleanForLog({ code: error.code, message: error.message })}`);
            }

            return { data: data as Role | null, error };
        } catch (err) {
            apiLogger.error('permissionsApi.addRole', `Client-side error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            const apiError = err instanceof Error ?
                { message: err.message, details: 'Client-side error', hint: '', code: 'CLIENT_ERROR' } :
                { message: 'An unknown error occurred', details: '', hint: '', code: 'UNKNOWN' };
            return { data: null, error: apiError };
        }
    },

    /**
     * Updates an existing role's basic information based on RoleBasicData.
     */
    async updateRole(roleId: string, roleData: Partial<RoleBasicData>): Promise<{ data: Role | null; error: PostgrestError | CustomApiError | null }> {
        if (!supabase) return createSupabaseNotAvailableErrorObject();
        try {
            if (!roleId) {
                 return { data: null, error: { message: 'Role ID is required for update', details: '', hint: '', code: 'VALIDATION' } }; 
            }
            const updatePayload: Partial<Role> = {};
            if (roleData.name !== undefined) updatePayload.name = roleData.name;
            if (roleData.code !== undefined) updatePayload.code = roleData.code;
            if (Object.prototype.hasOwnProperty.call(roleData, 'description')) updatePayload.description = roleData.description;
            if (roleData.level !== undefined) updatePayload.level = roleData.level;
            if (roleData.is_active !== undefined) updatePayload.is_active = roleData.is_active;

             if (Object.keys(updatePayload).length === 0) {
                 validationLogger.error('updateRole', 'no_fields_to_update');
                 return this.getRoleById(roleId);
             }

            logger.info('permissionsApi.updateRole: Processing role update');

            const { data, error } = await supabase
                .from('roles')
                .update(updatePayload) 
                .eq('id', roleId)
                .select();

            console.log('[permissionsApi.updateRole] Raw Supabase response - data:', data);
            console.log('[permissionsApi.updateRole] Raw Supabase response - error:', error);

            if (error) {
                console.error('Error updating role:', error);
            }

            // Handle the array returned by update().select()
            // If update was successful and returned data, take the first element.
            let updatedRole: Role | null = null;
            if (data && data.length > 0) {
                updatedRole = data[0];
            } else if (!error) {
                // If no data returned but no error, try fetching the role again to ensure consistency
                const { data: fetchedRole, error: fetchError } = await this.getRoleById(roleId);
                if (fetchError) {
                    console.error('[permissionsApi.updateRole] Error fetching role after failed update data return:', fetchError);
                    return { data: null, error: fetchError }; // Return the error if fetching also fails
                }
                updatedRole = fetchedRole; // Use the fetched role
            }

            // Return the single updated role object or null
            return { data: updatedRole as Role | null, error };
        } catch (err) {
            console.error('Unexpected error updating role:', err);
             const apiError: CustomApiError = err instanceof Error ? 
                { message: err.message, details: 'Client-side error', hint: '', code: 'CLIENT_ERROR' } 
                : { message: 'An unknown error occurred', details: '', hint: '', code: 'UNKNOWN' };
            return { data: null, error: apiError };
        }
    },

    /**
     * Deletes a role.
     */
    async deleteRole(roleId: string): Promise<{ error: PostgrestError | CustomApiError | null }> {
        if (!supabase) return { error: createSupabaseNotAvailableErrorObject().error };
        try {
             if (!roleId) {
                 return { error: { message: 'Role ID is required for deletion', details: '', hint: '', code: 'VALIDATION' } }; 
            }
            console.log('[permissionsApi.deleteRole] Attempting to delete role with ID:', roleId);
            const { error } = await supabase
                .from('roles')
                .delete()
                .eq('id', roleId);

            console.log('[permissionsApi.deleteRole] Supabase delete response error:', error);

            if (error) {
                console.error('Error deleting role:', error);
            }
            return { error }; // error can be PostgrestError or null
        } catch (err) {
            console.error('Unexpected error deleting role:', err);
            const apiError: CustomApiError = err instanceof Error ? 
                { message: err.message, details: 'Client-side error', hint: '', code: 'CLIENT_ERROR' } 
                : { message: 'An unknown error occurred', details: '', hint: '', code: 'UNKNOWN' };
            return { error: apiError };
        }
    },

    /**
     * Assigns a role to a user/admin by updating their role_id.
     */
    async assignRoleToUser(userId: string, roleId: string | null): Promise<{ error: PostgrestError | CustomApiError | null }> {
        if (!supabase) return { error: createSupabaseNotAvailableErrorObject().error };
        try {
            if (!userId) {
                 return { error: { message: 'User ID cannot be empty', details: '', hint: '', code: 'VALIDATION' } }; 
            }

            const { error } = await supabase
                .from('admins') 
                .update({ role_id: roleId }) 
                .eq('id', userId);

            if (error) {
                console.error(`Error assigning role ${roleId} to user ${userId}:`, error);
            }

            return { error };
        } catch (err) {
            console.error('Unexpected error assigning role to user:', err);
            const apiError: CustomApiError = err instanceof Error ? 
                { message: err.message, details: 'Client-side error', hint: '', code: 'CLIENT_ERROR' } 
                : { message: 'An unknown error occurred', details: '', hint: '', code: 'UNKNOWN' };
            return { error: apiError };
        }
    },

    /**
     * Removes a role from a user/admin (sets role_id to null).
     */
    async removeRoleFromUser(userId: string): Promise<{ error: PostgrestError | CustomApiError | null }> {
         return this.assignRoleToUser(userId, null); 
    },

    /**
     * Fetches the list of permission IDs associated with a specific role from the role_permissions table.
     */
    async getRolePermissions(roleId: string): Promise<{ data: string[] | null; error: PostgrestError | CustomApiError | null }> {
        if (!supabase) return createSupabaseNotAvailableErrorObject();
        try {
            if (!roleId) {
                console.warn('getRolePermissions called without roleId');
                 return { data: null, error: { message: 'Role ID is required', details: '', hint: '', code: 'VALIDATION' } }; 
            }
            const { data, error } = await supabase
                .from('role_permissions')
                .select('permission_id')
                .eq('role_id', roleId);

            if (error) {
                console.error("Error fetching role permissions:", error);
                return { data: null, error };
            }
            const permissionIds = data?.map((item: { permission_id: string | null }) => item.permission_id)
                                      .filter((id): id is string => id !== null) || [];
            return { data: permissionIds, error: null };
        } catch (err) {
            console.error("Exception fetching role permissions:", err);
             const apiError: CustomApiError = err instanceof Error ? 
                { message: err.message, details: 'Client-side error', hint: '', code: 'CLIENT_ERROR' } 
                : { message: 'An unknown error occurred', details: '', hint: '', code: 'UNKNOWN' };
            return { data: null, error: apiError };
        }
    },

    /**
     * Synchronizes permissions for a role in the role_permissions table.
     */
    async syncRolePermissions(roleId: string, newPermissionIds: string[]): Promise<{ error: PostgrestError | CustomApiError | null }> {
        if (!supabase) return { error: createSupabaseNotAvailableErrorObject().error };
        try {
             if (!roleId) {
                console.warn('syncRolePermissions called without roleId');
                 return { error: { message: 'Role ID is required', details: '', hint: '', code: 'VALIDATION' } }; 
             }

             const { data: currentPermissionsData, error: fetchError } = await this.getRolePermissions(roleId);
             // Handle CustomApiError from getRolePermissions
             if (fetchError && 'message' in fetchError) { // Check if it's PostgrestError or CustomApiError
                 console.error("Failed to fetch current permissions before sync:", fetchError);
                 return { error: fetchError };
             }
             const currentPermissionIds = new Set(currentPermissionsData || []);
             const newPermissionIdsSet = new Set(newPermissionIds || []); 

             const permissionsToRemove = [...currentPermissionIds].filter(id => !newPermissionIdsSet.has(id));
             const permissionsToAdd = [...newPermissionIdsSet].filter(id => !currentPermissionIds.has(id));

             let operationError: PostgrestError | CustomApiError | null = null;

             if (permissionsToRemove.length > 0) {
                 if (!supabase) { operationError = createSupabaseNotAvailableErrorObject().error; } 
                 else {
                     const { error: deleteError } = await supabase
                         .from('role_permissions')
                         .delete()
                         .eq('role_id', roleId)
                         .in('permission_id', permissionsToRemove);
                     if (deleteError) {
                         console.error("Error removing role permissions:", deleteError);
                         operationError = deleteError; 
                     }
                 }
             }

             if (permissionsToAdd.length > 0 && !operationError) { 
                if (!supabase) { operationError = createSupabaseNotAvailableErrorObject().error; } 
                else {
                    const insertPayload = permissionsToAdd.map(permissionId => ({ 
                        role_id: roleId, 
                        permission_id: permissionId 
                    }));
                    console.log('[syncRolePermissions] Adding permissions:', {
                      roleId,
                      count: permissionsToAdd.length,
                      permissionIds: permissionsToAdd
                    });
                    const { error: insertError } = await supabase
                        .from('role_permissions')
                        .insert(insertPayload);
                    if (insertError) {
                        console.error("Error adding role permissions:", insertError);
                        operationError = insertError; 
                    } else {
                        console.log('[syncRolePermissions] Successfully added permissions');
                    }
                }
            }
            
            // Log summary
            console.log('[syncRolePermissions] Summary:', {
              roleId,
              removed: permissionsToRemove.length,
              added: permissionsToAdd.length,
              error: operationError ? 'Yes' : 'No'
            });

             return { error: operationError }; 

         } catch (err) {
            console.error("Exception syncing role permissions:", err);
             const apiError: CustomApiError = err instanceof Error ? 
                 { message: err.message, details: 'Client-side error', hint: '', code: 'CLIENT_ERROR' } 
                 : { message: 'An unknown error occurred', details: '', hint: '', code: 'UNKNOWN' };
             return { error: apiError };
         }
    },

    /**
     * Checks if an admin has a specific permission by calling the DB function.
     * @param adminId The ID of the admin user.
     * @param permissionCode The code of the permission to check (e.g., 'orders:view').
     */
    async hasPermission(adminId: string, permissionCode: string): Promise<boolean> {
        if (!supabase) { console.error('Supabase client not available for hasPermission check'); return false; }
        try {
            if (!adminId || !permissionCode) {
                console.warn('hasPermission called with missing adminId or permissionCode');
                return false;
            }

            // Call the correct enhanced RPC function
            const { data, error } = await supabase.rpc('check_admin_permission_enhanced', {
                p_admin_id: adminId,
                permission_code: permissionCode
            });

            if (error) {
                console.error(`Error calling check_admin_permission_enhanced RPC for admin ${adminId}, permission ${permissionCode}:`, error);
                return false;
            }

            return data === true;
        } catch (err) {
            console.error('Unexpected error in hasPermission RPC call:', err);
            return false;
        }
    },

    /**
     * Fetches users/admins based on a specific role ID.
     */
    async getUsersByRole(roleId: string): Promise<{ data: Admin[] | null; error: PostgrestError | CustomApiError | null }> {
        if (!supabase) return createSupabaseNotAvailableErrorObject();
        try {
             if (!roleId) {
                console.warn('getUsersByRole called without roleId');
                return { data: null, error: { message: 'Role ID is required', details: '', hint: '', code: 'VALIDATION' } }; 
            }
            const { data, error } = await supabase
                .from('admins') 
                .select(`
                    id,
                    user_id,
                    email,
                    username,
                    full_name,
                    is_active,
                    role_id, 
                    department_id,
                    manager_id,
                    phone,
                    profile_image_url,
                    created_at,
                    updated_at,
                    role:roles ( name, code, level ) 
                `); 

            if (error) {
                console.error(`Error fetching users for role ${roleId}:`, error);
            }

            return { data: data as Admin[] | null, error };
        } catch (err) {
            console.error('Unexpected error fetching users by role:', err);
             const apiError: CustomApiError = err instanceof Error ? 
                { message: err.message, details: 'Client-side error', hint: '', code: 'CLIENT_ERROR' } 
                : { message: 'An unknown error occurred', details: '', hint: '', code: 'UNKNOWN' };
            return { data: null, error: apiError };
        }
    },

    /**
     * Adds a new system permission to the permissions table.
     */
    async addPermission(permissionData: Omit<PermissionData, 'id' | 'created_at' | 'updated_at' | 'resource_name' | 'action_name' | 'group_name'>): Promise<{ data: PermissionData | null; error: PostgrestError | CustomApiError | null }> {
        if (!supabase) return createSupabaseNotAvailableErrorObject();

        // --- الحاجة إلى الحصول على معرف المستخدم الحالي ---
        // TODO: استبدل هذا بالكود الفعلي لجلب userId
        // مثال: const { data: { user } } = await supabase.auth.getUser();
        //       if (!user) return { data: null, error: { message: 'User not authenticated', details: '', hint: '', code: 'AUTH_ERROR' } };
        //       const requestingUserId = user.id;
        // للحصول على الـ userId، يمكن استخدام supabase.auth.getUser()
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('addPermission: User not authenticated');
            return { data: null, error: { message: 'User not authenticated for adding permission', details: 'No active user session found.', hint: 'Please login again.', code: 'USER_NOT_AUTHENTICATED' } };
        }
        const requestingUserId = user.id;
        // --- نهاية قسم الحصول على معرف المستخدم ---

        try {
            // العودة لاستخدام RPC لتجاوز سياسات RLS (SECURITY DEFINER)
            const { data, error } = await supabase.rpc('create_permission', {
                p_requesting_user_id: requestingUserId,
                p_code: permissionData.code,
                p_description: permissionData.description ?? null,
                p_resource_id: permissionData.resource_id,
                p_action_id: permissionData.action_id
            });

            if (error) {
                console.error('Error adding permission via RPC:', error);
                return { data: null, error };
            }

            const newPermission = Array.isArray(data) ? data[0] : data;
            return { data: newPermission as PermissionData | null, error: null };

        } catch (err) {
            console.error('Unexpected error in addPermission:', err);
            const apiError: CustomApiError = err instanceof Error ?
                { message: err.message, details: 'Client-side RPC call error', hint: '', code: 'CLIENT_RPC_ERROR' }
                : { message: 'An unknown error occurred during addPermission RPC call', details: '', hint: '', code: 'UNKNOWN_RPC_ERROR' };
            return { data: null, error: apiError };
        }
    },

    /**
     * Updates an existing permission.
     */
    async updatePermission(permissionId: string, permissionData: Partial<Omit<PermissionData, 'id' | 'created_at' | 'updated_at' | 'resource_name' | 'action_name' | 'group_name'>>): Promise<{ data: PermissionData | null; error: PostgrestError | CustomApiError | null }> {
        if (!supabase) return createSupabaseNotAvailableErrorObject();
        if (!permissionId) {
            return { data: null, error: { message: 'Permission ID is required for update', details: '', hint: '', code: 'VALIDATION_ERROR' } };
        }

        // --- الحاجة إلى الحصول على معرف المستخدم الحالي ---
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('updatePermission: User not authenticated');
            return { data: null, error: { message: 'User not authenticated for updating permission', details: 'No active user session found.', hint: 'Please login again.', code: 'USER_NOT_AUTHENTICATED' } };
        }
        const requestingUserId = user.id;
        // --- نهاية قسم الحصول على معرف المستخدم ---

        try {
            // العودة لاستخدام RPC المخصص للتحديث لتجاوز RLS
            const { data, error } = await supabase.rpc('update_permission', {
                p_requesting_user_id: requestingUserId,
                p_permission_id: permissionId,
                p_code: permissionData.code ?? null,
                p_description: permissionData.description ?? null,
                p_resource_id: permissionData.resource_id ?? null,
                p_action_id: permissionData.action_id ?? null
            });

            if (error) {
                console.error('Error updating permission via RPC:', error);
                return { data: null, error };
            }

            const updatedPermission = Array.isArray(data) ? data[0] : data;
            return { data: updatedPermission as PermissionData | null, error: null };

        } catch (err) {
            console.error('Unexpected error in updatePermission:', err);
            const apiError: CustomApiError = err instanceof Error ?
                { message: err.message, details: 'Client-side RPC call error', hint: '', code: 'CLIENT_RPC_ERROR' }
                : { message: 'An unknown error occurred during permission update', details: '', hint: '', code: 'UNKNOWN_ERROR' };
            return { data: null, error: apiError };
        }
    },

    /**
     * Deletes a permission by its ID.
     */
    async deletePermission(permissionId: string): Promise<{ error: PostgrestError | CustomApiError | null }> {
        if (!supabase) return { error: createSupabaseNotAvailableErrorObject().error };
        if (!permissionId) {
            return { error: { message: 'Permission ID is required for deletion', details: '', hint: '', code: 'VALIDATION_ERROR' } };
        }

        // --- الحاجة إلى الحصول على معرف المستخدم الحالي ---
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('deletePermission: User not authenticated');
            return { error: { message: 'User not authenticated for deleting permission', details: 'No active user session found.', hint: 'Please login again.', code: 'USER_NOT_AUTHENTICATED' } };
        }
        const requestingUserId = user.id;
        // --- نهاية قسم الحصول على معرف المستخدم ---

        try {
            const { error } = await supabase.rpc('delete_permission', {
                p_requesting_user_id: requestingUserId,
                p_permission_id: permissionId
            });

            if (error) {
                console.error('Error deleting permission via RPC:', error);
                return { error };
            }

            return { error: null };

        } catch (err) {
            console.error('Unexpected error in deletePermission:', err);
            const apiError: CustomApiError = err instanceof Error ?
                { message: err.message, details: 'Client-side RPC call error', hint: '', code: 'CLIENT_RPC_ERROR' }
                : { message: 'An unknown error occurred during deletePermission RPC call', details: '', hint: '', code: 'UNKNOWN_RPC_ERROR' };
            return { error: apiError };
        }
    },

    // --- Deprecated/Removed Functions ---
    // getAdminPermissions, updateAdminPermissions (use role-based system)
    // updateScopedPermissions, hasPermissionWithScope (relied on complex JSONB)
    // addPermission, updatePermission, deletePermission (old structure, use getAvailablePermissions)
};

// --- Standalone Helper Functions ---

/**
 * Fetches all available resources.
 */
export const getResources = async (): Promise<{ data: Resource[] | null; error: PostgrestError | CustomApiError | null }> => {
    if (!supabase) return { data: null, error: createSupabaseNotAvailableErrorObject().error };
    try {
        const { data, error } = await supabase
            .from('resources')
            .select('id, name, code') // Select specific fields
            .eq('is_active', true); // Only active resources

        if (error) {
            console.error('Error fetching resources:', error);
        }
        return { data: data as Resource[] | null, error };
    } catch (err) {
        console.error('Unexpected error fetching resources:', err);
        const apiError: CustomApiError = err instanceof Error ? 
            { message: err.message, details: 'Client-side error', hint: '', code: 'CLIENT_ERROR' } 
            : { message: 'An unknown error occurred', details: '', hint: '', code: 'UNKNOWN' };
        return { data: null, error: apiError };
    }
};

/**
 * Fetches all available actions.
 */
export const getActions = async (): Promise<{ data: Action[] | null; error: PostgrestError | CustomApiError | null }> => {
    if (!supabase) return { data: null, error: createSupabaseNotAvailableErrorObject().error };
    try {
        const { data, error } = await supabase
            .from('actions')
            .select('id, name, code'); // Select specific fields

        if (error) {
            console.error('Error fetching actions:', error);
        }
        return { data: data as Action[] | null, error };
    } catch (err) {
        console.error('Unexpected error fetching actions:', err);
        const apiError: CustomApiError = err instanceof Error ? 
            { message: err.message, details: 'Client-side error', hint: '', code: 'CLIENT_ERROR' } 
            : { message: 'An unknown error occurred', details: '', hint: '', code: 'UNKNOWN' };
        return { data: null, error: apiError };
    }
};

// CRUD: Resources
export const createResource = async (payload: { name: string; code: string; description?: string | null; is_active?: boolean }): Promise<{ data: Resource | null; error: PostgrestError | CustomApiError | null }> => {
    if (!supabase) return { data: null, error: createSupabaseNotAvailableErrorObject().error };
    try {
        const { data, error } = await supabase
            .from('resources')
            .insert({
                name: payload.name,
                code: payload.code,
                description: payload.description ?? null,
                is_active: payload.is_active ?? true
            })
            .select('id, name, code, description, is_active')
            .single();
        if (error) return { data: null, error };
        return { data: data as unknown as Resource, error: null };
    } catch (err) {
        const apiError: CustomApiError = err instanceof Error ? { message: err.message, details: 'createResource client error', hint: '', code: 'CLIENT_ERROR' } : { message: 'Unknown', details: '', hint: '', code: 'UNKNOWN' };
        return { data: null, error: apiError };
    }
};

export const updateResource = async (id: string, payload: Partial<{ name: string; code: string; description: string | null; is_active: boolean }>): Promise<{ data: Resource | null; error: PostgrestError | CustomApiError | null }> => {
    if (!supabase) return { data: null, error: createSupabaseNotAvailableErrorObject().error };
    try {
        const { data, error } = await supabase
            .from('resources')
            .update(payload)
            .eq('id', id)
            .select('id, name, code, description, is_active')
            .single();
        if (error) return { data: null, error };
        return { data: data as unknown as Resource, error: null };
    } catch (err) {
        const apiError: CustomApiError = err instanceof Error ? { message: err.message, details: 'updateResource client error', hint: '', code: 'CLIENT_ERROR' } : { message: 'Unknown', details: '', hint: '', code: 'UNKNOWN' };
        return { data: null, error: apiError };
    }
};

export const deleteResource = async (id: string): Promise<{ error: PostgrestError | CustomApiError | null }> => {
    if (!supabase) return { error: createSupabaseNotAvailableErrorObject().error };
    try {
        const { error } = await supabase.from('resources').delete().eq('id', id);
        return { error };
    } catch (err) {
        const apiError: CustomApiError = err instanceof Error ? { message: err.message, details: 'deleteResource client error', hint: '', code: 'CLIENT_ERROR' } : { message: 'Unknown', details: '', hint: '', code: 'UNKNOWN' };
        return { error: apiError };
    }
};

// CRUD: Actions
export const createAction = async (payload: { name: string; code: string; description?: string | null }): Promise<{ data: Action | null; error: PostgrestError | CustomApiError | null }> => {
    if (!supabase) return { data: null, error: createSupabaseNotAvailableErrorObject().error };
    try {
        const { data, error } = await supabase
            .from('actions')
            .insert({ name: payload.name, code: payload.code, description: payload.description ?? null })
            .select('id, name, code, description')
            .single();
        if (error) return { data: null, error };
        return { data: data as unknown as Action, error: null };
    } catch (err) {
        const apiError: CustomApiError = err instanceof Error ? { message: err.message, details: 'createAction client error', hint: '', code: 'CLIENT_ERROR' } : { message: 'Unknown', details: '', hint: '', code: 'UNKNOWN' };
        return { data: null, error: apiError };
    }
};

export const updateAction = async (id: string, payload: Partial<{ name: string; code: string; description: string | null }>): Promise<{ data: Action | null; error: PostgrestError | CustomApiError | null }> => {
    if (!supabase) return { data: null, error: createSupabaseNotAvailableErrorObject().error };
    try {
        const { data, error } = await supabase
            .from('actions')
            .update(payload)
            .eq('id', id)
            .select('id, name, code, description')
            .single();
        if (error) return { data: null, error };
        return { data: data as unknown as Action, error: null };
    } catch (err) {
        const apiError: CustomApiError = err instanceof Error ? { message: err.message, details: 'updateAction client error', hint: '', code: 'CLIENT_ERROR' } : { message: 'Unknown', details: '', hint: '', code: 'UNKNOWN' };
        return { data: null, error: apiError };
    }
};

export const deleteAction = async (id: string): Promise<{ error: PostgrestError | CustomApiError | null }> => {
    if (!supabase) return { error: createSupabaseNotAvailableErrorObject().error };
    try {
        const { error } = await supabase.from('actions').delete().eq('id', id);
        return { error };
    } catch (err) {
        const apiError: CustomApiError = err instanceof Error ? { message: err.message, details: 'deleteAction client error', hint: '', code: 'CLIENT_ERROR' } : { message: 'Unknown', details: '', hint: '', code: 'UNKNOWN' };
        return { error: apiError };
    }
};

/**
 * Fetches all available admin groups.
 */
export const getAdminGroups = async (): Promise<{ data: AdminGroup[] | null; error: PostgrestError | CustomApiError | null }> => {
    if (!supabase) return { data: null, error: createSupabaseNotAvailableErrorObject().error };
    try {
        const { data, error } = await supabase
            .from('admin_groups')
            .select('id, name'); // Select specific fields

        if (error) {
            console.error('Error fetching admin groups:', error);
        }
        return { data: data as AdminGroup[] | null, error };
    } catch (err) {
        console.error('Unexpected error fetching admin groups:', err);
        const apiError: CustomApiError = err instanceof Error ? 
            { message: err.message, details: 'Client-side error', hint: '', code: 'CLIENT_ERROR' } 
            : { message: 'An unknown error occurred', details: '', hint: '', code: 'UNKNOWN' };
        return { data: null, error: apiError };
    }
};