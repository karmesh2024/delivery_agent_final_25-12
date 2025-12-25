import { NextResponse } from 'next/server';
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

export async function DELETE(
  request: Request,
  { params }: { params: { jobTitleId: string; permissionId: string } }
) {
  try {
    const { jobTitleId, permissionId } = params;
    await hrUseCases.revokePermissionFromJobTitle(jobTitleId, permissionId);
    return NextResponse.json({ message: 'تم إلغاء صلاحية المسمى الوظيفي بنجاح' });
  } catch (error: any) {
    console.error("Error in DELETE /api/hr/job-title-permissions/[jobTitleId]/[permissionId]:", error);
    return NextResponse.json({ message: error.message, stack: error.stack }, { status: 500 });
  }
}


