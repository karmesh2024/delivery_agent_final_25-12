import { PrismaClient } from '@prisma/client';
import { JobTitlePermissionRepository, OrgUnitPermissionRepository } from '@/domains/hr/domain/repositories';
import { JobTitlePermission, OrgUnitPermission } from '@/domains/hr/domain/types';

export class OrgUnitPermissionPrismaRepository implements OrgUnitPermissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async grant(payload: Omit<OrgUnitPermission, 'id'>): Promise<OrgUnitPermission> {
    const created = await this.prisma.org_unit_permissions.upsert({
      where: { orgUnitId_permissionId: { orgUnitId: payload.orgUnitId, permissionId: payload.permissionId } },
      update: { inherited: payload.inherited },
      create: { orgUnitId: payload.orgUnitId, permissionId: payload.permissionId, inherited: payload.inherited },
    });
    return this.mapUnit(created);
  }

  async revoke(orgUnitId: string, permissionId: string): Promise<void> {
    await this.prisma.org_unit_permissions.delete({
      where: { orgUnitId_permissionId: { orgUnitId, permissionId } },
    });
  }

  async list(orgUnitId: string): Promise<OrgUnitPermission[]> {
    const rows = await this.prisma.org_unit_permissions.findMany({ where: { org_unit_id: orgUnitId } });
    return rows.map(this.mapUnit);
  }

  private mapUnit = (r: any): OrgUnitPermission => ({
    id: r.id,
    orgUnitId: r.orgUnitId,
    permissionId: r.permissionId,
    inherited: r.inherited,
  });
}

export class JobTitlePermissionPrismaRepository implements JobTitlePermissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async grant(payload: Omit<JobTitlePermission, 'id'>): Promise<JobTitlePermission> {
    const created = await this.prisma.job_title_permissions.upsert({
      where: { jobTitleId_permissionId: { jobTitleId: payload.jobTitleId, permissionId: payload.permissionId } },
      update: {},
      create: { jobTitleId: payload.jobTitleId, permissionId: payload.permissionId },
    });
    return this.mapTitle(created);
  }

  async revoke(jobTitleId: string, permissionId: string): Promise<void> {
    await this.prisma.job_title_permissions.delete({
      where: { jobTitleId_permissionId: { jobTitleId, permissionId } },
    });
  }

  async list(jobTitleId: string): Promise<JobTitlePermission[]> {
    const rows = await this.prisma.job_title_permissions.findMany({ where: { jobTitleId } });
    return rows.map(this.mapTitle);
  }

  private mapTitle = (r: any): JobTitlePermission => ({
    id: r.id,
    jobTitleId: r.jobTitleId,
    permissionId: r.permissionId,
  });
}


