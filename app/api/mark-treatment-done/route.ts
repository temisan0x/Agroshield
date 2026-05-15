import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "VENDOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { caseId, contractId, milestoneIndex } = body ?? {};

    if (!caseId || !contractId || milestoneIndex !== 0) {
      return NextResponse.json(
        { error: "caseId, contractId, and milestoneIndex: 0 are required" },
        { status: 400 },
      );
    }

    const foundCase = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        escrow: true,
        bids: {
          where: { selected: true },
          select: { vendorId: true },
          take: 1,
        },
      },
    });

    if (!foundCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const assignedVendorId = foundCase.bids[0]?.vendorId ?? null;
    if (assignedVendorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (foundCase.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Only in-progress cases can be marked delivered" },
        { status: 400 },
      );
    }

    if (foundCase.escrow?.contractId !== contractId) {
      return NextResponse.json({ error: "Escrow contract mismatch" }, { status: 400 });
    }

    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: { status: "DELIVERED" },
      select: { id: true, status: true },
    });

    return NextResponse.json({
      message: "Treatment marked as delivered",
      case: {
        id: updatedCase.id,
        status: updatedCase.status,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[TREATMENT_DONE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
