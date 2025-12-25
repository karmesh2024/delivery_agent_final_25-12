import { AdminPermissions, PermissionData, Role, ScopedPermissions as AdminScopedPermissions } from '@/domains/admins/types';

export interface ManagementTab {
  id: string;
  name: string;
  icon: React.ElementType;
}

// Admin related types (using types from @/domains/admins/types)
export interface Admin {
  id: string;
  email?: string | null;
  username?: string | null;
  full_name?: string | null;
  role?: string | null;
  role_id?: string | null;
  permissions?: AdminPermissions | null; // Use AdminPermissions type
}

export type LocalPermission = PermissionData;
export type LocalRole = Role;
export type ScopedPermissions = AdminScopedPermissions; 