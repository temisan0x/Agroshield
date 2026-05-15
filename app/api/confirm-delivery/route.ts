import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "FARMER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { caseId, contractId } = body ?? {};

    if (!caseId || !contractId) {
      return NextResponse.json({ error: "caseId and contractId are required" }, { status: 400 });
    }

    const foundCase = await prisma.case.findUnique({
      where: { id: caseId },
      include: { escrow: true },
    });

    if (!foundCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    if (foundCase.farmerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (foundCase.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Only delivered cases can be confirmed" },
        { status: 400 },
      );
    }

    if (foundCase.escrow?.contractId !== contractId) {
      return NextResponse.json({ error: "Escrow contract mismatch" }, { status: 400 });
    }

    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: { status: "COMPLETED" },
      select: { id: true, status: true },
    });

    return NextResponse.json({
      message: "Delivery confirmed and funds released",
      case: {
        id: updatedCase.id,
        status: updatedCase.status,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[CONFIRM_DELIVERY]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
