import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const walletAddress = typeof body?.walletAddress === "string" ? body.walletAddress.trim() : null;

    if (walletAddress && walletAddress.length === 0) {
      return NextResponse.json({ error: "Wallet address cannot be empty" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { walletAddress },
      select: {
        id: true,
        walletAddress: true,
      },
    });

    return NextResponse.json({ success: true, walletAddress: updated.walletAddress });
  } catch (error) {
    console.error("[PROFILE_WALLET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}