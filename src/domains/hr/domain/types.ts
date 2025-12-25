export interface OrgUnit {
  id: string;
  warehouseId?: number | null;
  name: string;
  code?: string | null;
  path: string;
  parentId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobTitle {
  id: string;
  orgUnitId: string;
  name: string;
  code?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface OrgMember {
  id: string;
  adminId: string;
  orgUnitId: string;
  jobTitleId?: string | null;
  isPrimary: boolean;
  createdAt: string;
}

export interface OrgUnitPermission {
  id: string;
  orgUnitId: string;
  permissionId: string;
  inherited: boolean;
}

export interface JobTitlePermission {
  id: string;
  jobTitleId: string;
  permissionId: string;
}

export interface OrgUnitTreeNode extends OrgUnit {
  children: OrgUnitTreeNode[];
}


