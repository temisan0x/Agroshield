import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { disputeEscrow } from "@/lib/trustlesswork";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "FARMER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { caseId, reason, contractId } = await request.json();

    if (!caseId || !reason || !contractId) {
      return NextResponse.json(
        { error: "caseId, reason, and contractId are required" },
        { status: 400 }
      );
    }

    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        escrow: true,
        dispute: true,
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    if (caseData.farmerId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["IN_PROGRESS", "DELIVERED"].includes(caseData.status)) {
      return NextResponse.json({ error: "Cannot dispute at this stage" }, { status: 400 });
    }

    if (caseData.dispute) {
      return NextResponse.json({ error: "Dispute already raised" }, { status: 400 });
    }

    if (!caseData.escrow?.contractId) {
      return NextResponse.json({ error: "No escrow found" }, { status: 400 });
    }

    if (!user.walletAddress) {
      return NextResponse.json({ error: "Farmer wallet address not found" }, { status: 400 });
    }

    const twData = await disputeEscrow({
      contractId,
      signer: user.walletAddress,
    });

    // Update DB after successful TW call
    const dispute = await prisma.dispute.create({
      data: {
        caseId,
        reason,
        status: "OPEN",
      },
    });

    await prisma.case.update({
      where: { id: caseId },
      data: { status: "DISPUTED" },
    });

    return NextResponse.json({
      unsignedTransaction: twData.unsignedTransaction,
      disputeId: dispute.id,
    });
  } catch (error) {
    console.error("[DISPUTE_RAISE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
