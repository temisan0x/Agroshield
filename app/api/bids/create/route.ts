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
    const { caseId, amount, proposal } = body ?? {};

    if (!caseId || !amount || !proposal) {
      return NextResponse.json({ error: "caseId, amount, and proposal are required" }, { status: 400 });
    }

    const foundCase = await prisma.case.findUnique({ where: { id: caseId } });
    if (!foundCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    if (foundCase.status !== "OPEN") {
      return NextResponse.json({ error: "Case is not open for bids" }, { status: 400 });
    }

    const existingBid = await prisma.bid.findFirst({
      where: {
        caseId,
        vendorId: user.id,
      },
    });

    if (existingBid) {
      return NextResponse.json({ error: "You already bid on this case" }, { status: 409 });
    }

    const bid = await prisma.bid.create({
      data: {
        caseId,
        vendorId: user.id,
        amount,
        proposal,
      },
    });

    return NextResponse.json({ success: true, bid });
  } catch (error) {
    console.error("[BID_CREATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
