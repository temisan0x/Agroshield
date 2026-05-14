import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const bids = await prisma.bid.findMany({
      where: { caseId },
      include: { vendor: { select: { email: true, walletAddress: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, bids });
  } catch (error) {
    console.error("[BIDS_LIST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
