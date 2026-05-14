import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { escrowId, contractId } = body ?? {};

    if (!escrowId || !contractId) {
      return NextResponse.json({ error: "escrowId and contractId are required" }, { status: 400 });
    }

    await prisma.escrow.update({
      where: { id: escrowId },
      data: { contractId, status: "FUNDED_PENDING" },
    });

    await prisma.transaction.updateMany({
      where: { escrowId, type: "DEPLOY" },
      data: { signed: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ESCROW_CONFIRM]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
