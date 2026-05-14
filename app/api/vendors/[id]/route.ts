import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vendor = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        walletAddress: true,
        createdAt: true,
        vendorProfile: true,
        bids: {
          select: {
            id: true,
            amount: true,
            proposal: true,
            selected: true,
            createdAt: true,
            case: {
              select: {
                id: true,
                diagnosis: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    if (vendor.bids.length === 0 && !vendor.vendorProfile) {
      // still return — vendor exists but hasn't set up profile yet
    }

    const stats = {
      totalBids: vendor.bids.length,
      wonBids: vendor.bids.filter((b) => b.selected).length,
      completedTreatments: vendor.bids.filter(
        (b) => b.selected && b.case.status === "COMPLETED"
      ).length,
    };

    return NextResponse.json({ success: true, vendor: { ...vendor, stats } });
  } catch (error) {
    console.error("[VENDOR_PROFILE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}