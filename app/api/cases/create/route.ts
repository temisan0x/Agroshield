import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { imageUrl, diagnosis } = body ?? {};

    if (!imageUrl || !diagnosis) {
      return NextResponse.json({ error: "imageUrl and diagnosis are required" }, { status: 400 });
    }

    const createdCase = await prisma.case.create({
      data: {
        farmerId: user.id,
        imageUrl,
        diagnosis: JSON.stringify(diagnosis),
        status: "OPEN",
      },
    });

    return NextResponse.json({ success: true, case: createdCase });
  } catch (error) {
    console.error("[CASE_CREATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
