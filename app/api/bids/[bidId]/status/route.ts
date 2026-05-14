import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type BidAction = "ACCEPT" | "REJECT";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bidId: string }> }
) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "FARMER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { bidId } = await params;
    const body = await request.json();
    const { action } = body ?? {};

    if (!action || !["ACCEPT", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "action must be ACCEPT or REJECT" },
        { status: 400 }
      );
    }

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { case: true },
    });

    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    // only the farmer who owns the case can accept/reject
    if (bid.case.farmerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (bid.case.status !== "OPEN") {
      return NextResponse.json(
        { error: "Case is no longer open for bid actions" },
        { status: 400 }
      );
    }

    if ((action as BidAction) === "ACCEPT") {
      // select this bid and close the case in a transaction
      const [updatedBid] = await prisma.$transaction([
        prisma.bid.update({
          where: { id: bidId },
          data: { selected: true },
        }),
        // reject all other bids on the same case
        prisma.bid.updateMany({
          where: { caseId: bid.caseId, id: { not: bidId } },
          data: { selected: false },
        }),
        prisma.case.update({
          where: { id: bid.caseId },
          data: { status: "IN_PROGRESS" },
        }),
      ]);

      return NextResponse.json({ success: true, bid: updatedBid });
    }

    // REJECT — just mark the bid, case stays OPEN
    const updatedBid = await prisma.bid.update({
      where: { id: bidId },
      data: { selected: false },
    });

    return NextResponse.json({ success: true, bid: updatedBid });
  } catch (error) {
    console.error("[BID_STATUS]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}