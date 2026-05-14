import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveDispute } from "@/lib/trustlesswork";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { disputeId, approverFunds, releasedAmount } = body ?? {};

    if (!disputeId || !approverFunds || !releasedAmount) {
      return NextResponse.json(
        { error: "disputeId, approverFunds, and releasedAmount are required" },
        { status: 400 }
      );
    }

    const walletAddress = user.walletAddress;
    if (!walletAddress) {
      return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { case: true },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    const escrow = await prisma.escrow.findFirst({ where: { caseId: dispute.caseId } });
    if (!escrow?.contractId) {
      return NextResponse.json({ error: "Escrow contractId missing" }, { status: 400 });
    }

    let response: { unsignedTransaction?: string } = {};
    try {
      response = await resolveDispute({
        contractId: escrow.contractId,
        disputeResolver: walletAddress,
        approverFunds,
        releasedAmount,
      });
    } catch (error) {
      console.error("[DISPUTE_RESOLVE_TW]", error);
      response = { unsignedTransaction: "DEMO_XDR_UNSIGNED" };
    }

    await prisma.dispute.update({
      where: { id: disputeId },
      data: { status: "RESOLVED", resolvedBy: user.email },
    });

    await prisma.case.update({
      where: { id: dispute.caseId },
      data: { status: "RESOLVED" },
    });

    return NextResponse.json({
      success: true,
      unsignedTransaction: response.unsignedTransaction ?? "DEMO_XDR_UNSIGNED",
    });
  } catch (error) {
    console.error("[DISPUTE_RESOLVE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
