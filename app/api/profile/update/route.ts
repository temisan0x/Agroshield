import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateUsernameFromEmail } from "@/lib/username";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const usernameInput = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
    const walletAddress =
      typeof body?.walletAddress === "string" ? body.walletAddress.trim() : undefined;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }

    if (usernameInput && !/^[a-z0-9_]{3,24}$/.test(usernameInput)) {
      return NextResponse.json(
        { error: "Username must be 3-24 characters and contain only lowercase letters, numbers, or underscores" },
        { status: 400 }
      );
    }

    if (walletAddress !== undefined && walletAddress.length === 0) {
      return NextResponse.json({ error: "Wallet address cannot be empty" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
    }

    const nextUsername =
      usernameInput ||
      user.username ||
      (await generateUsernameFromEmail(email));

    if (nextUsername) {
      const existingUsername = await prisma.user.findUnique({ where: { username: nextUsername } });
      if (existingUsername && existingUsername.id !== user.id) {
        return NextResponse.json({ error: "Username is already in use" }, { status: 409 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        email,
        ...(nextUsername ? { username: nextUsername } : {}),
        ...(walletAddress === undefined ? {} : { walletAddress }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        walletAddress: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("[PROFILE_UPDATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
