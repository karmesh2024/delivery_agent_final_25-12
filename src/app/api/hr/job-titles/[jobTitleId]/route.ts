import { NextResponse } from "next/server";
import { JobTitlePrismaRepository } from "@/infrastructure/hr/prisma/JobTitlePrismaRepository";
import { OrgUnitPrismaRepository } from "@/infrastructure/hr/prisma/OrgUnitPrismaRepository";
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
  { params }: { params: Promise<{ jobTitleId: string }> },
) {
  try {
    const { jobTitleId } = await params;
    const jobTitle = await hrUseCases.findJobTitleById(jobTitleId);

    if (!jobTitle) {
      return NextResponse.json({ message: "المسمى الوظيفي غير موجود" }, {
        status: 404,
      });
    }

    return NextResponse.json(jobTitle);
  } catch (error: any) {
    console.error("Error in GET /api/hr/job-titles/[jobTitleId]:", error);
    return NextResponse.json({ message: error.message, stack: error.stack }, {
      status: 500,
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ jobTitleId: string }> },
) {
  try {
    const { jobTitleId } = await params;
    const updates = await request.json();
    const updatedJobTitle = await hrUseCases.updateJobTitle(
      jobTitleId,
      updates,
    );
    return NextResponse.json(updatedJobTitle);
  } catch (error: any) {
    console.error("Error in PUT /api/hr/job-titles/[jobTitleId]:", error);
    return NextResponse.json({ message: error.message, stack: error.stack }, {
      status: 500,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ jobTitleId: string }> },
) {
  try {
    const { jobTitleId } = await params;
    await hrUseCases.deleteJobTitle(jobTitleId);
    return NextResponse.json({ message: "تم حذف المسمى الوظيفي بنجاح" });
  } catch (error: any) {
    console.error("Error in DELETE /api/hr/job-titles/[jobTitleId]:", error);
    return NextResponse.json({ message: error.message, stack: error.stack }, {
      status: 500,
    });
  }
}
