import { JobTitle, JobTitlePermission, OrgMember, OrgUnit, OrgUnitPermission, OrgUnitTreeNode } from './types';

export interface OrgUnitRepository {
  create(payload: Omit<OrgUnit, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> & { isActive?: boolean }): Promise<OrgUnit>;
  update(id: string, payload: Partial<Omit<OrgUnit, 'id' | 'createdAt' | 'updatedAt'>>): Promise<OrgUnit>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<OrgUnit | null>;
  listTree(warehouseId?: number | null): Promise<OrgUnitTreeNode[]>;
  move(id: string, newParentId: string | null, newPath: string): Promise<OrgUnit>;
}

export interface JobTitleRepository {
  create(payload: Omit<JobTitle, 'id' | 'createdAt' | 'isActive'> & { isActive?: boolean }): Promise<JobTitle>;
  update(id: string, payload: Partial<Omit<JobTitle, 'id' | 'createdAt'>>): Promise<JobTitle>;
  delete(id: string): Promise<void>;
  listByOrgUnit(orgUnitId: string): Promise<JobTitle[]>;
  findById(id: string): Promise<JobTitle | null>;
}

export interface OrgMemberRepository {
  assign(payload: Omit<OrgMember, 'id' | 'createdAt' | 'isPrimary'> & { isPrimary?: boolean }): Promise<OrgMember>;
  unassign(id: string): Promise<void>;
  listByOrgUnit(orgUnitId: string): Promise<OrgMember[]>;
  listByAdmin(adminId: string): Promise<OrgMember[]>;
}

export interface OrgUnitPermissionRepository {
  grant(payload: Omit<OrgUnitPermission, 'id'>): Promise<OrgUnitPermission>;
  revoke(orgUnitId: string, permissionId: string): Promise<void>;
  list(orgUnitId: string): Promise<OrgUnitPermission[]>;
}

export interface JobTitlePermissionRepository {
  grant(payload: Omit<JobTitlePermission, 'id'>): Promise<JobTitlePermission>;
  revoke(jobTitleId: string, permissionId: string): Promise<void>;
  list(jobTitleId: string): Promise<JobTitlePermission[]>;
}


