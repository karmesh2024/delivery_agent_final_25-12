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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgUnitId: string }> },
) {
  try {
    const { orgUnitId } = await params;
    const jobTitles = await hrUseCases.listJobTitlesByOrgUnit(orgUnitId);
    return NextResponse.json(jobTitles);
  } catch (error: any) {
    console.error(
      "Error in GET /api/hr/org-units/[orgUnitId]/job-titles:",
      error,
    );
    return NextResponse.json({ message: error.message, stack: error.stack }, {
      status: 500,
    });
  }
}
