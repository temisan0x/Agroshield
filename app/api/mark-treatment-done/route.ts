import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changeMilestoneStatus } from "@/lib/trustlesswork";

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
    const { caseId, contractId } = body ?? {};

    if (!caseId || !contractId) {
      return NextResponse.json({ error: "caseId and contractId are required" }, { status: 400 });
    }

    const bid = await prisma.bid.findFirst({
      where: {
        caseId,
        vendorId: user.id,
        selected: true,
      },
    });

    if (!bid) {
      return NextResponse.json({ error: "No selected bid for this vendor" }, { status: 403 });
    }

    const vendor = await prisma.user.findUnique({ where: { id: user.id } });
    if (!vendor?.walletAddress) {
      return NextResponse.json({ error: "Missing vendor wallet address" }, { status: 400 });
    }

    let response: { unsignedTransaction?: string } = {};
    try {
      response = await changeMilestoneStatus({
        contractId,
        milestoneIndex: "0",
        newStatus: "completed",
        serviceProvider: vendor.walletAddress,
      });
    } catch (error) {
      console.error("[TREATMENT_DONE_TW]", error);
      response = { unsignedTransaction: "DEMO_XDR_UNSIGNED" };
    }

    return NextResponse.json({
      success: true,
      unsignedTransaction: response.unsignedTransaction ?? "DEMO_XDR_UNSIGNED",
    });
  } catch (error) {
    console.error("[TREATMENT_DONE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
