import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { generateUsernameFromEmail } from "@/lib/username";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role, walletAddress } = body ?? {};

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const username = await generateUsernameFromEmail(email);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        role,
        walletAddress,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        walletAddress: true,
      },
    });

    const token = await signToken({ userId: user.id, role: user.role });

    return NextResponse.json({ success: true, token, user });
  } catch (error) {
    console.error("[AUTH_REGISTER]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
