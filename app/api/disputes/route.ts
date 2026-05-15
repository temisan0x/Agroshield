import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const disputes = await prisma.dispute.findMany({
      include: {
        case: {
          include: {
            farmer: { select: { email: true } },
            bids: {
              where: { selected: true },
              include: {
                vendor: {
                  select: {
                    email: true,
                    vendorProfile: true,
                  },
                },
              },
            },
            escrow: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, disputes });
  } catch (error) {
    console.error("[DISPUTES_LIST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
