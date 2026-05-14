import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "VENDOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("[VENDOR_ME_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "VENDOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { businessName, bio, specialization, experienceYears, location, phone } =
      body ?? {};

    // upsert — creates profile if first time, updates if exists
    const profile = await prisma.vendorProfile.upsert({
      where: { userId: user.id },
      update: {
        ...(businessName !== undefined && { businessName }),
        ...(bio !== undefined && { bio }),
        ...(specialization !== undefined && { specialization }),
        ...(experienceYears !== undefined && { experienceYears: Number(experienceYears) }),
        ...(location !== undefined && { location }),
        ...(phone !== undefined && { phone }),
      },
      create: {
        userId: user.id,
        businessName,
        bio,
        specialization,
        experienceYears: experienceYears ? Number(experienceYears) : null,
        location,
        phone,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("[VENDOR_ME_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}