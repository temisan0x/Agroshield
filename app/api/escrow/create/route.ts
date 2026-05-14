import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deployEscrow } from "@/lib/trustlesswork";

function parseDiagnosis(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

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
    const { caseId, bidId } = body ?? {};

    if (!caseId || !bidId) {
      return NextResponse.json({ error: "caseId and bidId are required" }, { status: 400 });
    }

    const foundCase = await prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!foundCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    if (foundCase.farmerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { vendor: true },
    });

    if (!bid || bid.caseId !== caseId) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    const farmer = await prisma.user.findUnique({ where: { id: user.id } });
    const vendor = bid.vendor;

    if (!farmer?.walletAddress || !vendor?.walletAddress) {
      return NextResponse.json(
        { error: "Both farmer and vendor need Stellar wallet addresses" },
        { status: 400 }
      );
    }

    await prisma.bid.update({
      where: { id: bid.id },
      data: { selected: true },
    });

    await prisma.case.update({
      where: { id: caseId },
      data: { status: "IN_PROGRESS" },
    });

    const diagnosis = parseDiagnosis(foundCase.diagnosis);
    const diseaseName = diagnosis?.disease ?? "Crop Treatment";

    let deployResponse: { unsignedTransaction?: string } = {};
    try {
      deployResponse = await deployEscrow({
        engagementId: caseId,
        title: `AgroShield: ${diseaseName}`,
        description: `Crop treatment escrow for ${diseaseName}`,
        approver: farmer.walletAddress,
        serviceProvider: vendor.walletAddress,
        releaseSigner: farmer.walletAddress,
        receiver: vendor.walletAddress,
        platformAddress: process.env.PLATFORM_WALLET_ADDRESS ?? "GDEMO...placeholder",
        disputeResolver: process.env.PLATFORM_WALLET_ADDRESS ?? "GDEMO...placeholder",
        amount: bid.amount.toString(),
        platformFee: "1",
        milestones: [
          {
            description: "Treatment delivered and confirmed",
            amount: bid.amount.toString(),
          },
        ],
      });
    } catch (error) {
      console.error("[ESCROW_DEPLOY]", error);
      deployResponse = { unsignedTransaction: "DEMO_XDR_UNSIGNED" };
    }

    const escrow = await prisma.escrow.create({
      data: {
        caseId,
        contractId: null,
        status: "AWAITING_SIGNATURE",
        amount: bid.amount,
      },
    });

    await prisma.transaction.create({
      data: {
        escrowId: escrow.id,
        xdr: deployResponse.unsignedTransaction ?? "DEMO_XDR_UNSIGNED",
        type: "DEPLOY",
        signed: false,
      },
    });

    return NextResponse.json({
      success: true,
      unsignedTransaction: deployResponse.unsignedTransaction ?? "DEMO_XDR_UNSIGNED",
      escrowId: escrow.id,
    });
  } catch (error) {
    console.error("[ESCROW_CREATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
