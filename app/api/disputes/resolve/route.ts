import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auth check — must be admin role
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { disputeId, resolutionType, farmerPercent, vendorPercent } = body ?? {};

    if (!disputeId || !resolutionType) {
      return NextResponse.json(
        { error: "disputeId and resolutionType are required" },
        { status: 400 }
      );
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        case: {
          include: {
            escrow: true,
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    if (dispute.status !== "OPEN") {
      return NextResponse.json({ error: "Dispute is already resolved" }, { status: 400 });
    }

    const contractId = dispute.case.escrow?.contractId;
    if (!contractId) {
      return NextResponse.json({ error: "No escrow found for this case" }, { status: 400 });
    }

    if (!["REFUND_FARMER", "RELEASE_VENDOR", "SPLIT"].includes(resolutionType)) {
      return NextResponse.json({ error: "Invalid resolutionType" }, { status: 400 });
    }

    if (resolutionType === "SPLIT") {
      if (typeof farmerPercent !== "number" || typeof vendorPercent !== "number") {
        return NextResponse.json(
          { error: "Farmer and vendor percentages are required for SPLIT" },
          { status: 400 }
        );
      }
      if (farmerPercent + vendorPercent !== 100) {
        return NextResponse.json({ error: "Percentages must sum to 100" }, { status: 400 });
      }
    }

    // Call Trustless Work API
    const twResponse = await fetch("https://dev.api.trustlesswork.com/escrow/resolve-dispute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TRUSTLESS_WORK_API_KEY}`,
      },
      body: JSON.stringify({
        contractId,
        signer: process.env.PLATFORM_RESOLVER_ADDRESS,
        resolution: resolutionType,
        farmerPercent: resolutionType === "SPLIT" ? farmerPercent : undefined,
        vendorPercent: resolutionType === "SPLIT" ? vendorPercent : undefined,
      }),
    });

    const twData = await twResponse.json();

    if (!twResponse.ok) {
      return NextResponse.json(
        { error: twData.error || twData.message || "Trustless Work API error" },
        { status: twResponse.status }
      );
    }

    // Update DB after successful TW call
    await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: "RESOLVED",
        resolvedBy: process.env.PLATFORM_RESOLVER_ADDRESS,
      },
    });

    await prisma.case.update({
      where: { id: dispute.caseId },
      data: { status: "RESOLVED" },
    });

    return NextResponse.json({
      unsignedTransaction: twData.unsignedTransaction,
    });
  } catch (error) {
    console.error("[DISPUTE_RESOLVE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
