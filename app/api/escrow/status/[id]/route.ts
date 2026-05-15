import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEscrow } from "@/lib/trustlesswork";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const escrow = await prisma.escrow.findUnique({
      where: { id },
      include: { transactions: true },
    });

    if (!escrow) {
      return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
    }

    let onChainStatus: unknown = null;
    if (escrow.contractId) {
      try {
        onChainStatus = await getEscrow(escrow.contractId);
      } catch (error) {
        console.error("[ESCROW_STATUS_TW]", error);
        onChainStatus = {
          error: error instanceof Error ? error.message : "Failed to fetch on-chain escrow status",
        };
      }
    }

    return NextResponse.json({ success: true, escrow, onChainStatus });
  } catch (error) {
    console.error("[ESCROW_STATUS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
