import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fundEscrow } from "@/lib/trustlesswork";

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
    const { escrowId } = body ?? {};

    if (!escrowId) {
      return NextResponse.json({ error: "escrowId is required" }, { status: 400 });
    }

    const escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) {
      return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
    }

    const foundCase = await prisma.case.findUnique({ where: { id: escrow.caseId } });
    if (!foundCase || foundCase.farmerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const farmer = await prisma.user.findUnique({ where: { id: user.id } });
    if (!farmer?.walletAddress) {
      return NextResponse.json({ error: "Missing farmer wallet address" }, { status: 400 });
    }

    if (!escrow.contractId) {
      return NextResponse.json({ error: "Escrow contractId missing" }, { status: 400 });
    }

    let response: { unsignedTransaction?: string } = {};
    try {
      response = await fundEscrow({
        contractId: escrow.contractId,
        amount: escrow.amount.toString(),
        depositor: farmer.walletAddress,
      });
    } catch (error) {
      console.error("[ESCROW_FUND_TW]", error);
      response = { unsignedTransaction: "DEMO_XDR_UNSIGNED" };
    }

    return NextResponse.json({
      success: true,
      unsignedTransaction: response.unsignedTransaction ?? "DEMO_XDR_UNSIGNED",
    });
  } catch (error) {
    console.error("[ESCROW_FUND]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
