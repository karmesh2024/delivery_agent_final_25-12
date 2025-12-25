import { JobTitle, OrgMember, OrgUnit, OrgUnitPermission, JobTitlePermission } from '@/domains/hr/domain/types';
import { JobTitlePermissionRepository, JobTitleRepository, OrgMemberRepository, OrgUnitPermissionRepository, OrgUnitRepository } from '@/domains/hr/domain/repositories';

export class HrUseCases {
  constructor(
    private readonly orgUnits: OrgUnitRepository,
    private readonly jobTitles: JobTitleRepository,
    private readonly members: OrgMemberRepository,
    private readonly unitPerms: OrgUnitPermissionRepository,
    private readonly titlePerms: JobTitlePermissionRepository,
  ) {}

  // Org Units
  async createOrgUnit(input: Omit<OrgUnit, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> & { isActive?: boolean }): Promise<OrgUnit> {
    return this.orgUnits.create(input);
  }

  async updateOrgUnit(id: string, input: Partial<Omit<OrgUnit, 'id' | 'createdAt' | 'updatedAt'>>): Promise<OrgUnit> {
    return this.orgUnits.update(id, input);
  }

  async moveOrgUnit(id: string, newParentId: string | null): Promise<OrgUnit> {
    // naive new path: parent.path + '.' + code (real impl should rebuild path from parent)
    const parent = newParentId ? await this.orgUnits.findById(newParentId) : null;
    const self = await this.orgUnits.findById(id);
    if (!self) throw new Error('Org unit not found');
    const newPath = (parent?.path ? parent.path + '.' : '') + (self.code || self.name.toLowerCase().replace(/\s+/g, '_'));
    return this.orgUnits.move(id, newParentId, newPath);
  }

  async deleteOrgUnit(id: string): Promise<void> {
    await this.orgUnits.delete(id);
  }

  async listOrgUnitsTree(warehouseId?: number | null): Promise<OrgUnitTreeNode[]> {
    return this.orgUnits.listTree(warehouseId);
  }

  // Job Titles
  async createJobTitle(input: Omit<JobTitle, 'id' | 'createdAt' | 'isActive'> & { isActive?: boolean }): Promise<JobTitle> {
    return this.jobTitles.create(input);
  }

  async updateJobTitle(id: string, input: Partial<Omit<JobTitle, 'id' | 'createdAt'>>): Promise<JobTitle> {
    return this.jobTitles.update(id, input);
  }

  async deleteJobTitle(id: string): Promise<void> {
    await this.jobTitles.delete(id);
  }

  async listJobTitlesByOrgUnit(orgUnitId: string): Promise<JobTitle[]> {
    return this.jobTitles.listByOrgUnit(orgUnitId);
  }

  async findJobTitleById(id: string): Promise<JobTitle | null> {
    return this.jobTitles.findById(id);
  }

  // Members
  async assignOrgMember(input: Omit<OrgMember, 'id' | 'createdAt' | 'isPrimary'> & { isPrimary?: boolean }): Promise<OrgMember> {
    return this.members.assign(input);
  }

  async unassignOrgMember(id: string): Promise<void> {
    await this.members.unassign(id);
  }

  async listOrgMembersByOrgUnit(orgUnitId: string): Promise<OrgMember[]> {
    return this.members.listByOrgUnit(orgUnitId);
  }

  async listOrgMembersByAdmin(adminId: string): Promise<OrgMember[]> {
    return this.members.listByAdmin(adminId);
  }

  // Permissions Grants
  async grantPermissionToUnit(input: Omit<OrgUnitPermission, 'id'>): Promise<OrgUnitPermission> {
    return this.unitPerms.grant(input);
  }

  async revokePermissionFromUnit(orgUnitId: string, permissionId: string): Promise<void> {
    await this.unitPerms.revoke(orgUnitId, permissionId);
  }

  async listOrgUnitPermissions(orgUnitId: string): Promise<OrgUnitPermission[]> {
    return this.unitPerms.list(orgUnitId);
  }

  async grantPermissionToJobTitle(input: Omit<JobTitlePermission, 'id'>): Promise<JobTitlePermission> {
    return this.titlePerms.grant(input);
  }
}


