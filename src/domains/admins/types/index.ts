import { PostgrestError } from '@supabase/supabase-js';

/**
 * أنواع الأدوار المتاحة للمسؤولين
 */
export type AdminRole = 'super_admin' | 'admin' | 'manager' | 'supervisor' | 'support' | 'viewer';

/**
 * واجهة قائمة المسؤولين مع البيانات الوصفية
 */
export interface AdminsListResponse {
  data: Admin[];
  total: number;
  page: number;
  limit: number;
}

/**
 * معايير تصفية المسؤولين
 */
export interface AdminFilters {
  search?: string;
  role?: AdminRole;
  is_active?: boolean;
  department_id?: string;
  page?: number;
  limit?: number;
}

/**
 * بيانات إنشاء مسؤول جديد
 */
export interface CreateAdminDto {
  email: string;
  password: string;
  confirm_password: string;
  username: string;
  full_name: string;
  role?: string;
  role_id?: string;
  department_id?: string;
  manager_id?: string;
  job_title?: string;
  phone?: string;
  profile_image_url?: string;
  permissions?: AdminPermissions;
  admin_id?: string;
  user_id?: string;
  initial_balance?: number;
}

export type { AdminCredentials, AuthResult } from './auth';

export interface UpdateAdminDto {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  is_active: boolean;
  role: AdminRole;
  phone?: string;
  profile_image_url?: string;
  permissions?: AdminPermissions;
}

// ==================================
// Permissions & Roles Types
// ==================================

/**
 * Represents scoped permissions structure within AdminPermissions.
 */
export interface ScopedPermissions {
    // scopeType (e.g., 'region', 'department')
    [scopeType: string]: {
        // permissionCode (e.g., 'orders:manage')
        [permissionCode: string]: string[]; // Array of scope values (e.g., ['north', 'south'] or ['dept_123'])
    };
}

/**
 * Represents the permissions assigned to an admin, often stored in JSONB.
 * Keys are permission codes (e.g., 'orders:view'), values are boolean.
 * Includes optional scoped permissions.
 */
export interface AdminPermissions {
    [key: string]: boolean | ScopedPermissions | undefined;
    scoped_permissions?: ScopedPermissions;
}

/**
 * Represents a single permission with potentially resolved names.
 * Corresponds to the 'permissions' table structure plus potential joins.
 */
export interface PermissionData {
    id: string;
    code: string;
    description: string | null;
    name?: string | null; // Optional human-readable name
    resource_id: string | null; // FK to resources table
    resource_name?: string;     // Optional: Populated from join with resources
    action_id: string | null;    // FK to actions table
    action_name?: string;     // Optional: Populated from join with actions
    group_id?: string | null;     // Optional: Not directly on permissions table per current schema
    group_name?: string;      // Optional: Not directly on permissions table per current schema
    created_at: string;
    updated_at: string | null;
}

/**
 * Response type for listing permissions.
 */
export interface PermissionsListResponse {
    data: PermissionData[] | null;
    error: PostgrestError | Error | null;
}

/**
 * Represents basic data for creating/updating a Role (maps to 'roles' table fields).
 */
export interface RoleBasicData {
    name: string;
    code: string;          // Unique code for the role (e.g., 'super_admin')
    description: string | null;
    level: number;         // Hierarchy level (e.g., 100 for highest)
    is_system?: boolean;   // If true, role cannot be modified/deleted by users
    is_active?: boolean;   // Role status
}

/**
 * Represents a Role (maps to 'roles' table).
 */
export interface Role extends RoleBasicData {
    id: string;
    permissionCodes?: string[]; // Array of permission codes associated via role_permissions
    created_at?: string;
    updated_at?: string | null;
}

/**
 * Response type for listing roles.
 */
export interface RolesListResponse {
    data: Role[] | null;
    error: PostgrestError | Error | null;
}

// ==================================
// Admin User Type
// ==================================

/**
 * Represents an Admin user (maps to 'admins' table).
 */
export interface Admin {
    id: string;
    user_id: string | null; // FK to auth.users
    department_id: string | null; // FK to departments
    role_id: string | null; // FK to roles
    manager_id: string | null; // FK to admins (self-reference)
    email: string | null;
    username: string | null;
    full_name: string | null;
    phone: string | null;
    job_title: string | null;
    profile_image_url: string | null;
    permissions: AdminPermissions | null; // Direct JSONB permissions (legacy or overrides)
    is_active: boolean | null;
    last_login: string | null;
    created_at: string;
    updated_at: string | null;
    // Role is now represented by its name (string) or null/undefined
    role: string | null;
}

// ==================================
// Other related types (if any)
// ==================================

// Example: Re-exporting types from another file if needed
// export type { AdminCredentials, AuthResult } from './auth';