import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId } = await params;

    const dispute = await prisma.dispute.findUnique({
      where: { caseId },
    });

    return NextResponse.json({ success: true, dispute });
  } catch (error) {
    console.error("[DISPUTE_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
