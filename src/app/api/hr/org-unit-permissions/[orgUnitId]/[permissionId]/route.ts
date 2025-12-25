import { NextResponse } from "next/server";
import { OrgUnitPrismaRepository } from "@/infrastructure/hr/prisma/OrgUnitPrismaRepository";
import { JobTitlePrismaRepository } from "@/infrastructure/hr/prisma/JobTitlePrismaRepository";
import { OrgMemberPrismaRepository } from "@/infrastructure/hr/prisma/OrgMemberPrismaRepository";
import {
  JobTitlePermissionPrismaRepository,
  OrgUnitPermissionPrismaRepository,
} from "@/infrastructure/hr/prisma/PermissionsLinkPrismaRepository";
import { HrUseCases } from "@/domains/hr/application/useCases";
import { prisma } from "@/lib/prisma";

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
  titlePermRepo,
);

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orgUnitId: string; permissionId: string }> },
) {
  try {
    const { orgUnitId, permissionId } = await params;
    await hrUseCases.revokePermissionFromUnit(orgUnitId, permissionId);
    return NextResponse.json({
      message: "تم إلغاء صلاحية الوحدة التنظيمية بنجاح",
    });
  } catch (error: any) {
    console.error(
      "Error in DELETE /api/hr/org-unit-permissions/[orgUnitId]/[permissionId]:",
      error,
    );
    return NextResponse.json({ message: error.message, stack: error.stack }, {
      status: 500,
    });
  }
}
