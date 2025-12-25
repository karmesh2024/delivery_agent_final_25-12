import { PrismaClient } from '@prisma/client';
import { OrgUnitRepository } from '@/domains/hr/domain/repositories';
import { OrgUnit, OrgUnitTreeNode } from '@/domains/hr/domain/types';

export class OrgUnitPrismaRepository implements OrgUnitRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(payload: Omit<OrgUnit, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'path'> & { isActive?: boolean, path?: string }): Promise<OrgUnit> {
    let unitPath = '';
    if (payload.parentId) {
      const parentUnit = await this.findById(payload.parentId);
      if (!parentUnit) throw new Error('Parent Org Unit not found');
      unitPath = parentUnit.path ? `${parentUnit.path}.${payload.code || payload.name.toLowerCase().replace(/\s+/g, '_')}` : `${payload.code || payload.name.toLowerCase().replace(/\s+/g, '_')}`;
    } else {
      unitPath = payload.code || payload.name.toLowerCase().replace(/\s+/g, '_');
    }

    const created = await this.prisma.org_units.create({
      data: {
        name: payload.name,
        code: payload.code ?? null,
        path: unitPath,
        parent_id: payload.parentId ?? null,
        warehouse_id: payload.warehouseId ?? null,
        is_active: payload.isActive ?? true,
      },
    });
    return this.map(created);
  }

  async update(id: string, payload: Partial<Omit<OrgUnit, 'id' | 'createdAt' | 'updatedAt'>>): Promise<OrgUnit> {
    const updated = await this.prisma.org_units.update({
      where: { id },
      data: {
        name: payload.name,
        code: payload.code,
        path: payload.path,
        parent_id: payload.parentId,
        warehouse_id: payload.warehouseId ?? undefined,
        is_active: payload.isActive ?? undefined,
      },
    });
    return this.map(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.org_units.delete({ where: { id } });
  }

  async findById(id: string): Promise<OrgUnit | null> {
    const found = await this.prisma.org_units.findUnique({ where: { id } });
    return found ? this.map(found) : null;
  }

  async listTree(warehouseId?: number | null): Promise<OrgUnitTreeNode[]> {
    const units = await this.prisma.org_units.findMany({
      where: { warehouseId: warehouseId ?? undefined, is_active: true },
      orderBy: [{ path: 'asc' }],
    });
    const mapped = units.map(this.map);
    // Build tree by path
    const byId = new Map<string, OrgUnitTreeNode>();
    mapped.forEach(u => byId.set(u.id, { ...u, children: [] }));
    const roots: OrgUnitTreeNode[] = [];
    byId.forEach(node => {
      if (node.parentId && byId.has(node.parentId)) {
        byId.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }

  async move(id: string, newParentId: string | null, newPath: string): Promise<OrgUnit> {
    const updated = await this.prisma.org_units.update({
      where: { id },
      data: { parentId: newParentId, path: newPath },
    });
    return this.map(updated);
  }

  private map(r: any): OrgUnit {
    return {
      id: r.id,
      warehouseId: r.warehouse_id ?? null,
      name: r.name,
      code: r.code ?? null,
      path: r.path,
      parentId: r.parent_id ?? null,
      isActive: r.is_active,
      createdAt: (r.createdAt ?? r.created_at)?.toString?.() ?? String(r.createdAt ?? r.created_at ?? ''),
      updatedAt: (r.updatedAt ?? r.updated_at)?.toString?.() ?? String(r.updatedAt ?? r.updated_at ?? ''),
    };
  }
}


