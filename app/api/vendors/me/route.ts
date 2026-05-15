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

    return NextResponse.json({ success: true, profile: { ...profile, walletAddress: user.walletAddress } });
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

    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const {
      businessName,
      bio,
      specialization,
      experienceYears,
      location,
      phone,
    } = body;

    const parsedExperienceYears =
      experienceYears !== undefined
        ? Number(experienceYears)
        : undefined;

    if (
      parsedExperienceYears !== undefined &&
      Number.isNaN(parsedExperienceYears)
    ) {
      return NextResponse.json(
        { error: "experienceYears must be a valid number" },
        { status: 400 }
      );
    }

    const profile = await prisma.vendorProfile.upsert({
      where: { userId: user.id },
      update: {
        ...(businessName !== undefined && { businessName }),
        ...(bio !== undefined && { bio }),
        ...(specialization !== undefined && { specialization }),
        ...(parsedExperienceYears !== undefined && {
          experienceYears: parsedExperienceYears,
        }),
        ...(location !== undefined && { location }),
        ...(phone !== undefined && { phone }),
      },
      create: {
        userId: user.id,
        businessName: businessName ?? null,
        bio: bio ?? null,
        specialization: specialization ?? null,
        experienceYears:
          parsedExperienceYears !== undefined
            ? parsedExperienceYears
            : null,
        location: location ?? null,
        phone: phone ?? null,
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