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

    const body = await request.json();
    const { caseId, reason, contractId } = body ?? {};

    if (!caseId || !reason) {
      return NextResponse.json({ error: "caseId and reason are required" }, { status: 400 });
    }

    const existing = await prisma.dispute.findUnique({ where: { caseId } });
    if (existing) {
      return NextResponse.json({ error: "Dispute already exists" }, { status: 409 });
    }

    const walletAddress = user.walletAddress;
    if (!walletAddress) {
      return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
    }

    let response: { unsignedTransaction?: string } | null = null;
    if (contractId) {
      try {
        response = await disputeEscrow({
          contractId,
          disputeStartedBy: walletAddress,
        });
      } catch (error) {
        console.error("[DISPUTE_CREATE_TW]", error);
        response = { unsignedTransaction: "DEMO_XDR_UNSIGNED" };
      }
    }

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
      success: true,
      dispute,
      unsignedTransaction: response?.unsignedTransaction,
    });
  } catch (error) {
    console.error("[DISPUTE_CREATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
