import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CaseListEntry = Awaited<ReturnType<typeof prisma.case.findMany>>[number];

function parseDiagnosis(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const cases = await prisma.case.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      include: {
        _count: { select: { bids: true } },
        farmer: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = cases.map((entry: CaseListEntry) => ({
      ...entry,
      diagnosis: parseDiagnosis(entry.diagnosis),
    }));

    return NextResponse.json({ success: true, cases: formatted });
  } catch (error) {
    console.error("[CASES_LIST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
