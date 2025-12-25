import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { OrgUnitPrismaRepository } from '@/infrastructure/hr/prisma/OrgUnitPrismaRepository';
import { JobTitlePrismaRepository } from '@/infrastructure/hr/prisma/JobTitlePrismaRepository';
import { OrgMemberPrismaRepository } from '@/infrastructure/hr/prisma/OrgMemberPrismaRepository';
import { OrgUnitPermissionPrismaRepository, JobTitlePermissionPrismaRepository } from '@/infrastructure/hr/prisma/PermissionsLinkPrismaRepository';
import { HrUseCases } from '@/domains/hr/application/useCases';
import { prisma } from '@/lib/prisma';

const orgUnitRepo = new OrgUnitPrismaRepository(prisma);
const jobTitleRepo = new JobTitlePrismaRepository(prisma);
const orgMemberRepo = new OrgMemberPrismaRepository(prisma);
const unitPermRepo = new OrgUnitPermissionPrismaRepository(prisma);
const titlePermRepo = new JobTitlePermissionPrismaRepository(prisma);

const hrUseCases = new HrUseCases(
  orgUnitRepo,
  jobTitleRepo,
  orgMemberRepo,
  unitPermRepo,
  titlePermRepo
);

export async function GET() {
  try {
    const tree = await hrUseCases.listOrgUnitsTree();
    return NextResponse.json(tree);
  } catch (error: any) {
    console.error("Error in GET /api/hr/org-units:", error);
    return NextResponse.json({ message: error.message, stack: error.stack }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { parentId, warehouseId, ...rest } = await request.json();
    const payload = {
      ...rest,
      parentId: parentId === "" ? null : parentId, // تحويل السلسلة الفارغة إلى null
      warehouseId: warehouseId === "" ? null : warehouseId, // تحويل السلسلة الفارغة إلى null
    };
    const newOrgUnit = await hrUseCases.createOrgUnit(payload);
    return NextResponse.json(newOrgUnit, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/hr/org-units:", error);
    return NextResponse.json({ message: error.message, stack: error.stack }, { status: 500 });
  }
}
