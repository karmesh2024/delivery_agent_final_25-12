import { PrismaClient } from '@prisma/client';
import { JobTitleRepository } from '@/domains/hr/domain/repositories';
import { JobTitle } from '@/domains/hr/domain/types';

export class JobTitlePrismaRepository implements JobTitleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(payload: Omit<JobTitle, 'id' | 'createdAt' | 'isActive'> & { isActive?: boolean }): Promise<JobTitle> {
    const created = await this.prisma.job_titles.create({
      data: {
        name: payload.name,
        code: payload.code ?? null,
        is_active: payload.isActive ?? true,
        org_units: {
          connect: { id: payload.orgUnitId },
        },
      },
    });
    return this.map(created);
  }

  async update(id: string, payload: Partial<Omit<JobTitle, 'id' | 'createdAt'>>): Promise<JobTitle> {
    const updated = await this.prisma.job_titles.update({
      where: { id },
      data: {
        name: payload.name,
        code: payload.code,
        is_active: payload.isActive ?? undefined,
        org_units: payload.orgUnitId
          ? { connect: { id: payload.orgUnitId } } // Connect to the new org unit
          : undefined,
      },
    });
    return this.map(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.job_titles.delete({ where: { id } });
  }

  async listByOrgUnit(orgUnitId: string): Promise<JobTitle[]> {
    const rows = await this.prisma.job_titles.findMany({ where: { org_unit_id: orgUnitId } });
    return rows.map(this.map);
  }

  async findById(id: string): Promise<JobTitle | null> {
    const row = await this.prisma.job_titles.findUnique({ where: { id } });
    return row ? this.map(row) : null;
  }

  private map = (r: any): JobTitle => ({
    id: r.id,
    orgUnitId: r.org_unit_id,
    name: r.name,
    code: r.code ?? null,
    isActive: r.is_active,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
  });
}


