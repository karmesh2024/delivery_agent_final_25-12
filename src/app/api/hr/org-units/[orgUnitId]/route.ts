import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ orgUnitId: string }> },
) {
  try {
    const { orgUnitId } = await params;
    const { parentId, warehouseId, ...rest } = await request.json();
    const payload = {
      ...rest,
      parentId: parentId === "" ? null : parentId, // تحويل السلسلة الفارغة إلى null
      warehouseId: warehouseId === "" ? null : warehouseId, // تحويل السلسلة الفارغة إلى null
    };
    const updatedOrgUnit = await hrUseCases.updateOrgUnit(orgUnitId, payload);
    return NextResponse.json(updatedOrgUnit);
  } catch (error: any) {
    console.error("Error in PUT /api/hr/org-units/[orgUnitId]:", error);
    return NextResponse.json({ message: error.message, stack: error.stack }, {
      status: 500,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orgUnitId: string }> },
) {
  try {
    const { orgUnitId } = await params;
    await hrUseCases.deleteOrgUnit(orgUnitId);
    return NextResponse.json({ message: "الوحدة التنظيمية حذفت بنجاح" });
  } catch (error: any) {
    console.error("Error in DELETE /api/hr/org-units/[orgUnitId]:", error);
    return NextResponse.json({ message: error.message, stack: error.stack }, {
      status: 500,
    });
  }
}
