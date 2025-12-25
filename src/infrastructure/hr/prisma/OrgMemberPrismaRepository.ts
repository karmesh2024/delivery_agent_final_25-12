import { PrismaClient } from '@prisma/client';
import { OrgMemberRepository } from '@/domains/hr/domain/repositories';
import { OrgMember } from '@/domains/hr/domain/types';

export class OrgMemberPrismaRepository implements OrgMemberRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async assign(payload: Omit<OrgMember, 'id' | 'createdAt' | 'isPrimary'> & { isPrimary?: boolean }): Promise<OrgMember> {
    const created = await this.prisma.org_members.upsert({
      where: { 
        admin_id_org_unit_id: {
          admin_id: payload.adminId,
          org_unit_id: payload.orgUnitId,
        },
      },
      update: {
        job_title_id: payload.jobTitleId ?? null,
        is_primary: payload.isPrimary ?? undefined,
      },
      create: {
        admin_id: payload.adminId,
        org_unit_id: payload.orgUnitId,
        job_title_id: payload.jobTitleId ?? null,
        is_primary: payload.isPrimary ?? true,
      },
    });
    return this.map(created);
  }

  async unassign(id: string): Promise<void> {
    await this.prisma.org_members.delete({ where: { id } });
  }

  async listByOrgUnit(orgUnitId: string): Promise<OrgMember[]> {
    const rows = await this.prisma.org_members.findMany({ where: { org_unit_id: orgUnitId } });
    return rows.map(this.map);
  }

  async listByAdmin(adminId: string): Promise<OrgMember[]> {
    const rows = await this.prisma.org_members.findMany({ where: { admin_id: adminId } });
    return rows.map(this.map);
  }

  private map = (r: any): OrgMember => ({
    id: r.id,
    adminId: r.admin_id,
    orgUnitId: r.org_unit_id,
    jobTitleId: r.job_title_id ?? null,
    isPrimary: r.is_primary,
    createdAt: (r.createdAt ?? r.created_at)?.toString?.() ?? String(r.createdAt ?? r.created_at ?? ''),
  });
}


