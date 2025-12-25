import { NextResponse } from 'next/server';
import { OrgMemberPrismaRepository } from '@/infrastructure/hr/prisma/OrgMemberPrismaRepository';
import { OrgUnitPrismaRepository } from '@/infrastructure/hr/prisma/OrgUnitPrismaRepository';
import { JobTitlePrismaRepository } from '@/infrastructure/hr/prisma/JobTitlePrismaRepository';
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newOrgMember = await hrUseCases.assignOrgMember(body);
    return NextResponse.json(newOrgMember, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/hr/org-members:", error);
    return NextResponse.json({ message: error.message, stack: error.stack }, { status: 500 });
  }
}



